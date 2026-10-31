#!/usr/bin/env bash
set -euo pipefail
cd /workspace/han_phong_ai_tools
npm ci
npm run typecheck
npm test
npm run build
