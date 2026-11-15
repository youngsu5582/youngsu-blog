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
- [ ] PR · 프리뷰 빌드 성공 확인
- [ ] 머지 후 운영에서 `x-vercel-cache` 확인, Observability 에서 두 경로 호출 감소 확인
- [ ] (후속) 나머지 목록 페이지(`/tags`, `/categories`, `/series`, `/posts`, `/articles`, `/library`) 같은 방식 검토 — CPU 약 13%

## 비용
- 빌드 결과물 +약 170MB (`.next/server/app/tags` 121MB, `categories` 48MB), 정적 페이지 총 1,583개.

## Resume Point
PR 머지 → 운영 `x-vercel-cache` 확인 → 하루 뒤 Observability 비교.
