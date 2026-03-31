# Game Risk Patcher (RiskPatch) - 하이퍼캐주얼 게임 기획 리스크 사전 진단 도구

## 프로젝트 개요
플레이스토어 저평점 리뷰를 RAG로 분석해, 하이퍼캐주얼 게임 기획 단계에서
예상 불만 요소를 사전 탐지하는 AI 리서치 도구.
슈퍼센트 AI Application Engineer 과제 제출용 프로토타입.

## 기술 스택
- **프론트엔드**: Next.js 14 (App Router)
- **벡터DB**: Supabase pgvector
- **LLM**: Claude API (claude-sonnet-4-6)
- **임베딩**: OpenAI text-embedding-3-small
- **데이터 파이프라인**: Python (스크래핑 + 전처리)
- **스타일**: Tailwind CSS

## 폴더 구조
```
supercent_project/
├── app/                    # Next.js 프론트엔드
│   ├── page.tsx            # 메인 페이지 (기획서 입력 + 리포트 출력)
│   └── api/
│       └── analyze/        # RAG 분석 API 엔드포인트
├── pipeline/               # Python 데이터 파이프라인
│   ├── scraper.py          # 플레이스토어 리뷰 스크래핑
│   ├── preprocessor.py     # LLM 전처리 (불만 패턴 구조화 + 노이즈 제거)
│   └── embedder.py         # 벡터 임베딩 + Supabase 저장
├── lib/                    # 공통 유틸
│   └── supabase.ts         # Supabase 클라이언트
├── .claude/
│   ├── agents/             # 역할별 서브에이전트
│   └── skills/             # Claude Code 단축 명령
├── CLAUDE.md
├── PROJECT_PLAN.md
├── CONTEXT_ENGINEERING.md  # 각 단계별 프롬프트 설계
└── VIBE_CODING_LOG.md      # 바이브코딩 지시 자동 저장 로그
```

## 핵심 데이터 흐름
```
[데이터 수집 파이프라인]
플레이스토어 1~2점 리뷰 스크래핑
→ LLM 전처리: 욕설·단순감정·의미없는 짧은 리뷰 제거
→ 핵심 불만 유형으로 구조화
→ 임베딩 → Supabase pgvector 저장

[사용 흐름]
게임 기획안 텍스트 입력
→ 핵심 요소 추출 (장르 / 조작방식 / 광고구조 / 보상구조 / 난이도흐름)
→ RAG로 유사 불만 패턴 검색
→ 리스크 리포트 생성 (위험도 + 근거 리뷰 + 기획 보완 제안)
```

## 불만 패턴 구조화 형식
```json
{
  "game": "게임명",
  "genre": "하이퍼캐주얼",
  "complaint_type": "광고피로 | 조작불편 | 반복피로 | 난이도 | 보상부족 | 과금유도 | UI/UX",
  "detail": "구체적인 불만 내용",
  "original_review": "원문"
}
```

## 리스크 리포트 형식
```
위험도: 🔴 높음 / 🟡 중간 / 🟢 낮음

각 항목:
- 불만 유형
- 근거 (유사 리뷰 요약)
- 위험도
- 기획 보완 제안

종합 의견
```

## 코딩 원칙
- 동작하는 데모 우선, 완벽한 코드 나중
- 컴포넌트는 단순하게 유지
- API 키는 반드시 .env.local에 보관, 코드에 하드코딩 금지
- 타입스크립트 strict 모드 사용

## 환경변수 (.env.local)
```
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 우선순위
1. 파이프라인 동작 확인 (스크래핑 → 임베딩 → 저장)
2. RAG 검색 정확도 확인
3. UI 연결
4. 데모 영상 녹화
