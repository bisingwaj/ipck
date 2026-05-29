#!/usr/bin/env bash
# Smoke tests post-déploiement. Usage : BASE_URL=https://api... ./scripts/smoke.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3333}"
API="$BASE_URL/api/v1"
fail() { echo "✗ $1"; exit 1; }

echo "→ Smoke tests sur $BASE_URL"

# 1. Health
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/health")
[ "$code" = "200" ] || fail "health a renvoyé $code"
echo "✓ /health 200"

# 2. Swagger
code=$(curl -s -o /dev/null -w '%{http_code}' "$BASE_URL/docs")
[ "$code" = "200" ] || fail "/docs a renvoyé $code"
echo "✓ /docs 200"

# 3. Endpoint public de référence
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/reference/service-times")
[ "$code" = "200" ] || fail "/reference/service-times a renvoyé $code"
echo "✓ /reference/service-times 200"

# 4. Auth protégé sans token → 401
code=$(curl -s -o /dev/null -w '%{http_code}' "$API/auth/me")
[ "$code" = "401" ] || fail "/auth/me sans token devrait renvoyer 401 (reçu $code)"
echo "✓ /auth/me protégé (401)"

# 5. Demande OTP (parcours auth)
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/auth/otp/request" \
  -H 'Content-Type: application/json' -d '{"phone":"+243810000099"}')
[ "$code" = "200" ] || fail "OTP request a renvoyé $code"
echo "✓ POST /auth/otp/request 200"

echo "✅ Smoke tests OK"
