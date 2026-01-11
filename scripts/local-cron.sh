#!/bin/bash
# Local cron simulator for game roundup
# Run: ./scripts/local-cron.sh

INTERVAL=${1:-300}  # Default 5 minutes (300 seconds)
URL="http://localhost:3000/api/cron/roundup-games"

# Load PARTYKIT_SECRET from .env
export $(grep PARTYKIT_SECRET .env | xargs)

echo "🔄 Starting local cron (every ${INTERVAL}s)"
echo "   URL: $URL"
echo "   Press Ctrl+C to stop"
echo ""

while true; do
  echo "[$(date '+%H:%M:%S')] Calling roundup-games..."
  curl -s -X POST "$URL" \
    -H "Authorization: Bearer $PARTYKIT_SECRET" \
    -H "Content-Type: application/json" | jq -r '.'
  echo ""
  sleep $INTERVAL
done
