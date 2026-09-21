# 태동 번역 (Taedong Translate) — AI 운영 가이드

## 정체성
사이트·모델·언어·플레이그라운드를 한 대시보드에서 관리하는 번역 운영 도구. Next.js(App Router)와 Prisma/PostgreSQL로 영속 데이터를 다루며, 태동그룹 내부 관리자가 다국어 사이트를 운영하고 고객사는 `public/sdk.js`를 자체 사이트에 임베드해 번역 기능을 쓴다. Codex CLI가 코드·스키마를 작성하고 Claude Code가 기획·DB 마이그레이션 감리·배포를 맡는다. 이 파일(AGENTS.md)이 단일 정본이며, `CLAUDE.md`는 `@AGENTS.md` 한 줄로 이 파일을 가리킨다 — Claude Code는 AGENTS.md를 스스로 읽지 않으므로 이 리다이렉트가 없으면 지침이 전달되지 않는다.

## 명령 (package.json)
- `pnpm dev` — 로컬 개발 서버
- `pnpm build` — `prisma generate && prisma db push --skip-generate --accept-data-loss && next build` (아래 함정 참조)
- `pnpm start` — 프로덕션 서버 기동
- `pnpm lint` — eslint

## 배포 경로
- GitHub `taedonggroup/taedong-translate` → Vercel git 연동(teamId=taedong). **main 브랜치 푸시 = 자동 프로덕션 배포**가 유일한 경로다.
- 금지: `vercel --prod` 등 CLI 수동 배포 — 자동배포와 경합하고 전역 배포 게이트를 우회한다. main이 아닌 브랜치에서 프로덕션을 강제로 트리거하는 것도 금지.

## 디자인 정본
프로젝트 전용 `DESIGN.md`는 아직 없다(미작성). 태동그룹 내부 관리 도구이므로 전역 자사 UI 규칙을 그대로 따른다 — 색은 `rules/DESIGN.tedong.md`의 8색(심해·광선·파동·수면광·물안개·먹·심연·최심부) 밖으로 나가지 않고, 적용 판정은 `rules/tedong-brand.md`를 본다. Slate/Teal 등 임의 팔레트 새로 추가 금지.

## 절대 금지
- 고객사 번역 데이터 외부 유출 금지 — 임베드된 사이트의 원문·번역문에 고객 콘텐츠·개인정보가 섞일 수 있어, 유출 시 계약 위반·법적 책임으로 이어진다.
- SDK 토큰·API 키 하드코딩 금지 — 코드에 박히면 유출 시 타 사이트가 임베드를 무단으로 가져다 쓰거나 유료 API(ANTHROPIC_API_KEY, DEEPL_API_KEY)가 도용돼 과금이 샌다.
- `prisma db push --accept-data-loss`를 스키마 diff 확인 없이 실행 금지 — 빌드마다 자동 실행되므로, 컬럼·테이블을 지우는 변경을 그대로 두면 배포 즉시 운영 데이터가 조용히 사라진다.
- 프로덕션 `DATABASE_URL`을 로컬 실험·스크립트에 그대로 복사해 쓰는 것 금지 — 로컬 실수가 운영 데이터에 바로 반영된다.

## 이 프로젝트 승인 범위
| 구분 | 범위 | 승인 |
|---|---|---|
| 즉시 실행 | UI 수정, 차트 변경 | 불필요 |
| 선보고 | Prisma 스키마 변경, SDK API 변경 | CEO |

## 함정
- **빌드가 곧 마이그레이션이다**: `next build` 전에 `prisma db push --accept-data-loss`가 이미 실행된다. `prisma migrate deploy`를 쓰는 프로젝트로 착각하면 안 된다 — 마이그레이션 파일 없이 스키마가 강제 반영되므로, 스키마를 고칠 땐 배포 전 반드시 diff나 스테이징으로 영향받는 컬럼을 확인한다.
- **사이트별 SDK 인증 미구현**: `ADMIN_TOKEN`은 관리자 화면·플레이그라운드만 보호하고, `sdk.js`를 호출하는 고객사 사이트 쪽 토큰 발급·검증은 아직 없다(schema에 토큰 필드 없음). 지금은 엔드포인트를 아는 누구나 호출 가능한 상태 — 인증 시스템 전에는 "완성"으로 보고하지 않는다.
- **환경변수**: `DATABASE_URL`, `ADMIN_TOKEN`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `DEEPL_API_KEY`, `NEXT_PUBLIC_APP_URL`. 뒤 세 개 중 Anthropic·DeepL은 호출량에 비례해 과금되는 외부 API라, 플레이그라운드에서 반복 호출할 때 비용을 인지한다.
- **메모리**: 이 프로젝트 전용 메모리 파일은 아직 없다. 새로 만들 경우 올바른 경로는 `/Users/seungmin/.claude/projects/-Users-seungmin/memory/`이며, `~/.claude/memory/...`는 존재하지 않는 경로다.

---
최종 업데이트: 2026-09-21 (D103 지침 다이어트 — 전역과 중복되는 등급 설명·기술 스택 나열·페이지 목록 제거, 실제 build 스크립트에 맞게 배포 서술 정정, 없는 메모리 경로 수정)
