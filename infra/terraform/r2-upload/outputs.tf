output "bucket_name" {
  description = "R2 bucket name used by Blog Admin."
  value       = cloudflare_r2_bucket.blog_images.name
}

output "r2_s3_endpoint" {
  description = "S3-compatible R2 endpoint for the Blog Admin runtime."
  value       = "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com"
}

output "public_base_url" {
  description = "Public URL prefix to place in Markdown image links."
  value       = "https://${var.image_domain}"
}

output "admin_env_template" {
  description = "Non-secret runtime values for the Blog Admin container. Inject access keys separately."
  value = join("\n", [
    "ADMIN_UPLOAD_STORAGE=r2",
    "R2_ACCOUNT_ID=${var.cloudflare_account_id}",
    "R2_BUCKET=${cloudflare_r2_bucket.blog_images.name}",
    "R2_REGION=auto",
    "R2_ENDPOINT=https://${var.cloudflare_account_id}.r2.cloudflarestorage.com",
    "R2_PUBLIC_BASE_URL=https://${var.image_domain}",
    "R2_UPLOAD_PREFIX=blog/$${year}/$${month}/$${day}",
    "S3_FORCE_PATH_STYLE=false",
    "# Inject R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY outside Terraform state.",
  ])
}
