# RiskPatch

실제 유저 불만 기반 게임 기획안 문제점 진단 도구

배포: https://game-risk-patcher.vercel.app/
시연: https://www.youtube.com/watch?v=jztrn4FL19k

---

## 어떤 서비스인가

하이퍼캐주얼 게임 기획안을 입력하면, 플레이스토어 저평점 리뷰 1,778건을 바탕으로
유사 불만 패턴을 찾아 리스크 리포트를 생성함.

기획안 전체를 통째로 비교하는 게 아니라, 장르·조작방식·광고구조·보상구조·난이도흐름
5가지 핵심 요소를 먼저 추출하고, 각 요소에 맞는 불만 패턴을 벡터 검색으로 찾아냄.

---

## 왜 만들었나

- 하이퍼캐주얼 게임은 기획·제작·테스트 주기가 짧아 리뷰를 꼼꼼히 분석할 여유가 없음
- 플레이스토어 리뷰에 실제 이탈 원인이 담겨 있지만 수동 수집은 비효율적
- 출시 후 저평점 → 원인 파악 → 수정 → 재테스트 사후 대응이 반복됨

---

## 동작 방식

```
기획안 입력
  → Claude Haiku  (핵심 요소 추출 + 7개 불만 유형별 검색 쿼리 생성)
  → Voyage AI     (7개 쿼리 배치 임베딩, 1회 API 호출)
  → Supabase      (7개 병렬 검색 → 중복 제거 → 상위 10건)
  → Claude Sonnet (RAG 결과 기반 리스크 리포트 생성)
  → SSE 스트리밍  (단계별 실시간 진행 표시)
```

불만 유형 7가지: 광고피로 / 난이도 / 보상부족 / 조작불편 / 반복피로 / 과금유도 / UI·UX

---

## 기술 스택

- Next.js 14 (App Router) + Tailwind CSS
- Claude Haiku — 기획안 구조화, 리뷰 전처리
- Claude Sonnet — 리스크 리포트 생성
- Voyage AI voyage-3 — 텍스트 임베딩 (1024차원, 한국어 최적화)
- Supabase pgvector — 벡터 저장 및 코사인 유사도 검색
- Python — 플레이스토어 리뷰 스크래핑 및 전처리 파이프라인
- Vercel — 배포

---

## 데이터 파이프라인

```
플레이스토어 1~2점 리뷰 수집 (20개 게임, 3,636건)
  → Claude Haiku 전처리 (욕설·단순감정·짧은 리뷰 제거)
  → 7가지 불만 유형으로 구조화 (1,778건)
  → Voyage AI 임베딩
  → Supabase pgvector 저장
```

---

## 로컬 실행

```bash
npm install
cp .env.local.example .env.local  # API 키 입력
npm run dev
```

필요한 환경변수:

```
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 폴더 구조

```
├── app/
│   ├── page.tsx              # 메인 페이지
│   └── api/analyze/route.ts  # RAG 분석 SSE API
├── lib/
│   └── supabase.ts           # 벡터 검색 함수
├── pipeline/
│   ├── scraper.py            # 플레이스토어 리뷰 수집
│   ├── preprocessor.py       # LLM 전처리
│   └── embedder.py           # 임베딩 + DB 저장
└── .claude/
    ├── agents/               # pipeline / rag / frontend 에이전트
    └── skills/               # run-pipeline / test-rag / analyze-game 스킬
```
