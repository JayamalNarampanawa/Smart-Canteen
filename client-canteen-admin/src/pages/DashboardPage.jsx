import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

const NEXT_ACTIONS = {
  PLACED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["PREPARING"],
  PREPARING: ["READY"],
  READY: ["COLLECTED"]
};

export function DashboardPage() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [filter, setFilter] = useState("");
  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    price: "",
    category: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [ordersRes, menuRes] = await Promise.all([
        apiClient.get(`/orders${filter ? `?status=${filter}` : ""}`),
        apiClient.get("/menu")
      ]);
      setOrders(ordersRes.data.orders);
      setMenu(menuRes.data.items);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter]);

  const updateStatus = async (orderId, status) => {
    await apiClient.patch(`/orders/${orderId}/status`, { status });
    await load();
  };

  const createMenu = async (e) => {
    e.preventDefault();
    await apiClient.post("/menu", { ...menuForm, price: Number(menuForm.price) });
    setMenuForm({ name: "", description: "", price: "", category: "" });
    await load();
  };

  const toggleAvailability = async (id, isAvailable) => {
    await apiClient.patch(`/menu/${id}/availability`, { isAvailable: !isAvailable });
    await load();
  };

  const deleteMenu = async (id) => {
    await apiClient.delete(`/menu/${id}`);
    await load();
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl p-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Canteen Admin Dashboard</h1>
        <button className="rounded bg-slate-700 px-3 py-2 text-white" onClick={logout}>Logout</button>
      </div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <section className="mb-8 rounded bg-white p-4 shadow">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Orders</h2>
          <select className="rounded border p-2" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="PLACED">PLACED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="PREPARING">PREPARING</option>
            <option value="READY">READY</option>
            <option value="COLLECTED">COLLECTED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="rounded border p-3">
              <p className="font-semibold">Order #{order._id.slice(-6)} - {order.status}</p>
              <p className="text-sm">Student: {order.userId?.studentId || "N/A"} | Phone: {order.userId?.phone || "N/A"}</p>
              <p className="text-sm">Total: Rs. {order.total}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(NEXT_ACTIONS[order.status] || []).map((status) => (
                  <button
                    key={status}
                    className="rounded bg-blue-600 px-2 py-1 text-sm text-white"
                    onClick={() => updateStatus(order._id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Menu Management</h2>
        <form className="mb-4 grid gap-2 md:grid-cols-4" onSubmit={createMenu}>
          <input className="rounded border p-2" placeholder="Name" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} />
          <input className="rounded border p-2" placeholder="Category" value={menuForm.category} onChange={(e) => setMenuForm({ ...menuForm, category: e.target.value })} />
          <input className="rounded border p-2" placeholder="Price" type="number" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} />
          <input className="rounded border p-2" placeholder="Description" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} />
          <button className="rounded bg-green-600 p-2 text-white md:col-span-4">Add Menu Item</button>
        </form>

        <div className="space-y-2">
          {menu.map((item) => (
            <div key={item._id} className="flex flex-wrap items-center justify-between rounded border p-2">
              <p>{item.name} - Rs. {item.price} ({item.isAvailable ? "In stock" : "Out of stock"})</p>
              <div className="flex gap-2">
                <button className="rounded bg-amber-600 px-2 py-1 text-sm text-white" onClick={() => toggleAvailability(item._id, item.isAvailable)}>
                  Toggle Availability
                </button>
                <button className="rounded bg-red-600 px-2 py-1 text-sm text-white" onClick={() => deleteMenu(item._id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

