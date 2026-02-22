// src/components/admin/customers.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";

import DataTable from "../common/DataTable";
import Search from "../common/Search";
import Filter from "../common/Filter";
import Pagination from "../common/Pagination";
import { StatusBadge } from "../common/StatusBadge";
import ConfirmationModal from "../common/ConfirmationModal";

function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  // ✅ Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "confirm",
    confirmButtonColor: "bg-[#7B2220]",
  });

  // ✅ delete loading per row
  const [deletingId, setDeletingId] = useState(null);

  // ✅ Edit modal state (loyalty points + status)
  const [editModal, setEditModal] = useState({ isOpen: false, customer: null });
  const [editPoints, setEditPoints] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [savingEdit, setSavingEdit] = useState(false);

  const closeConfirmationModal = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const list = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .filter((u) => {
            const role = String(u.role || "customer").toLowerCase();
            return role === "customer";
          });

        setCustomers(list);
        setCurrentPage(1);
      } catch (err) {
        console.error("Error fetching customers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";

    const date =
      typeof timestamp === "object" && timestamp?.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);

    if (Number.isNaN(date.getTime())) return "—";

    return (
      date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }) +
      " " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const roles = useMemo(
    () =>
      Array.from(
        new Set(
          (customers || [])
            .map((u) => u.role || "User")
            .filter((v) => typeof v === "string" && v.trim() !== "")
        )
      ),
    [customers]
  );

  const statuses = useMemo(
    () =>
      Array.from(
        new Set(
          (customers || [])
            .map((u) => u.status || "ACTIVE")
            .filter((v) => typeof v === "string" && v.trim() !== "")
        )
      ),
    [customers]
  );

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return (customers || []).filter((u) => {
      const role = u.role || "User";
      const status = u.status || "ACTIVE";

      const matchesSearch =
        !term ||
        (u.email || "").toLowerCase().includes(term) ||
        (u.username || "").toLowerCase().includes(term) ||
        String(u.phone || "").toLowerCase().includes(term);

      const matchesRole = !roleFilter || role === roleFilter;
      const matchesStatus = !statusFilter || status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [customers, search, roleFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, statusFilter]);

  // ---------- DELETE ----------
  const openDelete = (customer) => {
    setConfirmationModal({
      isOpen: true,
      title: "Delete Customer",
      message: `Are you sure you want to delete "${customer.username || customer.email}"? This action cannot be undone. This deletes only the Firestore document in users. Firebase Auth account is not removed unless you delete it via Admin SDK.`,
      onConfirm: async () => {
        try {
          setDeletingId(customer.id);
          await deleteDoc(doc(db, "users", customer.id));
          setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
          closeConfirmationModal();
        } catch (err) {
          console.error("Delete failed:", err);
          setConfirmationModal({
            isOpen: true,
            title: "Error",
            message: "Delete failed. Check permissions / rules.",
            onConfirm: closeConfirmationModal,
            type: "alert",
            confirmButtonColor: "bg-red-600",
          });
        } finally {
          setDeletingId(null);
        }
      },
      type: "confirm",
      confirmButtonColor: "bg-red-600",
    });
  };

  const openEdit = (customer) => {
    setEditPoints(String(customer.points ?? 0));
    setEditStatus(customer.status || "ACTIVE");
    setEditModal({ isOpen: true, customer });
  };

  const saveEdit = async () => {
    const customer = editModal.customer;
    if (!customer) return;
    const pts = Number(editPoints);
    if (isNaN(pts) || pts < 0) {
      alert("Loyalty points must be a non-negative number.");
      return;
    }
    setSavingEdit(true);
    try {
      await updateDoc(doc(db, "users", customer.id), {
        points: pts,
        status: editStatus,
      });
      setCustomers((prev) =>
        prev.map((c) => c.id === customer.id ? { ...c, points: pts, status: editStatus } : c)
      );
      setEditModal({ isOpen: false, customer: null });
    } catch (err) {
      console.error("Failed to update customer:", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const columns = [
    {
      key: "email",
      header: "Email",
      render: (row) => row.email || "—",
    },
    {
      key: "username",
      header: "Name",
      render: (row) => row.username || "—",
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.phone || "—",
    },
    {
      key: "role",
      header: "Role",
      render: (row) => row.role || "User",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge value={row.status || "ACTIVE"} />,
    },
    {
      key: "points",
      header: "Loyalty Points",
      render: (row) => row.points ?? 0,
    },
    {
      key: "createdAt",
      header: "Joined At",
      render: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 border border-blue-200 text-xs font-medium"
            title="Edit loyalty points / status"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => openDelete(row)}
            disabled={deletingId === row.id}
            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 border border-red-200 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete customer"
          >
            {deletingId === row.id ? "⏳" : "Delete"}
          </button>
        </div>
      ),
    },
  ];

  const totalPoints = filteredCustomers.reduce(
    (sum, u) => sum + Number(u.points || 0),
    0
  );

  return (
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        {/* HEADER */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                Customers
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 max-w-2xl break-words">
                View your customer base with contact details, status, and
                loyalty points. Use this for retention, support, and targeted
                offers.
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end flex-shrink-0">
              <span className="text-xs uppercase tracking-wide text-gray-500">
                Total Loyalty Points
              </span>
              <span className="text-xl sm:text-2xl font-bold text-[#502455]">
                {totalPoints}
              </span>
              <span className="text-xs text-gray-400">
                {filteredCustomers.length} customers
              </span>
            </div>
          </div>

          {/* SEARCH + FILTERS: stack on small screens */}
          <div className="mt-4 sm:mt-6 bg-white rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 items-stretch sm:items-end">
              <div className="w-full min-w-0 sm:flex-1 sm:min-w-[180px]">
                <Search
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by email, name, or phone"
                />
              </div>

              <div className="w-full sm:w-auto sm:min-w-[140px]">
                <Filter
                  label="Role"
                  value={roleFilter}
                  options={roles}
                  onChange={setRoleFilter}
                />
              </div>

              <div className="w-full sm:w-auto sm:min-w-[140px]">
                <Filter
                  label="Status"
                  value={statusFilter}
                  options={statuses}
                  onChange={setStatusFilter}
                />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE – same scroll-inside pattern as src/components/order */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-w-0">
          <div className="w-full min-w-0">
            <DataTable
              columns={columns}
              data={paginatedCustomers}
              loading={loading}
            />
          </div>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmationModal.isOpen}
          onClose={closeConfirmationModal}
          onConfirm={() => {
            if (confirmationModal.onConfirm) {
              confirmationModal.onConfirm();
            }
          }}
          title={confirmationModal.title}
          message={confirmationModal.message}
          type={confirmationModal.type}
          confirmButtonColor={confirmationModal.confirmButtonColor}
          confirmText="Yes, Delete"
          cancelText="Cancel"
          loading={deletingId !== null}
        />

        {/* Edit Customer Modal */}
        {editModal.isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setEditModal({ isOpen: false, customer: null })}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="px-6 py-5 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900">Edit Customer</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {editModal.customer?.email || editModal.customer?.username}
                  </p>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {/* Loyalty Points */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Loyalty Points
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editPoints}
                      onChange={(e) => setEditPoints(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2220]/30"
                      placeholder="e.g. 150"
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Status
                    </label>
                    <div className="flex gap-2">
                      {["ACTIVE", "SUSPENDED", "BANNED"].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setEditStatus(s)}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            editStatus === s
                              ? s === "ACTIVE"
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : s === "SUSPENDED"
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-red-600 text-white border-red-600"
                              : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {editStatus !== "ACTIVE" && (
                      <p className="text-[0.65rem] text-amber-600 mt-1">
                        {editStatus === "SUSPENDED"
                          ? "Suspended accounts cannot log in temporarily."
                          : "Banned accounts are permanently blocked."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditModal({ isOpen: false, customer: null })}
                    className="px-5 py-2 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    disabled={savingEdit}
                    className="px-5 py-2 rounded-xl bg-[#7B2220] text-white text-sm font-semibold hover:bg-[#8B3230] transition-all disabled:opacity-60"
                  >
                    {savingEdit ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CustomersPage;

