#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

ENVIRONMENT="${1:-staging}"
TIMEOUT="${TIMEOUT:-120}"
INTERVAL="${INTERVAL:-5}"

BASE_URL="${STAGING_URL:-http://localhost:3000}"
TOKEN="${STAGING_SMOKE_TEST_TOKEN:-}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Stage Smoke Test${NC}"
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

wait_for_health() {
	local url="$1"
	local elapsed=0

	echo "Waiting for service..."
	while [ $elapsed -lt $TIMEOUT ]; do
		if curl -sf "${url}/health" >/dev/null 2>&1; then
			echo -e "${GREEN}Service is healthy${NC}"
			return 0
		fi
		sleep $INTERVAL
		elapsed=$((elapsed + INTERVAL))
		echo "Waiting... (${elapsed}s/${TIMEOUT}s)"
	done

	echo -e "${RED}ERROR: Service did not respond within ${TIMEOUT}s${NC}"
	return 1
}

run_tests() {
	local failed=0

	echo ""
	echo "--- Test Results ---"

	echo "[1/5] Health endpoint..."
	if curl -sf "${BASE_URL}/health" | grep -q '"status":"ok"'; then
		echo -e "  ${GREEN}PASS${NC}: Health check"
	else
		echo -e "  ${RED}FAIL${NC}: Health check"
		failed=1
	fi

	echo "[2/5] API health..."
	local api_response
	api_response=$(curl -s "${BASE_URL}/api/health" 2>&1)
	if echo "$api_response" | grep -qE '(ok|error|token)'; then
		echo -e "  ${GREEN}PASS${NC}: API responding"
	else
		echo -e "  ${YELLOW}WARN${NC}: API check (auth may be required)"
	fi

	echo "[3/5] Response time..."
	local response_time
	response_time=$(curl -o /dev/null -s -w '%{time_total}' "${BASE_URL}/health")
	local response_ms
	response_ms=$(echo "$response_time * 1000" | awk '{printf "%.0f", $1}')
	echo "  Response: ${response_ms}ms"
	if [ "${response_ms:-0}" -lt 500 ]; then
		echo -e "  ${GREEN}PASS${NC}: Response time acceptable"
	else
		echo -e "  ${YELLOW}WARN${NC}: Response time > 500ms"
	fi

	echo "[4/5] Static assets..."
	if curl -sf "${BASE_URL}/" | grep -q "<!DOCTYPE html>"; then
		echo -e "  ${GREEN}PASS${NC}: Static assets served"
	else
		echo -e "  ${YELLOW}WARN${NC}: Static assets (SPA routing)"
	fi

	echo "[5/5] HTTP status..."
	local http_code
	http_code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health")
	if [ "$http_code" = "200" ]; then
		echo -e "  ${GREEN}PASS${NC}: HTTP $http_code"
	else
		echo -e "  ${RED}FAIL${NC}: HTTP $http_code"
		failed=1
	fi

	if [ -n "$TOKEN" ]; then
		echo ""
		echo "[BONUS] Authenticated endpoints..."
		if curl -sf -H "Authorization: Bearer $TOKEN" "${BASE_URL}/api/projects" | grep -qE '^\['; then
			echo -e "  ${GREEN}PASS${NC}: Authenticated requests"
		else
			echo -e "  ${YELLOW}WARN${NC}: Authenticated endpoint check"
		fi
	fi

	echo ""
	echo "=== Summary ==="
	if [ $failed -eq 0 ]; then
		echo -e "${GREEN}All tests PASSED${NC}"
		exit 0
	else
		echo -e "${RED}Some tests FAILED${NC}"
		exit 1
	fi
}

cd "$ROOT_DIR"

if ! wait_for_health "$BASE_URL"; then
	echo -e "${RED}ERROR: Service is not healthy${NC}"
	exit 1
fi

run_tests
