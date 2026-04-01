import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface ComplaintResult {
  id: string;
  game: string;
  complaint_type: string;
  detail: string;
  original_review: string;
  similarity: number;
}

/**
 * Supabase pgvector에서 유사 불만 패턴 검색
 * @param queryEmbedding - voyage-3 임베딩 벡터 (1024차원)
 * @param limit - 반환할 결과 개수 (기본값: 5)
 * @returns 유사도 0.7 이상인 불만 패턴 상위 N개
 */
export async function searchComplaints(
  queryEmbedding: number[],
  limit = 5
): Promise<ComplaintResult[]> {
  const { data, error } = await supabase.rpc("match_complaints", {
    query_embedding: queryEmbedding,
    match_threshold: 0.6,
    match_count: limit,
  });

  if (error) {
    console.error("Supabase searchComplaints error:", error);
    throw new Error(`벡터 검색 실패: ${error.message}`);
  }

  return (data as ComplaintResult[]) ?? [];
}
