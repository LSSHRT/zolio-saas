import nodemailer from "nodemailer";
import { createProspectTransport } from "@/lib/prospecting";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getSmtpPort() {
  const rawPort = Number.parseInt(process.env.SMTP_PORT || "587", 10);
  return Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 587;
}

function isSmtpSecure(port: number) {
  if (process.env.SMTP_SECURE === "true") {
    return true;
  }

  if (process.env.SMTP_SECURE === "false") {
    return false;
  }

  return port === 465;
}

function getTransactionalMailRuntime() {
  const port = getSmtpPort();
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@zolio.site";

  return {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure: isSmtpSecure(port),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromEmail,
    fromName: process.env.SMTP_FROM_NAME || "Zolio",
    replyToEmail: process.env.SMTP_REPLY_TO || fromEmail,
  };
}

function createTransactionalTransport() {
  const runtime = getTransactionalMailRuntime();

  return {
    runtime,
    transporter: nodemailer.createTransport({
      host: runtime.host,
      port: runtime.port,
      secure: runtime.secure,
      auth: {
        user: runtime.user,
        pass: runtime.pass,
      },
    }),
  };
}

/**
 * Envoie un devis par email au client avec le PDF en pièce jointe.
 *
 * IMPORTANT: Pour que l'envoi fonctionne, il faut configurer les variables :
 * - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS dans le .env.local
 * - SMTP_FROM_EMAIL / SMTP_REPLY_TO si l'adresse visible doit différer du login SMTP
 */
export async function sendDevisEmail(
  toEmail: string,
  toName: string,
  numeroDevis: string,
  totalTTC: string,
  pdfBuffer: Buffer
) {
  const safeName = escapeHtml(toName);
  const safeNumero = escapeHtml(numeroDevis);
  const safeTotal = escapeHtml(totalTTC);
  const { runtime, transporter } = createTransactionalTransport();

  const mailOptions = {
    from: `"${runtime.fromName}" <${runtime.fromEmail}>`,
    to: toEmail,
    replyTo: runtime.replyToEmail || undefined,
    subject: `Votre devis ${numeroDevis} — ${totalTTC}€ TTC`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);padding:30px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Devis professionnel</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#334155;font-size:16px;">Bonjour <strong>${safeName}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Veuillez trouver ci-joint votre devis <strong>${safeNumero}</strong>
            d'un montant de <strong>${safeTotal}€ TTC</strong>.
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Ce devis est valable 30 jours. N'hésitez pas à nous contacter pour toute question.
          </p>
          <div style="text-align:center;margin:25px 0;">
            <span style="background:linear-gradient(135deg,#0ea5e9,#8b5cf6);color:white;padding:12px 30px;border-radius:10px;font-weight:bold;font-size:14px;display:inline-block;">
              ${safeTotal}€ TTC
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
  const safeName = escapeHtml(toName);
  const safeNumero = escapeHtml(numeroDevis);
  const { runtime, transporter } = createTransactionalTransport();

  const mailOptions = {
    from: `"${runtime.fromName}" <${runtime.fromEmail}>`,
    to: toEmail,
    replyTo: runtime.replyToEmail || undefined,
    subject: `Votre devis signé ${numeroDevis} — ${totalTTC}€ TTC`,
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:30px;border-radius:16px 16px 0 0;">
          <h1 style="color:white;margin:0;font-size:24px;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;">Devis validé et signé</p>
        </div>
        <div style="background:#f8fafc;padding:30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#334155;font-size:16px;">Bonjour <strong>${safeName}</strong>,</p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;">
            Nous vous confirmons la bonne réception de votre signature pour le devis <strong>${safeNumero}</strong>.
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

type ProspectEmailContext = {
  companyName?: string;
  tradeLabel?: string;
  city?: string;
};

// Exemples de devis par métier pour la personnalisation
const TRADE_EXAMPLES: Record<string, { example: string; pain: string }> = {
  peintre: {
    example: "Peinture murs 2 couches — 40m² × 24€ = 960€",
    pain: "calculer les m², les prix au m², les couches...",
  },
  plaquiste: {
    example: "Cloison BA13 + isolation — 18m² × 42€ = 756€",
    pain: "calculer les m² de placo, les ossatures, les bandes...",
  },
  plombier: {
    example: "Remplacement chauffe-eau — 1 × 320€ = 320€",
    pain: "faire les devis sur le coin de la table après le chantier...",
  },
  electricien: {
    example: "Mise aux normes tableau — 1 × 850€ = 850€",
    pain: "tout recalculer à chaque fois, les prises, les lignes...",
  },
  chauffagiste: {
    example: "Pompe à chaleur air/eau — 1 × 4500€ = 4500€",
    pain: "les devis complexes avec main d'œuvre et matériel...",
  },
  menuisier: {
    example: "Pose parquet chêne — 25m² × 65€ = 1625€",
    pain: "les métrages, les finitions, les seuils...",
  },
  carreleur: {
    example: "Pose carrelage grand format — 20m² × 35€ = 700€",
    pain: "les découpes, les angles, la colle, les joints...",
  },
  macon: {
    example: "Mur porteur + hourdis — 12m² × 85€ = 1020€",
    pain: "les devis qui changent à chaque chantier...",
  },
  couvreur: {
    example: "Réfection toiture tuiles — 80m² × 55€ = 4400€",
    pain: "les devis longs avec matériaux et main d'œuvre...",
  },
  facadier: {
    example: "Ravalement façade — 120m² × 35€ = 4200€",
    pain: "les devis avec échafaudage, produits, finitions...",
  },
};

/**
 * Envoie un email de prospection automatique à un artisan.
 */
export async function sendProspectEmail(toEmail: string, context?: ProspectEmailContext) {
  const { runtime, transporter } = createProspectTransport();
  const unsubscribeMailto = runtime.replyToEmail
    ? `<mailto:${runtime.replyToEmail}?subject=unsubscribe>`
    : undefined;
  const unsubscribeHeader = runtime.unsubscribeUrl
    ? [unsubscribeMailto, `<${runtime.unsubscribeUrl}>`].filter(Boolean).join(", ")
    : unsubscribeMailto;
  const headers: Record<string, string> = {
    "X-Auto-Response-Suppress": "All",
  };

  if (unsubscribeHeader) {
    headers["List-Unsubscribe"] = unsubscribeHeader;
  }

  const tradeLabel = context?.tradeLabel?.toLowerCase() || "artisan";
  const city = context?.city || "";
  const tradeKey = Object.keys(TRADE_EXAMPLES).find(k => tradeLabel.includes(k));
  const tradeExample = tradeKey ? TRADE_EXAMPLES[tradeKey] : null;
  const exampleLine = tradeExample
    ? `Exemple : "${tradeExample.example}"`
    : `Exemple : "Prestation — 20 × 35€ = 700€"`;
  const painLine = tradeExample
    ? `Vous aussi, vous en avez marre de ${tradeExample.pain}`
    : `Vous aussi, vous perdez du temps sur vos devis ?`;

  const companyLine = context?.companyName
    ? `Je suis tombé sur ${context.companyName} et je me suis dit que ça pourrait vous parler.`
    : `Je prends contact avec des ${tradeLabel} ${city ? `sur ${city}` : ""} qui perdent du temps sur leur paperasse.`;

  // Lignes personnalisées selon si on a le nom de l'entreprise ou non
  const personalLines = context?.companyName
    ? [
        `${context.companyName} a l'air de faire du bon travail.`,
        `On a créé Zolio spécifiquement pour les ${tradeLabel} comme vous.`,
      ]
    : [
        `On accompagne déjà des ${tradeLabel} ${city ? `à ${city}` : ""}.`,
        `Zolio est fait spécifiquement pour votre métier.`,
      ];

  // Pixel de tracking d'ouverture (1x1 transparent)
  const trackingPixel = `<img src="https://www.zolio.site/api/prospect-domains/track?e=${encodeURIComponent(toEmail)}" width="1" height="1" style="display:none" alt="" />`;

  const subjectPool = [
    `Votre devis en 2 min depuis le chantier`,
    `${tradeLabel.charAt(0).toUpperCase() + tradeLabel.slice(1)}${city ? ` à ${city}` : ""} — et si vos devis se faisaient tout seuls ?`,
    `Finis les devis sur papier — testez 2 min`,
  ];
  const subjectIndex = Math.abs(toEmail.charCodeAt(0) + toEmail.length) % subjectPool.length;
  const subject = subjectPool[subjectIndex];

  const mailOptions = {
    from: `"Zolio" <${runtime.fromEmail}>`,
    to: toEmail,
    replyTo: runtime.replyToEmail || undefined,
    subject,
    text: [
      "Bonjour,",
      "",
      companyLine,
      "",
      painLine + " ?",
      "",
      `Zolio, c'est l'outil qui permet aux ${tradeLabel} de créer un devis en 2 minutes chrono.`,
      exampleLine,
      "",
      "- Créer un devis propre en 2 minutes (depuis le chantier ou le bureau)",
      "- Faire signer en ligne par le client — plus besoin de courrier papier",
      "- Transformer le devis en facture en un clic",
      "",
      "Pas de logiciel à installer. Ça marche sur téléphone et ordinateur.",
      "500+ artisans l'utilisent déjà.",
      "",
      "Testez gratuitement ici : https://zolio.site",
      "",
      "Bonne journée !",
      "L'équipe Zolio",
      "",
      "---",
      runtime.replyToEmail
        ? `Pour ne plus recevoir ce type de message, répondez à ${runtime.replyToEmail} avec le mot STOP.`
        : "Pour ne plus recevoir ce type de message, répondez à cet email avec le mot STOP.",
    ].join("\n"),
    html: `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#8b5cf6,#f43f5e);padding:24px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;font-weight:bold;">Zolio</h1>
          <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Devis · Signature · Facture — en un seul outil</p>
        </div>
        <div style="background:#fff;padding:28px 30px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;">
          <p style="color:#1e293b;font-size:15px;line-height:1.5;margin:0 0 16px;">Bonjour,</p>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
            ${companyLine}
          </p>
          <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 16px;">
            ${painLine} ? Avec <strong>Zolio</strong>, vos devis se font en 2 minutes chrono :
          </p>
          <div style="background:#f1f5f9;border-radius:10px;padding:14px 16px;margin:0 0 20px;border-left:3px solid #8b5cf6;">
            <p style="color:#64748b;font-size:12px;margin:0 0 4px;">Exemple de devis généré :</p>
            <p style="color:#1e293b;font-size:14px;font-weight:600;margin:0;">${exampleLine}</p>
          </div>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
            <tr>
              <td style="padding:6px 10px 6px 0;font-size:15px;color:#8b5cf6;">✦</td>
              <td style="padding:6px 0;font-size:15px;color:#334155;line-height:1.5;">Créer un devis propre en <strong>2 minutes</strong> — depuis le chantier ou le bureau</td>
            </tr>
            <tr>
              <td style="padding:6px 10px 6px 0;font-size:15px;color:#8b5cf6;">✦</td>
              <td style="padding:6px 0;font-size:15px;color:#334155;line-height:1.5;">Faire <strong>signer en ligne</strong> par le client — plus de papier ni de relances</td>
            </tr>
            <tr>
              <td style="padding:6px 10px 6px 0;font-size:15px;color:#8b5cf6;">✦</td>
              <td style="padding:6px 0;font-size:15px;color:#334155;line-height:1.5;">Transformer le devis en <strong>facture en un clic</strong></td>
            </tr>
          </table>
          <p style="color:#64748b;font-size:14px;line-height:1.5;margin:0 0 6px;">
            📱 Ça marche sur téléphone et ordinateur. Rien à installer.
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.5;margin:0 0 24px;">
            👷 <strong>500+ artisans</strong> l'utilisent déjà.
          </p>
          <div style="text-align:center;margin:0 0 24px;">
            <a href="https://zolio.site" style="background:linear-gradient(135deg,#8b5cf6,#f43f5e);color:white;padding:14px 36px;border-radius:12px;font-weight:bold;font-size:15px;text-decoration:none;display:inline-block;box-shadow:0 4px 12px -2px rgba(139,92,246,0.35);">
              Tester gratuitement →
            </a>
          </div>
          <p style="color:#475569;font-size:14px;line-height:1.5;margin:0 0 4px;">
            Si vous avez des questions, répondez directement à cet email.
          </p>
          <p style="color:#475569;font-size:14px;line-height:1.5;margin:0;">
            Bonne journée !<br/><span style="color:#8b5cf6;font-weight:600;">L'équipe Zolio</span>
          </p>
        </div>
        <p style="color:#94a3b8;font-size:11px;text-align:center;margin:16px 0 0;line-height:1.5;">
          Cet email vous a été envoyé car nous accompagnons des entreprises du bâtiment.<br/>
          Pour vous désinscrire, <a href="${runtime.unsubscribeUrl || `mailto:${runtime.replyToEmail}?subject=STOP`}" style="color:#94a3b8;">cliquez ici</a> ou répondez STOP.
        </p>
        ${trackingPixel}
      </div>
    `,
    headers,
  };

  await transporter.sendMail(mailOptions);
}
