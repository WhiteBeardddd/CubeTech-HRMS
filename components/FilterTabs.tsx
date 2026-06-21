'use client'

export default function FilterTabs({
  label,
  options,
  active,
  onChange,
}: {
  label: string
  options: string[]
  active: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold uppercase tracking-wider mr-1" style={{ color: '#7C8A82' }}>
        {label}
      </span>
      {['All', ...options].map((opt) => {
        const isActive = active === opt
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: isActive ? '#34D39920' : '#12161A',
              color: isActive ? '#34D399' : '#A8B8AF',
              border: isActive ? '1px solid #34D399' : '1px solid #1F2924',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}