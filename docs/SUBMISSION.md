# RiskPatch — 게임 기획 리스크 사전 진단 도구

Supercent AI Application Engineer 과제 · 2026.04
조명래 · myoungrel@gmail.com · 010-5634-1615

🔗 배포 URL: https://game-risk-patcher.vercel.app/
💻 GitHub: https://github.com/myoungrel/supercent
🎬 시연 영상: https://www.youtube.com/watch?v=jztrn4FL19k

`Claude` `Voyage AI` `Next.js 14` `Supabase pgvector` `Tailwind CSS` `Python` `Vercel` `Claude Code`

---

## Slide 1 — 표지

RiskPatch
실제 유저 불만 기반 게임 기획안 문제점 진단

- RiskPatch
- 조명래 · myoungrel@gmail.com · 010-5634-1615
- 배포: https://game-risk-patcher.vercel.app/
- GitHub: https://github.com/myoungrel/supercent
- 시연: https://www.youtube.com/watch?v=jztrn4FL19k

---

## Slide 2 — ① 문제 정의

게임 기획자가 출시 전에 겪는 문제
유저가 싫어하는 요소, 출시 전에 미리 체크해야 함

### 배경
- 하이퍼캐주얼 게임은 기획·제작·테스트 주기가 짧음
- 리뷰를 꼼꼼히 읽을 시간도, 데이터를 정리할 여유도 없음
- 출시 후 저평점이 쌓이고, 같은 문제가 반복됨

### 해결하려는 문제
- 플레이스토어 리뷰에 실제 이탈 원인이 담겨 있지만 수동 수집은 비효율적
- 반복되는 불만 요소가 기획에 반영되지 못해 출시 후 동일한 문제가 재발
- 정량적 근거 없이 기획 품질을 판단하기 어려움

### 대상 사용자
- 하이퍼캐주얼 게임 기획자 / 퍼블리싱 담당자 / 경쟁 게임 리서치 담당자 / PM

### 현재 업무 방식
- 플레이스토어 리뷰를 수동으로 읽고 개인 경험·감각에 의존해 판단
- 출시 후 저평점 → 원인 파악 → 수정 → 재테스트 사후 대응 반복

### 주요 불편 사항
- 리뷰 수집·분석에 과도한 시간 소모
- 정량적 근거 없이 기획 품질 판단이 어려움
- 이미 발생한 문제를 반복하는 비효율

📸 이미지: 플레이스토어 저평점 리뷰 캡처

---

## Slide 3 — ② 해결 방법

AI 기반 리스크 진단 서비스
기획안을 넣으면, 유사 게임에서 실제로 나온 불만을 바탕으로 리스크를 진단함

### RiskPatch란?
- 출시된 게임들의 저평점 리뷰 1,778건을 벡터 DB에 저장
- 새 기획안이 들어오면 유사한 불만 패턴을 자동으로 검색해 리스크 리포트를 생성
- 기획안 전체를 단순 비교하는 게 아니라 장르·조작방식·광고구조·보상구조·난이도흐름 등 핵심 요소를 먼저 추출하고 각 요소에 맞는 불만 패턴을 검색

### 핵심 기능
- 기획안 구조화: 장르·조작방식·광고구조·보상구조·난이도흐름 자동 추출
- Multi-query RAG 검색: 7가지 불만 유형별 쿼리를 병렬 생성 후 벡터 DB 동시 검색
- 리뷰 노이즈 제거: 욕설·단순감정·짧은 리뷰 제거 후 핵심 불만 유형으로 구조화
- 리스크 리포트 생성: 위험도(🔴🟡🟢) + 근거 리뷰 + 기획 보완 제안
- 실시간 진행 표시: SSE 스트리밍으로 각 분석 단계를 실시간 반영

📸 이미지: 서비스 메인 화면 스크린샷

---

## Slide 4 — 아키텍처

시스템 아키텍처
웹 서비스와 데이터 파이프라인이 코사인 유사도로 연결됨

📊 이미지: 아키텍처 다이어그램 (웹 서비스 + 데이터 수집 파이프라인)

---

## Slide 5 — RAG 구조

RAG 기반 검색 구조
7개 쿼리 병렬 검색 + 코사인 유사도 + 배치 임베딩 1회 호출

### 왜 RAG인가?
- 단순 LLM 질의는 학습 데이터 기반 추측만 나옴
- 실제 수집한 리뷰 1,778건에서 유사 사례를 직접 찾아 근거로 제시
- 기획안 특성을 벡터로 변환 → 동일한 특성에서 발생한 불만 패턴을 의미 기반으로 매칭

### RAG가 동작하는 방식
```
기획안 입력
  → Claude Haiku  (핵심 요소 추출 + 7개 불만 유형별 쿼리 생성)
  → Voyage AI     (7개 쿼리 배치 임베딩, 1회 호출)
  → Supabase      (7개 병렬 검색 → 중복 제거 → 상위 10건)
  → Claude Sonnet (RAG 결과 기반 리스크 리포트 생성)
```

### 기술 구성
- 임베딩: Voyage AI voyage-3 — document/query input_type 분리, 한국어 최적화
- 벡터 DB: Supabase pgvector — 코사인 유사도 검색, 유사도 0.6 이상 필터링
- Multi-query: 7개 병렬 쿼리 — 광고피로 / 난이도 / 보상부족 / 조작불편 / 반복피로 / 과금유도 / UI·UX

### 핵심 코드

7개 쿼리 배치 임베딩 + 병렬 검색:
```typescript
const response = await voyageClient.embed({
  input: queries,       // 7가지 불만 유형별 쿼리
  model: "voyage-3",
  inputType: "query",   // 검색용 타입 분리로 정확도 향상
});
const results = await Promise.allSettled(
  embeddings.map((embedding) => searchComplaints(embedding, 8))
);
```

Supabase 코사인 유사도 검색 (RPC):
```sql
create function match_complaints(
  query_embedding vector(1024),
  match_threshold float,
  match_count int
)
returns table (id bigint, detail text, complaint_type text, similarity float)
language sql as $$
  select id, detail, complaint_type,
    1 - (embedding <=> query_embedding) as similarity
  from complaints
  where 1 - (embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;

---

## Slide 6 — ③ AI 도구 & ④⑤ 프로토타이핑

AI 도구 구성 및 프로토타이핑
단순 작업은 Haiku, 복잡한 판단은 Sonnet — 역할 분리로 속도·비용·품질을 동시에 확보

### ③ AI 도구 구성
- Claude Haiku (claude-haiku-4-5-20251001): 기획안 구조화 + 검색 쿼리 생성 — 단순 JSON 추출에 적합, 빠르고 저렴
- Claude Haiku (claude-haiku-4-5-20251001): 리뷰 전처리 (노이즈 제거 + 불만 구조화) — 대량 처리에 적합
- Claude Sonnet (claude-sonnet-4-6): 리스크 리포트 생성 — 복잡한 맥락 이해·판단이 필요한 작업에 최신 모델 활용
- Voyage AI voyage-3: 텍스트 임베딩 (1024차원) — document/query input_type 분리 지원, 한국어 성능 우수
- Supabase pgvector: 벡터 저장 및 유사도 검색 — PostgreSQL 확장으로 별도 벡터 DB 불필요
- Claude Code: 전체 개발 환경 — 바이브코딩 방식으로 기획부터 배포까지 AI 협업

### ④⑤ 프로토타이핑 계획 및 방법

**검증 목표**
- RAG 정확도: 기획안 특성이 실제 불만 패턴과 의미적으로 매칭되는지
- 리포트 품질: 리뷰 근거 기반 실용적 기획 보완 제안이 나오는지
- 파이프라인 재현성: 새 게임 데이터도 동일 흐름으로 처리 가능한지

**데이터 규모**
- 수집: 게임 20개 × 한국어 1~2점 리뷰 3,636건
- 전처리 후: 욕설·단순감정·짧은 리뷰 제거 → 1,778건 저장

**구현 단계**
- 데이터 파이프라인: 리뷰 수집 → Haiku 전처리·구조화 → Voyage AI 임베딩 → Supabase 저장
- RAG 시스템: match_complaints RPC + 7개 쿼리 병렬 검색 + 유사도 0.6 필터링
- 웹앱: Next.js SSE 스트리밍 API + 단계별 실시간 진행 UI
- 배포: Haiku·Sonnet 역할 분리 + 배치 임베딩 + Rate limiting + Vercel

---

## Slide 7 — 서비스 화면

서비스 화면 (UI 설계)
기획안 텍스트 입력 → SSE 실시간 분석 3단계 → 위험도별 리스크 리포트 출력

📸 스크린샷 3장
1. 기획안 입력 화면
2. 분석 중 화면 (SSE 단계별 진행)
3. 리스크 리포트 결과 화면

---

## Slide 8 — ⑥ 바이브코딩

바이브코딩 개발 과정
컨텍스트 파일로 AI를 세팅하고, 에이전트에게 역할을 나눠 개발을 지시함

### 사전 준비 — 컨텍스트 파일

- CLAUDE.md — 기술스택, 폴더구조, 데이터 형식, 코딩 원칙 등 프로젝트 전체 컨텍스트
- CONTEXT_ENGINEERING.md — Stage 1(전처리) ~ Stage 4(리포트 생성) 단계별 LLM 프롬프트 설계
- 에이전트 지시 시 이 파일들을 참고하도록 명시해 일관성 확보

### 에이전트 — 역할 분리

- pipeline-agent — 데이터 수집·전처리 전담 (scraper / preprocessor / embedder)
- rag-agent — RAG 검색 시스템 구축 전담 (match_complaints RPC + multiQuerySearch)
- frontend-agent — Next.js UI·API 전담 (SSE 스트리밍 API + 메인 UI)

### 스킬 — 반복 테스트 단축

- /run-pipeline — 스크래핑 → 전처리 → 임베딩 파이프라인 순서대로 실행
- /test-rag — 샘플 기획안 3가지로 RAG 유사도·리포트 품질 확인
- /analyze-game — 기획안 입력 → 리스크 리포트 즉시 출력

### 실제 지시 흐름

```
① CLAUDE.md랑 CONTEXT_ENGINEERING.md 참고해서
  pipeline-agent한테 scraper.py, preprocessor.py, embedder.py 만들어줘.
  플레이스토어 하이퍼캐주얼 게임 20개 1~2점 한국어 리뷰 스크래핑하고
  Haiku로 노이즈 제거 + 7가지 불만 유형으로 구조화해줘.

② CONTEXT_ENGINEERING.md Stage 3 참고해서
  rag-agent한테 match_complaints RPC 함수 만들고
  7가지 불만 유형별 쿼리를 병렬로 검색하는 multiQuerySearch 구현해줘.

③ frontend-agent한테 route.ts SSE 스트리밍 API랑
  page.tsx 메인 UI 만들어줘.
  가짜 setTimeout 말고 실제 서버 진행 상황을 SSE로 전달해줘.

④ /analyze-game 스킬로 테스트해보니까 유사도가 낮아.
  기획안 구조화는 haiku로 바꾸고 임베딩도 배치로 한 번에 보내줘.
  Rate limiting이랑 기획안 미저장 고지 추가해줘.
```

