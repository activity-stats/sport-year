#!/bin/bash

# Local CI Validation Script
# Simulates GitHub Actions CI checks locally

set -e

echo "🚀 Running local CI validation..."
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILED=0

run_check() {
    local name=$1
    local command=$2

    echo "▶ Running: $name"
    if eval "$command"; then
        echo -e "${GREEN}✅ $name passed${NC}"
        echo ""
    else
        echo -e "${RED}❌ $name failed${NC}"
        echo ""
        FAILED=$((FAILED + 1))
    fi
}

# Quality Checks
echo "═══════════════════════════════════"
echo "  Code Quality Checks"
echo "═══════════════════════════════════"
echo ""

run_check "Type Check" "npm run type-check"
run_check "ESLint" "npm run lint"
run_check "Prettier Format Check" "npm run format:check"

# Test
echo "═══════════════════════════════════"
echo "  Tests"
echo "═══════════════════════════════════"
echo ""

run_check "Test Suite" "npm test -- --run"

# Security
echo "═══════════════════════════════════"
echo "  Security Audit"
echo "═══════════════════════════════════"
echo ""

run_check "npm audit" "npm audit --audit-level=moderate || true"

# Build
echo "═══════════════════════════════════"
echo "  Build"
echo "═══════════════════════════════════"
echo ""

run_check "Production Build" "NODE_ENV=production npm run build"

# Summary
echo ""
echo "═══════════════════════════════════"
echo "  Summary"
echo "═══════════════════════════════════"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to push.${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED check(s) failed. Please fix before pushing.${NC}"
    exit 1
fi
