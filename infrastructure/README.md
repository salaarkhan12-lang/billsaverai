# BillSaver Backend Infrastructure

This directory contains the infrastructure-as-code for the BillSaver backend Phase 3 implementation, designed for HIPAA compliance and high availability.

## Architecture Overview

The infrastructure is built on AWS with the following components:

- **VPC**: Multi-AZ network with public/private subnets
- **Database**: PostgreSQL with client-side encryption capabilities
- **ECS**: Containerized backend services with auto-scaling
- **ALB**: Application Load Balancer with SSL termination
- **WAF**: Web Application Firewall for security
- **Monitoring**: CloudWatch with comprehensive logging and alerting
- **Backup**: Automated backups with cross-region replication

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** v1.5.0 or later
3. **AWS CLI** configured with credentials
4. **Domain** registered in Route53 (or configure DNS manually)

## Quick Start

### 1. Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

### 2. Plan Deployment (Development)

```bash
terraform workspace select dev || terraform workspace new dev
terraform plan -var-file=dev.tfvars
```

### 3. Deploy Infrastructure (Development)

```bash
terraform apply -var-file=dev.tfvars
```

### 4. Production Deployment

```bash
terraform workspace select prod || terraform workspace new prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

## Environment Configuration

### Development Environment
- Single AZ deployment
- Minimal instance sizes
- Shorter backup retention
- Test domain configuration

### Production Environment
- Multi-AZ deployment
- Production-grade instance sizes
- Extended backup retention
- Production domain configuration

## Security Features

### HIPAA Compliance
- ✅ Encrypted database storage and transit
- ✅ VPC isolation with security groups
- ✅ CloudTrail audit logging
- ✅ WAF protection against common attacks
- ✅ Automated backups with encryption
- ✅ SSL/TLS encryption for all endpoints

### Network Security
- Private subnets for application and database
- Security groups with least-privilege access
- WAF with rate limiting and pattern matching
- VPC endpoints for AWS services

### Data Protection
- KMS encryption for all sensitive data
- Secrets Manager for database credentials
- Encrypted S3 buckets for logs and backups
- Backup vault with compliance locks

## Monitoring and Alerting

### CloudWatch Dashboards
- ECS service metrics (CPU, memory, requests)
- ALB metrics (latency, error rates, request counts)
- Database performance metrics
- Custom alarms for critical thresholds

### Alert Notifications
- SNS topics for different alert types
- Email notifications for critical issues
- Configurable alert thresholds per environment

## Backup and Recovery

### Automated Backups
- Daily backups with 30-day retention (configurable)
- Weekly backups with 1-year retention
- Cross-region backup replication
- Encrypted backup storage

### Disaster Recovery
- Multi-AZ database deployment (production)
- Automated failover capabilities
- Backup restoration procedures
- Data validation and integrity checks

## CI/CD Integration

The infrastructure is designed to work with GitHub Actions:

- Automated testing and security scanning
- Blue/green deployments
- Rollback capabilities
- Environment-specific configurations

## Cost Optimization

### Development Environment
- Minimal resource allocation
- Auto-scaling with low thresholds
- Shorter backup retention

### Production Environment
- Right-sized instances based on load
- Auto-scaling based on CPU/memory usage
- Cost allocation tags for tracking

## Troubleshooting

### Common Issues

1. **SSL Certificate Validation**
   - Ensure domain is registered in Route53
   - Check DNS propagation (can take up to 24 hours)

2. **Database Connection Issues**
   - Verify security group rules
   - Check VPC endpoint configurations
   - Validate KMS key permissions

3. **ECS Service Deployment Failures**
   - Check CloudWatch logs for container errors
   - Verify ECR repository permissions
   - Validate task definition configurations

### Logs and Monitoring

- **Application Logs**: CloudWatch Logs `/ecs/billsaver-{env}-backend`
- **ALB Logs**: S3 bucket `billsaver-{env}-alb-logs`
- **CloudTrail**: S3 bucket `billsaver-{env}-cloudtrail-logs`
- **Backup Logs**: AWS Backup console

## Compliance Documentation

### HIPAA Security Rule
- ✅ Administrative safeguards (access controls, audit logging)
- ✅ Physical safeguards (AWS data center security)
- ✅ Technical safeguards (encryption, access controls)

### HIPAA Privacy Rule
- ✅ Data minimization and purpose limitation
- ✅ Individual rights (access, amendment, accounting)
- ✅ Administrative requirements (privacy official, training)

### Audit Trail
- All data access logged with CloudTrail
- Database query logging enabled
- Application-level audit logging
- Regular compliance reporting

## Maintenance Procedures

### Regular Tasks
1. **Security Updates**: Apply patches monthly
2. **Backup Testing**: Test restoration quarterly
3. **Compliance Audits**: Annual HIPAA compliance review
4. **Performance Monitoring**: Continuous optimization

### Emergency Procedures
1. **Service Outage**: Check CloudWatch alarms and logs
2. **Data Breach**: Follow incident response plan
3. **System Compromise**: Isolate affected systems immediately

## Support

For infrastructure issues:
1. Check CloudWatch dashboards
2. Review Terraform state and plans
3. Consult AWS service documentation
4. Contact DevOps team for assistance

---

**Infrastructure Status**: ✅ **HIPAA-COMPLIANT PRODUCTION READY**

This infrastructure provides a secure, scalable, and compliant foundation for the BillSaver backend services.
