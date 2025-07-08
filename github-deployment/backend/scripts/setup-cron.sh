#!/bin/bash

# Setup script for monthly VASP cleanup cron job

echo "🔧 Setting up monthly VASP cleanup cron job..."

# Get the absolute path to the project
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

# Create logs directory if it doesn't exist
mkdir -p "$BACKEND_DIR/logs"

# Create the cron script
cat > "$BACKEND_DIR/scripts/run-vasp-cleanup.sh" << EOF
#!/bin/bash
# Monthly VASP cleanup script

# Load environment variables
source $BACKEND_DIR/.env

# Change to backend directory
cd $BACKEND_DIR

# Run the cleanup script
/usr/bin/node scripts/automated-vasp-cleanup.js >> logs/vasp-cleanup.log 2>&1

# Keep only last 12 months of logs
tail -n 1000 logs/vasp-cleanup.log > logs/vasp-cleanup.log.tmp && mv logs/vasp-cleanup.log.tmp logs/vasp-cleanup.log
EOF

# Make the script executable
chmod +x "$BACKEND_DIR/scripts/run-vasp-cleanup.sh"

# Add to crontab (runs at 3 AM on the 1st of every month)
CRON_JOB="0 3 1 * * $BACKEND_DIR/scripts/run-vasp-cleanup.sh"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "run-vasp-cleanup.sh"; then
    echo "⚠️  Cron job already exists. Skipping..."
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Cron job added successfully!"
fi

echo ""
echo "📅 Cron Schedule: 3 AM on the 1st of every month"
echo "📁 Log file: $BACKEND_DIR/logs/vasp-cleanup.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove the cron job: crontab -e (then delete the line)"
echo ""
echo "To test the cleanup script manually:"
echo "cd $BACKEND_DIR && node scripts/automated-vasp-cleanup.js"