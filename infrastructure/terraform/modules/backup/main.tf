# AWS Backup for HIPAA Compliance

# Backup Vault
resource "aws_backup_vault" "main" {
  name = "billsaver-${var.environment}-backup-vault"
  kms_key_arn = aws_kms_key.backup.arn

  tags = {
    Name = "billsaver-${var.environment}-backup-vault"
  }
}

# KMS Key for Backup Encryption
resource "aws_kms_key" "backup" {
  description             = "KMS key for backup encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow AWS Backup"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "billsaver-${var.environment}-backup-key"
  }
}

resource "aws_kms_alias" "backup" {
  name          = "alias/billsaver-${var.environment}-backup"
  target_key_id = aws_kms_key.backup.key_id
}

# Backup Plan
resource "aws_backup_plan" "main" {
  name = "billsaver-${var.environment}-backup-plan"

  rule {
    rule_name         = "daily-backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)" # Daily at 5 AM

    lifecycle {
      delete_after = var.backup_retention_days
    }

    copy_action {
      destination_vault_arn = aws_backup_vault.cross_region.arn

      lifecycle {
        delete_after = var.cross_region_retention_days
      }
    }
  }

  rule {
    rule_name         = "weekly-backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * SUN *)" # Weekly on Sunday at 5 AM

    lifecycle {
      delete_after = var.weekly_backup_retention_days
    }
  }

  tags = {
    Name = "billsaver-${var.environment}-backup-plan"
  }
}

# Cross-region Backup Vault
resource "aws_backup_vault" "cross_region" {
  provider = aws.cross_region

  name        = "billsaver-${var.environment}-cross-region-backup-vault"
  kms_key_arn = aws_kms_key.cross_region_backup.arn

  tags = {
    Name = "billsaver-${var.environment}-cross-region-backup-vault"
  }
}

# KMS Key for Cross-region Backup
resource "aws_kms_key" "cross_region_backup" {
  provider = aws.cross_region

  description             = "KMS key for cross-region backup encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "billsaver-${var.environment}-cross-region-backup-key"
  }
}

# Backup Selection for Database
resource "aws_backup_selection" "database" {
  name         = "billsaver-${var.environment}-db-backup"
  iam_role_arn = aws_iam_role.backup.arn
  plan_id      = aws_backup_plan.main.id

  resources = [
    var.db_arn
  ]
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup" {
  name = "billsaver-${var.environment}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = [
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
  ]
}

# Backup Vault Lock (for compliance)
resource "aws_backup_vault_lock_configuration" "main" {
  backup_vault_name = aws_backup_vault.main.name

  changeable_for_days = 3
  max_retention_days  = var.max_retention_days
  min_retention_days  = var.min_retention_days
}

# CloudWatch Alarms for Backup
resource "aws_cloudwatch_metric_alarm" "backup_job_failures" {
  alarm_name          = "billsaver-${var.environment}-backup-job-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "NumberOfBackupJobsFailed"
  namespace           = "AWS/Backup"
  period              = "3600"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Backup job failures detected"
  alarm_actions       = [aws_sns_topic.backup_alarms.arn]
}

# SNS Topic for Backup Alarms
resource "aws_sns_topic" "backup_alarms" {
  name = "billsaver-${var.environment}-backup-alarms"

  tags = {
    Name = "billsaver-${var.environment}-backup-alarms"
  }
}

# Data source for current account
data "aws_caller_identity" "current" {}

# Cross-region provider
provider "aws" {
  alias  = "cross_region"
  region = var.cross_region
}
