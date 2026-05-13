import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { SUPPORT_EMAIL } from "@/lib/support";

/**
 * Minimal HTML escape for user-supplied values rendered in the
 * outgoing mail body. The plaintext fallback already handles raw
 * data so this only protects the html branch.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number.parseInt(process.env.SMTP_PORT || "465", 10);
    const secure = process.env.SMTP_SECURE !== "false";

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject || "—");
    const safeMessage = escapeHtml(message);

    await transporter.sendMail({
      from: `${process.env.SMTP_FROM_NAME || "Zolio"} <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: SUPPORT_EMAIL,
      replyTo: email,
      subject: `[Contact Zolio] ${subject || "Sans objet"} — de ${name}`,
      text: `Nom : ${name}\nEmail : ${email}\nSujet : ${subject || "—"}\n\n${message}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Nouveau message de contact</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold;">Nom</td><td style="padding: 8px 0;">${safeName}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Email</td><td style="padding: 8px 0;">${safeEmail}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold;">Sujet</td><td style="padding: 8px 0;">${safeSubject}</td></tr>
          </table>
          <hr style="margin: 16px 0; border: none; border-top: 1px solid #e2e8f0;" />
          <p style="white-space: pre-wrap; line-height: 1.6;">${safeMessage}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[contact]", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 });
  }
}
