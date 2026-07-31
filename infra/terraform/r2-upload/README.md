# Blog Admin R2 image storage

Blog Admin의 본문 이미지용 Cloudflare R2 bucket과 `img.youngsu5582.today` Custom Domain을 만든다.

썸네일과 글의 핵심 다이어그램은 기존처럼 Git 저장소의 `public/assets`에 두고, Admin에서 붙여넣거나 드래그하는 본문 이미지만 이 bucket에 저장한다.

## Terraform이 관리하는 것

- R2 bucket
- R2 Custom Domain
- Custom Domain의 최소 TLS 버전
- Blog Admin에 필요한 비밀이 아닌 runtime 값 출력

## Terraform이 관리하지 않는 것

- R2 API token의 secret 값
- Blog Admin의 Cloudflare Access 인증
- 에디터의 paste handler
- 이미지 변환·orphan asset 정리

API token의 secret을 Terraform 변수나 `terraform.tfvars`에 넣지 않는다. Terraform provider 인증은 `CLOUDFLARE_API_TOKEN` 환경변수로만 주입한다.

## 권한

Terraform용 Cloudflare API token에는 R2 bucket과 Custom Domain을 관리할 수 있는 계정 수준 권한이 필요하다. 처음에는 필요한 R2 읽기/쓰기 권한만 포함한 별도 token을 사용하고, Global API Key나 Cloudflare 전체 관리자 token은 사용하지 않는다.

Blog Admin runtime용 R2 token은 Terraform용 token과 분리한다. Blog Admin은 일반적으로 지정 bucket/prefix에 이미지를 업로드하므로 해당 bucket 범위의 Object Read/Write token을 별도로 만든다.

## 실행

```bash
cd infra/terraform/r2-upload
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars에는 account ID, zone ID, bucket/domain만 입력

CLOUDFLARE_API_TOKEN='[REDACTED]' ./run-with-docker.sh init
CLOUDFLARE_API_TOKEN='[REDACTED]' ./run-with-docker.sh validate
CLOUDFLARE_API_TOKEN='[REDACTED]' ./run-with-docker.sh plan
CLOUDFLARE_API_TOKEN='[REDACTED]' ./run-with-docker.sh apply
```

호스트에 Terraform을 설치하지 않고 Docker의 `hashicorp/terraform:1.9` 이미지를 사용한다. apply 전에 반드시 `plan` 결과를 확인한다.

## Blog Admin 환경변수

Terraform apply 이후 비밀이 아닌 값은 output으로 확인할 수 있다. Blog Admin의 `admin.env`에는 다음 형태로 넣는다.

```dotenv
ADMIN_UPLOAD_STORAGE=r2
R2_ACCOUNT_ID=[CLOUDFLARE_ACCOUNT_ID]
R2_BUCKET=youngsu-blog-images
R2_REGION=auto
R2_ENDPOINT=https://[CLOUDFLARE_ACCOUNT_ID].r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://img.youngsu5582.today
R2_UPLOAD_PREFIX=blog/${year}/${month}/${day}
S3_FORCE_PATH_STYLE=false

# Cloudflare R2 API token에서 발급한 값. 채팅·Git·Terraform state에 넣지 않는다.
R2_ACCESS_KEY_ID=[INJECT_LOCALLY]
R2_SECRET_ACCESS_KEY=[INJECT_LOCALLY]
```

R2 API endpoint는 업로드용이고, 본문에 삽입되는 URL은 Custom Domain을 사용한다.

```text
upload: https://[ACCOUNT_ID].r2.cloudflarestorage.com
serve:  https://img.youngsu5582.today/blog/2026/07/31/...
```

## 적용 후 확인

1. Cloudflare DNS/Custom Domain 상태가 active인지 확인
2. Blog Admin container를 recreate하여 `admin.env`를 다시 읽게 함
3. Admin 에디터에서 작은 PNG를 붙여넣음
4. 본문에 `https://img.youngsu5582.today/...`가 삽입되는지 확인
5. 반환 URL을 브라우저에서 열어 `200`과 올바른 `Content-Type`을 확인
6. 블로그 Preview/production에서 본문 이미지가 표시되는지 확인

현재 앱의 업로드 API는 Cloudflare Access로 보호되는 Admin 경계 안에서 동작하고, API token은 서버의 `admin.env`에서만 읽는다. R2 public Custom Domain은 읽기 전용 공개 이미지 서빙 용도로 사용한다.
