"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect, startTransition } from "react";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  address: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string };
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  new: "Новый",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export default function AccountPage() {
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [activeSection, setActiveSection] = useState<"profile" | "orders">("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [editForm, setEditForm] = useState({ name: "", lastName: "", phone: "", address: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("userToken");
    if (saved) startTransition(() => setToken(saved));
  }, []);

  useEffect(() => {
    if (!token) return;
    fetch("/api/user/profile", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => startTransition(() => {
        setProfile(data);
        setEditForm({ name: data.name, lastName: data.lastName, phone: data.phone, address: data.address });
      }))
      .catch(() => { localStorage.removeItem("userToken"); startTransition(() => setToken(null)); });

    fetch("/api/user/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => startTransition(() => setOrders(data)));
  }, [token]);

  const handleAuth = async () => {
    setError("");
    const action = tab === "login" ? "login" : "register";
    const res = await fetch("/api/user/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, email: form.email, password: form.password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    localStorage.setItem("userToken", data.token);
    setToken(data.token);
    setForm({ email: "", password: "" });
  };

  const handleUpdateProfile = async () => {
    setSuccess("");
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setSuccess("Профиль обновлён");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const logout = () => {
    localStorage.removeItem("userToken");
    setToken(null);
    setProfile(null);
    setOrders([]);
  };

  if (!token) {
    return (
      <>
        <Header />
        <main className="flex-1 bg-bg-light">
          <div className="max-w-md mx-auto px-4 py-10">
            <h1 className="text-2xl font-bold text-text-dark mb-6 text-center">Личный кабинет</h1>
            <div className="bg-bg-white rounded-xl border border-border p-6">
              <div className="flex mb-6">
                <button onClick={() => setTab("login")} className={`flex-1 py-2 text-center font-medium border-b-2 ${tab === "login" ? "border-primary text-primary" : "border-transparent text-text-gray"}`}>Вход</button>
                <button onClick={() => setTab("register")} className={`flex-1 py-2 text-center font-medium border-b-2 ${tab === "register" ? "border-primary text-primary" : "border-transparent text-text-gray"}`}>Регистрация</button>
              </div>
              {error && <p className="text-danger text-sm mb-4">{error}</p>}
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2.5 mb-3 focus:outline-none focus:border-primary" />
              <input type="password" placeholder="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-border rounded-lg px-4 py-2.5 mb-4 focus:outline-none focus:border-primary" />
              <button onClick={handleAuth} className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark transition-colors font-medium">
                {tab === "login" ? "Войти" : "Зарегистрироваться"}
              </button>
              {tab === "register" && (
                <p className="text-xs text-text-gray text-center mt-3">После регистрации вы сможете заполнить данные профиля в личном кабинете</p>
              )}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-bg-light">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
            <h1 className="text-2xl font-bold text-text-dark">Личный кабинет</h1>
            <button onClick={logout} className="text-sm text-text-gray hover:text-danger transition-colors">Выйти</button>
          </div>

          <div className="flex gap-2 sm:gap-4 mb-6 flex-wrap">
            <button onClick={() => setActiveSection("profile")} className={`px-4 py-2 rounded-lg font-medium text-sm ${activeSection === "profile" ? "bg-primary text-white" : "bg-bg-white border border-border text-text-gray"}`}>Профиль</button>
            <button onClick={() => setActiveSection("orders")} className={`px-4 py-2 rounded-lg font-medium text-sm ${activeSection === "orders" ? "bg-primary text-white" : "bg-bg-white border border-border text-text-gray"}`}>Мои заказы ({orders.length})</button>
          </div>

          {activeSection === "profile" && profile && (
            <div className="bg-bg-white rounded-xl border border-border p-5 sm:p-6">
              <h2 className="text-lg font-bold text-text-dark mb-4">Данные профиля</h2>
              <div className="bg-bg-light rounded-lg p-3 mb-4">
                <p className="text-sm text-text-gray">Email: <span className="text-text-dark font-medium">{profile.email}</span></p>
              </div>
              {success && <p className="text-success text-sm mb-4">{success}</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-text-gray mb-1 block">Имя</label>
                  <input type="text" placeholder="Имя" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm text-text-gray mb-1 block">Фамилия</label>
                  <input type="text" placeholder="Фамилия" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm text-text-gray mb-1 block">Телефон</label>
                  <input type="tel" placeholder="+7 (___) ___-__-__" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-sm text-text-gray mb-1 block">Адрес доставки</label>
                  <textarea placeholder="Город, улица, дом, квартира" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" rows={3} />
                </div>
              </div>
              <button onClick={handleUpdateProfile} className="mt-4 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors font-medium">Сохранить</button>
            </div>
          )}

          {activeSection === "orders" && (
            <div className="space-y-4">
              {orders.length === 0 && <p className="text-text-gray text-center py-8">У вас пока нет заказов</p>}
              {orders.map((order) => (
                <div key={order.id} className="bg-bg-white rounded-xl border border-border p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <span className="font-medium text-text-dark">Заказ #{order.id.slice(0, 8)}</span>
                      <span className="ml-3 text-sm text-text-gray">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</span>
                    </div>
                    <span className={`text-sm px-3 py-1 rounded-full ${order.status === "delivered" ? "bg-success/10 text-success" : order.status === "cancelled" ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}>
                      {statusLabels[order.status] || order.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-text-gray">
                        <span>{item.product.name} × {item.quantity}</span>
                        <span>{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-between font-medium">
                    <span>Итого:</span>
                    <span className="text-primary">{order.total.toLocaleString("ru-RU")} ₽</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
