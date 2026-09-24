import { useState } from "react"
import {
  Pill,
  Store,
  Truck,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Upload,
  FileText,
  X,
  ArrowRight,
  ArrowLeft,
} from "lucide-react"

import { registerUser } from "../../services/api"

function Register({ onRegister, onLogin, onSwitchToLogin, onRegisterSuccess }) {

  const [role, setRole] = useState("pharmacy")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [licenseFile, setLicenseFile] = useState(null)

  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    address: "",
    gstin: "",
    licenseNumber: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({})

  // --------------------------------------------------
  // Handle normal field changes
  // --------------------------------------------------
  const handleChange = (field, value) => {

    setFormData((current) => ({
      ...current,
      [field]: value,
    }))

    // Remove error once user starts correcting the field
    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: "",
      }))
    }
  }

  // --------------------------------------------------
  // Change account role
  // --------------------------------------------------
  const handleRoleChange = (newRole) => {

    setRole(newRole)

    // Licence belongs to the selected account type.
    // Clear it if the user changes role.
    setLicenseFile(null)

    setErrors((current) => ({
      ...current,
      licenseFile: "",
    }))
  }

  // --------------------------------------------------
  // Licence file upload validation
  // --------------------------------------------------
  const handleLicenseUpload = (e) => {

    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ]

    const maxSize = 5 * 1024 * 1024 // 5 MB

    if (!allowedTypes.includes(file.type)) {

      setLicenseFile(null)

      setErrors((current) => ({
        ...current,
        licenseFile:
          "Only PDF, JPG, and PNG files are allowed.",
      }))

      e.target.value = ""
      return
    }

    if (file.size > maxSize) {

      setLicenseFile(null)

      setErrors((current) => ({
        ...current,
        licenseFile:
          "Licence file must be 5 MB or smaller.",
      }))

      e.target.value = ""
      return
    }

    setLicenseFile(file)

    setErrors((current) => ({
      ...current,
      licenseFile: "",
    }))
  }

  // --------------------------------------------------
  // Remove selected licence
  // --------------------------------------------------
  const removeLicenseFile = () => {

    setLicenseFile(null)

    setErrors((current) => ({
      ...current,
      licenseFile: "Please upload your drug licence.",
    }))
  }

  // --------------------------------------------------
  // Complete form validation
  // --------------------------------------------------
  const validateForm = () => {

    const newErrors = {}

    const businessName = formData.businessName.trim()
    const ownerName = formData.ownerName.trim()
    const email = formData.email.trim()
    const phone = formData.phone.trim()
    const address = formData.address.trim()
    const gstin = formData.gstin.trim().toUpperCase()
    const licenseNumber = formData.licenseNumber.trim()
    const password = formData.password
    const confirmPassword = formData.confirmPassword

    // -----------------------------------------------
    // Business / Pharmacy Name
    // -----------------------------------------------
    if (!businessName) {

      newErrors.businessName =
        role === "pharmacy"
          ? "Pharmacy name is required."
          : "Business / Distributor name is required."

    } else if (businessName.length < 2) {

      newErrors.businessName =
        "Name must contain at least 2 characters."

    } else if (businessName.length > 100) {

      newErrors.businessName =
        "Name cannot exceed 100 characters."

    } else if (!/^[A-Za-z0-9&.,'()\- ]+$/.test(businessName)) {

      newErrors.businessName =
        "Name contains invalid characters."
    }

    // -----------------------------------------------
    // Owner / Contact Person
    // -----------------------------------------------
    if (!ownerName) {

      newErrors.ownerName =
        role === "pharmacy"
          ? "Owner name is required."
          : "Contact person name is required."

    } else if (ownerName.length < 2) {

      newErrors.ownerName =
        "Name must contain at least 2 characters."

    } else if (ownerName.length > 80) {

      newErrors.ownerName =
        "Name cannot exceed 80 characters."

    } else if (!/^[A-Za-z.'\- ]+$/.test(ownerName)) {

      newErrors.ownerName =
        "Please enter a valid name."
    }

    // -----------------------------------------------
    // Email
    // -----------------------------------------------
    if (!email) {

      newErrors.email = "Email address is required."

    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
    ) {

      newErrors.email =
        "Please enter a valid email address."

    } else if (email.length > 150) {

      newErrors.email =
        "Email address is too long."
    }

    // -----------------------------------------------
    // Indian Mobile Number
    // -----------------------------------------------
    const cleanPhone = phone.replace(/\s|-/g, "")

    if (!phone) {

      newErrors.phone =
        "Mobile number is required."

    } else if (!/^(?:\+91|91)?[6-9]\d{9}$/.test(cleanPhone)) {

      newErrors.phone =
        "Please enter a valid Indian mobile number."
    }

    // -----------------------------------------------
    // Address
    // -----------------------------------------------
    if (!address) {

      newErrors.address =
        "Business address is required."

    } else if (address.length < 10) {

      newErrors.address =
        "Please enter a complete business address."

    } else if (address.length > 300) {

      newErrors.address =
        "Address cannot exceed 300 characters."
    }

    // -----------------------------------------------
    // GSTIN
    // -----------------------------------------------
    if (!gstin) {

      newErrors.gstin =
        "GSTIN is required."

    } else if (
      !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(
        gstin
      )
    ) {

      newErrors.gstin =
        "Please enter a valid GSTIN."
    }

    // -----------------------------------------------
    // Drug Licence Number
    // -----------------------------------------------
    if (!licenseNumber) {

      newErrors.licenseNumber =
        "Drug licence number is required."

    } else if (licenseNumber.length < 5) {

      newErrors.licenseNumber =
        "Please enter a valid drug licence number."

    } else if (licenseNumber.length > 50) {

      newErrors.licenseNumber =
        "Licence number cannot exceed 50 characters."

    } else if (!/^[A-Za-z0-9\/\-. ]+$/.test(licenseNumber)) {

      newErrors.licenseNumber =
        "Licence number contains invalid characters."
    }

    // -----------------------------------------------
    // Licence File
    // -----------------------------------------------
    if (!licenseFile) {

      newErrors.licenseFile =
        "Please upload your drug licence."
    }

    // -----------------------------------------------
    // Password
    // -----------------------------------------------
    if (!password) {

      newErrors.password =
        "Password is required."

    } else if (password.length < 8) {

      newErrors.password =
        "Password must contain at least 8 characters."

    } else if (password.length > 64) {

      newErrors.password =
        "Password cannot exceed 64 characters."

    } else if (!/[A-Z]/.test(password)) {

      newErrors.password =
        "Password must contain at least one uppercase letter."

    } else if (!/[a-z]/.test(password)) {

      newErrors.password =
        "Password must contain at least one lowercase letter."

    } else if (!/[0-9]/.test(password)) {

      newErrors.password =
        "Password must contain at least one number."

    } else if (!/[^A-Za-z0-9]/.test(password)) {

      newErrors.password =
        "Password must contain at least one special character."
    }

    // -----------------------------------------------
    // Confirm Password
    // -----------------------------------------------
    if (!confirmPassword) {

      newErrors.confirmPassword =
        "Please confirm your password."

    } else if (confirmPassword !== password) {

      newErrors.confirmPassword =
        "Passwords do not match."
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  // --------------------------------------------------
  // Submit registration
  // --------------------------------------------------
  const handleRegister = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        pharmacyName: formData.businessName.trim() || 'My Pharmacy',
        ownerName: formData.ownerName.trim() || 'Pharmacist',
        phone: formData.phone.trim(),
        role: role || 'pharmacist',
      }

      const res = await registerUser(payload)
      if (res && res.success) {
        if (onRegisterSuccess) {
          onRegisterSuccess(formData.email.trim())
        } else if (onRegister) {
          onRegister()
        }
      } else {
        setErrors((prev) => ({ ...prev, form: res?.message || 'Registration failed.' }))
      }
    } catch (err) {
      setErrors((prev) => ({ ...prev, form: err.message || 'Registration failed.' }))
    } finally {
      setIsSubmitting(false)
    }
  }

  // --------------------------------------------------
  // Format file size
  // --------------------------------------------------
  const formatFileSize = (bytes) => {

    if (bytes < 1024) {
      return `${bytes} B`
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="text-center mb-7">

          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--primary)] text-white shadow-sm">
            <Pill size={28} />
          </div>

          <h1 className="text-2xl font-bold theme-text-primary mt-4">
            Join PharmaNexus
          </h1>

          <p className="text-sm theme-text-secondary mt-1">
            Create your account and get started
          </p>

        </div>

        {/* Registration Card */}
        <div className="theme-card rounded-2xl p-7 shadow-sm">

          <div className="mb-6">

            <h2 className="text-xl font-semibold theme-text-primary">
              Create Account
            </h2>

            <p className="text-sm theme-text-secondary mt-1">
              Select your account type to continue
            </p>

          </div>

          {/* -----------------------------------------
              ACCOUNT TYPE
          ------------------------------------------ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">

            {/* Pharmacy */}
            <button
              type="button"
              onClick={() => handleRoleChange("pharmacy")}
              className={`p-4 rounded-xl border text-left transition ${
                role === "pharmacy"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "theme-border hover:bg-[var(--bg-input)]"
              }`}
            >

              <div className="flex items-center gap-3">

                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    role === "pharmacy"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-input)] theme-text-secondary"
                  }`}
                >
                  <Store size={20} />
                </div>

                <div>

                  <p className="text-sm font-semibold theme-text-primary">
                    Pharmacy
                  </p>

                  <p className="text-xs theme-text-secondary mt-1">
                    Manage your pharmacy
                  </p>

                </div>

              </div>

            </button>

            {/* Distributor */}
            <button
              type="button"
              onClick={() => handleRoleChange("distributor")}
              className={`p-4 rounded-xl border text-left transition ${
                role === "distributor"
                  ? "border-[var(--primary)] bg-[var(--primary)]/10"
                  : "theme-border hover:bg-[var(--bg-input)]"
              }`}
            >

              <div className="flex items-center gap-3">

                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    role === "distributor"
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-input)] theme-text-secondary"
                  }`}
                >
                  <Truck size={20} />
                </div>

                <div>

                  <p className="text-sm font-semibold theme-text-primary">
                    Distributor
                  </p>

                  <p className="text-xs theme-text-secondary mt-1">
                    Manage your catalog
                  </p>

                </div>

              </div>

            </button>

          </div>

          <form
            onSubmit={handleRegister}
            noValidate
            className="space-y-5"
          >

            {/* -----------------------------------------
                BUSINESS NAME
            ------------------------------------------ */}
            <div>

              <label className="block text-sm font-medium theme-text-primary mb-2">
                {role === "pharmacy"
                  ? "Pharmacy Name"
                  : "Business / Distributor Name"}

                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="relative">

                <Store
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
                />

                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) =>
                    handleChange(
                      "businessName",
                      e.target.value
                    )
                  }
                  placeholder={
                    role === "pharmacy"
                      ? "Enter pharmacy name"
                      : "Enter business / distributor name"
                  }
                  maxLength={100}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg theme-input text-sm focus:outline-none focus:ring-2 ${
                    errors.businessName
                      ? "border-red-500 focus:ring-red-500/20"
                      : "focus:ring-[var(--primary)]/30"
                  }`}
                />

              </div>

              {errors.businessName && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.businessName}
                </p>
              )}

            </div>

            {/* -----------------------------------------
                OWNER / CONTACT PERSON
            ------------------------------------------ */}
            <div>

              <label className="block text-sm font-medium theme-text-primary mb-2">
                {role === "pharmacy"
                  ? "Owner Name"
                  : "Contact Person"}

                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="relative">

                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
                />

                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) =>
                    handleChange(
                      "ownerName",
                      e.target.value
                    )
                  }
                  placeholder={
                    role === "pharmacy"
                      ? "Enter owner name"
                      : "Enter contact person name"
                  }
                  maxLength={80}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg theme-input text-sm focus:outline-none focus:ring-2 ${
                    errors.ownerName
                      ? "border-red-500 focus:ring-red-500/20"
                      : "focus:ring-[var(--primary)]/30"
                  }`}
                />

              </div>

              {errors.ownerName && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.ownerName}
                </p>
              )}

            </div>

            {/* -----------------------------------------
                EMAIL + PHONE
            ------------------------------------------ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

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
                    value={formData.email}
                    onChange={(e) =>
                      handleChange(
                        "email",
                        e.target.value
                      )
                    }
                    placeholder="Enter email"
                    maxLength={150}
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

              {/* Phone */}
              <div>

                <label className="block text-sm font-medium theme-text-primary mb-2">
                  Mobile Number
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <div className="relative">

                  <Phone
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
                  />

                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      handleChange(
                        "phone",
                        e.target.value
                      )
                    }
                    placeholder="+91 XXXXX XXXXX"
                    maxLength={15}
                    className={`w-full pl-10 pr-4 py-3 rounded-lg theme-input text-sm focus:outline-none focus:ring-2 ${
                      errors.phone
                        ? "border-red-500 focus:ring-red-500/20"
                        : "focus:ring-[var(--primary)]/30"
                    }`}
                  />

                </div>

                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {errors.phone}
                  </p>
                )}

              </div>

            </div>

            {/* -----------------------------------------
                BUSINESS ADDRESS
            ------------------------------------------ */}
            <div>

              <label className="block text-sm font-medium theme-text-primary mb-2">
                Business Address
                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="relative">

                <MapPin
                  size={18}
                  className="absolute left-3 top-3.5 theme-text-secondary"
                />

                <textarea
                  value={formData.address}
                  onChange={(e) =>
                    handleChange(
                      "address",
                      e.target.value
                    )
                  }
                  placeholder="Enter complete business address"
                  rows="3"
                  maxLength={300}
                  className={`w-full pl-10 pr-4 py-3 rounded-lg theme-input text-sm resize-none focus:outline-none focus:ring-2 ${
                    errors.address
                      ? "border-red-500 focus:ring-red-500/20"
                      : "focus:ring-[var(--primary)]/30"
                  }`}
                />

              </div>

              <div className="flex justify-between mt-1">

                {errors.address ? (
                  <p className="text-xs text-red-500">
                    {errors.address}
                  </p>
                ) : (
                  <span />
                )}

                <span className="text-xs theme-text-secondary">
                  {formData.address.length}/300
                </span>

              </div>

            </div>

            {/* -----------------------------------------
                GSTIN
            ------------------------------------------ */}
            <div>

              <label className="block text-sm font-medium theme-text-primary mb-2">
                GSTIN
                <span className="text-red-500 ml-1">*</span>
              </label>

              <input
                type="text"
                value={formData.gstin}
                onChange={(e) =>
                  handleChange(
                    "gstin",
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="Enter GSTIN"
                maxLength={15}
                className={`w-full px-4 py-3 rounded-lg theme-input text-sm focus:outline-none focus:ring-2 ${
                  errors.gstin
                    ? "border-red-500 focus:ring-red-500/20"
                    : "focus:ring-[var(--primary)]/30"
                }`}
              />

              {errors.gstin && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.gstin}
                </p>
              )}

            </div>

            {/* -----------------------------------------
                DRUG LICENCE NUMBER
            ------------------------------------------ */}
            <div>

              <label className="block text-sm font-medium theme-text-primary mb-2">
                Drug Licence Number
                <span className="text-red-500 ml-1">*</span>
              </label>

              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) =>
                  handleChange(
                    "licenseNumber",
                    e.target.value.toUpperCase()
                  )
                }
                placeholder="Enter drug licence number"
                maxLength={50}
                className={`w-full px-4 py-3 rounded-lg theme-input text-sm focus:outline-none focus:ring-2 ${
                  errors.licenseNumber
                    ? "border-red-500 focus:ring-red-500/20"
                    : "focus:ring-[var(--primary)]/30"
                }`}
              />

              {errors.licenseNumber && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.licenseNumber}
                </p>
              )}

            </div>

            {/* -----------------------------------------
                DRUG LICENCE UPLOAD
            ------------------------------------------ */}
            <div>

              <label className="block text-sm font-medium theme-text-primary mb-2">
                Upload Drug Licence
                <span className="text-red-500 ml-1">*</span>
              </label>

              {!licenseFile ? (

                <label
                  className={`flex flex-col items-center justify-center w-full min-h-32 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition ${
                    errors.licenseFile
                      ? "border-red-500 bg-red-500/5"
                      : "theme-border hover:border-[var(--primary)] hover:bg-[var(--bg-input)]"
                  }`}
                >

                  <Upload
                    size={24}
                    className="theme-text-secondary mb-2"
                  />

                  <p className="text-sm font-medium theme-text-primary">
                    Click to upload licence
                  </p>

                  <p className="text-xs theme-text-secondary mt-1">
                    PDF, JPG or PNG • Maximum 5 MB
                  </p>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleLicenseUpload}
                    className="hidden"
                  />

                </label>

              ) : (

                <div className="flex items-center justify-between gap-3 p-4 rounded-xl theme-input">

                  <div className="flex items-center gap-3 min-w-0">

                    <div className="w-10 h-10 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center shrink-0">

                      <FileText
                        size={20}
                        className="theme-primary"
                      />

                    </div>

                    <div className="min-w-0">

                      <p className="text-sm font-medium theme-text-primary truncate">
                        {licenseFile.name}
                      </p>

                      <p className="text-xs theme-text-secondary mt-1">
                        {formatFileSize(licenseFile.size)}
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={removeLicenseFile}
                    className="w-8 h-8 rounded-lg flex items-center justify-center theme-text-secondary hover:bg-red-500/10 hover:text-red-500 transition shrink-0"
                    aria-label="Remove licence file"
                  >
                    <X size={18} />
                  </button>

                </div>

              )}

              {errors.licenseFile && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.licenseFile}
                </p>
              )}

            </div>

            {/* -----------------------------------------
                PASSWORD
            ------------------------------------------ */}
            <div>

              <label className="block text-sm font-medium theme-text-primary mb-2">
                Password
                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    handleChange(
                      "password",
                      e.target.value
                    )
                  }
                  placeholder="Create a strong password"
                  maxLength={64}
                  className={`w-full pl-10 pr-11 py-3 rounded-lg theme-input text-sm focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500/20"
                      : "focus:ring-[var(--primary)]/30"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-secondary hover:theme-primary"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

              {errors.password ? (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.password}
                </p>
              ) : (
                <p className="text-xs theme-text-secondary mt-2">
                  Use 8+ characters with uppercase, lowercase,
                  number and special character.
                </p>
              )}

            </div>

            {/* -----------------------------------------
                CONFIRM PASSWORD
            ------------------------------------------ */}
            <div>

              <label className="block text-sm font-medium theme-text-primary mb-2">
                Confirm Password
                <span className="text-red-500 ml-1">*</span>
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
                />

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange(
                      "confirmPassword",
                      e.target.value
                    )
                  }
                  placeholder="Re-enter your password"
                  maxLength={64}
                  className={`w-full pl-10 pr-11 py-3 rounded-lg theme-input text-sm focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? "border-red-500 focus:ring-red-500/20"
                      : "focus:ring-[var(--primary)]/30"
                  }`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 theme-text-secondary hover:theme-primary"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1.5">
                  {errors.confirmPassword}
                </p>
              )}

            </div>

            {/* -----------------------------------------
                SUBMIT
            ------------------------------------------ */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition"
            >
              Create Account
              <ArrowRight size={18} />
            </button>

          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">

            <div className="flex-1 h-px bg-[var(--border)]" />

            <span className="text-xs theme-text-secondary">
              OR
            </span>

            <div className="flex-1 h-px bg-[var(--border)]" />

          </div>

          {/* Login */}
          <div className="text-center">

            <p className="text-sm theme-text-secondary">
              Already have an account?
            </p>

            <button
              type="button"
              onClick={onLogin}
              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold theme-primary hover:underline"
            >
              <ArrowLeft size={15} />
              Back to Sign In
            </button>

          </div>

        </div>

        <p className="text-xs text-center theme-text-secondary mt-6">
          © 2026 PharmaNexus. Pharmacy Management Platform.
        </p>

      </div>

    </div>
  )
}

export default Register