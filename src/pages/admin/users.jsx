import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import DataTable from "../../components/common/DataTable";
import { StatusBadge } from "../../components/common/StatusBadge";

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users");
        const q = query(usersCollection, orderBy("createdAt", "desc"));
        const usersSnapshot = await getDocs(q);

        const usersList = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setUsers(usersList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }) + " " + date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const columns = [
    {
      key: "firstName",
      header: "First Name",
      render: row => row.firstName || "—",
    },
    {
      key: "middleName",
      header: "Middle Name",
      render: row => row.middleName || "—",
    },
    {
      key: "lastName",
      header: "Last Name",
      render: row => row.lastName || "—",
    },
    {
      key: "email",
      header: "Email",
      render: row => row.email || "—",
    },
    {
      key: "username",
      header: "User Name",
      render: row => row.username || "—",
    },
    {
      key: "role",
      header: "Role/s",
      render: row => row.role || "User",
    },
    {
      key: "createdAt",
      header: "Created At",
      render: row => formatDate(row.createdAt),
    },
    {
      key: "status",
      header: "Status",
      render: row => <StatusBadge value={row.status || "ACTIVE"} />,
    },
  ];

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <DataTable columns={columns} data={users} loading={loading} />
    </div>
  );
}

export default UsersPage;
