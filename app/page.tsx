"use client";

import { useState } from "react";
import type { AnalyzeResponse, GameFeatures } from "./api/analyze/route";
import type { ComplaintResult } from "@/lib/supabase";

// 분석 단계 상태
type StepStatus = "pending" | "loading" | "done" | "error";

interface AnalysisStep {
  id: number;
  label: string;
  status: StepStatus;
}

const INITIAL_STEPS: AnalysisStep[] = [
  { id: 1, label: "기획안 구조화 중...", status: "pending" },
  { id: 2, label: "유사 불만 패턴 검색 중...", status: "pending" },
  { id: 3, label: "리스크 리포트 생성 중...", status: "pending" },
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

// 위험도별 색상/아이콘 파싱 헬퍼
function parseReportSections(report: string) {
  const sections = {
    high: [] as string[],
    medium: [] as string[],
    low: [] as string[],
    summary: "",
    header: "",
  };

  const lines = report.split("\n");
  let currentSection: "high" | "medium" | "low" | "summary" | "header" | null =
    "header";
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
    if (line.includes("🔴")) {
      flush();
      currentSection = "high";
      continue;
    } else if (line.includes("🟡")) {
      flush();
      currentSection = "medium";
      continue;
    } else if (line.includes("🟢")) {
      flush();
      currentSection = "low";
      continue;
    } else if (line.includes("**종합 의견**") || line.includes("종합 의견")) {
      flush();
      currentSection = "summary";
      continue;
    }
    buffer.push(line);
  }
  flush();

  return sections;
}

// 단계 아이콘
function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done")
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">
        ✓
      </span>
    );
  if (status === "loading")
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
    );
  if (status === "error")
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
        ✕
      </span>
    );
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-600 text-slate-600 text-xs">
      ○
    </span>
  );
}

// 불만 패턴 카드
function RagResultCard({ result }: { result: ComplaintResult }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/60 p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
          {result.complaint_type}
        </span>
        <span className="text-xs text-slate-400">
          유사도 {(result.similarity * 100).toFixed(1)}%
        </span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed">{result.detail}</p>
      <p className="mt-1 text-xs text-slate-500">출처: {result.game}</p>
    </div>
  );
}

// 리스크 섹션 카드
function RiskSection({
  level,
  icon,
  colorClass,
  borderClass,
  items,
}: {
  level: string;
  icon: string;
  colorClass: string;
  borderClass: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div className={`rounded-xl border ${borderClass} bg-slate-800/50 p-5`}>
      <h3 className={`text-base font-bold mb-3 ${colorClass}`}>
        {icon} 위험도 {level}
      </h3>
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

// 특성 배지
function FeatureBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 min-w-0">
      <span className="text-xs text-slate-500 uppercase tracking-wide font-medium">
        {label}
      </span>
      <span className="text-sm text-slate-200 font-semibold truncate" title={value}>
        {value}
      </span>
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

  const updateStep = (id: number, status: StepStatus) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const resetSteps = () => setSteps(INITIAL_STEPS.map((s) => ({ ...s })));

  const handleAnalyze = async () => {
    if (!designDoc.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    resetSteps();

    // 단계 1 시작
    updateStep(1, "loading");

    try {
      // 단계 표시를 위한 타임아웃 시뮬레이션 (실제 API는 하나의 호출)
      // Step 1 → 2 → 3 순서로 UI 표시
      const stepTimer1 = setTimeout(() => {
        updateStep(1, "done");
        updateStep(2, "loading");
      }, 1200);

      const stepTimer2 = setTimeout(() => {
        updateStep(2, "done");
        updateStep(3, "loading");
      }, 3000);

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designDoc: designDoc.trim() }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!response.ok) {
        const errData = (await response.json()) as { error?: string };
        throw new Error(errData.error ?? "분석 요청 실패");
      }

      const data = (await response.json()) as AnalyzeResponse;

      // 성공 시 모든 단계 완료
      setSteps(INITIAL_STEPS.map((s) => ({ ...s, status: "done" as StepStatus })));
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "알 수 없는 오류";
      setError(message);
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "loading" ? { ...s, status: "error" } : s
        )
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
    <div className="min-h-screen bg-slate-900">
      {/* 헤더 */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Game Risk Patcher
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              하이퍼캐주얼 게임 기획 리스크 진단 도구 · Powered by RAG + Claude
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400">RAG 시스템 연결됨</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* 입력 섹션 */}
        <section className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">게임 기획안 입력</h2>
            <button
              onClick={() => setDesignDoc(SAMPLE_DESIGN_DOC)}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors border border-blue-400/30 hover:border-blue-400/60 rounded-md px-3 py-1"
            >
              샘플 기획안 불러오기
            </button>
          </div>
          <textarea
            value={designDoc}
            onChange={(e) => setDesignDoc(e.target.value)}
            placeholder="게임 기획안을 입력하세요.&#10;&#10;예시) 장르, 조작방식, 광고 구조, 보상 체계, 난이도 흐름 등을 포함하면&#10;더 정확한 리스크 분석이 가능합니다."
            className="w-full h-52 bg-slate-900 border border-slate-600 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500
              resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all
              font-mono leading-relaxed"
            disabled={isAnalyzing}
          />
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              {designDoc.length.toLocaleString()}자 입력됨
            </span>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !designDoc.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500
                disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed
                text-white font-semibold text-sm transition-all active:scale-95"
            >
              {isAnalyzing ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  리스크 분석 시작
                </>
              )}
            </button>
          </div>
        </section>

        {/* 분석 단계 표시 */}
        {(isAnalyzing || steps.some((s) => s.status !== "pending")) && (
          <section className="rounded-2xl border border-slate-700 bg-slate-800/30 p-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              분석 진행 상태
            </h2>
            <div className="space-y-3">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  <StepIcon status={step.status} />
                  <span
                    className={`text-sm ${
                      step.status === "done"
                        ? "text-emerald-400"
                        : step.status === "loading"
                        ? "text-blue-400 animate-pulse-soft"
                        : step.status === "error"
                        ? "text-red-400"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.status === "done" && (
                    <span className="text-xs text-emerald-500">완료</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 에러 메시지 */}
        {error && (
          <section className="rounded-2xl border border-red-800/50 bg-red-950/30 p-5">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-lg">⚠</span>
              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-1">분석 중 오류 발생</h3>
                <p className="text-sm text-red-300/80">{error}</p>
                <p className="text-xs text-red-400/60 mt-2">
                  환경변수(ANTHROPIC_API_KEY, VOYAGE_API_KEY, Supabase)가 올바르게 설정되어 있는지 확인하세요.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 결과 리포트 */}
        {result && reportSections && (
          <section className="space-y-5">
            {/* 헤더 및 특성 */}
            <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-white">
                  게임 기획 리스크 진단 리포트
                </h2>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs px-4 py-2 rounded-lg border border-slate-600
                    hover:border-slate-400 text-slate-400 hover:text-slate-200 transition-all"
                >
                  {copied ? (
                    <>
                      <span className="text-emerald-400">✓</span>
                      복사됨
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      리포트 복사
                    </>
                  )}
                </button>
              </div>

              {/* 기획 특성 배지 */}
              {features && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-2">
                  <FeatureBadge label="장르" value={features.genre} />
                  <FeatureBadge label="조작방식" value={features.control} />
                  <FeatureBadge label="광고구조" value={features.ad_structure} />
                  <FeatureBadge label="보상구조" value={features.reward_structure} />
                  <FeatureBadge label="난이도흐름" value={features.difficulty} />
                </div>
              )}
            </div>

            {/* RAG 검색 결과 */}
            {result.ragResults && result.ragResults.length > 0 && (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                  유사 게임 불만 패턴 (RAG 검색 결과 · {result.ragResults.length}건)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.ragResults.map((r, i) => (
                    <RagResultCard key={i} result={r} />
                  ))}
                </div>
              </div>
            )}

            {result.ragResults && result.ragResults.length === 0 && (
              <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-5">
                <p className="text-sm text-slate-500 text-center">
                  유사도 0.7 이상의 불만 패턴이 검색되지 않았습니다.
                  데이터베이스에 관련 데이터가 없거나 기획안이 충분히 구체적이지 않을 수 있습니다.
                </p>
              </div>
            )}

            {/* 위험도별 리스크 카드 */}
            <RiskSection
              level="높음"
              icon="🔴"
              colorClass="text-red-400"
              borderClass="border-red-900/50"
              items={reportSections.high}
            />
            <RiskSection
              level="중간"
              icon="🟡"
              colorClass="text-yellow-400"
              borderClass="border-yellow-900/50"
              items={reportSections.medium}
            />
            <RiskSection
              level="낮음"
              icon="🟢"
              colorClass="text-emerald-400"
              borderClass="border-emerald-900/50"
              items={reportSections.low}
            />

            {/* 종합 의견 */}
            {reportSections.summary && (
              <div className="rounded-2xl border border-blue-900/40 bg-blue-950/20 p-6">
                <h3 className="text-base font-bold text-blue-400 mb-3">
                  종합 의견
                </h3>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {reportSections.summary}
                </p>
              </div>
            )}

            {/* 원문 리포트 (fallback: 파싱이 안 된 경우) */}
            {!reportSections.high.length &&
              !reportSections.medium.length &&
              !reportSections.low.length &&
              !reportSections.summary && (
                <div className="rounded-2xl border border-slate-700 bg-slate-800/30 p-6">
                  <h3 className="text-sm font-semibold text-slate-400 mb-3">
                    분석 리포트
                  </h3>
                  <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                    {result.report}
                  </pre>
                </div>
              )}
          </section>
        )}
      </main>

      <footer className="border-t border-slate-800 mt-16 py-6 text-center">
        <p className="text-xs text-slate-600">
          Game Risk Patcher · Supercent AI Application Engineer 과제 · 슈퍼센트
        </p>
      </footer>
    </div>
  );
}
