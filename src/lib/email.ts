// Email notification utility
// Configure SMTP settings in .env to enable actual email sending
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log(`[EMAIL] (not sent — SMTP not configured) To: ${options.to} | Subject: ${options.subject}`);
    return false;
  }

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`[EMAIL] Sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (err) {
    console.error("[EMAIL] Error:", err);
    return false;
  }
}

export function orderConfirmationEmail(orderId: string, total: number): { subject: string; html: string } {
  return {
    subject: `ТОПХИТ — Заказ #${orderId.slice(0, 8)} подтверждён`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4A90D9; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ТОПХИТ</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Ваш заказ подтверждён!</h2>
          <p>Номер заказа: <strong>#${orderId.slice(0, 8)}</strong></p>
          <p>Сумма: <strong>${total.toLocaleString("ru-RU")} ₽</strong></p>
          <p>Мы обработаем ваш заказ в ближайшее время.</p>
          <p>Вы можете отслеживать статус заказа в <a href="https://tophit.store/account" style="color: #4A90D9;">личном кабинете</a>.</p>
        </div>
        <div style="background: #F0F4F8; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;">
          <p>ТОПХИТ — интернет-магазин<br>+7 (936) 256-89-50</p>
        </div>
      </div>
    `,
  };
}

export function orderStatusEmail(orderId: string, status: string): { subject: string; html: string } {
  const statusLabels: Record<string, string> = {
    processing: "В обработке",
    shipped: "Отправлен",
    delivered: "Доставлен",
    cancelled: "Отменён",
  };
  return {
    subject: `ТОПХИТ — Статус заказа #${orderId.slice(0, 8)} изменён`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4A90D9; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ТОПХИТ</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Статус заказа обновлён</h2>
          <p>Заказ: <strong>#${orderId.slice(0, 8)}</strong></p>
          <p>Новый статус: <strong>${statusLabels[status] || status}</strong></p>
          <p>Подробности в <a href="https://tophit.store/account" style="color: #4A90D9;">личном кабинете</a>.</p>
        </div>
        <div style="background: #F0F4F8; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;">
          <p>ТОПХИТ — интернет-магазин<br>+7 (936) 256-89-50</p>
        </div>
      </div>
    `,
  };
}

export function registrationEmail(): { subject: string; html: string } {
  return {
    subject: "Добро пожаловать в ТОПХИТ!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #4A90D9; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">ТОПХИТ</h1>
        </div>
        <div style="padding: 20px;">
          <h2>Добро пожаловать!</h2>
          <p>Вы успешно зарегистрировались в интернет-магазине ТОПХИТ.</p>
          <p>Теперь вы можете:</p>
          <ul>
            <li>Оформлять заказы и отслеживать их статус</li>
            <li>Добавлять товары в избранное</li>
            <li>Оставлять отзывы о товарах</li>
            <li>Общаться с менеджерами</li>
          </ul>
          <p><a href="https://tophit.store/catalog" style="color: #4A90D9;">Перейти в каталог</a></p>
        </div>
        <div style="background: #F0F4F8; padding: 15px; text-align: center; font-size: 12px; color: #6B7280;">
          <p>ТОПХИТ — интернет-магазин<br>+7 (936) 256-89-50</p>
        </div>
      </div>
    `,
  };
}
