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
} from "lucide-react";

interface Site {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  active: boolean;
  _count: { logs: number };
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

  return (
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
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              완료
            </button>
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

          <div className="flex gap-2 flex-shrink-0 ml-4">
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
