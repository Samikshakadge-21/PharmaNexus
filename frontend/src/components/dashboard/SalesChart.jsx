import { useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'

const defaultSalesData = [
  { day: 'Mon', sales: 18500 },
  { day: 'Tue', sales: 22300 },
  { day: 'Wed', sales: 19800 },
  { day: 'Thu', sales: 25100 },
  { day: 'Fri', sales: 23800 },
  { day: 'Sat', sales: 28900 },
  { day: 'Sun', sales: 24580 },
]

function SalesChart({
  todaySales = 0,
  transactionsToday = 0,
  data = defaultSalesData,
}) {
  const [period, setPeriod] = useState('Last 7 Days')

  const chartData = data?.length ? data : defaultSalesData

  return (
    <div className="theme-card rounded-xl p-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">

        <div>
          <h2 className="text-lg font-semibold theme-text-primary">
            Sales Overview
          </h2>

          <p className="text-sm theme-text-secondary mt-1">
            Pharmacy sales performance
          </p>

          {/* Today's Sales */}
          <div className="flex flex-wrap items-center gap-5 mt-4">

            <div>
              <p className="text-xs theme-text-secondary">
                Today's Sales
              </p>

              <p className="text-xl font-bold theme-text-primary mt-1">
                ₹{Number(todaySales).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="h-8 w-px bg-[var(--border)]" />

            <div>
              <p className="text-xs theme-text-secondary">
                Transactions Today
              </p>

              <p className="text-xl font-bold theme-text-primary mt-1">
                {Number(transactionsToday).toLocaleString('en-IN')}
              </p>
            </div>

          </div>
        </div>

        {/* Period Selector */}
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-sm theme-input border border-[var(--border)] rounded-lg px-3 py-2 theme-text-secondary focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
        >
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Month</option>
        </select>

      </div>

      {/* Chart */}
      <div className="w-full h-[280px] sm:h-[320px]">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: 0,
              bottom: 5,
            }}
          >

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
            />

            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: 'var(--text-secondary)',
              }}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fontSize: 12,
                fill: 'var(--text-secondary)',
              }}
              tickFormatter={(value) => `₹${value / 1000}k`}
            />

            <Tooltip
              formatter={(value) => [
                `₹${Number(value).toLocaleString('en-IN')}`,
                'Sales',
              ]}
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            />

            <Line
              type="monotone"
              dataKey="sales"
              stroke="var(--primary)"
              strokeWidth={3}
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: 'var(--bg-card)',
              }}
              activeDot={{
                r: 6,
              }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  )
}

export default SalesChart