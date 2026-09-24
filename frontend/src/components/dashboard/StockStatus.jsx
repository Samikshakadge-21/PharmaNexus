import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock3,
} from 'lucide-react'

function StockStatus({ data, onNavigate }) {
  const stockStatus = data?.stockStatus

  let stockItems = []

  // Supports future backend format:
  // stockStatus: {
  //   inStock: 3085,
  //   lowStock: 1602,
  //   outOfStock: 317,
  //   expired: 23
  // }

  if (
    stockStatus &&
    !Array.isArray(stockStatus) &&
    typeof stockStatus === 'object'
  ) {
    stockItems = [
      {
        label: 'In Stock',
        count: stockStatus.inStock ?? 0,
        percentage: stockStatus.inStockPercentage ?? 0,
      },
      {
        label: 'Low Stock',
        count: stockStatus.lowStock ?? data?.lowStock ?? 0,
        percentage: stockStatus.lowStockPercentage ?? 0,
      },
      {
        label: 'Out of Stock',
        count: stockStatus.outOfStock ?? data?.outOfStock ?? 0,
        percentage: stockStatus.outOfStockPercentage ?? 0,
      },
      {
        label: 'Expired',
        count: stockStatus.expired ?? data?.expired ?? 0,
        percentage: stockStatus.expiredPercentage ?? 0,
      },
    ]
  } else if (Array.isArray(stockStatus)) {
    // Supports your existing backend format
    stockItems = [
      ...stockStatus,
      {
        label: 'Expired',
        count: data?.expired ?? 0,
        percentage: data?.expiredPercentage ?? 0,
      },
    ]
  } else {
    stockItems = [
      {
        label: 'In Stock',
        count: data?.inStock ?? 0,
        percentage: 0,
      },
      {
        label: 'Low Stock',
        count: data?.lowStock ?? 0,
        percentage: 0,
      },
      {
        label: 'Out of Stock',
        count: data?.outOfStock ?? 0,
        percentage: 0,
      },
      {
        label: 'Expired',
        count: data?.expired ?? 0,
        percentage: 0,
      },
    ]
  }

  const meta = {
    'In Stock': {
      icon: CheckCircle2,
      iconColor: 'text-[var(--success)]',
      bgColor: 'bg-[var(--success)]/10',
    },

    'Low Stock': {
      icon: AlertTriangle,
      iconColor: 'text-[var(--warning)]',
      bgColor: 'bg-[var(--warning)]/10',
    },

    'Out of Stock': {
      icon: XCircle,
      iconColor: 'text-[var(--danger)]',
      bgColor: 'bg-[var(--danger)]/10',
    },

    'Expired': {
      icon: Clock3,
      iconColor: 'text-[var(--danger)]',
      bgColor: 'bg-[var(--danger)]/10',
    },
  }

  return (
    <div className="theme-card rounded-xl p-6 h-full flex flex-col justify-between">

      {/* Header */}
      <div>

        <div className="mb-6">
          <h2 className="text-lg font-semibold theme-text-primary">
            Stock Status
          </h2>

          <p className="text-sm theme-text-secondary mt-1">
            Current inventory health
          </p>
        </div>

        {/* Stock Items */}
        <div className="space-y-5">

          {stockItems.map((item) => {
            const config = meta[item.label] || meta['In Stock']
            const Icon = config.icon

            return (
              <div
                key={item.label}
                className="flex items-center justify-between"
              >

                {/* Left */}
                <div className="flex items-center gap-3">

                  <div
                    className={`w-10 h-10 rounded-lg ${config.bgColor} flex items-center justify-center`}
                  >
                    <Icon
                      size={20}
                      className={config.iconColor}
                    />
                  </div>

                  <div>
                    <p className="text-sm font-medium theme-text-primary">
                      {item.label}
                    </p>

                    <p className="text-xs theme-text-secondary mt-0.5">
                      {(item.count ?? 0).toLocaleString()} medicines
                    </p>
                  </div>

                </div>

                {/* Percentage */}
                <span className="text-sm font-semibold theme-text-primary">
                  {item.percentage ?? 0}%
                </span>

              </div>
            )
          })}

        </div>

      </div>

      {/* View Inventory */}
      <button
        onClick={onNavigate}
        className="mt-8 w-full py-2.5 text-sm font-medium theme-primary border border-[var(--primary)]/30 rounded-lg hover:bg-[var(--primary)]/5 transition cursor-pointer"
      >
        View Inventory
      </button>

    </div>
  )
}

export default StockStatus