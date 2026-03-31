"use client";

import { useState } from "react";
import type { AnalyzeResponse, GameFeatures } from "./api/analyze/route";
import type { ComplaintResult } from "@/lib/supabase";

type StepStatus = "pending" | "loading" | "done" | "error";

interface AnalysisStep {
  id: number;
  label: string;
  status: StepStatus;
}

const INITIAL_STEPS: AnalysisStep[] = [
  { id: 1, label: "기획안 구조화", status: "pending" },
  { id: 2, label: "불만 패턴 검색", status: "pending" },
  { id: 3, label: "리스크 리포트 생성", status: "pending" },
];

const SAMPLE_DESIGN_DOC = `게임명: 스택 러시 (Stack Rush)

장르: 하이퍼캐주얼 러너

핵심 게임플레이:
- 자동으로 달리는 캐릭터를 좌우로 스와이프하여 조작
- 길에 놓인 블록을 쌓아서 높은 점수 획득
- 장애물(가시, 낭떠러지)을 피해 최대한 멀리 달리기
- 스테이지마다 보스 구간 존재 (타이밍 맞춰 버튼 클릭)

광고 구조:
- 스테이지 클리어마다 전면 광고 1회 노출
- 계속하기(부활) 시 리워드 광고 시청
- 게임 오버 후 광고 시청하면 코인 2배 지급

보상 구조:
- 스테이지 클리어 시 코인 지급
- 코인으로 캐릭터 스킨 구매
- 일일 미션 달성 시 다이아몬드 지급
- 다이아몬드로 프리미엄 스킨 구매

난이도 흐름:
- 1~10 스테이지: 쉬운 난이도, 튜토리얼 없음
- 11~30 스테이지: 중간 난이도, 장애물 급증
- 31스테이지 이후: 고난이도, 타이밍 패턴 복잡
- 보스 구간: 매 10스테이지마다 등장, 실패 시 처음부터`;

function parseReportSections(report: string) {
  const sections = {
    high: [] as string[],
    medium: [] as string[],
    low: [] as string[],
    summary: "",
    header: "",
  };

  const lines = report.split("\n");
  let currentSection: "high" | "medium" | "low" | "summary" | "header" | null = "header";
  let buffer: string[] = [];

  const flush = () => {
    if (!currentSection) return;
    const text = buffer.join("\n").trim();
    if (!text) return;
    if (currentSection === "high") sections.high.push(text);
    else if (currentSection === "medium") sections.medium.push(text);
    else if (currentSection === "low") sections.low.push(text);
    else if (currentSection === "summary") sections.summary += text;
    else if (currentSection === "header") sections.header += text + "\n";
    buffer = [];
  };

  for (const line of lines) {
    if (line.includes("🔴")) { flush(); currentSection = "high"; continue; }
    else if (line.includes("🟡")) { flush(); currentSection = "medium"; continue; }
    else if (line.includes("🟢")) { flush(); currentSection = "low"; continue; }
    else if (line.includes("종합 의견")) { flush(); currentSection = "summary"; continue; }
    buffer.push(line);
  }
  flush();

  return sections;
}

function RagResultCard({ result }: { result: ComplaintResult }) {
  return (
    <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-4 hover:border-zinc-600 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-amber-400 tracking-widest uppercase">
          {result.complaint_type}
        </span>
        <span className="text-xs text-zinc-500">
          {(result.similarity * 100).toFixed(1)}% 유사
        </span>
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{result.detail}</p>
      {result.original_review && (
        <p className="mt-3 text-xs text-zinc-500 italic border-l-2 border-zinc-700 pl-3 leading-relaxed">
          {result.original_review}
        </p>
      )}
      <p className="mt-3 text-xs text-zinc-600">{result.game}</p>
    </div>
  );
}

function RiskSection({
  level, dot, textColor, items,
}: {
  level: string;
  dot: string;
  textColor: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="border border-zinc-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h3 className={`text-sm font-semibold tracking-wide ${textColor}`}>
          위험도 {level}
        </h3>
      </div>
      <div className="space-y-4">
        {items.map((item, i) => (
          <p key={i} className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function FeatureBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-zinc-800 rounded-lg px-4 py-3">
      <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm text-zinc-200 font-medium truncate" title={value}>{value}</p>
    </div>
  );
}

export default function Home() {
  const [designDoc, setDesignDoc] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<AnalysisStep[]>(INITIAL_STEPS);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const updateStep = (id: number, status: StepStatus) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));

  const resetSteps = () => setSteps(INITIAL_STEPS.map((s) => ({ ...s })));

  const handleAnalyze = async () => {
    if (!designDoc.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    resetSteps();
    updateStep(1, "loading");

    try {
      const t1 = setTimeout(() => { updateStep(1, "done"); updateStep(2, "loading"); }, 1200);
      const t2 = setTimeout(() => { updateStep(2, "done"); updateStep(3, "loading"); }, 3000);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designDoc: designDoc.trim() }),
      });

      clearTimeout(t1);
      clearTimeout(t2);

      if (!response.ok) {
        const errData = (await response.json()) as { error?: string };
        throw new Error(errData.error ?? "분석 요청 실패");
      }

      const data = (await response.json()) as AnalyzeResponse;
      setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "done" as StepStatus })));
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(message);
      setSteps((prev) =>
        prev.map((s) => s.status === "loading" ? { ...s, status: "error" } : s)
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopy = async () => {
    if (!result?.report) return;
    await navigator.clipboard.writeText(result.report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reportSections = result ? parseReportSections(result.report) : null;
  const features: GameFeatures | null = result?.features ?? null;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* 헤더 */}
      <header className="border-b border-zinc-900 sticky top-0 z-10 bg-black/90 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-lg tracking-tight">RiskPatch</span>
            <span className="text-zinc-700 text-sm">|</span>
            <span className="text-zinc-500 text-sm">게임 기획 리스크 진단</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-600">RAG 연결됨</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-6">
        {/* 히어로 */}
        <div className="py-8">
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
            게임 기획안 리스크 분석
          </h1>
          <p className="text-zinc-500 text-base leading-relaxed">
            실제 플레이스토어 저평점 리뷰 데이터를 기반으로 기획안의 잠재적 불만 요소를 사전에 탐지합니다.
          </p>
        </div>

        {/* 입력 섹션 */}
        <div className="border border-zinc-800 rounded-2xl p-6 bg-zinc-950">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest">기획안 입력</h2>
            <button
              onClick={() => setDesignDoc(SAMPLE_DESIGN_DOC)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              샘플 불러오기 →
            </button>
          </div>
          <textarea
            value={designDoc}
            onChange={(e) => setDesignDoc(e.target.value)}
            placeholder="장르, 조작방식, 광고 구조, 보상 체계, 난이도 흐름 등을 포함하면 더 정확한 분석이 가능합니다."
            className="w-full h-48 bg-black border border-zinc-800 rounded-xl p-4 text-sm text-zinc-300 placeholder-zinc-700
              resize-none focus:outline-none focus:border-zinc-600 transition-colors leading-relaxed"
            disabled={isAnalyzing}
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-zinc-700">{designDoc.length.toLocaleString()}자</span>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !designDoc.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-400 text-black text-sm font-semibold
                hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed
                transition-all active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  분석 중
                </>
              ) : (
                "리스크 분석 시작"
              )}
            </button>
          </div>
        </div>

        {/* 분석 단계 */}
        {(isAnalyzing || steps.some((s) => s.status !== "pending")) && (
          <div className="border border-zinc-800 rounded-2xl p-5 bg-zinc-950">
            <div className="flex items-center gap-8">
              {steps.map((step, i) => (
                <div key={step.id} className="flex items-center gap-3">
                  {i > 0 && <span className="text-zinc-800 text-xs">—</span>}
                  <div className="flex items-center gap-2">
                    {step.status === "done" ? (
                      <span className="h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white">✓</span>
                    ) : step.status === "loading" ? (
                      <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin block" />
                    ) : step.status === "error" ? (
                      <span className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center text-xs text-white">✕</span>
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-zinc-700" />
                    )}
                    <span className={`text-xs ${
                      step.status === "done" ? "text-emerald-400"
                      : step.status === "loading" ? "text-amber-400"
                      : step.status === "error" ? "text-red-400"
                      : "text-zinc-700"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 에러 */}
        {error && (
          <div className="border border-red-900/50 rounded-2xl p-5 bg-red-950/20">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* 결과 */}
        {result && reportSections && (
          <div className="space-y-4">
            {/* 기획 특성 */}
            {features && (
              <div className="border border-zinc-800 rounded-2xl p-5 bg-zinc-950">
                <h2 className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-4">분석된 기획 특성</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <FeatureBadge label="장르" value={features.genre} />
                  <FeatureBadge label="조작방식" value={features.control} />
                  <FeatureBadge label="광고구조" value={features.ad_structure} />
                  <FeatureBadge label="보상구조" value={features.reward_structure} />
                  <FeatureBadge label="난이도" value={features.difficulty} />
                </div>
              </div>
            )}

            {/* RAG 결과 */}
            {result.ragResults && result.ragResults.length > 0 && (
              <div className="border border-zinc-800 rounded-2xl p-5 bg-zinc-950">
                <h2 className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-4">
                  유사 불만 패턴 · {result.ragResults.length}건
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.ragResults.map((r, i) => (
                    <RagResultCard key={i} result={r} />
                  ))}
                </div>
              </div>
            )}

            {/* 리스크 리포트 */}
            <div className="border border-zinc-800 rounded-2xl p-5 bg-zinc-950">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xs font-medium text-zinc-600 uppercase tracking-widest">리스크 리포트</h2>
                <button
                  onClick={handleCopy}
                  className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
                >
                  {copied ? "복사됨 ✓" : "복사"}
                </button>
              </div>
              <div className="space-y-4">
                <RiskSection level="높음" dot="bg-red-500" textColor="text-red-400" items={reportSections.high} />
                <RiskSection level="중간" dot="bg-amber-400" textColor="text-amber-400" items={reportSections.medium} />
                <RiskSection level="낮음" dot="bg-emerald-500" textColor="text-emerald-400" items={reportSections.low} />
              </div>

              {reportSections.summary && (
                <div className="mt-5 pt-5 border-t border-zinc-800">
                  <h3 className="text-xs font-medium text-zinc-600 uppercase tracking-widest mb-3">종합 의견</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {reportSections.summary}
                  </p>
                </div>
              )}

              {!reportSections.high.length && !reportSections.medium.length &&
               !reportSections.low.length && !reportSections.summary && (
                <pre className="text-sm text-zinc-400 whitespace-pre-wrap leading-relaxed font-sans">
                  {result.report}
                </pre>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 mt-20 py-6 text-center">
        <p className="text-xs text-zinc-800">RiskPatch · Supercent AI Application Engineer</p>
      </footer>
    </div>
  );
}
