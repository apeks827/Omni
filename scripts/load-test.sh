#!/bin/bash
set -euo pipefail

ENVIRONMENT="${1:-staging}"
TARGET_URL="${LOAD_TEST_URL:-http://localhost:3000}"
DURATION="${2:-60}"
VUS="${3:-10}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

fail() {
	echo -e "${RED}[ERROR]${NC} $1"
	exit 1
}

pass() {
	echo -e "${GREEN}[OK]${NC} $1"
}

warn() {
	echo -e "${YELLOW}[WARN]${NC} $1"
}

if [ "$ENVIRONMENT" = "staging" ]; then
	TARGET_URL="${LOAD_TEST_URL:-http://192.168.1.58:3000}"
elif [ "$ENVIRONMENT" = "production" ]; then
	if [ -z "${LOAD_TEST_URL:-}" ]; then
		fail "LOAD_TEST_URL must be set for production load testing"
	fi
	TARGET_URL="$LOAD_TEST_URL"
fi

echo "=== Omni Load Test ==="
echo "Environment: $ENVIRONMENT"
echo "Target: $TARGET_URL"
echo "Duration: ${DURATION}s"
echo "Virtual Users: $VUS"
echo ""

if command -v k6 &>/dev/null; then
	echo "Using k6 for load testing..."

	cat >/tmp/load-test.js <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '10s', target: $VUS },
    { duration: '${DURATION}s', target: $VUS },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'errors': ['rate<0.05'],
  },
};

export default function () {
  const res = http.get('$TARGET_URL/health');
  
  responseTime.add(res.timings.duration);
  errorRate.add(res.status !== 200);
  
  check(res, {
    'health check status 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
  
  const apiRes = http.get('$TARGET_URL/api/health');
  errorRate.add(apiRes.status !== 200);
  
  check(apiRes, {
    'api health status 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
EOF

	k6 run /tmp/load-test.js
	pass "Load test complete"

elif command -v wrk &>/dev/null; then
	echo "Using wrk for load testing..."

	echo ""
	echo "Testing health endpoint..."
	wrk -t4 -c$VUS -d${DURATION}s --latency "$TARGET_URL/health"

	echo ""
	echo "Testing metrics endpoint..."
	wrk -t4 -c$VUS -d${DURATION}s --latency "$TARGET_URL/metrics"

	pass "Load test complete"

else
	echo "No load testing tool found (k6 or wrk)"
	echo ""
	echo "Installing k6 for load testing:"
	echo "  macOS: brew install k6"
	echo "  Linux: sudo gpg --krecv https://deb.k6.io/deb.key | sudo apt-key add -"
	echo "         echo 'deb https://deb.k6.io k6 main' | sudo tee /etc/apt/sources.list.d/k6.list"
	echo "         sudo apt-get update && sudo apt-get install k6"
	echo ""

	cat >/tmp/load-test-simple.sh <<EOF
#!/bin/bash
echo "Simple load test using curl..."
echo ""

for i in \$(seq 1 $VUS); do
	curl -s -o /dev/null -w "%{http_code} - %{time_total}s\n" "$TARGET_URL/health" &
done

wait
echo "Load test complete"
EOF

	chmod +x /tmp/load-test-simple.sh
	/tmp/load-test-simple.sh
fi

echo ""
echo "=== Load Test Summary ==="
echo "Environment: $ENVIRONMENT"
echo "Target: $TARGET_URL"
echo ""
echo "Performance Baselines:"
echo "  - p95 latency: < 500ms"
echo "  - Error rate: < 5%"
echo "  - Availability: > 99%"
echo ""
echo "If results exceed baselines, investigate:"
echo "  1. Database query performance"
echo "  2. API endpoint efficiency"
echo "  3. Resource utilization (CPU, memory)"
echo "  4. Network latency"
