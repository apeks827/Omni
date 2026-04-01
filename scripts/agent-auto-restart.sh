#!/bin/bash
set -e

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:3000}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID}"

if [ -z "$PAPERCLIP_API_KEY" ] || [ -z "$PAPERCLIP_COMPANY_ID" ]; then
	echo "ERROR: PAPERCLIP_API_KEY and PAPERCLIP_COMPANY_ID must be set"
	exit 1
fi

echo "Attempting to restart error agents..."

agents=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agents")

error_agents=$(echo "$agents" | jq -r '.[] | select(.status == "error") | .id')

if [ -z "$error_agents" ]; then
	echo "No agents in error state"
	exit 0
fi

for agent_id in $error_agents; do
	agent_name=$(echo "$agents" | jq -r ".[] | select(.id == \"$agent_id\") | .name")
	echo "Restarting agent: $agent_name ($agent_id)"

	curl -s -X PATCH \
		-H "Authorization: Bearer $PAPERCLIP_API_KEY" \
		-H "Content-Type: application/json" \
		"$PAPERCLIP_API_URL/api/agents/$agent_id" \
		-d '{"status":"running"}' >/dev/null

	if [ $? -eq 0 ]; then
		echo "  ✓ Successfully restarted $agent_name"
	else
		echo "  ✗ Failed to restart $agent_name"
	fi
done

echo "Restart complete"
