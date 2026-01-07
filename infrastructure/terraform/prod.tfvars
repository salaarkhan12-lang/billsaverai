# Production Environment Variables

environment = "prod"
vpc_cidr    = "10.0.0.0/16"

# Database
db_instance_class      = "db.t3.medium"
db_allocated_storage   = 100
multi_az              = true
backup_retention_days = 30

# Domain
domain_name = "api.billsaver.health"

# Monitoring
alert_email = "prod-alerts@billsaver.health"

# ECS
desired_count = 3
min_capacity  = 2
max_capacity  = 10
task_cpu      = "512"
task_memory   = "1024"
