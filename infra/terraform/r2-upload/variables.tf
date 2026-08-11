variable "cloudflare_account_id" {
  description = "Cloudflare account ID that owns the R2 bucket."
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone ID for the image custom domain."
  type        = string
}

variable "bucket_name" {
  description = "R2 bucket name for Blog Admin inline images."
  type        = string
  default     = "youngsu-blog-images"
}

variable "image_domain" {
  description = "Public custom domain used in Markdown image URLs."
  type        = string
  default     = "assets.youngsu5582.today"
}

variable "location" {
  description = "R2 jurisdiction hint/location. It is applied when the bucket is first created."
  type        = string
  default     = "apac"

  validation {
    condition     = contains(["apac", "eeur", "enam", "weur", "wnam", "oc"], var.location)
    error_message = "location must be one of apac, eeur, enam, weur, wnam, or oc."
  }
}

variable "min_tls" {
  description = "Minimum TLS version accepted by the R2 custom domain."
  type        = string
  default     = "1.2"

  validation {
    condition     = contains(["1.0", "1.1", "1.2", "1.3"], var.min_tls)
    error_message = "min_tls must be one of 1.0, 1.1, 1.2, or 1.3."
  }
}
