import {
  MessageCircle,
  MessageSquare,
  Download,
  Printer,
  X,
} from "lucide-react"

function Invoice({ invoice, onClose }) {

  if (!invoice) {
    return (
      <div className="w-full invoice-page">

        <div className="theme-card rounded-xl p-10 text-center">

          <h2 className="text-lg font-semibold theme-text-primary">
            No Invoice Available
          </h2>

          <p className="text-sm theme-text-secondary mt-2">
            Complete a sale from Billing to generate an invoice.
          </p>

        </div>

      </div>
    )
  }

  const invoiceNumber = invoice.invoiceNumber || "Invoice"

  const invoiceDate = invoice.date
    ? new Date(invoice.date).toLocaleString("en-IN")
    : new Date().toLocaleString("en-IN")

  const sendWhatsApp = () => {

    if (!invoice.customerPhone) {
      alert("Customer mobile number is not available.")
      return
    }

    const message = `
Invoice ${invoiceNumber}

Thank you for shopping with us.

Grand Total: ₹${Number(invoice.grandTotal).toFixed(2)}
Payment: ${invoice.paymentMethod}

PharmaNexus
    `.trim()

    const phone = invoice.customerPhone.replace(/\D/g, "")

    window.open(
      `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`,
      "_blank"
    )
  }

  const sendSMS = () => {

    if (!invoice.customerPhone) {
      alert("Customer mobile number is not available.")
      return
    }

    const message =
      `Invoice ${invoiceNumber}. Amount: ₹${Number(
        invoice.grandTotal
      ).toFixed(2)}. Payment: ${invoice.paymentMethod}. Thank you for shopping with us.`

    window.location.href =
      `sms:${invoice.customerPhone}?body=${encodeURIComponent(message)}`
  }

  const printInvoice = () => {
    window.print()
  }

  const downloadInvoice = () => {
    alert("PDF download will be connected with the backend.")
  }

  return (
    <div className="w-full">

      <div className="flex items-center justify-between mb-8">

        <div>
          <h1 className="text-2xl font-semibold theme-text-primary">
            Invoice
          </h1>

          <p className="text-sm theme-text-secondary mt-1">
            View and manage the completed invoice
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg theme-text-secondary hover:bg-[var(--bg-input)] transition"
          >
            <X size={20} />
          </button>
        )}

      </div>

      <div className="max-w-4xl mx-auto">

        <div
          id="invoice"
          className="theme-card rounded-xl p-8"
        >

          {/* Pharmacy Header */}

          <div className="flex items-start justify-between pb-6 border-b theme-border">

            <div>

              <h2 className="text-2xl font-bold theme-text-primary">
                PharmaNexus
              </h2>

              <p className="text-sm theme-text-secondary mt-1">
                Pharmacy Management System
              </p>

              <p className="text-sm theme-text-secondary mt-1">
                {invoice.pharmacyName || "Pharmacy"}
              </p>

            </div>

            <div className="text-right">

              <h3 className="text-lg font-semibold theme-text-primary">
                INVOICE
              </h3>

              <p className="text-sm theme-text-secondary mt-2">
                {invoiceNumber}
              </p>

              <p className="text-xs theme-text-secondary mt-1">
                {invoiceDate}
              </p>

            </div>

          </div>

          {/* Customer Details */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b theme-border">

            <div>

              <p className="text-xs theme-text-secondary uppercase">
                Customer
              </p>

              <p className="text-sm font-medium theme-text-primary mt-1">
                {invoice.customerName || "Walk-in Customer"}
              </p>

            </div>

            <div>

              <p className="text-xs theme-text-secondary uppercase">
                Mobile Number
              </p>

              <p className="text-sm font-medium theme-text-primary mt-1">
                {invoice.customerPhone || "Not provided"}
              </p>

            </div>

          </div>

          {/* Medicine List */}

          <div className="py-6">

            <div className="grid grid-cols-12 gap-4 pb-3 border-b theme-border text-xs font-medium theme-text-secondary">

              <span className="col-span-5">
                Medicine
              </span>

              <span className="col-span-2">
                Batch
              </span>

              <span className="col-span-1 text-center">
                Qty
              </span>

              <span className="col-span-2 text-right">
                Price
              </span>

              <span className="col-span-2 text-right">
                Total
              </span>

            </div>

            <div className="divide-y divide-[var(--border)]">

              {invoice.items.map((item, index) => (

                <div
                  key={item._id || item.id || `${item.batch}-${index}`}
                  className="grid grid-cols-12 gap-4 py-4 items-center"
                >

                  <div className="col-span-5">

                    <p className="text-sm font-medium theme-text-primary">
                      {item.name}
                    </p>

                    <p className="text-xs theme-text-secondary mt-1">
                      {item.pack}
                    </p>

                  </div>

                  <span className="col-span-2 text-sm theme-text-secondary">
                    {item.batch}
                  </span>

                  <span className="col-span-1 text-sm text-center theme-text-primary">
                    {item.quantity}
                  </span>

                  <span className="col-span-2 text-sm text-right theme-text-primary">
                    ₹{Number(item.unitPrice).toFixed(2)}
                  </span>

                  <span className="col-span-2 text-sm text-right font-medium theme-text-primary">
                    ₹{(
                      Number(item.unitPrice) *
                      Number(item.quantity)
                    ).toFixed(2)}
                  </span>

                </div>

              ))}

            </div>

          </div>

          {/* Bill Summary */}

          <div className="flex justify-end pt-6 border-t theme-border">

            <div className="w-full sm:w-80 space-y-3">

              <div className="flex justify-between text-sm">

                <span className="theme-text-secondary">
                  Subtotal
                </span>

                <span className="theme-text-primary">
                  ₹{Number(invoice.subtotal).toFixed(2)}
                </span>

              </div>

              <div className="flex justify-between text-sm">

                <span className="theme-text-secondary">
                  Discount
                </span>

                <span className="theme-text-primary">
                  ₹{Number(invoice.discount).toFixed(2)}
                </span>

              </div>

              <div className="flex justify-between text-sm">

                <span className="theme-text-secondary">
                  GST (5%)
                </span>

                <span className="theme-text-primary">
                  ₹{Number(invoice.gst).toFixed(2)}
                </span>

              </div>

              <div className="flex justify-between pt-3 border-t theme-border">

                <span className="font-semibold theme-text-primary">
                  Grand Total
                </span>

                <span className="text-lg font-bold theme-primary">
                  ₹{Number(invoice.grandTotal).toFixed(2)}
                </span>

              </div>

              <div className="flex justify-between text-sm pt-2">

                <span className="theme-text-secondary">
                  Payment Method
                </span>

                <span className="font-medium theme-text-primary">
                  {invoice.paymentMethod}
                </span>

              </div>

            </div>

          </div>

          {/* Footer */}

          <div className="text-center pt-8 mt-6 border-t theme-border">

            <p className="text-sm font-medium theme-text-primary">
              Thank you for your purchase!
            </p>

            <p className="text-xs theme-text-secondary mt-1">
              Please keep this invoice for your records.
            </p>

          </div>

        </div>

        {/* Invoice Actions */}

        <div className="flex flex-wrap gap-3 mt-6 no-print">

          <button
            onClick={sendWhatsApp}
            className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition"
          >
            <MessageCircle size={18} />
            WhatsApp
          </button>

          <button
            onClick={sendSMS}
            className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg border theme-border theme-text-primary hover:bg-[var(--bg-input)] transition"
          >
            <MessageSquare size={18} />
            SMS
          </button>

          <button
            onClick={downloadInvoice}
            className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg border theme-border theme-text-primary hover:bg-[var(--bg-input)] transition"
          >
            <Download size={18} />
            Download
          </button>

          <button
            onClick={printInvoice}
            className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-3 rounded-lg border theme-border theme-text-primary hover:bg-[var(--bg-input)] transition"
          >
            <Printer size={18} />
            Print
          </button>

        </div>

      </div>

    </div>
  )
}

export default Invoice