import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { VoyageAIClient } from "voyageai";
import { searchComplaints, ComplaintResult } from "@/lib/supabase";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const voyageClient = new VoyageAIClient({
  apiKey: process.env.VOYAGE_API_KEY!,
});

export interface GameFeatures {
  genre: string;
  control: string;
  ad_structure: string;
  reward_structure: string;
  difficulty: string;
  search_query: string;
}

export interface AnalyzeResponse {
  features: GameFeatures;
  ragResults: ComplaintResult[];
  report: string;
}

// Stage 2: 기획안 핵심 요소 추출 (CONTEXT_ENGINEERING.md Stage 2 프롬프트)
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
  "search_query": "RAG 검색에 최적화된 자연어 쿼리 (핵심 불만 유발 요소 중심)"
}

기획안:
${designDoc}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const rawText =
    message.content[0].type === "text" ? message.content[0].text : "";

  // JSON 블록 추출 (마크다운 코드블록 대응)
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

// Stage 3: Voyage AI voyage-3으로 임베딩 생성 (1024차원)
async function embedQuery(query: string): Promise<number[]> {
  const response = await voyageClient.embed({
    input: query,
    model: "voyage-3",
  });

  const embedding = response.data?.[0]?.embedding;
  if (!embedding) {
    throw new Error("Voyage AI 임베딩 생성 실패");
  }

  return embedding;
}

// Stage 4: 리스크 리포트 생성 (CONTEXT_ENGINEERING.md Stage 4 프롬프트)
async function generateRiskReport(
  designDoc: string,
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
전반적 리스크 수준과 핵심 개선 포인트 (3줄 이내)

기획안:
${designDoc}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  return message.content[0].type === "text" ? message.content[0].text : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { designDoc?: string };
    const { designDoc } = body;

    if (!designDoc || typeof designDoc !== "string" || designDoc.trim() === "") {
      return NextResponse.json(
        { error: "기획안 텍스트(designDoc)가 필요합니다." },
        { status: 400 }
      );
    }

    // Step 1: 기획안 핵심 요소 추출 (Claude sonnet-4-6)
    let features: GameFeatures;
    try {
      features = await extractGameFeatures(designDoc.trim());
    } catch (err) {
      console.error("Feature extraction error:", err);
      return NextResponse.json(
        { error: "기획안 구조화 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // Step 2: search_query를 Voyage AI voyage-3으로 임베딩 (1024차원)
    let embedding: number[];
    try {
      embedding = await embedQuery(features.search_query);
    } catch (err) {
      console.error("Embedding error:", err);
      return NextResponse.json(
        { error: "임베딩 생성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // Step 3: Supabase match_complaints로 유사 불만 패턴 Top 5 검색
    let ragResults: ComplaintResult[] = [];
    try {
      ragResults = await searchComplaints(embedding, 5);
    } catch (err) {
      console.error("RAG search error:", err);
      // 검색 실패 시 빈 배열로 진행 (리포트는 생성 가능)
      ragResults = [];
    }

    // Step 4: 리스크 리포트 생성 (Claude sonnet-4-6)
    let report: string;
    try {
      report = await generateRiskReport(designDoc.trim(), features, ragResults);
    } catch (err) {
      console.error("Report generation error:", err);
      return NextResponse.json(
        { error: "리스크 리포트 생성 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const response: AnalyzeResponse = {
      features,
      ragResults,
      report,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("Unexpected error in /api/analyze:", err);
    return NextResponse.json(
      { error: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
