# VASP Legal Assistant Database Backup System

This directory contains a comprehensive database backup system for the VASP Legal Assistant application, supporting both development (SQLite) and production (PostgreSQL) databases.

## 🚀 Quick Start

### 1. Run a Manual Backup
```bash
# Backup both databases
./scripts/backup/backup-database.sh

# Backup only SQLite (development)
./scripts/backup/backup-database.sh --sqlite-only

# Backup only PostgreSQL (production)
./scripts/backup/backup-database.sh --postgres-only
```

### 2. Set Up Automated Backups
```bash
# Interactive setup (recommended)
./scripts/backup/setup-backup-schedule.sh --interactive

# Quick daily setup
./scripts/backup/setup-backup-schedule.sh --daily
```

### 3. Monitor Backup Health
```bash
# Check backup status
./scripts/backup/monitor-backups.sh --stats

# Full health monitoring
./scripts/backup/monitor-backups.sh --monitor
```

## 📁 Directory Structure

```
scripts/backup/
├── backup-database.sh           # Main backup script
├── restore-database.sh          # Database restoration script
├── setup-backup-schedule.sh     # Backup scheduling setup
├── monitor-backups.sh           # Backup monitoring and verification
├── backup-config.env            # Configuration file
└── README.md                    # This documentation

backups/                         # Backup storage directory
├── sqlite/                      # SQLite database backups
│   ├── vasp_backup_YYYYMMDD_HHMMSS.db.gz
│   └── vasp_dump_YYYYMMDD_HHMMSS.sql.gz
└── postgresql/                  # PostgreSQL database backups
    └── vasp_backup_YYYYMMDD_HHMMSS.sql.gz

logs/backup/                     # Backup logs
├── backup-YYYYMM.log           # Monthly backup logs
├── monitor-YYYYMM.log          # Monthly monitoring logs
└── backup-report-*.txt         # Health reports
```

## 🛠 Scripts Overview

### backup-database.sh
**Purpose**: Main backup script for both SQLite and PostgreSQL databases.

**Features**:
- Supports both SQLite and PostgreSQL
- Automatic compression with gzip
- Integrity verification
- Retention management (30 days default)
- Comprehensive logging
- Environment variable support

**Usage**:
```bash
./backup-database.sh [options]

Options:
  --sqlite-only      Backup only SQLite database
  --postgres-only    Backup only PostgreSQL database
  --verify-only      Only verify existing backups
  -h, --help         Show help
```

### restore-database.sh
**Purpose**: Restore databases from backup files with safety checks.

**Features**:
- Interactive backup selection
- Automatic current database backup before restoration
- Support for both SQL dumps and database files
- Confirmation prompts for safety
- Restoration verification

**Usage**:
```bash
./restore-database.sh [options] [backup_file]

Options:
  --sqlite [file]        Restore SQLite database
  --postgresql [file]    Restore PostgreSQL database
  --interactive          Interactive backup selection
  --no-backup           Skip current database backup
  --list-sqlite         List SQLite backups
  --list-postgresql     List PostgreSQL backups
```

### setup-backup-schedule.sh
**Purpose**: Set up automated backup scheduling using cron or systemd.

**Features**:
- Interactive setup wizard
- Multiple scheduling presets
- Custom cron schedule support
- Systemd timer support
- Log rotation setup

**Usage**:
```bash
./setup-backup-schedule.sh [options]

Options:
  --interactive     Interactive setup (recommended)
  --daily          Set up daily backup at 3 AM
  --hourly         Set up backup every 6 hours
  --weekly         Set up weekly backup on Sunday
  --custom SCHEDULE Custom cron schedule
  --systemd        Use systemd timer instead of cron
  --remove         Remove existing schedule
  --show           Show current cron jobs
```

### monitor-backups.sh
**Purpose**: Monitor backup health, verify integrity, and generate reports.

**Features**:
- Backup age monitoring
- File integrity verification
- Size validation
- Retention policy checking
- Automated alerting
- Health report generation

**Usage**:
```bash
./monitor-backups.sh [options]

Options:
  --monitor        Run comprehensive monitoring (default)
  --sqlite         Monitor only SQLite backups
  --postgresql     Monitor only PostgreSQL backups
  --report         Generate health report
  --stats          Show backup statistics
  --cleanup        Clean up old backups
  --verify FILE    Verify specific backup file
```

## 🔧 Configuration

### Environment Variables

The backup system uses the following environment variables:

**PostgreSQL Connection**:
```bash
DATABASE_URL="postgresql://user:password@host:port/database"
# OR individual variables:
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="vasp_legal_assistant"
DB_USER="vasp_user"
DB_PASSWORD="your_password"
```

**Backup Settings**:
```bash
BACKUP_RETENTION_DAYS=30
BACKUP_ALERT_THRESHOLD_HOURS=26
```

### Configuration File

Create `scripts/backup/backup-config.env` for custom settings:
```bash
# Backup retention (days)
RETENTION_DAYS=30

# Alert if backup is older than this (hours)
ALERT_THRESHOLD_HOURS=26

# Backup notification settings
NOTIFICATION_EMAIL="admin@example.com"
NOTIFICATION_WEBHOOK_URL="https://hooks.slack.com/..."

# Storage settings
BACKUP_COMPRESSION_LEVEL=6
BACKUP_VERIFY_AFTER_CREATE=true
```

## 📋 Backup Schedule Recommendations

### Development Environment
- **Frequency**: Daily at 2 AM
- **Retention**: 14 days
- **Monitoring**: Weekly manual checks

### Production Environment
- **Frequency**: Every 6 hours
- **Retention**: 30 days
- **Monitoring**: Daily automated checks
- **Alerting**: Enabled for failures

### Recommended Cron Schedule
```bash
# Production: Every 6 hours
0 */6 * * * cd /path/to/project && ./scripts/backup/backup-database.sh

# Development: Daily at 2 AM
0 2 * * * cd /path/to/project && ./scripts/backup/backup-database.sh --sqlite-only

# Monitoring: Daily at 8 AM
0 8 * * * cd /path/to/project && ./scripts/backup/monitor-backups.sh --monitor
```

## 🚨 Monitoring and Alerts

### Health Checks
The monitoring system performs these checks:

1. **Backup Age**: Alerts if backup is older than 26 hours
2. **File Integrity**: Verifies gzip compression and SQL validity
3. **File Size**: Checks for suspiciously small backups
4. **Retention**: Monitors backup count and cleanup needs

### Alert Levels
- **CRITICAL**: No backups found, corruption detected
- **WARNING**: Old backups, size issues
- **INFO**: Normal operations, cleanup notifications

### Setting Up Alerts

#### Email Notifications (Future)
```bash
# Add to backup-config.env
NOTIFICATION_EMAIL="admin@example.com"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
```

#### Slack Integration (Future)
```bash
# Add to backup-config.env
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
SLACK_CHANNEL="#alerts"
```

## 🔄 Backup and Restore Procedures

### Regular Backup Procedure
1. Automated backups run via cron/systemd
2. Backups are compressed and stored in `/backups/`
3. Old backups are automatically cleaned up
4. Monitoring reports are generated daily

### Emergency Restore Procedure

#### Quick Restore (Interactive)
```bash
# Interactive restoration with backup selection
./scripts/backup/restore-database.sh --interactive
```

#### Manual Restore
```bash
# List available backups
./scripts/backup/restore-database.sh --list-postgresql

# Restore specific backup
./scripts/backup/restore-database.sh --postgresql /path/to/backup.sql.gz
```

#### Development Database Reset
```bash
# Restore latest SQLite backup
latest_backup=$(ls -t backups/sqlite/*.sql.gz | head -1)
./scripts/backup/restore-database.sh --sqlite "$latest_backup"
```

## 🔒 Security Considerations

### File Permissions
```bash
# Set secure permissions for backup directory
chmod 750 backups/
chmod 640 backups/*/*.gz

# Set secure permissions for scripts
chmod 750 scripts/backup/*.sh
chmod 640 scripts/backup/backup-config.env
```

### Database Credentials
- Store database credentials in `.env` files
- Use PostgreSQL connection URLs when possible
- Avoid hardcoding credentials in scripts
- Consider using environment-specific credential files

### Backup Encryption (Future Enhancement)
Consider implementing backup encryption for sensitive data:
```bash
# Example: Encrypt backups with GPG
gpg --symmetric --cipher-algo AES256 backup.sql
```

## 🧪 Testing the Backup System

### Test Backup Creation
```bash
# Test backup script
./scripts/backup/backup-database.sh --help
./scripts/backup/backup-database.sh --verify-only
```

### Test Restoration
```bash
# Create a test backup first
./scripts/backup/backup-database.sh --sqlite-only

# Test restoration (be careful in production!)
./scripts/backup/restore-database.sh --sqlite --interactive --no-backup
```

### Test Monitoring
```bash
# Test monitoring system
./scripts/backup/monitor-backups.sh --stats
./scripts/backup/monitor-backups.sh --report
```

## 🐛 Troubleshooting

### Common Issues

#### "No backups found"
- Check if backup directory exists: `ls -la backups/`
- Verify backup script permissions: `ls -la scripts/backup/`
- Check cron job status: `crontab -l`

#### "Database connection failed"
- Verify environment variables: `env | grep DB_`
- Test PostgreSQL connection: `psql $DATABASE_URL -c "SELECT 1;"`
- Check network connectivity to database

#### "Backup file corrupted"
- Run integrity check: `./monitor-backups.sh --verify /path/to/backup.gz`
- Check disk space: `df -h`
- Review backup logs: `tail -f logs/backup/backup-$(date +%Y%m).log`

#### "Permission denied"
- Fix script permissions: `chmod +x scripts/backup/*.sh`
- Check backup directory permissions: `ls -la backups/`
- Verify user has database access

### Log Locations
- Backup logs: `logs/backup/backup-YYYYMM.log`
- Monitoring logs: `logs/backup/monitor-YYYYMM.log`
- Cron logs: `/var/log/cron` or `journalctl -u cron`
- System logs: `journalctl -f`

### Debug Mode
Run scripts with debug output:
```bash
bash -x ./scripts/backup/backup-database.sh
```

## 📈 Future Enhancements

### Planned Features
1. **Cloud Storage Integration**: S3, Google Cloud, Azure
2. **Email/Slack Notifications**: Real-time alerts
3. **Backup Encryption**: GPG encryption for sensitive data
4. **Database Migration Tools**: Schema and data migration helpers
5. **Web Dashboard**: GUI for backup management
6. **Backup Validation**: Automated restore testing
7. **Incremental Backups**: Space-efficient backup strategy

### Contributing
To contribute improvements:
1. Test changes thoroughly in development
2. Update documentation
3. Add appropriate error handling
4. Follow existing code style
5. Add logging for troubleshooting

## 📞 Support

For backup system issues:
1. Check logs in `logs/backup/`
2. Run monitoring: `./monitor-backups.sh --stats`
3. Verify configuration: Review environment variables
4. Test manually: Run backup scripts with `--help`

Remember: Always test backup and restore procedures in a development environment before using in production!