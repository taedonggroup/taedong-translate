'use client';

import { useState } from 'react';
import { Play, Clock, Hash, DollarSign, Loader2, AlertCircle } from 'lucide-react';

type TargetLang = 'en' | 'ja' | 'zh';

interface TranslationResult {
  translated: string;
  provider: string;
  durationMs: number;
  inputChars: number;
  outputChars: number;
  cost: number;
  toLang: string;
  success: boolean;
  error?: string;
}

const LANG_LABELS: Record<TargetLang, string> = {
  en: '영어 (EN)',
  ja: '일본어 (JA)',
  zh: '중국어 (ZH)',
};

const LANG_DISPLAY: Record<TargetLang, string> = {
  en: 'EN',
  ja: 'JA',
  zh: 'ZH',
};

export default function PlaygroundPage() {
  const [inputText, setInputText] = useState('');
  const [selectedLangs, setSelectedLangs] = useState<TargetLang[]>(['en']);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TranslationResult[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const toggleLang = (lang: TargetLang) => {
    setSelectedLangs((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleTranslate = async () => {
    if (!inputText.trim() || selectedLangs.length === 0) return;
    setLoading(true);
    setResults(null);
    setApiError(null);

    try {
      const response = await fetch('/api/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText, targets: selectedLangs }),
      });

      const data = await response.json() as { results?: TranslationResult[]; error?: string };

      if (!response.ok || data.error) {
        setApiError(data.error ?? '번역 요청에 실패했습니다.');
        return;
      }

      setResults(data.results ?? []);
    } catch (error) {
      setApiError(String(error));
    } finally {
      setLoading(false);
    }
  };

  // Group results by toLang preserving selectedLangs order
  const resultsByLang = selectedLangs.reduce<Record<TargetLang, TranslationResult | undefined>>(
    (acc, lang) => {
      acc[lang] = results?.find((r) => r.toLang === lang);
      return acc;
    },
    {} as Record<TargetLang, TranslationResult | undefined>,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">번역 테스트</h1>
          <p className="text-sm text-gray-500 mt-1">
            등록된 AI 모델로 번역 결과를 즉시 확인합니다
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

          <div className="flex items-center justify-between mt-2 mb-4">
            <span className="text-xs text-gray-400">{inputText.length}자</span>
            {inputText.length > 5000 && (
              <span className="text-xs text-red-500">최대 5000자</span>
            )}
          </div>

          {/* Language toggles */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500 mr-1">번역 언어:</span>
            {(['en', 'ja', 'zh'] as TargetLang[]).map((lang) => (
              <button
                key={lang}
                onClick={() => toggleLang(lang)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
                  selectedLangs.includes(lang)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {LANG_DISPLAY[lang]}
              </button>
            ))}
          </div>

          {apiError && (
            <div className="flex items-start gap-2 mb-4 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600">{apiError}</p>
            </div>
          )}

          <button
            onClick={handleTranslate}
            disabled={loading || !inputText.trim() || selectedLangs.length === 0 || inputText.length > 5000}
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
        {(results !== null || loading) && (
          <div className="flex flex-col gap-6">
            {selectedLangs.map((lang) => {
              const result = resultsByLang[lang];
              const isLoading = loading && !result;

              return (
                <div key={lang}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {LANG_LABELS[lang]}
                  </h2>

                  {isLoading ? (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-3">
                      <Loader2 size={16} className="animate-spin text-blue-400" />
                      <span className="text-sm text-gray-400">번역 중...</span>
                    </div>
                  ) : result ? (
                    <div
                      className={`bg-white rounded-xl border shadow-sm p-5 ${
                        result.success ? 'border-gray-200' : 'border-red-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-800">
                          {result.provider}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={12} />
                          {result.durationMs}ms
                        </div>
                      </div>

                      {result.success ? (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-3 mb-3 leading-relaxed whitespace-pre-wrap">
                          {result.translated}
                        </p>
                      ) : (
                        <div className="bg-red-50 rounded-lg px-4 py-3 mb-3">
                          <p className="text-xs text-red-600">{result.error ?? '번역 실패'}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Hash size={12} />
                          {result.inputChars}자 입력
                        </span>
                        {result.outputChars > 0 && (
                          <span className="flex items-center gap-1">
                            <Hash size={12} />
                            {result.outputChars}자 출력
                          </span>
                        )}
                        {result.cost > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} />
                            ${result.cost.toFixed(6)}
                          </span>
                        )}
                        {result.cost === 0 && result.success && (
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} />
                            무료
                          </span>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
