# RiskPatch - Claude Code 에이전트 생성 프롬프트

각 프롬프트를 순서대로 Claude Code에 입력해서 에이전트를 생성하세요.

---

## 1. pipeline-agent

```
.claude/agents/pipeline-agent/ 에이전트를 사용해서 pipeline/ 폴더를 만들어줘.

담당:
- pipeline/scraper.py: google-play-scraper로 하이퍼캐주얼 게임 20개 이상의 1~2점 리뷰 수집
  → pipeline/data/raw_reviews.json 출력
- pipeline/preprocessor.py: Claude haiku-4-5로 노이즈 제거 + 불만 유형 구조화
  → pipeline/data/structured_complaints.json 출력
- pipeline/requirements.txt: 필요한 패키지 목록

불만 유형: 광고피로/조작불편/반복피로/난이도/보상부족/과금유도/UI/UX
환경변수: ../.env.local에서 읽기
```

---

## 2. rag-agent

```
.claude/agents/rag-agent/ 에이전트를 사용해서 RAG 시스템을 만들어줘.

담당:
- pipeline/embedder.py: structured_complaints.json → OpenAI 임베딩 → Supabase 저장
- lib/supabase.ts: Supabase 클라이언트 + match_complaints 검색 함수
- Supabase SQL 스키마 출력 (콘솔에서 실행할 수 있게)

임베딩 모델: text-embedding-3-small (1536차원)
검색 임계값: 0.7
반환 개수: 5
```

---

## 3. frontend-agent

```
.claude/agents/frontend-agent/ 에이전트를 사용해서 Next.js 앱을 만들어줘.

담당:
- app/api/analyze/route.ts: POST API
  1. 기획안 → Claude sonnet으로 핵심 요소 추출
  2. search_query → OpenAI 임베딩
  3. Supabase에서 유사 불만 패턴 검색
  4. Claude sonnet으로 리스크 리포트 생성
- app/page.tsx: 기획안 입력 UI + 리포트 출력
- package.json, tailwind.config.ts, tsconfig.json 등 Next.js 기본 설정

CONTEXT_ENGINEERING.md의 프롬프트 그대로 사용할 것
```

---

## 실행 순서

```
1단계: pipeline-agent → 데이터 파이프라인 코드 생성
2단계: rag-agent → RAG 시스템 코드 생성
3단계: /run-pipeline → 실제 데이터 수집 및 DB 저장
4단계: /test-rag → RAG 검색 정확도 확인
5단계: frontend-agent → UI 구현
6단계: /analyze-game [샘플 기획서] → 엔드투엔드 테스트
```
