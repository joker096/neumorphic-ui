interface MetricCardProps { label: string; value: string | number; icon: string }

export default function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="bg-[#1a1d24] rounded-xl p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}
