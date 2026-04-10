'use client';

import { useState, useEffect } from 'react';
import { Plus, Cpu, Globe, Zap, Loader2 } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  displayName: string;
  active: boolean;
  isDefault: boolean;
}

const PROVIDER_ICONS: Record<string, React.ElementType> = {
  deepl: Globe,
  claude: Zap,
};

const PROVIDER_ICON_COLORS: Record<string, string> = {
  deepl: 'text-blue-600',
  claude: 'text-violet-500',
};

const PROVIDER_BG_COLORS: Record<string, string> = {
  deepl: 'bg-blue-50',
  claude: 'bg-violet-50',
};

export default function ModelsPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProviders = async () => {
    try {
      const data = await fetch('/api/stats').then((r) => r.json()) as {
        providers: Provider[];
        error?: string;
      };
      if (data.error) setError(data.error);
      setProviders(data.providers ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProviders();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await loadProviders();
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
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

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-sm text-yellow-800">
              DB가 연결되지 않았습니다.{' '}
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="underline hover:no-underline disabled:opacity-50"
              >
                /api/seed를 호출해주세요.
              </button>
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 size={20} className="animate-spin text-gray-300" />
          </div>
        ) : providers.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Cpu size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">등록된 AI 모델이 없습니다</p>
            <p className="text-xs text-gray-400">모델을 추가하거나 시드 데이터를 생성해보세요</p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {seeding ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  생성 중...
                </>
              ) : (
                '시드 데이터 생성'
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {providers.map((provider) => {
              const Icon = PROVIDER_ICONS[provider.name] ?? Cpu;
              const iconColor = PROVIDER_ICON_COLORS[provider.name] ?? 'text-gray-400';
              const iconBg = PROVIDER_BG_COLORS[provider.name] ?? 'bg-gray-50';

              return (
                <div
                  key={provider.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
                        <Icon size={20} className={iconColor} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
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
                              provider.active ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              provider.active ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {provider.active ? '연결됨' : '비활성'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        편집
                      </button>
                      <button
                        className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                          provider.active
                            ? 'text-gray-600 border-gray-200 hover:bg-gray-50'
                            : 'text-blue-600 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        {provider.active ? '비활성화' : '활성화'}
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                      상태:{' '}
                      <span className={provider.active ? 'text-green-600 font-medium' : 'text-gray-500'}>
                        {provider.active ? '활성' : '비활성'}
                      </span>
                      {provider.isDefault && (
                        <span className="ml-3 text-blue-600 font-medium">기본 Provider로 설정됨</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
