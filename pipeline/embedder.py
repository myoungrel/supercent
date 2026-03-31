# pipeline/embedder.py
#
# 실행 방법:
#   cd pipeline
#   python embedder.py
#
# 입력: pipeline/data/structured_complaints.json
# 출력: Supabase complaints 테이블에 upsert
#
# Supabase 테이블 스키마 (사전에 실행 필요):
# ------------------------------------------------------------
# create extension if not exists vector;
#
# create table if not exists complaints (
#   id          bigserial primary key,
#   game        text not null,
#   genre       text,
#   complaint_type text,
#   detail      text,
#   original_review text,
#   embedding   vector(1536),
#   created_at  timestamptz default now()
# );
#
# create index on complaints
#   using ivfflat (embedding vector_cosine_ops)
#   with (lists = 100);
#
# create or replace function match_complaints(
#   query_embedding vector(1536),
#   match_threshold float,
#   match_count int
# )
# returns table (
#   id bigint,
#   game text,
#   genre text,
#   complaint_type text,
#   detail text,
#   original_review text,
#   similarity float
# )
# language sql stable
# as $$
#   select
#     id, game, genre, complaint_type, detail, original_review,
#     1 - (embedding <=> query_embedding) as similarity
#   from complaints
#   where 1 - (embedding <=> query_embedding) > match_threshold
#   order by similarity desc
#   limit match_count;
# $$;
# ------------------------------------------------------------

import json
import os
import time
from pathlib import Path

import openai
from dotenv import load_dotenv
from supabase import create_client, Client

# 환경변수 로드: 스크립트 기준 상위 폴더에서 .env.local 탐색
_script_dir = Path(__file__).parent
for _candidate in [_script_dir / "../.env.local", _script_dir / "../../.env.local"]:
    if _candidate.exists():
        load_dotenv(_candidate)
        print(f"환경변수 로드: {_candidate.resolve()}")
        break

# 경로 설정
DATA_DIR = _script_dir / "data"
INPUT_FILE = DATA_DIR / "structured_complaints.json"

# 설정
EMBEDDING_MODEL = "text-embedding-3-small"
BATCH_SIZE = 20
SLEEP_BETWEEN_REQUESTS = 0.5

# OpenAI 클라이언트
openai_client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])

# Supabase 클라이언트
supabase: Client = create_client(
    os.environ["NEXT_PUBLIC_SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)


def get_embedding(text: str) -> list[float]:
    """텍스트를 임베딩 벡터로 변환한다."""
    response = openai_client.embeddings.create(
        input=text,
        model=EMBEDDING_MODEL,
    )
    return response.data[0].embedding


def upsert_batch(records: list[dict]) -> int:
    """배치 단위로 Supabase에 upsert한다. 저장된 건수를 반환한다."""
    try:
        result = supabase.table("complaints").upsert(records).execute()
        return len(result.data) if result.data else 0
    except Exception as e:
        print(f"  Supabase upsert 오류: {e}")
        return 0


def main():
    # 입력 파일 확인
    if not INPUT_FILE.exists():
        print(f"오류: {INPUT_FILE} 파일이 없습니다. 먼저 preprocessor.py를 실행하세요.")
        return

    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        complaints = json.load(f)

    print(f"구조화된 불만 패턴 총 {len(complaints)}건 로드 완료")

    total_saved = 0
    batch = []

    for i, item in enumerate(complaints, 1):
        detail = item.get("detail", "")
        if not detail:
            continue

        try:
            embedding = get_embedding(detail)

            record = {
                "game": item.get("game", ""),
                "genre": item.get("genre", "하이퍼캐주얼"),
                "complaint_type": item.get("complaint_type", ""),
                "detail": detail,
                "original_review": item.get("original_review", ""),
                "embedding": embedding,
            }
            batch.append(record)

        except Exception as e:
            print(f"  임베딩 오류 ({item.get('game', '')}): {e}")
            continue

        # 배치가 꽉 찼으면 upsert
        if len(batch) >= BATCH_SIZE:
            saved = upsert_batch(batch)
            total_saved += saved
            print(f"  진행: {i}/{len(complaints)} | 저장 완료: {total_saved}건")
            batch = []

        time.sleep(SLEEP_BETWEEN_REQUESTS)

    # 남은 배치 처리
    if batch:
        saved = upsert_batch(batch)
        total_saved += saved

    print(f"\n임베딩 및 저장 완료!")
    print(f"  처리 건수: {len(complaints)}건")
    print(f"  Supabase 저장: {total_saved}건")


if __name__ == "__main__":
    main()
