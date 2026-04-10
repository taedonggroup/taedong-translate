"use client";

import { useState } from "react";
import {
  Plus,
  Eye,
  EyeOff,
  CheckCircle2,
  Circle,
  Settings,
  Zap,
  Globe,
} from "lucide-react";

interface ProviderCard {
  id: string;
  name: string;
  status: "active" | "inactive" | "unconfigured";
  isDefault?: boolean;
}

export default function ModelsPage() {
  const [maskedKeys, setMaskedKeys] = useState<Record<string, boolean>>({
    deepl: true,
    claude: true,
  });

  const toggleMask = (id: string) => {
    setMaskedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI 모델 관리</h1>
            <p className="text-sm text-gray-500 mt-1">
              번역에 사용할 AI 제공자를 설정합니다
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            모델 추가
          </button>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-4">
          {/* Card 1: DeepL Free */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Globe size={20} className="text-blue-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">
                      DeepL Free
                    </h2>
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      기본
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                    <span className="text-xs text-green-600 font-medium">
                      연결됨
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  편집
                </button>
                <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  비활성화
                </button>
              </div>
            </div>

            {/* API Key */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                API Key
              </label>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex-1">
                  {maskedKeys["deepl"] ? "****-****-xxxx" : "abcd-efgh-1234"}
                </code>
                <button
                  onClick={() => toggleMask("deepl")}
                  className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {maskedKeys["deepl"] ? (
                    <Eye size={16} />
                  ) : (
                    <EyeOff size={16} />
                  )}
                </button>
              </div>
            </div>

            {/* Usage bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  이번 달 사용량
                </label>
                <span className="text-xs text-gray-500">
                  142,000 / 500,000자 (28%)
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: "28%" }}
                ></div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-6 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">비용</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">
                  무료
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">평균 응답</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">
                  320ms
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Claude Haiku 4.5 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Zap size={20} className="text-gray-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">
                      Claude Haiku 4.5
                    </h2>
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                      비활성
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">
                    claude-haiku-4-5-20251001
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  편집
                </button>
                <button className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
                  활성화
                </button>
              </div>
            </div>

            <div className="flex gap-6 pt-2 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">이번 달 비용</p>
                <p className="text-sm font-semibold text-gray-700 mt-0.5">
                  $0.03
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400">상태</p>
                <p className="text-sm font-semibold text-gray-500 mt-0.5">
                  비활성
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Google Translate */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <Globe size={20} className="text-red-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold text-gray-900">
                      Google Translate
                    </h2>
                    <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-600 rounded-full">
                      미설정
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    API 키를 설정해주세요
                  </p>
                </div>
              </div>
              <button className="px-4 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium">
                설정하기
              </button>
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-lg px-4 py-3">
              <p className="text-xs text-orange-600">
                Google Cloud Console에서 Translation API를 활성화하고 API 키를
                발급받으세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
