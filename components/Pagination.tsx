'use client'

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  const windowSize = 1

  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || (p >= currentPage - windowSize && p <= currentPage + windowSize)) {
      pages.push(p)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  const btnBase =
    'min-w-[34px] h-[34px] px-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center'

  return (
    <div className="flex items-center justify-center gap-1.5 mt-5">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={btnBase}
        style={{
          color: currentPage === 1 ? '#3A453F' : '#A8B8AF',
          border: '1px solid #1F2924',
          backgroundColor: '#12161A',
          opacity: currentPage === 1 ? 0.5 : 1,
          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
        }}
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-1 text-xs" style={{ color: '#7C8A82' }}>
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={btnBase}
            style={{
              backgroundColor: p === currentPage ? '#34D399' : '#12161A',
              color: p === currentPage ? '#08130D' : '#A8B8AF',
              border: p === currentPage ? '1px solid #34D399' : '1px solid #1F2924',
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={btnBase}
        style={{
          color: currentPage === totalPages ? '#3A453F' : '#A8B8AF',
          border: '1px solid #1F2924',
          backgroundColor: '#12161A',
          opacity: currentPage === totalPages ? 0.5 : 1,
          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        Next
      </button>
    </div>
  )
}