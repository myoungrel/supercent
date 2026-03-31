# pipeline/scraper.py
#
# 실행 방법:
#   cd pipeline
#   pip install -r requirements.txt
#   python scraper.py
#
# 출력: pipeline/data/raw_reviews.json

import json
import os
import time
from pathlib import Path

from google_play_scraper import reviews, Sort

# 출력 경로 설정
DATA_DIR = Path(__file__).parent / "data"
OUTPUT_FILE = DATA_DIR / "raw_reviews.json"

# 대상 게임 목록 (하이퍼캐주얼 20개)
GAMES = [
    "com.fingersoft.hillclimb",       # Hill Climb Racing
    "com.kiloo.subwaysurf",            # Subway Surfers
    "com.imangi.templerun2",           # Temple Run 2
    "com.ketchapp.knifehit",           # Knife Hit
    "com.yodo1.crossyroad",            # Crossy Road
    "com.king.candycrushsaga",         # Candy Crush Saga
    "com.halfbrick.fruitninja",        # Fruit Ninja Classic
    "com.outfit7.mytalkingtomfriends", # My Talking Tom Friends
    "com.ketchapp.stack",              # Stack
    "com.innersloth.spacemafia",       # Among Us
    "com.habby.archero",               # Archero
    "com.playgendary.kickthebuddy",    # Kick the Buddy
    "com.miniclip.soccerstars",        # Soccer Stars
    "com.playrix.gardenscapes",        # Gardenscapes
    "com.supercell.brawlstars",        # Brawl Stars
    "com.supercell.clashroyale",       # Clash Royale
    "com.miniclip.agar.io",            # Agar.io
    "jp.co.hit_point.tabikaeru",       # 여행개구리
    "com.roblox.client",               # Roblox
    "com.mojang.minecraftpe",          # Minecraft
]

REVIEWS_PER_GAME = 100
LOW_STAR_SCORES = [1, 2]


def scrape_game_reviews(app_id: str) -> list[dict]:
    """게임 하나의 1~2점 한국어 리뷰를 수집한다."""
    collected = []

    for score in LOW_STAR_SCORES:
        try:
            result, _ = reviews(
                app_id,
                lang="ko",
                country="kr",
                sort=Sort.NEWEST,
                count=REVIEWS_PER_GAME,
                filter_score_with=score,
            )
            for r in result:
                collected.append(
                    {
                        "game": app_id,
                        "score": r.get("score"),
                        "review_text": r.get("content", ""),
                        "at": str(r.get("at", "")),
                        "thumbs_up_count": r.get("thumbsUpCount", 0),
                    }
                )
            print(f"  [{app_id}] score={score} → {len(result)}건 수집")
        except Exception as e:
            print(f"  [{app_id}] score={score} 오류 발생, 건너뜀: {e}")

        time.sleep(0.5)

    return collected


def main():
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    all_reviews = []

    for i, app_id in enumerate(GAMES, 1):
        print(f"[{i}/{len(GAMES)}] {app_id} 스크래핑 중...")
        game_reviews = scrape_game_reviews(app_id)
        all_reviews.extend(game_reviews)
        print(f"  → 현재까지 누적: {len(all_reviews)}건")

    # 저장
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_reviews, f, ensure_ascii=False, indent=2)

    print(f"\n완료! 총 {len(all_reviews)}건의 리뷰를 {OUTPUT_FILE}에 저장했습니다.")


if __name__ == "__main__":
    main()
