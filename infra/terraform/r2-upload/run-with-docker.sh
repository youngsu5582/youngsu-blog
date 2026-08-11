#!/usr/bin/env bash
set -Eeuo pipefail

# Terraform host install is not required. The Cloudflare API token is read from
# the caller environment and is never written into Terraform configuration.
#
# Usage:
#   CLOUDFLARE_API_TOKEN='[REDACTED]' ./run-with-docker.sh init
#   CLOUDFLARE_API_TOKEN='[REDACTED]' ./run-with-docker.sh plan
#   CLOUDFLARE_API_TOKEN='[REDACTED]' ./run-with-docker.sh apply

cd "$(dirname "$0")"
action="${1:-plan}"
shift || true

args=("$action")
case "$action" in
  plan|apply|destroy)
    args+=("-var-file=terraform.tfvars")
    ;;
  init|validate|fmt|output)
    ;;
  *)
    echo "unsupported action: $action" >&2
    exit 2
    ;;
esac
args+=("$@")

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN must be set in the caller environment}"

docker run --rm -i \
  -v "$PWD:/work" \
  -e CLOUDFLARE_API_TOKEN \
  -w /work \
  hashicorp/terraform:1.9 "${args[@]}"
