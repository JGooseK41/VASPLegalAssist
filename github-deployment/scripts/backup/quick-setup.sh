#!/bin/bash

# VASP Legal Assistant Backup System Quick Setup
# This script quickly sets up the backup system with recommended defaults

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)" pwd)"

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

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if scripts exist and are executable
    local scripts=("backup-database.sh" "restore-database.sh" "setup-backup-schedule.sh" "monitor-backups.sh")
    
    for script in "${scripts[@]}"; do
        local script_path="$SCRIPT_DIR/$script"
        if [ ! -f "$script_path" ]; then
            error "Script not found: $script_path"
            return 1
        fi
        
        if [ ! -x "$script_path" ]; then
            log "Making $script executable..."
            chmod +x "$script_path"
        fi
    done
    
    # Check for required commands
    local commands=("gzip" "gunzip")
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error "Required command not found: $cmd"
            return 1
        fi
    done
    
    # Check for SQLite
    if command -v sqlite3 &> /dev/null; then
        success "SQLite found"
    else
        warning "SQLite not found - SQLite backups will not work"
    fi
    
    # Check for PostgreSQL tools
    if command -v pg_dump &> /dev/null && command -v psql &> /dev/null; then
        success "PostgreSQL tools found"
    else
        warning "PostgreSQL tools not found - PostgreSQL backups will not work"
    fi
    
    success "Prerequisites check completed"
}

# Create directory structure
create_directories() {
    log "Creating directory structure..."
    
    local dirs=("$PROJECT_ROOT/backups" "$PROJECT_ROOT/backups/sqlite" "$PROJECT_ROOT/backups/postgresql" "$PROJECT_ROOT/logs" "$PROJECT_ROOT/logs/backup")
    
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            log "Created directory: $dir"
        fi
    done
    
    # Set secure permissions
    chmod 750 "$PROJECT_ROOT/backups"
    chmod 750 "$PROJECT_ROOT/logs/backup"
    
    success "Directory structure created"
}

# Test backup system
test_backup_system() {
    log "Testing backup system..."
    
    # Test backup script help
    if "$SCRIPT_DIR/backup-database.sh" --help > /dev/null 2>&1; then
        success "Backup script test passed"
    else
        error "Backup script test failed"
        return 1
    fi
    
    # Test restore script help
    if "$SCRIPT_DIR/restore-database.sh" --help > /dev/null 2>&1; then
        success "Restore script test passed"
    else
        error "Restore script test failed"
        return 1
    fi
    
    # Test monitoring script
    if "$SCRIPT_DIR/monitor-backups.sh" --help > /dev/null 2>&1; then
        success "Monitoring script test passed"
    else
        error "Monitoring script test failed"
        return 1
    fi
    
    success "Backup system tests passed"
}

# Run initial backup
run_initial_backup() {
    log "Running initial backup to test the system..."
    
    if "$SCRIPT_DIR/backup-database.sh"; then
        success "Initial backup completed successfully"
        
        # Show backup stats
        "$SCRIPT_DIR/monitor-backups.sh" --stats
        
        return 0
    else
        warning "Initial backup failed - this is normal if databases are not set up yet"
        return 1
    fi
}

# Setup backup schedule
setup_schedule() {
    local environment="$1"
    
    log "Setting up backup schedule for $environment environment..."
    
    case "$environment" in
        "development")
            "$SCRIPT_DIR/setup-backup-schedule.sh" --custom "0 2 * * *"  # Daily at 2 AM
            ;;
        "production")
            "$SCRIPT_DIR/setup-backup-schedule.sh" --custom "0 */6 * * *"  # Every 6 hours
            ;;
        *)
            log "Using interactive setup for backup schedule..."
            "$SCRIPT_DIR/setup-backup-schedule.sh" --interactive
            ;;
    esac
}

# Show usage instructions
show_usage_instructions() {
    echo ""
    success "=== VASP Legal Assistant Backup System Setup Complete! ==="
    echo ""
    log "📋 Available Commands:"
    echo ""
    echo "  # Run backups"
    echo "  npm run backup                    # Backup both databases"
    echo "  npm run backup:sqlite             # Backup SQLite only"
    echo "  npm run backup:postgres           # Backup PostgreSQL only"
    echo ""
    echo "  # Monitoring"
    echo "  npm run backup:stats              # Show backup statistics"
    echo "  npm run backup:monitor            # Run health monitoring"
    echo ""
    echo "  # Management"
    echo "  npm run backup:setup              # Setup backup schedule"
    echo "  npm run backup:restore            # Restore from backup"
    echo ""
    echo "  # Direct script usage"
    echo "  ./scripts/backup/backup-database.sh --help"
    echo "  ./scripts/backup/restore-database.sh --help"
    echo "  ./scripts/backup/monitor-backups.sh --help"
    echo ""
    log "📁 Important Directories:"
    echo "  • Backups: $PROJECT_ROOT/backups/"
    echo "  • Logs: $PROJECT_ROOT/logs/backup/"
    echo "  • Scripts: $PROJECT_ROOT/scripts/backup/"
    echo ""
    log "📖 Documentation:"
    echo "  • Read: $PROJECT_ROOT/scripts/backup/README.md"
    echo "  • Config: $PROJECT_ROOT/scripts/backup/backup-config.env"
    echo ""
    log "🔄 Next Steps:"
    echo "  1. Review and customize backup-config.env"
    echo "  2. Set up automated scheduling: npm run backup:setup"
    echo "  3. Test restore procedure: npm run backup:restore"
    echo "  4. Set up monitoring alerts (see README.md)"
    echo ""
    success "Backup system is ready to use!"
}

# Main setup function
main() {
    local environment="${1:-interactive}"
    local skip_schedule="${2:-false}"
    
    echo ""
    log "=== VASP Legal Assistant Backup System Quick Setup ==="
    log "Environment: $environment"
    echo ""
    
    # Run setup steps
    check_prerequisites || exit 1
    create_directories
    test_backup_system || exit 1
    
    # Run initial backup (optional)
    if run_initial_backup; then
        log "Initial backup successful"
    else
        log "Skipping initial backup (databases may not be configured yet)"
    fi
    
    # Setup schedule unless skipped
    if [ "$skip_schedule" != "true" ]; then
        setup_schedule "$environment"
    fi
    
    # Show usage instructions
    show_usage_instructions
}

# Parse command line arguments
case "${1:-}" in
    -h|--help)
        echo "VASP Legal Assistant Backup System Quick Setup"
        echo ""
        echo "Usage: $0 [environment] [options]"
        echo ""
        echo "Environments:"
        echo "  development    Setup for development environment"
        echo "  production     Setup for production environment"
        echo "  interactive    Interactive setup (default)"
        echo ""
        echo "Options:"
        echo "  --skip-schedule    Don't setup automated scheduling"
        echo "  -h, --help         Show this help"
        echo ""
        echo "Examples:"
        echo "  $0                      # Interactive setup"
        echo "  $0 development          # Development setup"
        echo "  $0 production           # Production setup"
        echo "  $0 development --skip-schedule"
        echo ""
        exit 0
        ;;
    --skip-schedule)
        main "interactive" "true"
        ;;
    *)
        if [ "${2:-}" = "--skip-schedule" ]; then
            main "${1:-interactive}" "true"
        else
            main "${1:-interactive}" "false"
        fi
        ;;
esac