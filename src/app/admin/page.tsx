"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
  parentId?: string | null;
  _count?: { products: number };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  oldPrice: number | null;
  image: string;
  inStock: number;
  brand: string;
  color: string;
  productType: string;
  categoryId: string;
  category?: Category;
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

type TabType = "categories" | "products" | "slider" | "news" | "orders" | "bulk-orders";

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("categories");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [slides, setSlides] = useState<SliderImage[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [catName, setCatName] = useState("");
  const [catOrder, setCatOrder] = useState(0);
  const [catParentId, setCatParentId] = useState("");
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  const [prodForm, setProdForm] = useState({
    name: "", description: "", price: "", oldPrice: "", image: "",
    inStock: "0", brand: "", color: "", productType: "", categoryId: "",
  });
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  const [slideForm, setSlideForm] = useState({
    title: "", subtitle: "", imageUrl: "", link: "", order: "0", active: true,
  });
  const [editingSlide, setEditingSlide] = useState<SliderImage | null>(null);

  const [newsForm, setNewsForm] = useState({ title: "", content: "", image: "", type: "article", published: false });
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
    const [catRes, prodRes, slideRes, newsRes, ordersRes] = await Promise.all([
      fetch("/api/admin/categories", { headers: hdrs() }),
      fetch("/api/admin/products", { headers: hdrs() }),
      fetch("/api/admin/slider", { headers: hdrs() }),
      fetch("/api/admin/news", { headers: hdrs() }),
      fetch("/api/admin/orders", { headers: hdrs() }),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (prodRes.ok) setProducts(await prodRes.json());
    if (slideRes.ok) setSlides(await slideRes.json());
    if (newsRes.ok) setNews(await newsRes.json());
    if (ordersRes.ok) setOrders(await ordersRes.json());
  }, [token, hdrs]);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) startTransition(() => setToken(saved));
  }, []);

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
  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCat ? "PUT" : "POST";
    const body = editingCat
      ? { id: editingCat.id, name: catName, order: catOrder, parentId: catParentId || null }
      : { name: catName, order: catOrder, parentId: catParentId || null };
    await fetch("/api/admin/categories", { method, headers: hdrs(), body: JSON.stringify(body) });
    setCatName(""); setCatOrder(0); setCatParentId(""); setEditingCat(null);
    fetchData();
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
    setProdForm({ name: "", description: "", price: "", oldPrice: "", image: "", inStock: "0", brand: "", color: "", productType: "", categoryId: "" });
    setEditingProd(null); fetchData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    await fetch("/api/admin/products", { method: "DELETE", headers: hdrs(), body: JSON.stringify({ id }) });
    fetchData();
  };

  // Slider CRUD
  const saveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSlide ? "PUT" : "POST";
    const body = editingSlide ? { id: editingSlide.id, ...slideForm, order: Number(slideForm.order) } : { ...slideForm, order: Number(slideForm.order) };
    await fetch("/api/admin/slider", { method, headers: hdrs(), body: JSON.stringify(body) });
    setSlideForm({ title: "", subtitle: "", imageUrl: "", link: "", order: "0", active: true });
    setEditingSlide(null); fetchData();
  };

  const deleteSlide = async (id: string) => {
    if (!confirm("Удалить слайд?")) return;
    await fetch("/api/admin/slider", { method: "DELETE", headers: hdrs(), body: JSON.stringify({ id }) });
    fetchData();
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
    { value: "description", label: "Описание" },
    { value: "oldPrice", label: "Старая цена" },
    { value: "color", label: "Цвет" },
    { value: "productType", label: "Тип/Вид" },
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
      const res = await fetch("/api/admin/import/parse", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
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
    const data = await res.json();
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
    setNewsForm({ title: "", content: "", image: "", type: "article", published: false });
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
    categories: "Категории", products: "Товары", slider: "Слайдер", news: "Новости", orders: `Заказы (${orders.length})`, "bulk-orders": "Оптовые",
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

        {/* Categories */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">{editingCat ? "Редактировать" : "Добавить"} категорию</h2>
              <form onSubmit={saveCategory} className="space-y-3">
                <input type="text" placeholder="Название" value={catName} onChange={(e) => setCatName(e.target.value)} required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <select value={catParentId} onChange={(e) => setCatParentId(e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">Корневая категория</option>
                  {topCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input type="number" placeholder="Порядок" value={catOrder} onChange={(e) => setCatOrder(Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg">{editingCat ? "Сохранить" : "Добавить"}</button>
                  {editingCat && <button type="button" onClick={() => { setEditingCat(null); setCatName(""); setCatOrder(0); setCatParentId(""); }} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg">Отмена</button>}
                </div>
              </form>
            </div>
            <div className="lg:col-span-2 bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Все категории ({categories.length})</h2>
              {categories.length === 0 ? <p className="text-text-gray text-sm">Категорий пока нет</p> : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className={`flex items-center justify-between p-3 rounded-lg ${cat.parentId ? "bg-bg-light/50 ml-6 border-l-2 border-primary/20" : "bg-bg-light"}`}>
                      <div>
                        <span className="font-medium text-text-dark">{cat.name}</span>
                        {cat.parentId && <span className="text-xs text-primary ml-2">подкатегория</span>}
                        <span className="text-text-light text-sm ml-2">({cat._count?.products || 0} товаров)</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatOrder(cat.order); setCatParentId(cat.parentId || ""); }} className="text-primary hover:underline text-sm">Изменить</button>
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
                <input type="text" placeholder="URL изображения" value={prodForm.image} onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="В наличии" value={prodForm.inStock} onChange={(e) => setProdForm({ ...prodForm, inStock: e.target.value })}
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
                <textarea placeholder="Описание" value={prodForm.description} onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="md:col-span-2 lg:col-span-3 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={2} />
                <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                  <button type="submit" className="bg-primary hover:bg-primary-dark text-white text-sm px-6 py-2 rounded-lg">{editingProd ? "Сохранить" : "Добавить"}</button>
                  {editingProd && <button type="button" onClick={() => { setEditingProd(null); setProdForm({ name: "", description: "", price: "", oldPrice: "", image: "", inStock: "0", brand: "", color: "", productType: "", categoryId: "" }); }} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg">Отмена</button>}
                </div>
              </form>
            </div>
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Все товары ({products.length})</h2>
              {products.length === 0 ? <p className="text-text-gray text-sm">Товаров пока нет</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-border">
                      <th className="text-left py-2 px-2 text-text-gray font-medium">Название</th>
                      <th className="text-left py-2 px-2 text-text-gray font-medium">Категория</th>
                      <th className="text-right py-2 px-2 text-text-gray font-medium">Цена</th>
                      <th className="text-right py-2 px-2 text-text-gray font-medium">В наличии</th>
                      <th className="text-right py-2 px-2 text-text-gray font-medium">Действия</th>
                    </tr></thead>
                    <tbody>
                      {products.map((prod) => (
                        <tr key={prod.id} className="border-b border-border/50 hover:bg-bg-light">
                          <td className="py-2 px-2 text-text-dark">{prod.name}</td>
                          <td className="py-2 px-2 text-text-gray">{prod.category?.name}</td>
                          <td className="py-2 px-2 text-right font-medium">{prod.price.toLocaleString("ru-RU")} ₽</td>
                          <td className="py-2 px-2 text-right">{prod.inStock}</td>
                          <td className="py-2 px-2 text-right whitespace-nowrap">
                            <button onClick={() => searchProduct(prod.name)} className="text-accent hover:underline mr-2" title="Поиск в интернете">
                              <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </button>
                            <button onClick={() => { setEditingProd(prod); setProdForm({ name: prod.name, description: prod.description, price: String(prod.price), oldPrice: prod.oldPrice ? String(prod.oldPrice) : "", image: prod.image, inStock: String(prod.inStock), brand: prod.brand, color: prod.color, productType: prod.productType, categoryId: prod.categoryId }); }} className="text-primary hover:underline mr-2">Изменить</button>
                            <button onClick={() => deleteProduct(prod.id)} className="text-danger hover:underline">Удалить</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                <input type="text" placeholder="URL изображения *" value={slideForm.imageUrl} onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })} required className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Ссылка" value={slideForm.link} onChange={(e) => setSlideForm({ ...slideForm, link: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="Порядок" value={slideForm.order} onChange={(e) => setSlideForm({ ...slideForm, order: e.target.value })} className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
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
              <h2 className="font-bold text-text-dark mb-4">Все слайды ({slides.length})</h2>
              {slides.length === 0 ? <p className="text-text-gray text-sm">Слайдов пока нет</p> : (
                <div className="space-y-3">
                  {slides.map((slide) => (
                    <div key={slide.id} className="flex items-center gap-4 p-3 bg-bg-light rounded-lg">
                      <div className="w-24 h-16 bg-border rounded overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slide.imageUrl} alt={slide.title || "слайд"} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-text-dark truncate">{slide.title || "Без названия"}</p>
                        <p className="text-xs text-text-gray">{slide.subtitle}</p>
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

        {/* News */}
        {activeTab === "news" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">{editingNews ? "Редактировать" : "Создать"} новость</h2>
              <form onSubmit={saveNews} className="space-y-3">
                <input type="text" placeholder="Заголовок *" value={newsForm.title} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="URL изображения" value={newsForm.image} onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <select value={newsForm.type} onChange={(e) => setNewsForm({ ...newsForm, type: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="article">Статья</option>
                  <option value="delivery">Поставка</option>
                </select>
                <div>
                  <label className="text-xs text-text-gray mb-1 block">Содержание (поддерживает HTML: &lt;a href=&quot;...&quot;&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;p&gt;)</label>
                  <textarea placeholder="Текст новости с HTML-разметкой..." value={newsForm.content} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary font-mono" rows={8} />
                </div>
                <label className="flex items-center gap-2 text-sm text-text-gray">
                  <input type="checkbox" checked={newsForm.published} onChange={(e) => setNewsForm({ ...newsForm, published: e.target.checked })} className="accent-primary" /> Опубликовать
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg">{editingNews ? "Сохранить" : "Создать"}</button>
                  {editingNews && <button type="button" onClick={() => { setEditingNews(null); setNewsForm({ title: "", content: "", image: "", type: "article", published: false }); }} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg">Отмена</button>}
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
                        <button onClick={() => { setEditingNews(item); setNewsForm({ title: item.title, content: item.content, image: item.image, type: item.type || "article", published: item.published }); }} className="text-primary hover:underline text-sm">Изменить</button>
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
                      <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="border border-border rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-primary">
                        {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* Bulk Orders info */}
        {activeTab === "bulk-orders" && (
          <div className="bg-bg-white rounded-xl border border-border p-5">
            <h2 className="font-bold text-text-dark mb-4">Оптовые заказы</h2>
            <p className="text-text-gray text-sm mb-4">Раздел оптовых продаж доступен на сайте по адресу <a href="/wholesale" target="_blank" className="text-primary hover:underline">/wholesale</a></p>
            <p className="text-text-gray text-sm">Оптовые заявки поступают на email <strong>opt@топхит.store</strong> и по телефону <strong>+7 (936) 256-89-50</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}
