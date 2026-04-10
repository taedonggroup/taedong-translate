"use client";

import { useState } from "react";
import { Plus, Copy, Check, Settings, Unlink, Globe } from "lucide-react";

interface Site {
  id: string;
  name: string;
  domain: string;
  apiKey: string;
  statsCount: string;
  statsCost: string;
  status: "active" | "inactive";
}

const MOCK_SITES: Site[] = [
  {
    id: "vitamin",
    name: "비타민의원",
    domain: "vitamin-clinic-taedong.vercel.app",
    apiKey: "td_tr_abc123...",
    statsCount: "2,100건",
    statsCost: "$0.08",
    status: "active",
  },
  {
    id: "seolin",
    name: "서린실업",
    domain: "seolin-website.vercel.app",
    apiKey: "td_tr_def456...",
    statsCount: "240건",
    statsCost: "$0.01",
    status: "active",
  },
];

export default function SitesPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, apiKey: string) => {
    navigator.clipboard.writeText(apiKey).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

        {/* Site Cards */}
        <div className="flex flex-col gap-4">
          {MOCK_SITES.map((site) => (
            <div
              key={site.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Globe size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-semibold text-gray-900">
                        {site.name}
                      </h2>
                      <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block"></span>
                        활성
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
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <Settings size={14} />
                    설정
                  </button>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                    <Unlink size={14} />
                    연결 해제
                  </button>
                </div>
              </div>

              {/* API Key row */}
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  API Key
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex-1">
                    {site.apiKey}
                  </code>
                  <button
                    onClick={() => handleCopy(site.id, site.apiKey)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {copiedId === site.id ? (
                      <>
                        <Check size={13} className="text-green-500" />
                        <span className="text-green-500">복사됨</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        복사
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex gap-6 pt-3 border-t border-gray-100">
                <div>
                  <p className="text-xs text-gray-400">이번 달 요청</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    {site.statsCount}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">이번 달 비용</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">
                    {site.statsCost}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
