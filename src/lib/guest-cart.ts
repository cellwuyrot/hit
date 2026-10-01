export type GuestCartItem = { productId: string; quantity: number; isPack: boolean };
const KEY = "guestCart";
export function readGuestCart(): GuestCartItem[] {
  try {
    const rows = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(rows)) return [];
    return rows.filter(i => i && typeof i.productId === "string" && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 10_000)
      .map(i => ({ productId: i.productId, quantity: i.quantity, isPack: i.isPack === true })).slice(0, 200);
  } catch { return []; }
}
export function writeGuestCart(items: GuestCartItem[]) {
  // В localStorage нет цен и скидок — только ссылки на товары и количество.
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-updated"));
}
export function setGuestQuantity(productId: string, quantity: number, isPack = false) {
  const items = readGuestCart().filter(i => !(i.productId === productId && i.isPack === isPack));
  if (quantity > 0) {
    if (!Number.isInteger(quantity) || quantity > 10_000) throw new Error("Некорректное количество");
    items.push({ productId, quantity, isPack });
  }
  writeGuestCart(items);
}
export async function addCartItem(productId: string, quantity = 1, isPack = false) {
  const token = localStorage.getItem("userToken");
  if (!token) {
    const old = readGuestCart().find(i => i.productId === productId && i.isPack === isPack);
    setGuestQuantity(productId, (old?.quantity ?? 0) + quantity, isPack);
  } else {
    const response = await fetch("/api/user/cart", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId, quantity, isPack }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Не удалось добавить товар");
    window.dispatchEvent(new Event("cart-updated"));
  }
}
