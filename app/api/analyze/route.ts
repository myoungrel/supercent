import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { VoyageAIClient } from "voyageai";
import { searchComplaints, ComplaintResult } from "@/lib/supabase";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const voyageClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY!,
});

export interface AnalyzeResponse {
  features: GameFeatures;
  ragResults: ComplaintResult[];
  report: string;
}

export interface GameFeatures {
  genre: string;
  control: string;
  ad_structure: string;
  reward_structure: string;
  difficulty: string;
  search_queries: string[];
}

async function extractGameFeatures(designDoc: string): Promise<GameFeatures> {
  const prompt = `당신은 하이퍼캐주얼 게임 기획 전문가입니다.
아래 게임 기획안에서 유저 불만과 관련될 수 있는 핵심 요소를 추출하세요.

## 추출할 요소
1. 장르: 게임의 핵심 장르 (러너, 퍼즐, 아이들, 클리커 등)
2. 조작방식: 핵심 인터랙션 방식 (탭, 스와이프, 기울기 등)
3. 광고구조: 광고 노출 방식과 빈도
4. 보상구조: 보상 지급 방식과 진행 구조
5. 난이도흐름: 난이도 곡선과 구조

## 출력 형식 (JSON)
{
  "genre": "장르",
  "control": "조작방식",
  "ad_structure": "광고구조 설명",
  "reward_structure": "보상구조 설명",
  "difficulty": "난이도 흐름 설명",
  "search_queries": ["광고 관련 불만 문장", "난이도 관련 불만 문장", "보상 관련 불만 문장", "조작 관련 불만 문장", "반복피로 관련 불만 문장", "과금 관련 불만 문장", "UI/UX 관련 불만 문장"]
}

기획안:
${designDoc}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text : "";

  const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) ||
    rawText.match(/(\{[\s\S]*\})/);

  if (!jsonMatch) {
    throw new Error("기획안 분석 결과에서 JSON을 파싱할 수 없습니다.");
  }

  try {
    return JSON.parse(jsonMatch[1].trim()) as GameFeatures;
  } catch {
    throw new Error("기획안 분석 JSON 파싱 실패: " + jsonMatch[1]);
  }
}


async function multiQuerySearch(queries: string[]): Promise<ComplaintResult[]> {
  // 7개 쿼리를 1번 배치 호출로 임베딩
  const response = await voyageClient.embed({
    input: queries,
    model: "voyage-3",
    inputType: "query",
  });
  const embeddings = queries.map((_, i) => response.data?.[i]?.embedding ?? []);

  // 모든 임베딩으로 병렬 검색
  const results = await Promise.allSettled(
    embeddings.map((embedding) => searchComplaints(embedding, 8))
  );

  // 결과 합치기 + detail 기준 중복 제거 + 유사도 높은 순 정렬
  const merged: ComplaintResult[] = [];
  const seen = new Set<string>();

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const item of result.value) {
        if (!seen.has(item.detail)) {
          seen.add(item.detail);
          merged.push(item);
        }
      }
    }
  }

  merged.sort((a, b) => b.similarity - a.similarity);
  return merged.slice(0, 10);
}

async function generateRiskReport(
  features: GameFeatures,
  ragResults: ComplaintResult[]
): Promise<string> {
  const featuresText = JSON.stringify(features, null, 2);
  const ragText =
    ragResults.length > 0
      ? ragResults
          .map(
            (r, i) =>
              `${i + 1}. [${r.complaint_type}] ${r.detail} (게임: ${r.game}, 유사도: ${(r.similarity * 100).toFixed(1)}%)`
          )
          .join("\n")
      : "유사한 불만 사례가 검색되지 않았습니다.";

  const prompt = `당신은 하이퍼캐주얼 게임 기획 리스크 분석 전문가입니다.
아래 게임 기획안 특성과 유사 게임에서 발생한 실제 불만 사례를 바탕으로
리스크 리포트를 작성하세요.

## 게임 기획안 특성
${featuresText}

## 유사 게임의 실제 불만 사례 (RAG 검색 결과)
${ragText}

## 리포트 작성 원칙
- 실제 리뷰 데이터에 근거해서만 판단할 것
- 데이터에 없는 내용은 추측하지 말 것
- 각 항목은 2~3줄로 간결하게 작성할 것
- 기획 보완 제안은 1줄로 핵심만 작성할 것
- 위험도는 유사 불만의 빈도와 심각도 기반으로 판단
- **와 __ 같은 마크다운 강조 기호는 절대 사용하지 말 것 (일반 텍스트로만 작성)

## 출력 형식
### 게임 기획 리스크 진단 리포트

**분석된 기획 특성**
- 장르: ...
- 광고구조: ...
- 보상구조: ...
- 난이도흐름: ...

**리스크 항목**

🔴 높음
- [불만유형] 리스크 설명 (1줄)
  근거: 유사 리뷰 요약 (1줄)
  기획 보완: 수정 방향 (1줄)

🟡 중간
- [불만유형] 리스크 설명 (1줄)
  근거: 유사 리뷰 요약 (1줄)
  기획 보완: 수정 방향 (1줄)

🟢 낮음
- [불만유형] 리스크 설명 (1줄)
  근거: 유사 리뷰 요약 (1줄)
  기획 보완: 수정 방향 (1줄)

**종합 의견**
전반적 리스크 수준과 핵심 개선 포인트 (3줄 이내)`;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  let fullText = "";
  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      fullText += chunk.delta.text;
    }
  }

  return fullText;
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { designDoc?: string };
  const { designDoc } = body;

  if (!designDoc || typeof designDoc !== "string" || designDoc.trim() === "") {
    return new Response(JSON.stringify({ error: "기획안 텍스트(designDoc)가 필요합니다." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // Step 1: 기획안 구조화
        send("step", { step: 1, status: "loading" });
        const features = await extractGameFeatures(designDoc.trim());
        send("step", { step: 1, status: "done" });

        // Step 2: Multi-query 병렬 임베딩 + RAG 검색
        send("step", { step: 2, status: "loading" });
        let ragResults: ComplaintResult[] = [];
        try {
          ragResults = await multiQuerySearch(features.search_queries);
        } catch {
          ragResults = [];
        }
        send("step", { step: 2, status: "done" });
        send("rag", ragResults.slice(0, 5));

        // Step 3: 리포트 생성
        send("step", { step: 3, status: "loading" });
        const report = await generateRiskReport(features, ragResults);
        send("step", { step: 3, status: "done" });

        send("result", { features, ragResults: ragResults.slice(0, 5), report });
      } catch (err) {
        send("error", { message: err instanceof Error ? err.message : "서버 오류" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
