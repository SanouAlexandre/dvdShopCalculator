#!/bin/bash
set -e

ENV=${1:-dev}

echo "🚀 Deploying DVD Shop Calculator to $ENV..."

# Validate environment
if [[ ! "$ENV" =~ ^(dev|staging|prod)$ ]]; then
    echo "❌ Invalid environment: $ENV"
    echo "   Valid options: dev, staging, prod"
    exit 1
fi

# Build the application
echo "📦 Building application..."
./scripts/build.sh

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t dvd-shop-calculator:latest -f docker/Dockerfile .

# Tag with environment and git commit
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
docker tag dvd-shop-calculator:latest dvd-shop-calculator:$ENV-$GIT_COMMIT

echo "📤 Pushing Docker image..."
# Uncomment and configure for your registry
# AWS ECR example:
# aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.eu-west-1.amazonaws.com
# docker tag dvd-shop-calculator:$ENV-$GIT_COMMIT <account>.dkr.ecr.eu-west-1.amazonaws.com/dvd-shop-calculator:$ENV-$GIT_COMMIT
# docker push <account>.dkr.ecr.eu-west-1.amazonaws.com/dvd-shop-calculator:$ENV-$GIT_COMMIT

# Deploy infrastructure with Terraform
echo "🏗️ Deploying infrastructure..."
cd terraform/environments/$ENV
terraform init
terraform plan -var-file=terraform.tfvars -out=tfplan
terraform apply -auto-approve tfplan

echo "✅ Deployment to $ENV complete!"
