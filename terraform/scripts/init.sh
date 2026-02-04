#!/bin/bash
set -e

echo "🔧 Initializing Terraform..."

ENV=${1:-dev}

cd "$(dirname "$0")/../environments/$ENV"

terraform init -upgrade

echo "✅ Terraform initialized for $ENV environment"
