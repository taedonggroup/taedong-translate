import { TrendingUp, Calendar, DollarSign } from "lucide-react";

const statCards = [
  {
    label: "오늘 번역",
    value: "0",
    sub: "건",
    icon: TrendingUp,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
  },
  {
    label: "이번 달",
    value: "0",
    sub: "건",
    icon: Calendar,
    iconColor: "text-violet-500",
    iconBg: "bg-violet-50",
  },
  {
    label: "추정 비용",
    value: "$0.00",
    sub: "USD",
    icon: DollarSign,
    iconColor: "text-emerald-500",
    iconBg: "bg-emerald-50",
  },
];

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">번역 현황 요약</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-5">
        {statCards.map(
          ({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
            <div
              key={label}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-start justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <div
                className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}
              >
                <Icon size={18} className={iconColor} />
              </div>
            </div>
          ),
        )}
      </div>

      {/* Chart area */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          번역량 추이
        </h2>
        <div className="h-64 flex items-center justify-center rounded-lg bg-gray-50 border border-dashed border-gray-200">
          <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-400">
              번역량 추이 - 최근 30일
            </p>
            <p className="text-xs text-gray-300">
              데이터가 쌓이면 차트가 표시됩니다
            </p>
          </div>
        </div>
      </div>

      {/* Bottom two columns */}
      <div className="grid grid-cols-2 gap-5">
        {/* Connected sites */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            연결된 사이트
          </h2>
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <span className="text-lg">🌐</span>
            </div>
            <p className="text-sm text-gray-400">사이트를 연결해주세요</p>
            <p className="text-xs text-gray-300">
              Sites 메뉴에서 추가할 수 있습니다
            </p>
          </div>
        </div>

        {/* Active providers */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            활성 Provider
          </h2>
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <p className="text-sm text-gray-400">AI 모델을 설정해주세요</p>
            <p className="text-xs text-gray-300">
              AI Models 메뉴에서 추가할 수 있습니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
