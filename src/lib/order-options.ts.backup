/** Shared checkout options and validation, with no client/server-specific code. */
export const CONTACT_METHODS = [
  { value: "phone", label: "Телефон" },
  { value: "telegram", label: "Telegram" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "email", label: "Почта (email)" },
] as const;
export const DELIVERY_METHODS = [
  { value: "cdek", label: "СДЭК" },
  { value: "russian_post", label: "Почта России" },
  { value: "pickup", label: "Самовывоз" },
] as const;
export const PICKUP_ADDRESS = "Самовывоз: Москва, ул. Складочная, 1, стр. 18";
export function contactLabel(value?: string) { return CONTACT_METHODS.find(o => o.value === value)?.label || "Телефон"; }
export function deliveryLabel(value?: string) { return DELIVERY_METHODS.find(o => o.value === value)?.label || "Не указан (старый заказ)"; }
export class OrderDetailsError extends Error {}
function field(value: unknown, max: number, label: string) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > max) throw new OrderDetailsError(`Некорректное поле: ${label}`);
  return value.trim();
}
export function parseOrderDetails(body: Record<string, unknown>, fallbackEmail = "") {
  const name = field(body.name, 150, "Имя");
  const phone = field(body.phone, 40, "Телефон");
  const email = field(body.email, 254, "Email") || fallbackEmail;
  const comment = field(body.comment, 2000, "Комментарий к заказу");
  const contactMethod = body.contactMethod === undefined ? "phone" : body.contactMethod;
  // Older clients sent only isPickup. Explicit new values always require validation.
  const deliveryMethod = body.deliveryMethod === undefined ? (body.isPickup === true ? "pickup" : "cdek") : body.deliveryMethod;
  if (typeof contactMethod !== "string" || !CONTACT_METHODS.some(o => o.value === contactMethod)) throw new OrderDetailsError("Выберите способ связи: телефон, Telegram, WhatsApp или почта");
  if (typeof deliveryMethod !== "string" || !DELIVERY_METHODS.some(o => o.value === deliveryMethod)) throw new OrderDetailsError("Выберите доставку: СДЭК, Почта России или самовывоз");
  if (body.isPickup !== undefined && (typeof body.isPickup !== "boolean" || (body.deliveryMethod !== undefined && body.isPickup !== (deliveryMethod === "pickup")))) throw new OrderDetailsError("Противоречивые данные о доставке");
  const address = deliveryMethod === "pickup" ? PICKUP_ADDRESS : field(body.address, 1000, "Адрес");
  if (!name || !phone) throw new OrderDetailsError("Укажите имя и телефон");
  if (!/^[\d\s+()\-]+$/.test(phone) || phone.replace(/\D/g, "").length < 10 || phone.replace(/\D/g, "").length > 15) throw new OrderDetailsError("Укажите корректный телефон (10–15 цифр)");
  if (deliveryMethod !== "pickup" && address.length < 10) throw new OrderDetailsError("Укажите полный адрес доставки или выберите самовывоз");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OrderDetailsError("Укажите корректный email");
  if (contactMethod === "email" && !email) throw new OrderDetailsError("Укажите email для связи по почте");
  let contactDetails = "";
  if (contactMethod === "telegram") {
    const value = field(body.contactDetails, 200, "Telegram");
    const username = value.replace(/^https?:\/\/t\.me\//i, "").replace(/^t\.me\//i, "").replace(/^@/, "").replace(/\/$/, "");
    if (!/^[a-z][a-z0-9_]{4,31}$/i.test(username)) throw new OrderDetailsError("Укажите Telegram: @username (5–32 символа) или ссылку https://t.me/username");
    contactDetails = `@${username}`;
  }
  return { name, phone, email, address, comment, contactMethod, contactDetails, deliveryMethod };
}
