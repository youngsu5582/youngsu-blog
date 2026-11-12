# Plan: 모바일 레이아웃 깨짐 수정
Created: 2026-11-13
Status: active

## 진단 (375px · 320px, Playwright 실측)
- `/posts` 등 PostCard 목록: 썸네일 `w-48` 고정폭이 옆에 붙어 화면이 523px 까지 밀림
- Post/Article/Note 카드 메타 행: 날짜·읽기시간·태그가 한 줄 flex 라 "2026년 10 / 월 13일", "9 / 분" 으로 쪼개짐
- 글 상세: 공백 없는 긴 인라인 코드가 줄바꿈되지 않아 429~487px 넘침
- 글 상세 표: 첫 열이 한 글자씩 세로로 쪼개짐 ("걸/린/한/도")
- 브레드크럼: 마지막 항목 `max-w-[200px]` 고정이라 320px 에서 넘침
- `/library` 필터 버튼: "전/체", "라이/프" 로 글자 단위 줄바꿈

## Progress
- [x] 모바일 뷰 진단
- [x] 카드 3종 (post/article/note) — FeaturedPostCard 의 기존 반응형 패턴 재사용
- [x] 인라인 코드 `wrap-break-word` (`wrap-anywhere` 는 표 열 최소폭까지 줄여서 기각)
- [x] 표 셀 모바일 최소폭 + `keep-all`
- [x] 브레드크럼 truncate 구조
- [x] 라이브러리 필터 wrap
- [x] 글 헤더 메타 구분선 모바일 숨김 (검증 중 추가 발견)
- [x] 재측정: 320/375 전 페이지 넘침 0, 768/1280 회귀 없음
- [x] 테스트 561/561 (Node 22), build 성공, 수정 파일 lint OK
- [x] `fix/mobile-responsive` 브랜치로 커밋·PR (origin/main 기준 worktree, analytics 미커밋 작업과 분리)
- [ ] Vercel preview 로 실기기 확인
- [x] `/notes` 2차 (사용자 요청): 필터 칩을 모바일에서 카테고리·태그 각 한 줄 가로 스와이프로 — 첫 노트 y 1661→338px. 리스트 행은 제목 첫 줄·날짜/분류 둘째 줄. 카드 펼침 2304px 넘침 수정 (본문을 button 밖으로, col-span-full 을 그리드 아이템에)

## 참고
- Node 26 에서는 vitest 26개 실패 — `localStorage` 가 undefined (Node 25+ 전역 localStorage 가 jsdom 을 가림). 변경과 무관, Node 22 에선 전부 통과.

## Resume Point
브랜치 `fix/mobile-responsive` PR 의 Vercel preview 로 실기기 확인 → 이상 없으면 머지.
