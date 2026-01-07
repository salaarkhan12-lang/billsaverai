# Development Environment Variables

environment = "dev"
vpc_cidr    = "10.0.0.0/16"

# Database
db_instance_class      = "db.t3.micro"
db_allocated_storage   = 20
multi_az              = false
backup_retention_days = 7

# Domain (use a test domain for dev)
domain_name = "dev.billsaver.health"

# Monitoring
alert_email = "dev-alerts@billsaver.health"

# ECS
desired_count = 1
min_capacity  = 1
max_capacity  = 2
task_cpu      = "256"
task_memory   = "512"
