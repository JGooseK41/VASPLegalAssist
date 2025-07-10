#!/bin/bash

# Script to set up daily leaderboard update cron job

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Leaderboard Daily Update Cron Setup ===${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
UPDATE_SCRIPT="$SCRIPT_DIR/update-leaderboard-daily.js"

# Check if the update script exists
if [ ! -f "$UPDATE_SCRIPT" ]; then
    echo -e "${RED}Error: update-leaderboard-daily.js not found at $UPDATE_SCRIPT${NC}"
    exit 1
fi

# Make the update script executable
chmod +x "$UPDATE_SCRIPT"

# Create a temporary cron file
TEMP_CRON=$(mktemp)

# Get existing cron jobs
crontab -l > "$TEMP_CRON" 2>/dev/null || true

# Check if the cron job already exists
if grep -q "update-leaderboard-daily.js" "$TEMP_CRON"; then
    echo -e "${YELLOW}Leaderboard update cron job already exists${NC}"
    echo "Current cron job:"
    grep "update-leaderboard-daily.js" "$TEMP_CRON"
else
    # Add the cron job to run daily at 2 AM
    echo "0 2 * * * cd $SCRIPT_DIR/.. && /usr/bin/node $UPDATE_SCRIPT >> $SCRIPT_DIR/../logs/leaderboard-update.log 2>&1" >> "$TEMP_CRON"
    
    # Install the new cron file
    crontab "$TEMP_CRON"
    
    echo -e "${GREEN}Leaderboard update cron job added successfully!${NC}"
    echo "The leaderboard will be updated daily at 2:00 AM"
fi

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/../logs"

# Clean up
rm "$TEMP_CRON"

echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "To test the script manually, run:"
echo "  cd $SCRIPT_DIR/.. && node scripts/update-leaderboard-daily.js"
echo ""
echo "To view the cron job, run:"
echo "  crontab -l | grep leaderboard"
echo ""
echo "To remove the cron job, run:"
echo "  crontab -e"
echo "  # Then delete the line containing 'update-leaderboard-daily.js'"