#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

ENVIRONMENT="${1:-staging}"
GATE_FAILED=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() {
	echo -e "${GREEN}[PASS]${NC} $1"
}

fail() {
	echo -e "${RED}[FAIL]${NC} $1"
	GATE_FAILED=1
}

warn() {
	echo -e "${YELLOW}[WARN]${NC} $1"
}

echo "=== Pre-deploy Validation for $ENVIRONMENT ==="
echo ""

cd "$ROOT_DIR"

echo "--- G1 Gate: Local Validation ---"
echo ""

echo "Checking git status..."
if [ -n "$(git status --porcelain)" ]; then
	fail "Uncommitted changes detected. Commit or stash before deploying."
	git status --short
else
	pass "No uncommitted changes"
fi

echo ""
echo "Running lint check..."
if npm run lint >/dev/null 2>&1; then
	pass "Lint passed"
else
	fail "Lint failed"
fi

echo ""
echo "Running type check..."
if npm run typecheck >/dev/null 2>&1; then
	pass "Type check passed"
else
	fail "Type check failed"
fi

echo ""
echo "Running unit tests..."
if npm test >/dev/null 2>&1; then
	pass "Unit tests passed"
else
	fail "Unit tests failed"
fi

echo ""
echo "--- G2 Gate: Pre-merge Validation ---"
echo ""

echo "Checking branch..."
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

if [ "$ENVIRONMENT" = "staging" ]; then
	if [ "$CURRENT_BRANCH" != "dev" ]; then
		warn "Deploying to staging typically from 'dev' branch"
	fi

	echo ""
	echo "Checking PR status..."
	if command -v gh &>/dev/null; then
		PR_COUNT=$(gh pr list --state open --base staging --json number --jq length 2>/dev/null || echo "0")
		if [ "$PR_COUNT" -gt 0 ]; then
			warn "$PR_COUNT open PR(s) targeting staging"
		else
			pass "No blocking PRs"
		fi
	else
		warn "GitHub CLI not available, skipping PR check"
	fi

	echo ""
	echo "Checking environment file..."
	if [ -f ".env.staging" ] || [ -f "staging/.env.staging" ]; then
		pass "Staging environment file exists"

		if grep -q "CHANGE_ME" ".env.staging" 2>/dev/null || grep -q "CHANGE_ME" "staging/.env.staging" 2>/dev/null; then
			fail "Staging env file contains placeholder values"
		fi
	else
		fail "Staging environment file not found"
	fi
fi

if [ "$ENVIRONMENT" = "production" ]; then
	echo ""
	echo "Checking production environment..."
	if [ -f ".env.prod" ] || [ -f "prod/.env.prod" ]; then
		pass "Production environment file exists"

		if grep -q "CHANGE_ME" ".env.prod" 2>/dev/null || grep -q "CHANGE_ME" "prod/.env.prod" 2>/dev/null; then
			fail "Production env file contains placeholder values"
		fi
	else
		fail "Production environment file not found"
	fi

	echo ""
	echo "Checking migration compatibility..."
	if [ -d "migrations" ]; then
		MIGRATION_COUNT=$(ls migrations/*.sql 2>/dev/null | wc -l)
		echo "Found $MIGRATION_COUNT migration file(s)"
		pass "Migrations directory exists"
	fi

	echo ""
	echo "Checking rollback plan..."
	if [ -f "DOCS/rollback.md" ]; then
		pass "Rollback documentation exists"
	else
		fail "Rollback documentation not found"
	fi
fi

echo ""
echo "--- Docker Validation ---"
echo ""

echo "Checking Dockerfile..."
if [ -f "Dockerfile" ]; then
	pass "Dockerfile exists"
else
	fail "Dockerfile not found"
fi

echo ""
echo "Checking docker-compose file..."
if [ -f "docker-compose.staging.yml" ]; then
	pass "Staging docker-compose exists"
else
	warn "Staging docker-compose not found"
fi

echo ""
echo "--- Final Gate Check ---"
echo ""

if [ $GATE_FAILED -eq 0 ]; then
	echo -e "${GREEN}All gate checks PASSED${NC}"
	echo "Ready for deployment"
	exit 0
else
	echo -e "${RED}Gate validation FAILED${NC}"
	echo "Fix issues before deploying"
	exit 1
fi
