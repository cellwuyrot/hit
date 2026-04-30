"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  order: number;
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

interface SliderImage {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
  order: number;
  active: boolean;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [activeTab, setActiveTab] = useState<"categories" | "products" | "slider">("categories");

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [slides, setSlides] = useState<SliderImage[]>([]);

  // Category form
  const [catName, setCatName] = useState("");
  const [catOrder, setCatOrder] = useState(0);
  const [editingCat, setEditingCat] = useState<Category | null>(null);

  // Product form
  const [prodForm, setProdForm] = useState({
    name: "", description: "", price: "", oldPrice: "", image: "",
    inStock: "0", brand: "", color: "", productType: "", categoryId: "",
  });
  const [editingProd, setEditingProd] = useState<Product | null>(null);

  // Slider form
  const [slideForm, setSlideForm] = useState({
    title: "", subtitle: "", imageUrl: "", link: "", order: "0", active: true,
  });
  const [editingSlide, setEditingSlide] = useState<SliderImage | null>(null);

  const headers = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    const [catRes, prodRes, slideRes] = await Promise.all([
      fetch("/api/admin/categories", { headers: headers() }),
      fetch("/api/admin/products", { headers: headers() }),
      fetch("/api/admin/slider", { headers: headers() }),
    ]);
    if (catRes.ok) setCategories(await catRes.json());
    if (prodRes.ok) setProducts(await prodRes.json());
    if (slideRes.ok) setSlides(await slideRes.json());
  }, [token, headers]);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token");
    if (saved) {
      // Need to set from localStorage on mount
      startTransition(() => setToken(saved));
    }
  }, []);

  useEffect(() => {
    // Load data whenever token changes
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

  const logout = () => {
    setToken("");
    localStorage.removeItem("admin_token");
  };

  // Category CRUD
  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCat ? "PUT" : "POST";
    const body = editingCat
      ? { id: editingCat.id, name: catName, order: catOrder }
      : { name: catName, order: catOrder };
    await fetch("/api/admin/categories", { method, headers: headers(), body: JSON.stringify(body) });
    setCatName("");
    setCatOrder(0);
    setEditingCat(null);
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Удалить категорию? Все товары в ней также будут удалены.")) return;
    await fetch("/api/admin/categories", {
      method: "DELETE", headers: headers(), body: JSON.stringify({ id }),
    });
    fetchData();
  };

  // Product CRUD
  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProd ? "PUT" : "POST";
    const body = editingProd ? { id: editingProd.id, ...prodForm } : prodForm;
    await fetch("/api/admin/products", { method, headers: headers(), body: JSON.stringify(body) });
    setProdForm({ name: "", description: "", price: "", oldPrice: "", image: "", inStock: "0", brand: "", color: "", productType: "", categoryId: "" });
    setEditingProd(null);
    fetchData();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Удалить товар?")) return;
    await fetch("/api/admin/products", {
      method: "DELETE", headers: headers(), body: JSON.stringify({ id }),
    });
    fetchData();
  };

  // Slider CRUD
  const saveSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingSlide ? "PUT" : "POST";
    const body = editingSlide ? { id: editingSlide.id, ...slideForm, order: Number(slideForm.order) } : { ...slideForm, order: Number(slideForm.order) };
    await fetch("/api/admin/slider", { method, headers: headers(), body: JSON.stringify(body) });
    setSlideForm({ title: "", subtitle: "", imageUrl: "", link: "", order: "0", active: true });
    setEditingSlide(null);
    fetchData();
  };

  const deleteSlide = async (id: string) => {
    if (!confirm("Удалить слайд?")) return;
    await fetch("/api/admin/slider", {
      method: "DELETE", headers: headers(), body: JSON.stringify({ id }),
    });
    fetchData();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-bg-light flex items-center justify-center px-4">
        <div className="bg-bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-2xl">М</span>
            </div>
            <h1 className="text-xl font-bold text-text-dark">Админ-панель</h1>
            <p className="text-sm text-text-gray mt-1">Введите данные для входа</p>
          </div>
          <form onSubmit={login} className="space-y-4">
            <input
              type="text"
              placeholder="Логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
            />
            {loginError && <p className="text-danger text-sm">{loginError}</p>}
            <button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 rounded-lg transition-colors">
              Войти
            </button>
          </form>
          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-primary hover:underline">← На главную</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Admin header */}
      <header className="bg-bg-white shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">М</span>
            </div>
            <h1 className="text-lg font-bold text-text-dark">Админ-панель</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-primary hover:underline">На сайт</Link>
            <button onClick={logout} className="text-sm text-danger hover:underline">Выйти</button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["categories", "products", "slider"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                activeTab === tab ? "bg-primary text-white" : "bg-bg-white text-text-gray hover:text-text-dark border border-border"
              }`}
            >
              {tab === "categories" ? "Категории" : tab === "products" ? "Товары" : "Слайдер"}
            </button>
          ))}
        </div>

        {/* Categories tab */}
        {activeTab === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">{editingCat ? "Редактировать" : "Добавить"} категорию</h2>
              <form onSubmit={saveCategory} className="space-y-3">
                <input
                  type="text"
                  placeholder="Название категории"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <input
                  type="number"
                  placeholder="Порядок"
                  value={catOrder}
                  onChange={(e) => setCatOrder(Number(e.target.value))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg transition-colors">
                    {editingCat ? "Сохранить" : "Добавить"}
                  </button>
                  {editingCat && (
                    <button type="button" onClick={() => { setEditingCat(null); setCatName(""); setCatOrder(0); }}
                      className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg hover:bg-border transition-colors">
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Все категории ({categories.length})</h2>
              {categories.length === 0 ? (
                <p className="text-text-gray text-sm">Категорий пока нет</p>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-bg-light rounded-lg">
                      <div>
                        <span className="font-medium text-text-dark">{cat.name}</span>
                        <span className="text-text-light text-sm ml-2">({cat._count?.products || 0} товаров)</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatOrder(cat.order); }}
                          className="text-primary hover:underline text-sm"
                        >
                          Изменить
                        </button>
                        <button onClick={() => deleteCategory(cat.id)} className="text-danger hover:underline text-sm">
                          Удалить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">{editingProd ? "Редактировать" : "Добавить"} товар</h2>
              <form onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <input type="text" placeholder="Название *" value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} required
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="Цена *" value={prodForm.price}
                  onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })} required
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="Старая цена" value={prodForm.oldPrice}
                  onChange={(e) => setProdForm({ ...prodForm, oldPrice: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="URL изображения" value={prodForm.image}
                  onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="В наличии" value={prodForm.inStock}
                  onChange={(e) => setProdForm({ ...prodForm, inStock: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Бренд" value={prodForm.brand}
                  onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Цвет" value={prodForm.color}
                  onChange={(e) => setProdForm({ ...prodForm, color: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Тип товара" value={prodForm.productType}
                  onChange={(e) => setProdForm({ ...prodForm, productType: e.target.value })}
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <select value={prodForm.categoryId}
                  onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })} required
                  className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary">
                  <option value="">Выберите категорию *</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <textarea placeholder="Описание" value={prodForm.description}
                  onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  className="md:col-span-2 lg:col-span-3 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" rows={2} />
                <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                  <button type="submit" className="bg-primary hover:bg-primary-dark text-white text-sm px-6 py-2 rounded-lg transition-colors">
                    {editingProd ? "Сохранить" : "Добавить"}
                  </button>
                  {editingProd && (
                    <button type="button" onClick={() => {
                      setEditingProd(null);
                      setProdForm({ name: "", description: "", price: "", oldPrice: "", image: "", inStock: "0", brand: "", color: "", productType: "", categoryId: "" });
                    }} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg hover:bg-border transition-colors">
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Все товары ({products.length})</h2>
              {products.length === 0 ? (
                <p className="text-text-gray text-sm">Товаров пока нет</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-text-gray font-medium">Название</th>
                        <th className="text-left py-2 px-2 text-text-gray font-medium">Категория</th>
                        <th className="text-right py-2 px-2 text-text-gray font-medium">Цена</th>
                        <th className="text-right py-2 px-2 text-text-gray font-medium">В наличии</th>
                        <th className="text-right py-2 px-2 text-text-gray font-medium">Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((prod) => (
                        <tr key={prod.id} className="border-b border-border/50 hover:bg-bg-light">
                          <td className="py-2 px-2 text-text-dark">{prod.name}</td>
                          <td className="py-2 px-2 text-text-gray">{prod.category?.name}</td>
                          <td className="py-2 px-2 text-right text-text-dark font-medium">{prod.price.toLocaleString("ru-RU")} ₽</td>
                          <td className="py-2 px-2 text-right">{prod.inStock}</td>
                          <td className="py-2 px-2 text-right">
                            <button onClick={() => {
                              setEditingProd(prod);
                              setProdForm({
                                name: prod.name, description: prod.description, price: String(prod.price),
                                oldPrice: prod.oldPrice ? String(prod.oldPrice) : "", image: prod.image,
                                inStock: String(prod.inStock), brand: prod.brand, color: prod.color,
                                productType: prod.productType, categoryId: prod.categoryId,
                              });
                            }} className="text-primary hover:underline mr-2">Изменить</button>
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

        {/* Slider tab */}
        {activeTab === "slider" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">{editingSlide ? "Редактировать" : "Добавить"} слайд</h2>
              <form onSubmit={saveSlide} className="space-y-3">
                <input type="text" placeholder="Заголовок" value={slideForm.title}
                  onChange={(e) => setSlideForm({ ...slideForm, title: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Подзаголовок" value={slideForm.subtitle}
                  onChange={(e) => setSlideForm({ ...slideForm, subtitle: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="URL изображения *" value={slideForm.imageUrl}
                  onChange={(e) => setSlideForm({ ...slideForm, imageUrl: e.target.value })} required
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="text" placeholder="Ссылка" value={slideForm.link}
                  onChange={(e) => setSlideForm({ ...slideForm, link: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <input type="number" placeholder="Порядок" value={slideForm.order}
                  onChange={(e) => setSlideForm({ ...slideForm, order: e.target.value })}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <label className="flex items-center gap-2 text-sm text-text-gray">
                  <input type="checkbox" checked={slideForm.active}
                    onChange={(e) => setSlideForm({ ...slideForm, active: e.target.checked })}
                    className="accent-primary" />
                  Активен
                </label>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 bg-primary hover:bg-primary-dark text-white text-sm py-2 rounded-lg transition-colors">
                    {editingSlide ? "Сохранить" : "Добавить"}
                  </button>
                  {editingSlide && (
                    <button type="button" onClick={() => {
                      setEditingSlide(null);
                      setSlideForm({ title: "", subtitle: "", imageUrl: "", link: "", order: "0", active: true });
                    }} className="px-4 bg-bg-light text-text-gray text-sm py-2 rounded-lg hover:bg-border transition-colors">
                      Отмена
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 bg-bg-white rounded-xl border border-border p-5">
              <h2 className="font-bold text-text-dark mb-4">Все слайды ({slides.length})</h2>
              {slides.length === 0 ? (
                <p className="text-text-gray text-sm">Слайдов пока нет</p>
              ) : (
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
                        <span className={`text-xs ${slide.active ? "text-success" : "text-danger"}`}>
                          {slide.active ? "Активен" : "Скрыт"}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => {
                          setEditingSlide(slide);
                          setSlideForm({
                            title: slide.title, subtitle: slide.subtitle, imageUrl: slide.imageUrl,
                            link: slide.link, order: String(slide.order), active: slide.active,
                          });
                        }} className="text-primary hover:underline text-sm">Изменить</button>
                        <button onClick={() => deleteSlide(slide.id)} className="text-danger hover:underline text-sm">Удалить</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
