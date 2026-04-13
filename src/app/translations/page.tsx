"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FileText,
  Loader2,
  Search,
  Copy,
  Check,
  Download,
  ChevronLeft,
  ChevronRight,
  Languages,
} from "lucide-react";

interface Site {
  id: string;
  name: string;
  domain: string;
  active: boolean;
}

interface Language {
  id: string;
  code: string;
  name: string;
  isSource: boolean;
  active: boolean;
  order: number;
}

interface TranslationResult {
  locale: string;
  langName: string;
  translated: string;
  provider: string;
  durationMs: number;
  cost: number;
}

interface TranslationRow {
  original: string;
  results: TranslationResult[];
  translatedAt: string;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

const PAGE_SIZE = 10;

function ToastNotification({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
        toast.type === "success"
          ? "bg-green-600 text-white"
          : "bg-red-600 text-white"
      }`}
    >
      {toast.message}
    </div>
  );
}

function TranslationCard({
  row,
  selectedLocale,
  onToast,
}: {
  row: TranslationRow;
  selectedLocale: string | null;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [copiedLocale, setCopiedLocale] = useState<string | null>(null);

  const visibleResults = selectedLocale
    ? row.results.filter((r) => r.locale === selectedLocale)
    : row.results;

  const handleCopy = (text: string, locale: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLocale(locale);
    onToast("복사되었습니다.", "success");
    setTimeout(() => setCopiedLocale(null), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="mb-3">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
          원문 (KO)
        </span>
        <p className="mt-1 text-sm text-gray-900 font-medium">{row.original}</p>
      </div>
      <div className="space-y-2">
        {visibleResults.map((result) => (
          <div
            key={result.locale}
            className="flex items-start gap-3 bg-gray-50 rounded-lg p-3"
          >
            <div className="flex-shrink-0">
              <span className="inline-block px-2 py-0.5 text-xs font-mono bg-white border border-gray-200 rounded text-gray-500">
                {result.locale}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-700">{result.translated}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400">{result.langName}</span>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400">{result.provider}</span>
                <span className="text-gray-200">·</span>
                <span className="text-xs text-gray-400">
                  {result.durationMs}ms
                </span>
                {result.cost > 0 && (
                  <>
                    <span className="text-gray-200">·</span>
                    <span className="text-xs text-gray-400">
                      ${result.cost.toFixed(6)}
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => handleCopy(result.translated, result.locale)}
              className="flex-shrink-0 p-1.5 rounded border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              title="복사"
            >
              {copiedLocale === result.locale ? (
                <Check size={12} className="text-green-500" />
              ) : (
                <Copy size={12} className="text-gray-400" />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TranslationsPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [inputText, setInputText] = useState("");
  const [batchText, setBatchText] = useState("");
  const [translating, setTranslating] = useState(false);
  const [results, setResults] = useState<TranslationRow[]>([]);
  const [selectedLocale, setSelectedLocale] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
    },
    [],
  );

  useEffect(() => {
    const loadMeta = async () => {
      setLoadingMeta(true);
      try {
        const [sitesRes, langsRes] = await Promise.all([
          fetch("/api/sites"),
          fetch("/api/languages"),
        ]);
        const sitesData = (await sitesRes.json()) as {
          sites?: Site[];
          error?: string;
        };
        const langsData = (await langsRes.json()) as {
          languages?: Language[];
          error?: string;
        };
        setSites(sitesData.sites ?? []);
        setLanguages(langsData.languages ?? []);
      } catch {
        showToast("데이터 로드에 실패했습니다.", "error");
      } finally {
        setLoadingMeta(false);
      }
    };
    loadMeta();
  }, [showToast]);

  const targetLanguages = languages.filter((l) => !l.isSource && l.active);

  const handleTranslate = async () => {
    const lines = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const textsToTranslate = lines.length > 0 ? lines : [inputText.trim()];

    if (!textsToTranslate[0]) {
      showToast("번역할 텍스트를 입력하세요.", "error");
      return;
    }
    if (targetLanguages.length === 0) {
      showToast(
        "활성화된 대상 언어가 없습니다. 언어 관리에서 추가하세요.",
        "error",
      );
      return;
    }

    setTranslating(true);
    const newRows: TranslationRow[] = [];

    try {
      for (const text of textsToTranslate) {
        const translationResults: TranslationResult[] = [];

        for (const lang of targetLanguages) {
          try {
            const res = await fetch("/api/playground", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text, from: "ko", to: lang.code }),
            });
            const data = (await res.json()) as {
              translated?: string;
              provider?: string;
              durationMs?: number;
              cost?: number;
              error?: string;
            };

            translationResults.push({
              locale: lang.code,
              langName: lang.name,
              translated: data.translated ?? data.error ?? "번역 실패",
              provider: data.provider ?? "unknown",
              durationMs: data.durationMs ?? 0,
              cost: data.cost ?? 0,
            });
          } catch {
            translationResults.push({
              locale: lang.code,
              langName: lang.name,
              translated: "번역 실패",
              provider: "error",
              durationMs: 0,
              cost: 0,
            });
          }
        }

        newRows.push({
          original: text,
          results: translationResults,
          translatedAt: new Date().toISOString(),
        });
      }

      setResults((prev) => [...newRows, ...prev]);
      setCurrentPage(1);
      showToast(`${newRows.length}개 텍스트 번역 완료`, "success");
    } finally {
      setTranslating(false);
    }
  };

  const handleDownloadJSON = () => {
    if (results.length === 0) return;

    // Build structured i18n-style JSON per locale
    const output: Record<string, Record<string, string>> = {};
    for (const lang of targetLanguages) {
      output[lang.code] = {};
    }

    results.forEach((row) => {
      row.results.forEach((r) => {
        if (!output[r.locale]) output[r.locale] = {};
        output[r.locale][row.original] = r.translated;
      });
    });

    const blob = new Blob([JSON.stringify(output, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translations_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("JSON 파일이 다운로드되었습니다.", "success");
  };

  const filteredResults = results.filter(
    (row) =>
      !searchQuery ||
      row.original.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.results.some((r) =>
        r.translated.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
  );

  const totalPages = Math.ceil(filteredResults.length / PAGE_SIZE);
  const pagedResults = filteredResults.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {toast && (
        <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">번역 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              한국어 텍스트를 모든 활성 언어로 번역하고 구조화된 데이터를
              내보냅니다
            </p>
          </div>
          {results.length > 0 && (
            <button
              onClick={handleDownloadJSON}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download size={15} />
              JSON 내보내기
            </button>
          )}
        </div>

        {/* Input panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Languages size={16} className="text-blue-500" />
            <h2 className="text-sm font-semibold text-gray-800">번역 입력</h2>
            {loadingMeta && (
              <Loader2 size={13} className="animate-spin text-gray-300 ml-1" />
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Single text */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                단일 텍스트
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="번역할 한국어 텍스트를 입력하세요"
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Batch */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                일괄 처리 (줄바꿈으로 구분)
              </label>
              <textarea
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={"안녕하세요\n감사합니다\n주소를 입력해 주세요"}
                rows={4}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono"
              />
            </div>
          </div>

          {/* Target languages display */}
          {!loadingMeta && targetLanguages.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">번역 대상:</span>
              {targetLanguages.map((lang) => (
                <span
                  key={lang.code}
                  className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded-full"
                >
                  {lang.name} ({lang.code})
                </span>
              ))}
            </div>
          )}
          {!loadingMeta && targetLanguages.length === 0 && (
            <p className="mt-3 text-xs text-amber-600">
              활성화된 대상 언어가 없습니다.{" "}
              <a href="/languages" className="underline">
                언어 관리
              </a>
              에서 추가하세요.
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleTranslate}
              disabled={translating || loadingMeta}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {translating ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Languages size={15} />
              )}
              {translating ? "번역 중..." : "번역 시작"}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div>
            {/* Filters */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="원문 또는 번역 검색..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Language tabs */}
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setSelectedLocale(null)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    selectedLocale === null
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  전체
                </button>
                {targetLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() =>
                      setSelectedLocale(
                        selectedLocale === lang.code ? null : lang.code,
                      )
                    }
                    className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                      selectedLocale === lang.code
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>

              <span className="text-xs text-gray-400 ml-auto">
                {filteredResults.length}건
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-4">
              {pagedResults.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <FileText size={24} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">검색 결과가 없습니다</p>
                </div>
              ) : (
                pagedResults.map((row, i) => (
                  <TranslationCard
                    key={`${row.original}-${i}`}
                    row={row}
                    selectedLocale={selectedLocale}
                    onToast={showToast}
                  />
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs text-gray-500">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {results.length === 0 && !translating && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <FileText size={24} className="text-gray-200" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              번역 결과가 여기에 표시됩니다
            </p>
            <p className="text-xs text-gray-400 mt-1">
              위 입력창에 한국어 텍스트를 입력하고 번역 시작을 누르세요
            </p>
            {sites.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">
                  연결된 사이트 {sites.length}개 — 번역 결과를 JSON으로 내보내
                  사이트에 적용하세요
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
