#!/bin/bash
set -e

echo "🚀 Applying Terraform changes..."

ENV=${1:-dev}
AUTO_APPROVE=${2:-false}

cd "$(dirname "$0")/../environments/$ENV"

if [ "$AUTO_APPROVE" = "true" ] || [ "$AUTO_APPROVE" = "-auto-approve" ]; then
    terraform apply -auto-approve tfplan
else
    terraform apply tfplan
fi

echo "✅ Terraform apply complete for $ENV environment"
