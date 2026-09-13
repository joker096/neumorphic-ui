interface Props {
  label: string;
  value: string | number;
  icon?: string;
  trend?: {value: string; positive: boolean};
}

export default function StatCard({label, value, icon, trend}: Props) {
  return (
    <div className="rounded-xl border border-gray-800 bg-[#0a0c0f] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {trend && (
        <p
          className={`mt-1 text-xs ${
            trend.positive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {trend.value}
        </p>
      )}
    </div>
  );
}
