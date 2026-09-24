import {
  Clock,
  ArrowRight,
} from 'lucide-react'

function getExpiryLabel(daysLeft) {
  const days = Number(daysLeft)

  if (Number.isNaN(days)) {
    return 'Expiry date unavailable'
  }

  if (days < 0) {
    const expiredDays = Math.abs(days)

    if (expiredDays === 1) {
      return 'Expired yesterday'
    }

    return `Expired ${expiredDays} days ago`
  }

  if (days === 0) {
    return 'Expires today'
  }

  if (days === 1) {
    return 'Expires tomorrow'
  }

  return `${days} days left`
}

function ExpiringMedicines({ items = [], onNavigate }) {
  return (
    <div className="theme-card rounded-xl overflow-hidden h-full flex flex-col justify-between">

      <div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b theme-border">

          <div>
            <h2 className="text-lg font-semibold theme-text-primary">
              Expiring Medicines
            </h2>

            <p className="text-sm theme-text-secondary mt-1">
              Medicines requiring expiry attention
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

        {/* Medicines */}
        <div className="divide-y divide-[var(--border)]">

          {items.length === 0 ? (

            <div className="p-8 text-center text-sm theme-text-secondary">
              No medicines expiring within the next 30 days.
            </div>

          ) : (

            items.map((medicine, idx) => {

              const daysLeft = Number(medicine.daysLeft)

              const expired = daysLeft < 0
              const urgent = daysLeft <= 15

              const expiryLabel = getExpiryLabel(daysLeft)

              return (
                <div
                  key={medicine.batch + idx}
                  className="px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-input)] transition"
                >

                  {/* Medicine Info */}
                  <div className="flex items-center gap-3">

                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        expired
                          ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
                          : urgent
                            ? 'bg-[var(--danger)]/10 text-[var(--danger)]'
                            : 'bg-[var(--warning)]/10 text-[var(--warning)]'
                      }`}
                    >
                      <Clock size={19} />
                    </div>

                    <div>

                      <p className="text-sm font-medium theme-text-primary">
                        {medicine.name}
                      </p>

                      <p className="text-xs theme-text-secondary mt-0.5">
                        Batch: {medicine.batch}
                      </p>

                    </div>

                  </div>

                  {/* Expiry */}
                  <div className="text-right">

                    <p className="text-sm theme-text-primary">
                      {medicine.expiry}
                    </p>

                    <p
                      className={`text-xs font-semibold mt-0.5 ${
                        expired || urgent
                          ? 'text-[var(--danger)]'
                          : 'text-[var(--warning)]'
                      }`}
                    >
                      {expiryLabel}
                    </p>

                  </div>

                </div>
              )
            })
          )}

        </div>

      </div>

    </div>
  )
}

export default ExpiringMedicines