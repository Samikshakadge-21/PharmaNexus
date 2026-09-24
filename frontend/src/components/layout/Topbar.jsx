import {
  Bell,
  LogOut
} from 'lucide-react'

function Topbar({ profile, onLogout }) {
  const pharmacyName = profile?.pharmacyName || 'Apollo Pharmacy';
  const ownerName = profile?.ownerName || 'Pharmacy Owner';

  return (
    <header className="h-20 theme-card border-b theme-border flex items-center justify-end px-8">

      {/* Right Section */}
      <div className="flex items-center gap-6">

        {/* Notification */}
        <button className="relative theme-text-secondary hover:theme-primary transition cursor-pointer">
          <Bell size={21} />

          {/* Notification indicator */}
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#DC2626] rounded-full border-2 border-white" />
        </button>

        {/* Divider */}
        <div className="h-8 w-px theme-border bg-[var(--border)]" />

        {/* Pharmacy Profile */}
        <div className="flex items-center gap-3">

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-[#159A9C] flex items-center justify-center text-white font-semibold">
            {pharmacyName
              .split(" ")
              .map((word) => word[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>

          {/* Name */}
          <div className="text-left">
            <p className="text-sm font-semibold theme-text-primary">
              {pharmacyName}
            </p>

            <p className="text-xs theme-text-secondary">
              {ownerName}
            </p>
          </div>

        </div>

        {/* Logout Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition cursor-pointer"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}

      </div>

    </header>
  )
}

export default Topbar