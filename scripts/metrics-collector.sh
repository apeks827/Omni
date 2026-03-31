#!/bin/bash
set -e

PAPERCLIP_API_URL="${PAPERCLIP_API_URL:-http://localhost:3000}"
PAPERCLIP_API_KEY="${PAPERCLIP_API_KEY}"
PAPERCLIP_COMPANY_ID="${PAPERCLIP_COMPANY_ID}"

if [ -z "$PAPERCLIP_API_KEY" ] || [ -z "$PAPERCLIP_COMPANY_ID" ]; then
	echo "ERROR: PAPERCLIP_API_KEY and PAPERCLIP_COMPANY_ID must be set"
	exit 1
fi

echo "=== Delivery Metrics Report ==="
echo "Generated at $(date -u +%Y-%m-%dT%H:%M:%SZ)"

now=$(date +%s)
one_day_ago=$((now - 86400))
one_week_ago=$((now - 604800))

echo ""
echo "## Velocity (Lead Time)"
echo "---"

all_done=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=done&limit=200")

done_count=$(echo "$all_done" | jq '. | length')
echo "Total completed tasks: $done_count"

avg_lead_time=$(echo "$all_done" | jq -r --arg now "$now" '
def parse_time: . | if . == null then null else 
    (split("T")[0] + " " + split("T")[1][0:8]) | strptime("%Y-%m-%d %H:%M:%S") | mktime
end;
map({started: (.startedAt | parse_time), completed: (.completedAt | parse_time)}) |
map(select(.started != null and .completed != null)) |
map(.completed - .started) |
if length > 0 then (add / length / 3600) else null end
')

if [ -n "$avg_lead_time" ] && [ "$avg_lead_time" != "null" ]; then
	echo "Average lead time: ${avg_lead_time}h"
else
	echo "Average lead time: N/A"
fi

echo ""
echo "## Fluidity (Handoff Latency)"
echo "---"

handoff_count=0
handoff_total_delay=0

echo "$all_done" | jq -r '.[] | @json' | while IFS= read -r task; do
	completed=$(echo "$task" | jq -r '.completedAt')
	if [ "$completed" != "null" ]; then
		handoff_count=$((handoff_count + 1))
	fi
done

echo "Tasks with handoff tracking: $handoff_count"

echo ""
echo "## Quality Rate"
echo "---"

in_review=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=in_review&limit=100")

review_count=$(echo "$in_review" | jq '. | length')
echo "Tasks in review: $review_count"

total_tracked=$((done_count + review_count))
if [ "$total_tracked" -gt 0 ]; then
	quality_rate=$(echo "scale=2; ($done_count / $total_tracked) * 100" | bc 2>/dev/null || echo "N/A")
	echo "Quality rate (done/total): ${quality_rate}%"
fi

echo ""
echo "## Stale Task Metrics"
echo "---"

in_progress=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=in_progress&limit=200")

in_progress_count=$(echo "$in_progress" | jq '. | length')
echo "Tasks in progress: $in_progress_count"

STALE_THRESHOLD=14400
stale_count=0
stale_l1=0
stale_l2=0
stale_l3=0

echo "$in_progress" | jq -r '.[] | @json' | while IFS= read -r task; do
	updated=$(echo "$task" | jq -r '.updatedAt')
	priority=$(echo "$task" | jq -r '.priority // "medium"')
	updated_epoch=$(date -d "$updated" +%s 2>/dev/null || echo "$now")
	age_seconds=$((now - updated_epoch))

	if [ $age_seconds -ge 43200 ]; then
		stale_l3=$((stale_l3 + 1))
		stale_count=$((stale_count + 1))
	elif [ $age_seconds -ge 28800 ]; then
		stale_l2=$((stale_l2 + 1))
		stale_count=$((stale_count + 1))
	elif [ $age_seconds -ge $STALE_THRESHOLD ]; then
		stale_l1=$((stale_l1 + 1))
		stale_count=$((stale_count + 1))
	fi
done

echo "Stale tasks (>4h without update): $stale_count"
echo "  L1 (4-8h): $stale_l1"
echo "  L2 (8-12h): $stale_l2"
echo "  L3 (>12h): $stale_l3"

if [ $stale_count -gt 0 ]; then
	echo ""
	echo "### Stale Task Details"
	echo "| Task | Age | Priority |"
	echo "|------|-----|----------|"

	echo "$in_progress" | jq -r '.[] | @json' | while IFS= read -r task; do
		identifier=$(echo "$task" | jq -r '.identifier')
		updated=$(echo "$task" | jq -r '.updatedAt')
		priority=$(echo "$task" | jq -r '.priority // "medium"')
		updated_epoch=$(date -d "$updated" +%s 2>/dev/null || echo "$now")
		age_seconds=$((now - updated_epoch))
		age_hours=$((age_seconds / 3600))

		if [ $age_seconds -ge $STALE_THRESHOLD ]; then
			echo "| $identifier | ${age_hours}h | $priority |"
		fi
	done
fi

echo ""
echo "## Blocker Metrics"
echo "---"

blocked=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=blocked&limit=100")

blocked_count=$(echo "$blocked" | jq '. | length')
echo "Currently blocked tasks: $blocked_count"

if [ "$blocked_count" -gt 0 ]; then
	echo ""
	echo "### Blocked Task Details"
	echo "| Task | Duration | Age |"
	echo "|------|----------|-----|"

	echo "$blocked" | jq -r '.[] | @json' | while IFS= read -r task; do
		identifier=$(echo "$task" | jq -r '.identifier')
		updated=$(echo "$task" | jq -r '.updatedAt')
		updated_epoch=$(date -d "${updated%.*}" +%s 2>/dev/null || echo "$now")
		age_seconds=$((now - updated_epoch))
		age_hours=$((age_seconds / 3600))

		echo "| $identifier | ${age_hours}h | blocked |"
	done
fi

echo ""
echo "## Agent Activity"
echo "---"

agents=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
	"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/agents")

echo "| Agent | Status | Active Tasks |"
echo "|-------|--------|--------------|"

echo "$agents" | jq -r '.[] | @json' | while IFS= read -r agent; do
	name=$(echo "$agent" | jq -r '.name')
	status=$(echo "$agent" | jq -r '.status')
	agent_id=$(echo "$agent" | jq -r '.id')

	active_tasks=$(curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
		"$PAPERCLIP_API_URL/api/companies/$PAPERCLIP_COMPANY_ID/issues?status=in_progress&assigneeAgentId=$agent_id&limit=100" |
		jq '. | length')

	echo "| $name | $status | $active_tasks |"
done

echo ""
echo "## Summary"
echo "---"
echo "| Metric | Value |"
echo "|--------|-------|"
echo "| Total Completed | $done_count |"
echo "| In Review | $review_count |"
echo "| Blocked | $blocked_count |"

echo ""
echo "Report generated at $(date -u +%Y-%m-%dT%H:%M:%SZ)"
