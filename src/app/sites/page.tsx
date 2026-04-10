'use client';

import { useState, useEffect } from 'react';
import { Plus, Globe, Loader2 } from 'lucide-react';

interface Site {
  id: string;
  name: string;
  domain: string;
  active: boolean;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSites = async () => {
    try {
      const data = await fetch('/api/stats').then((r) => r.json()) as {
        sites: Site[];
        error?: string;
      };
      if (data.error) setError(data.error);
      setSites(data.sites ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSites();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      await loadSites();
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
            <h1 className="text-2xl font-bold text-gray-900">연결된 사이트</h1>
            <p className="text-sm text-gray-500 mt-1">
              번역 API를 사용 중인 외부 사이트를 관리합니다
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Plus size={16} />
            사이트 추가
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
        ) : sites.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center">
              <Globe size={22} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">연결된 사이트가 없습니다</p>
            <p className="text-xs text-gray-400">사이트를 추가하거나 시드 데이터를 생성해보세요</p>
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
            {sites.map((site) => (
              <div
                key={site.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Globe size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-semibold text-gray-900">
                          {site.name}
                        </h2>
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                            site.active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full inline-block ${
                              site.active ? 'bg-green-500' : 'bg-gray-400'
                            }`}
                          />
                          {site.active ? '활성' : '비활성'}
                        </span>
                      </div>
                      <a
                        href={`https://${site.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline mt-0.5 block"
                      >
                        {site.domain}
                      </a>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      설정
                    </button>
                    <button className="px-3 py-1.5 text-sm text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                      연결 해제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
