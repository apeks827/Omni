#!/bin/bash
set -e

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:3000}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID}"

STALE_THRESHOLD_L1=14400
STALE_THRESHOLD_L2=28800
STALE_THRESHOLD_L3=43200

if [ -z "$PAPERCLIP_API_KEY" ] || [ -z "$PAPERCLIP_COMPANY_ID" ]; then
	echo "ERROR: PAPERCLIP_API_KEY and PAPERCLIP_COMPANY_ID must be set"
	exit 1
fi

echo "=== Stale In-Progress Task Escalation Worker ==="
echo "Running at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

now=$(date +%s)
escalated_count=0

in_progress_tasks=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=in_progress&limit=100")

task_count=$(echo "$in_progress_tasks" | jq '. | length')

if [ "$task_count" -eq 0 ]; then
	echo "No in_progress tasks found"
	exit 0
fi

echo "Found $task_count in_progress tasks"

echo "$in_progress_tasks" | jq -r '.[] | @json' | while IFS= read -r task_json; do
	task_id=$(echo "$task_json" | jq -r '.id')
	task_identifier=$(echo "$task_json" | jq -r '.identifier // "unknown"')
	task_title=$(echo "$task_json" | jq -r '.title')
	task_priority=$(echo "$task_json" | jq -r '.priority // "medium"')
	assignee_agent_id=$(echo "$task_json" | jq -r '.assigneeAgentId // null')
	started_at=$(echo "$task_json" | jq -r '.startedAt // empty')
	updated_at=$(echo "$task_json" | jq -r '.updatedAt')

	if [ "$assignee_agent_id" = "null" ] || [ -z "$assignee_agent_id" ]; then
		echo "Task $task_identifier has no assignee - skipping"
		continue
	fi

	if [ -z "$started_at" ] || [ "$started_at" = "null" ]; then
		started_at="$updated_at"
	fi

	started_epoch=$(date -d "$started_at" +%s 2>/dev/null || echo "$now")
	updated_epoch=$(date -d "$updated_at" +%s 2>/dev/null || echo "$now")
	staleness_seconds=$((now - updated_epoch))
	staleness_hours=$((staleness_seconds / 3600))

	comments=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
		"$PAPERCLIP_API_URL/api/issues/$task_id/comments?order=desc&limit=1")

	last_comment_time=$(echo "$comments" | jq -r '.[0].createdAt // empty')

	last_comment_hours=0
	if [ -n "$last_comment_time" ] && [ "$last_comment_time" != "null" ]; then
		last_comment_epoch=$(date -d "$last_comment_time" +%s 2>/dev/null || echo "$now")
		since_comment_seconds=$((now - last_comment_epoch))
		last_comment_hours=$((since_comment_seconds / 3600))

		if [ "$since_comment_seconds" -lt "$STALE_THRESHOLD_L1" ]; then
			echo "Task $task_identifier: ${staleness_hours}h stale, comment ${last_comment_hours}h ago - skipping (active)"
			continue
		fi
		echo "Task $task_identifier: stale ${staleness_hours}h, last comment ${last_comment_hours}h ago"
	else
		echo "Task $task_identifier: stale ${staleness_hours}h, no comments ever"
	fi

	if [ "$staleness_seconds" -ge "$STALE_THRESHOLD_L3" ] && [ "$task_priority" != "critical" ]; then
		echo "Level 3 escalation: CEO chain"

		assignee_info=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			"$PAPERCLIP_API_URL/api/agents/$assignee_agent_id")
		assignee_name=$(echo "$assignee_info" | jq -r '.name')
		reports_to=$(echo "$assignee_info" | jq -r '.reportsTo // null')

		curl -s -X PATCH -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: stale-escalation-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id" \
			-H "Content-Type: application/json" \
			-d '{"priority": "critical"}' >/dev/null

		curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: stale-escalation-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id/comments" \
			-H "Content-Type: application/json" \
			-d "{\"body\": \"## CRITICAL: Stale Task Escalation\n\nTask $task_identifier has been stale for ${staleness_hours} hours without visible progress.\n\n**Task Details:**\n- Title: $task_title\n- Assigned to: $assignee_name\n- Priority: critical (upgraded)\n- Staleness: ${staleness_hours}h\n\n**Required Actions:**\n1. Resume work immediately OR\n2. Release task for reassignment OR\n3. Post update with current status\n\n*Automated escalation after ${staleness_hours}h of inactivity.*\"}" >/dev/null

		escalated_count=$((escalated_count + 1))

	elif [ "$staleness_seconds" -ge "$STALE_THRESHOLD_L2" ] && [ "$task_priority" = "high" -o "$task_priority" = "medium" ]; then
		echo "Level 2 escalation: Upgrade priority, notify manager"

		assignee_info=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			"$PAPERCLIP_API_URL/api/agents/$assignee_agent_id")
		assignee_name=$(echo "$assignee_info" | jq -r '.name')
		reports_to=$(echo "$assignee_info" | jq -r '.reportsTo // null')

		curl -s -X PATCH -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: stale-escalation-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id" \
			-H "Content-Type: application/json" \
			-d '{"priority": "high"}' >/dev/null

		manager_info=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			"$PAPERCLIP_API_URL/api/agents/$reports_to" 2>/dev/null)
		manager_name=$(echo "$manager_info" | jq -r '.name // "manager"')

		curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: stale-escalation-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id/comments" \
			-H "Content-Type: application/json" \
			-d "{\"body\": \"## Level 2 Escalation: Stale Task\n\nTask $task_identifier has been stale for ${staleness_hours} hours.\n\n**Task Details:**\n- Title: $task_title\n- Assigned to: $assignee_name\n- Priority: high (upgraded)\n- Staleness: ${staleness_hours}h\n\n**@$manager_name - please review:**\n1. Is $assignee_name blocked?\n2. Should this task be reassigned?\n3. Is work still needed?\n\n*Automated escalation after ${staleness_hours}h of inactivity.*\"}" >/dev/null

		escalated_count=$((escalated_count + 1))

	elif [ "$staleness_seconds" -ge "$STALE_THRESHOLD_L1" ]; then
		echo "Level 1 escalation: Notification reminder"

		assignee_info=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			"$PAPERCLIP_API_URL/api/agents/$assignee_agent_id")
		assignee_name=$(echo "$assignee_info" | jq -r '.name')

		curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: stale-escalation-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id/comments" \
			-H "Content-Type: application/json" \
			-d "{\"body\": \"## Reminder: Task May Be Stale\n\n@$assignee_name - Task $task_identifier has been in progress for ${staleness_hours} hours without a status update.\n\nPlease either:\n1. Post a progress update\n2. Mark blocked if you need help\n3. Complete or release the task\n\n*Automated reminder after ${staleness_hours}h of inactivity.*\"}" >/dev/null

		escalated_count=$((escalated_count + 1))
	fi
done

echo "=== Summary ==="
echo "Tasks escalated: $escalated_count"
echo "Worker completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
