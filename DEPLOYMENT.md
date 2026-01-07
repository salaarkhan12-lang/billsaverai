# Deployment Guide

This guide covers deploying BillSaver to various platforms.

## Table of Contents
- [Frontend Deployment](#frontend-deployment)
  - [Vercel (Recommended)](#vercel-deployment)
  - [Netlify](#netlify-deployment)
  - [AWS Amplify](#aws-amplify-deployment)
  - [Docker](#docker-deployment)
  - [Self-Hosted](#self-hosted-deployment)
- [Backend Infrastructure Deployment](#backend-infrastructure-deployment)
  - [AWS Infrastructure Setup](#aws-infrastructure-setup)
  - [CI/CD Pipeline](#cicd-pipeline)
  - [Security & Compliance](#security--compliance)

---

## Vercel Deployment

Vercel is the easiest deployment option since Next.js is built by Vercel.

### Quick Deploy

1. **Push to Git**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"

3. **Environment Variables** (if any)
   - Add in Vercel dashboard under Settings > Environment Variables

### Custom Domain

In Vercel dashboard:
1. Go to Settings > Domains
2. Add your custom domain
3. Update DNS records as instructed

---

## Netlify Deployment

### Via Git

1. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Functions directory: Leave empty

2. **Deploy**
   - Push to GitHub/GitLab/Bitbucket
   - Connect repository in Netlify
   - Deploy

### Via Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --prod
```

---

## AWS Amplify Deployment

1. **Connect Repository**
   - Open AWS Amplify Console
   - Connect your Git provider
   - Select repository

2. **Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Deploy**
   - Save and deploy
   - AWS Amplify will build and deploy automatically

---

## Docker Deployment

### Create Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Update next.config.ts

Add to `next.config.ts`:

```typescript
const nextConfig = {
  output: 'standalone',
  // ... other config
};
```

### Build and Run

```bash
# Build image
docker build -t billsaver .

# Run container
docker run -p 3000:3000 billsaver
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  billsaver:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

Run with:
```bash
docker-compose up -d
```

---

## Self-Hosted Deployment

### Prerequisites

- Node.js 20+
- PM2 or similar process manager
- Nginx (recommended)
- SSL certificate (Let's Encrypt recommended)

### Steps

1. **Clone and Build**
   ```bash
   git clone <your-repo>
   cd billsaver
   npm install
   npm run build
   ```

2. **Install PM2**
   ```bash
   npm install -g pm2
   ```

3. **Start with PM2**
   ```bash
   pm2 start npm --name "billsaver" -- start
   pm2 save
   pm2 startup
   ```

4. **Configure Nginx**

   Create `/etc/nginx/sites-available/billsaver`:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/billsaver /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

5. **SSL with Let's Encrypt**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Environment Variables

For all deployment methods, you can set these optional variables:

```env
# Public variables (exposed to browser)
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id

# Server-only variables (if you add backend features)
# DATABASE_URL=postgresql://...
# API_SECRET=your-secret
```

---

## Performance Optimization

### 1. Enable Compression
Most platforms do this automatically, but for self-hosted:

```nginx
# In nginx config
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. CDN Configuration
- Vercel: Built-in CDN
- Cloudflare: Add in front of any deployment
- AWS CloudFront: For AWS deployments

### 3. Cache Headers
Next.js handles most caching automatically, but you can customize in `next.config.ts`:

```typescript
const nextConfig = {
  headers: async () => [
    {
      source: '/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ],
};
```

---

## Monitoring and Logging

### Vercel Analytics
Enable in Vercel dashboard or add:
```bash
npm install @vercel/analytics
```

### Custom Monitoring
Add error tracking (e.g., Sentry):
```bash
npm install @sentry/nextjs
```

### Server Logs
For self-hosted deployments:
```bash
# View PM2 logs
pm2 logs billsaver

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## Security Checklist

- [ ] HTTPS enabled (SSL certificate)
- [ ] Security headers configured
- [ ] Rate limiting (if backend added)
- [ ] Regular dependency updates
- [ ] Environment variables secured
- [ ] CORS configured properly (if API added)
- [ ] CSP headers set
- [ ] No sensitive data in client bundle

### Security Headers

Add to `next.config.ts`:

```typescript
const nextConfig = {
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'SAMEORIGIN',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'origin-when-cross-origin',
        },
      ],
    },
  ],
};
```

---

## Troubleshooting

### Build Failures

1. **Clear cache and reinstall**
   ```bash
   rm -rf node_modules .next package-lock.json
   npm install
   npm run build
   ```

2. **Check Node version**
   ```bash
   node --version  # Should be 20+
   ```

3. **TypeScript errors**
   ```bash
   npm run lint
   ```

### Runtime Issues

1. **Port already in use**
   ```bash
   # Change port
   PORT=3001 npm start
   ```

2. **Memory issues**
   ```bash
   # Increase Node memory
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

### PDF Processing Issues

1. **Worker not loading**
   - Check network tab for worker.js 404s
   - Verify CDN accessibility
   - Consider self-hosting PDF.js worker

2. **Large files timing out**
   - Implement file size limits
   - Add chunked processing
   - Show better progress feedback

---

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (AWS ELB, Nginx)
- Deploy multiple instances
- Consider serverless (Vercel/Netlify edge functions)

### Database (if added)
- Connection pooling
- Read replicas
- Caching layer (Redis)

### CDN
- Static assets via CDN
- Edge caching for API responses (if added)

---

## Cost Estimates

### Vercel
- **Hobby:** Free (personal projects)
- **Pro:** $20/month (commercial use)

### Netlify
- **Free:** 100GB bandwidth
- **Pro:** $19/month

### AWS
- **Amplify:** ~$15-50/month depending on traffic
- **EC2 + Load Balancer:** ~$30-100/month

### Self-Hosted
- **VPS (DigitalOcean/Linode):** $6-20/month
- **Maintenance:** Your time

---

## Backup and Recovery

### Vercel/Netlify
- Automatic deployments from Git
- Roll back via dashboard
- Git history is your backup

### Self-Hosted
```bash
# Backup script
#!/bin/bash
tar -czf billsaver-backup-$(date +%Y%m%d).tar.gz /path/to/billsaver
# Upload to S3/backup location
```

---

## Support

For deployment issues:
1. Check platform-specific docs
2. Review build logs
3. Test locally first
4. Verify environment variables
5. Check Node.js version compatibility

---

## Backend Infrastructure Deployment

### AWS Infrastructure Setup

BillSaver Phase 3 includes complete HIPAA-compliant cloud infrastructure deployed via Terraform.

#### Prerequisites
- **AWS Account** with appropriate permissions
- **Terraform 1.5.0+** - [Download](https://www.terraform.io/downloads)
- **AWS CLI** configured - [Setup Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **Domain** registered in Route53 (optional, can use AWS-provided domain)

#### Quick Infrastructure Deployment

```bash
# 1. Navigate to infrastructure directory
cd infrastructure/terraform

# 2. Initialize Terraform
terraform init

# 3. Create development workspace
terraform workspace select dev || terraform workspace new dev

# 4. Plan development deployment
terraform plan -var-file=dev.tfvars

# 5. Deploy to development
terraform apply -var-file=dev.tfvars

# 6. For production deployment
terraform workspace select prod || terraform workspace new prod
terraform plan -var-file=prod.tfvars
terraform apply -var-file=prod.tfvars
```

#### Infrastructure Components

**Network & Security:**
- ✅ **VPC** with public/private subnets across multiple AZs
- ✅ **NAT Gateways** for secure outbound traffic
- ✅ **Security Groups** with least-privilege access
- ✅ **WAF** protection against common attacks

**SSL & Certificates:**
- ✅ **ACM Certificates** with DNS validation
- ✅ **CloudFront CDN** with security headers
- ✅ **Lambda@Edge** for HIPAA-compliant headers

**Database:**
- ✅ **PostgreSQL RDS** with KMS encryption
- ✅ **Multi-AZ deployment** for high availability
- ✅ **Performance Insights** with encrypted monitoring
- ✅ **Automated backups** with cross-region replication

**Compute & Load Balancing:**
- ✅ **ECS Fargate** for containerized services
- ✅ **Application Load Balancer** with SSL termination
- ✅ **Auto-scaling** capabilities configured

**Monitoring & Compliance:**
- ✅ **CloudWatch** metrics, logs, and dashboards
- ✅ **CloudTrail** comprehensive audit logging
- ✅ **AWS Config** HIPAA compliance monitoring
- ✅ **SNS alerts** for critical issues

#### Environment Configuration

**Development Environment:**
- Single AZ deployment
- Minimal instance sizes
- Shorter backup retention
- Test domain configuration

**Production Environment:**
- Multi-AZ deployment
- Production-grade instance sizes
- Extended backup retention (1 year)
- Production domain configuration

### CI/CD Pipeline

The infrastructure includes automated CI/CD via GitHub Actions.

#### Pipeline Features
- ✅ **Security Scanning** with Trivy vulnerability scanner
- ✅ **Terraform Validation** and formatting checks
- ✅ **Multi-environment** deployments (dev/prod)
- ✅ **Docker Build** and ECR deployment
- ✅ **ECS Updates** with zero-downtime deployment
- ✅ **Database Migrations** automation
- ✅ **Integration Testing** and compliance checks

#### Pipeline Stages
1. **Security Scan** - Vulnerability scanning
2. **Backend Tests** - Unit and integration tests
3. **Terraform Validate** - Infrastructure validation
4. **Build & Push** - Docker image creation
5. **Deploy Dev** - Development environment deployment
6. **Deploy Prod** - Production environment deployment
7. **Integration Tests** - End-to-end validation

### Security & Compliance

#### HIPAA Compliance Features
- ✅ **Encrypted Data** at rest and in transit
- ✅ **Audit Logging** for all data access
- ✅ **Access Controls** with least-privilege permissions
- ✅ **Multi-AZ Deployment** for disaster recovery
- ✅ **Automated Backups** with compliance locks
- ✅ **Network Isolation** with VPC and security groups

#### Security Best Practices
- ✅ **Zero-Trust Architecture** - No implicit trust
- ✅ **End-to-End Encryption** - TLS 1.2+ minimum
- ✅ **Automated Security Scanning** in CI/CD
- ✅ **Regular Security Audits** via AWS Config
- ✅ **Incident Response** monitoring and alerting

#### Compliance Monitoring
- ✅ **AWS Config Rules** for HIPAA compliance
- ✅ **CloudTrail Logs** for audit trails
- ✅ **Automated Reporting** for compliance verification
- ✅ **Backup Validation** and integrity checks

### Cost Optimization

#### Development Environment
- Minimal resource allocation
- Auto-scaling with low thresholds
- Shorter backup retention periods

#### Production Environment
- Right-sized instances based on load
- Auto-scaling based on CPU/memory usage
- Cost allocation tags for tracking

### Monitoring & Maintenance

#### Health Monitoring
- **CloudWatch Dashboards** for real-time metrics
- **Application Load Balancer** health checks
- **ECS Service** health monitoring
- **Database** performance monitoring

#### Alert Configuration
- CPU utilization > 80%
- Memory utilization > 80%
- Database connection limits
- Backup failure notifications
- Security incident alerts

#### Backup Strategy
- **Daily Backups** with 30-day retention
- **Weekly Backups** with 1-year retention
- **Cross-region Replication** for disaster recovery
- **Backup Vault Locks** for compliance

### Troubleshooting Infrastructure

#### Common Issues

**SSL Certificate Validation:**
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn <cert-arn>

# Verify DNS records
aws route53 list-resource-record-sets --hosted-zone-id <zone-id>
```

**Database Connection Issues:**
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids <sg-id>

# Verify VPC configuration
aws ec2 describe-vpcs --vpc-ids <vpc-id>
```

**ECS Deployment Failures:**
```bash
# Check service events
aws ecs describe-services --cluster <cluster> --services <service>

# View CloudWatch logs
aws logs tail /ecs/billsaver-<env>-backend --follow
```

#### Logs and Monitoring

- **Application Logs**: CloudWatch `/ecs/billsaver-{env}-backend`
- **ALB Logs**: S3 bucket `billsaver-{env}-alb-logs`
- **CloudTrail**: S3 bucket `billsaver-{env}-cloudtrail-logs`
- **Backup Logs**: AWS Backup console

### Scaling Considerations

#### Horizontal Scaling
- ECS services auto-scale based on CPU/memory
- ALB distributes traffic across AZs
- RDS read replicas for read-heavy workloads

#### Performance Optimization
- CloudFront CDN for global performance
- Database connection pooling
- Redis caching layer (framework ready)

### Disaster Recovery

#### Backup and Recovery
- Automated cross-region backups
- Point-in-time recovery capabilities
- Infrastructure as Code for quick redeployment

#### Business Continuity
- Multi-AZ deployment
- Automated failover capabilities
- Regular disaster recovery testing

---

**Recommended:** Start with frontend-only deployment for quick testing, then add backend infrastructure when ready for enterprise features and HIPAA compliance.
