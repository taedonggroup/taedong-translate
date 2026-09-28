# Taedong Translate

웹사이트에 붙이는 다국어 번역 API입니다. 사이트가 발급받은 API 키로 `/api/translate`를 호출하면 여러 번역 공급자 중 하나가 자동으로 번역하고, 결과는 캐시·로그·비용 통계로 남습니다.

라이브: https://taedong-translate.vercel.app

## 하는 일

- **사이트별 API 키 발급·인증** — 도메인·활성 언어·번역 메시지를 사이트 단위로 관리 (`Site`, `SiteLanguage`, `SiteMessages`)
- **번역 공급자 자동 폴백** — Claude(Haiku 4.5) · DeepL · MyMemory 를 우선순위와 무료 할당량 기준으로 순서대로 시도 (`src/lib/providers/`)
- **할당량·비용 추적** — 공급자별 무료 할당량 사용량·리셋, 문자당 비용 (`Provider` 모델)
- **관리 대시보드** — 오늘/이달 번역 건수·비용·최근 로그, 사이트·언어·공급자 관리 화면, 번역 플레이그라운드
- **번역 캐시·로그** — 같은 문장은 다시 호출하지 않고, 모든 호출은 `TranslationLog`에 기록
- **부가 API** — 쿼터 조회(`/api/quota`), 웹훅(`/api/webhook`), 관리자 토큰 인증

지원 언어 매핑: 한국어·영어·일본어·중국어·베트남어·태국어·인도네시아어·프랑스어·스페인어·독일어·러시아어·포르투갈어 (공급자별로 다름)

## 기술 스택

Next.js 16 (App Router) · React 19 · TypeScript · Prisma 6 + PostgreSQL · Tailwind CSS 4 · Recharts

## 구조

```
src/app/api/translate/   번역 API (CORS 오픈, API 키 인증)
src/app/api/quota/       쿼터 조회
src/app/api/webhook/     웹훅
src/app/{sites,languages,providers,stats,playground}/   관리 화면
src/lib/providers/       claude · deepl · mymemory · stub
src/lib/cache.ts         번역 캐시
prisma/schema.prisma     Site · SiteLanguage · SiteMessages · Provider · TranslationLog
scripts/                 고객사 사이트 메시지 일괄 업로드 스크립트
```

## 실행

```bash
pnpm install
# 환경변수: DATABASE_URL (PostgreSQL), ADMIN_TOKEN (관리 화면 토큰)
pnpm dev               # 개발 서버
pnpm build && pnpm start
```

번역 공급자의 API 키는 환경변수가 아니라 관리 화면(공급자 관리)에서 입력해 DB에 저장합니다.

## 사용 예

```http
POST /api/translate
Content-Type: application/json
Authorization: Bearer <사이트 API 키>

{ "text": "안녕하세요", "from": "ko", "to": "en" }
```

여러 문장은 `text` 대신 `texts` 배열로 보냅니다. `from`을 생략하면 한국어(`ko`)로 간주합니다.

---

TEDONG(태동) 제작. 이 저장소는 태동 공식 계정에서 관리합니다.
