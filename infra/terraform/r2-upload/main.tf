resource "cloudflare_r2_bucket" "blog_images" {
  account_id    = var.cloudflare_account_id
  name          = var.bucket_name
  location      = var.location
  storage_class = "Standard"
}

resource "cloudflare_r2_custom_domain" "blog_images" {
  account_id  = var.cloudflare_account_id
  bucket_name = cloudflare_r2_bucket.blog_images.name
  domain      = var.image_domain
  enabled     = true
  zone_id     = var.cloudflare_zone_id
  min_tls     = var.min_tls
}
