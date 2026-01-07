# Database Module with Client-Side Encryption Capabilities

# KMS Key for Database Encryption
resource "aws_kms_key" "database" {
  description             = "KMS key for BillSaver database encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name = "billsaver-${var.environment}-db-key"
  }
}

resource "aws_kms_alias" "database" {
  name          = "alias/billsaver-${var.environment}-db"
  target_key_id = aws_kms_key.database.key_id
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "billsaver-${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "billsaver-${var.environment}-db-subnet-group"
  }
}

# PostgreSQL Database with Encryption
resource "aws_db_instance" "main" {
  identifier = "billsaver-${var.environment}-db"

  # Engine configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.instance_class

  # Storage
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.allocated_storage * 2
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.database.arn

  # Database configuration
  db_name  = "billsaver"
  username = "billsaver_admin"
  password = random_password.db_password.result
  port     = 5432

  # Network
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = var.security_group_ids
  publicly_accessible    = false
  multi_az              = var.multi_az

  # Backup and maintenance
  backup_retention_period = var.backup_retention_days
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  copy_tags_to_snapshot  = true
  skip_final_snapshot    = var.environment == "dev"
  final_snapshot_identifier = var.environment == "dev" ? null : "billsaver-${var.environment}-final-snapshot-${formatdate("YYYY-MM-DD", timestamp())}"

  # Performance and monitoring
  performance_insights_enabled    = true
  performance_insights_kms_key_id = aws_kms_key.database.arn
  monitoring_interval            = 60
  monitoring_role_arn           = aws_iam_role.rds_enhanced_monitoring.arn
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  # Parameter group for HIPAA compliance
  parameter_group_name = aws_db_parameter_group.main.name

  tags = {
    Name = "billsaver-${var.environment}-db"
  }

  lifecycle {
    ignore_changes = [
      final_snapshot_identifier,
    ]
  }
}

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store password in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "billsaver/${var.environment}/database/password"
  kms_key_id = aws_kms_key.database.id

  tags = {
    Name = "billsaver-${var.environment}-db-password"
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = aws_db_instance.main.username
    password = random_password.db_password.result
    host     = aws_db_instance.main.address
    port     = aws_db_instance.main.port
    dbname   = aws_db_instance.main.db_name
  })
}

# DB Parameter Group for HIPAA compliance
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "billsaver-${var.environment}-db-params"

  parameter {
    name  = "log_statement"
    value = "all"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "password_encryption"
    value = "scram-sha-256"
  }

  tags = {
    Name = "billsaver-${var.environment}-db-params"
  }
}

# IAM Role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "billsaver-${var.environment}-rds-enhanced-monitoring"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"]
}

# CloudWatch Alarms for Database
resource "aws_cloudwatch_metric_alarm" "db_cpu" {
  alarm_name          = "billsaver-${var.environment}-db-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "This metric monitors RDS CPU utilization"
  alarm_actions       = [aws_sns_topic.db_alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

resource "aws_cloudwatch_metric_alarm" "db_free_storage" {
  alarm_name          = "billsaver-${var.environment}-db-free-storage-space"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000000000" # 2GB
  alarm_description   = "This metric monitors RDS free storage space"
  alarm_actions       = [aws_sns_topic.db_alarms.arn]

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.main.id
  }
}

# SNS Topic for Database Alarms
resource "aws_sns_topic" "db_alarms" {
  name = "billsaver-${var.environment}-db-alarms"

  tags = {
    Name = "billsaver-${var.environment}-db-alarms"
  }
}
