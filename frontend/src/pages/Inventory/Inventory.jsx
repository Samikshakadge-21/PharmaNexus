import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  MoreVertical,
  Upload,
  Search,
  FileSpreadsheet,
  Eye,
  Clock,
  Edit,
  Trash2,
  X,
  FileText,
  Loader2,
  AlertCircle,
  ChevronDown,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

import { useState, useEffect, useMemo, useRef } from "react";

import {
  getInventory,
  createInventory,
  updateInventory,
  deleteInventory,
  uploadInventory,
} from "../../services/api";

function Inventory() {
  /* ============================= */
  /* Inventory State                */
  /* ============================= */

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ============================= */
  /* Pagination & Summary           */
  /* ============================= */

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [summary, setSummary] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    expiringSoon: 0,
  });

  /* ============================= */
  /* Search                         */
  /* ============================= */

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  /* ============================= */
  /* Inventory Filters              */
  /* ============================= */

  const [selectedCategories, setSelectedCategories] = useState([]);

  const [availabilityFilter, setAvailabilityFilter] = useState("All");

  const [expiryFilter, setExpiryFilter] = useState("Any");

  /*
   * Sort rules are kept as an ordered array.
   *
   * Example:
   * [
   *   "expiry-asc",
   *   "stock-asc"
   * ]
   *
   * First selected rule has highest priority.
   */
  const [sortRules, setSortRules] = useState([]);

  const [openFilter, setOpenFilter] = useState(null);

  const filterRef = useRef(null);

  /* ============================= */
  /* Modals                         */
  /* ============================= */

  const [showAddMedicine, setShowAddMedicine] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  /* ============================= */
  /* File Upload                    */
  /* ============================= */

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  /* ============================= */
  /* New Medicine Form              */
  /* ============================= */

  const [newMedicine, setNewMedicine] = useState({
    medicineName: "",
    sku: "",
    batchNumber: "",
    category: "Tablets",
    quantity: "",
    reorderLevel: "",
    purchasePrice: "",
    sellingPrice: "",
    manufacturingDate: "",
    expiryDate: "",
    storageLocation: "Main Store",
    supplierName: "General Supplier",
  });

  /* ============================= */
  /* Debounce Search                */
  /* ============================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ============================= */
  /* Close Dropdown On Outside Click */
  /* ============================= */

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target)
      ) {
        setOpenFilter(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* ============================= */
  /* Fetch Inventory                */
  /* ============================= */

  const fetchInventoryData = async (opts = {}) => {
    const currentPage =
      opts.page !== undefined ? opts.page : page;

    const currentLimit =
      opts.limit !== undefined ? opts.limit : limit;

    const currentSearch =
      opts.search !== undefined
        ? opts.search
        : debouncedSearch;

    setLoading(true);
    setError("");

    try {
      /*
       * Backend filtering will be redesigned later.
       *
       * For now we keep the existing API contract
       * so the frontend remains compatible.
       */
      const response = await getInventory({
        page: currentPage,
        limit: currentLimit,
        search: currentSearch,
      });

      if (response && response.success) {
        setItems(response.data || []);

        setTotalCount(response.total ?? 0);

        setTotalPages(response.totalPages ?? 1);

        if (response.summary) {
          setSummary(response.summary);
        }
      } else {
        throw new Error(
          response?.message || "Failed to load inventory"
        );
      }
    } catch (err) {
      console.error("API Error:", err);

      setError(
        err.message ||
          "Unable to connect to backend server at http://localhost:5000"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventoryData({
      page,
      limit,
      search: debouncedSearch,
    });
  }, [page, limit, debouncedSearch]);

  /* ============================= */
  /* Availability Status             */
  /* ============================= */

  const getAvailabilityStatus = (med) => {
    const stock = Number(med.quantity ?? med.stock ?? 0);
    const reorder = Number(med.reorderLevel ?? med.reorder ?? 0);

    if (stock <= 0) return "Out of Stock";
    if (stock <= reorder) return "Low Stock";
    return "In Stock";
  };

  /* ============================= */
  /* Medicine Status                */
  /* ============================= */

  const getMedicineStatus = (med) => {
    const stock = Number(
      med.quantity ?? med.stock ?? 0
    );

    const reorder = Number(
      med.reorderLevel ?? med.reorder ?? 0
    );

    /*
     * Expired has highest priority.
     */
    if (med.expiryDate || med.expiry) {
      const expiryDate = new Date(
        med.expiryDate || med.expiry
      );

      if (!Number.isNaN(expiryDate.getTime())) {
        const today = new Date();

        today.setHours(0, 0, 0, 0);
        expiryDate.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
          return {
            label: "Expired",
            badgeClass:
              "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30",
          };
        }
      }
    }

    const availability = getAvailabilityStatus(med);

    if (availability === "Out of Stock") {
      return {
        label: "Out of Stock",
        badgeClass:
          "bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30",
      };
    }

    if (availability === "Low Stock") {
      return {
        label: "Low Stock",
        badgeClass:
          "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30",
      };
    }

    return {
      label: "In Stock",
      badgeClass:
        "bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30",
    };
  };

  /* ============================= */
  /* Expiry Helpers                 */
  /* ============================= */

  const getDaysUntilExpiry = (medicine) => {
    const expiryValue =
      medicine.expiryDate || medicine.expiry;

    if (!expiryValue) return null;

    const expiryDate = new Date(expiryValue);

    if (Number.isNaN(expiryDate.getTime())) {
      return null;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    expiryDate.setHours(0, 0, 0, 0);

    const difference =
      expiryDate.getTime() - today.getTime();

    return Math.ceil(
      difference / (1000 * 60 * 60 * 24)
    );
  };

  /* ============================= */
  /* Category List                  */
  /* ============================= */

  const categories = useMemo(() => {
    const categorySet = new Set();

    items.forEach((medicine) => {
      if (medicine.category) {
        categorySet.add(medicine.category);
      }
    });

    return Array.from(categorySet).sort(
      (a, b) => a.localeCompare(b)
    );
  }, [items]);

  /* ============================= */
  /* Category Filter                */
  /* ============================= */

  const toggleCategory = (category) => {
    setSelectedCategories((previous) => {
      if (previous.includes(category)) {
        return previous.filter(
          (item) => item !== category
        );
      }

      return [...previous, category];
    });

    setPage(1);
  };

  /* ============================= */
  /* Sort Rules                     */
  /* ============================= */

  const sortOptions = [
    {
      value: "name-asc",
      label: "Medicine: A → Z",
    },
    {
      value: "name-desc",
      label: "Medicine: Z → A",
    },
    {
      value: "stock-asc",
      label: "Stock: Low → High",
    },
    {
      value: "stock-desc",
      label: "Stock: High → Low",
    },
    {
      value: "expiry-asc",
      label: "Expiry: Nearest First",
    },
    {
      value: "expiry-desc",
      label: "Expiry: Farthest First",
    },
    {
      value: "recent",
      label: "Recently Added",
    },
  ];

  const toggleSortRule = (value) => {
    setSortRules((previous) => {
      if (previous.includes(value)) {
        return previous.filter((item) => item !== value);
      }

      const oppositeRuleMap = {
        "name-asc": "name-desc",
        "name-desc": "name-asc",
        "stock-asc": "stock-desc",
        "stock-desc": "stock-asc",
        "expiry-asc": "expiry-desc",
        "expiry-desc": "expiry-asc",
      };

      const oppositeRule = oppositeRuleMap[value];

      return [
        ...previous.filter((item) => item !== oppositeRule),
        value,
      ];
    });

    setPage(1);
  };

  /* ============================= */
  /* Local Filtering + Sorting      */
  /* ============================= */

  const filteredMedicines = useMemo(() => {
    let result = [...items];

    /* Category */
    if (selectedCategories.length > 0) {
      result = result.filter((medicine) =>
        selectedCategories.includes(
          medicine.category || "General"
        )
      );
    }

    /* Availability */
    if (availabilityFilter !== "All") {
      result = result.filter((medicine) => {
        const status = getAvailabilityStatus(medicine);

        return status === availabilityFilter;
      });
    }

    /* Expiry */
    if (expiryFilter !== "Any") {
      result = result.filter((medicine) => {
        const daysLeft =
          getDaysUntilExpiry(medicine);

        if (daysLeft === null) {
          return false;
        }

        switch (expiryFilter) {
          case "Expired":
            return daysLeft < 0;

          case "Expires Today":
            return daysLeft === 0;

          case "Within 7 Days":
            return daysLeft >= 0 && daysLeft <= 7;

          case "Within 30 Days":
            return daysLeft >= 0 && daysLeft <= 30;

          case "Within 90 Days":
            return daysLeft >= 0 && daysLeft <= 90;

          default:
            return true;
        }
      });
    }

    /* Multi-sort */
    if (sortRules.length > 0) {
      result.sort((a, b) => {
        for (const rule of sortRules) {
          const nameA =
            a.medicineName ||
            a.name ||
            "";

          const nameB =
            b.medicineName ||
            b.name ||
            "";

          const stockA = Number(
            a.quantity ?? a.stock ?? 0
          );

          const stockB = Number(
            b.quantity ?? b.stock ?? 0
          );

          const expiryA =
            getDaysUntilExpiry(a);

          const expiryB =
            getDaysUntilExpiry(b);

          let comparison = 0;

          switch (rule) {
            case "name-asc":
              comparison = nameA.localeCompare(nameB);
              break;

            case "name-desc":
              comparison = nameB.localeCompare(nameA);
              break;

            case "stock-asc":
              comparison = stockA - stockB;
              break;

            case "stock-desc":
              comparison = stockB - stockA;
              break;

            case "expiry-asc":
              comparison =
                (expiryA ?? Infinity) -
                (expiryB ?? Infinity);
              break;

            case "expiry-desc":
              comparison =
                (expiryB ?? Infinity) -
                (expiryA ?? Infinity);
              break;

            case "recent": {
              const dateA = new Date(
                a.createdAt ||
                  a.created_at ||
                  0
              ).getTime();

              const dateB = new Date(
                b.createdAt ||
                  b.created_at ||
                  0
              ).getTime();

              comparison = dateB - dateA;
              break;
            }

            default:
              comparison = 0;
          }

          if (comparison !== 0) {
            return comparison;
          }
        }

        const fallbackA =
          a.medicineName || a.name || "";
        const fallbackB =
          b.medicineName || b.name || "";

        return fallbackA.localeCompare(fallbackB);
      });
    }

    return result;
  }, [
    items,
    selectedCategories,
    availabilityFilter,
    expiryFilter,
    sortRules,
  ]);

  /* ============================= */
  /* Reset Filters                  */
  /* ============================= */

  const resetFilters = () => {
    setSelectedCategories([]);
    setAvailabilityFilter("All");
    setExpiryFilter("Any");
    setSortRules([]);
    setSearchTerm("");
    setDebouncedSearch("");
    setPage(1);
    setOpenFilter(null);
  };

  const activeFilterCount =
    selectedCategories.length +
    (availabilityFilter !== "All" ? 1 : 0) +
    (expiryFilter !== "Any" ? 1 : 0) +
    sortRules.length;

  /* ============================= */
  /* Add Medicine                   */
  /* ============================= */

  const handleAddMedicine = async (e) => {
    e.preventDefault();

    if (
      !newMedicine.medicineName ||
      !newMedicine.batchNumber
    ) {
      alert(
        "Please fill in Medicine Name and Batch Number."
      );
      return;
    }

    try {
      const payload = {
        medicineName:
          newMedicine.medicineName.trim(),

        sku: newMedicine.sku.trim(),

        batchNumber:
          newMedicine.batchNumber.trim(),

        category:
          newMedicine.category.trim(),

        quantity: Number(
          newMedicine.quantity || 0
        ),

        reorderLevel: Number(
          newMedicine.reorderLevel || 0
        ),

        purchasePrice: Number(
          newMedicine.purchasePrice || 0
        ),

        sellingPrice: Number(
          newMedicine.sellingPrice || 0
        ),

        manufacturingDate:
          newMedicine.manufacturingDate || null,

        expiryDate:
          newMedicine.expiryDate || null,

        storageLocation:
          newMedicine.storageLocation.trim(),

        supplierName:
          newMedicine.supplierName.trim(),
      };

      await createInventory(payload);

      await fetchInventoryData();

      setNewMedicine({
        medicineName: "",
        sku: "",
        batchNumber: "",
        category: "Tablets",
        quantity: "",
        reorderLevel: "",
        purchasePrice: "",
        sellingPrice: "",
        manufacturingDate: "",
        expiryDate: "",
        storageLocation: "Main Store",
        supplierName: "General Supplier",
      });

      setShowAddMedicine(false);
    } catch (err) {
      alert(
        `Error creating medicine: ${err.message}`
      );
    }
  };

  /* ============================= */
  /* Edit Medicine                  */
  /* ============================= */

  const handleSaveEdit = async (e) => {
    e.preventDefault();

    if (!editingMedicine) return;

    try {
      const targetId =
        editingMedicine._id ||
        editingMedicine.inventoryId;

      const payload = {
        medicineName: (
          editingMedicine.medicineName ||
          editingMedicine.name ||
          ""
        ).trim(),

        sku: (
          editingMedicine.sku || ""
        ).trim(),

        batchNumber: (
          editingMedicine.batchNumber ||
          editingMedicine.batch ||
          ""
        ).trim(),

        category: (
          editingMedicine.category ||
          "General"
        ).trim(),

        quantity: Number(
          editingMedicine.quantity ??
            editingMedicine.stock ??
            0
        ),

        reorderLevel: Number(
          editingMedicine.reorderLevel ??
            editingMedicine.reorder ??
            0
        ),

        purchasePrice: Number(
          editingMedicine.purchasePrice ?? 0
        ),

        sellingPrice: Number(
          editingMedicine.sellingPrice ??
            editingMedicine.price ??
            0
        ),

        manufacturingDate:
          editingMedicine.manufacturingDate ||
          editingMedicine.mfgDate ||
          null,

        expiryDate:
          editingMedicine.expiryDate ||
          editingMedicine.expiry ||
          null,

        storageLocation: (
          editingMedicine.storageLocation ||
          "Main Store"
        ).trim(),

        supplierName: (
          editingMedicine.supplierName ||
          editingMedicine.supplier ||
          "General Supplier"
        ).trim(),
      };

      await updateInventory(
        targetId,
        payload
      );

      await fetchInventoryData();

      setEditingMedicine(null);
    } catch (err) {
      alert(
        `Error updating medicine: ${err.message}`
      );
    }
  };

  /* ============================= */
  /* Delete Medicine                */
  /* ============================= */

  const handleDeleteMedicine = async (med) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${
          med.medicineName || med.name
        }"?`
      )
    ) {
      return;
    }

    try {
      const targetId =
        med._id ||
        med.inventoryId ||
        med.batchNumber ||
        med.batch;

      await deleteInventory(targetId);

      await fetchInventoryData();

      setOpenMenu(null);
    } catch (err) {
      alert(
        `Error deleting medicine: ${err.message}`
      );
    }
  };

  /* ============================= */
  /* File Upload                    */
  /* ============================= */

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    const validExtensions = [
      ".csv",
      ".xls",
      ".xlsx",
    ];

    const fileExtension = file.name
      .substring(
        file.name.lastIndexOf(".")
      )
      .toLowerCase();

    if (
      !validExtensions.includes(
        fileExtension
      )
    ) {
      setFileError(
        "Invalid file type. Please select a .csv, .xls, or .xlsx file."
      );

      setSelectedFile(null);

      return;
    }

    setFileError("");
    setImportSummary(null);
    setSelectedFile(file);
  };

  /* ============================= */
  /* Import Upload                  */
  /* ============================= */

  const handleImportUpload = async () => {
    if (!selectedFile) {
      setFileError(
        "Please select an Excel or CSV file to upload."
      );

      return;
    }

    setUploading(true);
    setFileError("");
    setImportSummary(null);

    try {
      const response =
        await uploadInventory(
          selectedFile
        );

      if (
        response &&
        response.success
      ) {
        setImportSummary(
          response.summary || {
            successfullyImported:
              response.summary
                ?.successfullyImported ||
              0,
          }
        );

        await fetchInventoryData();

        setTimeout(() => {
          setShowImportModal(false);
          setUploading(false);
          setSelectedFile(null);
          setImportSummary(null);
        }, 2000);
      } else {
        throw new Error(
          response.message ||
            "Upload failed"
        );
      }
    } catch (err) {
      setFileError(
        err.message ||
          "Failed to upload file to backend"
      );

      setUploading(false);
    }
  };

  /* ============================= */
  /* UI                             */
  /* ============================= */

  return (
    <div className="w-full space-y-6">

      {/* ============================= */}
      {/* HEADER                         */}
      {/* ============================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold theme-text-primary">
            Inventory
          </h1>

          <p className="mt-1 text-sm theme-text-secondary">
            Manage your pharmacy medicines, stock
            levels and expiry information.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <button
            onClick={() => {
              setShowImportModal(true);
              setFileError("");
              setImportSummary(null);
              setSelectedFile(null);
            }}
            className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-medium theme-text-primary transition-colors hover:bg-[var(--bg-input)]"
          >
            <Upload size={18} />
            Import Excel/CSV
          </button>

          <button
            onClick={() =>
              setShowAddMedicine(true)
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)] shadow-sm"
          >
            <Plus size={18} />
            Add Medicine
          </button>

        </div>
      </div>

      {/* ============================= */}
      {/* ERROR                          */}
      {/* ============================= */}

      {error && (
        <div className="flex items-center gap-3 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-600 dark:text-red-400">

          <AlertCircle
            size={20}
            className="shrink-0"
          />

          <div className="flex-1">
            <span className="font-semibold">
              Backend Connection Issue:{" "}
            </span>

            {error}
          </div>

          <button
            onClick={fetchInventoryData}
            className="rounded-lg bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>

        </div>
      )}

      {/* ============================= */}
      {/* SUMMARY CARDS                  */}
      {/* ============================= */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <div className="theme-card rounded-xl p-4 border theme-border">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium theme-text-secondary">
                Total Medicines
              </p>

              <h2 className="mt-1 text-2xl font-bold theme-text-primary">
                {summary.total ?? 0}
              </h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <Package size={20} />
            </div>

          </div>
        </div>

        <div className="theme-card rounded-xl p-4 border theme-border">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium theme-text-secondary">
                In Stock
              </p>

              <h2 className="mt-1 text-2xl font-bold theme-text-primary">
                {summary.inStock ?? 0}
              </h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--success)]/10 text-[var(--success)]">
              <CheckCircle size={20} />
            </div>

          </div>
        </div>

        <div className="theme-card rounded-xl p-4 border theme-border">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium theme-text-secondary">
                Low Stock
              </p>

              <h2 className="mt-1 text-2xl font-bold theme-text-primary">
                {summary.lowStock ?? 0}
              </h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--warning)]/10 text-[var(--warning)]">
              <AlertTriangle size={20} />
            </div>

          </div>
        </div>

        <div className="theme-card rounded-xl p-4 border theme-border">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium theme-text-secondary">
                Out of Stock
              </p>

              <h2 className="mt-1 text-2xl font-bold theme-text-primary">
                {summary.outOfStock ?? 0}
              </h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--danger)]/10 text-[var(--danger)]">
              <XCircle size={20} />
            </div>

          </div>
        </div>

        <div className="theme-card rounded-xl p-4 border theme-border">
          <div className="flex items-center justify-between">

            <div>
              <p className="text-xs font-medium theme-text-secondary">
                Expiring Soon
              </p>

              <h2 className="mt-1 text-2xl font-bold theme-text-primary">
                {summary.expiringSoon ?? 0}
              </h2>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
              <Clock size={20} />
            </div>

          </div>
        </div>

      </div>

      {/* ============================= */}
      {/* SEARCH + FILTERS               */}
      {/* ============================= */}

      <div
        ref={filterRef}
        className="theme-card rounded-xl p-5 border theme-border"
      >

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,1fr)_auto_auto_auto_auto_auto]">

          {/* Search */}

          <div className="relative min-w-0">

            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search medicines by name, SKU, or batch..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="theme-input h-11 w-full rounded-lg border border-[var(--border)] pl-10 pr-4 text-sm theme-text-primary outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]"
            />

          </div>

          {/* Filter Row */}

          <div className="contents">

            {/* Category */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setOpenFilter(
                    openFilter === "category"
                      ? null
                      : "category"
                  )
                }
                className="flex min-w-[160px] items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3.5 py-2.5 text-sm theme-text-primary hover:bg-[var(--bg-input)]"
              >

                <div className="flex items-center gap-2">
                  <SlidersHorizontal
                    size={16}
                  />

                  <span>
                    Category
                    {selectedCategories.length >
                      0 &&
                      ` (${selectedCategories.length})`}
                  </span>
                </div>

                <ChevronDown
                  size={16}
                />

              </button>

              {openFilter ===
                "category" && (
                <div className="absolute left-0 top-full z-40 mt-2 w-64 theme-card rounded-xl border theme-border shadow-xl">

                  <div className="border-b theme-border px-4 py-3">

                    <p className="text-sm font-semibold theme-text-primary">
                      Medicine Category
                    </p>

                    <p className="mt-0.5 text-xs theme-text-secondary">
                      Select one or more categories
                    </p>

                  </div>

                  <div className="max-h-64 overflow-y-auto p-2">

                    {categories.length ===
                    0 ? (
                      <p className="px-3 py-4 text-center text-xs theme-text-secondary">
                        No categories available
                      </p>
                    ) : (
                      categories.map(
                        (category) => (
                          <label
                            key={category}
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[var(--bg-input)]"
                          >

                            <input
                              type="checkbox"
                              checked={selectedCategories.includes(
                                category
                              )}
                              onChange={() =>
                                toggleCategory(
                                  category
                                )
                              }
                              className="h-4 w-4 accent-[var(--primary)]"
                            />

                            <span className="text-sm theme-text-primary">
                              {category}
                            </span>

                          </label>
                        )
                      )
                    )}

                  </div>

                  {selectedCategories.length >
                    0 && (
                    <div className="border-t theme-border p-2">

                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCategories(
                            []
                          )
                        }
                        className="w-full rounded-lg px-3 py-2 text-xs font-medium theme-primary hover:bg-[var(--bg-input)]"
                      >
                        Clear Category
                      </button>

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Availability */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setOpenFilter(
                    openFilter ===
                      "availability"
                      ? null
                      : "availability"
                  )
                }
                className="flex min-w-[160px] items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3.5 py-2.5 text-sm theme-text-primary hover:bg-[var(--bg-input)]"
              >

                <span>
                  Availability
                </span>

                <ChevronDown
                  size={16}
                />

              </button>

              {openFilter ===
                "availability" && (
                <div className="absolute left-0 top-full z-40 mt-2 w-56 theme-card rounded-xl border theme-border p-2 shadow-xl">

                  {[
                    "All",
                    "In Stock",
                    "Low Stock",
                    "Out of Stock",
                  ].map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--bg-input)]"
                    >

                      <input
                        type="radio"
                        name="availability"
                        checked={
                          availabilityFilter ===
                          option
                        }
                        onChange={() => {
                          setAvailabilityFilter(
                            option
                          );

                          setPage(1);
                        }}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />

                      <span className="text-sm theme-text-primary">
                        {option}
                      </span>

                    </label>
                  ))}

                </div>
              )}

            </div>

            {/* Expiry */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setOpenFilter(
                    openFilter === "expiry"
                      ? null
                      : "expiry"
                  )
                }
                className="flex min-w-[160px] items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3.5 py-2.5 text-sm theme-text-primary hover:bg-[var(--bg-input)]"
              >

                <span>
                  Expiry
                </span>

                <ChevronDown
                  size={16}
                />

              </button>

              {openFilter ===
                "expiry" && (
                <div className="absolute left-0 top-full z-40 mt-2 w-60 theme-card rounded-xl border theme-border p-2 shadow-xl">

                  {[
                    "Any",
                    "Expired",
                    "Expires Today",
                    "Within 7 Days",
                    "Within 30 Days",
                    "Within 90 Days",
                  ].map((option) => (
                    <label
                      key={option}
                      className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--bg-input)]"
                    >

                      <input
                        type="radio"
                        name="expiry"
                        checked={
                          expiryFilter ===
                          option
                        }
                        onChange={() => {
                          setExpiryFilter(
                            option
                          );

                          setPage(1);
                        }}
                        className="h-4 w-4 accent-[var(--primary)]"
                      />

                      <span className="text-sm theme-text-primary">
                        {option}
                      </span>

                    </label>
                  ))}

                </div>
              )}

            </div>

            {/* Sort */}

            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setOpenFilter(
                    openFilter === "sort"
                      ? null
                      : "sort"
                  )
                }
                className="flex min-w-[160px] items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3.5 py-2.5 text-sm theme-text-primary hover:bg-[var(--bg-input)]"
              >

                <span>
                  Sort By
                  {sortRules.length >
                    0 &&
                    ` (${sortRules.length})`}
                </span>

                <ChevronDown
                  size={16}
                />

              </button>

              {openFilter ===
                "sort" && (
                <div className="absolute right-0 top-full z-40 mt-2 w-72 theme-card rounded-xl border theme-border shadow-xl">

                  <div className="border-b theme-border px-4 py-3">

                    <p className="text-sm font-semibold theme-text-primary">
                      Sort Inventory
                    </p>

                    <p className="mt-0.5 text-xs theme-text-secondary">
                      Select multiple rules in priority order
                    </p>

                  </div>

                  <div className="p-2">

                    {sortOptions.map(
                      (option) => (
                        <label
                          key={option.value}
                          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-[var(--bg-input)]"
                        >

                          <input
                            type="checkbox"
                            checked={sortRules.includes(
                              option.value
                            )}
                            onChange={() =>
                              toggleSortRule(
                                option.value
                              )
                            }
                            className="h-4 w-4 accent-[var(--primary)]"
                          />

                          <span className="text-sm theme-text-primary">
                            {option.label}
                          </span>

                        </label>
                      )
                    )}

                  </div>

                  {sortRules.length >
                    0 && (
                    <div className="border-t theme-border px-4 py-3">

                      <p className="mb-2 text-xs theme-text-secondary">
                        Priority:
                      </p>

                      <div className="flex flex-wrap gap-1.5">

                        {sortRules.map(
                          (rule, index) => {
                            const option =
                              sortOptions.find(
                                (item) =>
                                  item.value ===
                                  rule
                              );

                            return (
                              <span
                                key={rule}
                                className="rounded-md bg-[var(--primary)]/10 px-2 py-1 text-[11px] font-medium theme-primary"
                              >
                                {index + 1}.{" "}
                                {option?.label}
                              </span>
                            );
                          }
                        )}

                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Reset */}

            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3.5 py-2.5 text-sm font-medium theme-text-secondary hover:bg-[var(--bg-input)]"
            >
              <RotateCcw size={15} />

              Reset

              {activeFilterCount > 0 && (
                <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

          </div>

          {/* Active Filters */}

          {activeFilterCount > 0 && (
            <div className="flex min-w-0 flex-wrap items-center gap-2 lg:col-start-1 lg:col-end-2">

              <span className="text-xs font-medium theme-text-secondary">
                Active filters:
              </span>

              {selectedCategories.map(
                (category) => (
                  <span
                    key={category}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium theme-primary"
                  >
                    {category}

                    <button
                      type="button"
                      onClick={() =>
                        toggleCategory(
                          category
                        )
                      }
                      className="hover:opacity-70"
                    >
                      <X size={12} />
                    </button>
                  </span>
                )
              )}

              {availabilityFilter !==
                "All" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium theme-primary">
                  {availabilityFilter}

                  <button
                    type="button"
                    onClick={() =>
                      setAvailabilityFilter(
                        "All"
                      )
                    }
                    className="hover:opacity-70"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {expiryFilter !==
                "Any" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium theme-primary">
                  {expiryFilter}

                  <button
                    type="button"
                    onClick={() =>
                      setExpiryFilter("Any")
                    }
                    className="hover:opacity-70"
                  >
                    <X size={12} />
                  </button>
                </span>
              )}

              {sortRules.map((rule) => {
                const option = sortOptions.find(
                  (item) => item.value === rule
                );

                return (
                  <span
                    key={rule}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-xs font-medium theme-primary"
                  >
                    {option?.label}

                    <button
                      type="button"
                      onClick={() => toggleSortRule(rule)}
                      className="hover:opacity-70"
                      aria-label={`Remove ${option?.label || "sort rule"}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}

            </div>
          )}

        </div>
      </div>

      {/* ============================= */}
      {/* INVENTORY TABLE                */}
      {/* ============================= */}

      <div className="theme-card rounded-xl border theme-border overflow-hidden">

        <div className="border-b theme-border px-5 py-4 flex items-center justify-between">

          <div>
            <h2 className="text-base font-semibold theme-text-primary">
              Medicine Inventory List
            </h2>

            <p className="text-xs theme-text-secondary mt-0.5">
              Showing{" "}
              {filteredMedicines.length > 0
                ? (page - 1) * limit + 1
                : 0}{" "}
              to{" "}
              {Math.min(
                page * limit,
                totalCount
              )}{" "}
              of {totalCount} total entries
            </p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-xs font-medium theme-text-secondary">

              <Loader2
                size={16}
                className="animate-spin text-[var(--primary)]"
              />

              Loading inventory...

            </div>
          )}

        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[950px] text-left">

            <thead>

              <tr className="border-b theme-border bg-[var(--bg-input)] text-xs font-semibold theme-text-secondary">

                <th className="px-5 py-3.5">
                  Medicine
                </th>

                <th className="px-5 py-3.5">
                  SKU
                </th>

                <th className="px-5 py-3.5">
                  Category
                </th>

                <th className="px-5 py-3.5">
                  Batch Number
                </th>

                <th className="px-5 py-3.5">
                  Quantity
                </th>

                <th className="px-5 py-3.5">
                  Reorder Level
                </th>

                <th className="px-5 py-3.5">
                  Expiry Date
                </th>

                <th className="px-5 py-3.5">
                  Status
                </th>

                <th className="px-5 py-3.5 text-right">
                  Action
                </th>

              </tr>

            </thead>

            <tbody className="divide-y theme-border text-sm">

              {loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-5 py-12 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <Loader2
                        size={32}
                        className="animate-spin text-[var(--primary)] mb-2"
                      />

                      <p className="text-sm font-medium theme-text-primary">
                        Loading inventory...
                      </p>

                    </div>

                  </td>
                </tr>
              ) : filteredMedicines.length >
                0 ? (
                filteredMedicines.map(
                  (medicine, index) => {
                    const statusInfo =
                      getMedicineStatus(
                        medicine
                      );

                    const nameVal =
                      medicine.medicineName ||
                      medicine.name ||
                      "Unnamed Medicine";

                    const batchVal =
                      medicine.batchNumber ||
                      medicine.batch ||
                      `BATCH-${index}`;

                    const skuVal =
                      medicine.sku ||
                      "N/A";

                    const stockVal =
                      medicine.quantity ??
                      medicine.stock ??
                      0;

                    const reorderVal =
                      medicine.reorderLevel ??
                      medicine.reorder ??
                      0;

                    const expVal =
                      medicine.expiryDate ||
                      medicine.expiry;

                    return (
                      <tr
                        key={
                          medicine._id ||
                          medicine.inventoryId ||
                          batchVal
                        }
                        className="hover:bg-[var(--bg-input)]/50 transition-colors"
                      >

                        <td className="px-5 py-4">

                          <div className="font-medium theme-text-primary">
                            {nameVal}
                          </div>

                          <div className="text-xs theme-text-secondary mt-0.5">
                            {medicine.storageLocation ||
                              medicine.pack ||
                              "Main Store"}
                          </div>

                        </td>

                        <td className="px-5 py-4 font-mono text-xs theme-text-secondary">
                          {skuVal}
                        </td>

                        <td className="px-5 py-4 theme-text-secondary">
                          {medicine.category ||
                            "General"}
                        </td>

                        <td className="px-5 py-4 font-mono text-xs theme-text-primary">
                          {batchVal}
                        </td>

                        <td className="px-5 py-4 font-semibold theme-text-primary">
                          {stockVal}
                        </td>

                        <td className="px-5 py-4 theme-text-secondary">
                          {reorderVal}
                        </td>

                        <td className="px-5 py-4 theme-text-secondary">

                          {expVal
                            ? new Date(
                                expVal
                              ).toLocaleDateString(
                                "en-US",
                                {
                                  month:
                                    "short",
                                  day: "numeric",
                                  year:
                                    "numeric",
                                }
                              )
                            : "N/A"}

                        </td>

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusInfo.badgeClass}`}
                          >
                            {statusInfo.label}
                          </span>

                        </td>

                        <td className="px-5 py-4 text-right">

                          <div className="relative inline-block text-left">

                            <button
                              onClick={() =>
                                setOpenMenu(
                                  openMenu ===
                                    batchVal
                                    ? null
                                    : batchVal
                                )
                              }
                              className="rounded-lg p-2 theme-text-secondary hover:bg-[var(--bg-input)] hover:theme-text-primary"
                            >
                              <MoreVertical
                                size={18}
                              />
                            </button>

                            {openMenu ===
                              batchVal && (
                              <div className="absolute right-0 top-10 z-20 w-32 theme-card rounded-lg border theme-border py-1 shadow-lg text-left">

                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs theme-text-primary hover:bg-[var(--bg-input)]"
                                  onClick={() => {
                                    setSelectedMedicine(
                                      medicine
                                    );

                                    setOpenMenu(
                                      null
                                    );
                                  }}
                                >
                                  <Eye size={14} />
                                  View
                                </button>

                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs theme-text-primary hover:bg-[var(--bg-input)]"
                                  onClick={() => {
                                    setEditingMedicine(
                                      medicine
                                    );

                                    setOpenMenu(
                                      null
                                    );
                                  }}
                                >
                                  <Edit size={14} />
                                  Edit
                                </button>

                                <button
                                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/10"
                                  onClick={() =>
                                    handleDeleteMedicine(
                                      medicine
                                    )
                                  }
                                >
                                  <Trash2
                                    size={14}
                                  />
                                  Delete
                                </button>

                              </div>
                            )}

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )
              ) : (
                <tr>

                  <td
                    colSpan="9"
                    className="px-5 py-12 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <Package
                        size={32}
                        className="theme-text-secondary mb-2 opacity-50"
                      />

                      <p className="text-sm font-medium theme-text-primary">
                        No inventory records found
                      </p>

                      <p className="text-xs theme-text-secondary mt-1">
                        Try changing your filters
                        or search term.
                      </p>

                    </div>

                  </td>

                </tr>
              )}

            </tbody>

          </table>

        </div>

        {/* Pagination */}

        <div className="border-t theme-border px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs theme-text-secondary">

          <div>
            Showing{" "}
            <span className="font-semibold theme-text-primary">
              {filteredMedicines.length >
              0
                ? (page - 1) *
                    limit +
                  1
                : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold theme-text-primary">
              {Math.min(
                page * limit,
                totalCount
              )}
            </span>{" "}
            of{" "}
            <span className="font-semibold theme-text-primary">
              {totalCount}
            </span>{" "}
            records
          </div>

          <div className="flex items-center gap-2">

            <button
              type="button"
              onClick={() =>
                setPage((prev) =>
                  Math.max(
                    1,
                    prev - 1
                  )
                )
              }
              disabled={
                page <= 1 ||
                loading
              }
              className="px-3 py-1.5 rounded-lg border theme-border theme-text-primary hover:bg-[var(--bg-input)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>

            <span className="px-2 font-medium theme-text-primary">
              Page {page} of{" "}
              {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setPage((prev) =>
                  Math.min(
                    totalPages,
                    prev + 1
                  )
                )
              }
              disabled={
                page >=
                  totalPages ||
                loading
              }
              className="px-3 py-1.5 rounded-lg border theme-border theme-text-primary hover:bg-[var(--bg-input)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>

          </div>

        </div>

      </div>

      {/* ============================= */}
      {/* ADD MEDICINE MODAL             */}
      {/* ============================= */}

      {showAddMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">

          <div className="theme-card w-full max-w-2xl rounded-xl border theme-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between border-b theme-border px-6 py-4">

              <div>
                <h2 className="text-lg font-bold theme-text-primary">
                  + Add New Medicine
                </h2>

                <p className="text-xs theme-text-secondary">
                  Enter medicine details.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowAddMedicine(false)
                }
                className="rounded-lg p-1.5 theme-text-secondary hover:bg-[var(--bg-input)]"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={
                handleAddMedicine
              }
              className="p-6 overflow-y-auto space-y-4"
            >

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Medicine Name *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg"
                    value={
                      newMedicine.medicineName
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        medicineName:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    SKU
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. MED-0010"
                    value={
                      newMedicine.sku
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        sku: e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Batch Number *
                  </label>

                  <input
                    type="text"
                    required
                    placeholder="e.g. BATCH-2026-X"
                    value={
                      newMedicine.batchNumber
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        batchNumber:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Category
                  </label>

                  <select
                    value={
                      newMedicine.category
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        category:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  >
                    <option value="Tablets">
                      Tablets
                    </option>

                    <option value="Capsules">
                      Capsules
                    </option>

                    <option value="Syrups">
                      Syrups
                    </option>

                    <option value="Injections">
                      Injections
                    </option>

                    <option value="Ointments">
                      Ointments
                    </option>

                    <option value="Supplements">
                      Supplements
                    </option>

                    <option value="General">
                      General
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 100"
                    value={
                      newMedicine.quantity
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        quantity:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Reorder Level
                  </label>

                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 20"
                    value={
                      newMedicine.reorderLevel
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        reorderLevel:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Purchase Price (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 20.00"
                    value={
                      newMedicine.purchasePrice
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        purchasePrice:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Selling Price (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 28.50"
                    value={
                      newMedicine.sellingPrice
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        sellingPrice:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Manufacturing Date
                  </label>

                  <input
                    type="date"
                    value={
                      newMedicine.manufacturingDate
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        manufacturingDate:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Expiry Date
                  </label>

                  <input
                    type="date"
                    value={
                      newMedicine.expiryDate
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        expiryDate:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Storage Location
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Rack B-12"
                    value={
                      newMedicine.storageLocation
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        storageLocation:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold theme-text-primary mb-1">
                    Supplier Name
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Cipla Distributors"
                    value={
                      newMedicine.supplierName
                    }
                    onChange={(e) =>
                      setNewMedicine({
                        ...newMedicine,
                        supplierName:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t theme-border">

                <button
                  type="button"
                  onClick={() =>
                    setShowAddMedicine(false)
                  }
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium theme-text-secondary hover:bg-[var(--bg-input)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
                >
                  Add Medicine
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

      {/* ============================= */}
      {/* IMPORT MODAL                   */}
      {/* ============================= */}

      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">

          <div className="theme-card w-full max-w-md rounded-xl border theme-border shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between border-b theme-border px-6 py-4">

              <div>
                <h2 className="text-lg font-bold theme-text-primary">
                  Upload Pharmacy Inventory
                </h2>

                <p className="text-xs theme-text-secondary">
                  Upload your Excel or CSV inventory file.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowImportModal(false);
                  setFileError("");
                  setImportSummary(null);
                }}
                className="rounded-lg p-1.5 theme-text-secondary hover:bg-[var(--bg-input)]"
              >
                <X size={18} />
              </button>

            </div>

            <div className="p-6 space-y-4">

              {importSummary && (
                <div className="rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 p-3.5 text-xs text-[var(--success)] font-medium space-y-1">

                  <p className="font-bold">
                    Inventory imported successfully!
                  </p>

                  <p>
                    Total Processed:{" "}
                    {importSummary.totalRowsProcessed ||
                      importSummary.successfullyImported}
                  </p>

                  <p>
                    Successfully Imported:{" "}
                    {
                      importSummary.successfullyImported
                    }
                  </p>

                  {importSummary.failedRowsCount >
                    0 && (
                    <p className="text-red-500 font-bold">
                      Failed Rows:{" "}
                      {
                        importSummary.failedRowsCount
                      }
                    </p>
                  )}

                </div>
              )}

              {fileError && (
                <div className="rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 p-3 text-xs text-[var(--danger)] font-medium">
                  {fileError}
                </div>
              )}

              <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-6 text-center hover:border-[var(--primary)] transition-colors">

                <FileSpreadsheet
                  className="mx-auto text-[var(--primary)] mb-2 opacity-80"
                  size={36}
                />

                <p className="text-xs font-medium theme-text-primary">
                  Choose a file to upload
                </p>

                <p className="text-[11px] theme-text-secondary mt-1">
                  Accepted formats: .xlsx, .xls, .csv
                </p>

                <input
                  type="file"
                  accept=".csv,.xls,.xlsx"
                  onChange={
                    handleFileChange
                  }
                  className="mt-4 block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--primary)]/10 file:text-[var(--primary)] hover:file:bg-[var(--primary)]/20 cursor-pointer"
                />

              </div>

              {selectedFile && (
                <div className="flex items-center justify-between rounded-lg bg-[var(--bg-input)] p-3 border theme-border">

                  <div className="flex items-center gap-2.5 overflow-hidden">

                    <FileText
                      size={20}
                      className="text-[var(--primary)] shrink-0"
                    />

                    <div className="truncate">

                      <p className="text-xs font-medium theme-text-primary truncate">
                        {selectedFile.name}
                      </p>

                      <p className="text-[10px] theme-text-secondary">
                        {(
                          selectedFile.size /
                          1024
                        ).toFixed(1)}{" "}
                        KB
                      </p>

                    </div>

                  </div>

                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setFileError("");
                    setImportSummary(null);
                  }}
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium theme-text-secondary hover:bg-[var(--bg-input)]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    uploading ||
                    !selectedFile
                  }
                  onClick={
                    handleImportUpload
                  }
                  className="flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)] disabled:opacity-50"
                >

                  {uploading && (
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {uploading
                    ? "Uploading..."
                    : "Upload"}

                </button>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ============================= */}
      {/* VIEW MEDICINE MODAL            */}
      {/* ============================= */}

      {selectedMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">

          <div className="theme-card w-full max-w-lg rounded-xl border theme-border shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between border-b theme-border px-6 py-4">

              <div>
                <h2 className="text-lg font-bold theme-text-primary">
                  Medicine Details
                </h2>

                <p className="text-xs theme-text-secondary">
                  Comprehensive stock and supplier information.
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedMedicine(null)
                }
                className="rounded-lg p-1.5 theme-text-secondary hover:bg-[var(--bg-input)]"
              >
                <X size={18} />
              </button>

            </div>

            <div className="p-6 grid grid-cols-2 gap-4 text-xs">

              <div>
                <span className="theme-text-secondary block">
                  Medicine Name
                </span>

                <span className="font-semibold text-sm theme-text-primary block mt-0.5">
                  {selectedMedicine.medicineName ||
                    selectedMedicine.name}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  SKU
                </span>

                <span className="font-mono font-semibold theme-text-primary block mt-0.5">
                  {selectedMedicine.sku ||
                    "N/A"}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Batch Number
                </span>

                <span className="font-mono font-semibold theme-text-primary block mt-0.5">
                  {selectedMedicine.batchNumber ||
                    selectedMedicine.batch ||
                    "N/A"}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Category
                </span>

                <span className="font-semibold theme-text-primary block mt-0.5">
                  {selectedMedicine.category ||
                    "General"}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Current Quantity
                </span>

                <span className="font-semibold text-sm theme-text-primary block mt-0.5">
                  {selectedMedicine.quantity ??
                    selectedMedicine.stock ??
                    0}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Reorder Level
                </span>

                <span className="font-semibold theme-text-primary block mt-0.5">
                  {selectedMedicine.reorderLevel ??
                    selectedMedicine.reorder ??
                    0}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Purchase Price
                </span>

                <span className="font-semibold theme-text-primary block mt-0.5">
                  {typeof selectedMedicine.purchasePrice ===
                  "number"
                    ? `₹${selectedMedicine.purchasePrice.toFixed(
                        2
                      )}`
                    : selectedMedicine.purchasePrice ||
                      "N/A"}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Selling Price
                </span>

                <span className="font-semibold theme-text-primary block mt-0.5">
                  {typeof selectedMedicine.sellingPrice ===
                  "number"
                    ? `₹${selectedMedicine.sellingPrice.toFixed(
                        2
                      )}`
                    : selectedMedicine.sellingPrice ||
                      selectedMedicine.price ||
                      "N/A"}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Manufacturing Date
                </span>

                <span className="font-semibold theme-text-primary block mt-0.5">
                  {selectedMedicine.manufacturingDate
                    ? new Date(
                        selectedMedicine.manufacturingDate
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month:
                            "short",
                          day: "numeric",
                          year:
                            "numeric",
                        }
                      )
                    : selectedMedicine.mfgDate ||
                      "N/A"}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Expiry Date
                </span>

                <span className="font-semibold theme-text-primary block mt-0.5">
                  {selectedMedicine.expiryDate
                    ? new Date(
                        selectedMedicine.expiryDate
                      ).toLocaleDateString(
                        "en-US",
                        {
                          month:
                            "short",
                          day: "numeric",
                          year:
                            "numeric",
                        }
                      )
                    : selectedMedicine.expiry ||
                      "N/A"}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Storage Location
                </span>

                <span className="font-semibold theme-text-primary block mt-0.5">
                  {selectedMedicine.storageLocation ||
                    "Main Store"}
                </span>
              </div>

              <div>
                <span className="theme-text-secondary block">
                  Supplier
                </span>

                <span className="font-semibold theme-text-primary block mt-0.5">
                  {selectedMedicine.supplierName ||
                    selectedMedicine.supplier ||
                    "General Supplier"}
                </span>
              </div>

            </div>

            <div className="flex items-center justify-end border-t theme-border px-6 py-4">

              <button
                onClick={() =>
                  setSelectedMedicine(null)
                }
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

      {/* ============================= */}
      {/* EDIT MEDICINE MODAL            */}
      {/* ============================= */}

      {editingMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">

          <div className="theme-card w-full max-w-xl rounded-xl border theme-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between border-b theme-border px-6 py-4">

              <div>
                <h2 className="text-lg font-bold theme-text-primary">
                  Edit Medicine
                </h2>

                <p className="text-xs theme-text-secondary">
                  Update inventory record.
                </p>
              </div>

              <button
                onClick={() =>
                  setEditingMedicine(null)
                }
                className="rounded-lg p-1.5 theme-text-secondary hover:bg-[var(--bg-input)]"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={
                handleSaveEdit
              }
              className="p-6 overflow-y-auto space-y-4"
            >

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">

                <div>
                  <label className="block font-semibold theme-text-primary mb-1">
                    Medicine Name
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      editingMedicine.medicineName ||
                      editingMedicine.name ||
                      ""
                    }
                    onChange={(e) =>
                      setEditingMedicine({
                        ...editingMedicine,
                        medicineName:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold theme-text-primary mb-1">
                    SKU
                  </label>

                  <input
                    type="text"
                    value={
                      editingMedicine.sku ||
                      ""
                    }
                    onChange={(e) =>
                      setEditingMedicine({
                        ...editingMedicine,
                        sku: e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold theme-text-primary mb-1">
                    Batch Number
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      editingMedicine.batchNumber ||
                      editingMedicine.batch ||
                      ""
                    }
                    onChange={(e) =>
                      setEditingMedicine({
                        ...editingMedicine,
                        batchNumber:
                          e.target.value,
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold theme-text-primary mb-1">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      editingMedicine.quantity ??
                      editingMedicine.stock ??
                      0
                    }
                    onChange={(e) =>
                      setEditingMedicine({
                        ...editingMedicine,
                        quantity:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold theme-text-primary mb-1">
                    Reorder Level
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={
                      editingMedicine.reorderLevel ??
                      editingMedicine.reorder ??
                      0
                    }
                    onChange={(e) =>
                      setEditingMedicine({
                        ...editingMedicine,
                        reorderLevel:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="block font-semibold theme-text-primary mb-1">
                    Selling Price (₹)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      editingMedicine.sellingPrice ??
                      editingMedicine.price ??
                      0
                    }
                    onChange={(e) =>
                      setEditingMedicine({
                        ...editingMedicine,
                        sellingPrice:
                          Number(
                            e.target.value
                          ),
                      })
                    }
                    className="theme-input w-full rounded-lg border border-[var(--border)] px-3 py-2 outline-none focus:border-[var(--primary)]"
                  />
                </div>

              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t theme-border">

                <button
                  type="button"
                  onClick={() =>
                    setEditingMedicine(null)
                  }
                  className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium theme-text-secondary hover:bg-[var(--bg-input)]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Inventory;