# BillSaver Backend Infrastructure - Phase 3
# HIPAA-Compliant Cloud Infrastructure with AWS

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state management
  backend "s3" {
    bucket         = "billsaver-terraform-state"
    key            = "phase3-backend/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "billsaver-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "BillSaver"
      Environment = var.environment
      Phase       = "3-Backend"
      ManagedBy   = "Terraform"
    }
  }
}

# VPC Configuration for HIPAA Compliance
module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
}

# Security Groups
module "security_groups" {
  source = "./modules/security-groups"

  environment = var.environment
  vpc_id      = module.vpc.vpc_id
}

# Database Layer with Encryption
module "database" {
  source = "./modules/database"

  environment          = var.environment
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.private_subnet_ids
  security_group_ids  = [module.security_groups.database_sg_id]
  instance_class      = var.db_instance_class
  allocated_storage   = var.db_allocated_storage
  multi_az           = var.environment == "prod"
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  environment         = var.environment
  vpc_id              = module.vpc.vpc_id
  subnet_ids          = module.vpc.public_subnet_ids
  security_group_ids  = [module.security_groups.alb_sg_id]
  certificate_arn     = module.acm.certificate_arn
}

# ECS Cluster for Containerized Backend
module "ecs" {
  source = "./modules/ecs"

  environment        = var.environment
  vpc_id            = module.vpc.vpc_id
  subnet_ids        = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_sg_id]
  alb_target_group_arn = module.alb.target_group_arn
}

# SSL Certificate Management
module "acm" {
  source = "./modules/acm"

  domain_name = var.domain_name
  environment = var.environment
}

# CloudWatch Monitoring and Logging
module "monitoring" {
  source = "./modules/monitoring"

  environment = var.environment
  ecs_cluster_name = module.ecs.cluster_name
  alb_arn_suffix   = module.alb.alb_arn_suffix
  db_instance_id   = module.database.db_instance_id
}

# WAF for Security
module "waf" {
  source = "./modules/waf"

  environment = var.environment
  alb_arn     = module.alb.alb_arn
}

# Backup Configuration
module "backup" {
  source = "./modules/backup"

  environment = var.environment
  db_arn      = module.database.db_arn
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "ALB DNS name"
  value       = module.alb.alb_dns_name
}

output "database_endpoint" {
  description = "Database endpoint"
  value       = module.database.db_endpoint
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}
