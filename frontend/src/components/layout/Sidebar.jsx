import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Truck,
  BarChart3,
  Bell,
  Settings,
} from 'lucide-react'

function Sidebar({ currentPage, setCurrentPage }) {
  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-[#0F2742] text-white flex flex-col">

      {/* Logo */}
      <div className="h-20 flex items-center px-6 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-tight">
          Pharma<span className="text-[#35C6C8]">Nexus</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">

        {/* Main Navigation */}
        <div className="space-y-2">

          {/* Dashboard */}
          <button 
           onClick={() => setCurrentPage("dashboard")}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
          currentPage === "dashboard"
          ? "bg-[#159A9C] text-white"
          : "text-gray-300 hover:bg-white/10 hover:text-white"
         }`}
      >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </button>

          {/* Inventory */}
          <button 
          onClick={() => setCurrentPage("inventory")}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
    currentPage === "inventory"
      ? "bg-[#159A9C] text-white"
      : "text-gray-300 hover:bg-white/10 hover:text-white"
  }`}>
            <Package size={20} />
            <span>Inventory</span>
          </button>

          {/* Billing */}
          <button 
          onClick={() => setCurrentPage("billing")}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
    currentPage === "billing"
      ? "bg-[#159A9C] text-white"
      : "text-gray-300 hover:bg-white/10 hover:text-white"
  }`}>
            <Receipt size={20} />
            <span>Billing</span>
          </button>

          {/* Purchases */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition">
            <ShoppingCart size={20} />
            <span>Purchases</span>
          </button>

          {/* Distributors */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition">
            <Truck size={20} />
            <span>Distributors</span>
          </button>

        </div>

        {/* Secondary Navigation */}
        <div className="mt-8 pt-6 border-t border-white/10 space-y-2">

          {/* Analytics */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition">
            <BarChart3 size={20} />
            <span>Analytics</span>
          </button>

          {/* Alerts */}
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition">
            <Bell size={20} />
            <span>Alerts</span>
          </button>

        </div>

      </nav>

      {/* Settings */}
      <div className="px-4 py-5 border-t border-white/10">

        <button
  onClick={() => setCurrentPage("settings")}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
    currentPage === "settings"
      ? "bg-[#159A9C] text-white"
      : "text-gray-300 hover:bg-white/10 hover:text-white"
  }`}
>
  <Settings size={20} />
  <span>Settings</span>
</button>

      </div>

    </aside>
  )
}

export default Sidebar