# 이영수 기술 블로그

Next.js 16 + Tailwind CSS v4 기반 커스텀 블로그 플랫폼.

**[블로그 바로가기](https://youngsu5582.today)**

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Framework | Next.js 16.1 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui v4 |
| Content | MDX (Velite) |
| Code Highlight | Shiki (rehype-pretty-code) |
| Search | Fuse.js (클라이언트) |
| Comments | Giscus (GitHub Discussions) |
| Theme | Sora (空) — Japanese Sky 테마 |
| Deploy | Vercel |

## 프로젝트 구조

```
youngsu-blog/
├── app/                    # Next.js App Router 페이지
│   ├── posts/              # 포스트 목록 + 상세
│   ├── articles/           # 아티클 목록 + 상세
│   ├── library/            # 서재 (책/영화/라이프)
│   ├── notes/              # 학습 노트 (제텔카스텐)
│   ├── categories/         # 카테고리 (계층형)
│   ├── tags/               # 태그 클라우드
│   ├── archives/           # 연도별 타임라인
│   ├── about/              # 소개
│   ├── activities/         # 활동
│   ├── admin/              # 백오피스 (dev 전용)
│   └── api/admin/          # 관리 API
├── components/             # React 컴포넌트
│   ├── layout/             # 사이드바, 탑바, 푸터
│   ├── post/               # 포스트 카드, 헤더, TOC, 네비게이션
│   ├── search/             # 검색 다이얼로그
│   ├── notes/              # 학습 노트 뷰
│   ├── library/            # 서재 카드/그리드
│   ├── mdx/                # MDX 렌더러
│   ├── admin/              # 백오피스 컴포넌트
│   ├── common/             # 테마 토글, 언어 전환, 댓글, 스크롤탑
│   └── ui/                 # shadcn/ui 기본 컴포넌트
├── content/                # 콘텐츠 (MDX)
│   ├── posts/              # 블로그 포스트 (ko/en)
│   ├── articles/           # 장문 아티클
│   ├── library/            # 독서/영화/라이프 리뷰
│   └── notes/              # 학습 메모
├── config/                 # 설정 파일
│   ├── site.ts             # 사이트 기본 정보
│   ├── navigation.ts       # 네비게이션 메뉴
│   ├── search.ts           # 검색 설정
│   └── theme.ts            # 테마 설정
├── lib/                    # 유틸리티
│   ├── content.ts          # 콘텐츠 조회 함수
│   ├── search.ts           # 검색 인덱스
│   ├── mdx-components.tsx  # MDX 커스텀 컴포넌트
│   └── i18n.ts             # 다국어
├── styles/themes/          # 테마 CSS
│   ├── sora.css            # 현재 테마 (空 하늘)
│   └── _template.css       # 새 테마 템플릿
├── scripts/                # CLI 도구
│   ├── migrate-posts.ts    # Jekyll → MDX 마이그레이션
│   ├── new-post.ts         # 새 포스트 생성
│   ├── translate-post.ts   # 번역
│   └── validate-content.ts # 콘텐츠 검증
├── public/assets/          # 정적 에셋 (이미지, PDF 등)
├── velite.config.ts        # Velite 콘텐츠 파이프라인 설정
├── next.config.ts          # Next.js 설정
└── .github/workflows/      # CI/CD
```

## 시작하기

### 사전 요구사항

- Node.js 22+
- pnpm 10+

### 설치

```bash
git clone https://github.com/youngsu5582/youngsu-blog.git
cd youngsu-blog
pnpm install
```

### 개발 서버

```bash
pnpm dev              # http://localhost:3000
pnpm dev --port 3001  # 포트 지정
```

### 빌드

```bash
pnpm build    # 프로덕션 빌드
pnpm start    # 빌드된 서버 실행
```

## 환경 변수

`.env.local` 파일 생성:

```bash
# AI 기능 (선택 — 없으면 해당 기능 비활성화)
OPENAI_API_KEY=sk-...          # AI 메타데이터 제안, 번역
GEMINI_API_KEY=AIza...         # AI 메타데이터 제안, 썸네일 생성
GOOGLE_API_KEY=AIza...         # Google Translate 번역
```

> AI API 키가 없어도 블로그의 모든 기본 기능은 정상 작동합니다.

## 콘텐츠 관리

### 새 포스트 작성

```bash
# CLI로 생성
pnpm blog:new "포스트 제목"
pnpm blog:new "포스트 제목" --category 프로그래밍 --tags "java,spring"

# 또는 content/posts/ 에 직접 .mdx 파일 생성
```

### Frontmatter 스키마

```yaml
---
title: 포스트 제목           # 필수
date: 2026-03-19             # 필수 (YYYY-MM-DD)
description: "한줄 요약"     # 선택
categories:                  # 선택 (첫번째가 부모 카테고리)
  - 프로그래밍
  - 클린코드
tags:                        # 선택
  - java
  - spring
image: /assets/img/thumb.png # 선택 (썸네일)
author: 이영수               # 기본값: 이영수
lang: ko                     # 기본값: ko (en으로 영어 포스트)
draft: true                  # true면 발행 안 됨
toc: true                    # 기본값: true (목차 표시)
comments: true               # 기본값: true (댓글 표시)
---
```

### 컬렉션별 위치

| 컬렉션 | 경로 | 추가 필드 | 설명 |
|--------|------|-----------|------|
| 포스트 | `content/posts/*.mdx` | — | 기술 블로그 글 |
| 아티클 | `content/articles/*.mdx` | `moc`, `status`, `subTopic` | 장문 기술 문서 |
| 서재 | `content/library/*.mdx` | `mediaType` (book/movie/life), `rating` | 리뷰 |
| 노트 | `content/notes/*.mdx` | — (title도 선택) | 짧은 학습 메모 |

### 학습 노트

부담 없이 짧은 메모를 작성:

```yaml
---
title: HashMap vs ConcurrentHashMap  # 선택 — 없으면 파일명 사용
date: 2026-03-18
tags:
  - java
---

여기에 짧은 내용 작성...
```

3가지 뷰 모드: 메모 리스트 / 카드 그리드 / 타임라인

### 다국어 (ko/en)

- 한국어: `content/posts/my-post.mdx`
- 영어: `content/posts/my-post-en.mdx` (같은 slug + `-en` 접미사)
- 포스트 목록에서 KO/EN 토글로 전환
- 검색도 현재 언어 기반 필터링

### 파일명 규칙

- **영문 kebab-case만 사용**: `my-post-title.mdx`
- 한글 파일명은 URL 인코딩 이슈로 404 발생 가능
- permalink에서 slug 추출: `/posts/my-slug/` → `my-slug.mdx`

## CLI 도구

```bash
pnpm blog:new "제목"          # 새 포스트 스캐폴딩
pnpm blog:validate            # 콘텐츠 검증 (frontmatter, 코드블록 페어링)
pnpm blog:migrate             # Jekyll → MDX 전체 마이그레이션
pnpm blog:migrate --limit 10  # 10개만 마이그레이션
pnpm blog:translate <file>    # Google Translate 기반 번역
```

## 테마 시스템

테마는 CSS 변수 + 컴포넌트 클래스로 분리되어 있어 교체가 간편합니다.

### 테마 교체 방법

1. `styles/themes/_template.css` 복사 → `styles/themes/my-theme.css`
2. CSS 변수 (`:root`, `.dark`) + `.theme-*` 컴포넌트 스타일 구현
3. `app/globals.css`에서 import 한 줄 변경:

```css
/* 이 한 줄만 바꾸면 전체 테마 교체 */
@import "../styles/themes/sora.css";
→ @import "../styles/themes/my-theme.css";
```

### 테마 컴포넌트 클래스

| 클래스 | 용도 |
|--------|------|
| `.theme-sidebar` | 사이드바 배경 (그라디언트 등) |
| `.theme-avatar-ring` | 프로필 아바타 테두리 장식 |
| `.theme-nav-active` | 네비게이션 활성 항목 스타일 |
| `.theme-card` | 포스트 카드 기본/호버 |
| `.theme-heading::after` | 페이지 제목 아래 장식 라인 |
| `.theme-tag` | 태그 필 스타일 |
| `.theme-category` | 카테고리 뱃지 |
| `.theme-gradient-text` | 그라디언트 텍스트 (히어로 등) |
| `.theme-timeline-dot` | 타임라인 도트 |
| `.theme-divider` | 구분선 |
| `.theme-footer` | 푸터 배경 |

## 백오피스 (Admin)

개발 환경(`pnpm dev`)에서만 접근 가능한 관리 페이지.
프로덕션 배포 시 자동 비활성화.

| 페이지 | 기능 |
|--------|------|
| `/admin` | 대시보드 — 포스트 현황, 썸네일/번역 누락 목록 |
| `/admin/publish` | 발행 — 포스트 선택 + 메타데이터 편집 + AI 제안 + 원클릭 커밋 |
| `/admin/thumbnail` | 썸네일 생성 — AI 모델로 생성 + 비교 (API 키 필요) |
| `/admin/translate` | 번역 — AI 번역 + 비교 (API 키 필요) |

## 설정 파일 가이드

### `config/site.ts` — 사이트 기본 정보

```typescript
export const siteConfig = {
  name: "블로그 이름",
  description: "블로그 설명",
  url: "https://your-domain.com",
  author: {
    name: "이름",
    email: "email@example.com",
    github: "https://github.com/username",
  },
  giscus: {
    repo: "username/repo",          // GitHub Discussions 활성화된 레포
    repoId: "R_...",                // giscus.app 에서 확인
    category: "Post",
    categoryId: "DIC_...",          // giscus.app 에서 확인
  },
  analytics: {
    googleAnalyticsId: "G-XXXXXXXXXX",
  },
};
```

### `config/navigation.ts` — 사이드바 메뉴

```typescript
export const navigation = [
  { name: "홈", href: "/", icon: Home },
  { name: "포스트", href: "/posts", icon: FileText, description: "기술 아티클" },
  // 추가/삭제/순서변경 자유
];
```

### `velite.config.ts` — 콘텐츠 파이프라인

새 컬렉션 추가:
1. `defineCollection`으로 스키마 정의
2. `collections` 객체에 추가
3. `lib/content.ts`에 조회 함수 추가
4. `app/` 아래 라우트 페이지 생성

### `next.config.ts` — 외부 이미지 도메인

새 외부 이미지 소스 사용 시:

```typescript
images: {
  remotePatterns: [
    { hostname: "new-image-host.com" },
  ],
},
```

## 포스트 UX 기능

| 기능 | 설명 |
|------|------|
| 읽기 진행률 바 | 상단 고정, 스크롤 연동 |
| 목차 (TOC) | 우측 사이드바, 스크롤 추적 하이라이트 |
| 이전/다음 네비게이션 | 포스트 하단 카드 |
| 관련 포스트 추천 | 같은 카테고리 기반 |
| 소셜 공유 | Twitter, LinkedIn, 링크 복사 |
| Giscus 댓글 | GitHub Discussions 기반 |
| 맨 위로 버튼 | 우측 하단 플로팅 |
| 코드 하이라이팅 | Shiki (라이트/다크 테마 자동) |
| OG 이미지 | 포스트별 자동 생성 (하늘색 카드) |

## 라이선스

MIT
