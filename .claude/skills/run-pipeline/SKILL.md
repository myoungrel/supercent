---
name: run-pipeline
description: 리뷰 스크래핑 → LLM 전처리 → 임베딩 파이프라인을 순서대로 실행합니다
tools: Bash, Read, Edit
---

pipeline/ 폴더의 데이터 수집 파이프라인을 순서대로 실행하세요.

## 실행 순서

1. **환경 확인**
   - pipeline/ 폴더 존재 확인
   - Python 패키지 설치 여부 확인 (`pip list | grep google-play-scraper`)
   - .env.local에 필요한 키 있는지 확인

2. **스크래핑 실행**
   ```bash
   cd pipeline && python scraper.py
   ```
   - 완료 후 data/raw_reviews.json 생성 확인

3. **전처리 실행**
   ```bash
   python preprocessor.py
   ```
   - 완료 후 data/structured_complaints.json 생성 확인
   - 전처리 전후 건수 비교해서 노이즈 제거 비율 출력

4. **임베딩 + DB 저장**
   ```bash
   python embedder.py
   ```
   - Supabase에 저장된 레코드 수 확인

## 오류 시 처리
- 패키지 없으면 `pip install -r requirements.txt` 먼저 실행
- API 키 오류면 .env.local 확인 안내
- 각 단계 완료 여부를 명확하게 보고
