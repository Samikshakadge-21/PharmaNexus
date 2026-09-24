import { useState, useEffect } from 'react'
import {
  Search,
  ShoppingCart,
  User,
  Trash2,
  Plus,
  Minus,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { getInventory, createSale } from '../../services/api'

function Billing({ setCurrentInvoice, setCurrentPage }) {
  // Available medicines fetched live from backend API
  const [dbMedicines, setDbMedicines] = useState([])
  const [loadingMedicines, setLoadingMedicines] = useState(false)
  const [fetchError, setFetchError] = useState('')

  // Search and cart
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])

  // Customer details
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')

  // Discount & Payment
  const [discount, setDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState('Cash')
  const [showPayment, setShowPayment] = useState(false)
  const [processingSale, setProcessingSale] = useState(false)
  const [saleError, setSaleError] = useState('')

  // Fetch medicines from backend GET /api/inventory
  const fetchBackendMedicines = async (searchTerm = '') => {
    setLoadingMedicines(true)
    setFetchError('')
    try {
      const res = await getInventory({ limit: 100, search: searchTerm })
      if (res && res.success) {
        const normalized = (res.data || []).map((item) => ({
          _id: item._id || item.id,
          id: item._id || item.id,
          name: item.medicineName || item.name || '',
          category: item.category || 'General',
          batch: item.batchNumber || item.batch || '',
          stock: Number(item.currentStock ?? item.quantity ?? 0),
          reorder: Number(item.reorderLevel ?? 0),
          price: Number(item.sellingPrice ?? item.mrp ?? 0),
          raw: item,
        }))
        setDbMedicines(normalized)
      }
    } catch (err) {
      console.error('Failed to load medicines for billing:', err)
      setFetchError(err.message || 'Unable to connect to backend server')
    } finally {
      setLoadingMedicines(false)
    }
  }

  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    fetchBackendMedicines(debouncedSearch)
  }, [debouncedSearch])

  const filteredMedicines = dbMedicines

  // Add medicine to cart
  const addToCart = (medicine) => {
    if (medicine.stock <= 0) return

    const existingIndex = cart.findIndex((item) => item._id === medicine._id)

    if (existingIndex !== -1) {
      const existing = cart[existingIndex]
      if (existing.quantity >= medicine.stock) return

      const updatedCart = [...cart]
      updatedCart[existingIndex] = {
        ...existing,
        quantity: existing.quantity + 1,
      }
      setCart(updatedCart)
      return
    }

    setCart([
      ...cart,
      {
        ...medicine,
        quantity: 1,
        unitPrice: Number(medicine.price),
      },
    ])
  }

  // Increase medicine quantity
  const increaseQuantity = (itemId) => {
    setCart(
      cart.map((item) => {
        if (item._id !== itemId) return item
        const medicine = dbMedicines.find((m) => m._id === itemId)
        if (!medicine || item.quantity >= medicine.stock) return item
        return {
          ...item,
          quantity: item.quantity + 1,
        }
      })
    )
  }

  // Decrease medicine quantity
  const decreaseQuantity = (itemId) => {
    setCart(
      cart
        .map((item) =>
          item._id === itemId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  // Remove medicine from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter((item) => item._id !== itemId))
  }

  // Bill calculations
  const subtotal = cart.reduce(
    (total, item) => total + item.unitPrice * item.quantity,
    0
  )

  const safeDiscount = Math.min(
    Math.max(Number(discount) || 0, 0),
    subtotal
  )

  const taxableAmount = Math.max(subtotal - safeDiscount, 0)
  const gst = taxableAmount * 0.05
  const grandTotal = taxableAmount + gst

  // Complete sale via Backend API -> Supabase
  const completeSale = async () => {
    if (cart.length === 0) return

    setProcessingSale(true)
    setSaleError('')

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: cart.map((item) => ({
          _id: item._id,
          id: item._id,
          batchNumber: item.batch,
          batch: item.batch,
          medicineName: item.name,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          price: item.unitPrice,
        })),
        subtotal,
        discount: safeDiscount,
        gst,
        grandTotal,
        paymentMethod,
      }

      // Call Backend API POST /api/billing/create
      const response = await createSale(payload)

      if (response && response.success) {
        const invoiceData = response.data || {
          invoiceNumber: `INV-${Date.now()}`,
          date: new Date().toISOString(),
          pharmacyName: 'Apollo Pharmacy',
          customerName,
          customerPhone,
          items: cart,
          subtotal,
          discount: safeDiscount,
          gst,
          grandTotal,
          paymentMethod,
        }

        setCurrentInvoice(invoiceData)
        setCurrentPage('invoice')

        // Clear bill after successful payment
        setCart([])
        setCustomerName('')
        setCustomerPhone('')
        setDiscount(0)
        setPaymentMethod('Cash')
        setShowPayment(false)
        setProcessingSale(false)
      } else {
        throw new Error(response.message || 'Billing transaction failed')
      }
    } catch (err) {
      console.error('Sale error:', err)
      setSaleError(err.message || 'Failed to complete transaction on backend')
      setProcessingSale(false)
    }
  }

  return (
    <div className="w-full">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold theme-text-primary">
          Billing
        </h1>
        <p className="text-sm theme-text-secondary mt-1">
          Create bills and manage pharmacy sales synced directly with Supabase.
        </p>
      </div>

      {fetchError && (
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-600 dark:text-red-400">
          <AlertCircle size={20} className="shrink-0" />
          <div>{fetchError}. Ensure Node server is running on `http://localhost:5000`.</div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Medicine Selection */}
        <div className="xl:col-span-2 theme-card rounded-xl p-6">

          <div className="flex items-center gap-2 mb-5">
            <ShoppingCart size={20} className="theme-primary" />
            <h2 className="text-lg font-semibold theme-text-primary">
              Add Medicines
            </h2>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 theme-text-secondary"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine by name or batch number..."
              className="theme-input w-full pl-10 pr-4 py-3 rounded-lg outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Medicine List */}
          <div className="mt-5 border theme-border rounded-lg overflow-hidden">
            <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-[var(--bg-input)] theme-text-secondary text-xs font-medium">
              <span>Medicine</span>
              <span>Batch</span>
              <span>Stock</span>
              <span>Price</span>
              <span className="text-center">Action</span>
            </div>

            {loadingMedicines ? (
              <div className="px-4 py-10 text-center flex items-center justify-center gap-2 theme-text-secondary">
                <Loader2 size={18} className="animate-spin" />
                Loading medicines from backend...
              </div>
            ) : filteredMedicines.length > 0 ? (
              <div className="divide-y divide-[var(--border)]">
                {filteredMedicines.map((medicine) => (
                  <div
                    key={medicine._id}
                    className="grid grid-cols-5 gap-4 items-center px-4 py-4 hover:bg-[var(--bg-input)] transition"
                  >
                    {/* Medicine */}
                    <div>
                      <p className="text-sm font-medium theme-text-primary">
                        {medicine.name}
                      </p>
                      <p className="text-xs theme-text-secondary mt-0.5">
                        {medicine.category}
                      </p>
                    </div>

                    {/* Batch */}
                    <span className="text-sm theme-text-secondary font-mono">
                      {medicine.batch || 'N/A'}
                    </span>

                    {/* Stock */}
                    <span
                      className={`text-sm font-medium ${
                        medicine.stock === 0
                          ? 'text-[var(--danger)] font-bold'
                          : medicine.stock <= medicine.reorder
                            ? 'text-[var(--warning)]'
                            : 'theme-text-primary'
                      }`}
                    >
                      {medicine.stock}
                    </span>

                    {/* Price */}
                    <span className="text-sm font-medium theme-text-primary">
                      ₹{Number(medicine.price).toFixed(2)}
                    </span>

                    {/* Add Button */}
                    <div className="flex justify-center">
                      <button
                        onClick={() => addToCart(medicine)}
                        disabled={medicine.stock <= 0}
                        className={`flex items-center gap-1 px-3 py-1.5 text-white rounded-lg text-xs font-medium transition cursor-pointer ${
                          medicine.stock <= 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
                        }`}
                      >
                        <Plus size={14} />
                        {medicine.stock <= 0 ? 'Out' : 'Add'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-10 text-center">
                <p className="text-sm theme-text-secondary">
                  No medicines found.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Current Bill */}
        <div className="theme-card rounded-xl p-6">

          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShoppingCart size={20} className="theme-primary" />
              <h2 className="text-lg font-semibold theme-text-primary">
                Current Bill
              </h2>
            </div>
            <span className="text-xs theme-text-secondary font-semibold">
              {cart.length} items
            </span>
          </div>

          {/* Cart */}
          {cart.length > 0 ? (
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item._id}
                  className="border theme-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium theme-text-primary">
                        {item.name}
                      </p>
                      <p className="text-xs theme-text-secondary mt-1">
                        Batch: {item.batch || 'N/A'}
                      </p>
                      <p className="text-sm theme-text-primary mt-2">
                        ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="theme-text-secondary hover:text-[var(--danger)] transition cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border theme-border rounded-lg">
                      <button
                        onClick={() => decreaseQuantity(item._id)}
                        className="px-2 py-1 theme-text-secondary hover:bg-[var(--bg-input)] cursor-pointer"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="px-3 text-sm theme-text-primary font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => increaseQuantity(item._id)}
                        className="px-2 py-1 theme-text-secondary hover:bg-[var(--bg-input)] cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <span className="text-sm font-semibold theme-text-primary">
                      ₹{(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border theme-border rounded-lg">
              <div className="px-4 py-8 text-center">
                <ShoppingCart size={32} className="mx-auto theme-text-secondary" />
                <p className="text-sm font-medium theme-text-primary mt-3">
                  No medicines added
                </p>
                <p className="text-xs theme-text-secondary mt-1">
                  Add medicines to create a bill
                </p>
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <User size={18} className="theme-primary" />
              <h3 className="text-sm font-semibold theme-text-primary">
                Customer Details
              </h3>
            </div>

            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name (optional)"
              className="theme-input w-full px-4 py-2.5 rounded-lg outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm"
            />

            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Mobile number (optional)"
              className="theme-input w-full px-4 py-2.5 rounded-lg mt-3 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] text-sm"
            />
          </div>

          {/* Bill Summary */}
          <div className="mt-6 pt-5 border-t theme-border space-y-3">
            <div className="flex justify-between text-sm">
              <span className="theme-text-secondary">Subtotal</span>
              <span className="theme-text-primary">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="theme-text-secondary">Discount</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                value={discount}
                onChange={(e) =>
                  setDiscount(
                    Math.min(Math.max(Number(e.target.value) || 0, 0), subtotal)
                  )
                }
                className="theme-input w-24 px-2 py-1 rounded-md text-right outline-none text-sm"
              />
            </div>

            <div className="flex justify-between text-sm">
              <span className="theme-text-secondary">GST (5%)</span>
              <span className="theme-text-primary">₹{gst.toFixed(2)}</span>
            </div>

            <div className="pt-3 border-t theme-border flex items-center justify-between">
              <span className="font-semibold theme-text-primary">Grand Total</span>
              <span className="text-lg font-bold theme-primary">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={() => {
              setSaleError('')
              setShowPayment(true)
            }}
            disabled={cart.length === 0}
            className={`w-full mt-5 py-3 bg-[var(--primary)] text-white rounded-lg font-medium transition cursor-pointer ${
              cart.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-[var(--primary-hover)]'
            }`}
          >
            Proceed to Payment
          </button>

        </div>

      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="theme-card rounded-xl p-6 w-full max-w-md shadow-xl border theme-border">
            <h2 className="text-xl font-semibold theme-text-primary">
              Complete Payment
            </h2>
            <p className="text-sm theme-text-secondary mt-1">
              Select payment method for this sale. Stock will be validated and deducted in Supabase.
            </p>

            {saleError && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{saleError}</span>
              </div>
            )}

            {/* Payment Methods */}
            <div className="mt-5 space-y-3">
              {['Cash', 'UPI', 'Card'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`w-full p-3 rounded-lg border text-left transition cursor-pointer ${
                    paymentMethod === method
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 font-semibold'
                      : 'theme-border hover:bg-[var(--bg-input)]'
                  }`}
                >
                  <span className="theme-text-primary font-medium">{method}</span>
                </button>
              ))}
            </div>

            {/* Payment Amount */}
            <div className="mt-5 pt-4 border-t theme-border">
              <div className="flex justify-between">
                <span className="theme-text-secondary">Amount to Pay</span>
                <span className="font-semibold theme-text-primary text-lg">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowPayment(false)
                  setSaleError('')
                }}
                disabled={processingSale}
                className="flex-1 px-4 py-2.5 rounded-lg border theme-border theme-text-primary hover:bg-[var(--bg-input)] transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={completeSale}
                disabled={processingSale}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] transition flex items-center justify-center gap-2 cursor-pointer font-medium"
              >
                {processingSale && <Loader2 size={16} className="animate-spin" />}
                {processingSale ? 'Processing...' : 'Complete Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Billing