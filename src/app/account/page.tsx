"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState, useEffect, startTransition } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  address: string;
  zipCode: string;
  region: string;
  city: string;
  street: string;
  building: string;
  apartment: string;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  const d = digits.startsWith("8") ? "7" + digits.slice(1) : digits.startsWith("7") ? digits : "7" + digits;
  let result = "+7";
  if (d.length > 1) result += " (" + d.slice(1, 4);
  if (d.length >= 4) result += ")";
  if (d.length > 4) result += " " + d.slice(4, 7);
  if (d.length > 7) result += "-" + d.slice(7, 9);
  if (d.length > 9) result += "-" + d.slice(9, 11);
  return result;
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
  trackNumber?: string;
  trackUrl?: string;
  promoCode?: string;
  discount?: number;
}

const statusLabels: Record<string, string> = {
  new: "Новый",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export default function AccountPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<"login" | "register">("login");
  const [activeSection, setActiveSection] = useState<"profile" | "orders">("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState({ email: "", password: "" });
  const [editForm, setEditForm] = useState({ name: "", lastName: "", phone: "", address: "", email: "", zipCode: "", region: "", city: "", street: "", building: "", apartment: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetStep, setResetStep] = useState<"email" | "code">("email");
  const [verifyStep, setVerifyStep] = useState<"form" | "code">("form");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: string; senderRole: string; text: string; createdAt: string }[]>([]);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);

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
        setEditForm({ name: data.name || "", lastName: data.lastName || "", phone: data.phone || "", address: data.address || "", email: data.email || "", zipCode: data.zipCode || "", region: data.region || "", city: data.city || "", street: data.street || "", building: data.building || "", apartment: data.apartment || "" });
      }))
      .catch(() => { localStorage.removeItem("userToken"); startTransition(() => setToken(null)); });

    fetch("/api/user/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => startTransition(() => setOrders(data)));
  }, [token]);

  const handleAuth = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Заполните все поля"); return; }
    if (tab === "register" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Некорректный email — нужен символ @"); return;
    }
    if (tab === "register" && form.password.length < 6) {
      setError("Пароль должен быть минимум 6 символов"); return;
    }
    if (tab === "login") {
      // Try admin auth first
      const adminRes = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.email, password: form.password }),
      });
      if (adminRes.ok) {
        const adminData = await adminRes.json();
        localStorage.setItem("admin_token", adminData.token);
        router.push("/admin");
        return;
      }
      // Then try user auth
      const res = await fetch("/api/user/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Неверный логин или пароль"); return; }
      localStorage.setItem("userToken", data.token);
      setToken(data.token);
      setForm({ email: "", password: "" });
    } else {
      // Register — send verification code first
      setVerifyLoading(true);
      const res = await fetch("/api/user/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send-code", email: form.email }),
      });
      const data = await res.json();
      setVerifyLoading(false);
      if (!res.ok) { setError(data.error || "Ошибка отправки кода"); return; }
      setVerifyStep("code");
      setSuccess("Код подтверждения отправлен на " + form.email);
    }
  };

  const handleVerifyAndRegister = async () => {
    setError(""); setSuccess("");
    if (!verifyCode || verifyCode.length !== 6) { setError("Введите 6-значный код"); return; }

    const verifyRes = await fetch("/api/user/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify-code", email: form.email, code: verifyCode, password: form.password }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyRes.ok) { setError(verifyData.error); return; }

    const res = await fetch("/api/user/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "register", email: form.email, password: form.password, verified: true }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); return; }
    localStorage.setItem("userToken", data.token);
    setToken(data.token);
    setForm({ email: "", password: "" });
    setVerifyCode("");
    setVerifyStep("form");
  };

  const handleUpdateProfile = async () => {
    setSuccess(""); setError("");
    if (editForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
      setError("Некорректный формат email (нужен символ @)"); return;
    }
    if (editForm.phone && editForm.phone !== "+7") {
      const phoneDigits = editForm.phone.replace(/\D/g, "");
      if (phoneDigits.length < 11) {
        setError("Введите полный номер телефона (+7 и 10 цифр)"); return;
      }
    }
    if (editForm.zipCode && !/^\d{6}$/.test(editForm.zipCode)) {
      setError("Почтовый индекс должен содержать 6 цифр"); return;
    }
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(editForm),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(data);
      setSuccess("Профиль обновлён");
      setTimeout(() => setSuccess(""), 3000);
    } else {
      setError(data.error || "Ошибка обновления");
    }
  };

  const handleChangePassword = async () => {
    setPasswordMsg(null);
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordMsg({ type: "error", text: "Заполните оба поля пароля" }); return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Новый пароль должен быть минимум 6 символов" }); return;
    }
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(passwordForm),
    });
    const data = await res.json();
    if (res.ok) {
      setPasswordForm({ currentPassword: "", newPassword: "" });
      setPasswordMsg({ type: "success", text: "Пароль успешно изменён!" });
      setTimeout(() => setPasswordMsg(null), 5000);
    } else {
      setPasswordMsg({ type: "error", text: data.error || "Ошибка смены пароля" });
    }
  };

  const handleResetRequest = async () => {
    setError(""); setSuccess("");
    if (!resetEmail) { setError("Укажите email"); return; }
    const res = await fetch("/api/user/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", email: resetEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setResetStep("code");
      if (data.resetToken) setResetToken(data.resetToken);
      setSuccess("Код восстановления сгенерирован");
    } else {
      setError(data.error || "Ошибка");
    }
  };

  const handleResetPassword = async () => {
    setError(""); setSuccess("");
    if (!resetToken || !resetNewPassword) { setError("Заполните все поля"); return; }
    const res = await fetch("/api/user/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", token: resetToken, newPassword: resetNewPassword }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess("Пароль успешно изменён! Войдите с новым паролем.");
      setResetMode(false);
      setResetStep("email");
      setResetEmail("");
      setResetToken("");
      setResetNewPassword("");
    } else {
      setError(data.error || "Ошибка");
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
        <main className="flex-1 relative min-h-[80vh] flex items-center justify-center overflow-hidden">
          {/* Blurred store background */}
          <div className="absolute inset-0 bg-[url('/slider/slide1.svg')] bg-cover bg-center" style={{ filter: "blur(65px)" }} />
          <div className="absolute inset-0 bg-primary/30" />

          {/* Login card with glass effect */}
          <div className="relative z-10 w-full max-w-md mx-4 animate-fade-in-up">
            {/* Logo */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg font-heading">TH</span>
                </div>
                <span className="text-white text-2xl font-bold font-heading">ТОПХИТ</span>
              </div>
              <p className="text-white/70 text-sm">
                {resetMode ? "Восстановление доступа к аккаунту" : "Войдите для управления заказами и избранным"}
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 sm:p-8 shadow-2xl">
              {resetMode ? (
                <>
                  {error && <div className="bg-danger/20 border border-danger/30 text-white text-sm rounded-lg px-4 py-2.5 mb-4 animate-fade-in">{error}</div>}
                  {success && <div className="bg-success/20 border border-success/30 text-white text-sm rounded-lg px-4 py-2.5 mb-4 animate-fade-in">{success}</div>}
                  {resetStep === "email" ? (
                    <>
                      <p className="text-sm text-white/80 mb-4">Введите email, указанный при регистрации</p>
                      <div className="relative mb-4">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <input type="email" placeholder="Email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all" />
                      </div>
                      <button onClick={handleResetRequest}
                        className="w-full bg-white text-primary py-3 rounded-xl hover:bg-white/90 transition-all font-medium shadow-lg hover:shadow-xl active:scale-[0.98]">
                        Получить код
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-white/80 mb-4">Введите код восстановления и новый пароль</p>
                      <input type="text" placeholder="Код восстановления" value={resetToken} onChange={(e) => setResetToken(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-3 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all" />
                      <input type="password" placeholder="Новый пароль (мин. 6 символов)" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all" />
                      <button onClick={handleResetPassword}
                        className="w-full bg-white text-primary py-3 rounded-xl hover:bg-white/90 transition-all font-medium shadow-lg hover:shadow-xl active:scale-[0.98]">
                        Сменить пароль
                      </button>
                    </>
                  )}
                  <button onClick={() => { setResetMode(false); setError(""); setSuccess(""); setResetStep("email"); }}
                    className="w-full text-sm text-white/70 hover:text-white mt-4 text-center transition-colors">
                    ← Вернуться ко входу
                  </button>
                </>
              ) : (
                <>
                  {/* Tabs */}
                  <div className="flex mb-6 bg-white/10 rounded-xl p-1">
                    <button onClick={() => setTab("login")}
                      className={`flex-1 py-2.5 text-center font-medium rounded-lg text-sm transition-all duration-300 ${
                        tab === "login" ? "bg-white text-primary shadow-md" : "text-white/70 hover:text-white"
                      }`}>
                      Вход
                    </button>
                    <button onClick={() => setTab("register")}
                      className={`flex-1 py-2.5 text-center font-medium rounded-lg text-sm transition-all duration-300 ${
                        tab === "register" ? "bg-white text-primary shadow-md" : "text-white/70 hover:text-white"
                      }`}>
                      Регистрация
                    </button>
                  </div>

                  {error && <div className="bg-danger/20 border border-danger/30 text-white text-sm rounded-lg px-4 py-2.5 mb-4 animate-fade-in">{error}</div>}
                  {success && <div className="bg-success/20 border border-success/30 text-white text-sm rounded-lg px-4 py-2.5 mb-4 animate-fade-in">{success}</div>}

                  {tab === "register" && verifyStep === "code" ? (
                    <div className="animate-fade-in">
                      <p className="text-sm text-white/80 mb-3">Введите код подтверждения, отправленный на <span className="font-medium text-white">{form.email}</span></p>
                      <input type="text" placeholder="000000" value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 mb-4 text-white placeholder-white/30 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 text-center text-2xl tracking-[0.5em] font-mono transition-all" />
                      <button onClick={handleVerifyAndRegister}
                        className="w-full bg-white text-primary py-3 rounded-xl hover:bg-white/90 transition-all font-medium shadow-lg hover:shadow-xl active:scale-[0.98]">
                        Подтвердить и зарегистрироваться
                      </button>
                      <button onClick={() => { setVerifyStep("form"); setVerifyCode(""); setError(""); setSuccess(""); }}
                        className="w-full text-sm text-white/70 hover:text-white mt-3 text-center transition-colors">
                        Изменить email
                      </button>
                      <button onClick={handleAuth} className="w-full text-sm text-white/50 hover:text-white/80 mt-2 text-center transition-colors">
                        Отправить код повторно
                      </button>
                    </div>
                  ) : (
                    <div className="animate-fade-in">
                      <div className="relative mb-3">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <input type="text" placeholder={tab === "login" ? "Email или Логин" : "Email"} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all" />
                      </div>
                      <div className="relative mb-4">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <input type="password" placeholder="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 pl-10 text-white placeholder-white/40 focus:outline-none focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-all" />
                      </div>
                      <button onClick={handleAuth} disabled={verifyLoading}
                        className="w-full bg-white text-primary py-3 rounded-xl hover:bg-white/90 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-[0.98]">
                        {verifyLoading ? "Отправка кода..." : tab === "login" ? "Войти" : "Зарегистрироваться"}
                      </button>
                      {tab === "login" && (
                        <>
                          <button onClick={() => { setResetMode(true); setError(""); setSuccess(""); }}
                            className="w-full text-sm text-white/70 hover:text-white mt-4 text-center transition-colors">
                            Забыли пароль?
                          </button>
                          <p className="text-xs text-white/40 text-center mt-2">Используйте email для клиентов или логин для администраторов</p>
                        </>
                      )}
                      {tab === "register" && (
                        <p className="text-xs text-white/50 text-center mt-3">На ваш email будет отправлен код подтверждения</p>
                      )}
                    </div>
                  )}
                </>
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
            <div className="space-y-6">
              <div className="bg-bg-white rounded-xl border border-border p-5 sm:p-6">
                <h2 className="text-lg font-bold text-text-dark mb-4">Личные данные</h2>
                {success && <p className="text-success text-sm mb-4">{success}</p>}
                {error && <p className="text-danger text-sm mb-4">{error}</p>}

                <h3 className="text-sm font-semibold text-text-dark mb-3 mt-2">1. Основная информация</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Имя</label>
                    <input type="text" placeholder="Введите имя" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Фамилия</label>
                    <input type="text" placeholder="Введите фамилию" value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm text-text-gray mb-1 block">Электронная почта</label>
                    <input type="email" placeholder="example@mail.ru" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                    <p className="text-xs text-text-gray mt-1">Должен содержать символ @ и домен</p>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-text-dark mb-3">2. Контактный телефон</h3>
                <div className="mb-5">
                  <label className="text-sm text-text-gray mb-1 block">Номер телефона</label>
                  <input type="tel" placeholder="+7 (___) ___-__-__"
                    value={editForm.phone}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw.length < 3) {
                        setEditForm({ ...editForm, phone: "" });
                        return;
                      }
                      setEditForm({ ...editForm, phone: formatPhone(raw) });
                    }}
                    onFocus={(e) => { if (!e.target.value) setEditForm({ ...editForm, phone: "+7" }); }}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary max-w-sm" />
                </div>

                <h3 className="text-sm font-semibold text-text-dark mb-3">3. Адрес доставки</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Почтовый индекс</label>
                    <input type="text" placeholder="101000" value={editForm.zipCode}
                      onChange={(e) => setEditForm({ ...editForm, zipCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Регион / Область</label>
                    <input type="text" placeholder="г. Москва" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Город / Населённый пункт</label>
                    <input type="text" placeholder="г. Видное" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Улица</label>
                    <input type="text" placeholder="ул. Ленина" value={editForm.street} onChange={(e) => setEditForm({ ...editForm, street: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Дом / Корпус / Строение</label>
                    <input type="text" placeholder="д. 12, корп. 2" value={editForm.building} onChange={(e) => setEditForm({ ...editForm, building: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Квартира / Офис</label>
                    <input type="text" placeholder="кв. 45" value={editForm.apartment} onChange={(e) => setEditForm({ ...editForm, apartment: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <button onClick={handleUpdateProfile} className="mt-5 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors font-medium">Сохранить</button>
              </div>

              <div className="bg-bg-white rounded-xl border border-border p-5 sm:p-6">
                <h2 className="text-lg font-bold text-text-dark mb-4">Сменить пароль</h2>
                {passwordMsg && (
                  <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${passwordMsg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {passwordMsg.text}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Текущий пароль</label>
                    <input type="password" placeholder="Текущий пароль" value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Новый пароль</label>
                    <input type="password" placeholder="Минимум 6 символов" value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                  </div>
                </div>
                <button onClick={handleChangePassword} className="mt-4 bg-primary text-white px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors font-medium">Сменить пароль</button>
              </div>
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
                  {/* Tracking info */}
                  {order.trackNumber && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-text-gray">Трек-номер:</span>
                        {order.trackUrl ? (
                          <a href={order.trackUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                            {order.trackNumber}
                          </a>
                        ) : (
                          <span className="text-text-dark font-medium">{order.trackNumber}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Promo/discount info */}
                  {order.promoCode && order.discount && order.discount > 0 && (
                    <div className="mt-2 text-xs text-success">
                      Промокод «{order.promoCode}» — скидка {order.discount.toLocaleString("ru-RU")} ₽
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">Итого: <span className="text-primary">{order.total.toLocaleString("ru-RU")} ₽</span></span>
                    </div>
                    <button onClick={() => {
                      if (openChat === order.id) { setOpenChat(null); return; }
                      setOpenChat(order.id);
                      setChatText("");
                      fetch(`/api/user/messages?orderId=${order.id}`, { headers: { Authorization: `Bearer ${token}` } })
                        .then(r => r.ok ? r.json() : []).then(d => setChatMessages(d));
                    }} className={`text-sm px-3 py-1 rounded-lg border ${openChat === order.id ? "bg-primary text-white border-primary" : "border-border text-text-gray hover:text-primary"}`}>
                      Написать менеджеру
                    </button>
                  </div>
                  {openChat === order.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                        {chatMessages.length === 0 && <p className="text-xs text-text-gray italic">Нет сообщений</p>}
                        {chatMessages.map((msg) => (
                          <div key={msg.id} className={`text-sm p-2 rounded-lg max-w-[80%] ${msg.senderRole === "user" ? "bg-primary/10 text-primary ml-auto" : "bg-bg-light border border-border"}`}>
                            <p className="text-xs text-text-gray mb-0.5">{msg.senderRole === "user" ? "Вы" : "Менеджер"} — {new Date(msg.createdAt).toLocaleString("ru-RU")}</p>
                            <p>{msg.text}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input type="text" value={chatText} onChange={(e) => setChatText(e.target.value)} placeholder="Ваше сообщение..."
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && chatText.trim()) {
                              setChatSending(true);
                              fetch("/api/user/messages", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId: order.id, text: chatText.trim() }) })
                                .then(() => { setChatText(""); setChatSending(false); return fetch(`/api/user/messages?orderId=${order.id}`, { headers: { Authorization: `Bearer ${token}` } }); })
                                .then(r => r.ok ? r.json() : []).then(d => setChatMessages(d));
                            }
                          }}
                          className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                        <button onClick={() => {
                          if (!chatText.trim()) return;
                          setChatSending(true);
                          fetch("/api/user/messages", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ orderId: order.id, text: chatText.trim() }) })
                            .then(() => { setChatText(""); setChatSending(false); return fetch(`/api/user/messages?orderId=${order.id}`, { headers: { Authorization: `Bearer ${token}` } }); })
                            .then(r => r.ok ? r.json() : []).then(d => setChatMessages(d));
                        }} disabled={chatSending || !chatText.trim()}
                          className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50">
                          {chatSending ? "..." : "Отправить"}
                        </button>
                      </div>
                    </div>
                  )}
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
