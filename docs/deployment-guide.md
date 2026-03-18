# 배포 가이드

## 사전 준비

- [ ] Vercel 계정 (GitHub 연동)
- [ ] 도메인 DNS 접근 권한 (가비아/Cloudflare 등)
- [ ] `test-sample-post.mdx` 삭제
- [ ] `ending-job-search` EISDIR 이슈 해결

## 1단계: Vercel 프로젝트 설정

### 1.1 Vercel 연결
1. [vercel.com](https://vercel.com) 접속 → GitHub 로그인
2. "Add New Project" → `youngsu5582/youngsu-blog` 레포 선택
3. Framework: Next.js (자동 감지)
4. 환경 변수 설정 (선택):
   - `OPENAI_API_KEY` — AI 기능 사용 시
   - `GEMINI_API_KEY` — AI 기능 사용 시
5. "Deploy" 클릭

### 1.2 확인
- Vercel 대시보드에서 빌드 로그 확인
- 프리뷰 URL (`xxx.vercel.app`)에서 동작 확인

## 2단계: 도메인 연결

### 2.1 Vercel에 도메인 추가
1. Vercel 프로젝트 → Settings → Domains
2. `youngsu5582.today` 입력 → Add

### 2.2 DNS 레코드 변경
도메인 레지스트라에서:

| 타입 | 이름 | 값 |
|------|------|-----|
| CNAME | @ | `cname.vercel-dns.com` |
| 또는 A | @ | `76.76.21.21` |

> Vercel 대시보드에서 정확한 값을 확인하세요.

### 2.3 SSL
- Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
- 수분 내 HTTPS 활성화

## 3단계: 기존 GitHub Pages 비활성화

```bash
# gh CLI로 비활성화
gh repo edit youngsu5582/blog --default-branch main
# GitHub 레포 Settings → Pages → Source: None
```

또는 GitHub 웹에서:
1. `youngsu5582/blog` → Settings → Pages
2. Source: "None" 선택 → Save

## 4단계: 리다이렉트 확인

기존 URL 구조 보존을 위한 체크리스트:

- [ ] `/posts/:slug/` → `/posts/:slug` 접근 가능
- [ ] `/archives/` → `/archives` 접근 가능
- [ ] `/categories/:cat/` → `/categories/:cat` 접근 가능
- [ ] `/tags/:tag/` → `/tags/:tag` 접근 가능
- [ ] RSS `/feed.xml` 접근 가능
- [ ] `sitemap.xml` 접근 가능
- [ ] 이미지 `/assets/img/*` 접근 가능
- [ ] `resume.pdf` 접근 가능

## 5단계: SEO 마이그레이션

- [ ] Google Search Console에서 새 sitemap 제출
- [ ] 기존 sitemap의 모든 URL 크롤링 테스트 (20개 랜덤 체크)
- [ ] Google Analytics 트래픽 확인 (1주일 모니터링)

## 롤백 플랜

문제 발생 시:
1. DNS를 GitHub Pages로 원복
2. `youngsu5582/blog` 레포에서 Pages 다시 활성화
3. 5분 내 원복 완료

## 배포 후 할 일

- [ ] Lighthouse 점수 확인 (목표: 95+)
- [ ] Core Web Vitals 확인
- [ ] 모바일 테스트
- [ ] Giscus 댓글 동작 확인
- [ ] 소셜 공유 OG 이미지 확인
