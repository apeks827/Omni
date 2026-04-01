#!/bin/bash
set -e

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:3000}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID}"

MAX_IC_TASKS=3
MAX_MANAGER_TASKS=5
MAX_SPECIALIST_TASKS=2

if [ -z "$PAPERCLIP_API_KEY" ] || [ -z "$PAPERCLIP_COMPANY_ID" ]; then
	echo "ERROR: PAPERCLIP_API_KEY and PAPERCLIP_COMPANY_ID must be set"
	exit 1
fi

echo "=== Automatic Task Assignment Worker ==="
echo "Running at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

get_max_tasks() {
	local role="$1"
	case "$role" in
	manager | ceo) echo "$MAX_MANAGER_TASKS" ;;
	researcher | engineer | designer | general) echo "$MAX_IC_TASKS" ;;
	specialist) echo "$MAX_SPECIALIST_TASKS" ;;
	*) echo "$MAX_IC_TASKS" ;;
	esac
}

get_workload() {
	local agent_id="$1"
	curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
		"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=in_progress&assigneeAgentId=$agent_id&limit=100" |
		jq '. | length'
}

idle_agents=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agents" |
	jq -r '.[] | select(.status == "running") | .id')

assigned_count=0
skipped_count=0

for agent_id in $idle_agents; do
	agent_info=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
		"$PAPERCLIP_API_URL/api/agents/$agent_id")

	agent_name=$(echo "$agent_info" | jq -r '.name')
	agent_role=$(echo "$agent_info" | jq -r '.role // "general"')
	agent_capabilities=$(echo "$agent_info" | jq -r '.capabilities // ""')

	current_workload=$(get_workload "$agent_id")
	max_tasks=$(get_max_tasks "$agent_role")

	if [ "$current_workload" -ge "$max_tasks" ]; then
		echo "Agent $agent_name ($agent_role) at capacity: $current_workload/$max_tasks tasks"
		skipped_count=$((skipped_count + 1))
		continue
	fi

	echo "Agent $agent_name ($agent_role): $current_workload/$max_tasks tasks - searching for work"

	best_task=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
		"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=todo&limit=50" |
		jq -r --arg role "$agent_role" --arg cap "$agent_capabilities" '
        map(select(.assigneeAgentId == null)) |
        sort_by(case .priority when "critical" then 0 when "high" then 1 when "medium" then 2 else 3 end) |
        .[0:10] |
        map(select(
            (.title | test("(?i)" + $role; "")) or
            (.title | test("(?i)" + $cap; ""))
        )) |
        .[0] // empty
    ')

	if [ -n "$best_task" ] && [ "$best_task" != "null" ] && [ "$best_task" != "" ]; then
		task_id=$(echo "$best_task" | jq -r '.id')
		task_identifier=$(echo "$best_task" | jq -r '.identifier // "unknown"')
		task_priority=$(echo "$best_task" | jq -r '.priority // "unknown"')

		assign_result=$(curl -s -X PATCH -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: auto-assign-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id" \
			-H "Content-Type: application/json" \
			-d "{\"assigneeAgentId\": \"$agent_id\", \"status\": \"in_progress\"}")

		if echo "$assign_result" | jq -e '.id' >/dev/null 2>&1; then
			echo "Assigned $task_identifier (priority: $task_priority) to $agent_name"

			curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
				-H "X-Paperclip-Run-Id: auto-assign-$(date +%s)" \
				"$PAPERCLIP_API_URL/api/issues/$task_id/comments" \
				-H "Content-Type: application/json" \
				-d "{\"body\": \"## Auto-assigned by task assignment worker\n\nAssigned to $agent_name based on:\n- Role: $agent_role\n- Workload: $current_workload/$max_tasks tasks\n\n*This is an automated assignment to prevent agent idle time.*\"}" >/dev/null

			assigned_count=$((assigned_count + 1))

			if [ "$current_workload" -ge $((max_tasks - 1)) ]; then
				echo "Agent $agent_name reaching capacity, skipping further assignments"
				break
			fi
		fi
	else
		echo "No suitable task found for $agent_name"
	fi
done

echo "=== Summary ==="
echo "Tasks auto-assigned: $assigned_count"
echo "Agents at capacity: $skipped_count"
echo "Worker completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
