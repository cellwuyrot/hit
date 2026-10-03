import { contactLabel, deliveryLabel } from "@/lib/order-options";
export default function OrderPreferences({ order }: { order: {
  deliveryMethod?: string; contactMethod?: string; contactDetails?: string; phone?: string; email?: string; comment?: string;
} }) {
  const value = order.contactMethod === "telegram" ? order.contactDetails : order.contactMethod === "email" ? order.email : order.phone;
  return <div className="text-sm text-text-gray mt-2 space-y-1">
    <p>Доставка: {deliveryLabel(order.deliveryMethod)}</p>
    <p className="break-words">Предпочитаемый способ связи: {contactLabel(order.contactMethod)}{value ? ` · ${value}` : ""}</p>
    {order.comment && <p className="whitespace-pre-wrap break-words">Комментарий покупателя: {order.comment}</p>}
  </div>;
}
