# pipeline/preprocessor.py
#
# 실행 방법:
#   cd pipeline
#   python preprocessor.py
#
# 입력: pipeline/data/raw_reviews.json
# 출력: pipeline/data/structured_complaints.json

import json
import os
import time
from pathlib import Path

import anthropic
from dotenv import load_dotenv

# 환경변수 로드: 스크립트 기준 상위 폴더에서 .env.local 탐색
_script_dir = Path(__file__).parent
for _candidate in [_script_dir / "../.env.local", _script_dir / "../../.env.local"]:
    if _candidate.exists():
        load_dotenv(_candidate)
        print(f"환경변수 로드: {_candidate.resolve()}")
        break

# 경로 설정
DATA_DIR = _script_dir / "data"
INPUT_FILE = DATA_DIR / "raw_reviews.json"
OUTPUT_FILE = DATA_DIR / "structured_complaints.json"

# Claude 클라이언트
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
MODEL = "claude-haiku-4-5-20251001"

# Stage 1 프롬프트 (CONTEXT_ENGINEERING.md 그대로)
SYSTEM_PROMPT = """당신은 게임 리뷰 분석 전문가입니다.
아래 게임 리뷰에서 구체적인 불만 사항을 추출하세요.

## 제거할 리뷰 (null 반환)
- 욕설이나 단순 감정 표현만 있는 리뷰 (예: "최악", "쓰레기")
- 10자 미만의 의미 없는 짧은 리뷰
- 게임 외적 문제 (설치 오류, 기기 문제 등)
- 칭찬만 있고 불만이 없는 리뷰

## 추출할 불만 유형
- 광고피로: 광고가 너무 많거나 강제적
- 조작불편: 컨트롤이 어색하거나 반응이 나쁨
- 반복피로: 콘텐츠가 단조롭거나 반복적
- 난이도: 갑자기 어려워지거나 불공평한 난이도
- 보상부족: 보상이 적거나 진행이 막힘
- 과금유도: 억지스러운 유료 유도
- UI/UX: 인터페이스나 조작성 문제

## 출력 형식 (유효한 불만일 때만)
{
  "complaint_type": "위 7가지 중 하나",
  "detail": "구체적인 불만 내용 (1-2문장, 한국어로 요약)",
  "original_review": "원문 그대로"
}

유효한 불만이 없으면 null을 반환하세요."""


def process_review(game: str, review_text: str) -> dict | None:
    """리뷰 하나를 LLM으로 전처리한다. 유효하지 않으면 None 반환."""
    user_message = f"게임명: {game}\n리뷰: {review_text}"

    try:
        response = client.messages.create(
            model=MODEL,
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )
        raw_text = response.content[0].text.strip()

        # "null" 또는 빈 응답 처리
        if raw_text.lower() == "null" or not raw_text:
            return None

        # JSON 파싱 (코드 블록 감싸진 경우 제거)
        if raw_text.startswith("```"):
            lines = raw_text.splitlines()
            raw_text = "\n".join(
                line for line in lines if not line.startswith("```")
            ).strip()

        parsed = json.loads(raw_text)

        # 필수 키 확인
        if not all(k in parsed for k in ("complaint_type", "detail", "original_review")):
            return None

        return parsed

    except json.JSONDecodeError:
        return None
    except Exception as e:
        print(f"  API 오류 ({game}): {e}")
        return None


def main():
    # 입력 파일 확인
    if not INPUT_FILE.exists():
        print(f"오류: {INPUT_FILE} 파일이 없습니다. 먼저 scraper.py를 실행하세요.")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        raw_reviews = json.load(f)

    print(f"원시 리뷰 총 {len(raw_reviews)}건 로드 완료")

    structured = []
    skipped = 0

    for i, item in enumerate(raw_reviews, 1):
        game = item.get("game", "unknown")
        review_text = item.get("review_text", "")

        if not review_text:
            skipped += 1
            continue

        result = process_review(game, review_text)

        if result is not None:
            # 게임 정보 추가
            result["game"] = game
            result["genre"] = "하이퍼캐주얼"
            structured.append(result)
        else:
            skipped += 1

        # 진행 상황 출력
        if i % 50 == 0:
            print(f"  진행: {i}/{len(raw_reviews)} | 유효: {len(structured)} | 제거: {skipped}")

        time.sleep(0.5)

    # 저장
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(structured, f, ensure_ascii=False, indent=2)

    print(f"\n처리 완료!")
    print(f"  처리 전: {len(raw_reviews)}건")
    print(f"  유효 불만: {len(structured)}건")
    print(f"  제거(노이즈): {skipped}건")
    print(f"  저장 위치: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
