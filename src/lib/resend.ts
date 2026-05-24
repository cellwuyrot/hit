import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "ТОПХИТ <onboarding@resend.dev>";
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || "acoulbot@gmail.ru")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

interface OrderItem {
  quantity: number;
  price: number;
  product: { name: string };
}

interface OrderEmailData {
  id: string;
  name: string;
  phone: string;
  address: string;
  comment: string;
  total: number;
  promoCode?: string;
  discount?: number;
  items: OrderItem[];
  createdAt: string | Date;
}

function emailWrapper(content: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #4A90D9; font-size: 24px; margin: 0;">ТОПХИТ</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Интернет-магазин — tophitt.ru</p>
      </div>
      <div style="background: white; border-radius: 8px; padding: 24px;">
        ${content}
      </div>
      <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">© ТОПХИТ — tophitt.ru</p>
    </div>
  `;
}

function orderItemsHtml(items: OrderItem[]) {
  return items.map(item => `
    <tr>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #334155;">${item.product.name}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #64748b; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #334155; text-align: right;">${(item.price * item.quantity).toLocaleString("ru-RU")} ₽</td>
    </tr>
  `).join("");
}

function orderDetailsHtml(order: OrderEmailData) {
  const discountRow = order.promoCode && order.discount && order.discount > 0
    ? `<p style="color: #16a34a; font-size: 14px;">Промокод «${order.promoCode}» — скидка ${order.discount.toLocaleString("ru-RU")} ₽</p>`
    : "";
  return `
    <p style="color: #334155; font-size: 16px; font-weight: bold; margin-top: 0;">Заказ #${order.id.slice(0, 8)}</p>
    <p style="color: #64748b; font-size: 14px;">Дата: ${new Date(order.createdAt).toLocaleString("ru-RU")}</p>
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="border-bottom: 2px solid #e2e8f0;">
          <th style="padding: 8px 0; text-align: left; color: #64748b; font-size: 13px;">Товар</th>
          <th style="padding: 8px 0; text-align: center; color: #64748b; font-size: 13px;">Кол-во</th>
          <th style="padding: 8px 0; text-align: right; color: #64748b; font-size: 13px;">Сумма</th>
        </tr>
      </thead>
      <tbody>${orderItemsHtml(order.items)}</tbody>
    </table>
    ${discountRow}
    <p style="font-size: 18px; font-weight: bold; color: #4A90D9; text-align: right;">Итого: ${order.total.toLocaleString("ru-RU")} ₽</p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
    <p style="color: #334155; font-size: 14px; margin: 4px 0;"><strong>Получатель:</strong> ${order.name}</p>
    <p style="color: #334155; font-size: 14px; margin: 4px 0;"><strong>Телефон:</strong> ${order.phone}</p>
    <p style="color: #334155; font-size: 14px; margin: 4px 0;"><strong>Адрес:</strong> ${order.address}</p>
    ${order.comment ? `<p style="color: #334155; font-size: 14px; margin: 4px 0;"><strong>Комментарий:</strong> ${order.comment}</p>` : ""}
  `;
}

const statusLabels: Record<string, string> = {
  new: "Новый",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export async function sendVerificationCode(email: string, code: string) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Код подтверждения: ${code}`,
    html: emailWrapper(`
      <p style="color: #334155; font-size: 16px; margin-top: 0; text-align: center;">Ваш код подтверждения:</p>
      <div style="background: #f0f4f8; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a2332;">${code}</span>
      </div>
      <p style="color: #64748b; font-size: 13px; margin-bottom: 0; text-align: center;">Код действителен 10 минут.<br/>Если вы не запрашивали код, просто проигнорируйте это письмо.</p>
    `),
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("Сервис отправки email временно недоступен. Попробуйте позже или обратитесь в поддержку.");
  }
}

export async function sendOrderNotificationToAdmin(order: OrderEmailData, customerEmail: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAILS,
      subject: `Новый заказ #${order.id.slice(0, 8)} — ${order.total.toLocaleString("ru-RU")} ₽`,
      html: emailWrapper(`
        <div style="background: #dbeafe; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
          <p style="color: #1e40af; font-size: 14px; margin: 0; font-weight: bold;">📦 Новый заказ от ${order.name}</p>
          <p style="color: #1e40af; font-size: 13px; margin: 4px 0 0;">Email клиента: ${customerEmail}</p>
        </div>
        ${orderDetailsHtml(order)}
      `),
    });
  } catch (err) {
    console.error("Failed to send admin order notification:", err);
  }
}

export async function sendOrderConfirmationToClient(email: string, order: OrderEmailData) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Заказ #${order.id.slice(0, 8)} оформлен — ТОПХИТ`,
      html: emailWrapper(`
        <div style="background: #dcfce7; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
          <p style="color: #166534; font-size: 14px; margin: 0; font-weight: bold;">✅ Ваш заказ успешно оформлен!</p>
          <p style="color: #166534; font-size: 13px; margin: 4px 0 0;">Мы свяжемся с вами для подтверждения.</p>
        </div>
        ${orderDetailsHtml(order)}
      `),
    });
  } catch (err) {
    console.error("Failed to send client order confirmation:", err);
  }
}

export async function sendOrderStatusUpdate(email: string, orderId: string, status: string, trackNumber?: string, trackUrl?: string) {
  try {
    const statusText = statusLabels[status] || status;
    let trackingHtml = "";
    if (trackNumber) {
      const trackLink = trackUrl
        ? `<a href="${trackUrl}" style="color: #4A90D9; text-decoration: underline;">${trackNumber}</a>`
        : `<span style="color: #334155; font-weight: bold;">${trackNumber}</span>`;
      trackingHtml = `
        <div style="background: #f0f4f8; border-radius: 8px; padding: 12px 16px; margin-top: 16px;">
          <p style="color: #334155; font-size: 14px; margin: 0;">📦 Трек-номер: ${trackLink}</p>
        </div>
      `;
    }
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Заказ #${orderId.slice(0, 8)} — ${statusText} — ТОПХИТ`,
      html: emailWrapper(`
        <p style="color: #334155; font-size: 16px; margin-top: 0;">Статус вашего заказа <strong>#${orderId.slice(0, 8)}</strong> обновлён:</p>
        <div style="background: #dbeafe; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: center;">
          <span style="font-size: 20px; font-weight: bold; color: #1e40af;">${statusText}</span>
        </div>
        ${trackingHtml}
        <p style="color: #64748b; font-size: 13px; margin-top: 16px;">Если у вас есть вопросы, напишите нам через личный кабинет на <a href="https://tophitt.ru/account" style="color: #4A90D9;">tophitt.ru</a>.</p>
      `),
    });
  } catch (err) {
    console.error("Failed to send order status update:", err);
  }
}
