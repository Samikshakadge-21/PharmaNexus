import { useState, useEffect } from 'react'
import {
  Package,
  AlertTriangle,
  Clock,
  Layers,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'

import StatCard from '../../components/dashboard/StatCard'
import SalesChart from '../../components/dashboard/SalesChart'
import StockStatus from '../../components/dashboard/StockStatus'
import LowStock from '../../components/dashboard/LowStock'
import ExpiringMedicines from '../../components/dashboard/ExpiringMedicines'
import { getDashboardSummary } from '../../services/api'

function Dashboard({ onNavigate, lastUpdated }) {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSummary = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await getDashboardSummary()

      if (response && response.success) {
        setSummary(response.data)
      } else {
        throw new Error(
          response?.message || 'Failed to fetch dashboard summary'
        )
      }
    } catch (err) {
      console.error('Dashboard error:', err)

      setError(
        err.message || 'Unable to load dashboard data'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [lastUpdated])

  /* ============================= */
  /* Dashboard Summary Data        */
  /* ============================= */

  const totalMedicines = summary?.totalMedicines ?? 0
  const totalStockUnits = summary?.totalStockUnits ?? 0
  const lowStock = summary?.lowStock ?? 0
  const expiringSoon = summary?.expiringSoon ?? 0

  // New dashboard metrics
  const expired = summary?.expired ?? 0
  const todaySales = summary?.todaySales ?? 0
  const transactionsToday = summary?.transactionsToday ?? 0

  // Future backend sales chart data
  const salesData = summary?.sales?.data ?? []

  return (
    <div className="w-full">

      {/* ============================= */}
      {/* Page Header                   */}
      {/* ============================= */}

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold theme-text-primary">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-[#64748B]">
            Overview of your pharmacy operations and inventory.
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={fetchSummary}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto px-4 py-2 text-sm font-medium rounded-lg border theme-border theme-text-primary hover:bg-[var(--bg-input)] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />

          Refresh
        </button>

      </div>

      {/* ============================= */}
      {/* Error Banner                  */}
      {/* ============================= */}

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-600 dark:text-red-400">

          <AlertCircle
            size={20}
            className="shrink-0"
          />

          <div className="flex-1">

            <span className="font-semibold">
              Unable to load dashboard data:{' '}
            </span>

            {error}

          </div>

          <button
            onClick={fetchSummary}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>

        </div>
      )}

      {/* ============================= */}
      {/* Statistics Cards              */}
      {/* ============================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 w-full">

        {/* Total Medicines */}
        <StatCard
          title="Total Medicines"
          value={
            loading
              ? '...'
              : totalMedicines.toLocaleString()
          }
          icon={<Package size={22} />}
          trend="Live"
          description="Medicines in inventory"
        />

        {/* Total Stock Units */}
        <StatCard
          title="Total Stock Units"
          value={
            loading
              ? '...'
              : totalStockUnits.toLocaleString()
          }
          icon={<Layers size={22} />}
          trend="Total"
          description="Units currently in stock"
        />

        {/* Low Stock */}
        <StatCard
          title="Low Stock"
          value={
            loading
              ? '...'
              : lowStock.toLocaleString()
          }
          icon={<AlertTriangle size={22} />}
          trend="Attention"
          description="At or below reorder level"
          trendPositive={false}
        />

        {/* Expiring Soon */}
        <StatCard
          title="Expiring Soon"
          value={
            loading
              ? '...'
              : expiringSoon.toLocaleString()
          }
          icon={<Clock size={22} />}
          trend="30 Days"
          description="Expires within 30 days"
          trendPositive={false}
        />

      </div>

      {/* ============================= */}
      {/* Sales + Stock Status           */}
      {/* ============================= */}

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">

        {/* Sales Chart */}
        <div className="xl:col-span-2 min-w-0">

          <SalesChart
            todaySales={todaySales}
            transactionsToday={transactionsToday}
            data={salesData}
          />

        </div>

        {/* Stock Status */}
        <div className="min-w-0">

          <StockStatus
            data={{
              ...summary,
              expired,
            }}
            onNavigate={() =>
              onNavigate && onNavigate('inventory')
            }
          />

        </div>

      </div>

      {/* ============================= */}
      {/* Low Stock + Expiring Medicines */}
      {/* ============================= */}

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">

        {/* Low Stock */}
        <div className="min-w-0">

          <LowStock
            items={summary?.lowStockItems || []}
            onNavigate={() =>
              onNavigate && onNavigate('inventory')
            }
          />

        </div>

        {/* Expiring Medicines */}
        <div className="min-w-0">

          <ExpiringMedicines
            items={summary?.expiringSoonItems || []}
            onNavigate={() =>
              onNavigate && onNavigate('inventory')
            }
          />

        </div>

      </div>

    </div>
  )
}

export default Dashboard