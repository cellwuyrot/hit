import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "ТОПХИТ <onboarding@resend.dev>";

export async function sendVerificationCode(email: string, code: string) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Код подтверждения: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #4A90D9; font-size: 24px; margin: 0;">ТОПХИТ</h1>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Интернет-магазин</p>
        </div>
        <div style="background: white; border-radius: 8px; padding: 24px; text-align: center;">
          <p style="color: #334155; font-size: 16px; margin-top: 0;">Ваш код подтверждения:</p>
          <div style="background: #f0f4f8; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a2332;">${code}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">Код действителен 10 минут.<br/>Если вы не запрашивали код, просто проигнорируйте это письмо.</p>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 16px;">© ТОПХИТ — tophitt.ru</p>
      </div>
    `,
  });

  if (error) {
    console.error("Resend error:", error);
    if (typeof error === "object" && "message" in error && typeof error.message === "string" && error.message.includes("verify a domain")) {
      throw new Error("Для отправки писем необходимо верифицировать домен в Resend. Перейдите на resend.com/domains и добавьте ваш домен.");
    }
    throw new Error("Не удалось отправить код подтверждения. Проверьте настройки RESEND_API_KEY.");
  }
}
