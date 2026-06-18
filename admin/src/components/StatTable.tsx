interface StatTableProps { columns: Array<{ key: string; label: string; render?: (val: any) => string }>; data: any[] }

export default function StatTable({ columns, data }: StatTableProps) {
  return (
    <div className="bg-[#1a1d24] rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5">
            {columns.map(col => (
              <th key={col.key} className="text-left px-4 py-3 text-xs text-gray-500 uppercase tracking-wider font-medium">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5">
              {columns.map(col => (
                <td key={col.key} className="px-4 py-2.5">{col.render ? col.render(row[col.key]) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
