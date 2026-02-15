import { useEffect, useMemo, useState } from "react";
import { apiClient } from "../api/apiClient";

export function DashboardPage() {
  const [canteen, setCanteen] = useState(null);
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cart, setCart] = useState({});
  const [ratingByOrder, setRatingByOrder] = useState({});
  const [editByOrder, setEditByOrder] = useState({});

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [canteenRes, menuRes, ordersRes] = await Promise.all([
        apiClient.get("/canteen/active"),
        apiClient.get("/menu?available=true"),
        apiClient.get("/orders/my")
      ]);
      setCanteen(canteenRes.data.profile);
      setMenu(menuRes.data.items);
      setOrders(ordersRes.data.orders);
    } catch (err) {
      setError(err.response?.data?.message || "Failed loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([menuItemId, qty]) => ({ menuItemId, qty: Number(qty) }));
  }, [cart]);

  const placeOrder = async () => {
    if (!cartItems.length) return;
    try {
      await apiClient.post("/orders", { items: cartItems, paymentMethod: "PAY_AT_CANTEEN" });
      setCart({});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to place order");
    }
  };

  const cancelOrder = async (id) => {
    await apiClient.patch(`/orders/${id}/cancel`);
    await load();
  };

  const saveOrderEdit = async (orderId) => {
    const editItems = editByOrder[orderId];
    if (!Array.isArray(editItems) || editItems.length === 0) return;
    await apiClient.put(`/orders/${orderId}`, {
      items: editItems.map((x) => ({ menuItemId: x.menuItemId, qty: Number(x.qty) || 1 }))
    });
    await load();
  };

  const submitRating = async (orderId) => {
    const payload = ratingByOrder[orderId];
    if (!payload?.rating) return;
    await apiClient.post("/ratings", {
      orderId,
      rating: Number(payload.rating),
      comment: payload.comment || ""
    });
    setRatingByOrder((prev) => ({ ...prev, [orderId]: { rating: "", comment: "" } }));
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
        <h1 className="text-2xl font-bold">{canteen?.name || "Cafe Roma"} - User Portal</h1>
        <button className="rounded bg-slate-700 px-3 py-2 text-white" onClick={logout}>Logout</button>
      </div>
      {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

      <section className="mb-8 rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Menu</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {menu.map((item) => (
            <div key={item._id} className="rounded border p-3">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-slate-600">{item.description}</p>
              <p className="text-sm">Rs. {item.price}</p>
              <input
                className="mt-2 w-24 rounded border p-1"
                type="number"
                min="0"
                value={cart[item._id] || ""}
                onChange={(e) => setCart((prev) => ({ ...prev, [item._id]: e.target.value }))}
                placeholder="Qty"
              />
            </div>
          ))}
        </div>
        <button className="mt-4 rounded bg-blue-600 px-4 py-2 text-white" onClick={placeOrder}>
          Place Order (Pay at Canteen)
        </button>
      </section>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">My Orders</h2>
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order._id} className="rounded border p-3">
              <p className="font-semibold">Status: {order.status}</p>
              <p className="text-sm">Total: Rs. {order.total}</p>
              <ul className="list-disc pl-6 text-sm">
                {order.items.map((it, idx) => (
                  <li key={idx}>{it.nameSnapshot} x {it.qty}</li>
                ))}
              </ul>
              {order.status === "PLACED" ? (
                <div className="mt-2 space-y-2">
                  <div className="rounded bg-slate-50 p-2">
                    <p className="mb-1 text-sm font-medium">Edit order items</p>
                    {(editByOrder[order._id] || order.items).map((it, idx) => (
                      <div key={idx} className="mb-1 flex items-center gap-2 text-sm">
                        <span className="w-48">{it.nameSnapshot}</span>
                        <input
                          className="w-20 rounded border p-1"
                          type="number"
                          min="1"
                          value={(editByOrder[order._id] || order.items)[idx].qty}
                          onChange={(e) =>
                            setEditByOrder((prev) => {
                              const current = [...(prev[order._id] || order.items)];
                              current[idx] = { ...current[idx], qty: Number(e.target.value || 1) };
                              return { ...prev, [order._id]: current };
                            })
                          }
                        />
                      </div>
                    ))}
                    <button className="rounded bg-blue-600 px-2 py-1 text-white" onClick={() => saveOrderEdit(order._id)}>
                      Save Edit
                    </button>
                  </div>
                  <button className="rounded bg-red-600 px-3 py-1 text-white" onClick={() => cancelOrder(order._id)}>
                    Cancel
                  </button>
                </div>
              ) : null}
              {order.status === "COLLECTED" ? (
                <div className="mt-3 rounded bg-slate-50 p-2">
                  <p className="mb-2 text-sm font-medium">Rate this order</p>
                  <input
                    className="mr-2 w-16 rounded border p-1"
                    type="number"
                    min="1"
                    max="5"
                    value={ratingByOrder[order._id]?.rating || ""}
                    onChange={(e) =>
                      setRatingByOrder((prev) => ({
                        ...prev,
                        [order._id]: { ...(prev[order._id] || {}), rating: e.target.value }
                      }))
                    }
                  />
                  <input
                    className="mr-2 rounded border p-1"
                    placeholder="Comment"
                    value={ratingByOrder[order._id]?.comment || ""}
                    onChange={(e) =>
                      setRatingByOrder((prev) => ({
                        ...prev,
                        [order._id]: { ...(prev[order._id] || {}), comment: e.target.value }
                      }))
                    }
                  />
                  <button className="rounded bg-green-600 px-2 py-1 text-white" onClick={() => submitRating(order._id)}>
                    Submit
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
