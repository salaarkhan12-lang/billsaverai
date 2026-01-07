variable "domain_name" {
  description = "Domain name for SSL certificate"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "create_cloudfront" {
  description = "Whether to create CloudFront distribution"
  type        = bool
  default     = false
}

variable "frontend_origin_domain" {
  description = "Frontend origin domain for CloudFront"
  type        = string
  default     = ""
}

variable "api_gateway_domain" {
  description = "API Gateway domain for CloudFront"
  type        = string
  default     = ""
}

variable "alb_dns_name" {
  description = "ALB DNS name"
  type        = string
  default     = ""
}

variable "alb_zone_id" {
  description = "ALB hosted zone ID"
  type        = string
  default     = ""
}
