"use client";

import { useState, useEffect, useRef, useCallback, startTransition } from "react";
import Link from "next/link";
import { useLiveMessages } from "@/components/useLiveMessages";
import { extractYouTubeId } from "@/lib/youtube";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  order: number;
  parentId?: string | null;
  metaTitle?: string;
  metaDescription?: string;
  seoText?: string;
  _count?: { products: number };
}

interface SitePage {
  id?: string;
  slug: string;
  title: string;
  content: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice: number | null;
  image: string;
  image2: string;
  image3: string;
  image4: string;
  inStock: number;
  expirationDate: string;
  brand: string;
  color: string;
  productType: string;
  isFeatured: boolean;
  isWholesale: boolean;
  categoryId: string;
  category?: Category;
  packSize: number | null;
  tags: string;
}

interface ImportRow {
  index: number;
  name: string;
  price: number;
  brand: string;
  category: string;
  inStock: number;
  country: string;
  weight: number | null;
}

interface SliderImage {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  order: number;
  active: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  type: string;
  published: boolean;
  createdAt: string;
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
  name: string;
  phone: string;
  address: string;
  comment: string;
  trackNumber: string;
  trackUrl: string;
  createdAt: string;
  user: { email: string; name: string };
  items: OrderItem[];
}

const statusLabels: Record<string, string> = {
  new: "Новый",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

type TabType = "analytics" | "categories" | "products" | "popular" | "slider" | "presentation" | "news" | "orders" | "chats" | "reviews" | "videos" | "callbacks" | "clients" | "synonyms" | "settings" | "site-editor" | "company";

interface CallbackItem {
  id: string;
  name: string;
  phone: string;
  status: string;
  createdAt: string;
}

interface AnalyticsData {
  period: string;
  data: { date: string; label: string; views: number; unique: number }[];
  totalViews: number;
  totalUniqueVisitors: number;
  topPages: { path: string; views: number }[];
}

interface MsgItem { id: string; senderId: string; senderRole: string; text: string; createdAt: string; }

function OrdersPanel({ orders, statusLabels, updateOrderStatus, deleteOrder, token, fetchData }: {
  orders: Order[]; statusLabels: Record<string, string>;
  updateOrderStatus: (id: string, status: string) => void; deleteOrder: (id: string) => void; token: string; fetchData: () => void;
}) {
  const [openChat, setOpenChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<MsgItem[]>([]);
  const [msgText, setMsgText] = useState("");
  const [sending, setSending] = useState(false);
  const [editingTrack, setEditingTrack] = useState<string | null>(null);
  const [trackNumberInput, setTrackNumberInput] = useState("");
  const [trackUrlInput, setTrackUrlInput] = useState("");
  const [savingTrack, setSavingTrack] = useState(false);

  const loadMessages = async (orderId: string) => {
    const res = await fetch(`/api/admin/messages?orderId=${orderId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setMessages(await res.json());
  };

  const toggleChat = (orderId: string) => {
    if (openChat === orderId) { setOpenChat(null); return; }
    setOpenChat(orderId);
    setMsgText("");
    loadMessages(orderId);
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !openChat) return;
    setSending(true);
    await fetch("/api/admin/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderId: openChat, text: msgText.trim() }),
    });
    setMsgText("");
    setSending(false);
    loadMessages(openChat);
  };

  const startEditTrack = (order: Order) => {
    setEditingTrack(order.id);
    setTrackNumberInput(order.trackNumber || "");
    setTrackUrlInput(order.trackUrl || "");
  };

  const saveTrack = async (orderId: string) => {
    setSavingTrack(true);
    await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: orderId, trackNumber: trackNumberInput.trim(), trackUrl: trackUrlInput.trim() }),
    });
    setSavingTrack(false);
    setEditingTrack(null);
    fetchData();
  };

  return (
    <div className="bg-bg-white rounded-xl border border-border p-5">
      <h2 className="font-bold text-text-dark mb-4">Заказы ({orders.length})</h2>
      {orders.length === 0 ? <p className="text-text-gray text-sm">Заказов пока нет</p> : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="p-4 bg-bg-light rounded-lg">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div>
                  <span className="font-medium text-text-dark">#{order.id.slice(0, 8)}</span>
                  <span className="text-sm text-text-gray ml-2">{new Date(order.createdAt).toLocaleString("ru-RU")}</span>
                  <span className="text-sm text-text-gray ml-2">— {order.user.name} ({order.user.email})</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleChat(order.id)} className={`text-sm px-3 py-1 rounded-lg border ${openChat === order.id ? "bg-primary text-white border-primary" : "border-border text-text-gray hover:text-primary"}`}>
                    💬 Сообщения
                  </button>
                  <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                    className="border border-border rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-primary">
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  {(order.status === "cancelled" || order.status === "delivered") && (
                    <button onClick={() => deleteOrder(order.id)} className="text-sm px-3 py-1 rounded-lg border border-danger text-danger hover:bg-danger hover:text-white transition-colors">
                      Удалить
                    </button>
                  )}
                </div>
              </div>
              <div className="text-sm space-y-1">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-text-gray">
                    <span>{item.product.name} x {item.quantity}</span>
                    <span>{(item.price * item.quantity).toLocaleString("ru-RU")} ₽</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border/50 flex justify-between text-sm">
                <span className="text-text-gray">Адрес: {order.address} | Тел: {order.phone}</span>
                <span className="font-bold text-primary">{order.total.toLocaleString("ru-RU")} ₽</span>
              </div>
              {order.comment && <p className="text-xs text-text-gray mt-1">Комментарий: {order.comment}</p>}

              {/* Tracking section */}
              <div className="mt-2 pt-2 border-t border-border/50">
                {editingTrack === order.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2 items-center">
                      <input type="text" value={trackNumberInput} onChange={(e) => setTrackNumberInput(e.target.value)}
                        placeholder="Трек-номер" className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
                      <input type="text" value={trackUrlInput} onChange={(e) => setTrackUrlInput(e.target.value)}
                        placeholder="Ссылка на отслеживание (необязательно)" className="flex-1 border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveTrack(order.id)} disabled={savingTrack}
                        className="text-sm px-3 py-1 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50">
                        {savingTrack ? "Сохранение..." : "Сохранить трек"}
                      </button>
                      <button onClick={() => setEditingTrack(null)} className="text-sm px-3 py-1 rounded-lg border border-border text-text-gray hover:text-text-dark">
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    {order.trackNumber ? (
                      <>
                        <span className="text-text-gray">Трек:</span>
                        {order.trackUrl ? (
                          <a href={order.trackUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">{order.trackNumber}</a>
                        ) : (
                          <span className="text-text-dark font-medium">{order.trackNumber}</span>
                        )}
                        <button onClick={() => startEditTrack(order)} className="text-xs text-primary hover:underline ml-1">Изменить</button>
                      </>
                    ) : (
                      <button onClick={() => startEditTrack(order)} className="text-sm text-primary hover:underline flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Добавить трек-номер
                      </button>
                    )}
                  </div>
                )}
              </div>

              {openChat === order.id && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
                    {messages.length === 0 && <p className="text-xs text-text-gray italic">Нет сообщений</p>}
                    {messages.map((msg) => (
                      <div key={msg.id} className={`text-sm p-2 rounded-lg max-w-[80%] ${msg.senderRole === "admin" ? "bg-primary/10 text-primary ml-auto" : "bg-bg-white border border-border"}`}>
                        <p className="text-xs text-text-gray mb-0.5">{msg.senderRole === "admin" ? "Вы" : "Клиент"} — {new Date(msg.createdAt).toLocaleString("ru-RU")}</p>
                        <p>{msg.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" value={msgText} onChange={(e) => setMsgText(e.target.value)} placeholder="Написать клиенту..."
                      onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                      className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    <button onClick={sendMessage} disabled={sending || !msgText.trim()}
                      className="bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark disabled:opacity-50">
                      {sending ? "..." : "Отправить"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ChatListItem {
  id: string;
  guestName: string;
  status: string;
  createdAt: string;
  lastMessageAt: string;
  lastMessage: { text: string; senderRole: string; createdAt: string } | null;
  unread: number;
}

function ChatsPanel({ token }: { token: string }) {
  const [view, setView] = useState<"open" | "closed">("open");
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [widgetEnabled, setWidgetEnabled] = useState(true);
  const listRef = useRef<HTMLDivElement | null>(null);

  const loadChats = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/chat?status=${view}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setChats(await res.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token, view]);

  // Список диалогов обновляется автоматически (новые чаты и счётчики).
  useEffect(() => {
    startTransition(() => setLoading(true));
    loadChats();
    const timer = setInterval(loadChats, 4000);
    return () => clearInterval(timer);
  }, [loadChats]);

  // Текущее состояние виджета чата на сайте.
  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data["chat-widget-enabled"]) setWidgetEnabled(data["chat-widget-enabled"].value !== "0");
      })
      .catch(() => {});
  }, []);

  const toggleWidget = async () => {
    const next = !widgetEnabled;
    setWidgetEnabled(next);
    await fetch("/api/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ values: { "chat-widget-enabled": next ? "1" : "0" } }),
    });
  };

  const streamUrl = selectedId ? `/api/admin/chat/stream?chatId=${selectedId}&token=${encodeURIComponent(token)}` : null;
  const listUrl = selectedId ? `/api/admin/chat/messages?chatId=${selectedId}` : null;
  const { messages, upsert, reload } = useLiveMessages({ streamUrl, listUrl, authToken: token });

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const selectedChat = chats.find((c) => c.id === selectedId) || null;

  // Открываем диалог и сразу гасим счётчик непрочитанных (не ждём опроса).
  const selectChat = (id: string) => {
    setSelectedId(id);
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  };

  const sendReply = async () => {
    const trimmed = text.trim();
    if (!trimmed || !selectedId) return;
    setSending(true);
    setText("");
    try {
      const res = await fetch("/api/admin/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chatId: selectedId, text: trimmed }),
      });
      if (res.ok) {
        upsert([await res.json()]);
        loadChats();
      } else {
        setText(trimmed);
        void reload();
      }
    } catch {
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const changeStatus = async (id: string, status: "open" | "closed") => {
    await fetch("/api/admin/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    if (selectedId === id) setSelectedId(null);
    loadChats();
  };

  const deleteChat = async (id: string) => {
    if (!confirm("Удалить диалог со всей историей?")) return;
    await fetch("/api/admin/chat", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    if (selectedId === id) setSelectedId(null);
    loadChats();
  };

  return (
    <div className="bg-bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-bold text-text-dark">Чаты с посетителями</h2>
        <label className="flex items-center gap-2 text-sm text-text-gray cursor-pointer select-none">
          <span>Виджет на сайте</span>
          <button
            type="button"
            onClick={toggleWidget}
            className={`relative w-11 h-6 rounded-full transition-colors ${widgetEnabled ? "bg-success" : "bg-border"}`}
            aria-pressed={widgetEnabled}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${widgetEnabled ? "translate-x-5" : ""}`} />
          </button>
          <span className={widgetEnabled ? "text-success font-medium" : "text-text-light"}>{widgetEnabled ? "Вкл" : "Выкл"}</span>
        </label>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => { setView("open"); setSelectedId(null); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${view === "open" ? "bg-primary text-white border-primary" : "border-border text-text-gray hover:text-text-dark"}`}>
          Активные
        </button>
        <button onClick={() => { setView("closed"); setSelectedId(null); }}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${view === "closed" ? "bg-primary text-white border-primary" : "border-border text-text-gray hover:text-text-dark"}`}>
          История
        </button>
      </div>

      <div className="grid md:grid-cols-[320px_1fr] gap-4 min-h-[420px]">
        {/* Список диалогов */}
        <div className="border border-border rounded-lg overflow-hidden">
          {loading ? (
            <p className="text-text-gray text-sm p-4">Загрузка…</p>
          ) : chats.length === 0 ? (
            <p className="text-text-gray text-sm p-4">{view === "open" ? "Активных диалогов нет" : "История пуста"}</p>
          ) : (
            <div className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {chats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectChat(c.id)}
                  className={`w-full text-left px-3 py-3 hover:bg-bg-light transition-colors ${selectedId === c.id ? "bg-bg-light" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-text-dark truncate">{c.guestName || "Гость"}</span>
                    <span className="text-xs text-text-light shrink-0">
                      {new Date(c.lastMessageAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-text-gray truncate">
                      {c.lastMessage ? `${c.lastMessage.senderRole === "admin" ? "Вы: " : ""}${c.lastMessage.text}` : "Нет сообщений"}
                    </span>
                    {c.unread > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Переписка */}
        <div className="border border-border rounded-lg flex flex-col">
          {!selectedChat ? (
            <div className="flex-1 flex items-center justify-center text-text-gray text-sm p-6 text-center">
              Выберите диалог слева, чтобы прочитать переписку и ответить.
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium text-text-dark">{selectedChat.guestName || "Гость"}</p>
                  <p className="text-xs text-text-light">Начат {new Date(selectedChat.createdAt).toLocaleString("ru-RU")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedChat.status === "open" ? (
                    <button onClick={() => changeStatus(selectedChat.id, "closed")}
                      className="text-xs px-3 py-1 rounded-lg border border-border text-text-gray hover:text-text-dark">
                      В архив
                    </button>
                  ) : (
                    <button onClick={() => changeStatus(selectedChat.id, "open")}
                      className="text-xs px-3 py-1 rounded-lg border border-border text-text-gray hover:text-text-dark">
                      Вернуть в активные
                    </button>
                  )}
                  <button onClick={() => deleteChat(selectedChat.id)}
                    className="text-xs px-3 py-1 rounded-lg border border-danger text-danger hover:bg-danger hover:text-white transition-colors">
                    Удалить
                  </button>
                </div>
              </div>

              <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-bg-light max-h-[420px]">
                {messages.length === 0 && <p className="text-center text-xs text-text-gray italic mt-4">Нет сообщений</p>}
                {messages.map((m) => (
                  <div key={m.id}
                    className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${m.senderRole === "admin" ? "bg-primary text-white ml-auto rounded-br-sm" : "bg-bg-white border border-border text-text-dark rounded-bl-sm"}`}>
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={`text-[10px] mt-1 ${m.senderRole === "admin" ? "text-white/70" : "text-text-light"}`}>
                      {m.senderRole === "admin" ? "Вы" : selectedChat.guestName || "Гость"} — {new Date(m.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-2.5 border-t border-border flex gap-2 bg-bg-white">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Ответить клиенту…"
                  className="flex-1 border border-border rounded-full px-4 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <button onClick={sendReply} disabled={sending || !text.trim()}
                  className="bg-primary hover:bg-primary-dark text-white px-5 rounded-full text-sm disabled:opacity-40">
                  {sending ? "…" : "Отправить"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("categories");
  const [chatUnread, setChatUnread] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [slides, setSlides] = useState<SliderImage[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("");
  const [catOrder, setCatOrder] = useState(0);
  const [catParentId, setCatParentId] = useState("");
  const [catMetaTitle, setCatMetaTitle] = useState("");
  const [uploadingCatIcon, setUploadingCatIcon] = useState(false);
  const [catMetaDesc, setCatMetaDesc] = useState("");
  const [catSeoText, setCatSeoText] = useState("");
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [sitePages, setSitePages] = useState<Record<string, SitePage>>({});
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [pageForm, setPageForm] = useState({ title: "", content: "" });
  const [pageSaveMsg, setPageSaveMsg] = useState("");

  const [prodForm, setProdForm] = useState({
    name: "", description: "", price: "", oldPrice: "", image: "", image2: "", image3: "", image4: "",
    inStock: "0", packSize: "", expirationDate: "", brand: "", color: "", productType: "", categoryId: "", isFeatured: false, isWholesale: false, tags: "",
  });
  const [editingProd, setEditingProd] = useState<Product | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState("");
  const [hideOutOfStock, setHideOutOfStock] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [prodPage, setProdPage] = useState(1);
  const PROD_PER_PAGE = 10;
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [adminSettings, setAdminSettings] = useState({ newUsername: "", currentPassword: "", newPassword: "" });
  const [adminSettingsMsg, setAdminSettingsMsg] = useState("");

  const [slideForm, setSlideForm] = useState({
    title: "", subtitle: "", imageUrl: "", link: "", order: "0", active: true,
  });
  const [editingSlide, setEditingSlide] = useState<SliderImage | null>(null);

  const [newsForm, setNewsForm] = useState({ title: "", excerpt: "", content: "", image: "", type: "article", published: false });
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  const [importStatus, setImportStatus] = useState("");
  const [importPreview, setImportPreview] = useState<ImportRow[]>([]);
  const [importSelected, setImportSelected] = useState<Set<number>>(new Set());
  const [importLoading, setImportLoading] = useState(false);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importColumnMap, setImportColumnMap] = useState<Record<string, string>>({});
  const [importSample, setImportSample] = useState<Record<string, string>[]>([]);
  const [importRawRows, setImportRawRows] = useState<Record<string, string>[]>([]);
  const [importStep, setImportStep] = useState<"idle" | "mapping" | "preview">("idle");

  const hdrs = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    const [catRes, prodRes, slideRes, newsRes, ordersRes, pagesRes] = await Promise.all([
      fetch("/api/admin/categories", { headers: hdrs() }),
      fetch("/api/admin/products", { headers: hdrs() }),
      fetch("/api/admin/slider", { headers: hdrs() }),
      fetch("/api/admin/news", { headers: hdrs() }),
      fetch("/api/admin/orders", { headers: hdrs() }),
      fetch("/api/admin/pages", { headers: hdrs() }),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (prodRes.ok) setProducts(await prodRes.json());
    if (slideRes.ok) setSlides(await slideRes.json());
    if (newsRes.ok) setNews(await newsRes.json());
    if (ordersRes.ok) setOrders(await ordersRes.json());
    if (pagesRes.ok) {
      const pages: SitePage[] = await pagesRes.json();
      const map: Record<string, SitePage> = {};
      for (const p of pages) map[p.slug] = p;
      setSitePages(map);
    }
  }, [token, hdrs]);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) startTransition(() => setToken(saved));
  }, []);

  // Счётчик непрочитанных сообщений в чатах для бейджа на вкладке.
  useEffect(() => {
    if (!token) return;
    let stop = false;
    const loadUnread = async () => {
      try {
        const res = await fetch("/api/admin/chat?status=all", { headers: { Authorization: `Bearer ${token}` } });
        if (!stop && res.ok) {
          const chats: { unread: number }[] = await res.json();
          setChatUnread(chats.reduce((sum, c) => sum + (c.unread || 0), 0));
        }
      } catch {
        /* ignore */
      }
    };
    loadUnread();
    const timer = setInterval(loadUnread, 8000);
    return () => { stop = true; clearInterval(timer); };
  }, [token, activeTab]);

  useEffect(() => {
    startTransition(() => { fetchData(); });
  }, [fetchData]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setToken(data.token);
      localStorage.setItem("admin_token", data.token);
    } else {
      setLoginError(data.error);
    }
  };

  const logout = () => { setToken(""); localStorage.removeItem("admin_token"); };

  // Category CRUD
  const uploadCatIcon = async (file: File) => {
    setUploadingCatIcon(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (res.ok) { const { url } = await res.json(); setCatIcon(url); }
    setUploadingCatIcon(false);
  };

  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCat ? "PUT" : "POST";
    const seoFields = { metaTitle: catMetaTitle, metaDescription: catMetaDesc, seoText: catSeoText };
    const body = editingCat
      ? { id: editingCat.id, name: catName, icon: catIcon, order: catOrder, parentId: catParentId || null, ...seoFields }
      : { name: catName, icon: catIcon, order: catOrder, parentId: catParentId || null, ...seoFields };
    await fetch("/api/admin/categories", { method, headers: hdrs(), body: JSON.stringify(body) });
    setCatName(""); setCatIcon(""); setCatOrder(0); setCatParentId(""); setCatMetaTitle(""); setCatMetaDesc(""); setCatSeoText(""); setEditingCat(null);
    fetchData();
  };

  // Site pages
  const saveSitePage = async (slug: string) => {
    setPageSaveMsg("");
    const res = await fetch("/api/admin/pages", {
      method: "PUT",
      headers: hdrs(),
      body: JSON.stringify({ slug, ...pageForm }),
    });
    if (res.ok) {
      const page = await res.json();
      setSitePages((prev) => ({ ...prev, [slug]: page }));
      setPageSaveMsg("Сохранено");
      setTimeout(() => setPageSaveMsg(""), 3000);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Удалить категорию? Все товары в ней также будут удалены.")) return;
    await fetch("/api/admin/categories", { method: "DELETE", headers: hdrs(), body: JSON.stringify({ id }) });
    fetchData();
  };

  // Product CRUD
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProd ? "PUT" : "POST";
    const body = editingProd ? { id: editingProd.id, ...prodForm } : prodForm;
    await fetch("/api/admin/products", { method, headers: hdrs(), body: JSON.stringify(body) });
    setProdForm({ name: "", description: "", price: "", oldPrice: "", image: "", image2: "", image3: "", image4: "", inStock: "0", packSize: "", expirationDate: "", brand: "", color: "", productType: "", categoryId: "", isFeatured: false, isWholesale: false, tags: "" });
    setEditingProd(null); fetchData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    await fetch("/api/admin/products", { method: "DELETE", headers: hdrs(), body: JSON.stringify({ id }) });
    setSelectedProducts((prev) => { const next = new Set(prev); next.delete(id); return next; });
    fetchData();
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProducts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllProducts = () => {
    const visible = paginatedProducts;
    const allSelected = visible.every((p) => selectedProducts.has(p.id));
    if (allSelected && visible.length > 0) {
      const next = new Set(selectedProducts);
      visible.forEach((p) => next.delete(p.id));
      setSelectedProducts(next);
    } else {
      const next = new Set(selectedProducts);
      visible.forEach((p) => next.add(p.id));
      setSelectedProducts(next);
    }
  };

  const bulkDeleteProducts = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`Удалить ${selectedProducts.size} товар(ов)?`)) return;
    await fetch("/api/admin/products", {
      method: "DELETE",
      headers: hdrs(),
      body: JSON.stringify({ ids: Array.from(selectedProducts) }),
    });
    setSelectedProducts(new Set());
    fetchData();
  };

  const bulkAssignCategory = async () => {
    if (selectedProducts.size === 0 || !bulkCategoryId) return;
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: hdrs(),
      body: JSON.stringify({ ids: Array.from(selectedProducts), categoryId: bulkCategoryId }),
    });
    setSelectedProducts(new Set());
    setBulkCategoryId("");
    fetchData();
  };

  const exportProducts = async () => {
    if (selectedProducts.size === 0) return;
    const res = await fetch("/api/admin/export", {
      method: "POST",
      headers: hdrs(),
      body: JSON.stringify({ ids: Array.from(selectedProducts) }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportNoTags = async () => {
    const res = await fetch("/api/admin/export", {
      method: "POST",
      headers: hdrs(),
      body: JSON.stringify({ filter: "no-tags" }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Ошибка экспорта");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `products_no_tags_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const bulkSetStock = async (stock: number) => {
    if (!confirm(`Установить остаток ${stock.toLocaleString()} на ВСЕ товары (${products.length} шт)?`)) return;
    const res = await fetch("/api/admin/products", {
      method: "PUT",
      headers: hdrs(),
      body: JSON.stringify({ bulkStock: stock }),
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Обновлено ${data.updated} товаров`);
      fetchData();
    }
  };

  const uploadImage = async (file: File, field: string) => {
    setUploadingImage(field);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      setProdForm((prev) => ({ ...prev, [field]: data.url }));
    }
    setUploadingImage(null);
  };

  const updateAdminSettings = async () => {
    setAdminSettingsMsg("");
    const res = await fetch("/api/admin/auth", {
      method: "PUT",
      headers: hdrs(),
      body: JSON.stringify(adminSettings),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.token) {
        setToken(data.token);
        localStorage.setItem("admin_token", data.token);
      }
      setAdminSettings({ newUsername: "", currentPassword: "", newPassword: "" });
      setAdminSettingsMsg("Данные обновлены");
      setTimeout(() => setAdminSettingsMsg(""), 3000);
    } else {
      setAdminSettingsMsg(data.error || "Ошибка");
    }
  };

  const filteredProducts = products.filter((p) => {
    if (filterCategory && p.categoryId !== filterCategory) return false;
    if (hideOutOfStock && p.inStock <= 0) return false;
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase()) && !p.brand.toLowerCase().includes(productSearch.toLowerCase())) return false;
    return true;
  });
  const prodTotalPages = Math.ceil(filteredProducts.length / PROD_PER_PAGE);
  const paginatedProducts = filteredProducts.slice((prodPage - 1) * PROD_PER_PAGE, prodPage * PROD_PER_PAGE);

  // Slider CRUD
  const saveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSlide ? "PUT" : "POST";
    const newOrder = editingSlide ? editingSlide.order : (slides.length > 0 ? Math.max(...slides.map((s) => s.order)) + 1 : 0);
    const body = editingSlide
      ? { id: editingSlide.id, ...slideForm, order: editingSlide.order }
      : { ...slideForm, order: newOrder };
    await fetch("/api/admin/slider", { method, headers: hdrs(), body: JSON.stringify(body) });
    setSlideForm({ title: "", subtitle: "", imageUrl: "", link: "", order: "0", active: true });
    setEditingSlide(null); fetchData();
  };

  const deleteSlide = async (id: string) => {
    if (!confirm("Удалить слайд?")) return;
    await fetch("/api/admin/slider", { method: "DELETE", headers: hdrs(), body: JSON.stringify({ id }) });
    fetchData();
  };

  const moveSlide = async (index: number, direction: "up" | "down") => {
    const sorted = [...slides].sort((a, b) => a.order - b.order);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const ids = sorted.map((s) => s.id);
    [ids[index], ids[targetIndex]] = [ids[targetIndex], ids[index]];
    const res = await fetch("/api/admin/slider", { method: "PATCH", headers: hdrs(), body: JSON.stringify({ orderedIds: ids }) });
    if (res.ok) setSlides(await res.json());
  };

  // Target fields for column mapping
  const targetFields: { value: string; label: string }[] = [
    { value: "", label: "— Пропустить —" },
    { value: "name", label: "Название" },
    { value: "category", label: "Категория" },
    { value: "brand", label: "Бренд" },
    { value: "country", label: "Страна" },
    { value: "price", label: "Цена" },
    { value: "weight", label: "Вес (кг)" },
    { value: "inStock", label: "Кол-во" },
    { value: "barcode", label: "Штрихкод" },
    { value: "code", label: "Код/Артикул" },
    { value: "image", label: "Изображение" },
    { value: "volume", label: "Объём" },
    { value: "packSize", label: "Кол-во в упаковке" },
    { value: "expirationDate", label: "Годен до" },
    { value: "description", label: "Описание" },
    { value: "oldPrice", label: "Старая цена" },
    { value: "color", label: "Цвет" },
    { value: "productType", label: "Тип/Вид" },
    { value: "tags", label: "Теги" },
  ];

  // Import — step 1: upload file to server for fast parsing
  const handleImportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportLoading(true);
    setImportStatus("Обработка файла...");
    setImportPreview([]);
    setImportStep("idle");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/import", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setImportStatus("Ошибка: файл слишком большой или сервер не ответил. Попробуйте файл поменьше.");
        setImportLoading(false);
        e.target.value = "";
        return;
      }
      if (!res.ok || !data.headers) {
        setImportStatus(`Ошибка: ${data.error || "Не удалось обработать файл"}`);
        setImportLoading(false);
        e.target.value = "";
        return;
      }

      setImportHeaders(data.headers);
      setImportColumnMap(data.autoMap || {});
      setImportSample(data.sample || []);
      setImportRawRows(data.rows || []);
      setImportStep("mapping");
      setImportStatus(`Найдено ${data.totalRows} товаров`);
    } catch (err) {
      setImportStatus(`Ошибка: ${err instanceof Error ? err.message : "неизвестная ошибка"}`);
    }
    setImportLoading(false);
    e.target.value = "";
  };

  // Import — step 2: apply mapping client-side (no server call)
  const handleImportPreview = () => {
    const preview: ImportRow[] = importRawRows.map((row, i) => {
      const mapped: Record<string, string> = {};
      for (const [sourceCol, targetField] of Object.entries(importColumnMap)) {
        if (targetField && row[sourceCol] !== undefined) {
          mapped[targetField] = row[sourceCol];
        }
      }
      return {
        index: i,
        name: mapped.name || "",
        price: mapped.price ? Number(mapped.price) : 0,
        brand: mapped.brand || "",
        category: mapped.category || "",
        inStock: mapped.inStock ? Number(mapped.inStock) : 0,
        country: mapped.country || "",
        weight: mapped.weight ? Number(mapped.weight) : null,
      };
    });
    setImportPreview(preview);
    const all = new Set<number>(preview.map((r) => r.index));
    setImportSelected(all);
    setImportStep("preview");
  };

  // Import — step 3: send mapped data as JSON (no file re-upload)
  const handleImportSelected = async () => {
    if (importSelected.size === 0) return;
    setImportLoading(true);
    setImportStatus("Импорт...");

    // Apply mapping to selected raw rows and send as JSON
    const products = importRawRows
      .filter((_, i) => importSelected.has(i))
      .map((row) => {
        const mapped: Record<string, string> = {};
        for (const [sourceCol, targetField] of Object.entries(importColumnMap)) {
          if (targetField && row[sourceCol] !== undefined) {
            mapped[targetField] = row[sourceCol];
          }
        }
        return mapped;
      });

    const res = await fetch("/api/admin/import", {
      method: "POST",
      headers: { ...hdrs() },
      body: JSON.stringify({ products }),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      setImportStatus("Ошибка: слишком много товаров для одной загрузки. Разбейте файл на части.");
      setImportLoading(false);
      return;
    }
    setImportLoading(false);
    if (res.ok) {
      setImportStatus(`Новых: ${data.imported}, обновлено: ${data.updated || 0} из ${data.total}`);
      resetImport();
      fetchData();
    } else {
      setImportStatus(`Ошибка: ${data.error}`);
    }
    setTimeout(() => setImportStatus(""), 5000);
  };

  const resetImport = () => {
    setImportPreview([]);
    setImportSelected(new Set());
    setImportHeaders([]);
    setImportColumnMap({});
    setImportSample([]);
    setImportRawRows([]);
    setImportStep("idle");
    setImportStatus("");
  };

  const toggleImportRow = (index: number) => {
    setImportSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleImportAll = () => {
    if (importSelected.size === importPreview.length) {
      setImportSelected(new Set());
    } else {
      setImportSelected(new Set(importPreview.map((r) => r.index)));
    }
  };

  const searchProduct = (name: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(name + " товар описание фото")}&tbm=isch`, "_blank");
  };

  // News CRUD
  const saveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingNews ? "PUT" : "POST";
    const body = editingNews ? { id: editingNews.id, ...newsForm } : newsForm;
    await fetch("/api/admin/news", { method, headers: hdrs(), body: JSON.stringify(body) });
    setNewsForm({ title: "", excerpt: "", content: "", image: "", type: "article", published: false });
    setEditingNews(null); fetchData();
  };

  const deleteNews = async (id: string) => {
    if (!confirm("Удалить новость?")) return;
    await fetch("/api/admin/news", { method: "DELETE", headers: hdrs(), body: JSON.stringify({ id }) });
    fetchData();
  };

  // Order status update
  const updateOrderStatus = async (id: string, status: string) => {
    await fetch("/api/admin/orders", { method: "PUT", headers: hdrs(), body: JSON.stringify({ id, status }) });
    fetchData();
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Удалить заказ? Это действие необратимо.")) return;
    await fetch("/api/admin/orders", { method: "DELETE", headers: hdrs(), body: JSON.stringify({ id }) });
    fetchData();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
        <div className="bg-bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-2xl">Т</span>
            </div>
            <h1 className="text-xl font-bold text-text-dark">Админ-панель ТОПХИТ</h1>
            <p className="text-sm text-text-gray mt-1">Введите данные для входа</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            <input type="text" placeholder="Логин" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
            <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary" />
            {loginError && <p className="text-danger text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors">Войти</button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-primary hover:underline">← На главную</Link>
          </div>
        </div>
      </div>
    );
  }

  const topCategories = categories.filter((c) => !c.parentId);
  const tabLabels: Record<TabType, string> = {
    analytics: "Статистика", categories: "Категории", products: "Товары", popular: "Популярные", slider: "Слайдер", presentation: "Презентация", news: "Новости", orders: `Заказы (${orders.length})`, chats: chatUnread > 0 ? `Чаты (${chatUnread})` : "Чаты", reviews: "Отзывы", videos: "Видео", callbacks: `Заявки на звонок`, clients: "Клиенты", synonyms: "Синонимы поиска", "site-editor": "Редактирование сайта", company: "Сведения о компании", settings: "Настройки",
  };

  return (
    <div className="min-h-screen bg-bg-light">
      <header className="bg-bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">Т</span>
            </div>
            <h1 className="text-lg font-bold text-text-dark">ТОПХИТ — Админ</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-primary hover:underline">На сайт</Link>
            <button onClick={logout} className="text-sm text-danger hover:underline">Выйти</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {(Object.keys(tabLabels) as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === tab ? "bg-primary text-white" : "bg-bg-white text-text-gray hover:text-text-dark border border-border"}`}>
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* Analytics */}
        {activeTab === "analytics" && <AnalyticsPanel token={token} />}

        {/* Categories */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">{editingCat ? "Редактировать" : "Добавить"} категорию</h2>
              <form onSubmit={saveCategory} className="space-y-3">
                <input type="text" placeholder="Название" value={catName} onChange={(e) => setCatName(e.target.value)} required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <div>
                  <label className="text-xs text-text-gray mb-1 block">Изображение категории (256x256)</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="URL или эмодзи (напр. 📦)" value={catIcon} onChange={(e) => setCatIcon(e.target.value)}
                      className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    <label className="px-3 py-2 bg-bg-light border border-border rounded-lg text-sm cursor-pointer hover:bg-primary/5">
                      {uploadingCatIcon ? "..." : "Файл"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadCatIcon(e.target.files[0]); }} />
                    </label>
                  </div>
                  {catIcon && catIcon.startsWith("/") && (
                    <img src={catIcon} alt="Превью" className="mt-2 w-16 h-16 object-cover rounded-lg border border-border" />
                  )}
                </div>
                <select value={catParentId} onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">Корневая категория</option>
                  {topCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" placeholder="Порядок" value={catOrder} onChange={(e) => setCatOrder(Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <div className="border-t border-border pt-3 mt-3">
                  <p className="text-xs text-text-gray mb-2 font-medium">SEO настройки</p>
                  <input type="text" placeholder="Meta Title (для поисковиков)" value={catMetaTitle} onChange={(e) => setCatMetaTitle(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary mb-2" />
                  <input type="text" placeholder="Meta Description" value={catMetaDesc} onChange={(e) => setCatMetaDesc(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary mb-2" />
                  <textarea placeholder="SEO-текст (описание категории)" value={catSeoText} onChange={(e) => setCatSeoText(e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={3} />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg">{editingCat ? "Сохранить" : "Добавить"}</button>
                  {editingCat && <button type="button" onClick={() => { setEditingCat(null); setCatName(""); setCatIcon(""); setCatOrder(0); setCatParentId(""); setCatMetaTitle(""); setCatMetaDesc(""); setCatSeoText(""); }} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg">Отмена</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Все категории ({categories.length})</h2>
              {categories.length === 0 ? <p className="text-text-gray text-sm">Категорий пока нет</p> : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg ${cat.parentId ? "bg-bg-light/50 ml-6 border-l-2 border-primary/20" : "bg-bg-light"}`}>
                      <div className="flex items-center gap-2">
                        {cat.icon && (cat.icon.startsWith("/") || cat.icon.startsWith("http")) ? (
                          <img src={cat.icon} alt="" className="w-8 h-8 object-cover rounded" />
                        ) : (
                          <span className="text-lg">{cat.icon || "📦"}</span>
                        )}
                        <div>
                          <span className="font-medium text-text-dark">{cat.name}</span>
                          {cat.parentId && <span className="text-xs text-primary ml-2">подкатегория</span>}
                          <span className="text-text-light text-sm ml-2">({cat._count?.products || 0} товаров)</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatIcon(cat.icon || ""); setCatOrder(cat.order); setCatParentId(cat.parentId || ""); setCatMetaTitle(cat.metaTitle || ""); setCatMetaDesc(cat.metaDescription || ""); setCatSeoText(cat.seoText || ""); }} className="text-primary hover:underline text-sm">Изменить</button>
                        <button onClick={() => deleteCategory(cat.id)} className="text-danger hover:underline text-sm">Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === "products" && (
          <div className="space-y-6">
            {/* Import section */}
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-3">Импорт товаров</h2>
              <p className="text-sm text-text-gray mb-3">
                Загрузите CSV, XLSX или XLS файл для импорта товаров.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  {importStep !== "idle" ? "Загрузить другой файл" : "Выбрать файл"}
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImportUpload} className="hidden" />
                </label>
                {importStep !== "idle" && (
                  <button onClick={resetImport} className="text-sm text-danger hover:underline">Отмена</button>
                )}
                {importLoading && <span className="text-sm text-text-gray">Загрузка...</span>}
                {importStatus && <span className={`text-sm ${importStatus.startsWith("Ошибка") ? "text-danger" : "text-success"}`}>{importStatus}</span>}
              </div>

              {/* Step 1: Column mapping */}
              {importStep === "mapping" && importHeaders.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-text-dark mb-2">Шаг 1: Настройте соответствие колонок</h3>
                  <p className="text-xs text-text-gray mb-3">Для каждой колонки файла выберите поле товара. Автоматически определённые поля уже выбраны.</p>
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left">Колонка файла</th>
                          <th className="px-3 py-2 text-left">Поле товара</th>
                          <th className="px-3 py-2 text-left">Пример данных</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importHeaders.map((header) => (
                          <tr key={header} className="border-t border-border">
                            <td className="px-3 py-2 font-medium">{header}</td>
                            <td className="px-3 py-2">
                              <select
                                value={importColumnMap[header] || ""}
                                onChange={(e) => setImportColumnMap({ ...importColumnMap, [header]: e.target.value })}
                                className="border border-border rounded px-2 py-1 text-sm w-full max-w-[200px] focus:outline-none focus:border-primary"
                              >
                                {targetFields.map((f) => (
                                  <option key={f.value} value={f.value}>{f.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-3 py-2 text-text-gray text-xs max-w-[200px] truncate">
                              {importSample.map((s, i) => (
                                <span key={i}>{i > 0 && " | "}{s[header] || "—"}</span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleImportPreview}
                      disabled={importLoading || !Object.values(importColumnMap).some((v) => v === "name")}
                      className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                    >
                      Предпросмотр
                    </button>
                    {!Object.values(importColumnMap).some((v) => v === "name") && (
                      <span className="text-xs text-danger self-center">Выберите колонку для &quot;Название&quot;</span>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Preview & select rows */}
              {importStep === "preview" && importPreview.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-text-dark mb-2">Шаг 2: Выберите товары для импорта</h3>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-text-dark">
                      Найдено: {importPreview.length} | Выбрано: {importSelected.size}
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setImportStep("mapping")} className="text-sm text-primary hover:underline">
                        Назад к маппингу
                      </button>
                      <button onClick={toggleImportAll} className="text-sm text-primary hover:underline">
                        {importSelected.size === importPreview.length ? "Снять все" : "Выбрать все"}
                      </button>
                      <button
                        onClick={handleImportSelected}
                        disabled={importSelected.size === 0 || importLoading}
                        className="bg-success hover:bg-green-600 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition-colors"
                      >
                        Импортировать ({importSelected.size})
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left">
                            <input type="checkbox" checked={importSelected.size === importPreview.length} onChange={toggleImportAll} />
                          </th>
                          <th className="px-2 py-2 text-left">Название</th>
                          <th className="px-2 py-2 text-left">Категория</th>
                          <th className="px-2 py-2 text-left">Бренд</th>
                          <th className="px-2 py-2 text-left">Страна</th>
                          <th className="px-2 py-2 text-right">Цена</th>
                          <th className="px-2 py-2 text-right">Вес (кг)</th>
                          <th className="px-2 py-2 text-right">Кол-во</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row) => (
                          <tr
                            key={row.index}
                            className={`border-t border-border hover:bg-gray-50 cursor-pointer ${importSelected.has(row.index) ? "bg-blue-50" : ""}`}
                            onClick={() => toggleImportRow(row.index)}
                          >
                            <td className="px-2 py-1.5">
                              <input type="checkbox" checked={importSelected.has(row.index)} onChange={() => toggleImportRow(row.index)} />
                            </td>
                            <td className="px-2 py-1.5 max-w-[200px] truncate" title={row.name}>{row.name || "—"}</td>
                            <td className="px-2 py-1.5">{row.category || "—"}</td>
                            <td className="px-2 py-1.5">{row.brand || "—"}</td>
                            <td className="px-2 py-1.5">{row.country || "—"}</td>
                            <td className="px-2 py-1.5 text-right">{row.price || "—"}</td>
                            <td className="px-2 py-1.5 text-right">{row.weight ?? "—"}</td>
                            <td className="px-2 py-1.5 text-right">{row.inStock || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">{editingProd ? "Редактировать" : "Добавить"} товар</h2>
              <form onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <input type="text" placeholder="Название *" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} required
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="Цена *" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} required
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="Старая цена" value={prodForm.oldPrice} onChange={(e) => setProdForm({ ...prodForm, oldPrice: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <div className="border border-border rounded-lg px-3 py-2 text-sm">
                  <label className="text-text-gray text-xs block mb-1">Изображение 1 (основное)</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="URL или загрузите файл" value={prodForm.image} onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                      className="flex-1 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary" />
                    <label className="cursor-pointer bg-bg-light hover:bg-gray-200 text-text-gray text-xs px-2 py-1 rounded transition-colors">
                      {uploadingImage === "image" ? "..." : "Файл"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "image"); e.target.value = ""; }} />
                    </label>
                  </div>
                  {prodForm.image && <img src={prodForm.image} alt="" className="mt-1 w-12 h-12 object-cover rounded" />}
                </div>
                <div className="border border-border rounded-lg px-3 py-2 text-sm">
                  <label className="text-text-gray text-xs block mb-1">Изображение 2</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="URL или загрузите файл" value={prodForm.image2} onChange={(e) => setProdForm({ ...prodForm, image2: e.target.value })}
                      className="flex-1 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary" />
                    <label className="cursor-pointer bg-bg-light hover:bg-gray-200 text-text-gray text-xs px-2 py-1 rounded transition-colors">
                      {uploadingImage === "image2" ? "..." : "Файл"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "image2"); e.target.value = ""; }} />
                    </label>
                  </div>
                  {prodForm.image2 && <img src={prodForm.image2} alt="" className="mt-1 w-12 h-12 object-cover rounded" />}
                </div>
                <div className="border border-border rounded-lg px-3 py-2 text-sm">
                  <label className="text-text-gray text-xs block mb-1">Изображение 3</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="URL или загрузите файл" value={prodForm.image3} onChange={(e) => setProdForm({ ...prodForm, image3: e.target.value })}
                      className="flex-1 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary" />
                    <label className="cursor-pointer bg-bg-light hover:bg-gray-200 text-text-gray text-xs px-2 py-1 rounded transition-colors">
                      {uploadingImage === "image3" ? "..." : "Файл"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "image3"); e.target.value = ""; }} />
                    </label>
                  </div>
                  {prodForm.image3 && <img src={prodForm.image3} alt="" className="mt-1 w-12 h-12 object-cover rounded" />}
                </div>
                <div className="border border-border rounded-lg px-3 py-2 text-sm">
                  <label className="text-text-gray text-xs block mb-1">Изображение 4</label>
                  <div className="flex gap-2 items-center">
                    <input type="text" placeholder="URL или загрузите файл" value={prodForm.image4} onChange={(e) => setProdForm({ ...prodForm, image4: e.target.value })}
                      className="flex-1 border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary" />
                    <label className="cursor-pointer bg-bg-light hover:bg-gray-200 text-text-gray text-xs px-2 py-1 rounded transition-colors">
                      {uploadingImage === "image4" ? "..." : "Файл"}
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f, "image4"); e.target.value = ""; }} />
                    </label>
                  </div>
                  {prodForm.image4 && <img src={prodForm.image4} alt="" className="mt-1 w-12 h-12 object-cover rounded" />}
                </div>
                <input type="number" placeholder="В наличии" value={prodForm.inStock} onChange={(e) => setProdForm({ ...prodForm, inStock: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="Кол-во в упаковке" value={prodForm.packSize} onChange={(e) => setProdForm({ ...prodForm, packSize: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Срок годности" value={prodForm.expirationDate} onChange={(e) => setProdForm({ ...prodForm, expirationDate: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Бренд" value={prodForm.brand} onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Цвет" value={prodForm.color} onChange={(e) => setProdForm({ ...prodForm, color: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Тип товара" value={prodForm.productType} onChange={(e) => setProdForm({ ...prodForm, productType: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <select value={prodForm.categoryId} onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })} required
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">Выберите категорию *</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.parentId ? `  └ ${cat.name}` : cat.name}</option>)}
                </select>
                <div className="md:col-span-2 lg:col-span-3 relative">
                  <textarea placeholder="Описание" value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary pr-10" rows={2} />
                  {prodForm.name && (
                    <button type="button" title="Сгенерировать описание через ИИ-поиск" onClick={() => {
                      const query = `Напиши короткое SEO-описание товара "${prodForm.name}" для интернет-магазина, 2-3 предложения`;
                      window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
                    }} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md transition-all hover:scale-110 cursor-pointer">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
                    </button>
                  )}
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <input type="text" placeholder="Теги / ключевые слова (через запятую)" value={prodForm.tags} onChange={(e) => setProdForm({ ...prodForm, tags: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  <p className="text-xs text-text-gray mt-1">Мета-теги для поисковиков. Не видны клиентам на сайте.</p>
                </div>
                <div className="md:col-span-2 lg:col-span-3 flex items-center gap-4">
                  <button type="submit" className="bg-primary hover:bg-primary-dark text-white text-sm px-6 py-2 rounded-lg">{editingProd ? "Сохранить" : "Добавить"}</button>
                  {editingProd && <button type="button" onClick={() => { setEditingProd(null); setProdForm({ name: "", description: "", price: "", oldPrice: "", image: "", image2: "", image3: "", image4: "", inStock: "0", packSize: "", expirationDate: "", brand: "", color: "", productType: "", categoryId: "", isFeatured: false, isWholesale: false, tags: "" }); }} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg">Отмена</button>}
                  <label className="flex items-center gap-2 text-sm cursor-pointer ml-auto border border-yellow-300 bg-yellow-50 rounded-lg px-3 py-2">
                    <input type="checkbox" checked={prodForm.isFeatured} onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })} className="accent-yellow-500 w-4 h-4" />
                    <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span className="text-yellow-700 font-medium">Популярный товар</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer border border-primary/40 bg-primary/5 rounded-lg px-3 py-2">
                    <input type="checkbox" checked={prodForm.isWholesale} onChange={(e) => setProdForm({ ...prodForm, isWholesale: e.target.checked })} className="accent-primary w-4 h-4" />
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    <span className="text-primary font-medium">Оптовый товар</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="font-bold text-text-dark">Все товары ({filteredProducts.length}{filterCategory || hideOutOfStock || productSearch ? ` из ${products.length}` : ""})</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedProducts.size > 0 && (
                    <>
                      <select value={bulkCategoryId} onChange={(e) => setBulkCategoryId(e.target.value)}
                        className="border border-border rounded-lg px-2 py-1.5 text-sm">
                        <option value="">Назначить категорию...</option>
                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                      {bulkCategoryId && (
                        <button onClick={bulkAssignCategory} className="bg-primary hover:bg-primary-dark text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
                          Применить ({selectedProducts.size})
                        </button>
                      )}
                      <button onClick={exportProducts} className="bg-accent hover:bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Выгрузить ({selectedProducts.size})
                      </button>
                      <button onClick={bulkDeleteProducts} className="bg-danger hover:bg-red-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors">
                        Удалить ({selectedProducts.size})
                      </button>
                    </>
                  )}
                  <button onClick={() => bulkSetStock(10000)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1" title="Установить остаток 10 000 на все товары">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    Остаток 10 000
                  </button>
                  {(() => {
                    const noTagsCount = products.filter((p) => !p.tags).length;
                    return noTagsCount > 0 ? (
                      <button onClick={exportNoTags} className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1" title="Скачать товары без мета-тегов">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-white text-orange-600 rounded-full text-xs font-bold">!</span>
                        Без тегов ({noTagsCount})
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="relative">
                  <svg className="w-4 h-4 text-text-gray absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input type="text" value={productSearch} onChange={(e) => { setProductSearch(e.target.value); setProdPage(1); setSelectedProducts(new Set()); }}
                    placeholder="Поиск по названию или бренду..."
                    className="border border-border rounded-lg pl-9 pr-8 py-1.5 text-sm w-64 focus:outline-none focus:border-primary" />
                  {productSearch && <button onClick={() => { setProductSearch(""); setProdPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-gray hover:text-text-dark text-lg">&times;</button>}
                </div>
                <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setProdPage(1); setSelectedProducts(new Set()); }}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm">
                  <option value="">Все категории</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
                <label className="flex items-center gap-1.5 text-sm text-text-gray cursor-pointer">
                  <input type="checkbox" checked={hideOutOfStock} onChange={(e) => { setHideOutOfStock(e.target.checked); setProdPage(1); setSelectedProducts(new Set()); }} className="w-4 h-4 rounded" />
                  Скрыть отсутствующие (0 шт)
                </label>
              </div>
              {filteredProducts.length === 0 ? <p className="text-text-gray text-sm">Товаров не найдено</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="py-2 px-2 w-8">
                        <input type="checkbox" checked={selectedProducts.size === paginatedProducts.length && paginatedProducts.length > 0} onChange={toggleAllProducts} className="w-4 h-4 rounded border-border cursor-pointer" />
                      </th>
                      <th className="text-left py-2 px-2 text-text-gray font-medium w-12">Фото</th>
                      <th className="text-left py-2 px-2 text-text-gray font-medium">Название</th>
                      <th className="text-left py-2 px-2 text-text-gray font-medium">Категория</th>
                      <th className="text-right py-2 px-2 text-text-gray font-medium">Цена</th>
                      <th className="text-right py-2 px-2 text-text-gray font-medium">В наличии</th>
                      <th className="text-right py-2 px-2 text-text-gray font-medium">В упак.</th>
                      <th className="text-left py-2 px-2 text-text-gray font-medium">Годен до</th>
                      <th className="text-right py-2 px-2 text-text-gray font-medium">Действия</th>
                    </tr></thead>
                    <tbody>
                      {paginatedProducts.map((prod) => (
                        <tr key={prod.id} className={`border-b border-border/50 hover:bg-bg-light ${selectedProducts.has(prod.id) ? "bg-blue-50" : ""}`}>
                          <td className="py-2 px-2">
                            <input type="checkbox" checked={selectedProducts.has(prod.id)} onChange={() => toggleProductSelection(prod.id)} className="w-4 h-4 rounded border-border cursor-pointer" />
                          </td>
                          <td className="py-2 px-2">
                            {prod.image ? (
                              <img src={prod.image} alt="" className="w-10 h-10 rounded object-cover border border-border" />
                            ) : (
                              <div className="w-10 h-10 rounded bg-bg-light border border-border flex items-center justify-center text-text-gray text-xs">—</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-text-dark">
                            {prod.isFeatured && <svg className="w-4 h-4 text-yellow-500 inline mr-1" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                            {prod.isWholesale && <svg className="w-4 h-4 text-primary inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><title>Оптовый товар</title><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>}
                            {!prod.tags && <span title="Нет мета-тегов" className="inline-flex items-center justify-center w-4 h-4 bg-orange-100 text-orange-600 rounded-full text-xs font-bold mr-1 cursor-help">!</span>}
                            {prod.name}
                          </td>
                          <td className="py-2 px-2 text-text-gray">{prod.category?.name}</td>
                          <td className="py-2 px-2 text-right font-medium">{prod.price.toLocaleString("ru-RU")} ₽</td>
                          <td className="py-2 px-2 text-right">{prod.inStock}</td>
                          <td className="py-2 px-2 text-right">{prod.packSize || "—"}</td>
                          <td className="py-2 px-2 text-text-gray text-sm">{prod.expirationDate || "—"}</td>
                          <td className="py-2 px-2 text-right whitespace-nowrap">
                            <button onClick={() => searchProduct(prod.name)} className="text-accent hover:underline mr-2" title="Поиск в интернете">
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                            <button onClick={() => { setEditingProd(prod); setProdForm({ name: prod.name, description: prod.description, price: String(prod.price), oldPrice: prod.oldPrice ? String(prod.oldPrice) : "", image: prod.image, image2: prod.image2 || "", image3: prod.image3 || "", image4: prod.image4 || "", inStock: String(prod.inStock), packSize: prod.packSize ? String(prod.packSize) : "", expirationDate: prod.expirationDate || "", brand: prod.brand, color: prod.color, productType: prod.productType, categoryId: prod.categoryId, isFeatured: prod.isFeatured || false, isWholesale: prod.isWholesale || false, tags: prod.tags || "" }); }} className="text-primary hover:underline mr-2">Изменить</button>
                            <button onClick={() => deleteProduct(prod.id)} className="text-danger hover:underline">Удалить</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {prodTotalPages > 1 && (() => {
                const pages: (number | "...")[] = [];
                for (let i = 1; i <= prodTotalPages; i++) {
                  if (i === 1 || i === prodTotalPages || (i >= prodPage - 1 && i <= prodPage + 1)) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== "...") {
                    pages.push("...");
                  }
                }
                return (
                  <div className="flex items-center justify-center gap-1 mt-4 pt-3 border-t border-border">
                    <button onClick={() => setProdPage(p => Math.max(1, p - 1))} disabled={prodPage === 1}
                      className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-light disabled:opacity-40 disabled:cursor-not-allowed">← Назад</button>
                    {pages.map((p, idx) => p === "..." ? (
                      <span key={`dots-${idx}`} className="px-2 py-1.5 text-text-gray text-sm">...</span>
                    ) : (
                      <button key={p} onClick={() => setProdPage(p as number)}
                        className={`w-8 h-8 text-sm rounded-lg ${p === prodPage ? "bg-primary text-white" : "border border-border hover:bg-bg-light text-text-gray"}`}>{p}</button>
                    ))}
                    <button onClick={() => setProdPage(p => Math.min(prodTotalPages, p + 1))} disabled={prodPage === prodTotalPages}
                      className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-bg-light disabled:opacity-40 disabled:cursor-not-allowed">Вперёд →</button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Slider */}
        {activeTab === "slider" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">{editingSlide ? "Редактировать" : "Добавить"} слайд</h2>
              <form onSubmit={saveSlide} className="space-y-3">
                <input type="text" placeholder="Заголовок" value={slideForm.title} onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Подзаголовок" value={slideForm.subtitle} onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="URL изображения" value={slideForm.imageUrl} onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    <label className={`px-3 py-2 border border-border rounded-lg text-sm cursor-pointer transition-colors flex items-center gap-1 ${uploadingImage === "slider" ? "bg-primary/10 text-primary border-primary" : "bg-bg-light text-text-gray hover:text-primary"}`}>
                      {uploadingImage === "slider" ? (
                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Загрузка...</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Файл</>
                      )}
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg" className="hidden" disabled={uploadingImage === "slider"} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) { alert("Максимальный размер файла: 10 МБ"); e.target.value = ""; return; }
                        setUploadingImage("slider");
                        try {
                          const fd = new FormData();
                          fd.append("file", file);
                          const res = await fetch("/api/admin/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
                          if (res.ok) { const data = await res.json(); setSlideForm((prev) => ({ ...prev, imageUrl: data.url })); }
                          else { const text = await res.text(); try { const err = JSON.parse(text); alert(err.error || "Ошибка загрузки"); } catch { alert("Ошибка загрузки изображения. Попробуйте файл меньшего размера."); } }
                        } catch { alert("Ошибка соединения с сервером"); }
                        finally { setUploadingImage(null); e.target.value = ""; }
                      }} />
                    </label>
                  </div>
                  <p className="text-xs text-text-light mt-1">Рекомендуемый размер: 1920×600px. Форматы: JPG, PNG, WEBP, SVG. Макс. 10 МБ</p>
                  {slideForm.imageUrl && (
                    <div className="mt-2 rounded-lg overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={slideForm.imageUrl} alt="Превью" className="w-full h-24 object-cover" />
                    </div>
                  )}
                </div>
                <input type="text" placeholder="Ссылка" value={slideForm.link} onChange={(e) => setSlideForm({ ...slideForm, link: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <label className="flex items-center gap-2 text-sm text-text-gray">
                  <input type="checkbox" checked={slideForm.active} onChange={(e) => setSlideForm({ ...slideForm, active: e.target.checked })} className="accent-primary" /> Активен
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg">{editingSlide ? "Сохранить" : "Добавить"}</button>
                  {editingSlide && <button type="button" onClick={() => { setEditingSlide(null); setSlideForm({ title: "", subtitle: "", imageUrl: "", link: "", order: "0", active: true }); }} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg">Отмена</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Порядок слайдов ({slides.length})</h2>
              <p className="text-xs text-text-gray mb-3">Используйте стрелки для изменения порядка отображения</p>
              {slides.length === 0 ? <p className="text-text-gray text-sm">Слайдов пока нет</p> : (
                <div className="space-y-2">
                  {[...slides].sort((a, b) => a.order - b.order).map((slide, idx) => (
                    <div key={slide.id} className={`flex items-center gap-3 p-3 rounded-lg border ${slide.active ? "bg-bg-light border-border" : "bg-red-50/50 border-red-200/50"}`}>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={() => moveSlide(idx, "up")}
                          disabled={idx === 0}
                          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${idx === 0 ? "text-border cursor-not-allowed" : "text-text-gray hover:bg-primary hover:text-white"}`}
                          title="Вверх"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          onClick={() => moveSlide(idx, "down")}
                          disabled={idx === slides.length - 1}
                          className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${idx === slides.length - 1 ? "text-border cursor-not-allowed" : "text-text-gray hover:bg-primary hover:text-white"}`}
                          title="Вниз"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                      <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</span>
                      <div className="w-20 h-14 bg-border rounded overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slide.imageUrl} alt={slide.title ? `${slide.title} — слайд` : `Слайд ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-dark text-sm truncate">{slide.title || "Без названия"}</p>
                        <p className="text-xs text-text-gray truncate">{slide.subtitle}</p>
                        <span className={`text-xs ${slide.active ? "text-success" : "text-danger"}`}>{slide.active ? "Активен" : "Скрыт"}</span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => { setEditingSlide(slide); setSlideForm({ title: slide.title, subtitle: slide.subtitle, imageUrl: slide.imageUrl, link: slide.link, order: String(slide.order), active: slide.active }); }} className="text-primary hover:underline text-sm">Изменить</button>
                        <button onClick={() => deleteSlide(slide.id)} className="text-danger hover:underline text-sm">Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Presentation */}
        {activeTab === "presentation" && <PresentationPanel token={token} />}

        {/* News */}
        {activeTab === "news" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">{editingNews ? "Редактировать" : "Создать"} новость</h2>
              <form onSubmit={saveNews} className="space-y-3">
                <div>
                  <label className="text-xs text-text-gray mb-1 block">Заголовок *</label>
                  <input type="text" placeholder="Введите заголовок" value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} required
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs text-text-gray mb-1 block">Изображение</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="URL изображения" value={newsForm.image} onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                      className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                    <label className={`px-3 py-2 border border-border rounded-lg text-sm cursor-pointer transition-colors flex items-center gap-1 ${uploadingImage === "news" ? "bg-primary/10 text-primary border-primary" : "bg-bg-light text-text-gray hover:text-primary"}`}>
                      {uploadingImage === "news" ? (
                        <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> ...</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> Файл</>
                      )}
                      <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg" className="hidden" disabled={uploadingImage === "news"} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 10 * 1024 * 1024) { alert("Макс. 10 МБ"); e.target.value = ""; return; }
                        setUploadingImage("news");
                        try {
                          const fd = new FormData(); fd.append("file", file);
                          const res = await fetch("/api/admin/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
                          if (res.ok) { const data = await res.json(); setNewsForm((prev) => ({ ...prev, image: data.url })); }
                          else { alert("Ошибка загрузки"); }
                        } catch { alert("Ошибка соединения"); }
                        finally { setUploadingImage(null); e.target.value = ""; }
                      }} />
                    </label>
                  </div>
                  {newsForm.image && (
                    <div className="mt-2 w-20 h-14 rounded overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={newsForm.image} alt="Превью" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
                <select value={newsForm.type} onChange={(e) => setNewsForm({ ...newsForm, type: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="article">Статья</option>
                  <option value="delivery">Поставка</option>
                </select>
                <div>
                  <label className="text-xs text-text-gray mb-1 block">Краткое описание</label>
                  <textarea placeholder="Короткий текст для карточки новости (1-2 предложения)" value={newsForm.excerpt} onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={2} />
                </div>
                <div>
                  <label className="text-xs text-text-gray mb-1 block">Полный текст</label>
                  <textarea placeholder="Полный текст новости..." value={newsForm.content} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={8} />
                </div>
                <label className="flex items-center gap-2 text-sm text-text-gray">
                  <input type="checkbox" checked={newsForm.published} onChange={(e) => setNewsForm({ ...newsForm, published: e.target.checked })} className="accent-primary" /> Опубликовать
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg">{editingNews ? "Сохранить" : "Создать"}</button>
                  {editingNews && <button type="button" onClick={() => { setEditingNews(null); setNewsForm({ title: "", excerpt: "", content: "", image: "", type: "article", published: false }); }} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg">Отмена</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Все новости ({news.length})</h2>
              {news.length === 0 ? <p className="text-text-gray text-sm">Новостей пока нет</p> : (
                <div className="space-y-3">
                  {news.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-bg-light rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-dark truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-xs text-text-gray">
                          <span>{new Date(item.createdAt).toLocaleDateString("ru-RU")}</span>
                          <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded">{item.type === "delivery" ? "Поставка" : "Статья"}</span>
                          <span className={item.published ? "text-success" : "text-danger"}>{item.published ? "Опубликовано" : "Черновик"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 ml-4">
                        <button onClick={() => { setEditingNews(item); setNewsForm({ title: item.title, excerpt: item.excerpt || "", content: item.content, image: item.image, type: item.type || "article", published: item.published }); }} className="text-primary hover:underline text-sm">Изменить</button>
                        <button onClick={() => deleteNews(item.id)} className="text-danger hover:underline text-sm">Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && (
          <OrdersPanel orders={orders} statusLabels={statusLabels} updateOrderStatus={updateOrderStatus} deleteOrder={deleteOrder} token={token} fetchData={fetchData} />
        )}

        {/* Chats */}
        {activeTab === "chats" && <ChatsPanel token={token} />}

        {/* Reviews */}
        {activeTab === "reviews" && <ReviewsPanel token={token} />}

        {/* Videos — видео с YouTube, прикреплённые к товарам */}
        {activeTab === "videos" && <VideosPanel token={token} />}

        {/* Popular Products */}
        {activeTab === "popular" && (
          <div className="bg-bg-white rounded-xl border border-border p-5">
            <h2 className="font-bold text-text-dark mb-4">Популярные товары (до 8 штук)</h2>
            <p className="text-text-gray text-sm mb-4">Выберите товары, которые будут отображаться на главной странице в разделе «Популярн��е товары».</p>
            <div className="space-y-3 mb-6">
              {products.filter(p => p.isFeatured).length === 0 && <p className="text-text-gray text-sm italic">Пока не выбрано ни одного популярного товара</p>}
              {products.filter(p => p.isFeatured).map((prod) => (
                <div key={prod.id} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <svg className="w-5 h-5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  {prod.image && <img src={prod.image} alt="" className="w-10 h-10 rounded object-cover" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-dark truncate">{prod.name}</p>
                    <p className="text-xs text-text-gray">{prod.price.toLocaleString("ru-RU")} ₽ — {prod.category?.name}</p>
                  </div>
                  <button onClick={async () => {
                    await fetch("/api/admin/products", { method: "PUT", headers: hdrs(), body: JSON.stringify({ id: prod.id, name: prod.name, description: prod.description, price: prod.price, oldPrice: prod.oldPrice, image: prod.image, image2: prod.image2, image3: prod.image3, image4: prod.image4, inStock: prod.inStock, brand: prod.brand, color: prod.color, productType: prod.productType, categoryId: prod.categoryId, isFeatured: false }) });
                    fetchData();
                  }} className="text-danger hover:underline text-sm flex-shrink-0">Убрать</button>
                </div>
              ))}
            </div>
            {products.filter(p => p.isFeatured).length < 8 && (
              <div>
                <h3 className="font-medium text-text-dark text-sm mb-2">Добавить товар ({products.filter(p => p.isFeatured).length}/8)</h3>
                <div className="max-h-64 overflow-y-auto border border-border rounded-lg divide-y divide-border/50">
                  {products.filter(p => !p.isFeatured).map((prod) => (
                    <div key={prod.id} className="flex items-center gap-3 p-2.5 hover:bg-bg-light cursor-pointer" onClick={async () => {
                      if (products.filter(p => p.isFeatured).length >= 8) { alert("Максимум 8 популярных товаров"); return; }
                      await fetch("/api/admin/products", { method: "PUT", headers: hdrs(), body: JSON.stringify({ id: prod.id, name: prod.name, description: prod.description, price: prod.price, oldPrice: prod.oldPrice, image: prod.image, image2: prod.image2, image3: prod.image3, image4: prod.image4, inStock: prod.inStock, brand: prod.brand, color: prod.color, productType: prod.productType, categoryId: prod.categoryId, isFeatured: true }) });
                      fetchData();
                    }}>
                      {prod.image && <img src={prod.image} alt="" className="w-8 h-8 rounded object-cover" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-text-dark truncate">{prod.name}</p>
                        <p className="text-xs text-text-gray">{prod.price.toLocaleString("ru-RU")} ₽</p>
                      </div>
                      <span className="text-primary text-sm">+ Добавить</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Site Editor */}
        {activeTab === "site-editor" && (
          <div className="space-y-6">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Редактирование разделов сайта</h2>
              <p className="text-text-gray text-sm mb-4">Выберите раздел для редактирования. Контент обновится на сайте после сохранения.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { slug: "about", label: "О компании" },
                  { slug: "delivery", label: "Доставка" },
                  { slug: "contacts", label: "Контакты" },
                  { slug: "wholesale", label: "Оптовые продажи" },
                ].map((p) => (
                  <button key={p.slug} onClick={() => {
                    setEditingPage(p.slug);
                    const existing = sitePages[p.slug];
                    setPageForm({ title: existing?.title || "", content: existing?.content || "" });
                    setPageSaveMsg("");
                  }} className={`p-4 rounded-lg border text-left transition-colors ${editingPage === p.slug ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                    <p className="font-medium text-text-dark text-sm">{p.label}</p>
                    <p className="text-xs text-text-gray mt-1">{sitePages[p.slug] ? "Редактировано" : "По умолчанию"}</p>
                  </button>
                ))}
              </div>
            </div>

            {editingPage && (
              <div className="bg-bg-white rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text-dark">
                    Редактирование: {editingPage === "about" ? "О компании" : editingPage === "delivery" ? "Доставка" : editingPage === "contacts" ? "Контакты" : "Оптовые продажи"}
                  </h3>
                  {pageSaveMsg && <span className="text-sm text-success font-medium">{pageSaveMsg}</span>}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Заголовок раздела</label>
                    <input type="text" value={pageForm.title} onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                      placeholder="Заголовок страницы" className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="text-sm text-text-gray mb-1 block">Содержимое (HTML поддерживается)</label>
                    <textarea value={pageForm.content} onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                      placeholder={"Введите текст раздела...\n\nПоддерживается HTML разметка:\n<p>Параграф</p>\n<h3>Подзаголовок</h3>\n<ul><li>Пункт</li></ul>\n<strong>Жирный</strong>"}
                      className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono" rows={15} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => saveSitePage(editingPage)} className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg transition-colors font-medium text-sm">
                      Сохранить
                    </button>
                    <button onClick={() => { setEditingPage(null); setPageSaveMsg(""); }} className="bg-bg-light text-text-gray px-4 py-2.5 rounded-lg text-sm">
                      Закрыть
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Company info / site settings */}
        {activeTab === "company" && <CompanySettingsPanel token={token} />}

        {/* Callbacks */}
        {activeTab === "callbacks" && <CallbacksPanel token={token} />}

        {/* Clients */}
        {activeTab === "clients" && <ClientsPanel token={token} />}

        {/* Synonyms */}
        {activeTab === "synonyms" && <SynonymsPanel token={token} />}

        {/* Settings */}
        {activeTab === "settings" && (
          <div className="max-w-lg">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Настройки аккаунта</h2>
              {adminSettingsMsg && (
                <p className={`text-sm mb-4 ${adminSettingsMsg.includes("Ошибка") || adminSettingsMsg.includes("Неверный") || adminSettingsMsg.includes("занят") ? "text-danger" : "text-success"}`}>{adminSettingsMsg}</p>
              )}
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-text-gray mb-1 block">Новый логин</label>
                  <input type="text" placeholder="Оставьте пустым, если не менять" value={adminSettings.newUsername}
                    onChange={(e) => setAdminSettings({ ...adminSettings, newUsername: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm text-text-gray mb-1 block">Текущий пароль</label>
                  <input type="password" placeholder="Для смены пароля или логина" value={adminSettings.currentPassword}
                    onChange={(e) => setAdminSettings({ ...adminSettings, currentPassword: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-sm text-text-gray mb-1 block">Новый пароль</label>
                  <input type="password" placeholder="Минимум 6 символов" value={adminSettings.newPassword}
                    onChange={(e) => setAdminSettings({ ...adminSettings, newPassword: e.target.value })}
                    className="w-full border border-border rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary" />
                </div>
                <button onClick={updateAdminSettings} className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg transition-colors font-medium">
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsPanel({ token }: { token: string }) {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, token]);

  const maxViews = data ? Math.max(...data.data.map((d) => d.views), 1) : 1;
  const maxUnique = data ? Math.max(...data.data.map((d) => d.unique), 1) : 1;
  const maxVal = Math.max(maxViews, maxUnique, 1);

  const periodLabels = { day: "Сегодня", week: "Неделя", month: "Месяц" };
  const avgLabel = period === "day" ? "в час" : "в день";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-text-dark">Статистика посещений</h2>
        <div className="flex gap-2">
          {(["day", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p ? "bg-primary text-white" : "bg-bg-white border border-border text-text-gray hover:text-primary"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-text-gray">Загрузка...</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <p className="text-sm text-text-gray mb-1">Всего просмотров</p>
              <p className="text-3xl font-bold text-text-dark">{data.totalViews.toLocaleString("ru-RU")}</p>
              <p className="text-xs text-text-light mt-1">за {periodLabels[period].toLowerCase()}</p>
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <p className="text-sm text-text-gray mb-1">Уникальные посетители</p>
              <p className="text-3xl font-bold text-accent">{data.totalUniqueVisitors.toLocaleString("ru-RU")}</p>
              <p className="text-xs text-text-light mt-1">за {periodLabels[period].toLowerCase()}</p>
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <p className="text-sm text-text-gray mb-1">Среднее {avgLabel}</p>
              <p className="text-3xl font-bold text-text-dark">
                {data.data.length > 0 ? Math.round(data.totalViews / data.data.length).toLocaleString("ru-RU") : 0}
              </p>
              <p className="text-xs text-text-light mt-1">просмотров</p>
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <p className="text-sm text-text-gray mb-1">Популярных страниц</p>
              <p className="text-3xl font-bold text-text-dark">{data.topPages.length}</p>
              <p className="text-xs text-text-light mt-1">уникальных URL</p>
            </div>
          </div>

          <div className="bg-bg-white rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-text-dark">График посещений</h3>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-primary/80 inline-block"></span> Просмотры</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-accent/80 inline-block"></span> Уникальные</span>
              </div>
            </div>
            <div className="flex items-end gap-1 h-52">
              {data.data.map((d, i) => {
                const viewsH = Math.max((d.views / maxVal) * 100, d.views > 0 ? 4 : 0);
                const uniqueH = Math.max((d.unique / maxVal) * 100, d.unique > 0 ? 4 : 0);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-[10px] text-text-gray font-medium">{d.views || ""}</span>
                    <div className="w-full flex gap-px justify-center items-end" style={{ height: `${Math.max(viewsH, uniqueH, 2)}%` }}>
                      <div
                        className="flex-1 bg-primary/80 hover:bg-primary rounded-t transition-colors"
                        style={{ height: `${viewsH > 0 ? Math.max((d.views / Math.max(d.views, d.unique, 1)) * 100, 8) : 2}%`, minHeight: "2px" }}
                        title={`${d.label}: ${d.views} просмотров`}
                      />
                      <div
                        className="flex-1 bg-accent/80 hover:bg-accent rounded-t transition-colors"
                        style={{ height: `${uniqueH > 0 ? Math.max((d.unique / Math.max(d.views, d.unique, 1)) * 100, 8) : 2}%`, minHeight: "2px" }}
                        title={`${d.label}: ${d.unique} уникальных`}
                      />
                    </div>
                    <span className="text-[9px] text-text-light truncate w-full text-center">{d.label}</span>
                  </div>
                );
              })}
            </div>
            {data.data.length === 0 && (
              <p className="text-center text-text-gray text-sm py-8">Нет данных за выбранный период</p>
            )}
          </div>

          {data.topPages.length > 0 && (
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h3 className="font-bold text-text-dark mb-4">Популярные страницы</h3>
              <div className="space-y-2">
                {data.topPages.map((page, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm text-text-light w-6 text-right">{i + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-text-dark truncate">{page.path}</span>
                        <span className="text-sm font-medium text-text-gray flex-shrink-0">{page.views} просм.</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-bg-light rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${(page.views / data.topPages[0].views) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-bg-white rounded-xl border border-border p-5">
            <h3 className="font-bold text-text-dark mb-2">Яндекс.Метрика и Google Analytics</h3>
            <p className="text-sm text-text-gray mb-3">
              Для детальной аналитики используйте внешние сервисы:
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://metrika.yandex.ru/dashboard?id=109327312" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-bg-light border border-border rounded-lg text-sm text-text-dark hover:text-primary hover:border-primary transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                Яндекс.Метрика
              </a>
              <a href="https://analytics.google.com/analytics/web/#/report-home/a0p0" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-bg-light border border-border rounded-lg text-sm text-text-dark hover:text-primary hover:border-primary transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z"/></svg>
                Google Analytics
              </a>
            </div>
          </div>
        </>
      ) : (
        <p className="text-text-gray">Не удалось загрузить данные</p>
      )}
    </div>
  );
}

function CallbacksPanel({ token }: { token: string }) {
  const [callbacks, setCallbacks] = useState<CallbackItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCallbacks = async () => {
    const res = await fetch("/api/admin/callbacks", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setCallbacks(await res.json());
    setLoading(false);
  };

  useEffect(() => { loadCallbacks(); }, []);

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/admin/callbacks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, status }),
    });
    loadCallbacks();
  };

  const deleteCallback = async (id: string) => {
    if (!confirm("Удалить заявку?")) return;
    await fetch("/api/admin/callbacks", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    loadCallbacks();
  };

  const statusLabels: Record<string, string> = { new: "Новая", processing: "В работе", done: "Выполнена" };
  const statusColors: Record<string, string> = { new: "bg-accent text-white", processing: "bg-primary text-white", done: "bg-success text-white" };

  if (loading) return <p className="text-text-gray">Загрузка...</p>;

  return (
    <div className="bg-bg-white rounded-xl border border-border p-5">
      <h2 className="font-bold text-text-dark mb-4">Заявки на звонок ({callbacks.length})</h2>
      {callbacks.length === 0 ? <p className="text-text-gray text-sm">Заявок пока нет</p> : (
        <div className="space-y-3">
          {callbacks.map((cb) => (
            <div key={cb.id} className="p-4 bg-bg-light rounded-lg flex items-center justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[cb.status] || "bg-gray-200"}`}>
                    {statusLabels[cb.status] || cb.status}
                  </span>
                  <span className="text-xs text-text-gray">{new Date(cb.createdAt).toLocaleString("ru-RU")}</span>
                </div>
                <p className="font-medium text-text-dark">{cb.name}</p>
                <a href={`tel:${cb.phone}`} className="text-sm text-primary hover:underline">{cb.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <select value={cb.status} onChange={(e) => updateStatus(cb.id, e.target.value)}
                  className="border border-border rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-primary">
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button onClick={() => deleteCallback(cb.id)}
                  className="text-sm px-3 py-1 rounded-lg border border-danger text-danger hover:bg-danger hover:text-white transition-colors">
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ClientItem {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  city: string;
  createdAt: string;
  ordersCount: number;
  reviewsCount: number;
}

interface ClientDetails {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phone: string;
  zipCode: string;
  region: string;
  city: string;
  street: string;
  building: string;
  apartment: string;
  createdAt: string;
  orders: { id: string; status: string; total: number; createdAt: string }[];
  reviews: { id: string; rating: number; text: string; createdAt: string; product: { name: string } }[];
}

function ClientsPanel({ token }: { token: string }) {
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadClients = async () => {
    const res = await fetch("/api/admin/clients", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setClients(await res.json());
    setLoading(false);
  };

  useEffect(() => { loadClients(); }, []);

  const deleteClient = async (id: string, email: string) => {
    if (!confirm(`Удалить аккаунт клиента ${email}? Это действие необратимо — будут удалены все данные, заказы и отзывы.`)) return;
    await fetch("/api/admin/clients", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    setSelectedClient(null);
    loadClients();
  };

  const viewDetails = async (id: string) => {
    setDetailsLoading(true);
    const res = await fetch("/api/admin/clients", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, action: "get-details" }),
    });
    if (res.ok) setSelectedClient(await res.json());
    setDetailsLoading(false);
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return !q || c.email.toLowerCase().includes(q) || c.name.toLowerCase().includes(q) || c.lastName.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const totalOrders = clients.reduce((s, c) => s + c.ordersCount, 0);
  const totalReviews = clients.reduce((s, c) => s + c.reviewsCount, 0);

  if (loading) return <p className="text-text-gray">Загрузка...</p>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-primary">{clients.length}</p>
          <p className="text-xs text-text-gray">Всего клиентов</p>
        </div>
        <div className="bg-bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-accent">{totalOrders}</p>
          <p className="text-xs text-text-gray">Всего заказов</p>
        </div>
        <div className="bg-bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-success">{totalReviews}</p>
          <p className="text-xs text-text-gray">Всего отзывов</p>
        </div>
        <div className="bg-bg-white rounded-xl border border-border p-4 text-center">
          <p className="text-2xl font-bold text-text-dark">{clients.filter((c) => {
            const d = new Date(c.createdAt);
            const now = new Date();
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          }).length}</p>
          <p className="text-xs text-text-gray">Новых за месяц</p>
        </div>
      </div>

      <div className="bg-bg-white rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-text-dark">Клиенты ({filtered.length})</h2>
          <input type="text" placeholder="Поиск по email, имени, телефону..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary w-full sm:w-64" />
        </div>

        {filtered.length === 0 ? <p className="text-text-gray text-sm">Клиентов не найдено</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-text-gray">
                  <th className="pb-2 pr-3">Клиент</th>
                  <th className="pb-2 pr-3">Email</th>
                  <th className="pb-2 pr-3">Телефон</th>
                  <th className="pb-2 pr-3">Город</th>
                  <th className="pb-2 pr-3 text-center">Заказы</th>
                  <th className="pb-2 pr-3 text-center">Отзывы</th>
                  <th className="pb-2 pr-3">Регистрация</th>
                  <th className="pb-2">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-bg-light/50">
                    <td className="py-2.5 pr-3 font-medium text-text-dark">
                      {c.name || c.lastName ? `${c.lastName} ${c.name}`.trim() : "—"}
                    </td>
                    <td className="py-2.5 pr-3 text-primary">{c.email}</td>
                    <td className="py-2.5 pr-3">{c.phone || "—"}</td>
                    <td className="py-2.5 pr-3">{c.city || "—"}</td>
                    <td className="py-2.5 pr-3 text-center">{c.ordersCount}</td>
                    <td className="py-2.5 pr-3 text-center">{c.reviewsCount}</td>
                    <td className="py-2.5 pr-3 text-text-gray">{new Date(c.createdAt).toLocaleDateString("ru-RU")}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => viewDetails(c.id)}
                          className="text-xs px-2 py-1 rounded border border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                          Подробнее
                        </button>
                        <button onClick={() => deleteClient(c.id, c.email)}
                          className="text-xs px-2 py-1 rounded border border-danger text-danger hover:bg-danger hover:text-white transition-colors">
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(selectedClient || detailsLoading) && (
        <div className="bg-bg-white rounded-xl border border-border p-5">
          {detailsLoading ? <p className="text-text-gray">Загрузка...</p> : selectedClient && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-text-dark">
                  {selectedClient.lastName} {selectedClient.name} — {selectedClient.email}
                </h2>
                <button onClick={() => setSelectedClient(null)} className="text-text-gray hover:text-text-dark text-lg">✕</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-text-dark mb-2">Контакты</h3>
                  <p className="text-sm text-text-gray">Email: <span className="text-text-dark">{selectedClient.email}</span></p>
                  <p className="text-sm text-text-gray">Телефон: <span className="text-text-dark">{selectedClient.phone || "не указан"}</span></p>
                  <p className="text-sm text-text-gray">Регистрация: <span className="text-text-dark">{new Date(selectedClient.createdAt).toLocaleString("ru-RU")}</span></p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-dark mb-2">Адрес доставки</h3>
                  {selectedClient.city || selectedClient.street ? (
                    <>
                      {selectedClient.zipCode && <p className="text-sm text-text-gray">Индекс: <span className="text-text-dark">{selectedClient.zipCode}</span></p>}
                      {selectedClient.region && <p className="text-sm text-text-gray">Регион: <span className="text-text-dark">{selectedClient.region}</span></p>}
                      {selectedClient.city && <p className="text-sm text-text-gray">Город: <span className="text-text-dark">{selectedClient.city}</span></p>}
                      {selectedClient.street && <p className="text-sm text-text-gray">Улица: <span className="text-text-dark">{selectedClient.street}</span></p>}
                      {selectedClient.building && <p className="text-sm text-text-gray">Дом: <span className="text-text-dark">{selectedClient.building}</span></p>}
                      {selectedClient.apartment && <p className="text-sm text-text-gray">Квартира: <span className="text-text-dark">{selectedClient.apartment}</span></p>}
                    </>
                  ) : <p className="text-sm text-text-gray">Не указан</p>}
                </div>
              </div>

              {selectedClient.orders.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-text-dark mb-2">Последние заказы ({selectedClient.orders.length})</h3>
                  <div className="space-y-1">
                    {selectedClient.orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between text-sm p-2 bg-bg-light rounded">
                        <span className="text-text-gray">{new Date(o.createdAt).toLocaleDateString("ru-RU")}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === "delivered" ? "bg-success text-white" : o.status === "cancelled" ? "bg-danger text-white" : "bg-primary text-white"}`}>
                          {statusLabels[o.status] || o.status}
                        </span>
                        <span className="font-medium text-text-dark">{o.total.toLocaleString("ru-RU")} ₽</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedClient.reviews.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-text-dark mb-2">Последние отзывы ({selectedClient.reviews.length})</h3>
                  <div className="space-y-1">
                    {selectedClient.reviews.map((r) => (
                      <div key={r.id} className="text-sm p-2 bg-bg-light rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-accent">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                          <span className="text-text-gray text-xs">{r.product.name}</span>
                        </div>
                        {r.text && <p className="text-text-dark text-xs">{r.text}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-border">
                <button onClick={() => deleteClient(selectedClient.id, selectedClient.email)}
                  className="text-sm px-4 py-2 rounded-lg border border-danger text-danger hover:bg-danger hover:text-white transition-colors">
                  Удалить аккаунт
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SynonymsPanel({ token }: { token: string }) {
  const [synonyms, setSynonyms] = useState<{ id: string; word: string; synonym: string }[]>([]);
  const [word, setWord] = useState("");
  const [synonym, setSynonym] = useState("");
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const loadSynonyms = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/synonyms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSynonyms(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadSynonyms(); }, [loadSynonyms]);

  const addSynonym = async () => {
    if (!word.trim() || !synonym.trim()) return;
    setMsg("");
    const res = await fetch("/api/admin/synonyms", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ word: word.trim(), synonym: synonym.trim() }),
    });
    if (res.ok) {
      setWord("");
      setSynonym("");
      setMsg("Добавлено");
      loadSynonyms();
    } else {
      const err = await res.json();
      setMsg(err.error || "Ошибка");
    }
  };

  const deleteSynonym = async (id: string) => {
    await fetch("/api/admin/synonyms", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadSynonyms();
  };

  return (
    <div className="space-y-4">
      <div className="bg-bg-white rounded-xl border border-border p-5">
        <h2 className="font-bold text-text-dark mb-2">Синонимы поиска</h2>
        <p className="text-sm text-text-gray mb-4">
          Связывайте слова для умного поиска. Например: «энергетик» → «энергетический напиток», «monster» → «монстр».
          При поиске любого слова из пары будут найдены товары, содержащие оба варианта.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <input type="text" placeholder="Слово (напр. энергетик)" value={word}
            onChange={(e) => setWord(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-[150px]" />
          <input type="text" placeholder="Синоним (напр. энергетический напиток)" value={synonym}
            onChange={(e) => setSynonym(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary flex-1 min-w-[150px]" />
          <button onClick={addSynonym}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Добавить
          </button>
        </div>
        {msg && <p className={`text-sm mb-3 ${msg === "Добавлено" ? "text-success" : "text-danger"}`}>{msg}</p>}
      </div>

      <div className="bg-bg-white rounded-xl border border-border p-5">
        <h3 className="font-semibold text-text-dark mb-3">Текущие синонимы ({synonyms.length})</h3>
        {loading ? (
          <p className="text-sm text-text-gray">Загрузка...</p>
        ) : synonyms.length === 0 ? (
          <p className="text-sm text-text-gray">Синонимы не добавлены. Добавьте первый выше.</p>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {synonyms.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-bg-light">
                <span className="text-sm">
                  <span className="font-medium text-text-dark">{s.word}</span>
                  <span className="text-text-gray mx-2">↔</span>
                  <span className="font-medium text-text-dark">{s.synonym}</span>
                </span>
                <button onClick={() => deleteSynonym(s.id)}
                  className="text-danger hover:bg-danger/10 p-1 rounded text-sm">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface AdminReview {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  displayName: string;
  adminReply: string;
  published: boolean;
  createdAt: string;
  isFake: boolean;
  product: { id: string; name: string; slug: string; image: string } | null;
}

interface ReviewProduct {
  id: string;
  name: string;
  image: string;
}

const RU_FIRST_NAMES = [
  "Александр", "Дмитрий", "Максим", "Сергей", "Андрей", "Алексей", "Иван", "Михаил",
  "Никита", "Артём", "Егор", "Роман", "Павел", "Денис", "Кирилл", "Владимир",
  "Анна", "Мария", "Елена", "Ольга", "Наталья", "Ирина", "Екатерина", "Татьяна",
  "Юлия", "Светлана", "Дарья", "Виктория", "Полина", "Ксения", "Марина", "Алина",
];
const RU_LAST_INITIALS = [
  "И", "С", "К", "П", "В", "Л", "М", "Н", "З", "Б", "Г", "Д", "Ф", "Р", "Т", "Ш", "Ч", "Е", "О", "А",
];

function randomName(): string {
  const first = RU_FIRST_NAMES[Math.floor(Math.random() * RU_FIRST_NAMES.length)];
  const initial = RU_LAST_INITIALS[Math.floor(Math.random() * RU_LAST_INITIALS.length)];
  return `${first} ${initial}.`;
}

function ReviewStars({ rating, interactive, onChange }: { rating: number; interactive?: boolean; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" disabled={!interactive} onClick={() => onChange?.(star)}
          className={interactive ? "cursor-pointer" : "cursor-default"}>
          <svg className={`w-5 h-5 ${star <= rating ? "text-yellow-400" : "text-gray-300"}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
    </div>
  );
}

interface ReviewImportRow { index: number; product: string; author: string; text: string; rating: number }

function ReviewsPanel({ token }: { token: string }) {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [products, setProducts] = useState<ReviewProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [prodQuery, setProdQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ReviewProduct | null>(null);
  const [showProdList, setShowProdList] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  // List filters
  const [search, setSearch] = useState("");
  const [publishedFilter, setPublishedFilter] = useState<"all" | "published" | "hidden">("all");

  // Inline admin reply editing
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // Import
  const [showImport, setShowImport] = useState(false);
  const [impStep, setImpStep] = useState<"idle" | "mapping" | "preview">("idle");
  const [impHeaders, setImpHeaders] = useState<string[]>([]);
  const [impMap, setImpMap] = useState<Record<string, string>>({});
  const [impSample, setImpSample] = useState<Record<string, string>[]>([]);
  const [impRows, setImpRows] = useState<Record<string, string>[]>([]);
  const [impPreview, setImpPreview] = useState<ReviewImportRow[]>([]);
  const [impSelected, setImpSelected] = useState<Set<number>>(new Set());
  const [impStatus, setImpStatus] = useState("");
  const [impLoading, setImpLoading] = useState(false);

  const authHeaders = useCallback(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);

  const loadData = useCallback(async () => {
    const [revRes, prodRes] = await Promise.all([
      fetch("/api/admin/reviews", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (revRes.ok) setReviews(await revRes.json());
    if (prodRes.ok) {
      const prods = await prodRes.json();
      // Sort alphabetically so the picker browses the whole catalogue evenly. The products API
      // returns newest-first, which let recently-added (e.g. imported) goods crowd out everything
      // else in the default list — a review can be attached to ANY product, not just those.
      setProducts(
        prods
          .map((p: { id: string; name: string; image: string }) => ({ id: p.id, name: p.name, image: p.image }))
          .sort((a: ReviewProduct, b: ReviewProduct) => a.name.localeCompare(b.name, "ru")),
      );
    }
    setLoading(false);
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const productMatches = prodQuery.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(prodQuery.toLowerCase())).slice(0, 30)
    : products.slice(0, 30);

  const pickProduct = (p: ReviewProduct) => {
    setSelectedProduct(p);
    setProdQuery(p.name);
    setShowProdList(false);
  };

  // "Smart generation" — same idea as the AI product description: open a search engine so its
  // neural network drafts a realistic review; the admin copies the result into the field.
  const smartGenerate = () => {
    if (!selectedProduct) { setFormMsg("Сначала выберите товар"); return; }
    const query = `Напиши короткий реалистичный отзыв покупателя о товаре "${selectedProduct.name}" для интернет-магазина, 1-2 предложения, от первого лица, без даты и без имени`;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
  };

  const createReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    if (!selectedProduct) { setFormMsg("Выберите товар для отзыва"); return; }
    if (!reviewText.trim()) { setFormMsg("Введите текст отзыва"); return; }
    setSaving(true);
    const res = await fetch("/api/admin/reviews", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ productId: selectedProduct.id, authorName: authorName.trim(), text: reviewText.trim(), rating }),
    });
    setSaving(false);
    if (res.ok) {
      setReviewText("");
      setAuthorName("");
      setRating(5);
      setFormMsg("Отзыв добавлен");
      loadData();
      setTimeout(() => setFormMsg(""), 3000);
    } else {
      const err = await res.json();
      setFormMsg(err.error || "Ошибка");
    }
  };

  const togglePublished = async (r: AdminReview) => {
    await fetch("/api/admin/reviews", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ id: r.id, published: !r.published }),
    });
    loadData();
  };

  const saveReply = async (id: string) => {
    await fetch("/api/admin/reviews", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ id, adminReply: replyText.trim() }),
    });
    setReplyingId(null);
    setReplyText("");
    loadData();
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Удалить отзыв?")) return;
    await fetch("/api/admin/reviews", { method: "DELETE", headers: authHeaders(), body: JSON.stringify({ id }) });
    loadData();
  };

  // ---- Import handlers ----
  const reviewTargetFields: { value: string; label: string }[] = [
    { value: "", label: "— Пропустить —" },
    { value: "product", label: "Товар (название / артикул)" },
    { value: "text", label: "Текст отзыва" },
    { value: "author", label: "Имя покупателя" },
    { value: "rating", label: "Оценка (необязательно)" },
  ];

  const resetImport = () => {
    setImpStep("idle");
    setImpHeaders([]);
    setImpMap({});
    setImpSample([]);
    setImpRows([]);
    setImpPreview([]);
    setImpSelected(new Set());
    setImpStatus("");
  };

  const handleImportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImpLoading(true);
    setImpStatus("Обработка файла...");
    resetImport();
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/reviews/import", { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (!res.ok || !data.headers) {
        setImpStatus(`Ошибка: ${data.error || "Не удалось обработать файл"}`);
      } else {
        setImpHeaders(data.headers);
        setImpMap(data.autoMap || {});
        setImpSample(data.sample || []);
        setImpRows(data.rows || []);
        setImpStep("mapping");
        setImpStatus(`Найдено ${data.totalRows} строк`);
      }
    } catch (err) {
      setImpStatus(`Ошибка: ${err instanceof Error ? err.message : "неизвестная ошибка"}`);
    }
    setImpLoading(false);
    e.target.value = "";
  };

  const buildImportPreview = () => {
    const preview: ReviewImportRow[] = impRows.map((row, i) => {
      const mapped: Record<string, string> = {};
      for (const [col, field] of Object.entries(impMap)) {
        if (field && row[col] !== undefined) mapped[field] = row[col];
      }
      return {
        index: i,
        product: mapped.product || "",
        author: mapped.author || "",
        text: mapped.text || "",
        rating: mapped.rating ? Math.min(5, Math.max(1, Number(mapped.rating) || 5)) : 5,
      };
    }).filter((r) => r.product && r.text);
    setImpPreview(preview);
    setImpSelected(new Set(preview.map((r) => r.index)));
    setImpStep("preview");
  };

  const toggleImpAll = () => {
    if (impSelected.size === impPreview.length) setImpSelected(new Set());
    else setImpSelected(new Set(impPreview.map((r) => r.index)));
  };

  const handleImportSelected = async () => {
    if (impSelected.size === 0) return;
    setImpLoading(true);
    setImpStatus("Импорт...");
    const payload = impPreview
      .filter((r) => impSelected.has(r.index))
      .map((r) => ({ product: r.product, author: r.author, text: r.text, rating: r.rating }));
    const res = await fetch("/api/admin/reviews/import", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ reviews: payload }),
    });
    const data = await res.json();
    setImpLoading(false);
    if (res.ok) {
      let msg = `Импортировано: ${data.imported} из ${data.total}`;
      if (data.notFoundCount > 0) msg += `. Не найдено товаров: ${data.notFoundCount}`;
      setImpStatus(msg);
      resetImport();
      loadData();
    } else {
      setImpStatus(`Ошибка: ${data.error}`);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (publishedFilter === "published" && !r.published) return false;
    if (publishedFilter === "hidden" && r.published) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (r.product?.name.toLowerCase().includes(q) ?? false) ||
        r.displayName.toLowerCase().includes(q) ||
        r.text.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const canPreview = Object.values(impMap).includes("product") && Object.values(impMap).includes("text");

  if (loading) return <p className="text-text-gray">Загрузка...</p>;

  return (
    <div className="space-y-6">
      {/* Import */}
      <div className="bg-bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-text-dark">Импорт отзывов из таблицы</h2>
          <button onClick={() => setShowImport(!showImport)} className="text-sm text-primary hover:underline">
            {showImport ? "Свернуть" : "Развернуть"}
          </button>
        </div>
        {showImport && (
          <div className="mt-3">
            <p className="text-sm text-text-gray mb-3">
              Загрузите CSV, XLSX или XLS с колонками: <b>товар</b> (название или артикул), <b>текст отзыва</b> и <b>имя покупателя</b>.
              Дата отзыва не импортируется. Товар определяется по названию, артикулу или штрихкоду.
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white text-sm px-4 py-2 rounded-lg cursor-pointer transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                {impStep !== "idle" ? "Загрузить другой файл" : "Выбрать файл"}
                <input type="file" accept=".csv,.xlsx,.xls" onChange={handleImportUpload} className="hidden" />
              </label>
              {impStep !== "idle" && <button onClick={resetImport} className="text-sm text-danger hover:underline">Отмена</button>}
              {impLoading && <span className="text-sm text-text-gray">Загрузка...</span>}
              {impStatus && <span className={`text-sm ${impStatus.startsWith("Ошибка") ? "text-danger" : "text-success"}`}>{impStatus}</span>}
            </div>

            {impStep === "mapping" && impHeaders.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-text-dark mb-2">Шаг 1: Сопоставьте колонки</h3>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Колонка файла</th>
                        <th className="px-3 py-2 text-left">Поле отзыва</th>
                        <th className="px-3 py-2 text-left">Пример</th>
                      </tr>
                    </thead>
                    <tbody>
                      {impHeaders.map((header) => (
                        <tr key={header} className="border-t border-border">
                          <td className="px-3 py-2 font-medium">{header}</td>
                          <td className="px-3 py-2">
                            <select value={impMap[header] || ""} onChange={(e) => setImpMap({ ...impMap, [header]: e.target.value })}
                              className="border border-border rounded px-2 py-1 text-sm w-full max-w-[220px] focus:outline-none focus:border-primary">
                              {reviewTargetFields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-2 text-text-gray text-xs max-w-[220px] truncate">
                            {impSample.map((s, i) => <span key={i}>{i > 0 && " | "}{s[header] || "—"}</span>)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex gap-2 items-center">
                  <button onClick={buildImportPreview} disabled={!canPreview}
                    className="bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors">
                    Предпросмотр
                  </button>
                  {!canPreview && <span className="text-xs text-danger">Выберите колонки «Товар» и «Текст отзыва»</span>}
                </div>
              </div>
            )}

            {impStep === "preview" && (
              <div className="mt-4">
                <h3 className="text-sm font-bold text-text-dark mb-2">Шаг 2: Выберите отзывы для импорта</h3>
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <p className="text-sm text-text-dark">Готово к импорту: {impPreview.length} | Выбрано: {impSelected.size}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setImpStep("mapping")} className="text-sm text-primary hover:underline">Назад к маппингу</button>
                    <button onClick={toggleImpAll} className="text-sm text-primary hover:underline">
                      {impSelected.size === impPreview.length ? "Снять все" : "Выбрать все"}
                    </button>
                    <button onClick={handleImportSelected} disabled={impSelected.size === 0 || impLoading}
                      className="bg-success hover:bg-green-600 disabled:opacity-50 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
                      Импортировать ({impSelected.size})
                    </button>
                  </div>
                </div>
                {impPreview.length === 0 ? (
                  <p className="text-sm text-danger">Нет строк с заполненными товаром и текстом отзыва.</p>
                ) : (
                  <div className="overflow-x-auto max-h-96 overflow-y-auto border border-border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left"><input type="checkbox" checked={impSelected.size === impPreview.length} onChange={toggleImpAll} /></th>
                          <th className="px-2 py-2 text-left">Товар</th>
                          <th className="px-2 py-2 text-left">Имя</th>
                          <th className="px-2 py-2 text-left">Отзыв</th>
                          <th className="px-2 py-2 text-center">Оценка</th>
                        </tr>
                      </thead>
                      <tbody>
                        {impPreview.map((row) => (
                          <tr key={row.index} onClick={() => setImpSelected((prev) => { const n = new Set(prev); if (n.has(row.index)) n.delete(row.index); else n.add(row.index); return n; })}
                            className={`border-t border-border hover:bg-gray-50 cursor-pointer ${impSelected.has(row.index) ? "bg-blue-50" : ""}`}>
                            <td className="px-2 py-2"><input type="checkbox" checked={impSelected.has(row.index)} readOnly /></td>
                            <td className="px-2 py-2 max-w-[200px] truncate">{row.product}</td>
                            <td className="px-2 py-2">{row.author || <span className="text-text-light">—</span>}</td>
                            <td className="px-2 py-2 max-w-[320px] truncate">{row.text}</td>
                            <td className="px-2 py-2 text-center">{row.rating}★</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create fictitious review */}
      <div className="bg-bg-white rounded-xl border border-border p-5">
        <h2 className="font-bold text-text-dark mb-1">Создать отзыв</h2>
        <p className="text-sm text-text-gray mb-4">Придумайте случайного покупателя (имя и текст) и привяжите отзыв к товару. Дата проставляется автоматически.</p>
        <form onSubmit={createReview} className="space-y-4">
          <div className="relative">
            <label className="text-xs text-text-gray mb-1 block">Товар *</label>
            <input type="text" value={prodQuery}
              onChange={(e) => { setProdQuery(e.target.value); setShowProdList(true); setSelectedProduct(null); }}
              onFocus={() => setShowProdList(true)}
              placeholder="Начните вводить название товара..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            {selectedProduct && <span className="absolute right-3 top-8 text-success text-xs">✓ выбран</span>}
            {showProdList && productMatches.length > 0 && !selectedProduct && (
              <div className="absolute z-10 mt-1 w-full max-h-60 overflow-y-auto bg-bg-white border border-border rounded-lg shadow-lg">
                {productMatches.map((p) => (
                  <button key={p.id} type="button" onClick={() => pickProduct(p)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-bg-light">
                    {p.image ? <img src={p.image} alt="" className="w-8 h-8 object-cover rounded" /> : <span className="w-8 h-8 rounded bg-bg-light flex items-center justify-center text-text-light">📦</span>}
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-gray mb-1 block">Имя покупателя</label>
              <div className="flex gap-2">
                <input type="text" value={authorName} onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Напр. Анна К."
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <button type="button" title="Случайное имя" onClick={() => setAuthorName(randomName())}
                  className="px-3 py-2 bg-bg-light border border-border rounded-lg text-sm hover:bg-primary/5">🎲</button>
              </div>
            </div>
            <div>
              <label className="text-xs text-text-gray mb-1 block">Оценка</label>
              <div className="pt-1.5"><ReviewStars rating={rating} interactive onChange={setRating} /></div>
            </div>
          </div>

          <div className="relative">
            <label className="text-xs text-text-gray mb-1 block">Текст отзыва *</label>
            <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} rows={3}
              placeholder="Текст отзыва..."
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary pr-10" />
            <button type="button" title="Сгенерировать отзыв через ИИ-поиск" onClick={smartGenerate}
              className="absolute top-7 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-md transition-all hover:scale-110 cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" /></svg>
            </button>
            <p className="text-xs text-text-gray mt-1">Кнопка ✦ открывает ИИ-поиск и предлагает готовый отзыв — скопируйте его сюда.</p>
          </div>

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="bg-primary hover:bg-primary-dark text-white text-sm px-6 py-2 rounded-lg disabled:opacity-50">
              {saving ? "Сохранение..." : "Добавить отзыв"}
            </button>
            {formMsg && <span className={`text-sm ${formMsg === "Отзыв добавлен" ? "text-success" : "text-danger"}`}>{formMsg}</span>}
          </div>
        </form>
      </div>

      {/* Reviews list */}
      <div className="bg-bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="font-bold text-text-dark">Все отзывы ({filteredReviews.length}{filteredReviews.length !== reviews.length ? ` из ${reviews.length}` : ""})</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по товару, имени, тексту..."
              className="border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary min-w-[220px]" />
            <select value={publishedFilter} onChange={(e) => setPublishedFilter(e.target.value as "all" | "published" | "hidden")}
              className="border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary">
              <option value="all">Все</option>
              <option value="published">Опубликованные</option>
              <option value="hidden">Скрытые</option>
            </select>
          </div>
        </div>

        {filteredReviews.length === 0 ? (
          <p className="text-text-gray text-sm">Отзывов пока нет.</p>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((r) => (
              <div key={r.id} className="p-4 bg-bg-light rounded-lg">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 min-w-0">
                    {r.product?.image
                      ? <img src={r.product.image} alt="" className="w-12 h-12 object-cover rounded border border-border" />
                      : <span className="w-12 h-12 rounded bg-bg-white border border-border flex items-center justify-center text-text-light">📦</span>}
                    <div className="min-w-0">
                      {r.product
                        ? <Link href={`/product/${r.product.slug}`} target="_blank" className="text-sm font-medium text-primary hover:underline line-clamp-1">{r.product.name}</Link>
                        : <span className="text-sm text-text-light">Товар удалён</span>}
                      <div className="flex items-center gap-2 mt-1">
                        <ReviewStars rating={r.rating} />
                        <span className="text-sm font-medium text-text-dark">{r.displayName}</span>
                        {r.isFake && <span className="text-[10px] uppercase tracking-wide bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">сгенерирован</span>}
                        {!r.published && <span className="text-[10px] uppercase tracking-wide bg-gray-200 text-text-gray px-1.5 py-0.5 rounded">скрыт</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => togglePublished(r)}
                      className={`text-xs px-3 py-1 rounded-lg border ${r.published ? "border-border text-text-gray hover:text-text-dark" : "border-success text-success hover:bg-success hover:text-white"}`}>
                      {r.published ? "Скрыть" : "Опубликовать"}
                    </button>
                    <button onClick={() => deleteReview(r.id)}
                      className="text-xs px-3 py-1 rounded-lg border border-danger text-danger hover:bg-danger hover:text-white transition-colors">
                      Удалить
                    </button>
                  </div>
                </div>

                {r.text && <p className="text-sm text-text-gray mt-2 leading-relaxed">{r.text}</p>}

                {/* Admin reply */}
                <div className="mt-2 pt-2 border-t border-border/50">
                  {replyingId === r.id ? (
                    <div className="space-y-2">
                      <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} rows={2}
                        placeholder="Ответ от имени администрации магазина..."
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                      <div className="flex gap-2">
                        <button onClick={() => saveReply(r.id)} className="text-sm px-3 py-1 rounded-lg bg-primary text-white hover:bg-primary-dark">Сохранить ответ</button>
                        <button onClick={() => { setReplyingId(null); setReplyText(""); }} className="text-sm px-3 py-1 rounded-lg border border-border text-text-gray">Отмена</button>
                      </div>
                    </div>
                  ) : r.adminReply ? (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs font-medium text-primary mb-0.5">Ответ магазина ТОПХИТ:</p>
                      <p className="text-sm text-text-gray">{r.adminReply}</p>
                      <button onClick={() => { setReplyingId(r.id); setReplyText(r.adminReply); }} className="text-xs text-primary hover:underline mt-1">Изменить ответ</button>
                    </div>
                  ) : (
                    <button onClick={() => { setReplyingId(r.id); setReplyText(""); }} className="text-sm text-primary hover:underline flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      Ответить от имени администрации
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const COMPANY_SETTING_GROUPS: {
  title: string;
  hint?: string;
  fields: { key: string; label: string; multiline?: boolean }[];
}[] = [
  {
    title: "Шапка сайта",
    fields: [
      { key: "header-hours", label: "График работы (будни)" },
      { key: "header-weekend", label: "График работы (выходные)" },
      { key: "header-region", label: "Регион работы" },
      { key: "header-subtitle", label: "Подпись под логотипом" },
    ],
  },
  {
    title: "Преимущества на главной странице",
    hint: "Указывайте только то, что соответствует действительности (например, не пишите «поддержка 24/7» при графике ПН-ПТ). Противоречия на сайте — частая причина блокировки «Искажение фактов» в Google Merchant Center.",
    fields: [
      { key: "home-benefit-1-title", label: "Преимущество 1 — заголовок" },
      { key: "home-benefit-1-desc", label: "Преимущество 1 — описание" },
      { key: "home-benefit-2-title", label: "Преимущество 2 — заголовок" },
      { key: "home-benefit-2-desc", label: "Преимущество 2 — описание" },
      { key: "home-benefit-3-title", label: "Преимущество 3 — заголовок" },
      { key: "home-benefit-3-desc", label: "Преимущество 3 — описание" },
      { key: "home-benefit-4-title", label: "Преимущество 4 — заголовок" },
      { key: "home-benefit-4-desc", label: "Преимущество 4 — описание" },
    ],
  },
  {
    title: "Контакты (футер)",
    hint: "Эти данные должны совпадать с данными в разделе «Сведения о компании» аккаунта Google Merchant Center.",
    fields: [
      { key: "footer-phone", label: "Телефон" },
      { key: "footer-hours", label: "График работы" },
      { key: "footer-email-1", label: "E-mail для заказов" },
      { key: "footer-email-2", label: "E-mail для опта" },
      { key: "footer-email-3", label: "E-mail для поставщиков" },
      { key: "footer-address", label: "Адрес" },
    ],
  },
  {
    title: "О компании и реквизиты",
    fields: [
      { key: "footer-description", label: "Описание компании (футер)", multiline: true },
      { key: "footer-legal-1", label: "Реквизиты (ИП, ИНН, ОГРНИП)" },
      { key: "footer-legal-2", label: "Юридический адрес" },
      { key: "footer-copyright", label: "Копирайт (после знака © и года)" },
      { key: "footer-disclaimer", label: "Правовая оговорка внизу сайта", multiline: true },
    ],
  },
  {
    title: "Заголовки колонок футера",
    fields: [
      { key: "footer-catalog-title", label: "Колонка каталога" },
      { key: "footer-info-title", label: "Колонка информации" },
      { key: "footer-contacts-title", label: "Колонка контактов" },
      { key: "footer-social-title", label: "Блок соцсетей" },
    ],
  },
];

function CompanySettingsPanel({ token }: { token: string }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/site-settings")
      .then((r) => r.json())
      .then((data: Record<string, { id: string; value: string }>) => {
        const v: Record<string, string> = {};
        for (const [slug, entry] of Object.entries(data)) v[slug] = entry.value;
        setValues(v);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const res = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ values }),
      });
      if (res.ok) {
        setMsg("Сохранено — изменения уже отображаются на сайте");
      } else {
        const d = await res.json().catch(() => null);
        setMsg(d?.error ? `Ошибка: ${d.error}` : "Ошибка сохранения");
      }
    } catch {
      setMsg("Ошибка сохранения");
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center py-12 text-text-gray">Загрузка...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-text-dark">Сведения о компании</h2>
        {msg && (
          <span className={`text-sm font-medium ${msg.startsWith("Ошибка") ? "text-danger" : "text-success"}`}>{msg}</span>
        )}
      </div>
      <p className="text-sm text-text-gray">
        Эти данные отображаются в шапке, футере и на главной странице сайта. Указывайте только достоверную информацию — она должна совпадать с данными в Google Merchant Center и других внешних сервисах.
      </p>
      {COMPANY_SETTING_GROUPS.map((group) => (
        <div key={group.title} className="bg-bg-white rounded-xl border border-border p-5">
          <h3 className="font-bold text-text-dark mb-1">{group.title}</h3>
          {group.hint && <p className="text-xs text-text-gray">{group.hint}</p>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {group.fields.map((field) => (
              <div key={field.key} className={field.multiline ? "md:col-span-2" : ""}>
                <label className="text-sm text-text-gray mb-1 block">{field.label}</label>
                {field.multiline ? (
                  <textarea
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    rows={3}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                ) : (
                  <input
                    type="text"
                    value={values[field.key] ?? ""}
                    onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button
        onClick={save}
        disabled={saving}
        className="bg-primary hover:bg-primary-dark text-white px-6 py-2.5 rounded-lg transition-colors font-medium disabled:opacity-50"
      >
        {saving ? "Сохранение..." : "Сохранить изменения"}
      </button>
    </div>
  );
}

interface PresBlock {
  id: string;
  order: number;
  layout: string;
  bgColor: string;
  align: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  text: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
}

type PresForm = Omit<PresBlock, "id" | "order">;

const PRES_EMPTY: PresForm = {
  layout: "split-right", bgColor: "white", align: "left", eyebrow: "", title: "",
  subtitle: "", text: "", imageUrl: "", buttonText: "", buttonLink: "", active: true,
};

const PRES_LAYOUTS: { value: string; label: string }[] = [
  { value: "hero", label: "Hero — крупный вступительный экран" },
  { value: "split-right", label: "Текст слева / изображение справа" },
  { value: "split-left", label: "Изображение слева / текст справа" },
  { value: "features", label: "Преимущества (сетка карточек)" },
  { value: "stats", label: "Цифры / статистика" },
  { value: "quote", label: "Цитата / отзыв" },
  { value: "banner", label: "Баннер с кнопкой" },
  { value: "cta", label: "Призыв к действию" },
];

const PRES_BG: { value: string; label: string }[] = [
  { value: "white", label: "Белый" },
  { value: "light", label: "Светло-серый" },
  { value: "gradient", label: "Градиент (анимированный)" },
  { value: "primary", label: "Синий (фирменный)" },
  { value: "accent", label: "Оранжевый (акцент)" },
  { value: "dark", label: "Тёмный" },
];

const PRES_ALIGN: { value: string; label: string }[] = [
  { value: "left", label: "По левому краю" },
  { value: "center", label: "По центру" },
];

function presLayoutLabel(value: string): string {
  return PRES_LAYOUTS.find((l) => l.value === value)?.label ?? value;
}

function presTextHint(layout: string): { label: string; hint: string; placeholder: string } {
  if (layout === "features") {
    return {
      label: "Карточки преимуществ",
      hint: "Каждая строка — отдельная карточка в формате: эмодзи | заголовок | описание",
      placeholder: "🚚 | Быстрая доставка | По Москве и МО от одного дня\n🛡️ | Гарантия качества | Проверенные поставщики",
    };
  }
  if (layout === "stats") {
    return {
      label: "Цифры",
      hint: "Каждая строка — отдельная цифра в формате: значение | подпись",
      placeholder: "10 000+ | товаров в каталоге\n5 лет | на рынке",
    };
  }
  return {
    label: "Основной текст",
    hint: "Каждая новая строка отображается как отдельный абзац.",
    placeholder: "Текст блока…",
  };
}

function PresentationPanel({ token }: { token: string }) {
  const [blocks, setBlocks] = useState<PresBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<PresForm>(PRES_EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/presentation", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setBlocks(await res.json());
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/presentation", { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok && !cancelled) setBlocks(await res.json());
      } catch {
        /* ignore */
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const resetForm = () => {
    setEditingId(null);
    setForm(PRES_EMPTY);
  };

  const startEdit = (block: PresBlock) => {
    setEditingId(block.id);
    setForm({
      layout: block.layout, bgColor: block.bgColor, align: block.align, eyebrow: block.eyebrow,
      title: block.title, subtitle: block.subtitle, text: block.text, imageUrl: block.imageUrl,
      buttonText: block.buttonText, buttonLink: block.buttonLink, active: block.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId
        ? { id: editingId, ...form }
        : { ...form, order: blocks.length };
      const res = await fetch("/api/admin/presentation", {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMsg(editingId ? "Блок сохранён" : "Блок добавлен");
        resetForm();
        await load();
      } else {
        const d = await res.json().catch(() => null);
        setMsg(d?.error ? `Ошибка: ${d.error}` : "Ошибка сохранения");
      }
    } catch {
      setMsg("Ошибка соединения с сервером");
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm("Удалить блок?")) return;
    await fetch("/api/admin/presentation", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id }),
    });
    if (editingId === id) resetForm();
    await load();
  };

  const toggleActive = async (block: PresBlock) => {
    await fetch("/api/admin/presentation", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...block, active: !block.active }),
    });
    await load();
  };

  const move = async (idx: number, dir: "up" | "down") => {
    const sorted = [...blocks].sort((a, b) => a.order - b.order);
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= sorted.length) return;
    [sorted[idx], sorted[target]] = [sorted[target], sorted[idx]];
    setBlocks(sorted.map((b, i) => ({ ...b, order: i })));
    await fetch("/api/admin/presentation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderedIds: sorted.map((b) => b.id) }),
    });
    await load();
  };

  const uploadImage = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("Максимальный размер файла: 10 МБ");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        alert("Ошибка загрузки изображения");
      }
    } catch {
      alert("Ошибка соединения с сервером");
    }
    setUploading(false);
  };

  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const textHint = presTextHint(form.layout);
  const usesImage = form.layout === "split-left" || form.layout === "split-right";

  if (loading) return <div className="text-center py-12 text-text-gray">Загрузка...</div>;

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-text-dark">Презентация — страница /presentation</h2>
          <p className="text-sm text-text-gray mt-1">
            Блоки анимированной презентационной страницы. Меняйте содержимое, макет, цвет фона и порядок.{" "}
            <a href="/presentation" target="_blank" rel="noreferrer" className="text-primary hover:underline">Открыть страницу →</a>
          </p>
        </div>
        {msg && <span className={`text-sm font-medium ${msg.startsWith("Ошибка") ? "text-danger" : "text-success"}`}>{msg}</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-bg-white rounded-xl border border-border p-5 lg:sticky lg:top-4 self-start">
          <h3 className="font-bold text-text-dark mb-4">{editingId ? "Редактировать блок" : "Добавить блок"}</h3>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="text-xs text-text-gray mb-1 block">Макет блока</label>
              <select value={form.layout} onChange={(e) => setForm({ ...form, layout: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                {PRES_LAYOUTS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-text-gray mb-1 block">Цвет фона</label>
                <select value={form.bgColor} onChange={(e) => setForm({ ...form, bgColor: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {PRES_BG.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-gray mb-1 block">Выравнивание</label>
                <select value={form.align} onChange={(e) => setForm({ ...form, align: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  {PRES_ALIGN.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>
            <input type="text" placeholder="Надзаголовок (маленькая метка)" value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <input type="text" placeholder="Заголовок" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <textarea placeholder="Подзаголовок" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} rows={2} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <div>
              <label className="text-xs text-text-gray mb-1 block">{textHint.label}</label>
              <textarea placeholder={textHint.placeholder} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <p className="text-xs text-text-light mt-1">{textHint.hint}</p>
            </div>
            {usesImage && (
              <div>
                <div className="flex gap-2">
                  <input type="text" placeholder="URL изображения" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                  <label className={`px-3 py-2 border border-border rounded-lg text-sm cursor-pointer transition-colors flex items-center gap-1 ${uploading ? "bg-primary/10 text-primary border-primary" : "bg-bg-light text-text-gray hover:text-primary"}`}>
                    {uploading ? "Загрузка..." : "Файл"}
                    <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); e.target.value = ""; }} />
                  </label>
                </div>
                <p className="text-xs text-text-light mt-1">Показывается только в макетах с изображением. Форматы: JPG, PNG, WEBP, SVG. Макс. 10 МБ</p>
                {form.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="Превью" className="w-full h-24 object-cover" />
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Текст кнопки" value={form.buttonText} onChange={(e) => setForm({ ...form, buttonText: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <input type="text" placeholder="Ссылка кнопки (/catalog)" value={form.buttonLink} onChange={(e) => setForm({ ...form, buttonLink: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <label className="flex items-center gap-2 text-sm text-text-gray">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="accent-primary" /> Показывать на сайте
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg disabled:opacity-50">{editingId ? "Сохранить" : "Добавить"}</button>
              {editingId && <button type="button" onClick={resetForm} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg">Отмена</button>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-bg-white rounded-xl border border-border p-5">
          <h3 className="font-bold text-text-dark mb-4">Блоки презентации ({sorted.length})</h3>
          <p className="text-xs text-text-gray mb-3">Стрелками меняйте порядок блоков сверху вниз.</p>
          {sorted.length === 0 ? (
            <p className="text-text-gray text-sm">Блоков пока нет. Добавьте первый блок слева.</p>
          ) : (
            <div className="space-y-2">
              {sorted.map((block, idx) => (
                <div key={block.id} className={`flex items-center gap-3 p-3 rounded-lg border ${block.active ? "bg-bg-light border-border" : "bg-red-50/50 border-red-200/50"}`}>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button onClick={() => move(idx, "up")} disabled={idx === 0} className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${idx === 0 ? "text-border cursor-not-allowed" : "text-text-gray hover:bg-primary hover:text-white"}`} title="Вверх">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button onClick={() => move(idx, "down")} disabled={idx === sorted.length - 1} className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${idx === sorted.length - 1 ? "text-border cursor-not-allowed" : "text-text-gray hover:bg-primary hover:text-white"}`} title="Вниз">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </div>
                  <span className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-dark text-sm truncate">{block.title || block.eyebrow || "Без заголовка"}</p>
                    <p className="text-xs text-text-gray truncate">{presLayoutLabel(block.layout)}</p>
                    <button onClick={() => toggleActive(block)} className={`text-xs ${block.active ? "text-success" : "text-danger"} hover:underline`}>{block.active ? "Активен" : "Скрыт"}</button>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEdit(block)} className="text-primary hover:underline text-sm">Изменить</button>
                    <button onClick={() => remove(block.id)} className="text-danger hover:underline text-sm">Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Раздел «Видео» — привязка роликов YouTube к товарам.
   Видео не загружается на сервер: админ вставляет ссылку, мы храним её и videoId,
   а на сайте показываем плеер YouTube в карточке товара над блоком отзывов.
   ========================================================================== */

interface AdminVideo {
  id: string;
  title: string;
  description: string;
  url: string;
  videoId: string;
  order: number;
  active: boolean;
  createdAt: string;
  product: { id: string; name: string; slug: string; image: string; code: string } | null;
}

interface VideoProduct {
  id: string;
  name: string;
  slug: string;
  image: string;
  code: string;
  categoryName: string;
}

function VideosPanel({ token }: { token: string }) {
  const [videos, setVideos] = useState<AdminVideo[]>([]);
  const [products, setProducts] = useState<VideoProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Форма добавления / редактирования
  const [prodQuery, setProdQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<VideoProduct | null>(null);
  const [showProdList, setShowProdList] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDesc, setVideoDesc] = useState("");
  const [videoActive, setVideoActive] = useState(true);
  const [editing, setEditing] = useState<AdminVideo | null>(null);
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  // Фильтры списка
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "hidden">("all");

  const authHeaders = useCallback(
    () => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }),
    [token],
  );

  const loadData = useCallback(async () => {
    const [vidRes, prodRes] = await Promise.all([
      fetch("/api/admin/videos", { headers: { Authorization: `Bearer ${token}` } }),
      fetch("/api/admin/products", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (vidRes.ok) setVideos(await vidRes.json());
    if (prodRes.ok) {
      const prods = await prodRes.json();
      // Сортируем по алфавиту: API отдаёт сначала новые, и тогда в списке без запроса
      // видны только последние импортированные товары, а видео можно прикрепить к любому.
      setProducts(
        prods
          .map((p: { id: string; name: string; slug: string; image: string; code?: string; category?: { name: string } }) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            image: p.image,
            code: p.code || "",
            categoryName: p.category?.name || "",
          }))
          .sort((a: VideoProduct, b: VideoProduct) => a.name.localeCompare(b.name, "ru")),
      );
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Поиск товара по названию, артикулу и категории — все три поля сразу, чтобы не приходилось
  // угадывать точное название из прайс-листа.
  const productMatches = (() => {
    const q = prodQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q),
      )
      .slice(0, 30);
  })();

  const pickProduct = (p: VideoProduct) => {
    setSelectedProduct(p);
    setProdQuery(p.name);
    setShowProdList(false);
  };

  // Сколько видео уже у товара — показываем в строке поиска, чтобы было видно,
  // у каких товаров видео ещё нет.
  const videoCountByProduct = videos.reduce<Record<string, number>>((acc, v) => {
    if (v.product) acc[v.product.id] = (acc[v.product.id] || 0) + 1;
    return acc;
  }, {});

  const previewId = extractYouTubeId(videoUrl);

  const resetForm = () => {
    setEditing(null);
    setSelectedProduct(null);
    setProdQuery("");
    setVideoUrl("");
    setVideoTitle("");
    setVideoDesc("");
    setVideoActive(true);
    setFormMsg("");
  };

  const startEdit = (v: AdminVideo) => {
    setEditing(v);
    setVideoUrl(v.url);
    setVideoTitle(v.title);
    setVideoDesc(v.description);
    setVideoActive(v.active);
    setFormMsg("");
    if (v.product) {
      const full = products.find((p) => p.id === v.product?.id);
      setSelectedProduct(
        full || { id: v.product.id, name: v.product.name, slug: v.product.slug, image: v.product.image, code: v.product.code, categoryName: "" },
      );
      setProdQuery(v.product.name);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg("");
    if (!selectedProduct) {
      setFormMsg("Выберите товар");
      return;
    }
    if (!videoUrl.trim()) {
      setFormMsg("Вставьте ссылку на видео YouTube");
      return;
    }
    if (!previewId) {
      setFormMsg("Ссылка не похожа на видео YouTube");
      return;
    }

    setSaving(true);
    const payload = {
      productId: selectedProduct.id,
      url: videoUrl.trim(),
      title: videoTitle.trim(),
      description: videoDesc.trim(),
      active: videoActive,
    };
    const res = await fetch("/api/admin/videos", {
      method: editing ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(editing ? { id: editing.id, ...payload } : payload),
    });
    setSaving(false);

    if (res.ok) {
      const wasEditing = !!editing;
      resetForm();
      setFormMsg(wasEditing ? "Видео обновлено" : "Видео прикреплено к товару");
      loadData();
      setTimeout(() => setFormMsg(""), 3000);
    } else {
      const err = await res.json();
      setFormMsg(err.error || "Ошибка");
    }
  };

  const toggleActive = async (v: AdminVideo) => {
    await fetch("/api/admin/videos", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ id: v.id, active: !v.active }),
    });
    loadData();
  };

  const removeVideo = async (id: string) => {
    if (!confirm("Удалить видео?")) return;
    await fetch("/api/admin/videos", { method: "DELETE", headers: authHeaders(), body: JSON.stringify({ id }) });
    if (editing?.id === id) resetForm();
    loadData();
  };

  // Порядок меняется только внутри одного товара: в карточке товара видео выводятся
  // именно в этом порядке, а глобальной очерёдности у видео нет.
  const moveVideo = async (group: AdminVideo[], index: number, dir: "up" | "down") => {
    const target = dir === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= group.length) return;
    const reordered = [...group];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await fetch("/api/admin/videos", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ orderedIds: reordered.map((v) => v.id) }),
    });
    loadData();
  };

  const filteredVideos = videos.filter((v) => {
    if (activeFilter === "active" && !v.active) return false;
    if (activeFilter === "hidden" && v.active) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (v.product?.name.toLowerCase().includes(q) ?? false) ||
        (v.product?.code.toLowerCase().includes(q) ?? false) ||
        v.title.toLowerCase().includes(q) ||
        v.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Группировка по товарам: админу удобнее видеть «товар → его видео», а не плоский список.
  const groups = (() => {
    const map = new Map<string, { product: AdminVideo["product"]; items: AdminVideo[] }>();
    for (const v of filteredVideos) {
      const key = v.product?.id || "—";
      if (!map.has(key)) map.set(key, { product: v.product, items: [] });
      map.get(key)!.items.push(v);
    }
    return Array.from(map.values())
      .map((g) => ({ ...g, items: g.items.sort((a, b) => a.order - b.order) }))
      .sort((a, b) => (a.product?.name || "").localeCompare(b.product?.name || "", "ru"));
  })();

  if (loading) return <p className="text-text-gray">Загрузка...</p>;

  return (
    <div className="space-y-6">
      {/* Форма привязки видео к товару */}
      <div className="bg-bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-text-dark">
            {editing ? "Изменить видео" : "Прикрепить видео с YouTube к товару"}
          </h2>
          {editing && (
            <button onClick={resetForm} className="text-sm text-text-gray hover:text-danger">
              Отменить редактирование
            </button>
          )}
        </div>

        <form onSubmit={saveVideo} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Левая колонка: товар + ссылка */}
          <div className="space-y-3">
            <div className="relative">
              <label className="text-sm text-text-gray mb-1 block">Товар — поиск по названию, артикулу или категории</label>
              <input
                type="text"
                value={prodQuery}
                onChange={(e) => {
                  setProdQuery(e.target.value);
                  setSelectedProduct(null);
                  setShowProdList(true);
                }}
                onFocus={() => setShowProdList(true)}
                placeholder="Начните вводить название товара..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              {showProdList && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-bg-white border border-border rounded-lg shadow-lg">
                  {productMatches.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-text-gray">Товары не найдены</p>
                  ) : (
                    productMatches.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => pickProduct(p)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-light text-left"
                      >
                        <span className="w-9 h-9 flex-shrink-0 bg-bg-light rounded overflow-hidden flex items-center justify-center">
                          {p.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image} alt="" className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-text-light text-sm">📦</span>
                          )}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-text-dark truncate">{p.name}</span>
                          <span className="block text-xs text-text-gray truncate">
                            {p.code ? `Арт. ${p.code}` : p.categoryName}
                            {videoCountByProduct[p.id] ? ` · видео: ${videoCountByProduct[p.id]}` : ""}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                  <button
                    type="button"
                    onClick={() => setShowProdList(false)}
                    className="w-full px-3 py-2 text-xs text-text-gray hover:text-text-dark border-t border-border"
                  >
                    Закрыть список
                  </button>
                </div>
              )}
            </div>

            {/* Карточка выбранного товара — визуальное подтверждение, что выбран нужный товар */}
            {selectedProduct && (
              <div className="flex items-center gap-3 p-3 bg-bg-light rounded-lg border border-border">
                <span className="w-14 h-14 flex-shrink-0 bg-bg-white rounded overflow-hidden flex items-center justify-center">
                  {selectedProduct.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedProduct.image} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-text-light text-xl">📦</span>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-dark truncate">{selectedProduct.name}</p>
                  <p className="text-xs text-text-gray truncate">
                    {selectedProduct.code ? `Арт. ${selectedProduct.code} · ` : ""}
                    видео у товара: {videoCountByProduct[selectedProduct.id] || 0}
                  </p>
                  <a
                    href={`/product/${selectedProduct.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Открыть карточку товара
                  </a>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm text-text-gray mb-1 block">Ссылка на видео YouTube</label>
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <p className="text-xs text-text-gray mt-1">
                Поддерживаются ссылки watch, youtu.be, shorts, embed и live.
              </p>
              {videoUrl.trim() && !previewId && (
                <p className="text-xs text-danger mt-1">Ссылка не распознана как видео YouTube</p>
              )}
            </div>

            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Название видео (необязательно)"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <textarea
              value={videoDesc}
              onChange={(e) => setVideoDesc(e.target.value)}
              rows={3}
              placeholder="Краткое описание под видео (необязательно)"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary resize-none"
            />
            <label className="flex items-center gap-2 text-sm text-text-gray">
              <input type="checkbox" checked={videoActive} onChange={(e) => setVideoActive(e.target.checked)} />
              Показывать покупателям в карточке товара
            </label>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? "Сохранение..." : editing ? "Сохранить" : "Прикрепить видео"}
              </button>
              {formMsg && (
                <span
                  className={`text-sm ${
                    formMsg.includes("прикреплено") || formMsg.includes("обновлено") ? "text-success" : "text-danger"
                  }`}
                >
                  {formMsg}
                </span>
              )}
            </div>
          </div>

          {/* Правая колонка: предпросмотр ролика */}
          <div>
            <label className="text-sm text-text-gray mb-1 block">Предпросмотр</label>
            {previewId ? (
              <div className="rounded-lg overflow-hidden border border-border bg-black aspect-video">
                <iframe
                  src={`{{https://www.youtube-nocookie.com/embed/${previewId}}}?rel=0&modestbranding=1`}
                  title="Предпросмотр видео"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-bg-light aspect-video flex items-center justify-center text-center px-4">
                <p className="text-sm text-text-gray">
                  Вставьте ссылку на видео — здесь появится предпросмотр плеера
                </p>
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Список видео по товарам */}
      <div className="bg-bg-white rounded-xl border border-border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-bold text-text-dark">
            Видео ({filteredVideos.length}
            {filteredVideos.length !== videos.length ? ` из ${videos.length}` : ""})
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по товару, артикулу или названию видео"
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary w-full sm:w-72"
            />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as "all" | "active" | "hidden")}
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="all">Все</option>
              <option value="active">Показываются</option>
              <option value="hidden">Скрытые</option>
            </select>
          </div>
        </div>

        {groups.length === 0 ? (
          <p className="text-text-gray text-sm">
            {videos.length === 0 ? "Видео пока не прикреплены." : "Ничего не найдено по заданным условиям."}
          </p>
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.product?.id || "none"}>
                <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
                  <span className="w-9 h-9 flex-shrink-0 bg-bg-light rounded overflow-hidden flex items-center justify-center">
                    {group.product?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={group.product.image} alt="" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-text-light text-sm">📦</span>
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text-dark truncate">
                      {group.product?.name || "Товар удалён"}
                    </p>
                    {group.product && (
                      <a
                        href={`/product/${group.product.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Открыть карточку
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-text-gray flex-shrink-0">{group.items.length} видео</span>
                </div>

                <div className="space-y-3">
                  {group.items.map((v, idx) => (
                    <div
                      key={v.id}
                      className="flex flex-col sm:flex-row gap-3 p-3 bg-bg-light rounded-lg border border-border"
                    >
                      <a
                        href={`https://www.youtube.com/watch?v=${v.videoId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full sm:w-40 flex-shrink-0 aspect-video rounded overflow-hidden bg-black"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`{{https://img.youtube.com/vi/${v.videoId}}}/hqdefault.jpg`}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </a>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-dark">{v.title || "Без названия"}</p>
                        {v.description && (
                          <p className="text-xs text-text-gray mt-0.5 line-clamp-2">{v.description}</p>
                        )}
                        <p className="text-xs text-text-light mt-1 break-all">{v.url}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <button
                            onClick={() => toggleActive(v)}
                            className={`text-xs ${v.active ? "text-success" : "text-danger"} hover:underline`}
                          >
                            {v.active ? "Показывается" : "Скрыто"}
                          </button>
                          <button onClick={() => startEdit(v)} className="text-xs text-primary hover:underline">
                            Изменить
                          </button>
                          <button onClick={() => removeVideo(v.id)} className="text-xs text-danger hover:underline">
                            Удалить
                          </button>
                        </div>
                      </div>

                      {/* Порядок показа в карточке товара */}
                      {group.items.length > 1 && (
                        <div className="flex sm:flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => moveVideo(group.items, idx, "up")}
                            disabled={idx === 0}
                            title="Выше"
                            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                              idx === 0 ? "text-border cursor-not-allowed" : "text-text-gray hover:bg-primary hover:text-white"
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => moveVideo(group.items, idx, "down")}
                            disabled={idx === group.items.length - 1}
                            title="Ниже"
                            className={`w-7 h-7 flex items-center justify-center rounded transition-colors ${
                              idx === group.items.length - 1
                                ? "text-border cursor-not-allowed"
                                : "text-text-gray hover:bg-primary hover:text-white"
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
