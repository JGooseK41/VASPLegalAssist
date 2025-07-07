#!/bin/bash

# VASP Legal Assistant Backup Scheduling Setup Script
# This script sets up automated backup scheduling using cron

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)" pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-database.sh"

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

# Check if cron is available
check_cron() {
    if ! command -v crontab &> /dev/null; then
        error "crontab command not found. Please install cron."
        exit 1
    fi
    
    log "Cron is available"
}

# Create log directory for backup logs
setup_log_directory() {
    local log_dir="$PROJECT_ROOT/logs/backup"
    
    if [ ! -d "$log_dir" ]; then
        mkdir -p "$log_dir"
        log "Created backup log directory: $log_dir"
    fi
}

# Generate cron job entry
generate_cron_entry() {
    local schedule="$1"
    local log_file="$PROJECT_ROOT/logs/backup/backup-$(date +%Y%m).log"
    
    echo "$schedule cd $PROJECT_ROOT && $BACKUP_SCRIPT >> $log_file 2>&1"
}

# Add cron job
add_cron_job() {
    local schedule="$1"
    local description="$2"
    
    log "Setting up $description backup schedule..."
    
    # Get current crontab
    local temp_cron=$(mktemp)
    crontab -l 2>/dev/null > "$temp_cron" || true
    
    # Check if backup job already exists
    if grep -q "backup-database.sh" "$temp_cron"; then
        warning "Backup job already exists in crontab"
        read -p "Do you want to replace it? (y/n): " replace
        if [[ "$replace" =~ ^[Yy] ]]; then
            # Remove existing backup jobs
            grep -v "backup-database.sh" "$temp_cron" > "${temp_cron}.new"
            mv "${temp_cron}.new" "$temp_cron"
        else
            rm "$temp_cron"
            log "Keeping existing cron job"
            return 0
        fi
    fi
    
    # Add new backup job
    echo "# VASP Legal Assistant Database Backup - $description" >> "$temp_cron"
    generate_cron_entry "$schedule" >> "$temp_cron"
    echo "" >> "$temp_cron"
    
    # Install new crontab
    crontab "$temp_cron"
    rm "$temp_cron"
    
    success "$description backup job added to crontab"
}

# Remove cron job
remove_cron_job() {
    log "Removing backup cron jobs..."
    
    local temp_cron=$(mktemp)
    crontab -l 2>/dev/null > "$temp_cron" || true
    
    # Remove backup-related cron jobs
    grep -v "backup-database.sh\|VASP Legal Assistant Database Backup" "$temp_cron" > "${temp_cron}.new" || true
    mv "${temp_cron}.new" "$temp_cron"
    
    # Install cleaned crontab
    crontab "$temp_cron"
    rm "$temp_cron"
    
    success "Backup cron jobs removed"
}

# Show current cron jobs
show_cron_jobs() {
    log "Current cron jobs:"
    echo ""
    crontab -l 2>/dev/null || echo "No cron jobs found"
    echo ""
}

# Interactive setup
interactive_setup() {
    echo ""
    log "=== VASP Legal Assistant Backup Scheduler ==="
    echo ""
    echo "Select backup frequency:"
    echo ""
    echo "1) Daily at 2:00 AM"
    echo "2) Daily at 3:00 AM (recommended for production)"
    echo "3) Every 6 hours"
    echo "4) Every 12 hours"
    echo "5) Weekly (Sunday at 2:00 AM)"
    echo "6) Custom schedule"
    echo "7) Remove existing backup schedule"
    echo "8) Show current cron jobs"
    echo ""
    read -p "Select option (1-8): " option
    
    case "$option" in
        1)
            add_cron_job "0 2 * * *" "Daily (2:00 AM)"
            ;;
        2)
            add_cron_job "0 3 * * *" "Daily (3:00 AM)"
            ;;
        3)
            add_cron_job "0 */6 * * *" "Every 6 hours"
            ;;
        4)
            add_cron_job "0 */12 * * *" "Every 12 hours"
            ;;
        5)
            add_cron_job "0 2 * * 0" "Weekly (Sunday 2:00 AM)"
            ;;
        6)
            echo ""
            echo "Enter custom cron schedule (e.g., '0 2 * * *' for daily at 2 AM):"
            echo "Format: minute hour day month weekday"
            echo ""
            read -p "Cron schedule: " custom_schedule
            
            if [ -n "$custom_schedule" ]; then
                add_cron_job "$custom_schedule" "Custom"
            else
                error "No schedule provided"
            fi
            ;;
        7)
            remove_cron_job
            ;;
        8)
            show_cron_jobs
            ;;
        *)
            error "Invalid option"
            exit 1
            ;;
    esac
}

# Setup systemd timer (alternative to cron)
setup_systemd_timer() {
    log "Setting up systemd timer for backup..."
    
    # Check if systemd is available
    if ! command -v systemctl &> /dev/null; then
        error "systemctl not found. systemd is not available."
        return 1
    fi
    
    local service_file="/etc/systemd/system/vasp-backup.service"
    local timer_file="/etc/systemd/system/vasp-backup.timer"
    
    # Create service file
    sudo tee "$service_file" > /dev/null <<EOF
[Unit]
Description=VASP Legal Assistant Database Backup
After=network.target

[Service]
Type=oneshot
User=$(whoami)
WorkingDirectory=$PROJECT_ROOT
ExecStart=$BACKUP_SCRIPT
StandardOutput=append:$PROJECT_ROOT/logs/backup/backup-systemd.log
StandardError=append:$PROJECT_ROOT/logs/backup/backup-systemd.log

[Install]
WantedBy=multi-user.target
EOF

    # Create timer file
    sudo tee "$timer_file" > /dev/null <<EOF
[Unit]
Description=Run VASP database backup daily
Requires=vasp-backup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

    # Reload systemd and enable timer
    sudo systemctl daemon-reload
    sudo systemctl enable vasp-backup.timer
    sudo systemctl start vasp-backup.timer
    
    success "Systemd timer setup complete"
    log "Timer status:"
    systemctl status vasp-backup.timer --no-pager
}

# Validate backup script
validate_backup_script() {
    if [ ! -f "$BACKUP_SCRIPT" ]; then
        error "Backup script not found: $BACKUP_SCRIPT"
        exit 1
    fi
    
    if [ ! -x "$BACKUP_SCRIPT" ]; then
        error "Backup script is not executable: $BACKUP_SCRIPT"
        exit 1
    fi
    
    log "Backup script validation passed"
}

# Test backup script
test_backup_script() {
    log "Testing backup script..."
    
    if "$BACKUP_SCRIPT" --help > /dev/null 2>&1; then
        success "Backup script test passed"
    else
        error "Backup script test failed"
        exit 1
    fi
}

# Show help
show_help() {
    echo "VASP Legal Assistant Backup Scheduling Setup"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -i, --interactive   Interactive setup"
    echo "  --daily             Set up daily backup at 3 AM"
    echo "  --hourly            Set up backup every 6 hours"
    echo "  --weekly            Set up weekly backup on Sunday at 2 AM"
    echo "  --custom SCHEDULE   Set up custom cron schedule"
    echo "  --remove            Remove existing backup schedule"
    echo "  --show              Show current cron jobs"
    echo "  --systemd           Set up systemd timer instead of cron"
    echo "  --test              Test backup script"
    echo ""
    echo "Examples:"
    echo "  $0 --interactive"
    echo "  $0 --daily"
    echo "  $0 --custom '0 */4 * * *'"
    echo "  $0 --systemd"
    echo ""
}

# Main function
main() {
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        -i|--interactive)
            check_cron
            validate_backup_script
            setup_log_directory
            interactive_setup
            ;;
        --daily)
            check_cron
            validate_backup_script
            setup_log_directory
            add_cron_job "0 3 * * *" "Daily (3:00 AM)"
            ;;
        --hourly)
            check_cron
            validate_backup_script
            setup_log_directory
            add_cron_job "0 */6 * * *" "Every 6 hours"
            ;;
        --weekly)
            check_cron
            validate_backup_script
            setup_log_directory
            add_cron_job "0 2 * * 0" "Weekly (Sunday 2:00 AM)"
            ;;
        --custom)
            if [ -z "$2" ]; then
                error "Custom schedule not provided"
                show_help
                exit 1
            fi
            check_cron
            validate_backup_script
            setup_log_directory
            add_cron_job "$2" "Custom"
            ;;
        --remove)
            check_cron
            remove_cron_job
            ;;
        --show)
            show_cron_jobs
            ;;
        --systemd)
            validate_backup_script
            setup_log_directory
            setup_systemd_timer
            ;;
        --test)
            validate_backup_script
            test_backup_script
            ;;
        "")
            log "No option provided. Use --help for usage information."
            show_help
            exit 1
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