#!/bin/bash
set -e

echo "📋 Planning Terraform changes..."

ENV=${1:-dev}

cd "$(dirname "$0")/../environments/$ENV"

terraform plan -var-file=terraform.tfvars -out=tfplan

echo "✅ Terraform plan complete for $ENV environment"
echo "   Review the plan above and run apply.sh to apply changes"
