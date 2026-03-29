#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

ENVIRONMENT="${1:-staging}"
TIMEOUT="${TIMEOUT:-60}"
INTERVAL="${INTERVAL:-5}"

declare -A ENV_URLS=(
	["staging"]="${SMOKE_TEST_URL:-http://localhost:3000}"
	["production"]="${SMOKE_TEST_URL:-http://localhost:3000}"
	["dev"]="${SMOKE_TEST_URL:-http://localhost:3000}"
)

BASE_URL="${ENV_URLS[$ENVIRONMENT]:-${SMOKE_TEST_URL:-http://localhost:3000}}"
TOKEN="${SMOKE_TEST_TOKEN:-}"

echo "=== Smoke Test for $ENVIRONMENT ==="
echo "Base URL: $BASE_URL"
echo "Timeout: ${TIMEOUT}s, Interval: ${INTERVAL}s"
echo ""

wait_for_health() {
	local url="$1"
	local elapsed=0

	echo "Waiting for health endpoint..."
	while [ $elapsed -lt $TIMEOUT ]; do
		if curl -sf "${url}/health" >/dev/null 2>&1; then
			echo "Health endpoint responded successfully"
			return 0
		fi
		sleep $INTERVAL
		elapsed=$((elapsed + INTERVAL))
		echo "Waiting... (${elapsed}s/${TIMEOUT}s)"
	done

	echo "ERROR: Health endpoint did not respond within ${TIMEOUT}s"
	return 1
}

run_smoke_tests() {
	local failed=0

	echo ""
	echo "=== Running Smoke Tests ==="
	echo ""

	echo "[1/5] Testing health endpoint..."
	if curl -sf "${BASE_URL}/health" | grep -q '"status":"ok"'; then
		echo "  PASS: Health check"
	else
		echo "  FAIL: Health check"
		failed=1
	fi

	echo "[2/5] Testing API health..."
	if curl -sf "${BASE_URL}/api/health" >/dev/null 2>&1; then
		echo "  PASS: API health"
	else
		echo "  FAIL: API health"
		failed=1
	fi

	echo "[3/5] Testing static assets..."
	if curl -sf "${BASE_URL}/" | grep -q "<!DOCTYPE html>"; then
		echo "  PASS: Static assets"
	else
		echo "  WARN: Static assets (may be SPA routing)"
	fi

	echo "[4/5] Testing response time..."
	local response_time
	response_time=$(curl -o /dev/null -s -w '%{time_total}' "${BASE_URL}/health")
	local response_ms
	response_ms=$(echo "$response_time * 1000" | bc | cut -d'.' -f1)
	echo "  Response time: ${response_ms}ms"
	if [ "${response_ms:-0}" -lt 500 ]; then
		echo "  PASS: Response time < 500ms"
	else
		echo "  WARN: Response time > 500ms"
	fi

	echo "[5/5] Testing error rate (sample)..."
	local http_code
	http_code=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health")
	if [ "$http_code" = "200" ]; then
		echo "  PASS: No errors on health endpoint"
	else
		echo "  FAIL: Got HTTP $http_code"
		failed=1
	fi

	if [ -n "$TOKEN" ]; then
		echo ""
		echo "[BONUS] Testing authenticated endpoint..."
		if curl -sf -H "Authorization: Bearer $TOKEN" "${BASE_URL}/api/projects" | grep -qE '^\['; then
			echo "  PASS: Authenticated request"
		else
			echo "  WARN: Authenticated endpoint check"
		fi
	fi

	echo ""
	echo "=== Smoke Test Results ==="
	if [ $failed -eq 0 ]; then
		echo "All smoke tests PASSED"
		exit 0
	else
		echo "Some smoke tests FAILED"
		exit 1
	fi
}

cd "$ROOT_DIR"

if ! wait_for_health "$BASE_URL"; then
	echo ""
	echo "ERROR: Service is not healthy"
	exit 1
fi

run_smoke_tests
