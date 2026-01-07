output "backup_vault_arn" {
  description = "Backup vault ARN"
  value       = aws_backup_vault.main.arn
}

output "backup_plan_arn" {
  description = "Backup plan ARN"
  value       = aws_backup_plan.main.arn
}

output "backup_role_arn" {
  description = "Backup IAM role ARN"
  value       = aws_iam_role.backup.arn
}

output "cross_region_backup_vault_arn" {
  description = "Cross-region backup vault ARN"
  value       = aws_backup_vault.cross_region.arn
}
