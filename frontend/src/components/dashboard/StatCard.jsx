function StatCard({
  title,
  value,
  icon,
  description,
  trend,
  trendPositive = true,
}) {
  return (
    <div className="theme-card rounded-xl p-5 hover:shadow-sm transition">

      {/* Top section */}
      <div className="flex items-center justify-between">

        <div>
          <p className="text-sm font-medium theme-text-secondary">
            {title}
          </p>

          <h2 className="mt-2 text-2xl font-bold theme-text-primary">
            {value}
          </h2>
        </div>

        {/* Icon */}
        <div className="w-11 h-11 rounded-lg bg-[var(--primary)]/10 theme-primary flex items-center justify-center">
          {icon}
        </div>

      </div>

      {/* Bottom section */}
      <div className="mt-4 flex items-center gap-2">

        {trend && (
          <span
            className={`text-xs font-semibold ${
              trendPositive
                ? 'text-[var(--success)]'
                : 'text-[var(--danger)]'
            }`}
          >
            {trend}
          </span>
        )}

        {description && (
          <span className="text-xs theme-text-secondary">
            {description}
          </span>
        )}

      </div>

    </div>
  )
}

export default StatCard