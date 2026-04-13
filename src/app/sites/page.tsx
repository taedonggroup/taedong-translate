"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Globe,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  Pencil,
  X,
  Wand2,
  Code2,
  Zap,
  Search,
} from "lucide-react";

interface SiteLanguageEntry {
  id: string;
  language: {
    id: string;
    code: string;
    name: string;
    isSource: boolean;
    order: number;
  };
}

interface Site {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  active: boolean;
  _count: { logs: number };
  languages: SiteLanguageEntry[];
}

interface Toast {
  message: string;
  type: "success" | "error";
}

function Toast({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
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

function AddSiteModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (site: Site) => void;
}) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdSite, setCreatedSite] = useState<Site | null>(null);
  const [copied, setCopied] = useState(false);
  const [snippet, setSnippet] = useState<string | null>(null);
  const [snippetCopied, setSnippetCopied] = useState(false);
  const [showAutoSetup, setShowAutoSetup] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, domain }),
      });
      const data = (await res.json()) as { site?: Site; error?: string };
      if (!res.ok) {
        setError(data.error ?? "생성에 실패했습니다.");
        return;
      }
      setCreatedSite(data.site!);
      onCreated(data.site!);
      // Fetch script snippet for immediate display
      try {
        const snippetRes = await fetch(`/api/sites/${data.site!.id}/snippet`);
        const snippetData = (await snippetRes.json()) as { snippet?: string };
        if (snippetData.snippet) setSnippet(snippetData.snippet);
      } catch {
        // Non-critical — snippet shown on demand via SiteCard
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdSite) return;
    navigator.clipboard.writeText(createdSite.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSnippetCopy = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    setSnippetCopied(true);
    setTimeout(() => setSnippetCopied(false), 2000);
  };

  return (
    <>
      {showAutoSetup && createdSite && (
        <AutoSetupModal
          siteId={createdSite.id}
          siteName={createdSite.name}
          onClose={() => {
            setShowAutoSetup(false);
            onClose();
          }}
          onComplete={() => {
            setShowAutoSetup(false);
            onClose();
          }}
        />
      )}
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-gray-900">사이트 추가</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          {createdSite ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-medium text-green-800 mb-1">
                  사이트가 생성되었습니다!
                </p>
                <p className="text-xs text-green-700">
                  아래 API 키를 지금 복사해 두세요. 다시 표시되지 않을 수
                  있습니다.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  API 키
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 rounded-lg px-3 py-2 font-mono break-all text-gray-800">
                    {createdSite.apiKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-500" />
                    ) : (
                      <Copy size={16} className="text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              {snippet && (
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    스크립트 태그
                  </label>
                  <p className="text-xs text-gray-400 mb-2">
                    이 코드를 웹사이트의{" "}
                    <code className="bg-gray-100 px-1 rounded">
                      &lt;head&gt;
                    </code>{" "}
                    태그 안에 붙여넣으세요.
                  </p>
                  <div className="relative">
                    <pre className="bg-gray-900 text-green-400 text-xs rounded-lg px-3 py-2.5 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed pr-10">
                      {snippet}
                    </pre>
                    <button
                      onClick={handleSnippetCopy}
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
                      title="복사"
                    >
                      {snippetCopied ? (
                        <Check size={12} className="text-green-400" />
                      ) : (
                        <Copy size={12} className="text-gray-300" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAutoSetup(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Zap size={14} />
                  원클릭 셋업 시작
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  나중에
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사이트 이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="서린실업"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  도메인
                </label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="seolin-website.vercel.app"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
                >
                  {submitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : null}
                  생성
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}

function EditSiteModal({
  site,
  onClose,
  onUpdated,
}: {
  site: Site;
  onClose: () => void;
  onUpdated: (site: Site) => void;
}) {
  const [name, setName] = useState(site.name);
  const [domain, setDomain] = useState(site.domain);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: site.id, name, domain }),
      });
      const data = (await res.json()) as { site?: Site; error?: string };
      if (!res.ok) {
        setError(data.error ?? "수정에 실패했습니다.");
        return;
      }
      onUpdated(data.site!);
      onClose();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">사이트 편집</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사이트 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              도메인
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : null}
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SnippetModal({
  siteId,
  siteName,
  onClose,
}: {
  siteId: string;
  siteName: string;
  onClose: () => void;
}) {
  const [snippet, setSnippet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`/api/sites/${siteId}/snippet`)
      .then((r) => r.json())
      .then((data: { snippet?: string }) => {
        if (data.snippet) setSnippet(data.snippet);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [siteId]);

  const handleCopy = () => {
    if (!snippet) return;
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
              <Code2 size={16} className="text-orange-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              스크립트 태그
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          <span className="font-medium text-gray-900">{siteName}</span> 사이트에
          SDK를 연결하려면 아래 코드를 웹사이트의{" "}
          <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
            &lt;head&gt;
          </code>{" "}
          태그 안에 붙여넣으세요.
        </p>

        {loading ? (
          <div className="flex items-center justify-center h-16">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : snippet ? (
          <div className="space-y-3">
            <div className="relative">
              <pre className="bg-gray-900 text-green-400 text-xs rounded-lg px-4 py-3 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                {snippet}
              </pre>
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 transition-colors"
                title="복사"
              >
                {copied ? (
                  <Check size={13} className="text-green-400" />
                ) : (
                  <Copy size={13} className="text-gray-300" />
                )}
              </button>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 text-xs text-orange-700 space-y-1">
              <p className="font-medium">설치 안내</p>
              <p>
                이 코드를 웹사이트의{" "}
                <code className="bg-orange-100 px-1 rounded">&lt;head&gt;</code>{" "}
                태그 안에 붙여넣으세요.
              </p>
              <p>스크립트가 로드되면 번역 위젯이 자동으로 활성화됩니다.</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-red-600">
            스크립트 태그를 불러올 수 없습니다.
          </p>
        )}

        <button
          onClick={onClose}
          className="mt-5 w-full px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

interface TranslationModalProps {
  siteId: string;
  siteDomain: string;
  locale: string;
  languageName: string;
  onClose: () => void;
  onComplete: (keyCount: number) => void;
}

function TranslationModal({
  siteId,
  siteDomain,
  locale,
  languageName,
  onClose,
  onComplete,
}: TranslationModalProps) {
  const [step, setStep] = useState<"confirm" | "generating" | "done" | "error">(
    "confirm",
  );
  const [keyCount, setKeyCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  const handleBulkTranslate = async () => {
    setBulkTranslating(true);
    setBulkResult(null);
    try {
      const res = await fetch(`/api/sites/${siteId}/bulk-translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        success?: boolean;
        totalTranslations?: number;
        error?: string;
      };
      if (!res.ok || !data.success) {
        setBulkResult(`오류: ${data.error ?? "DB 번역 실패"}`);
      } else {
        setBulkResult(`완료! ${data.totalTranslations ?? 0}개 필드 번역됨`);
      }
    } catch (err) {
      setBulkResult(
        `오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`,
      );
    } finally {
      setBulkTranslating(false);
    }
  };

  const countKeys = (obj: unknown): number => {
    if (typeof obj === "string") return 1;
    if (Array.isArray(obj))
      return obj.reduce((sum, v) => sum + countKeys(v), 0);
    if (obj && typeof obj === "object")
      return Object.values(obj).reduce(
        (sum: number, v) => sum + countKeys(v),
        0,
      );
    return 0;
  };

  const runGeneration = async () => {
    setStep("generating");
    try {
      // 1. Try to fetch ko.json from the site
      let sourceMessages: unknown = null;
      try {
        const fetchRes = await fetch(`https://${siteDomain}/messages/ko.json`, {
          signal: AbortSignal.timeout(8000),
        });
        if (fetchRes.ok) {
          sourceMessages = await fetchRes.json();
        }
      } catch {
        // Site ko.json not reachable — fall through to null
      }

      if (!sourceMessages) {
        setErrorMessage(
          `${siteDomain}/messages/ko.json 에서 소스 메시지를 가져올 수 없습니다. 사이트가 해당 경로로 ko.json을 제공하는지 확인하세요.`,
        );
        setStep("error");
        return;
      }

      // 2. Call generate endpoint
      const genRes = await fetch(`/api/sites/${siteId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, sourceMessages }),
      });
      const genData = (await genRes.json()) as {
        messages?: unknown;
        error?: string;
      };
      if (!genRes.ok) {
        setErrorMessage(genData.error ?? "번역 생성에 실패했습니다.");
        setStep("error");
        return;
      }

      // 3. Save generated messages
      const saveRes = await fetch(`/api/sites/${siteId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, messages: genData.messages }),
      });
      if (!saveRes.ok) {
        setErrorMessage("번역 저장에 실패했습니다.");
        setStep("error");
        return;
      }

      const totalKeys = countKeys(genData.messages);
      setKeyCount(totalKeys);
      setStep("done");
      onComplete(totalKeys);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
      );
      setStep("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
              <Wand2 size={16} className="text-violet-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              번역 자동 생성
            </h2>
          </div>
          {step !== "generating" && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {step === "confirm" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{languageName}</span>{" "}
              ({locale}) 번역을 자동으로 생성하시겠습니까?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
              <p>
                1.{" "}
                <code className="text-gray-700">
                  {siteDomain}/messages/ko.json
                </code>{" "}
                에서 소스 메시지를 가져옵니다.
              </p>
              <p>2. 설정된 번역 프로바이더로 모든 키를 번역합니다.</p>
              <p>3. 결과를 플랫폼에 저장합니다 (Config API로 제공됩니다).</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                나중에
              </button>
              <button
                onClick={runGeneration}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 transition-colors"
              >
                <Wand2 size={14} />
                생성
              </button>
            </div>
          </div>
        )}

        {step === "generating" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <Loader2 size={32} className="animate-spin text-violet-500" />
            <div className="text-center">
              <p className="text-sm font-medium text-gray-800">
                번역 생성 중...
              </p>
              <p className="text-xs text-gray-400 mt-1">
                소스 메시지를 번역하고 있습니다. 잠시 기다려 주세요.
              </p>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-sm font-medium text-green-800">
                번역 생성 완료!
              </p>
              <p className="text-xs text-green-700 mt-1">
                {keyCount}개 키가 {languageName}({locale})으로 번역되어
                저장되었습니다.
              </p>
            </div>
            {/* Secondary action: bulk translate DB content */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <p className="text-xs text-blue-700">
                이 사이트의 DB 콘텐츠(미번역 항목)도 함께 번역하시겠습니까?
              </p>
              {bulkResult ? (
                <p
                  className={`text-xs font-medium ${bulkResult.startsWith("오류") ? "text-red-600" : "text-blue-800"}`}
                >
                  {bulkResult}
                </p>
              ) : (
                <button
                  onClick={handleBulkTranslate}
                  disabled={bulkTranslating}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                >
                  {bulkTranslating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : null}
                  {bulkTranslating ? "번역 중..." : "DB 콘텐츠 번역"}
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              확인
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">번역 생성 실패</p>
              <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => setStep("confirm")}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AutoSetup Modal ────────────────────────────────────────────────────────

type AutoSetupStep =
  | "crawling"
  | "translating_en"
  | "translating_ja"
  | "done"
  | "error";

interface AutoSetupResult {
  pagesScanned: number;
  keysFound: number;
  languagesGenerated: string[];
}

function AutoSetupModal({
  siteId,
  siteName,
  onClose,
  onComplete,
}: {
  siteId: string;
  siteName: string;
  onClose: () => void;
  onComplete: (result: AutoSetupResult) => void;
}) {
  const [step, setStep] = useState<AutoSetupStep>("crawling");
  const [result, setResult] = useState<AutoSetupResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [partialErrors, setPartialErrors] = useState<string[]>([]);

  useEffect(() => {
    runPipeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runPipeline = async () => {
    // Step 1: Crawl
    setStep("crawling");
    let crawlData: {
      pagesScanned?: number;
      keysFound?: number;
      error?: string;
    } = {};
    try {
      const crawlRes = await fetch(`/api/sites/${siteId}/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      crawlData = (await crawlRes.json()) as typeof crawlData;
      if (!crawlRes.ok) {
        setErrorMessage(crawlData.error ?? "크롤링에 실패했습니다.");
        setStep("error");
        return;
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "크롤링 중 네트워크 오류가 발생했습니다.",
      );
      setStep("error");
      return;
    }

    const pagesScanned = crawlData.pagesScanned ?? 0;
    const keysFound = crawlData.keysFound ?? 0;

    // Step 2: Auto-setup (generates all translations)
    setStep("translating_en");
    const languagesGenerated: string[] = [];
    const errors: string[] = [];

    try {
      // Show EN progress first
      const setupRes = await fetch(`/api/sites/${siteId}/auto-setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const setupData = (await setupRes.json()) as {
        success?: boolean;
        languages?: Array<{
          code: string;
          name: string;
          keyCount?: number;
          error?: string;
        }>;
        error?: string;
      };

      if (!setupRes.ok) {
        setErrorMessage(setupData.error ?? "번역 생성에 실패했습니다.");
        setStep("error");
        return;
      }

      // Animate through language steps
      if (setupData.languages) {
        for (const lang of setupData.languages) {
          if (lang.code === "en") setStep("translating_en");
          else if (lang.code === "ja") setStep("translating_ja");

          if (lang.error) {
            errors.push(`${lang.name}: ${lang.error}`);
          } else {
            languagesGenerated.push(lang.name);
          }

          // Brief pause to show step transition visually
          await new Promise((r) => setTimeout(r, 600));
        }
      }
    } catch (err) {
      errors.push(
        err instanceof Error
          ? err.message
          : "번역 생성 중 오류가 발생했습니다.",
      );
    }

    if (errors.length > 0) {
      setPartialErrors(errors);
    }

    const finalResult: AutoSetupResult = {
      pagesScanned,
      keysFound,
      languagesGenerated,
    };
    setResult(finalResult);
    setStep("done");
    onComplete(finalResult);
  };

  const stepLabels: Record<AutoSetupStep, string> = {
    crawling: "크롤링 중...",
    translating_en: "번역 생성 중 (EN)...",
    translating_ja: "번역 생성 중 (JA)...",
    done: "완료!",
    error: "오류 발생",
  };

  const stepOrder: AutoSetupStep[] = [
    "crawling",
    "translating_en",
    "translating_ja",
    "done",
  ];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">원클릭 셋업</h2>
          </div>
          {(step === "done" || step === "error") && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-800">{siteName}</span>
        </p>

        {/* Progress steps */}
        {step !== "error" && (
          <div className="space-y-2 mb-6">
            {stepOrder.slice(0, -1).map((s, i) => {
              const isDone = currentStepIndex > i;
              const isActive = currentStepIndex === i;
              return (
                <div
                  key={s}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-green-50 text-green-700 font-medium"
                      : isDone
                        ? "text-gray-400"
                        : "text-gray-300"
                  }`}
                >
                  {isActive ? (
                    <Loader2
                      size={14}
                      className="animate-spin text-green-600"
                    />
                  ) : isDone ? (
                    <Check size={14} className="text-green-500" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-200 inline-block" />
                  )}
                  {stepLabels[s]}
                </div>
              );
            })}
          </div>
        )}

        {/* Done state */}
        {step === "done" && result && (
          <div className="space-y-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-800 mb-2">
                셋업 완료!
              </p>
              <div className="space-y-1 text-xs text-green-700">
                <p>
                  페이지 스캔:{" "}
                  <span className="font-medium">{result.pagesScanned}개</span>
                </p>
                <p>
                  추출된 키:{" "}
                  <span className="font-medium">{result.keysFound}개</span>
                </p>
                <p>
                  생성된 언어:{" "}
                  <span className="font-medium">
                    {result.languagesGenerated.length > 0
                      ? result.languagesGenerated.join(", ")
                      : "없음"}
                  </span>
                </p>
              </div>
            </div>
            {partialErrors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs font-medium text-yellow-800 mb-1">
                  일부 언어 오류
                </p>
                {partialErrors.map((e, i) => (
                  <p key={i} className="text-xs text-yellow-700">
                    {e}
                  </p>
                ))}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              확인
            </button>
          </div>
        )}

        {/* Error state */}
        {step === "error" && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">셋업 실패</p>
              <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CrawlOnly Modal ─────────────────────────────────────────────────────────

function CrawlOnlyModal({
  siteId,
  siteName,
  onClose,
  onComplete,
}: {
  siteId: string;
  siteName: string;
  onClose: () => void;
  onComplete: (keysFound: number) => void;
}) {
  const [crawling, setCrawling] = useState(true);
  const [keysFound, setKeysFound] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    runCrawl();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runCrawl = async () => {
    setCrawling(true);
    try {
      const res = await fetch(`/api/sites/${siteId}/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = (await res.json()) as {
        keysFound?: number;
        pagesScanned?: number;
        error?: string;
      };
      if (!res.ok) {
        setErrorMessage(data.error ?? "크롤링에 실패했습니다.");
      } else {
        const found = data.keysFound ?? 0;
        setKeysFound(found);
        onComplete(found);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.",
      );
    } finally {
      setCrawling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Search size={16} className="text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">크롤링</h2>
          </div>
          {!crawling && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-800">{siteName}</span>
        </p>

        {crawling && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 size={28} className="animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">
              한국어 텍스트를 추출하는 중...
            </p>
          </div>
        )}

        {!crawling && keysFound !== null && (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <p className="text-sm font-semibold text-blue-800">크롤링 완료</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {keysFound}
              </p>
              <p className="text-xs text-blue-600">개의 텍스트 추출됨</p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              확인
            </button>
          </div>
        )}

        {!crawling && errorMessage && (
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">크롤링 실패</p>
              <p className="text-xs text-red-700 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Language Chips ───────────────────────────────────────────────────────────

interface LanguageChip {
  id: string;
  code: string;
  name: string;
  isSource: boolean;
  enabled: boolean;
}

function LanguageChips({
  siteId,
  siteDomain,
  chips,
  onToggle,
  onRequestTranslation,
}: {
  siteId: string;
  siteDomain: string;
  chips: LanguageChip[];
  onToggle: (languageId: string, enabled: boolean) => void;
  onRequestTranslation: (chip: LanguageChip) => void;
}) {
  const [pending, setPending] = useState<string | null>(null);

  const handleClick = async (chip: LanguageChip) => {
    if (chip.isSource || pending) return;
    const newEnabled = !chip.enabled;
    setPending(chip.id);
    try {
      const res = await fetch(`/api/sites/${siteId}/languages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ languageId: chip.id, enabled: newEnabled }),
      });
      const data = (await res.json()) as {
        needsTranslation?: boolean;
        languageCode?: string;
      };
      if (res.ok) {
        onToggle(chip.id, newEnabled);
        if (newEnabled && data.needsTranslation) {
          onRequestTranslation(chip);
        }
      }
    } finally {
      setPending(null);
    }
  };

  void siteDomain; // passed through to parent via onRequestTranslation

  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => {
        const isLoading = pending === chip.id;
        let className =
          "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border transition-all select-none ";
        if (chip.isSource) {
          className +=
            "bg-orange-100 text-orange-700 border-orange-200 cursor-default";
        } else if (chip.enabled) {
          className +=
            "bg-blue-100 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-200";
        } else {
          className +=
            "bg-gray-100 text-gray-400 border-gray-200 cursor-pointer hover:bg-gray-200";
        }

        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => handleClick(chip)}
            disabled={chip.isSource || isLoading}
            title={
              chip.isSource
                ? "소스 언어는 항상 활성화됩니다"
                : chip.enabled
                  ? "클릭하여 비활성화"
                  : "클릭하여 활성화"
            }
            className={className}
          >
            {isLoading ? (
              <Loader2 size={10} className="animate-spin" />
            ) : (
              <span
                className={`w-1.5 h-1.5 rounded-full inline-block ${
                  chip.isSource
                    ? "bg-orange-500"
                    : chip.enabled
                      ? "bg-blue-500"
                      : "bg-gray-300"
                }`}
              />
            )}
            <span className="uppercase">{chip.code}</span>
            <span className="hidden sm:inline">{chip.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function SiteCard({
  site,
  onUpdated,
  onToast,
}: {
  site: Site;
  onUpdated: (site: Site) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [allLanguages, setAllLanguages] = useState<LanguageChip[]>([]);
  const [loadingLangs, setLoadingLangs] = useState(false);
  const [bulkTranslating, setBulkTranslating] = useState(false);
  const [bulkTranslateResult, setBulkTranslateResult] = useState<string | null>(
    null,
  );
  const [translationTarget, setTranslationTarget] =
    useState<LanguageChip | null>(null);
  const [showSnippet, setShowSnippet] = useState(false);
  const [showAutoSetup, setShowAutoSetup] = useState(false);
  const [showCrawlOnly, setShowCrawlOnly] = useState(false);

  // Build chip list from site.languages (enabled IDs) + fetch all languages once
  useEffect(() => {
    setLoadingLangs(true);
    fetch(`/api/sites/${site.id}/languages`)
      .then((r) => r.json())
      .then(
        (data: {
          languages?: Array<{
            id: string;
            code: string;
            name: string;
            isSource: boolean;
            order: number;
            enabled: boolean;
          }>;
        }) => {
          if (data.languages) {
            setAllLanguages(
              data.languages.map((l) => ({
                id: l.id,
                code: l.code,
                name: l.name,
                isSource: l.isSource,
                enabled: l.isSource ? true : l.enabled,
              })),
            );
          }
        },
      )
      .catch(() => {
        // Fallback to site.languages data if fetch fails
        const enabledIds = new Set(site.languages.map((sl) => sl.language.id));
        setAllLanguages(
          site.languages.map((sl) => ({
            id: sl.language.id,
            code: sl.language.code,
            name: sl.language.name,
            isSource: sl.language.isSource,
            enabled: sl.language.isSource || enabledIds.has(sl.language.id),
          })),
        );
      })
      .finally(() => setLoadingLangs(false));
  }, [site.id, site.languages]);

  const handleLanguageToggle = (languageId: string, enabled: boolean) => {
    setAllLanguages((prev) =>
      prev.map((chip) =>
        chip.id === languageId ? { ...chip, enabled } : chip,
      ),
    );
    if (!enabled) {
      onToast("언어가 비활성화되었습니다.", "success");
    }
    // When enabled, toast is shown after translation modal closes
  };

  const handleRequestTranslation = (chip: LanguageChip) => {
    setTranslationTarget(chip);
  };

  const handleTranslationComplete = (keyCount: number) => {
    if (translationTarget) {
      onToast(
        `${translationTarget.name} 번역 완료! (${keyCount}개 키)`,
        "success",
      );
    }
    setTranslationTarget(null);
  };

  const handleTranslationModalClose = () => {
    if (translationTarget) {
      onToast(`${translationTarget.name} 언어가 활성화되었습니다.`, "success");
    }
    setTranslationTarget(null);
  };

  const handleBulkTranslate = async () => {
    if (
      !confirm(
        "이 사이트의 전체 DB 콘텐츠를 번역하시겠습니까? (미번역 항목만 처리)",
      )
    )
      return;
    setBulkTranslating(true);
    setBulkTranslateResult(null);
    try {
      const res = await fetch(`/api/sites/${site.id}/bulk-translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        success?: boolean;
        totalTranslations?: number;
        error?: string;
      };
      if (!res.ok || !data.success) {
        const msg = data.error ?? "DB 번역 실패";
        setBulkTranslateResult(`오류: ${msg}`);
        onToast(msg, "error");
      } else {
        const msg = `완료! ${data.totalTranslations ?? 0}개 필드 번역됨`;
        setBulkTranslateResult(msg);
        onToast(msg, "success");
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.";
      setBulkTranslateResult(`오류: ${msg}`);
      onToast(msg, "error");
    } finally {
      setBulkTranslating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(site.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onToast("API 키가 복사되었습니다.", "success");
  };

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/sites", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: site.id, active: !site.active }),
      });
      const data = (await res.json()) as { site?: Site; error?: string };
      if (!res.ok) {
        onToast(data.error ?? "변경에 실패했습니다.", "error");
        return;
      }
      onUpdated(data.site!);
      onToast(
        data.site!.active
          ? "사이트가 활성화되었습니다."
          : "사이트가 비활성화되었습니다.",
        "success",
      );
    } catch {
      onToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setToggling(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (
      !confirm("API 키를 재생성하면 기존 키가 무효화됩니다. 계속하시겠습니까?")
    )
      return;
    setRegenerating(true);
    try {
      const res = await fetch("/api/sites", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: site.id }),
      });
      const data = (await res.json()) as { site?: Site; error?: string };
      if (!res.ok) {
        onToast(data.error ?? "재생성에 실패했습니다.", "error");
        return;
      }
      onUpdated(data.site!);
      onToast("API 키가 재생성되었습니다.", "success");
    } catch {
      onToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <>
      {showEdit && (
        <EditSiteModal
          site={site}
          onClose={() => setShowEdit(false)}
          onUpdated={(updated) => {
            onUpdated(updated);
            onToast("사이트가 수정되었습니다.", "success");
          }}
        />
      )}
      {translationTarget && (
        <TranslationModal
          siteId={site.id}
          siteDomain={site.domain}
          locale={translationTarget.code}
          languageName={translationTarget.name}
          onClose={handleTranslationModalClose}
          onComplete={handleTranslationComplete}
        />
      )}
      {showSnippet && (
        <SnippetModal
          siteId={site.id}
          siteName={site.name}
          onClose={() => setShowSnippet(false)}
        />
      )}
      {showAutoSetup && (
        <AutoSetupModal
          siteId={site.id}
          siteName={site.name}
          onClose={() => setShowAutoSetup(false)}
          onComplete={(result) => {
            onToast(
              `셋업 완료! ${result.keysFound}개 키, ${result.languagesGenerated.length}개 언어 생성`,
              "success",
            );
          }}
        />
      )}
      {showCrawlOnly && (
        <CrawlOnlyModal
          siteId={site.id}
          siteName={site.name}
          onClose={() => setShowCrawlOnly(false)}
          onComplete={(keysFound) => {
            onToast(`크롤링 완료! ${keysFound}개 텍스트 추출됨`, "success");
          }}
        />
      )}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Globe size={20} className="text-blue-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-gray-900">
                  {site.name}
                </h2>
                <span
                  className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                    site.active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full inline-block ${site.active ? "bg-green-500" : "bg-gray-400"}`}
                  />
                  {site.active ? "활성" : "비활성"}
                </span>
              </div>
              <a
                href={`https://${site.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline mt-0.5 block truncate"
              >
                {site.domain}
              </a>
              <p className="text-xs text-gray-400 mt-0.5">
                번역 {site._count.logs.toLocaleString()}건
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 ml-4 flex-wrap justify-end">
            <button
              onClick={() => setShowAutoSetup(true)}
              disabled={!site.domain}
              title={
                !site.domain
                  ? "도메인이 설정되어야 합니다"
                  : "크롤링 + 번역 자동 생성"
              }
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Zap size={13} />
              원클릭 셋업
            </button>
            <button
              onClick={() => setShowCrawlOnly(true)}
              disabled={!site.domain}
              title={
                !site.domain
                  ? "도메인이 설정되어야 합니다"
                  : "한국어 텍스트 추출"
              }
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Search size={13} />
              크롤링
            </button>
            <button
              onClick={() => setShowSnippet(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <Code2 size={13} />
              스크립트 태그
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Pencil size={13} />
              편집
            </button>
            <button
              onClick={handleToggleActive}
              disabled={toggling}
              className={`px-3 py-1.5 text-sm border rounded-lg transition-colors disabled:opacity-50 ${
                site.active
                  ? "text-red-500 border-red-100 hover:bg-red-50"
                  : "text-blue-600 border-blue-200 hover:bg-blue-50"
              }`}
            >
              {toggling ? (
                <Loader2 size={14} className="animate-spin" />
              ) : site.active ? (
                "비활성화"
              ) : (
                "활성화"
              )}
            </button>
          </div>
        </div>

        {/* API Key row */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
          <code className="flex-1 text-xs bg-gray-50 rounded-lg px-3 py-2 font-mono text-gray-600 truncate">
            {site.apiKey}
          </code>
          <button
            onClick={handleCopy}
            title="복사"
            className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="text-gray-500" />
            )}
          </button>
          <button
            onClick={handleRegenerateKey}
            disabled={regenerating}
            title="API 키 재생성"
            className="flex-shrink-0 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {regenerating ? (
              <Loader2 size={14} className="animate-spin text-gray-400" />
            ) : (
              <RefreshCw size={14} className="text-gray-500" />
            )}
          </button>
        </div>

        {/* Language section */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">지원 언어</p>
          {loadingLangs ? (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Loader2 size={12} className="animate-spin" />
              언어 불러오는 중...
            </div>
          ) : allLanguages.length > 0 ? (
            <LanguageChips
              siteId={site.id}
              siteDomain={site.domain}
              chips={allLanguages}
              onToggle={handleLanguageToggle}
              onRequestTranslation={handleRequestTranslation}
            />
          ) : (
            <p className="text-xs text-gray-400">언어 없음</p>
          )}
        </div>

        {/* DB content bulk translate */}
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            {bulkTranslateResult && (
              <p
                className={`text-xs ${bulkTranslateResult.startsWith("오류") ? "text-red-500" : "text-green-600"}`}
              >
                {bulkTranslateResult}
              </p>
            )}
          </div>
          <button
            onClick={handleBulkTranslate}
            disabled={bulkTranslating}
            className="flex-shrink-0 flex items-center gap-1.5 text-sm px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
          >
            {bulkTranslating ? (
              <Loader2 size={13} className="animate-spin" />
            ) : null}
            {bulkTranslating ? "번역 중..." : "DB 콘텐츠 번역"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
    },
    [],
  );

  const loadSites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sites");
      const data = (await res.json()) as { sites?: Site[]; error?: string };
      if (!res.ok) {
        showToast(data.error ?? "불러오기 실패", "error");
        return;
      }
      setSites(data.sites ?? []);
    } catch {
      showToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  const handleCreated = (site: Site) => {
    setSites((prev) => [site, ...prev]);
  };

  const handleUpdated = (updated: Site) => {
    setSites((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}
      {showAdd && (
        <AddSiteModal
          onClose={() => setShowAdd(false)}
          onCreated={(site) => {
            handleCreated(site);
            showToast("사이트가 추가되었습니다.", "success");
          }}
        />
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">연결된 사이트</h1>
            <p className="text-sm text-gray-500 mt-1">
              번역 API를 사용 중인 외부 사이트를 관리합니다
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            사이트 추가
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : sites.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Globe size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              연결된 사이트가 없습니다
            </p>
            <p className="text-xs text-gray-400">
              사이트 추가 버튼을 눌러 시작하세요
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              사이트 추가
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                onUpdated={handleUpdated}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
