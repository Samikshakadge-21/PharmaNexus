import { useState, useEffect } from 'react'
import './App.css'

import Sidebar from './components/layout/Sidebar'
import Topbar from './components/layout/Topbar'
import Dashboard from './pages/Dashboard/Dashboard'
import Inventory from './pages/Inventory/Inventory'
import Settings from './pages/Settings/Settings'
import Billing from './pages/Billing/Billing'
import Invoice from './pages/Invoices/Invoice'
import Login from './pages/Login/Login'
import Register from './pages/Login/Register'
import { getAuthUser, logoutUser } from './services/api'

function App() {
  const [authMode, setAuthMode] = useState('login')
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('pharmanexus_token'))
  const [isDevMode, setIsDevMode] = useState(true)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [prefilledEmail, setPrefilledEmail] = useState('')

  const [currentPage, setCurrentPage] = useState('dashboard')
  const [theme, setTheme] = useState('light')
  const [currentInvoice, setCurrentInvoice] = useState(null)

  const [defaultProfile, setProfile] = useState({
    pharmacyName: 'Apollo Pharmacy',
    ownerName: 'Pharmacy Owner',
    phone: '+91 98765 43210',
    email: 'apollo@example.com',
    address: 'Pune, Maharashtra',
  })

  // Restore authenticated session on page load
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('pharmanexus_token')
      if (savedToken) {
        try {
          const data = await getAuthUser(savedToken)
          if (data && data.success && data.user) {
            setUser(data.user)
            setToken(savedToken)
          } else {
            localStorage.removeItem('pharmanexus_token')
            setUser(null)
            setToken(null)
          }
        } catch (err) {
          localStorage.removeItem('pharmanexus_token')
          setUser(null)
          setToken(null)
        }
      }
      setIsLoadingAuth(false)
    }

    restoreSession()
  }, [])

  const handleLoginSuccess = ({ user: loggedUser, token: authToken }) => {
    setUser(loggedUser)
    setToken(authToken)
    setIsDevMode(false)
    if (authToken) {
      localStorage.setItem('pharmanexus_token', authToken)
    }
    setCurrentPage('dashboard')
  }

  const handleSkipLogin = () => {
    setIsDevMode(true)
    setCurrentPage('dashboard')
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
    } catch (err) {
      // Ignore logout errors
    }
    localStorage.removeItem('pharmanexus_token')
    setUser(null)
    setToken(null)
    setIsDevMode(false)
    setAuthMode('login')
    setCurrentPage('dashboard')
  }

  // Show loading spinner while checking auth session on mount
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#F5F7FA] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#159A9C] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-[#172B4D]">Loading PharmaNexus...</p>
        </div>
      </div>
    )
  }

  // Protect Dashboard, Inventory, Billing if unauthenticated
  if (!user && !isDevMode) {
    return (
      <div data-theme={theme} className="min-h-screen w-full theme-page">
        {authMode === 'login' ? (
          <Login
            initialEmail={prefilledEmail}
            onLogin={handleLoginSuccess}
            onSkip={handleSkipLogin}
            onSwitchToRegister={() => setAuthMode('register')}
          />
        ) : (
          <Register
            onSwitchToLogin={() => setAuthMode('login')}
            onRegisterSuccess={(registeredEmail) => {
              setPrefilledEmail(registeredEmail)
              setAuthMode('login')
            }}
          />
        )}
      </div>
    )
  }

  const activeProfile = user
    ? {
        pharmacyName: user.pharmacyName || 'Apollo Pharmacy',
        ownerName: user.ownerName || 'Pharmacist',
        phone: user.phone || '+91 98765 43210',
        email: user.email || '',
        address: 'Pune, Maharashtra',
      }
    : defaultProfile

  return (
    <div data-theme={theme} className="h-screen w-full overflow-hidden theme-page">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
    
      <div className="ml-64 h-screen flex flex-col">
        <Topbar profile={activeProfile} onLogout={handleLogout} />

        <main className="flex-1 min-h-0 p-8 overflow-y-auto overflow-x-hidden theme-page">
          {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}

          {currentPage === 'inventory' && <Inventory />}

          {currentPage === 'billing' && (
            <Billing
              setCurrentInvoice={setCurrentInvoice}
              setCurrentPage={setCurrentPage}
            />
          )}

          {currentPage === 'invoice' && (
            <Invoice
              invoice={currentInvoice}
              onClose={() => setCurrentPage('billing')}
            />
          )}

          {currentPage === 'settings' && (
            <Settings  
              profile={activeProfile}
              setProfile={setProfile}
              theme={theme}
              setTheme={setTheme}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App