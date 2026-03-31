# 개발 진행 기록

## 1단계: 데이터 파이프라인 ✅

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `pipeline/scraper.py` | 플레이스토어 한국어 리뷰 스크래핑 |
| `pipeline/preprocessor.py` | Claude haiku로 노이즈 제거 + 불만 구조화 |
| `pipeline/embedder.py` | Voyage AI 임베딩 + Supabase 저장 |
| `pipeline/requirements.txt` | Python 패키지 목록 |

### 결과
- 수집 리뷰: **3,636건** (20개 게임 × 한국어 1~2점)
- 저장 위치: `pipeline/data/raw_reviews.json`

### 오류 및 해결

**문제 1: 게임 ID 404 오류**
- 원인: 초기 게임 목록(com.voodoo.paperio2 등)이 한국 플레이스토어에 없는 게임들
- 해결: 실제 한국 플레이스토어에 존재하는 게임 ID로 전체 교체

**게임 목록 선별 기준**
- google-play-scraper로 한국 플레이스토어(country="kr") 접근 가능 여부를 직접 테스트
- 총 30개 이상 후보 ID를 테스트해서 404 오류 없이 응답하는 20개만 선별
- 광고/과금/난이도/반복 등 다양한 불만 유형이 나올 수 있는 장르 믹스 구성
  - 러너: Hill Climb Racing, Subway Surfers, Temple Run 2
  - 캐주얼: Knife Hit, Crossy Road, Stack, Fruit Ninja, Agar.io
  - 퍼즐/전략: Candy Crush, Gardenscapes, Clash Royale, Brawl Stars
  - 액션: Archero, Kick the Buddy, Among Us, Soccer Stars
  - 기타: My Talking Tom, 여행개구리, Roblox, Minecraft

- 최종 선별 목록:
  - com.fingersoft.hillclimb (Hill Climb Racing)
  - com.kiloo.subwaysurf (Subway Surfers)
  - com.imangi.templerun2 (Temple Run 2)
  - com.ketchapp.knifehit (Knife Hit)
  - com.yodo1.crossyroad (Crossy Road)
  - com.king.candycrushsaga (Candy Crush Saga)
  - com.halfbrick.fruitninja (Fruit Ninja)
  - com.outfit7.mytalkingtomfriends (My Talking Tom Friends)
  - com.ketchapp.stack (Stack)
  - com.innersloth.spacemafia (Among Us)
  - com.habby.archero (Archero)
  - com.playgendary.kickthebuddy (Kick the Buddy)
  - com.miniclip.soccerstars (Soccer Stars)
  - com.playrix.gardenscapes (Gardenscapes)
  - com.supercell.brawlstars (Brawl Stars)
  - com.supercell.clashroyale (Clash Royale)
  - com.miniclip.agar.io (Agar.io)
  - jp.co.hit_point.tabikaeru (여행개구리)
  - com.roblox.client (Roblox)
  - com.mojang.minecraftpe (Minecraft)

**문제 2: 전처리 중 VSCode 재시작으로 중단**
- 원인: Node.js 설치 후 PATH 적용을 위해 VSCode 재시작 필요
- 해결: VSCode 재시작 후 preprocessor.py 다시 실행

**문제 3: 임베딩 모델 변경 (OpenAI → Voyage AI)**
- 원인: OpenAI API 비용 절감 목적
- 해결: voyageai 패키지로 교체, voyage-3 모델 사용 (1024차원, 무료 200M 토큰)
- Supabase 테이블도 vector(1536) → vector(1024)로 재생성 완료

**문제 4: 전처리 중복 실행으로 API 비용 과다 발생**
- 원인: 백그라운드 프로세스 확인 실패로 2개 동시 실행
- 결과: 예상 $2.30 → 실제 ~$6.1 소모
- 해결: 중복 프로세스 1개 강제 종료 후 단일 실행으로 완료

### 결과
- 구조화된 불만 데이터: **1,778건** (3,636건 중 노이즈 제거 후 약 49% 유효)
- 저장 위치: `pipeline/data/structured_complaints.json`
- complaint_type 분포: 광고피로·UI/UX·난이도·보상부족·조작불편·반복피로 등 7가지

---

## 2단계: Next.js 앱 ✅ 코드 완성 (테스트 대기)

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `package.json` | Next.js 14, @anthropic-ai/sdk, voyageai, @supabase/supabase-js |
| `tsconfig.json` | TypeScript strict 모드 |
| `tailwind.config.ts` | Tailwind CSS 설정 |
| `postcss.config.js` | PostCSS 설정 |
| `next.config.ts` | Next.js 설정 |
| `app/globals.css` | 다크 테마 + Tailwind directives |
| `app/layout.tsx` | 기본 레이아웃 |
| `app/page.tsx` | 메인 UI (기획안 입력 + 단계별 로딩 + 리스크 리포트) |
| `app/api/analyze/route.ts` | POST API (특성 추출 → 임베딩 → RAG 검색 → 리포트 생성) |
| `lib/supabase.ts` | Supabase 클라이언트 + searchComplaints 함수 |

### npm install ✅ 완료
- Node.js v24.14.1
- 403 패키지 설치 완료

### 다음 할 일
1. `python pipeline/embedder.py` 실행 (Voyage AI 임베딩 → Supabase 저장)
2. `npm run dev` → localhost:3000 테스트
3. 동작 확인 후 Vercel 배포

---

## 3단계: Vercel 배포 ⏳ 예정
