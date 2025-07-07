#!/bin/bash

# VASP Legal Assistant Database Restoration Script
# This script handles restoration for both development (SQLite) and production (PostgreSQL) databases

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)" pwd)"
BACKUP_DIR="$PROJECT_ROOT/backups"

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

# Load environment variables
load_env() {
    if [ -f "$PROJECT_ROOT/.env" ]; then
        source "$PROJECT_ROOT/.env"
    fi
    
    if [ -f "$PROJECT_ROOT/github-deployment/backend/.env" ]; then
        source "$PROJECT_ROOT/github-deployment/backend/.env"
    fi
}

# List available backups
list_backups() {
    local db_type="$1"
    
    log "Available $db_type backups:"
    
    case "$db_type" in
        "sqlite")
            if [ -d "$BACKUP_DIR/sqlite" ]; then
                ls -la "$BACKUP_DIR/sqlite"/*.gz 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' | column -t
            else
                warning "No SQLite backups found"
            fi
            ;;
        "postgresql")
            if [ -d "$BACKUP_DIR/postgresql" ]; then
                ls -la "$BACKUP_DIR/postgresql"/*.gz 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' | column -t
            else
                warning "No PostgreSQL backups found"
            fi
            ;;
        *)
            error "Unknown database type: $db_type"
            return 1
            ;;
    esac
}

# Confirm action with user
confirm_action() {
    local action="$1"
    local target="$2"
    
    warning "⚠️  WARNING: This will $action the current database!"
    warning "Target: $target"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirmation
    
    case "$confirmation" in
        yes|YES)
            return 0
            ;;
        *)
            log "Operation cancelled by user"
            exit 0
            ;;
    esac
}

# Create backup of current database before restoration
backup_current() {
    local db_type="$1"
    
    log "Creating backup of current database before restoration..."
    
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_script="$SCRIPT_DIR/backup-database.sh"
    
    if [ -f "$backup_script" ]; then
        case "$db_type" in
            "sqlite")
                "$backup_script" --sqlite-only
                ;;
            "postgresql")
                "$backup_script" --postgres-only
                ;;
        esac
        success "Current database backed up"
    else
        warning "Backup script not found, proceeding without backup"
    fi
}

# Restore SQLite database
restore_sqlite() {
    local backup_file="$1"
    local create_backup="${2:-true}"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    local sqlite_db="$PROJECT_ROOT/prisma/vasp.db"
    
    # Create backup of current database
    if [ "$create_backup" = "true" ] && [ -f "$sqlite_db" ]; then
        backup_current "sqlite"
    fi
    
    log "Restoring SQLite database from: $backup_file"
    
    # Handle different backup file types
    if [[ "$backup_file" == *.sql.gz ]]; then
        # SQL dump restoration
        log "Restoring from SQL dump..."
        
        # Remove existing database
        if [ -f "$sqlite_db" ]; then
            rm "$sqlite_db"
            log "Removed existing database"
        fi
        
        # Restore from SQL dump
        gunzip -c "$backup_file" | sqlite3 "$sqlite_db"
        
    elif [[ "$backup_file" == *.db.gz ]]; then
        # Database file restoration
        log "Restoring from database file..."
        
        # Remove existing database
        if [ -f "$sqlite_db" ]; then
            rm "$sqlite_db"
            log "Removed existing database"
        fi
        
        # Extract and copy database file
        gunzip -c "$backup_file" > "$sqlite_db"
        
    else
        error "Unsupported backup file format: $backup_file"
        return 1
    fi
    
    # Verify restoration
    if sqlite3 "$sqlite_db" "SELECT COUNT(*) FROM sqlite_master;" > /dev/null 2>&1; then
        success "SQLite database restored successfully"
        
        # Show table count
        local table_count=$(sqlite3 "$sqlite_db" "SELECT COUNT(*) FROM sqlite_master WHERE type='table';")
        log "Database contains $table_count tables"
        
        return 0
    else
        error "Database restoration failed - database is corrupted"
        return 1
    fi
}

# Restore PostgreSQL database
restore_postgresql() {
    local backup_file="$1"
    local create_backup="${2:-true}"
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi
    
    # Create backup of current database
    if [ "$create_backup" = "true" ]; then
        backup_current "postgresql"
    fi
    
    log "Restoring PostgreSQL database from: $backup_file"
    
    # Check if we have database connection info
    if [ -z "$DATABASE_URL" ] && [ -z "$DB_HOST" ]; then
        error "No PostgreSQL connection info found (DATABASE_URL or DB_HOST)"
        return 1
    fi
    
    # Restore database
    if [ -n "$DATABASE_URL" ]; then
        log "Using DATABASE_URL for restoration..."
        
        # Drop and recreate database (WARNING: This removes all data!)
        warning "Dropping existing database contents..."
        
        # Extract database name from URL for recreation
        db_name=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
        
        # Use psql to restore
        gunzip -c "$backup_file" | psql "$DATABASE_URL"
        
    elif [ -n "$DB_HOST" ] && [ -n "$DB_NAME" ] && [ -n "$DB_USER" ]; then
        log "Using individual DB vars for restoration..."
        
        export PGPASSWORD="$DB_PASSWORD"
        
        # Drop existing data and restore
        warning "Dropping existing database contents..."
        
        # Restore from backup
        gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME"
        
        unset PGPASSWORD
    else
        error "Insufficient PostgreSQL connection information"
        return 1
    fi
    
    success "PostgreSQL database restored successfully"
    return 0
}

# Interactive backup selection
select_backup_interactive() {
    local db_type="$1"
    local backup_dir="$BACKUP_DIR/$db_type"
    
    if [ ! -d "$backup_dir" ]; then
        error "No $db_type backup directory found"
        return 1
    fi
    
    # Get list of backup files
    local backups=($(ls -t "$backup_dir"/*.gz 2>/dev/null))
    
    if [ ${#backups[@]} -eq 0 ]; then
        error "No $db_type backups found"
        return 1
    fi
    
    echo ""
    log "Available $db_type backups:"
    echo ""
    
    for i in "${!backups[@]}"; do
        local backup="${backups[$i]}"
        local filename=$(basename "$backup")
        local size=$(ls -lh "$backup" | awk '{print $5}')
        local date=$(ls -l "$backup" | awk '{print $6, $7, $8}')
        
        printf "%2d) %s (%s, %s)\n" $((i+1)) "$filename" "$size" "$date"
    done
    
    echo ""
    read -p "Select backup number (1-${#backups[@]}): " selection
    
    if [[ "$selection" =~ ^[0-9]+$ ]] && [ "$selection" -ge 1 ] && [ "$selection" -le ${#backups[@]} ]; then
        echo "${backups[$((selection-1))]}"
        return 0
    else
        error "Invalid selection"
        return 1
    fi
}

# Show help
show_help() {
    echo "VASP Legal Assistant Database Restoration Script"
    echo ""
    echo "Usage: $0 [options] [backup_file]"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  --list-sqlite           List available SQLite backups"
    echo "  --list-postgresql       List available PostgreSQL backups"
    echo "  --sqlite [backup_file]  Restore SQLite database"
    echo "  --postgresql [backup_file] Restore PostgreSQL database"
    echo "  --interactive           Interactive backup selection"
    echo "  --no-backup             Skip creating backup of current database"
    echo ""
    echo "Examples:"
    echo "  $0 --list-sqlite"
    echo "  $0 --sqlite /path/to/backup.sql.gz"
    echo "  $0 --postgresql --interactive"
    echo "  $0 --sqlite --interactive --no-backup"
    echo ""
}

# Main function
main() {
    local db_type=""
    local backup_file=""
    local interactive=false
    local create_backup=true
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --list-sqlite)
                list_backups "sqlite"
                exit 0
                ;;
            --list-postgresql)
                list_backups "postgresql"
                exit 0
                ;;
            --sqlite)
                db_type="sqlite"
                if [[ $# -gt 1 && ! "$2" =~ ^-- ]]; then
                    backup_file="$2"
                    shift
                fi
                ;;
            --postgresql)
                db_type="postgresql"
                if [[ $# -gt 1 && ! "$2" =~ ^-- ]]; then
                    backup_file="$2"
                    shift
                fi
                ;;
            --interactive)
                interactive=true
                ;;
            --no-backup)
                create_backup=false
                ;;
            *)
                if [ -z "$backup_file" ] && [ -f "$1" ]; then
                    backup_file="$1"
                else
                    error "Unknown option: $1"
                    show_help
                    exit 1
                fi
                ;;
        esac
        shift
    done
    
    # Load environment
    load_env
    
    # Interactive mode
    if [ "$interactive" = true ]; then
        if [ -z "$db_type" ]; then
            echo ""
            echo "Select database type:"
            echo "1) SQLite (development)"
            echo "2) PostgreSQL (production)"
            echo ""
            read -p "Selection (1-2): " db_selection
            
            case "$db_selection" in
                1) db_type="sqlite" ;;
                2) db_type="postgresql" ;;
                *) error "Invalid selection"; exit 1 ;;
            esac
        fi
        
        backup_file=$(select_backup_interactive "$db_type")
        if [ $? -ne 0 ]; then
            exit 1
        fi
    fi
    
    # Validate inputs
    if [ -z "$db_type" ]; then
        error "Database type not specified"
        show_help
        exit 1
    fi
    
    if [ -z "$backup_file" ]; then
        error "Backup file not specified"
        show_help
        exit 1
    fi
    
    # Confirm restoration
    confirm_action "restore" "$backup_file -> $db_type database"
    
    # Perform restoration
    case "$db_type" in
        "sqlite")
            restore_sqlite "$backup_file" "$create_backup"
            ;;
        "postgresql")
            restore_postgresql "$backup_file" "$create_backup"
            ;;
        *)
            error "Unknown database type: $db_type"
            exit 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        success "Database restoration completed successfully!"
        log "Remember to restart your application if it's currently running"
    else
        error "Database restoration failed!"
        exit 1
    fi
}

# Run main function
main "$@"