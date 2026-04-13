"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Globe2,
  Loader2,
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface Language {
  id: string;
  code: string;
  name: string;
  isSource: boolean;
  active: boolean;
  order: number;
}

interface ToastState {
  message: string;
  type: "success" | "error";
}

const PRESET_LANGUAGES = [
  { code: "vi", name: "Tiếng Việt" },
  { code: "th", name: "ภาษาไทย" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "ru", name: "Русский" },
  { code: "pt", name: "Português" },
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

function AddLanguageModal({
  onClose,
  onCreated,
  existingCodes,
}: {
  onClose: () => void;
  onCreated: (lang: Language) => void;
  existingCodes: string[];
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availablePresets = PRESET_LANGUAGES.filter(
    (p) => !existingCodes.includes(p.code),
  );

  const handlePreset = (preset: { code: string; name: string }) => {
    setCode(preset.code);
    setName(preset.name);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) {
      setError("코드와 이름을 모두 입력하세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/languages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toLowerCase(),
          name: name.trim(),
        }),
      });
      const data = (await res.json()) as {
        language?: Language;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "추가에 실패했습니다.");
        return;
      }
      onCreated(data.language!);
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
          <h2 className="text-lg font-semibold text-gray-900">언어 추가</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {availablePresets.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-500 mb-2">빠른 선택</p>
            <div className="flex flex-wrap gap-2">
              {availablePresets.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => handlePreset(preset)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    code === preset.code
                      ? "bg-blue-100 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {preset.name} ({preset.code})
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              언어 코드
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="vi"
              maxLength={10}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              ISO 639-1 코드 (예: vi, th, fr)
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              언어 이름
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tiếng Việt"
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
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LanguageRow({
  language,
  isFirst,
  isLast,
  onUpdated,
  onDeleted,
  onToast,
  onMoveUp,
  onMoveDown,
}: {
  language: Language;
  isFirst: boolean;
  isLast: boolean;
  onUpdated: (lang: Language) => void;
  onDeleted: (id: string) => void;
  onToast: (msg: string, type: "success" | "error") => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);

  const handleToggleActive = async () => {
    if (language.active && !showDeactivateWarning) {
      setShowDeactivateWarning(true);
      return;
    }
    setShowDeactivateWarning(false);
    setToggling(true);
    try {
      const res = await fetch("/api/languages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: language.id, active: !language.active }),
      });
      const data = (await res.json()) as {
        language?: Language;
        error?: string;
      };
      if (!res.ok) {
        onToast(data.error ?? "변경에 실패했습니다.", "error");
        return;
      }
      onUpdated(data.language!);
      onToast(
        data.language!.active ? "활성화되었습니다." : "비활성화되었습니다.",
        "success",
      );
    } catch {
      onToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setToggling(false);
    }
  };

  const handleDelete = async () => {
    if (language.isSource) {
      onToast("원본 언어는 삭제할 수 없습니다.", "error");
      return;
    }
    if (!confirm(`"${language.name}" 언어를 삭제하시겠습니까?`)) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/languages", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: language.id }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok) {
        onToast(data.error ?? "삭제에 실패했습니다.", "error");
        return;
      }
      onDeleted(language.id);
      onToast("언어가 삭제되었습니다.", "success");
    } catch {
      onToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <Globe2 size={16} className="text-blue-500" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-900">
                {language.name}
              </span>
              <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 text-gray-500 rounded">
                {language.code}
              </span>
              {language.isSource && (
                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                  원본
                </span>
              )}
              <span
                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                  language.active
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full inline-block ${language.active ? "bg-green-500" : "bg-gray-400"}`}
                />
                {language.active ? "활성" : "비활성"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Order buttons */}
          <div className="flex flex-col">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="위로"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
              title="아래로"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          {!language.isSource && (
            <>
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className={`px-3 py-1.5 text-xs border rounded-lg transition-colors disabled:opacity-50 ${
                  language.active
                    ? "text-gray-600 border-gray-200 hover:bg-gray-50"
                    : "text-blue-600 border-blue-200 hover:bg-blue-50"
                }`}
              >
                {toggling ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : language.active ? (
                  "비활성화"
                ) : (
                  "활성화"
                )}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-red-500 border border-red-100 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
              >
                {deleting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {showDeactivateWarning && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle
            size={14}
            className="text-amber-600 flex-shrink-0 mt-0.5"
          />
          <div className="flex-1">
            <p className="text-xs text-amber-800 font-medium">
              이 언어의 기존 번역 데이터는 유지됩니다.
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              비활성화하면 새 번역 요청에서 제외됩니다. 계속하시겠습니까?
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setShowDeactivateWarning(false)}
                className="px-3 py-1 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleToggleActive}
                className="px-3 py-1 text-xs text-white bg-amber-600 rounded-lg hover:bg-amber-700"
              >
                비활성화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
    },
    [],
  );

  const loadLanguages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/languages");
      const data = (await res.json()) as {
        languages?: Language[];
        error?: string;
      };
      if (!res.ok) {
        showToast(data.error ?? "불러오기 실패", "error");
        return;
      }
      setLanguages(data.languages ?? []);
    } catch {
      showToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  const handleCreated = (lang: Language) => {
    setLanguages((prev) => [...prev, lang].sort((a, b) => a.order - b.order));
    showToast("언어가 추가되었습니다.", "success");
  };

  const handleUpdated = (updated: Language) => {
    setLanguages((prev) =>
      prev.map((l) => (l.id === updated.id ? updated : l)),
    );
  };

  const handleDeleted = (id: string) => {
    setLanguages((prev) => prev.filter((l) => l.id !== id));
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= languages.length) return;

    const updated = [...languages];
    const a = updated[index];
    const b = updated[swapIndex];

    // Swap orders
    const newOrderA = b.order;
    const newOrderB = a.order;

    try {
      await Promise.all([
        fetch("/api/languages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: a.id, order: newOrderA }),
        }),
        fetch("/api/languages", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: b.id, order: newOrderB }),
        }),
      ]);

      updated[index] = { ...a, order: newOrderA };
      updated[swapIndex] = { ...b, order: newOrderB };
      updated.sort((x, y) => x.order - y.order);
      setLanguages(updated);
    } catch {
      showToast("순서 변경에 실패했습니다.", "error");
    }
  };

  const existingCodes = languages.map((l) => l.code);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {toast && (
        <ToastNotification toast={toast} onDismiss={() => setToast(null)} />
      )}
      {showAdd && (
        <AddLanguageModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
          existingCodes={existingCodes}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">언어 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              번역 대상 언어를 설정하고 순서를 조정합니다
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            언어 추가
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : languages.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Globe2 size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              등록된 언어가 없습니다
            </p>
            <p className="text-xs text-gray-400">
              언어 추가 버튼을 눌러 시작하세요
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} />
              언어 추가
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {languages.map((lang, index) => (
              <LanguageRow
                key={lang.id}
                language={lang}
                isFirst={index === 0}
                isLast={index === languages.length - 1}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
                onToast={showToast}
                onMoveUp={() => handleMove(index, "up")}
                onMoveDown={() => handleMove(index, "down")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
