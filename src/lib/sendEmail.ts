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

/**
 * Envoie un email au client avec le devis signé en pièce jointe.
 */
export async function sendDevisSignedEmail(
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
    subject: `Votre devis signé ${numeroDevis} — ${totalTTC}€ TTC`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:30px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Devis validé et signé</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#334155;font-size:16px;">Bonjour <strong>${toName}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Nous vous confirmons la bonne réception de votre signature pour le devis <strong>${numeroDevis}</strong>.
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Vous trouverez ci-joint un exemplaire PDF de votre devis portant la mention "Bon pour accord" ainsi que votre signature.
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin-top:20px;">
            Merci pour votre confiance.
          </p>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:20px;">
            Document généré automatiquement par Zolio · zolio.site
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `${numeroDevis}_signe.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Envoie un email de prospection automatique à un artisan.
 */
export async function sendProspectEmail(toEmail: string) {
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
    subject: `Simplifiez la gestion de votre activité avec Zolio`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#8b5cf6,#f43f5e);padding:30px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:28px;font-weight:bold;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.9);margin:5px 0 0;font-size:16px;">Le logiciel de devis pensé pour les artisans</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#334155;font-size:16px;">Bonjour,</p>
          <p style="color:#475569;font-size:15px;line-height:1.6;">
            En tant qu'artisan, vous perdez probablement beaucoup de temps à faire vos devis et factures le soir ou le week-end. 
            C'est pour cela que nous avons créé <strong>Zolio</strong>.
          </p>
          <p style="color:#475569;font-size:15px;line-height:1.6;">
            Avec Zolio, vous pouvez :
          </p>
          <ul style="color:#475569;font-size:15px;line-height:1.6;padding-left:20px;">
            <li>Créer des devis professionnels en moins de 3 minutes</li>
            <li>Faire signer vos clients directement en ligne</li>
            <li>Suivre votre chiffre d'affaires et relancer vos impayés facilement</li>
          </ul>
          <div style="text-align:center;margin:30px 0;">
            <a href="https://zolio.site" style="background:linear-gradient(135deg,#8b5cf6,#f43f5e);color:white;padding:14px 32px;border-radius:12px;font-weight:bold;font-size:16px;text-decoration:none;display:inline-block;box-shadow:0 4px 6px -1px rgba(139,92,246,0.3);">
              Découvrir Zolio
            </a>
          </div>
          <p style="color:#475569;font-size:15px;line-height:1.6;">
            Démarrez votre essai dès maintenant et simplifiez votre quotidien. 
            N'hésitez pas à nous répondre si vous avez la moindre question !
          </p>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:30px;border-top:1px solid #e2e8f0;padding-top:20px;">
            Cet email vous a été envoyé car nous aidons les artisans de votre secteur. <br/>
            Si vous ne souhaitez plus recevoir de propositions de notre part, merci de nous le signaler.
          </p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
