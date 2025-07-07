#!/bin/bash

# VASP Legal Assistant Backup Monitoring and Verification Script
# This script monitors backup health, verifies integrity, and sends alerts

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)" pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
LOG_DIR="$PROJECT_ROOT/logs/backup"
ALERT_THRESHOLD_HOURS=26  # Alert if backup is older than 26 hours
RETENTION_DAYS=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create monitoring log
create_log_entry() {
    local status="$1"
    local message="$2"
    local log_file="$LOG_DIR/monitor-$(date +%Y%m).log"
    
    mkdir -p "$LOG_DIR"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] [$status] $message" >> "$log_file"
}

# Check if backup directory exists
check_backup_directory() {
    if [ ! -d "$BACKUP_DIR" ]; then
        error "Backup directory not found: $BACKUP_DIR"
        create_log_entry "ERROR" "Backup directory not found: $BACKUP_DIR"
        return 1
    fi
    
    log "Backup directory found: $BACKUP_DIR"
    return 0
}

# Get latest backup file for a database type
get_latest_backup() {
    local db_type="$1"
    local backup_subdir="$BACKUP_DIR/$db_type"
    
    if [ ! -d "$backup_subdir" ]; then
        return 1
    fi
    
    local latest_backup=$(ls -t "$backup_subdir"/*.gz 2>/dev/null | head -1)
    
    if [ -n "$latest_backup" ]; then
        echo "$latest_backup"
        return 0
    fi
    
    return 1
}

# Check backup age
check_backup_age() {
    local backup_file="$1"
    local db_type="$2"
    
    if [ ! -f "$backup_file" ]; then
        error "$db_type: No backup file found"
        create_log_entry "ERROR" "$db_type: No backup file found"
        return 1
    fi
    
    local backup_timestamp=$(stat -c %Y "$backup_file" 2>/dev/null || stat -f %m "$backup_file" 2>/dev/null)
    local current_timestamp=$(date +%s)
    local age_hours=$(( (current_timestamp - backup_timestamp) / 3600 ))
    
    log "$db_type: Latest backup is $age_hours hours old"
    
    if [ $age_hours -gt $ALERT_THRESHOLD_HOURS ]; then
        warning "$db_type: Backup is older than $ALERT_THRESHOLD_HOURS hours!"
        create_log_entry "WARNING" "$db_type: Backup age $age_hours hours exceeds threshold"
        return 1
    else
        success "$db_type: Backup age is acceptable ($age_hours hours)"
        create_log_entry "SUCCESS" "$db_type: Backup age $age_hours hours is within threshold"
        return 0
    fi
}

# Verify backup integrity
verify_backup_integrity() {
    local backup_file="$1"
    local db_type="$2"
    
    log "Verifying $db_type backup integrity: $(basename "$backup_file")"
    
    # Check if file exists and is not empty
    if [ ! -f "$backup_file" ]; then
        error "$db_type: Backup file not found"
        create_log_entry "ERROR" "$db_type: Backup file not found: $backup_file"
        return 1
    fi
    
    if [ ! -s "$backup_file" ]; then
        error "$db_type: Backup file is empty"
        create_log_entry "ERROR" "$db_type: Backup file is empty: $backup_file"
        return 1
    fi
    
    # Test gzip integrity
    if [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file" 2>/dev/null; then
            error "$db_type: Backup file is corrupted (gzip test failed)"
            create_log_entry "ERROR" "$db_type: Backup file corrupted: $backup_file"
            return 1
        fi
    fi
    
    # Additional verification for SQL dumps
    if [[ "$backup_file" == *.sql.gz ]]; then
        # Check if the decompressed content looks like valid SQL
        local sql_check=$(gunzip -c "$backup_file" 2>/dev/null | head -10 | grep -i -E "(CREATE|INSERT|SELECT|PRAGMA)" | wc -l)
        
        if [ $sql_check -eq 0 ]; then
            warning "$db_type: Backup file may not contain valid SQL"
            create_log_entry "WARNING" "$db_type: Backup file may not contain valid SQL: $backup_file"
            return 1
        fi
    fi
    
    success "$db_type: Backup integrity verified"
    create_log_entry "SUCCESS" "$db_type: Backup integrity verified: $backup_file"
    return 0
}

# Check backup size
check_backup_size() {
    local backup_file="$1"
    local db_type="$2"
    local min_size_kb=1  # Minimum size in KB
    
    local size_bytes=$(stat -c %s "$backup_file" 2>/dev/null || stat -f %z "$backup_file" 2>/dev/null)
    local size_kb=$((size_bytes / 1024))
    local size_mb=$((size_kb / 1024))
    
    log "$db_type: Backup size is ${size_kb}KB (${size_mb}MB)"
    
    if [ $size_kb -lt $min_size_kb ]; then
        warning "$db_type: Backup size is suspiciously small (${size_kb}KB)"
        create_log_entry "WARNING" "$db_type: Small backup size: ${size_kb}KB"
        return 1
    else
        success "$db_type: Backup size is acceptable (${size_kb}KB)"
        create_log_entry "SUCCESS" "$db_type: Backup size acceptable: ${size_kb}KB"
        return 0
    fi
}

# Count backup files and check retention
check_backup_retention() {
    local db_type="$1"
    local backup_subdir="$BACKUP_DIR/$db_type"
    
    if [ ! -d "$backup_subdir" ]; then
        return 0
    fi
    
    local total_backups=$(ls "$backup_subdir"/*.gz 2>/dev/null | wc -l)
    local old_backups=$(find "$backup_subdir" -name "*.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)
    
    log "$db_type: Total backups: $total_backups, Old backups (>$RETENTION_DAYS days): $old_backups"
    
    if [ $total_backups -eq 0 ]; then
        warning "$db_type: No backups found"
        create_log_entry "WARNING" "$db_type: No backups found"
        return 1
    fi
    
    if [ $old_backups -gt 0 ]; then
        log "$db_type: Found $old_backups old backups for cleanup"
        create_log_entry "INFO" "$db_type: $old_backups old backups found for cleanup"
    fi
    
    success "$db_type: Backup retention check passed"
    create_log_entry "SUCCESS" "$db_type: Backup retention check passed"
    return 0
}

# Generate backup report
generate_report() {
    local report_file="$LOG_DIR/backup-report-$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "VASP Legal Assistant Backup Health Report"
        echo "Generated: $(date)"
        echo "=================================================="
        echo ""
        
        # SQLite backup status
        echo "SQLite Database (Development):"
        echo "------------------------------"
        
        local sqlite_backup=$(get_latest_backup "sqlite" 2>/dev/null)
        if [ -n "$sqlite_backup" ]; then
            echo "Latest backup: $(basename "$sqlite_backup")"
            echo "Backup date: $(ls -l "$sqlite_backup" | awk '{print $6, $7, $8}')"
            echo "Backup size: $(ls -lh "$sqlite_backup" | awk '{print $5}')"
            
            local sqlite_timestamp=$(stat -c %Y "$sqlite_backup" 2>/dev/null || stat -f %m "$sqlite_backup" 2>/dev/null)
            local current_timestamp=$(date +%s)
            local sqlite_age_hours=$(( (current_timestamp - sqlite_timestamp) / 3600 ))
            echo "Age: $sqlite_age_hours hours"
            
            if [ $sqlite_age_hours -le $ALERT_THRESHOLD_HOURS ]; then
                echo "Status: ✅ HEALTHY"
            else
                echo "Status: ⚠️  OLD BACKUP"
            fi
        else
            echo "Status: ❌ NO BACKUPS FOUND"
        fi
        
        echo ""
        
        # PostgreSQL backup status
        echo "PostgreSQL Database (Production):"
        echo "---------------------------------"
        
        local postgres_backup=$(get_latest_backup "postgresql" 2>/dev/null)
        if [ -n "$postgres_backup" ]; then
            echo "Latest backup: $(basename "$postgres_backup")"
            echo "Backup date: $(ls -l "$postgres_backup" | awk '{print $6, $7, $8}')"
            echo "Backup size: $(ls -lh "$postgres_backup" | awk '{print $5}')"
            
            local postgres_timestamp=$(stat -c %Y "$postgres_backup" 2>/dev/null || stat -f %m "$postgres_backup" 2>/dev/null)
            local postgres_age_hours=$(( (current_timestamp - postgres_timestamp) / 3600 ))
            echo "Age: $postgres_age_hours hours"
            
            if [ $postgres_age_hours -le $ALERT_THRESHOLD_HOURS ]; then
                echo "Status: ✅ HEALTHY"
            else
                echo "Status: ⚠️  OLD BACKUP"
            fi
        else
            echo "Status: ❌ NO BACKUPS FOUND"
        fi
        
        echo ""
        echo "=================================================="
        echo "Report saved to: $report_file"
        
    } | tee "$report_file"
    
    success "Backup report generated: $report_file"
}

# Send alert (placeholder for future implementation)
send_alert() {
    local level="$1"
    local message="$2"
    
    # TODO: Implement actual alerting (email, Slack, webhook, etc.)
    
    case "$level" in
        "critical")
            error "CRITICAL ALERT: $message"
            ;;
        "warning")
            warning "WARNING ALERT: $message"
            ;;
        "info")
            log "INFO ALERT: $message"
            ;;
    esac
    
    create_log_entry "ALERT_${level^^}" "$message"
}

# Monitor single database type
monitor_database() {
    local db_type="$1"
    local status=0
    
    log "Monitoring $db_type database backups..."
    
    local latest_backup=$(get_latest_backup "$db_type")
    
    if [ -z "$latest_backup" ]; then
        send_alert "critical" "$db_type: No backups found"
        return 1
    fi
    
    # Check backup age
    if ! check_backup_age "$latest_backup" "$db_type"; then
        send_alert "warning" "$db_type: Backup is too old"
        status=1
    fi
    
    # Verify backup integrity
    if ! verify_backup_integrity "$latest_backup" "$db_type"; then
        send_alert "critical" "$db_type: Backup integrity check failed"
        status=1
    fi
    
    # Check backup size
    if ! check_backup_size "$latest_backup" "$db_type"; then
        send_alert "warning" "$db_type: Backup size is suspicious"
        status=1
    fi
    
    # Check retention
    if ! check_backup_retention "$db_type"; then
        send_alert "info" "$db_type: Backup retention issues detected"
    fi
    
    return $status
}

# Comprehensive monitoring
monitor_all() {
    log "=== VASP Legal Assistant Backup Monitoring Started ==="
    
    local overall_status=0
    
    # Check backup directory
    if ! check_backup_directory; then
        send_alert "critical" "Backup directory not accessible"
        return 1
    fi
    
    # Monitor SQLite backups
    if ! monitor_database "sqlite"; then
        overall_status=1
    fi
    
    # Monitor PostgreSQL backups
    if ! monitor_database "postgresql"; then
        overall_status=1
    fi
    
    # Generate report
    generate_report
    
    if [ $overall_status -eq 0 ]; then
        success "All backup health checks passed"
        send_alert "info" "Backup monitoring completed successfully"
    else
        warning "Some backup health checks failed"
        send_alert "warning" "Backup monitoring detected issues"
    fi
    
    log "=== Backup Monitoring Completed ==="
    return $overall_status
}

# Show backup statistics
show_stats() {
    log "=== Backup Statistics ==="
    
    for db_type in "sqlite" "postgresql"; do
        local backup_subdir="$BACKUP_DIR/$db_type"
        
        if [ -d "$backup_subdir" ]; then
            local count=$(ls "$backup_subdir"/*.gz 2>/dev/null | wc -l)
            local total_size=$(du -sh "$backup_subdir" 2>/dev/null | cut -f1)
            local latest=$(get_latest_backup "$db_type" 2>/dev/null)
            
            echo ""
            log "$db_type Database:"
            echo "  Total backups: $count"
            echo "  Total size: $total_size"
            
            if [ -n "$latest" ]; then
                echo "  Latest backup: $(basename "$latest")"
                echo "  Latest backup size: $(ls -lh "$latest" | awk '{print $5}')"
                
                local timestamp=$(stat -c %Y "$latest" 2>/dev/null || stat -f %m "$latest" 2>/dev/null)
                local age_hours=$(( ($(date +%s) - timestamp) / 3600 ))
                echo "  Age: $age_hours hours"
            else
                echo "  Latest backup: None"
            fi
        else
            log "$db_type Database: No backup directory found"
        fi
    done
    
    echo ""
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local cleaned_count=0
    
    for db_type in "sqlite" "postgresql"; do
        local backup_subdir="$BACKUP_DIR/$db_type"
        
        if [ -d "$backup_subdir" ]; then
            local old_files=$(find "$backup_subdir" -name "*.gz" -mtime +$RETENTION_DAYS 2>/dev/null)
            
            if [ -n "$old_files" ]; then
                echo "$old_files" | while read -r file; do
                    if [ -f "$file" ]; then
                        log "Removing old backup: $(basename "$file")"
                        rm "$file"
                        cleaned_count=$((cleaned_count + 1))
                    fi
                done
            fi
        fi
    done
    
    success "Cleanup completed. Removed backups older than $RETENTION_DAYS days."
    create_log_entry "SUCCESS" "Cleanup completed. Removed old backups."
}

# Show help
show_help() {
    echo "VASP Legal Assistant Backup Monitoring Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help message"
    echo "  --monitor        Run comprehensive backup monitoring (default)"
    echo "  --sqlite         Monitor only SQLite backups"
    echo "  --postgresql     Monitor only PostgreSQL backups"
    echo "  --report         Generate backup health report"
    echo "  --stats          Show backup statistics"
    echo "  --cleanup        Clean up old backups"
    echo "  --verify FILE    Verify specific backup file integrity"
    echo ""
    echo "Examples:"
    echo "  $0 --monitor"
    echo "  $0 --stats"
    echo "  $0 --verify /path/to/backup.sql.gz"
    echo ""
}

# Main function
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        --monitor|"")
            monitor_all
            exit $?
            ;;
        --sqlite)
            monitor_database "sqlite"
            exit $?
            ;;
        --postgresql)
            monitor_database "postgresql"
            exit $?
            ;;
        --report)
            check_backup_directory
            generate_report
            exit 0
            ;;
        --stats)
            check_backup_directory
            show_stats
            exit 0
            ;;
        --cleanup)
            check_backup_directory
            cleanup_old_backups
            exit 0
            ;;
        --verify)
            if [ -z "$2" ]; then
                error "Backup file not specified"
                show_help
                exit 1
            fi
            
            if [[ "$2" == *sqlite* ]]; then
                verify_backup_integrity "$2" "sqlite"
            elif [[ "$2" == *postgresql* ]]; then
                verify_backup_integrity "$2" "postgresql"
            else
                # Auto-detect based on path
                if [[ "$2" == */sqlite/* ]]; then
                    verify_backup_integrity "$2" "sqlite"
                elif [[ "$2" == */postgresql/* ]]; then
                    verify_backup_integrity "$2" "postgresql"
                else
                    verify_backup_integrity "$2" "unknown"
                fi
            fi
            exit $?
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"