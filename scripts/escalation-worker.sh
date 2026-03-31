#!/bin/bash
set -e

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:3000}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID}"

LEVEL1_THRESHOLD=7200
LEVEL2_THRESHOLD=14400
LEVEL3_THRESHOLD=28800

if [ -z "$PAPERCLIP_API_KEY" ] || [ -z "$PAPERCLIP_COMPANY_ID" ]; then
	echo "ERROR: PAPERCLIP_API_KEY and PAPERCLIP_COMPANY_ID must be set"
	exit 1
fi

echo "=== Blocked Task Escalation Worker ==="
echo "Running at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

now=$(date +%s)
escalated_count=0

blocked_tasks=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=blocked&limit=100")

task_count=$(echo "$blocked_tasks" | jq '. | length')

if [ "$task_count" -eq 0 ]; then
	echo "No blocked tasks found"
	exit 0
fi

echo "Found $task_count blocked tasks"

echo "$blocked_tasks" | jq -r '.[] | @json' | while IFS= read -r task_json; do
	task_id=$(echo "$task_json" | jq -r '.id')
	task_identifier=$(echo "$task_json" | jq -r '.identifier // "unknown"')
	task_title=$(echo "$task_json" | jq -r '.title')
	task_priority=$(echo "$task_json" | jq -r '.priority // "medium"')
	assignee_agent_id=$(echo "$task_json" | jq -r '.assigneeAgentId // null')
	updated_at=$(echo "$task_json" | jq -r '.updatedAt')

	if [ "$assignee_agent_id" = "null" ] || [ -z "$assignee_agent_id" ]; then
		echo "Task $task_identifier has no assignee - skipping escalation"
		continue
	fi

	updated_epoch=$(date -d "$updated_at" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "${updated_at%.*}" +%s 2>/dev/null || echo "$now")
	blocked_seconds=$((now - updated_epoch))
	blocked_hours=$((blocked_seconds / 3600))

	echo "Task $task_identifier: blocked ${blocked_hours}h (${blocked_seconds}s)"

	if [ "$blocked_seconds" -ge "$LEVEL3_THRESHOLD" ] && [ "$task_priority" = "critical" -o "$task_priority" = "high" ]; then
		echo "Level 3 escalation: CEO"

		assignee_info=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			"$PAPERCLIP_API_URL/api/agents/$assignee_agent_id")
		assignee_name=$(echo "$assignee_info" | jq -r '.name')
		reports_to=$(echo "$assignee_info" | jq -r '.reportsTo // null')

		curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: escalation-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id/comments" \
			-H "Content-Type: application/json" \
			-d "{\"body\": \"## CRITICAL: Task Escalated to CEO\n\nTask $task_identifier has been blocked for ${blocked_hours} hours.\n\n**Current Status:**\n- Task: $task_title\n- Assigned to: $assignee_name\n- Priority: $task_priority\n- Blocked duration: ${blocked_hours}h\n\nThis task requires CEO attention due to extended blockage.\"}" >/dev/null

		escalated_count=$((escalated_count + 1))

	elif [ "$blocked_seconds" -ge "$LEVEL2_THRESHOLD" ]; then
		echo "Level 2 escalation: Manager reassign"

		assignee_info=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			"$PAPERCLIP_API_URL/api/agents/$assignee_agent_id")
		assignee_name=$(echo "$assignee_info" | jq -r '.name')
		reports_to=$(echo "$assignee_info" | jq -r '.reportsTo // null')

		if [ "$reports_to" != "null" ] && [ -n "$reports_to" ]; then
			manager_info=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
				"$PAPERCLIP_API_URL/api/agents/$reports_to")
			manager_name=$(echo "$manager_info" | jq -r '.name')

			curl -s -X PATCH -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
				-H "X-Paperclip-Run-Id: escalation-$(date +%s)" \
				"$PAPERCLIP_API_URL/api/issues/$task_id" \
				-H "Content-Type: application/json" \
				-d "{\"priority\": \"critical\"}" >/dev/null

			curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
				-H "X-Paperclip-Run-Id: escalation-$(date +%s)" \
				"$PAPERCLIP_API_URL/api/issues/$task_id/comments" \
				-H "Content-Type: application/json" \
				-d "{\"body\": \"## Level 2 Escalation: Manager Attention Required\n\nTask $task_identifier has been blocked for ${blocked_hours} hours.\n\n**Escalation Details:**\n- Original assignee: $assignee_name\n- Escalating to: $manager_name\n- Priority upgraded to: critical\n\nPlease review and unblock or reassign.\"}" >/dev/null

			escalated_count=$((escalated_count + 1))
		fi

	elif [ "$blocked_seconds" -ge "$LEVEL1_THRESHOLD" ]; then
		echo "Level 1 escalation: Notification"

		assignee_info=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			"$PAPERCLIP_API_URL/api/agents/$assignee_agent_id")
		assignee_name=$(echo "$assignee_info" | jq -r '.name')

		curl -s -X PATCH -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: escalation-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id" \
			-H "Content-Type: application/json" \
			-d "{\"priority\": \"high\"}" >/dev/null

		curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: escalation-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id/comments" \
			-H "Content-Type: application/json" \
			-d "{\"body\": \"## Reminder: Task Still Blocked\n\n@$assignee_name - Task $task_identifier has been blocked for ${blocked_hours} hours.\n\nPlease either:\n1. Unblock and resume work\n2. Release the task so it can be reassigned\n3. Update with current status\n\nThis is an automated reminder.\"}" >/dev/null

		escalated_count=$((escalated_count + 1))
	fi
done

echo "=== Summary ==="
echo "Tasks escalated: $escalated_count"
echo "Worker completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
