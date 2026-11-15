# Plan: 태그·카테고리 페이지 정적 생성 (Vercel Active CPU 절감)
Created: 2026-11-13
Status: active

## 배경 (Vercel Observability, 12시간)
- 무료 한도 Fluid Active CPU 4시간 중 75% 사용 알림.
- `/tags/[tag]` 684회 · 4분, `/categories/[category]` 207회 · 1분 → 전체의 약 87%. 나머지 8개 경로 합계 약 50초.
- 원인: 두 페이지가 `generateStaticParams` 를 갖고 있었지만 `searchParams`(`?lang=` · `?parent=`) 를 읽어 요청마다 서버 렌더링(ƒ). 호출당 Active CPU 300~500ms. 한 번에 400회 가까운 스파이크 → 크롤러로 추정.

## 결정
- 공개 주소는 그대로(`/tags/x?lang=en`, `/categories/x?lang=en&parent=y`) 두고, `next.config` rewrite(`has: query`)로 `/tags/[tag]/[lang]`, `/categories/[category]/[lang]/[parent]` 에 연결해 빌드 때 미리 만든다.
- `generateStaticParams` 는 인코딩하지 않은 이름을 돌려준다. `encodeURIComponent` 값을 주면 한국어·`/`·공백 태그가 미리 만든 파일과 어긋나 첫 요청마다 서버 렌더링된다 (로컬 next start 로 확인).
- `dynamicParams` 는 기본(true) 유지 — 예전 redirect 가 `/tags/github`(실제 태그 `GitHub`) 같은 대소문자 변형으로 보내므로, 목록에 없는 주소도 처음 한 번 렌더링 후 캐시.

## Progress
- [x] 원인 진단 (Observability 표 + 빌드 경로표)
- [x] 태그·카테고리 페이지를 경로 파라미터로 옮기고 rewrite 추가
- [x] 로컬 운영 빌드: 세 경로 ● (태그 902 · 카테고리 234 페이지), 기준 주소 14개 첫 요청 HIT, 내용 운영과 동일, 언어 토글 동작
- [x] vitest 619 통과 (Node 22)
- [x] PR #50 · 프리뷰 빌드 성공 → 2026-11-15 squash 머지 (0b23cb3)
- [ ] 머지 후 운영에서 `x-vercel-cache` 확인, Observability 에서 두 경로 호출 감소 확인
- [x] (후속) 태그 · 카테고리 링크 14곳(파일 8개)에 `prefetch={false}` — 브랜치 `perf/tag-category-link-no-prefetch`, 별도 PR
- [ ] 위 PR 머지 후 운영 Network 탭에서 `/tags` 를 열어도 `?_rsc=` 요청이 안 나가는지 확인
- [ ] (후속) 나머지 목록 페이지(`/tags`, `/categories`, `/series`, `/posts`, `/articles`, `/library`) 같은 방식 검토 — CPU 약 13%

## 추가 발견 (2026-11-15, 브라우저 Network 탭)
- 태그 · 카테고리 링크는 `<Link>` 기본값이라 화면에 보이면 `?_rsc=` 로 미리 불러온다. `/tags` 목록은 태그를 전부 링크로 그린다.
- 링크 1개당 요청: 운영(동적) 1개 · 0.8 kB → PR #50 프리뷰(정적) 5개 · 합계 5.0 kB (`/tags/pr-stats` 실측). Next.js 16.1 은 미리 만든 페이지를 조각별로 받는다.
- 배경의 "400회 스파이크 → 크롤러" 는 `/tags` 목록 한 번의 미리 불러오기일 수 있다 (추정 — 태그 약 450개와 수가 비슷하다. 로그로 확인하지 않음).
- 그래서 링크 쪽에서 미리 불러오기를 끈다. 정적이 된 뒤에는 CPU 대신 요청 수(Edge Requests)가 늘기 때문이다.

## 비용
- 빌드 결과물 +약 170MB (`.next/server/app/tags` 121MB, `categories` 48MB), 정적 페이지 총 1,583개.

## Resume Point
PR #50 머지됨(2026-11-15). 남은 것: ① prefetch PR 머지 ② 운영에서 태그 요청의 `x-vercel-cache` 확인 ③ 하루 뒤 Observability 에서 `/tags/[tag]` · `/categories/[category]` 호출 수 · Active CPU 비교.
