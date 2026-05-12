/**
 * Weekly digest email template — sent every Monday morning to active Zolio users.
 * Recap of the past 7 days: revenue, devis, invoices, top action.
 */

const PUBLIC_URL = process.env.NEXT_PUBLIC_APP_URL || "https://zolio.site";

export interface WeeklyDigestData {
  firstName: string | null;
  // Période : du {since} au {until}
  since: Date;
  until: Date;
  // Stats brutes
  newDevis: number;
  acceptedDevis: number;
  newInvoices: number;
  paidInvoices: number;
  revenuePaidTTC: number; // en €
  pipelineHT: number; // en € (devis En attente)
  followUpsToDo: number;
  // Action prioritaire suggérée
  topAction: { title: string; href: string } | null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function formatDateRange(since: Date, until: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  return `${fmt(since)} – ${fmt(until)}`;
}

export function buildWeeklyDigestSubject(data: WeeklyDigestData): string {
  const sumPaid = formatCurrency(data.revenuePaidTTC);
  if (data.revenuePaidTTC > 0) {
    return `Votre semaine Zolio · ${sumPaid} encaissés`;
  }
  if (data.followUpsToDo > 0) {
    return `Votre semaine Zolio · ${data.followUpsToDo} relance${data.followUpsToDo > 1 ? "s" : ""} à faire`;
  }
  return `Votre semaine Zolio · récap d'activité`;
}

export function buildWeeklyDigestHtml(data: WeeklyDigestData): string {
  const period = formatDateRange(data.since, data.until);
  const greeting = data.firstName ? `Bonjour ${data.firstName}` : "Bonjour";

  const stats = [
    { label: "Nouveaux devis", value: String(data.newDevis), tone: "violet" as const, hint: "créés cette semaine" },
    { label: "Devis acceptés", value: String(data.acceptedDevis), tone: "emerald" as const, hint: "convertis en business" },
    { label: "Factures émises", value: String(data.newInvoices), tone: "amber" as const, hint: "envoyées aux clients" },
    { label: "Factures payées", value: String(data.paidInvoices), tone: "emerald" as const, hint: "encaissées" },
  ];

  const toneStyles: Record<"violet" | "emerald" | "amber", { bg: string; text: string }> = {
    violet: { bg: "rgba(124,58,237,0.12)", text: "#7c3aed" },
    emerald: { bg: "rgba(16,185,129,0.12)", text: "#047857" },
    amber: { bg: "rgba(245,158,11,0.14)", text: "#b45309" },
  };

  const statBlocks = stats
    .map((s) => {
      const t = toneStyles[s.tone];
      return `
        <td align="center" valign="top" style="padding:0 4px;">
          <div style="background:${t.bg};border-radius:14px;padding:18px 12px;">
            <p style="margin:0;color:${t.text};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.16em;">${s.label}</p>
            <p style="margin:8px 0 4px;color:${t.text};font-size:28px;font-weight:800;line-height:1;">${s.value}</p>
            <p style="margin:0;color:#64748b;font-size:11px;">${s.hint}</p>
          </div>
        </td>`;
    })
    .join("");

  const heroNumber = data.revenuePaidTTC;
  const heroLabel = heroNumber > 0
    ? "encaissés cette semaine"
    : data.acceptedDevis > 0
      ? `${data.acceptedDevis} devis accepté${data.acceptedDevis > 1 ? "s" : ""}`
      : "Lancez la machine !";
  const heroValue = heroNumber > 0 ? formatCurrency(heroNumber) : "💪";

  const actionLink = data.topAction
    ? `${PUBLIC_URL}${data.topAction.href}`
    : `${PUBLIC_URL}/dashboard`;
  const actionLabel = data.topAction?.title || "Aller au dashboard";

  return `
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Votre semaine Zolio</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#d946ef,#f97316);padding:32px;border-radius:20px 20px 0 0;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.85);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;">Récap hebdomadaire</p>
      <h1 style="margin:10px 0 0;color:#ffffff;font-size:24px;font-weight:800;">Votre semaine Zolio</h1>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">${period}</p>
    </div>

    <!-- Hero -->
    <div style="background:#ffffff;padding:28px 24px 4px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <p style="margin:0;color:#475569;font-size:15px;">${greeting},</p>
      <p style="margin:8px 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
        Voici ce qui s'est passé sur votre activité cette semaine.
      </p>

      <div style="background:linear-gradient(135deg,#faf5ff,#fff7ed);border-radius:18px;padding:24px;text-align:center;border:1px solid rgba(124,58,237,0.18);">
        <p style="margin:0;color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.22em;">À retenir</p>
        <p style="margin:10px 0 4px;color:#0f172a;font-size:36px;font-weight:800;line-height:1;">${heroValue}</p>
        <p style="margin:0;color:#64748b;font-size:13px;">${heroLabel}</p>
      </div>
    </div>

    <!-- Stats grid -->
    <div style="background:#ffffff;padding:20px 16px 8px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;">
        <tr>${statBlocks}</tr>
      </table>
    </div>

    <!-- Top action -->
    <div style="background:#ffffff;padding:8px 24px 28px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-radius:0 0 20px 20px;">
      ${data.followUpsToDo > 0
        ? `<div style="background:#fff1f2;border-left:3px solid #f43f5e;border-radius:10px;padding:14px 16px;margin:18px 0 8px;">
            <p style="margin:0;color:#9f1239;font-size:13px;line-height:1.5;">
              <strong>${data.followUpsToDo} devis à relancer</strong> — un message bien placé peut convertir.
            </p>
           </div>`
        : ""}
      ${data.pipelineHT > 0
        ? `<div style="background:#fffbeb;border-left:3px solid #f59e0b;border-radius:10px;padding:14px 16px;margin:8px 0;">
            <p style="margin:0;color:#92400e;font-size:13px;line-height:1.5;">
              <strong>${formatCurrency(data.pipelineHT)} HT</strong> en attente dans votre pipe — gardez le rythme !
            </p>
           </div>`
        : ""}

      <div style="text-align:center;margin-top:24px;">
        <a href="${actionLink}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#d946ef,#f97316);color:#ffffff;padding:14px 32px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 8px 20px -8px rgba(124,58,237,0.45);">
          ${actionLabel} →
        </a>
      </div>

      <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;text-align:center;line-height:1.6;">
        Vous recevez cet email parce que vous avez activé le récap hebdomadaire.<br/>
        <a href="${PUBLIC_URL}/parametres" style="color:#7c3aed;text-decoration:none;">Gérer mes préférences</a>
      </p>
    </div>

    <p style="margin:18px 0 0;color:#94a3b8;font-size:11px;text-align:center;">© ${new Date().getFullYear()} Zolio · Le SaaS des artisans du bâtiment</p>
  </div>
</body>
</html>`;
}
