# Infrastructure Documentation

This document describes the cloud infrastructure for the DVD Shop Calculator.

## Overview

The application is deployed on AWS using ECS Fargate for container orchestration.

## Architecture Diagram

```
                                    ┌─────────────────────────────────────────┐
                                    │              AWS Cloud                   │
                                    │                                          │
┌──────────┐    ┌──────────────┐   │  ┌──────────────────────────────────┐   │
│  Users   │───▶│   Route 53   │───┼─▶│     Application Load Balancer    │   │
└──────────┘    └──────────────┘   │  └──────────────────────────────────┘   │
                                    │                    │                     │
                                    │  ┌─────────────────┴─────────────────┐  │
                                    │  │            Public Subnets          │  │
                                    │  └─────────────────┬─────────────────┘  │
                                    │                    │                     │
                                    │  ┌─────────────────▼─────────────────┐  │
                                    │  │          Private Subnets           │  │
                                    │  │  ┌───────────┐  ┌───────────┐     │  │
                                    │  │  │ECS Task 1 │  │ECS Task 2 │     │  │
                                    │  │  └───────────┘  └───────────┘     │  │
                                    │  └───────────────────────────────────┘  │
                                    │                    │                     │
                                    │  ┌─────────────────▼─────────────────┐  │
                                    │  │           NAT Gateway              │  │
                                    │  └───────────────────────────────────┘  │
                                    │                                          │
                                    │  ┌───────────────────────────────────┐  │
                                    │  │   CloudWatch │ ECR │ S3 (state)   │  │
                                    │  └───────────────────────────────────┘  │
                                    └─────────────────────────────────────────┘
```

## Components

### Networking (VPC)

- **VPC**: Isolated network with custom CIDR block
- **Public Subnets**: Host ALB and NAT Gateway (2 AZs)
- **Private Subnets**: Host ECS tasks (2 AZs)
- **NAT Gateway**: Allows private subnet internet access
- **Internet Gateway**: Public subnet internet access

### Compute (ECS Fargate)

- **ECS Cluster**: Container orchestration
- **ECS Service**: Manages desired task count
- **ECS Task Definition**: Container configuration
- **Auto Scaling**: Based on CPU/Memory utilization

### Load Balancing

- **Application Load Balancer**: HTTP/HTTPS traffic distribution
- **Target Group**: Health checks and routing
- **Listener**: Port 80 (HTTP) and 443 (HTTPS)

### Container Registry (ECR)

- **Repository**: Stores Docker images
- **Lifecycle Policy**: Keeps last 10 images
- **Image Scanning**: Vulnerability scanning on push

### Monitoring (CloudWatch)

- **Log Groups**: Application and access logs
- **Metrics**: Request count, latency, error rates
- **Alarms**: High error rate, response time
- **Dashboard**: Real-time monitoring

## Terraform Modules

### Module: ecr
Creates ECR repository for Docker images.

```hcl
module "ecr" {
  source = "./modules/ecr"
  app_name = "dvd-shop-calculator"
  environment = "prod"
}
```

### Module: networking
Creates VPC, subnets, and security groups.

```hcl
module "networking" {
  source = "./modules/networking"
  vpc_cidr = "10.0.0.0/16"
}
```

### Module: compute
Creates ECS cluster, service, and ALB.

```hcl
module "compute" {
  source = "./modules/compute"
  container_image = module.ecr.repository_url
  desired_count = 3
}
```

### Module: monitoring
Creates CloudWatch alarms and dashboards.

```hcl
module "monitoring" {
  source = "./modules/monitoring"
  alarm_email = "alerts@example.com"
}
```

## Environment Configuration

| Environment | CPU | Memory | Instances | VPC CIDR |
|-------------|-----|--------|-----------|----------|
| dev | 256 | 512 MB | 1 | 10.0.0.0/16 |
| staging | 512 | 1024 MB | 2 | 10.1.0.0/16 |
| prod | 1024 | 2048 MB | 3 | 10.2.0.0/16 |

## Security

### Security Groups

1. **ALB Security Group**
   - Inbound: 80, 443 from 0.0.0.0/0
   - Outbound: All traffic

2. **ECS Security Group**
   - Inbound: All traffic from ALB SG
   - Outbound: All traffic

### IAM Roles

1. **ECS Task Execution Role**
   - Pull images from ECR
   - Write logs to CloudWatch

2. **ECS Task Role**
   - Application-specific permissions

## Cost Estimation

| Component | Monthly Cost (approx) |
|-----------|----------------------|
| ECS Fargate (3 tasks) | $50-100 |
| ALB | $20-30 |
| NAT Gateway | $35-50 |
| CloudWatch | $10-20 |
| ECR | $1-5 |
| **Total** | **$116-205** |

## Scaling

### Horizontal Scaling

```hcl
resource "aws_appautoscaling_target" "ecs" {
  min_capacity       = 2
  max_capacity       = 10
  resource_id        = "service/${cluster}/${service}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}
```

### Scaling Policies

- Scale up: CPU > 70% for 2 minutes
- Scale down: CPU < 30% for 5 minutes

## Disaster Recovery

1. **Multi-AZ Deployment**: Tasks spread across 2 AZs
2. **Health Checks**: Automatic replacement of unhealthy tasks
3. **Terraform State**: Encrypted S3 with versioning
4. **Image Retention**: Last 10 images kept in ECR

## Troubleshooting

### Check ECS Service Status
```bash
aws ecs describe-services \
  --cluster dvd-shop-calculator-prod \
  --services dvd-shop-calculator-prod
```

### View Application Logs
```bash
aws logs tail /ecs/dvd-shop-calculator-prod --follow
```

### Check ALB Health
```bash
aws elbv2 describe-target-health \
  --target-group-arn <arn>
```
