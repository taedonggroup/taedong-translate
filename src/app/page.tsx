'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Globe, Cpu } from 'lucide-react';

interface StatsSite {
  id: string;
  name: string;
  domain: string;
  active: boolean;
}

interface StatsProvider {
  id: string;
  name: string;
  displayName: string;
  active: boolean;
  isDefault: boolean;
}

interface StatsLog {
  provider: string;
  durationMs: number;
  inputChars: number;
  success: boolean;
  createdAt: string;
  siteName: string;
  toLang: string;
}

interface Stats {
  today: number;
  month: number;
  cost: number;
  sites: StatsSite[];
  providers: StatsProvider[];
  recentLogs: StatsLog[];
  error?: string;
}

const LANG_LABELS: Record<string, string> = {
  en: 'EN',
  ja: 'JA',
  zh: 'ZH',
};

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await fetch('/api/seed', { method: 'POST' });
      const fresh = await fetch('/api/stats').then((r) => r.json());
      setStats(fresh);
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center h-64">
        <p className="text-sm text-gray-400">로딩 중...</p>
      </div>
    );
  }

  const statCards = [
    {
      label: '오늘 번역',
      value: stats?.today.toLocaleString() ?? '0',
      sub: '건',
      icon: TrendingUp,
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-50',
    },
    {
      label: '이번 달',
      value: stats?.month.toLocaleString() ?? '0',
      sub: '건',
      icon: Calendar,
      iconColor: 'text-violet-500',
      iconBg: 'bg-violet-50',
    },
    {
      label: '추정 비용',
      value: `$${(stats?.cost ?? 0).toFixed(4)}`,
      sub: 'USD',
      icon: DollarSign,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">번역 현황 요약</p>
      </div>

      {/* DB error banner */}
      {stats?.error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
          <p className="text-sm text-yellow-800 font-medium">
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

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-5">
        {statCards.map(({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start justify-between"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
              <Icon size={18} className={iconColor} />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom two columns: sites + providers */}
      <div className="grid grid-cols-2 gap-5">
        {/* Connected sites */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">연결된 사이트</h2>
          {stats?.sites && stats.sites.length > 0 ? (
            <ul className="space-y-3">
              {stats.sites.map((site) => (
                <li key={site.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                    <Globe size={15} className="text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{site.name}</p>
                    <p className="text-xs text-gray-400 truncate">{site.domain}</p>
                  </div>
                  <span
                    className={`ml-auto shrink-0 flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${
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
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Globe size={18} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">사이트를 연결해주세요</p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="text-xs text-blue-500 hover:underline disabled:opacity-50"
              >
                {seeding ? '생성 중...' : '시드 데이터 생성'}
              </button>
            </div>
          )}
        </div>

        {/* Active providers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">활성 Provider</h2>
          {stats?.providers && stats.providers.length > 0 ? (
            <ul className="space-y-3">
              {stats.providers.map((provider) => (
                <li key={provider.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                    <Cpu size={15} className="text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-800">{provider.displayName}</p>
                      {provider.isDefault && (
                        <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                          기본
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
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
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                <Cpu size={18} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">AI 모델을 설정해주세요</p>
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="text-xs text-blue-500 hover:underline disabled:opacity-50"
              >
                {seeding ? '생성 중...' : '시드 데이터 생성'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">최근 활동</h2>
        {stats?.recentLogs && stats.recentLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left font-medium text-gray-400">시간</th>
                  <th className="pb-2 text-left font-medium text-gray-400">사이트</th>
                  <th className="pb-2 text-left font-medium text-gray-400">언어</th>
                  <th className="pb-2 text-right font-medium text-gray-400">글자</th>
                  <th className="pb-2 text-left font-medium text-gray-400 pl-4">Provider</th>
                  <th className="pb-2 text-right font-medium text-gray-400">응답</th>
                  <th className="pb-2 text-center font-medium text-gray-400">상태</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentLogs.map((log, idx) => (
                  <tr key={idx} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 text-gray-400 tabular-nums">{formatTime(log.createdAt)}</td>
                    <td className="py-2 text-gray-600">{log.siteName}</td>
                    <td className="py-2">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                        {LANG_LABELS[log.toLang] ?? log.toLang.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-500 tabular-nums">{log.inputChars}</td>
                    <td className="py-2 text-gray-600 pl-4">{log.provider}</td>
                    <td className="py-2 text-right text-gray-500 tabular-nums">{log.durationMs}ms</td>
                    <td className="py-2 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded font-medium ${
                          log.success
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {log.success ? '성공' : '실패'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <p className="text-sm text-gray-400">번역 기록이 없습니다</p>
            <p className="text-xs text-gray-300">Playground에서 번역을 실행해보세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
