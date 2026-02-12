// src/components/admin/customers.jsx
import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, getDocs, orderBy, query } from "firebase/firestore";
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
            onClick={() => openDelete(row)}
            disabled={deletingId === row.id}
            className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 border border-red-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete customer"
          >
            {deletingId === row.id ? "⏳ Deleting..." : "🗑️ Delete"}
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Customers
              </h1>
              <p className="text-sm text-gray-500 max-w-2xl">
                View your customer base with contact details, status, and
                loyalty points. Use this for retention, support, and targeted
                offers.
              </p>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs uppercase tracking-wide text-gray-500">
                Total Loyalty Points
              </span>
              <span className="text-2xl font-bold text-[#502455]">
                {totalPoints}
              </span>
              <span className="text-xs text-gray-400">
                {filteredCustomers.length} customers
              </span>
            </div>
          </div>

          {/* SEARCH + FILTERS */}
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[220px]">
                <Search
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by email, name, or phone"
                />
              </div>

              <div className="min-w-[160px]">
                <Filter
                  label="Role"
                  value={roleFilter}
                  options={roles}
                  onChange={setRoleFilter}
                />
              </div>

              <div className="min-w-[160px]">
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

        {/* TABLE */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <DataTable
            columns={columns}
            data={paginatedCustomers}
            loading={loading}
          />
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
      </div>
    </div>
  );
}

export default CustomersPage;

