# 개발 진행 기록

## 1단계: 데이터 파이프라인 ✅

### 생성된 파일
| 파일 | 설명 |
|------|------|
| `pipeline/scraper.py` | 플레이스토어 한국어 리뷰 스크래핑 |
| `pipeline/preprocessor.py` | Claude haiku로 노이즈 제거 + 불만 구조화 |
| `pipeline/embedder.py` | OpenAI 임베딩 + Supabase 저장 |
| `pipeline/requirements.txt` | Python 패키지 목록 |

### 결과
- 수집 리뷰: **3,636건** (20개 게임 × 한국어 1~2점)
- 저장 위치: `pipeline/data/raw_reviews.json`

### 오류 및 해결

**문제 1: 게임 ID 404 오류**
- 원인: 초기 게임 목록(com.voodoo.paperio2 등)이 한국 플레이스토어에 없는 게임들
- 해결: 실제 한국 플레이스토어에 존재하는 게임 ID로 전체 교체
- 교체된 게임 목록:
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

**문제 2: 전처리 대기 시간**
- 원인: 3,636개 × API 호출 × 0.5초 대기 = 약 30분 소요
- 해결: 정상 동작 확인, Anthropic API 충전 후 실행 예정

---

## 2단계: RAG 시스템 ⏳ 예정
- Supabase 테이블 생성 완료
- embedder.py 실행 대기 중 (전처리 완료 후)

## 3단계: Next.js 앱 ⏳ 예정

## 4단계: Vercel 배포 ⏳ 예정
