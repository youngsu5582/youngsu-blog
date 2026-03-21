# 배포 가이드

## 현재 배포 상태 (2026-03-21 완료)

- [x] Vercel 배포 완료: https://youngsu5582.today
- [x] DNS 연결 완료 (A: `216.198.79.1`, CNAME www: `vercel-dns-017.com`)
- [x] SSL 인증서 자동 발급 (Let's Encrypt)
- [x] Giscus 댓글 레포 변경 (`youngsu5582/blog` → `youngsu5582/youngsu-blog`)
- [x] CI/CD 파이프라인 활성화 (validate → velite → test → build)
- [ ] 기존 GitHub Pages 비활성화 (`youngsu5582/blog`)
- [ ] Google Search Console 새 sitemap 제출

## Vercel 프로젝트 설정

### 구성
- 레포: `youngsu5582/youngsu-blog` (main 브랜치)
- Framework: Next.js (자동 감지)
- Build Command: `pnpm build` (velite --clean && next build)
- 환경 변수: 없음 (admin AI 기능은 프로덕션에서 비활성)

### 배포 흐름
- **main push** → 프로덕션 자동 배포
- **PR 생성** → 프리뷰 URL 자동 생성 (`xxx.vercel.app`)

## DNS 설정

도메인 레지스트라에서 설정된 레코드:

| 타입 | 이름 | 값 |
|------|------|-----|
| A | @ | `216.198.79.1` |
| CNAME | www | `9ea74d5981e43710.vercel-dns-017.com` |
| TXT | @ | `google-site-verification=...` (Search Console) |

> 기존 GitHub Pages IP (`185.199.*.153` 4개)는 삭제 완료.

## 기존 GitHub Pages 비활성화

GitHub 웹에서:
1. `youngsu5582/blog` → Settings → Pages
2. Source: "None" 선택 → Save

> `gh api -X DELETE`는 422 에러 발생하여 웹에서 직접 처리 필요.

## 검증 체크리스트

### URL 접근성
- [ ] `https://youngsu5582.today` 메인 페이지
- [ ] `/posts/:slug` 개별 포스트
- [ ] `/archives` 아카이브
- [ ] `/about` 소개
- [ ] `/feed.xml` RSS 피드
- [ ] `/sitemap.xml` 사이트맵
- [ ] `/assets/resume.pdf` 이력서
- [ ] `/assets/img/*` 이미지

### 기능 확인
- [ ] Giscus 댓글 (youngsu5582/youngsu-blog Discussions)
- [ ] OG 이미지/소셜 공유 미리보기
- [ ] 모바일 반응형
- [ ] 다크모드
- [ ] Lighthouse 점수 (목표: 95+)
- [ ] Core Web Vitals

### SEO 마이그레이션
- [ ] Google Search Console에서 새 sitemap 제출
- [ ] Google Analytics 트래픽 확인 (1주일 모니터링)

## 롤백 플랜

문제 발생 시:
1. DNS A 레코드를 GitHub Pages IP로 원복 (`185.199.108/109/110/111.153`)
2. `youngsu5582/blog` 레포에서 Pages 재활성화
3. 5분 내 원복 가능
