import {
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'

function LowStock({ items = [], onNavigate }) {
  return (
    <div className="theme-card rounded-xl overflow-hidden h-full flex flex-col justify-between">

      <div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b theme-border">

          <div>
            <h2 className="text-lg font-semibold theme-text-primary">
              Low Stock Medicines
            </h2>

            <p className="text-sm theme-text-secondary mt-1">
              Medicines that need restocking
            </p>
          </div>

          <button
            onClick={onNavigate}
            className="flex items-center gap-1 text-sm font-medium theme-primary hover:text-[var(--primary-hover)] transition cursor-pointer"
          >
            View All
            <ArrowRight size={16} />
          </button>

        </div>

        {/* Table */}
        <div className="overflow-x-auto">

          {items.length === 0 ? (

            <div className="p-8 text-center text-sm theme-text-secondary">
              No low stock medicines at present.
            </div>

          ) : (

            <table className="w-full text-sm">

              <thead>
                <tr className="bg-[var(--bg-input)] theme-text-secondary">

                  <th className="text-left font-medium px-6 py-3">
                    Medicine
                  </th>

                  <th className="text-left font-medium px-6 py-3">
                    Category
                  </th>

                  <th className="text-center font-medium px-6 py-3">
                    Current Stock
                  </th>

                  <th className="text-center font-medium px-6 py-3">
                    Reorder Level
                  </th>

                  <th className="text-center font-medium px-6 py-3">
                    Status
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-[var(--border)]">

                {items.map((medicine, idx) => {

                  const currentStock = Number(medicine.currentStock ?? 0)
                  const reorderLevel = Number(medicine.reorderLevel ?? 0)

                  const critical =
                    reorderLevel > 0 &&
                    currentStock <= reorderLevel * 0.25

                  return (
                    <tr
                      key={medicine.name + idx}
                      className="hover:bg-[var(--bg-input)] transition"
                    >

                      {/* Medicine */}
                      <td className="px-6 py-4">
                        <p className="font-medium theme-text-primary">
                          {medicine.name}
                        </p>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 theme-text-secondary">
                        {medicine.category || '—'}
                      </td>

                      {/* Current Stock */}
                      <td className="px-6 py-4 text-center">

                        <span
                          className={`font-semibold ${
                            critical
                              ? 'text-[var(--danger)]'
                              : 'text-[var(--warning)]'
                          }`}
                        >
                          {currentStock.toLocaleString()}
                        </span>

                      </td>

                      {/* Reorder Level */}
                      <td className="px-6 py-4 text-center theme-text-secondary">
                        {reorderLevel.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">

                        <div className="flex justify-center">

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              critical
                                ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
                                : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                            }`}
                          >

                            <AlertTriangle size={13} />

                            {critical ? 'Critical' : 'Low Stock'}

                          </span>

                        </div>

                      </td>

                    </tr>
                  )
                })}

              </tbody>

            </table>

          )}

        </div>

      </div>

    </div>
  )
}

export default LowStock