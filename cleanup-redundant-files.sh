#!/bin/bash

# VASP Legal Assistant - Safe Cleanup Script
# This script backs up and removes redundant files outside github-deployment

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"
BACKUP_DIR="$PROJECT_ROOT/cleanup-backup-$(date +%Y%m%d_%H%M%S)"

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

# Create backup directory
create_backup() {
    log "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    
    # Create backup info file
    cat > "$BACKUP_DIR/backup-info.txt" <<EOF
VASP Legal Assistant Cleanup Backup
Date: $(date)
Purpose: Backup of files before cleanup of redundant code outside github-deployment
EOF
}

# Backup important database file
backup_database() {
    log "Backing up SQLite database..."
    
    if [ -f "$PROJECT_ROOT/prisma/vasp.db" ]; then
        mkdir -p "$BACKUP_DIR/prisma"
        cp "$PROJECT_ROOT/prisma/vasp.db" "$BACKUP_DIR/prisma/"
        success "Database backed up to: $BACKUP_DIR/prisma/vasp.db"
    else
        warning "No SQLite database found to backup"
    fi
}

# Backup files before deletion
backup_files() {
    log "Backing up files to be deleted..."
    
    # List of items to backup
    local items=(
        "backend"
        "src" 
        "public"
        "controllers"
        "routes"
        "middleware"
        "services"
        "server.js"
        "package.json"
        "package-lock.json"
        "netlify.toml"
        "render.yaml"
        "vercel.json"
        "postcss.config.js"
        "tailwind.config.js"
    )
    
    for item in "${items[@]}"; do
        if [ -e "$PROJECT_ROOT/$item" ]; then
            log "Backing up: $item"
            cp -r "$PROJECT_ROOT/$item" "$BACKUP_DIR/" 2>/dev/null || true
        fi
    done
    
    success "Files backed up to: $BACKUP_DIR"
}

# Check for unique scripts in root package.json
check_unique_scripts() {
    log "Checking for unique scripts in root package.json..."
    
    if [ -f "$PROJECT_ROOT/package.json" ] && [ -f "$PROJECT_ROOT/github-deployment/package.json" ]; then
        warning "Found both package.json files. Please review for unique scripts:"
        echo ""
        echo "Root package.json scripts:"
        grep -A 20 '"scripts"' "$PROJECT_ROOT/package.json" | grep -B 20 "}" | head -n 20
        echo ""
        echo "Backup scripts are already in root package.json - these will be preserved in github-deployment"
    fi
}

# Delete redundant files
delete_redundant_files() {
    log "Starting cleanup of redundant files..."
    
    # Confirm before proceeding
    warning "This will delete the following items:"
    echo "  - /backend (old backend code)"
    echo "  - /src (old frontend code)"
    echo "  - /public (duplicated assets)"
    echo "  - /controllers, /routes, /middleware, /services"
    echo "  - Root config files (package.json, etc.)"
    echo "  - /node_modules (all instances)"
    echo ""
    read -p "Continue with deletion? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log "Cleanup cancelled by user"
        exit 0
    fi
    
    # Delete old backend and frontend
    log "Removing old backend folder..."
    rm -rf "$PROJECT_ROOT/backend"
    
    log "Removing old src folder..."
    rm -rf "$PROJECT_ROOT/src"
    
    log "Removing old public folder..."
    rm -rf "$PROJECT_ROOT/public"
    
    # Delete root-level backend folders
    log "Removing root-level backend folders..."
    rm -rf "$PROJECT_ROOT/controllers"
    rm -rf "$PROJECT_ROOT/routes"
    rm -rf "$PROJECT_ROOT/middleware"
    rm -rf "$PROJECT_ROOT/services"
    
    # Delete server.js
    log "Removing old server.js..."
    rm -f "$PROJECT_ROOT/server.js"
    
    # Delete old config files
    log "Removing old configuration files..."
    rm -f "$PROJECT_ROOT/package.json"
    rm -f "$PROJECT_ROOT/package-lock.json"
    rm -f "$PROJECT_ROOT/netlify.toml"
    rm -f "$PROJECT_ROOT/render.yaml"
    rm -f "$PROJECT_ROOT/vercel.json"
    rm -f "$PROJECT_ROOT/postcss.config.js"
    rm -f "$PROJECT_ROOT/tailwind.config.js"
    
    # Delete node_modules
    log "Removing node_modules folders..."
    find "$PROJECT_ROOT" -name "node_modules" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
    
    success "Redundant files removed"
}

# Move backup scripts to github-deployment
migrate_backup_scripts() {
    log "Migrating backup scripts to github-deployment..."
    
    # Check if backup scripts should be moved
    if [ -d "$PROJECT_ROOT/scripts/backup" ] && [ -d "$PROJECT_ROOT/github-deployment" ]; then
        if [ ! -d "$PROJECT_ROOT/github-deployment/scripts" ]; then
            log "Moving scripts folder to github-deployment..."
            mv "$PROJECT_ROOT/scripts" "$PROJECT_ROOT/github-deployment/"
            
            # Update backup script paths
            log "Updating backup script paths..."
            find "$PROJECT_ROOT/github-deployment/scripts/backup" -name "*.sh" -type f -exec sed -i 's|PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"|PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"|g' {} \;
        else
            warning "Scripts folder already exists in github-deployment"
        fi
    fi
    
    # Also move backups folder reference
    if [ -d "$PROJECT_ROOT/backups" ] && [ -d "$PROJECT_ROOT/github-deployment" ]; then
        log "Backups will remain at root level for easy access"
        # Backups stay at root level, but update references if needed
    fi
}

# Update package.json in github-deployment with backup scripts
update_package_json() {
    log "Updating github-deployment package.json with backup scripts..."
    
    local pkg_file="$PROJECT_ROOT/github-deployment/package.json"
    
    if [ -f "$pkg_file" ]; then
        # Check if backup scripts already exist
        if ! grep -q "backup:" "$pkg_file"; then
            log "Adding backup scripts to package.json..."
            
            # Create a temporary file with updated scripts
            cp "$pkg_file" "${pkg_file}.tmp"
            
            # Add backup scripts before the closing brace of scripts section
            sed -i '/"scripts": {/,/}/ s/\(.*\)\(}\)/\1,\n    "backup": ".\/scripts\/backup\/backup-database.sh",\n    "backup:sqlite": ".\/scripts\/backup\/backup-database.sh --sqlite-only",\n    "backup:postgres": ".\/scripts\/backup\/backup-database.sh --postgres-only",\n    "backup:setup": ".\/scripts\/backup\/setup-backup-schedule.sh --interactive",\n    "backup:monitor": ".\/scripts\/backup\/monitor-backups.sh",\n    "backup:stats": ".\/scripts\/backup\/monitor-backups.sh --stats",\n    "backup:restore": ".\/scripts\/backup\/restore-database.sh --interactive"\n\2/' "${pkg_file}.tmp"
            
            mv "${pkg_file}.tmp" "$pkg_file"
            success "Backup scripts added to github-deployment package.json"
        else
            log "Backup scripts already exist in package.json"
        fi
    fi
}

# Create new root package.json for github-deployment
create_root_package_json() {
    log "Creating minimal root package.json..."
    
    cat > "$PROJECT_ROOT/package.json" <<'EOF'
{
  "name": "vasp-legal-assistant-root",
  "version": "1.0.0",
  "description": "VASP Legal Assistant - Root package for managing the project",
  "scripts": {
    "start": "cd github-deployment && npm start",
    "dev": "cd github-deployment && npm run dev",
    "build": "cd github-deployment && npm run build",
    "install:all": "cd github-deployment && npm install && cd backend && npm install",
    "backup": "cd github-deployment && npm run backup",
    "backup:setup": "cd github-deployment && npm run backup:setup"
  },
  "private": true
}
EOF
    
    success "Created minimal root package.json for convenience"
}

# Final summary
show_summary() {
    echo ""
    success "=== Cleanup Complete! ==="
    echo ""
    log "📁 Backup location: $BACKUP_DIR"
    log "📦 Active code location: $PROJECT_ROOT/github-deployment"
    echo ""
    log "✅ Deleted:"
    echo "  - Old backend and frontend code"
    echo "  - Redundant configuration files"
    echo "  - node_modules folders"
    echo ""
    log "✅ Preserved:"
    echo "  - github-deployment (active code)"
    echo "  - scripts/backup (if not moved)"
    echo "  - backups folder"
    echo "  - logs folder"
    echo "  - prisma folder"
    echo "  - Git files"
    echo ""
    warning "Next steps:"
    echo "  1. cd github-deployment"
    echo "  2. npm install (to reinstall dependencies)"
    echo "  3. cd backend && npm install"
    echo "  4. Test that everything still works"
    echo ""
    success "Your project is now cleaner and focused on github-deployment!"
}

# Main execution
main() {
    log "=== VASP Legal Assistant Cleanup Script ==="
    echo ""
    
    # Create backup
    create_backup
    backup_database
    backup_files
    
    # Check for unique scripts
    check_unique_scripts
    
    # Perform cleanup
    delete_redundant_files
    
    # Migrate and update
    migrate_backup_scripts
    update_package_json
    create_root_package_json
    
    # Show summary
    show_summary
    
    log "Cleanup completed successfully!"
}

# Run main function
main "$@"