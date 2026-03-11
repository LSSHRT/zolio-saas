import nodemailer from "nodemailer";

/**
 * Envoie un devis par email au client avec le PDF en pièce jointe.
 * 
 * IMPORTANT: Pour que l'envoi fonctionne, il faut configurer les variables :
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS dans le .env.local
 * - Ou utiliser un service comme Gmail (avec un "mot de passe d'application")
 */
export async function sendDevisEmail(
  toEmail: string,
  toName: string,
  numeroDevis: string,
  totalTTC: string,
  pdfBuffer: Buffer
) {
  // Configuration du transporteur SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: `"Zolio" <${process.env.SMTP_USER || "noreply@zolio.site"}>`,
    to: toEmail,
    subject: `Votre devis ${numeroDevis} — ${totalTTC}€ TTC`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);padding:30px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Devis professionnel</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#334155;font-size:16px;">Bonjour <strong>${toName}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Veuillez trouver ci-joint votre devis <strong>${numeroDevis}</strong> 
            d'un montant de <strong>${totalTTC}€ TTC</strong>.
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Ce devis est valable 30 jours. N'hésitez pas à nous contacter pour toute question.
          </p>
          <div style="text-align:center;margin:25px 0;">
            <span style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);color:white;padding:12px 30px;border-radius:10px;font-weight:bold;font-size:14px;display:inline-block;">
              ${totalTTC}€ TTC
            </span>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">
            Devis généré automatiquement par Zolio · zolio.site
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `${numeroDevis}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}
