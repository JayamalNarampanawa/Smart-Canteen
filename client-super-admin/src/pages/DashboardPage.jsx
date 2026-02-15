import { useEffect, useState } from "react";
import { apiClient } from "../api/apiClient";

export function DashboardPage() {
  const [profile, setProfile] = useState({
    name: "Cafe Roma",
    contactPhone: "",
    email: "",
    locationText: "",
    openHours: ""
  });
  const [canteenAdmins, setCanteenAdmins] = useState([]);
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [analytics, setAnalytics] = useState({ averageRating: 0, totalRatings: 0, latestComments: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [profileRes, adminsRes, analyticsRes] = await Promise.all([
        apiClient.get("/canteen/active"),
        apiClient.get("/users/canteen-admins"),
        apiClient.get("/ratings/analytics/summary")
      ]);
      setProfile(profileRes.data.profile);
      setCanteenAdmins(adminsRes.data.users);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateProfile = async (e) => {
    e.preventDefault();
    await apiClient.put("/canteen/active", profile);
    await load();
  };

  const createCanteenAdmin = async (e) => {
    e.preventDefault();
    await apiClient.post("/users/canteen-admins", adminForm);
    setAdminForm({ name: "", email: "", password: "", phone: "" });
    await load();
  };

  const setAdminStatus = async (id, isActive) => {
    await apiClient.patch(`/users/${id}/status`, { isActive });
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
        <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        <button className="rounded bg-slate-700 px-3 py-2 text-white" onClick={logout}>Logout</button>
      </div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      <section className="mb-8 rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Canteen Profile</h2>
        <form className="grid gap-2 md:grid-cols-2" onSubmit={updateProfile}>
          <input className="rounded border p-2" placeholder="Name" value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <input className="rounded border p-2" placeholder="Phone" value={profile.contactPhone || ""} onChange={(e) => setProfile({ ...profile, contactPhone: e.target.value })} />
          <input className="rounded border p-2" placeholder="Email" value={profile.email || ""} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <input className="rounded border p-2" placeholder="Open Hours" value={profile.openHours || ""} onChange={(e) => setProfile({ ...profile, openHours: e.target.value })} />
          <input className="rounded border p-2 md:col-span-2" placeholder="Location" value={profile.locationText || ""} onChange={(e) => setProfile({ ...profile, locationText: e.target.value })} />
          <button className="rounded bg-blue-700 p-2 text-white md:col-span-2">Save Profile</button>
        </form>
      </section>

      <section className="mb-8 rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Manage Canteen Admins</h2>
        <form className="mb-4 grid gap-2 md:grid-cols-4" onSubmit={createCanteenAdmin}>
          <input className="rounded border p-2" placeholder="Name" value={adminForm.name} onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })} />
          <input className="rounded border p-2" placeholder="Email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} />
          <input className="rounded border p-2" placeholder="Password" type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} />
          <input className="rounded border p-2" placeholder="Phone" value={adminForm.phone} onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })} />
          <button className="rounded bg-green-600 p-2 text-white md:col-span-4">Create Canteen Admin</button>
        </form>
        <div className="space-y-2">
          {canteenAdmins.map((admin) => (
            <div key={admin._id} className="flex flex-wrap items-center justify-between rounded border p-2">
              <p>{admin.name} ({admin.email}) - {admin.isActive ? "Active" : "Disabled"}</p>
              <button
                className={`rounded px-2 py-1 text-sm text-white ${admin.isActive ? "bg-red-600" : "bg-blue-700"}`}
                onClick={() => setAdminStatus(admin._id, !admin.isActive)}
              >
                {admin.isActive ? "Disable" : "Enable"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded bg-white p-4 shadow">
        <h2 className="mb-3 text-lg font-semibold">Satisfaction Analytics</h2>
        <p>Average rating: {Number(analytics.averageRating || 0).toFixed(2)} / 5</p>
        <p>Total ratings: {analytics.totalRatings || 0}</p>
        <h3 className="mt-3 font-semibold">Latest Comments</h3>
        <ul className="list-disc pl-6">
          {(analytics.latestComments || []).map((item) => (
            <li key={item._id}>
              {item.comment} ({item.rating}/5)
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

