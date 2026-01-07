variable "environment" {
  description = "Environment name"
  type        = string
}

variable "db_arn" {
  description = "Database ARN for backup"
  type        = string
}

variable "backup_retention_days" {
  description = "Number of days to retain daily backups"
  type        = number
  default     = 30
}

variable "weekly_backup_retention_days" {
  description = "Number of days to retain weekly backups"
  type        = number
  default     = 365
}

variable "cross_region_retention_days" {
  description = "Number of days to retain cross-region backups"
  type        = number
  default     = 365
}

variable "cross_region" {
  description = "Cross-region for backup replication"
  type        = string
  default     = "us-west-2"
}

variable "max_retention_days" {
  description = "Maximum retention days for vault lock"
  type        = number
  default     = 3650 # 10 years for HIPAA
}

variable "min_retention_days" {
  description = "Minimum retention days for vault lock"
  type        = number
  default     = 30
}
