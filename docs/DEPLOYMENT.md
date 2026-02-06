# Deployment Guide

This document describes how to deploy the DVD Shop Calculator to various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [CI/CD Pipeline](#cicd-pipeline)
- [Rollback Procedures](#rollback-procedures)

## Prerequisites

- Docker >= 24.x
- Terraform >= 1.6.x
- AWS CLI (for AWS deployment)
- Access to container registry

## Local Development

### Using Node.js directly

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

| Command | Description |
|---------|-------------|
| `npm start` | Start web server (http://localhost:3000) |
| `npm run start:cli` | Start interactive CLI mode |
| `npm run start:dev` | Start web server in development mode (with ts-node) |
| `npm run start:cli:dev` | Start CLI in development mode |

### Using Docker Compose

```bash
# Start the development environment
docker-compose -f docker/docker-compose.yml up

# Rebuild after changes
docker-compose -f docker/docker-compose.yml up --build
```

## Docker Deployment

### Building the Production Image

```bash
# Build the image
docker build -t dvd-shop-calculator:latest -f docker/Dockerfile .

# Run locally
docker run -p 3000:3000 dvd-shop-calculator:latest

# Test the health endpoint
curl http://localhost:3000/health
```

### Pushing to Container Registry

```bash
# AWS ECR
aws ecr get-login-password --region eu-west-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.eu-west-1.amazonaws.com
docker tag dvd-shop-calculator:latest <account>.dkr.ecr.eu-west-1.amazonaws.com/dvd-shop-calculator:v1.0.0
docker push <account>.dkr.ecr.eu-west-1.amazonaws.com/dvd-shop-calculator:v1.0.0

# GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
docker tag dvd-shop-calculator:latest ghcr.io/org/dvd-shop-calculator:v1.0.0
docker push ghcr.io/org/dvd-shop-calculator:v1.0.0
```

## Cloud Deployment

### Vercel (Serverless)

The project is configured for automatic deployment to Vercel.

**Live URL**: https://dvd-shop-calculator.vercel.app

**Configuration files**:
- `vercel.json` - Routing and build configuration
- `api/index.ts` - Serverless function entry point
- `public/` - Static files (auto-served)

**Automatic deployment**:
1. Push to `main` branch
2. Vercel builds and deploys automatically
3. Preview deployments created for PRs

**Environment notes**:
- File logging is disabled on Vercel (read-only filesystem)
- The `VERCEL` environment variable is automatically set
- Static files are served from `public/` folder

### AWS (ECS Fargate)

1. **Initialize Terraform**
   ```bash
   cd terraform/environments/dev
   terraform init
   ```

2. **Review the plan**
   ```bash
   terraform plan -var-file=terraform.tfvars
   ```

3. **Apply changes**
   ```bash
   terraform apply -var-file=terraform.tfvars
   ```

4. **Get the endpoint**
   ```bash
   terraform output api_endpoint
   ```

### Environment-Specific Deployment

```bash
# Development
./scripts/deploy.sh dev

# Staging
./scripts/deploy.sh staging

# Production
./scripts/deploy.sh prod
```

## CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline runs automatically:

- **On Push to main/develop**: Lint, test, build, Docker build
- **On Tag (v*)**: Full deployment to production
- **On PR**: Lint, test, build validation

### Manual Deployment

1. Create a release tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

2. The CD pipeline will automatically:
   - Build and push the Docker image
   - Deploy to staging
   - Wait for approval
   - Deploy to production

## Infrastructure Management

### Terraform State

State is stored in S3 with DynamoDB locking:

```hcl
backend "s3" {
  bucket         = "dvd-shop-terraform-state"
  key            = "env/terraform.tfstate"
  region         = "eu-west-1"
  encrypt        = true
  dynamodb_table = "dvd-shop-terraform-locks"
}
```

### Resource Scaling

Modify `terraform.tfvars` for each environment:

```hcl
# Development
desired_count = 1
cpu           = 256
memory        = 512

# Production
desired_count = 3
cpu           = 1024
memory        = 2048
```

## Rollback Procedures

### Application Rollback

1. **Via Git tag**:
   ```bash
   git checkout v1.0.0
   ./scripts/deploy.sh prod
   ```

2. **Via Docker image**:
   ```bash
   docker pull <registry>/dvd-shop-calculator:v1.0.0
   # Update ECS task definition with previous image
   ```

### Infrastructure Rollback

```bash
cd terraform/environments/prod
terraform plan -target=module.compute -out=rollback.tfplan
terraform apply rollback.tfplan
```

## Health Checks

### Application Health

```bash
# Health endpoint
curl http://your-domain.com/health

# Expected response
{"status":"healthy","timestamp":"2026-02-04T12:00:00.000Z"}
```

### Infrastructure Health

```bash
# Check ECS service
aws ecs describe-services --cluster dvd-shop-calculator-prod --services dvd-shop-calculator-prod

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn <target-group-arn>
```

## Monitoring

### CloudWatch Dashboards

Access the dashboard at:
`https://console.aws.amazon.com/cloudwatch/home?region=eu-west-1#dashboards:name=dvd-shop-calculator-prod`

### Alerts

Alerts are sent via SNS to configured email addresses for:
- High error rates (5XX > 10 in 5 minutes)
- High response times (> 1 second average)

## Troubleshooting

### Common Issues

1. **Container fails to start**
   - Check CloudWatch logs: `/ecs/dvd-shop-calculator-{env}`
   - Verify environment variables

2. **Health check failing**
   - Ensure port 3000 is exposed
   - Check security group rules

3. **Terraform state locked**
   ```bash
   terraform force-unlock <lock-id>
   ```
