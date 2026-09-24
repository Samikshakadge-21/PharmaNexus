import { useState } from "react"
import { loginUser } from "../../services/api"
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Pill,
  ArrowRight,
  ShieldCheck,
  UserRound,
  Truck,
  CheckCircle,
} from "lucide-react"

function Login({ onLogin, onRegister }) {
  const [role, setRole] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const roles = [
    {
      id: "admin",
      title: "Admin",
      description: "Platform administration",
      icon: ShieldCheck,
    },
    {
      id: "pharmacist",
      title: "Pharmacist",
      description: "Manage your pharmacy",
      icon: UserRound,
    },
    {
      id: "distributor",
      title: "Distributor",
      description: "Manage your distribution",
      icon: Truck,
    },
  ]

  const selectedRole = roles.find((item) => item.id === role)

  // Validate login form
  const validateForm = () => {
    const newErrors = {}
    const cleanEmail = email.trim()

    if (!role) {
      newErrors.role = "Please select your account type."
    }

    if (!cleanEmail) {
      newErrors.email = "Email address is required."
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)
    ) {
      newErrors.email = "Please enter a valid email address."
    }

    if (!password) {
      newErrors.password = "Password is required."
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  // Handle normal login
  const handleLogin = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await loginUser({ email, password })
      // Expected response shape: { success: true, token, user }
      if (response && response.success) {
        onLogin({ user: response.user, token: response.token })
      } else {
        setErrors((prev) => ({ ...prev, form: response?.message || 'Login failed' }))
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message || 'Login failed' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle temporary development login
  const handleSkipLogin = () => {
    if (!role) {
      setErrors({
        role: "Please select your account type.",
      })
      return
    }

    // Temporary development shortcut.
    onLogin(role)
  }

  // Handle role selection
  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole)

    if (errors.role) {
      setErrors((current) => ({
        ...current,
        role: "",
      }))
    }
  }

  // Handle email change
  const handleEmailChange = (value) => {
    setEmail(value)

    if (errors.email) {
      setErrors((current) => ({
        ...current,
        email: "",
      }))
    }
  }

  // Handle password change
  const handlePasswordChange = (value) => {
    setPassword(value)

    if (errors.password) {
      setErrors((current) => ({
        ...current,
        password: "",
      }))
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--primary)] text-white shadow-sm">
            <Pill size={28} />
          </div>

          <h1 className="text-2xl font-bold theme-text-primary mt-4">
            PharmaNexus
          </h1>

          <p className="text-sm theme-text-secondary mt-1">
            Pharmacy Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="theme-card rounded-2xl p-7 shadow-sm">

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold theme-text-primary">
              Welcome back
            </h2>

            <p className="text-sm theme-text-secondary mt-1">
              Select your account type to continue
            </p>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium theme-text-primary mb-3">
              Account Type
              <span className="text-red-500 ml-1">*</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              {roles.map((item) => {
                const Icon = item.icon
                const isSelected = role === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleRoleChange(item.id)}
                    className={`relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition ${
                      isSelected
                        ? "border-[var(--primary)] bg-[var(--primary)]/10"
                        : "border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5"
                    }`}
                  >
                    {isSelected && (
                      <CheckCircle
                        size={15}
                        className="absolute top-2 right-2 theme-primary"
                      />
                    )}

                    <Icon
                      size={22}
                      className={
                        isSelected
                          ? "theme-primary"
                          : "theme-text-secondary"
                      }
                    />

                    <span
                      className={`text-xs font-semibold ${
                        isSelected
                          ? "theme-primary"
                          : "theme-text-primary"
                      }`}
                    >
                      {item.title}
                    </span>
                  </button>
                )
              })}
            </div>

            {errors.role && (
              <p className="text-xs text-red-500 mt-1.5">
                {errors.role}
              </p>
            )}
          </div>

          {/* Selected Role Information */}
          {selectedRole && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--primary)]/5 border border-[var(--primary)]/20 mb-6">
              <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                <selectedRole.icon
                  size={18}
                  className="theme-primary"
                />
              </div>

              <div>
                <p className="text-sm font-medium theme-text-primary">
                  {selectedRole.title} Login
                </p>

                <p className="text-xs theme-text-secondary">
                  {selectedRole.description}
                </p>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form
            onSubmit={handleLogin}
            noValidate
            className="space-y-5"
          >

            {/* Email */}
            <div>
              <label className="block text-sm font-medium theme-text-primary mb-2">
                Email Address
                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    handleEmailChange(e.target.value)
                  }
                  placeholder="Enter your email"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg theme-input text-sm focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-red-500 focus:ring-red-500/20"
                      : "focus:ring-[var(--primary)]/30"
                  }`}
                />
              </div>

              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium theme-text-primary">
                  Password
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <button
                  type="button"
                  className="text-xs font-medium theme-primary hover:underline"
                  onClick={() =>
                    alert(
                      "Forgot password functionality will be connected later."
                    )
                  }
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) =>
                    handlePasswordChange(e.target.value)
                  }
                  placeholder="Enter your password"
                  className={`w-full pl-10 pr-11 py-3 rounded-lg theme-input text-sm focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500/20"
                      : "focus:ring-[var(--primary)]/30"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((current) => !current)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-secondary"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                 
                </button>
              </div>

              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Sign In */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition disabled:opacity-50"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Temporary Development Login */}
          <div className="mt-4">
            <button
              type="button"
              onClick={handleSkipLogin}
              className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] theme-text-secondary text-sm font-medium hover:border-[var(--primary)] hover:theme-primary transition"
            >
              Skip Login
            </button>

            <p className="text-[11px] text-center theme-text-secondary mt-2">
              Temporary development option
            </p>
          </div>

          {/* Registration */}
          {role !== "admin" && (
            <>
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-[var(--border)]" />

                <span className="text-xs theme-text-secondary">
                  OR
                </span>

                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <div className="text-center">
                <p className="text-sm theme-text-secondary">
                  Don't have a PharmaNexus account?
                </p>

                <button
                  type="button"
                  onClick={onRegister}
                  className="mt-2 text-sm font-semibold theme-primary hover:underline"
                >
                  Create an account
                </button>
              </div>
            </>
          )}

          {/* Admin Information */}
          {role === "admin" && (
            <div className="mt-5 text-center">
              <p className="text-xs theme-text-secondary">
                Admin accounts are created and managed
                internally by PharmaNexus.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-center theme-text-secondary mt-6">
          © 2026 PharmaNexus. Pharmacy Management Platform.
        </p>
      </div>
    </div>
  )
}

export default Login