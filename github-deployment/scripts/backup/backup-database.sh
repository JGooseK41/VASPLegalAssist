#!/bin/bash

# VASP Legal Assistant Database Backup Script
# This script handles backups for both development (SQLite) and production (PostgreSQL) databases

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)" pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
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

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Load environment variables
load_env() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    fi
    
    if [ -f "$PROJECT_ROOT/github-deployment/backend/.env" ]; then
        source "$PROJECT_ROOT/github-deployment/backend/.env"
    fi
}

# Backup SQLite database (development)
backup_sqlite() {
    log "Starting SQLite backup..."
    
    SQLITE_DB="$PROJECT_ROOT/prisma/vasp.db"
    
    if [ ! -f "$SQLITE_DB" ]; then
        warning "SQLite database not found at $SQLITE_DB"
        return 1
    fi
    
    SQLITE_BACKUP_DIR="$BACKUP_DIR/sqlite"
    mkdir -p "$SQLITE_BACKUP_DIR"
    
    # Create backup filename
    BACKUP_FILE="$SQLITE_BACKUP_DIR/vasp_backup_${DATE}.db"
    DUMP_FILE="$SQLITE_BACKUP_DIR/vasp_dump_${DATE}.sql"
    
    # Copy database file
    cp "$SQLITE_DB" "$BACKUP_FILE"
    
    # Create SQL dump
    sqlite3 "$SQLITE_DB" .dump > "$DUMP_FILE"
    
    # Compress backups
    gzip "$BACKUP_FILE"
    gzip "$DUMP_FILE"
    
    success "SQLite backup completed:"
    success "  - Database copy: ${BACKUP_FILE}.gz"
    success "  - SQL dump: ${DUMP_FILE}.gz"
    
    return 0
}

# Backup PostgreSQL database (production)
backup_postgresql() {
    log "Starting PostgreSQL backup..."
    
    # Check if we have database connection info
    if [ -z "$DATABASE_URL" ] && [ -z "$DB_HOST" ]; then
        warning "No PostgreSQL connection info found (DATABASE_URL or DB_HOST)"
        return 1
    fi
    
    POSTGRES_BACKUP_DIR="$BACKUP_DIR/postgresql"
    mkdir -p "$POSTGRES_BACKUP_DIR"
    
    # Create backup filename
    BACKUP_FILE="$POSTGRES_BACKUP_DIR/vasp_backup_${DATE}.sql"
    
    # Use DATABASE_URL if available, otherwise construct from individual vars
    if [ -n "$DATABASE_URL" ]; then
        log "Using DATABASE_URL for backup..."
        pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
    elif [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
        log "Using individual DB vars for backup..."
        export PGPASSWORD="$DB_PASSWORD"
        pg_dump -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"
        unset PGPASSWORD
    else
        error "Insufficient PostgreSQL connection information"
        return 1
    fi
    
    # Compress backup
    gzip "$BACKUP_FILE"
    
    success "PostgreSQL backup completed: ${BACKUP_FILE}.gz"
    
    return 0
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    # Clean SQLite backups
    if [ -d "$BACKUP_DIR/sqlite" ]; then
        find "$BACKUP_DIR/sqlite" -name "*.gz" -mtime +$RETENTION_DAYS -delete
    fi
    
    # Clean PostgreSQL backups
    if [ -d "$BACKUP_DIR/postgresql" ]; then
        find "$BACKUP_DIR/postgresql" -name "*.gz" -mtime +$RETENTION_DAYS -delete
    fi
    
    success "Cleanup completed"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Check if file is not empty
    if [ ! -s "$backup_file" ]; then
        error "Backup file is empty: $backup_file"
        return 1
    fi
    
    # For gzipped files, test compression integrity
    if [[ "$backup_file" == *.gz ]]; then
        if ! gzip -t "$backup_file"; then
            error "Backup file is corrupted: $backup_file"
            return 1
        fi
    fi
    
    success "Backup verification passed: $backup_file"
    return 0
}

# Send notification (placeholder for future implementation)
send_notification() {
    local status="$1"
    local message="$2"
    
    # TODO: Implement notification system (email, Slack, Discord, etc.)
    log "Notification: [$status] $message"
}

# Main backup function
main() {
    log "=== VASP Legal Assistant Database Backup Started ==="
    log "Backup date: $DATE"
    
    create_backup_dir
    load_env
    
    local sqlite_success=0
    local postgres_success=0
    
    # Backup SQLite (development)
    if backup_sqlite; then
        sqlite_success=1
        
        # Verify SQLite backups
        latest_sqlite_db=$(ls -t "$BACKUP_DIR/sqlite/vasp_backup_${DATE}.db.gz" 2>/dev/null | head -1)
        latest_sqlite_dump=$(ls -t "$BACKUP_DIR/sqlite/vasp_dump_${DATE}.sql.gz" 2>/dev/null | head -1)
        
        if [ -n "$latest_sqlite_db" ]; then
            verify_backup "$latest_sqlite_db"
        fi
        
        if [ -n "$latest_sqlite_dump" ]; then
            verify_backup "$latest_sqlite_dump"
        fi
    fi
    
    # Backup PostgreSQL (production)
    if backup_postgresql; then
        postgres_success=1
        
        # Verify PostgreSQL backup
        latest_postgres=$(ls -t "$BACKUP_DIR/postgresql/vasp_backup_${DATE}.sql.gz" 2>/dev/null | head -1)
        if [ -n "$latest_postgres" ]; then
            verify_backup "$latest_postgres"
        fi
    fi
    
    # Cleanup old backups
    cleanup_old_backups
    
    # Report results
    log "=== Backup Summary ==="
    if [ $sqlite_success -eq 1 ]; then
        success "SQLite backup: SUCCESS"
    else
        warning "SQLite backup: SKIPPED/FAILED"
    fi
    
    if [ $postgres_success -eq 1 ]; then
        success "PostgreSQL backup: SUCCESS"
    else
        warning "PostgreSQL backup: SKIPPED/FAILED"
    fi
    
    # Send notification
    if [ $sqlite_success -eq 1 ] || [ $postgres_success -eq 1 ]; then
        send_notification "SUCCESS" "Database backup completed successfully"
        log "=== Backup Completed Successfully ==="
        exit 0
    else
        send_notification "FAILURE" "All database backups failed"
        error "=== Backup Failed ==="
        exit 1
    fi
}

# Help function
show_help() {
    echo "VASP Legal Assistant Database Backup Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  --sqlite-only  Backup only SQLite database"
    echo "  --postgres-only Backup only PostgreSQL database"
    echo "  --verify-only  Only verify existing backups"
    echo ""
    echo "Environment Variables:"
    echo "  DATABASE_URL   PostgreSQL connection string"
    echo "  DB_HOST        PostgreSQL host"
    echo "  DB_NAME        PostgreSQL database name"
    echo "  DB_USER        PostgreSQL username"
    echo "  DB_PASSWORD    PostgreSQL password"
    echo "  DB_PORT        PostgreSQL port (default: 5432)"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --sqlite-only)
        log "Running SQLite backup only..."
        create_backup_dir
        load_env
        backup_sqlite
        exit $?
        ;;
    --postgres-only)
        log "Running PostgreSQL backup only..."
        create_backup_dir
        load_env
        backup_postgresql
        exit $?
        ;;
    --verify-only)
        log "Verifying existing backups..."
        create_backup_dir
        # Verify latest backups
        latest_sqlite=$(ls -t "$BACKUP_DIR/sqlite"/*.gz 2>/dev/null | head -1)
        latest_postgres=$(ls -t "$BACKUP_DIR/postgresql"/*.gz 2>/dev/null | head -1)
        
        if [ -n "$latest_sqlite" ]; then
            verify_backup "$latest_sqlite"
        fi
        
        if [ -n "$latest_postgres" ]; then
            verify_backup "$latest_postgres"
        fi
        exit 0
        ;;
    "")
        main
        ;;
    *)
        error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac