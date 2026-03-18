# 블로그 백오피스 구현 계획

## 개요
로컬 전용(`dev` 모드) 블로그 관리 페이지. 파일시스템 직접 접근.

## 라우트 구조

### 1. 대시보드 `/admin`
파일시스템 기반 블로그 현황:
- 포스트 현황: 총 개수, ko/en 비율, draft 목록
- 카테고리/태그 분포
- 최근 변경 파일 (git log)
- **액션 가능 항목**: 썸네일 없는 포스트, 번역 안 된 포스트
- GA 연동은 이후 추가 (Google Analytics Data API + 서비스 계정)

### 2. 썸네일 생성기 `/admin/thumbnail`
**흐름:**
1. 글 선택 (드롭다운 or 검색)
2. 여러 AI 모델에 **동시 요청** (Gemini, DALL-E, GPT Image)
3. 결과를 **나란히 비교** (카드 그리드)
4. 선택 → `public/assets/img/thumbnail/`에 저장 + frontmatter `image` 필드 업데이트

**API**: `POST /api/admin/thumbnail/generate`, `POST /api/admin/thumbnail/apply`

### 3. 번역기 `/admin/translate`
**흐름:**
1. 글 선택 (번역 안 된 포스트 우선 표시)
2. Gemini + OpenAI **동시 번역**
3. 결과를 **나란히 비교** (diff 뷰 or 탭)
4. 선택/편집 → `content/posts/{slug}-en.mdx` 자동 생성

**API**: `POST /api/admin/translate/generate`, `POST /api/admin/translate/apply`

### 4. 발행 도구 `/admin/publish`
**흐름:**
1. `git status` 표시 (변경 파일 목록 + diff)
2. AI가 변경사항 **리뷰** (요약 + 잠재 이슈 체크)
3. 커밋 메시지 **자동 생성** (수정 가능)
4. 컨펌 → `git commit` + `gh pr create`

**API**: `GET /api/admin/git/status`, `POST /api/admin/git/review`, `POST /api/admin/git/commit`, `POST /api/admin/git/pr`

## 환경변수 (`.env.local`)
```
GEMINI_API_KEY=       # 없으면 Gemini 비활성화
OPENAI_API_KEY=       # 없으면 DALL-E/GPT/OpenAI 번역 비활성화
GOOGLE_API_KEY=       # 없으면 Google 번역 비활성화
```

## UI 원칙
- API 키 없는 모델: **비활성화 뱃지** 표시 (사용 불가 명확히)
- 모든 파괴적 액션: **컨펌 단계** 필수
- 결과 비교: **나란히 카드 그리드**
- 로딩: 스켈레톤 or 프로그레스 바

## 구현 순서
1. `/admin` 대시보드 (파일시스템 기반)
2. API Routes 기반 구조 (`/api/admin/*`)
3. `/admin/thumbnail` 썸네일 생성기
4. `/admin/translate` 번역기
5. `/admin/publish` 발행 도구

## 기술 스택
- Next.js App Router (Server Components + Client Components)
- API Routes (파일시스템 접근, 외부 AI API 호출)
- `child_process` (git/gh CLI 실행)
- Tailwind CSS + shadcn/ui (기존 디자인 시스템)
