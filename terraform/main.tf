terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ECR Repository for Docker images
module "ecr" {
  source = "./modules/ecr"

  app_name    = var.app_name
  environment = var.environment
  tags        = local.common_tags
}

# Networking (VPC, Subnets, Security Groups)
module "networking" {
  source = "./modules/networking"

  app_name    = var.app_name
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  tags        = local.common_tags
}

# Compute (ECS Fargate)
module "compute" {
  source = "./modules/compute"

  app_name         = var.app_name
  environment      = var.environment
  container_image  = module.ecr.repository_url
  container_port   = var.container_port
  cpu              = var.cpu
  memory           = var.memory
  desired_count    = var.desired_count
  vpc_id           = module.networking.vpc_id
  private_subnets  = module.networking.private_subnet_ids
  public_subnets   = module.networking.public_subnet_ids
  security_groups  = [module.networking.ecs_security_group_id]
  tags             = local.common_tags
}

# Monitoring (CloudWatch)
module "monitoring" {
  source = "./modules/monitoring"

  app_name        = var.app_name
  environment     = var.environment
  log_group_name  = module.compute.log_group_name
  alarm_email     = var.alarm_email
  tags            = local.common_tags
}

# Local values
locals {
  common_tags = {
    Application = var.app_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "dvd-shop-calculator"
  }
}
