import { useState } from 'react'
import {
  Shield,
  Palette,
  Bell,
  ChevronRight,
  Building2,
  ArrowLeft,
  Save,
} from 'lucide-react'

function Settings({ profile, setProfile, theme, setTheme }) {
  const [selectedSetting, setSelectedSetting] = useState(null)
  const [formProfile, setFormProfile] = useState(profile)

  if (!selectedSetting) {
    return (
      <div className="w-full max-w-4xl">

        <div className="mb-8">
          <h1 className="text-2xl font-semibold theme-text-primary">
            Settings
          </h1>

          <p className="text-sm theme-text-secondary mt-1">
            Manage your PharmaNexus account and preferences
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-sm font-semibold theme-text-secondary uppercase tracking-wide mb-3">
            Account
          </h2>

          <div className="theme-card rounded-xl overflow-hidden">

            <button
              onClick={() => setSelectedSetting("profile")}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-input)] transition text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Building2
                  size={20}
                  className="theme-primary"
                />
              </div>

              <div className="flex-1">
                <p className="font-medium theme-text-primary">
                  Pharmacy Profile
                </p>

                <p className="text-sm theme-text-secondary">
                  Manage pharmacy information
                </p>
              </div>

              <ChevronRight
                size={20}
                className="theme-text-secondary"
              />
            </button>

            <div className="border-t theme-border" />

            <button
              onClick={() => setSelectedSetting("security")}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-input)] transition text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Shield
                  size={20}
                  className="theme-primary"
                />
              </div>

              <div className="flex-1">
                <p className="font-medium theme-text-primary">
                  Security
                </p>

                <p className="text-sm theme-text-secondary">
                  Password and account security
                </p>
              </div>

              <ChevronRight
                size={20}
                className="theme-text-secondary"
              />
            </button>

          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold theme-text-secondary uppercase tracking-wide mb-3">
            Preferences
          </h2>

          <div className="theme-card rounded-xl overflow-hidden">

            <button
              onClick={() => setSelectedSetting("appearance")}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-input)] transition text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Palette
                  size={20}
                  className="theme-primary"
                />
              </div>

              <div className="flex-1">
                <p className="font-medium theme-text-primary">
                  Appearance
                </p>

                <p className="text-sm theme-text-secondary">
                  Theme and display preferences
                </p>
              </div>

              <ChevronRight
                size={20}
                className="theme-text-secondary"
              />
            </button>

            <div className="border-t theme-border" />

            <button
              onClick={() => setSelectedSetting("notifications")}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--bg-input)] transition text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <Bell
                  size={20}
                  className="theme-primary"
                />
              </div>

              <div className="flex-1">
                <p className="font-medium theme-text-primary">
                  Notifications
                </p>

                <p className="text-sm theme-text-secondary">
                  Manage alerts and notifications
                </p>
              </div>

              <ChevronRight
                size={20}
                className="theme-text-secondary"
              />
            </button>

          </div>
        </div>

      </div>
    )
  }

  if (selectedSetting === "profile") {
    return (
      <div className="w-full max-w-4xl">

        <button
          onClick={() => setSelectedSetting(null)}
          className="flex items-center gap-2 text-sm theme-text-secondary hover:text-[var(--primary)] mb-6 transition"
        >
          <ArrowLeft size={18} />
          Back to Settings
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold theme-text-primary">
            Pharmacy Profile
          </h1>

          <p className="text-sm theme-text-secondary mt-1">
            Manage your pharmacy information
          </p>
        </div>

        <div className="theme-card rounded-xl p-6">

          <div className="grid grid-cols-2 gap-5">

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Pharmacy Name
              </label>

              <input
                type="text"
                value={formProfile.pharmacyName}
                onChange={(e) =>
                  setFormProfile({
                    ...formProfile,
                    pharmacyName: e.target.value,
                  })
                }
                className="theme-input w-full px-4 py-3 rounded-lg outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Owner Name
              </label>

              <input
                type="text"
                value={formProfile.ownerName}
                onChange={(e) =>
                  setFormProfile({
                    ...formProfile,
                    ownerName: e.target.value,
                  })
                }
                className="theme-input w-full px-4 py-3 rounded-lg outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Phone Number
              </label>

              <input
                type="text"
                value={formProfile.phone}
                onChange={(e) =>
                  setFormProfile({
                    ...formProfile,
                    phone: e.target.value,
                  })
                }
                className="theme-input w-full px-4 py-3 rounded-lg outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Email Address
              </label>

              <input
                type="email"
                value={formProfile.email}
                onChange={(e) =>
                  setFormProfile({
                    ...formProfile,
                    email: e.target.value,
                  })
                }
                className="theme-input w-full px-4 py-3 rounded-lg outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Pharmacy Address
              </label>

              <textarea
                rows="3"
                value={formProfile.address}
                onChange={(e) =>
                  setFormProfile({
                    ...formProfile,
                    address: e.target.value,
                  })
                }
                className="theme-input w-full px-4 py-3 rounded-lg outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
              />
            </div>

          </div>

          <div className="mt-6 flex justify-end">

            <button
              onClick={() => {
                setProfile(formProfile)
                alert("Profile saved successfully")
              }}
              className="flex items-center gap-2 px-5 py-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition"
            >
              <Save size={18} />
              Save Changes
            </button>

          </div>

        </div>

      </div>
    )
  }

  if (selectedSetting === "appearance") {
    return (
      <div className="w-full max-w-4xl">

        <button
          onClick={() => setSelectedSetting(null)}
          className="flex items-center gap-2 text-sm theme-text-secondary hover:text-[var(--primary)] mb-6 transition"
        >
          <ArrowLeft size={18} />
          Back to Settings
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-semibold theme-text-primary">
            Appearance
          </h1>

          <p className="text-sm theme-text-secondary mt-1">
            Customize how PharmaNexus looks
          </p>
        </div>

        <div className="theme-card rounded-xl overflow-hidden">

          <button
            onClick={() => setTheme("light")}
            className="w-full flex items-center gap-4 px-5 py-5 hover:bg-[var(--bg-input)] transition text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Palette
                size={20}
                className="theme-primary"
              />
            </div>

            <div className="flex-1">
              <p className="font-medium theme-text-primary">
                Light
              </p>

              <p className="text-sm theme-text-secondary">
                Use the standard light appearance
              </p>
            </div>
          </button>

          <div className="border-t theme-border" />

          <button
            onClick={() => setTheme("dark")}
            className="w-full flex items-center gap-4 px-5 py-5 hover:bg-[var(--bg-input)] transition text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Palette
                size={20}
                className="theme-primary"
              />
            </div>

            <div className="flex-1">
              <p className="font-medium theme-text-primary">
                Dark
              </p>

              <p className="text-sm theme-text-secondary">
                Use a darker appearance
              </p>
            </div>
          </button>

          <div className="border-t theme-border" />

          <button
            onClick={() => setTheme("system")}
            className="w-full flex items-center gap-4 px-5 py-5 hover:bg-[var(--bg-input)] transition text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
              <Palette
                size={20}
                className="theme-primary"
              />
            </div>

            <div className="flex-1">
              <p className="font-medium theme-text-primary">
                System Default
              </p>

              <p className="text-sm theme-text-secondary">
                Follow your device appearance
              </p>
            </div>

          </button>

        </div>

      </div>
    )
  }
}

export default Settings