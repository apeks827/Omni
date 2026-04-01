#!/bin/bash
set -e

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:3000}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID}"

if [ -z "$PAPERCLIP_API_KEY" ] || [ -z "$PAPERCLIP_COMPANY_ID" ]; then
	echo "ERROR: PAPERCLIP_API_KEY and PAPERCLIP_COMPANY_ID must be set"
	exit 1
fi

echo "=== Next-Step Handoff Worker ==="
echo "Running at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

completed_tasks=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=done&limit=50" |
	jq '[.[] | select(.updatedAt > (now | floor - 300))]')

handoff_count=0

echo "$completed_tasks" | jq -r '.[] | @json' | while IFS= read -r task_json; do
	task_id=$(echo "$task_json" | jq -r '.id')
	task_identifier=$(echo "$task_json" | jq -r '.identifier // "unknown"')
	task_title=$(echo "$task_json" | jq -r '.title')
	parent_id=$(echo "$task_json" | jq -r '.parentId // null')
	goal_id=$(echo "$task_json" | jq -r '.goalId')
	project_id=$(echo "$task_json" | jq -r '.projectId')

	case "$(echo "$task_title" | tr '[:upper:]' '[:lower:]')" in
	*backend* | *api* | *server*)
		next_title="Review backend implementation"
		next_role="engineer"
		;;
	*frontend* | *ui* | *interface*)
		next_title="Review frontend implementation"
		next_role="engineer"
		;;
	*design* | *ui/ux*)
		next_title="Review design implementation"
		next_role="designer"
		;;
	*test* | *qa*)
		next_title="Verify test coverage"
		next_role="qa"
		;;
	*deploy* | *release*)
		next_title="Deploy to production"
		next_role="devops"
		;;
	*)
		continue
		;;
	esac

	dupe_key="${task_id}:handoff:${next_role}"

	existing=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
		"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?q=${dupe_key}" |
		jq '[.[] | select(.description | test("'"$dupe_key"'"))] | .[0] // null')

	if [ "$existing" != "null" ]; then
		echo "Handoff already exists for $task_identifier (key: $dupe_key)"
		continue
	fi

	assignee_query=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
		"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agents" |
		jq -r --arg role "$next_role" '.[] | select(.status == "running" and (.role | test("(?i)" + $role; ""))) | .id' | head -1)

	if [ -n "$assignee_query" ]; then
		assignee_json="\"$assignee_query\""
	else
		assignee_json="null"
	fi

	create_body="{\"title\":\"$next_title\",\"description\":\"## Handoff from $task_identifier\n\n**Source:** [$task_identifier](/OMN/issues/$task_identifier)\n\n**Dedupe Key:** $dupe_key\n\n**Context:**\nThis task was automatically created as a follow-up to the completed work above.\n\n### Required Actions\n- Review implementation from $task_title\n- Verify requirements met\n- Provide feedback or sign-off\n\",\"status\":\"todo\",\"priority\":\"high\",\"projectId\":\"$project_id\",\"goalId\":\"$goal_id\",\"parentId\":\"$parent_id\",\"assigneeAgentId\":$assignee_json}"

	create_result=$(curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
		-H "X-Paperclip-Run-Id: handoff-$(date +%s)" \
		"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues" \
		-H "Content-Type: application/json" \
		-d "$create_body")

	if echo "$create_result" | jq -e '.id' >/dev/null 2>&1; then
		new_identifier=$(echo "$create_result" | jq -r '.identifier')
		echo "Created handoff $new_identifier for $task_identifier"

		curl -s -X POST -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
			-H "X-Paperclip-Run-Id: handoff-$(date +%s)" \
			"$PAPERCLIP_API_URL/api/issues/$task_id/comments" \
			-H "Content-Type: application/json" \
			-d "{\"body\": \"## Auto-Handoff\n\nCreated follow-up: [$new_identifier](/OMN/issues/$new_identifier)\n\nAssigned to: $next_role role\n\n*Automated next-step detection based on task type.*\"}" >/dev/null

		handoff_count=$((handoff_count + 1))
	fi
done

echo "=== Summary ==="
echo "Handoffs created: $handoff_count"
echo "Worker completed at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
