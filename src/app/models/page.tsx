"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Cpu,
  Globe,
  Zap,
  Loader2,
  Star,
  Trash2,
  X,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";

interface Provider {
  id: string;
  name: string;
  displayName: string;
  apiKey: string;
  model: string | null;
  costPerChar: number;
  active: boolean;
  isDefault: boolean;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  deepl: Globe,
  claude: Zap,
};

const PROVIDER_ICON_COLORS: Record<string, string> = {
  deepl: "text-blue-600",
  claude: "text-violet-500",
};

const PROVIDER_BG_COLORS: Record<string, string> = {
  deepl: "bg-blue-50",
  claude: "bg-violet-50",
};

const PROVIDER_PRESETS = [
  {
    name: "deepl",
    displayName: "DeepL",
    model: null,
    costPerChar: 0,
  },
  {
    name: "claude",
    displayName: "Claude Haiku",
    model: "claude-haiku-4-5-20251001",
    costPerChar: 0.000001,
  },
  {
    name: "google",
    displayName: "Google Translate",
    model: null,
    costPerChar: 0,
  },
];

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

function AddProviderModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (provider: Provider) => void;
}) {
  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [costPerChar, setCostPerChar] = useState("0");
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const applyPreset = (preset: (typeof PROVIDER_PRESETS)[number]) => {
    setName(preset.name);
    setDisplayName(preset.displayName);
    setModel(preset.model ?? "");
    setCostPerChar(String(preset.costPerChar));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          displayName,
          apiKey,
          model: model.trim() || null,
          costPerChar: parseFloat(costPerChar) || 0,
        }),
      });
      const data = (await res.json()) as {
        provider?: Provider;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "생성에 실패했습니다.");
        return;
      }
      onCreated(data.provider!);
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
          <h2 className="text-lg font-semibold text-gray-900">모델 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Presets */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 mb-2">프리셋</p>
          <div className="flex gap-2 flex-wrap">
            {PROVIDER_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  name === preset.name
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {preset.displayName}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 (name)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="deepl"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                표시명
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="DeepL Free"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API 키
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              모델 (선택)
            </label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="claude-haiku-4-5-20251001"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              글자당 비용 ($)
            </label>
            <input
              type="number"
              step="0.000001"
              min="0"
              value={costPerChar}
              onChange={(e) => setCostPerChar(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditApiKeyModal({
  provider,
  onClose,
  onUpdated,
}: {
  provider: Provider;
  onClose: () => void;
  onUpdated: (p: Provider) => void;
}) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: provider.id, apiKey }),
      });
      const data = (await res.json()) as {
        provider?: Provider;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }
      onUpdated(data.provider!);
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
          <h2 className="text-lg font-semibold text-gray-900">
            API 키 수정 — {provider.displayName}
          </h2>
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
              새 API 키
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="새 키를 입력하세요"
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
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

function ProviderCard({
  provider,
  onUpdated,
  onDeleted,
  onToast,
}: {
  provider: Provider;
  onUpdated: (provider: Provider) => void;
  onDeleted: (id: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
}) {
  const [settingDefault, setSettingDefault] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showKeyEdit, setShowKeyEdit] = useState(false);
  const [editingModel, setEditingModel] = useState(false);
  const [modelValue, setModelValue] = useState(provider.model ?? "");
  const [editingCost, setEditingCost] = useState(false);
  const [costValue, setCostValue] = useState(String(provider.costPerChar));
  const [showApiKey, setShowApiKey] = useState(false);

  const Icon = PROVIDER_ICONS[provider.name] ?? Cpu;
  const iconColor = PROVIDER_ICON_COLORS[provider.name] ?? "text-gray-400";
  const iconBg = PROVIDER_BG_COLORS[provider.name] ?? "bg-gray-50";

  const handleSetDefault = async () => {
    setSettingDefault(true);
    try {
      const res = await fetch("/api/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: provider.id, isDefault: true }),
      });
      const data = (await res.json()) as {
        provider?: Provider;
        error?: string;
      };
      if (!res.ok) {
        onToast(data.error ?? "설정에 실패했습니다.", "error");
        return;
      }
      onUpdated(data.provider!);
      onToast(
        `${provider.displayName}이(가) 기본 프로바이더로 설정되었습니다.`,
        "success",
      );
    } catch {
      onToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setSettingDefault(false);
    }
  };

  const handleToggleActive = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: provider.id, active: !provider.active }),
      });
      const data = (await res.json()) as {
        provider?: Provider;
        error?: string;
      };
      if (!res.ok) {
        onToast(data.error ?? "변경에 실패했습니다.", "error");
        return;
      }
      onUpdated(data.provider!);
      onToast(
        data.provider!.active ? "활성화되었습니다." : "비활성화되었습니다.",
        "success",
      );
    } catch {
      onToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${provider.displayName}"을(를) 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/providers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: provider.id }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        onToast(data.error ?? "삭제에 실패했습니다.", "error");
        return;
      }
      onDeleted(provider.id);
      onToast("프로바이더가 삭제되었습니다.", "success");
    } catch {
      onToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveModel = async () => {
    try {
      const res = await fetch("/api/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: provider.id,
          model: modelValue.trim() || null,
        }),
      });
      const data = (await res.json()) as {
        provider?: Provider;
        error?: string;
      };
      if (!res.ok) {
        onToast(data.error ?? "저장에 실패했습니다.", "error");
        return;
      }
      onUpdated(data.provider!);
      setEditingModel(false);
      onToast("모델이 저장되었습니다.", "success");
    } catch {
      onToast("네트워크 오류가 발생했습니다.", "error");
    }
  };

  const handleSaveCost = async () => {
    try {
      const res = await fetch("/api/providers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: provider.id,
          costPerChar: parseFloat(costValue) || 0,
        }),
      });
      const data = (await res.json()) as {
        provider?: Provider;
        error?: string;
      };
      if (!res.ok) {
        onToast(data.error ?? "저장에 실패했습니다.", "error");
        return;
      }
      onUpdated(data.provider!);
      setEditingCost(false);
      onToast("비용이 저장되었습니다.", "success");
    } catch {
      onToast("네트워크 오류가 발생했습니다.", "error");
    }
  };

  const maskedKey = provider.apiKey || "미설정";
  const hasKey = provider.apiKey && provider.apiKey !== "미설정";

  return (
    <>
      {showKeyEdit && (
        <EditApiKeyModal
          provider={provider}
          onClose={() => setShowKeyEdit(false)}
          onUpdated={(p) => {
            onUpdated(p);
            onToast("API 키가 저장되었습니다.", "success");
          }}
        />
      )}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}
            >
              <Icon size={20} className={iconColor} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-gray-900">
                  {provider.displayName}
                </h2>
                {provider.isDefault && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                    기본
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full inline-block ${
                    provider.active ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span
                  className={`text-xs font-medium ${
                    provider.active ? "text-green-600" : "text-gray-400"
                  }`}
                >
                  {provider.active ? "연결됨" : "비활성"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-shrink-0 ml-4">
            {!provider.isDefault && (
              <button
                onClick={handleSetDefault}
                disabled={settingDefault}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
              >
                {settingDefault ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Star size={13} />
                )}
                기본으로 설정
              </button>
            )}
            <button
              onClick={handleToggleActive}
              disabled={toggling}
              className={`px-3 py-1.5 text-sm border rounded-lg transition-colors disabled:opacity-50 ${
                provider.active
                  ? "text-gray-600 border-gray-200 hover:bg-gray-50"
                  : "text-blue-600 border-blue-200 hover:bg-blue-50"
              }`}
            >
              {toggling ? (
                <Loader2 size={14} className="animate-spin" />
              ) : provider.active ? (
                "비활성화"
              ) : (
                "활성화"
              )}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              {deleting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              삭제
            </button>
          </div>
        </div>

        {/* Detail fields */}
        <div className="border-t border-gray-100 pt-4 space-y-3">
          {/* API Key */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-24 flex-shrink-0">
              API 키
            </span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <code className="flex-1 text-xs font-mono bg-gray-50 px-2 py-1 rounded text-gray-600 truncate">
                {showApiKey && hasKey
                  ? provider.apiKey
                  : hasKey
                    ? maskedKey
                    : "미설정"}
              </code>
              {hasKey && (
                <button
                  onClick={() => setShowApiKey((v) => !v)}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  {showApiKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              )}
              <button
                onClick={() => setShowKeyEdit(true)}
                className="flex-shrink-0 flex items-center gap-1 text-xs text-blue-600 border border-blue-100 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                <Pencil size={11} />
                수정
              </button>
            </div>
          </div>

          {/* Model */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-24 flex-shrink-0">
              모델
            </span>
            <div className="flex items-center gap-2 flex-1">
              {editingModel ? (
                <>
                  <input
                    type="text"
                    value={modelValue}
                    onChange={(e) => setModelValue(e.target.value)}
                    placeholder="모델명 (없으면 빈칸)"
                    className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveModel}
                    className="text-xs text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditingModel(false);
                      setModelValue(provider.model ?? "");
                    }}
                    className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-600 font-mono">
                    {provider.model ?? "—"}
                  </span>
                  <button
                    onClick={() => setEditingModel(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 border border-blue-100 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    <Pencil size={11} />
                    수정
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Cost per char */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-24 flex-shrink-0">
              글자당 비용
            </span>
            <div className="flex items-center gap-2 flex-1">
              {editingCost ? (
                <>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={costValue}
                    onChange={(e) => setCostValue(e.target.value)}
                    className="w-32 text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSaveCost}
                    className="text-xs text-white bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setEditingCost(false);
                      setCostValue(String(provider.costPerChar));
                    }}
                    className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded hover:bg-gray-50"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <span className="text-xs text-gray-600 font-mono">
                    ${provider.costPerChar.toFixed(6)}
                  </span>
                  <button
                    onClick={() => setEditingCost(true)}
                    className="flex items-center gap-1 text-xs text-blue-600 border border-blue-100 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                  >
                    <Pencil size={11} />
                    수정
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 mt-3">
          <p className="text-xs text-gray-400">
            ID: <span className="font-mono text-gray-500">{provider.name}</span>
            {provider.isDefault && (
              <span className="ml-3 text-blue-600 font-medium">
                기본 Provider로 설정됨
              </span>
            )}
          </p>
        </div>
      </div>
    </>
  );
}

export default function ModelsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
    },
    [],
  );

  const loadProviders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/providers");
      const data = (await res.json()) as {
        providers?: Provider[];
        error?: string;
      };
      if (!res.ok) {
        showToast(data.error ?? "불러오기 실패", "error");
        return;
      }
      setProviders(data.providers ?? []);
    } catch {
      showToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleCreated = (provider: Provider) => {
    setProviders((prev) => [...prev, provider]);
    showToast("프로바이더가 추가되었습니다.", "success");
  };

  const handleUpdated = (updated: Provider) => {
    setProviders((prev) => {
      return prev.map((p) => {
        if (updated.isDefault && p.id !== updated.id) {
          return { ...p, isDefault: false };
        }
        return p.id === updated.id ? updated : p;
      });
    });
  };

  const handleDeleted = (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {toast && (
        <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
      )}
      {showAdd && (
        <AddProviderModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 모델 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              번역에 사용할 AI 제공자를 설정합니다
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            모델 추가
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Cpu size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              등록된 AI 모델이 없습니다
            </p>
            <p className="text-xs text-gray-400">
              모델 추가 버튼을 눌러 시작하세요
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              모델 추가
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                onToast={showToast}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
