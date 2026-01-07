variable "environment" {
  description = "Environment name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "alb_arn" {
  description = "ALB ARN to associate WAF with"
  type        = string
}

variable "rate_limit" {
  description = "Rate limit for requests per 5 minutes per IP"
  type        = number
  default     = 2000
}
