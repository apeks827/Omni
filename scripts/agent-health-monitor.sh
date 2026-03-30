#!/bin/bash
set -e

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:3000}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID}"

if [ -z "$PAPERCLIP_API_KEY" ] || [ -z "$PAPERCLIP_COMPANY_ID" ]; then
	echo "ERROR: PAPERCLIP_API_KEY and PAPERCLIP_COMPANY_ID must be set"
	exit 1
fi

echo "Checking agent health..."

agents=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agents")

error_agents=$(echo "$agents" | jq -r '.[] | select(.status == "error" or .status == "paused") | "\(.id)|\(.name)|\(.status)|\(.pauseReason // "unknown")"')

if [ -z "$error_agents" ]; then
	echo "All agents healthy"
	exit 0
fi

echo "Found agents in error state:"
echo "$error_agents" | while IFS='|' read -r id name status reason; do
	echo "  - $name ($id): $status - $reason"
done

exit 1
