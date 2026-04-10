"use client";

import { useState } from "react";
import { Play, Clock, Hash, DollarSign, Loader2 } from "lucide-react";

type TargetLang = "EN" | "JA" | "ZH";

interface TranslationResult {
  provider: string;
  responseTime: string;
  text: string;
  charCount: number;
  cost: string;
}

const MOCK_PROVIDERS = [
  { name: "DeepL Free", baseTime: 320 },
  { name: "Claude Haiku 4.5", baseTime: 580 },
];

function getMockTranslation(
  text: string,
  lang: TargetLang,
): TranslationResult[] {
  return MOCK_PROVIDERS.map((p) => ({
    provider: p.name,
    responseTime: `${p.baseTime + Math.floor(Math.random() * 80)}ms`,
    text: `[${lang}] ${text}`,
    charCount: text.length,
    cost: p.name.includes("Claude")
      ? `$${(text.length * 0.000002).toFixed(5)}`
      : "무료",
  }));
}

export default function PlaygroundPage() {
  const [inputText, setInputText] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<TargetLang[]>(["EN"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<
    TargetLang,
    TranslationResult[]
  > | null>(null);

  const toggleLang = (lang: TargetLang) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleTranslate = () => {
    if (!inputText.trim() || selectedLangs.length === 0) return;
    setLoading(true);
    setResults(null);
    setTimeout(() => {
      const newResults = {} as Record<TargetLang, TranslationResult[]>;
      selectedLangs.forEach((lang) => {
        newResults[lang] = getMockTranslation(inputText, lang);
      });
      setResults(newResults);
      setLoading(false);
    }, 500);
  };

  const langLabels: Record<TargetLang, string> = {
    EN: "영어",
    JA: "일본어",
    ZH: "중국어",
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">번역 테스트</h1>
          <p className="text-sm text-gray-500 mt-1">
            등록된 AI 모델로 번역 결과를 즉시 비교합니다
          </p>
        </div>

        {/* Input Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            입력 <span className="text-gray-400 font-normal">(한국어)</span>
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="번역할 텍스트를 입력하세요..."
            rows={5}
            className="w-full text-sm text-gray-800 placeholder-gray-400 border border-gray-200 rounded-lg px-4 py-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />

          {/* Character count */}
          <div className="flex items-center justify-between mt-2 mb-4">
            <span className="text-xs text-gray-400">{inputText.length}자</span>
          </div>

          {/* Language toggles */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500 mr-1">번역 언어:</span>
            {(["EN", "JA", "ZH"] as TargetLang[]).map((lang) => (
              <button
                key={lang}
                onClick={() => toggleLang(lang)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  selectedLangs.includes(lang)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <button
            onClick={handleTranslate}
            disabled={
              loading || !inputText.trim() || selectedLangs.length === 0
            }
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                번역 중...
              </>
            ) : (
              <>
                <Play size={16} />
                번역 실행
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="flex flex-col gap-6">
            {(
              Object.entries(results) as [TargetLang, TranslationResult[]][]
            ).map(([lang, providerResults]) => (
              <div key={lang}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {langLabels[lang]} ({lang})
                </h2>
                <div className="flex flex-col gap-3">
                  {providerResults.map((result) => (
                    <div
                      key={result.provider}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-800">
                          {result.provider}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={12} />
                          {result.responseTime}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 mb-3 leading-relaxed">
                        {result.text}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Hash size={12} />
                          {result.charCount}자
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {result.cost}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
