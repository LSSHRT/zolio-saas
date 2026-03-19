"use client";

import type { FormEvent, ReactNode } from "react";
import { useDeferredValue, useState } from "react";
import useSWR from "swr";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Gauge,
  LayoutDashboard,
  Loader2,
  MessageSquareDashed,
  RadioTower,
  Search,
  Send,
  Server,
  Shield,
  Sparkles,
  TriangleAlert,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  banUser,
  deleteUserAccount,
  grantAdminRole,
  markMailAsFailed,
  setMaintenanceMode,
  setSystemBanner,
  toggleUserProStatus,
  updateAdminSettings,
} from "./actions";
import { AdminConfirmDialog } from "./components/AdminConfirmDialog";
import { AdminKpiStrip } from "./components/AdminKpiStrip";
import { AdminMobileNav } from "./components/AdminMobileNav";
import { AdminSidebar, type AdminSidebarSection } from "./components/AdminSidebar";
import { AdminUserDrawer } from "./components/AdminUserDrawer";
import type {
  AdminActivityItem,
  AdminAlertItem,
  AdminAuditLogItem,
  AdminDashboardData,
  AdminMailItem,
  AdminSectionId,
  AdminSeverity,
  AdminSystemStatus,
  AdminUserRow,
} from "./types";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  return response.json();
};

type ConfirmDialogState = {
  title: string;
  description: string;
  confirmLabel: string;
  tone: "brand" | "danger" | "warning";
  action: () => Promise<void>;
};

function formatDateTime(value: string | null) {
  if (!value) return "Indisponible";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatTimeAgo(value: string) {
  const diffMs = new Date(value).getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / 60000);
  const formatter = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

function alertClasses(severity: AdminSeverity) {
  switch (severity) {
    case "critical":
      return "border-red-400/18 bg-red-500/10 text-red-100";
    case "warning":
      return "border-amber-300/16 bg-amber-400/10 text-amber-50";
    case "success":
      return "border-emerald-300/16 bg-emerald-500/10 text-emerald-50";
    default:
      return "border-sky-300/16 bg-sky-500/10 text-sky-50";
  }
}

function alertIcon(severity: AdminSeverity) {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-4 w-4" />;
    case "warning":
      return <TriangleAlert className="h-4 w-4" />;
    case "success":
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return <Sparkles className="h-4 w-4" />;
  }
}

function systemStatusClasses(status: AdminSystemStatus["status"]) {
  switch (status) {
    case "healthy":
      return "text-emerald-200 bg-emerald-500/12 ring-emerald-300/18";
    case "warning":
      return "text-amber-100 bg-amber-400/12 ring-amber-300/18";
    case "critical":
      return "text-red-100 bg-red-500/12 ring-red-300/18";
    default:
      return "text-slate-200 bg-slate-500/12 ring-white/10";
  }
}

function auditLogLevelClasses(level: AdminAuditLogItem["level"]) {
  switch (level) {
    case "error":
      return "bg-red-500/12 text-red-100 ring-red-300/18";
    case "warning":
      return "bg-amber-400/12 text-amber-100 ring-amber-300/18";
    case "success":
      return "bg-emerald-500/12 text-emerald-100 ring-emerald-300/18";
    default:
      return "bg-sky-500/12 text-sky-100 ring-sky-300/18";
  }
}

function Panel({
  action,
  children,
  className = "",
  description,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  description?: string;
  title?: string;
}) {
  return (
    <section className={`admin-panel rounded-[30px] ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col gap-4 border-b border-white/8 px-5 py-5 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              {title && <h3 className="text-lg font-semibold text-white">{title}</h3>}
              {description && <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>}
            </div>
            {action}
          </div>
        </div>
      )}
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export default function AdminClient({ data }: { data: AdminDashboardData }) {
  const [activeSection, setActiveSection] = useState<AdminSectionId>("pilotage");
  const [users, setUsers] = useState(data.users);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);
  const [filterProOnly, setFilterProOnly] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [bannerText, setBannerText] = useState(data.settings.systemBanner);
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(data.settings.maintenanceEnabled);
  const [maintenanceMessage, setMaintenanceMessage] = useState(data.settings.maintenanceMessage);
  const [geminiKey, setGeminiKey] = useState(data.settings.currentGeminiKey);
  const [savingBanner, setSavingBanner] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [savingGeminiKey, setSavingGeminiKey] = useState(false);
  const [prospectEmail, setProspectEmail] = useState("");
  const [sendingProspect, setSendingProspect] = useState(false);
  const [testingCron, setTestingCron] = useState(false);
  const [togglingCron, setTogglingCron] = useState(false);
  const [prospectMessage, setProspectMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [confirmPending, setConfirmPending] = useState(false);
  const [activityFeed, setActivityFeed] = useState(data.activity);

  const { data: mailsData, mutate: mutateMails } = useSWR<AdminMailItem[]>(
    "/api/admin/mail",
    fetcher,
    {
      fallbackData: data.prospectMails,
      keepPreviousData: true,
      revalidateOnFocus: false,
    },
  );
  const { data: cronData, mutate: mutateCron } = useSWR<{ value: string | null }>(
    "/api/admin/settings?key=cron_prospect_enabled",
    fetcher,
    {
      fallbackData: { value: data.acquisition.isCronEnabled ? "true" : "false" },
      revalidateOnFocus: false,
    },
  );
  const { data: auditLogsData, mutate: mutateAuditLogs } = useSWR<AdminAuditLogItem[]>(
    "/api/admin/logs",
    fetcher,
    {
      fallbackData: data.auditLogs,
      refreshInterval: 15000,
      revalidateOnFocus: true,
    },
  );

  const mails = Array.isArray(mailsData) ? mailsData : data.prospectMails;
  const isCronEnabled = cronData?.value !== "false";
  const auditLogs = Array.isArray(auditLogsData) ? auditLogsData : data.auditLogs;

  const sentCount = mails.filter((mail) => mail.status === "Sent").length;
  const failedCount = mails.filter((mail) => mail.status !== "Sent").length;
  const totalMailCount = mails.length;
  const manualCount = mails.filter((mail) => mail.source === "Manual").length;
  const automatedCount = mails.filter((mail) => mail.source !== "Manual").length;
  const deliveryRate = totalMailCount > 0 ? Math.round((sentCount / totalMailCount) * 100) : 0;

  const baseAlerts = data.alerts.filter(
    (alert) => !["failed-mails", "cron-disabled", "maintenance-active", "all-clear"].includes(alert.id),
  );
  const alerts: AdminAlertItem[] = [];

  if (failedCount > 0) {
    alerts.push({
      id: "failed-mails",
      title: `${failedCount} envoi${failedCount > 1 ? "s" : ""} en échec`,
      description: "Des emails de prospection demandent une revue ou une relance ciblée.",
      severity: "critical",
      section: "acquisition",
      ctaLabel: "Voir l'historique",
    });
  }

  if (!isCronEnabled) {
    alerts.push({
      id: "cron-disabled",
      title: "Robot de prospection désactivé",
      description: "Le moteur d'acquisition automatique est stoppé côté admin.",
      severity: "warning",
      section: "acquisition",
      ctaLabel: "Réactiver",
    });
  }

  if (maintenanceEnabled) {
    alerts.push({
      id: "maintenance-active",
      title: "Mode maintenance actif",
      description: "Les visiteurs non admin voient actuellement l'écran de maintenance global.",
      severity: "warning",
      section: "systeme",
      ctaLabel: "Vérifier le système",
    });
  }

  alerts.push(...baseAlerts);

  if (alerts.length === 0) {
    alerts.push({
      id: "all-clear",
      title: "Aucune alerte prioritaire",
      description: "Les signaux critiques restent au vert sur le cockpit.",
      severity: "success",
      section: "pilotage",
      ctaLabel: "Continuer",
    });
  }

  const heroStatus =
    alerts.some((alert) => alert.severity === "critical")
      ? {
          label: "Attention requise",
          description: "Le cockpit détecte au moins un point opérationnel à traiter en priorité.",
          tone: "critical" as const,
        }
      : alerts.some((alert) => alert.severity === "warning")
        ? {
            label: "Sous contrôle",
            description: "La plateforme tourne correctement avec quelques sujets à garder dans le radar.",
            tone: "warning" as const,
          }
        : {
            label: "Opérationnel",
            description: "Les briques critiques sont alignées et l'activité reste stable.",
            tone: "success" as const,
          };

  const systemStatuses: AdminSystemStatus[] = data.systemStatuses.map((status) => {
    if (status.id === "cron") {
      if (!data.environment.hasCronSecret) {
        return {
          ...status,
          status: "critical" as const,
          detail: "CRON_SECRET manquant",
        };
      }

      return {
        ...status,
        status: isCronEnabled ? "healthy" : "warning",
        detail: isCronEnabled ? "Automatisation autorisée" : "Robot désactivé par l'admin",
      };
    }

    if (status.id === "maintenance") {
      return {
        ...status,
        status: maintenanceEnabled ? "warning" : "healthy",
        detail: maintenanceEnabled
          ? "Protection globale active pour les visiteurs non admin"
          : "Aucune interruption publique en cours",
        meta: maintenanceMessage || undefined,
      };
    }

    if (status.id === "audit-log") {
      return {
        ...status,
        status: auditLogs.length > 0 ? "healthy" : "inactive",
        detail:
          auditLogs.length > 0
            ? "Journal d'audit persistant disponible dans le cockpit"
            : "Aucune entrée de journal enregistrée pour le moment",
        meta: `${auditLogs.length} entrée${auditLogs.length > 1 ? "s" : ""}`,
      };
    }

    return status;
  });

  const liveKpis = data.kpis.map((kpi) => {
    if (kpi.id !== "mrr") return kpi;
    return {
      ...kpi,
      hint: `${data.revenue.activeSubscriptions} abonnement${data.revenue.activeSubscriptions > 1 ? "s" : ""} Stripe`,
    };
  });

  const normalizedSearch = deferredSearchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      !normalizedSearch ||
      user.name.toLowerCase().includes(normalizedSearch) ||
      user.email.toLowerCase().includes(normalizedSearch);
    const matchesPro = filterProOnly ? user.isPro : true;
    return matchesSearch && matchesPro;
  });
  const selectedUser = users.find((user) => user.id === selectedUserId) || null;

  const systemRiskCount = systemStatuses.filter(
    (status) => status.status === "critical" || status.status === "warning",
  ).length;
  const attentionCount = alerts.filter((alert) => alert.severity !== "success").length;

  const sections: AdminSidebarSection[] = [
    {
      id: "pilotage",
      label: "Pilotage",
      description: "Vue synthèse, alertes et activité récente.",
      icon: LayoutDashboard,
      badge: attentionCount > 0 ? String(attentionCount) : undefined,
    },
    {
      id: "utilisateurs",
      label: "Utilisateurs",
      description: "Inspection, modération et privilèges.",
      icon: Users,
      badge: users.length > 0 ? String(users.length) : undefined,
    },
    {
      id: "revenus",
      label: "Revenus",
      description: "MRR, conversion et lecture business réelle.",
      icon: Gauge,
      badge: `${data.revenue.mrr}€`,
    },
    {
      id: "acquisition",
      label: "Acquisition",
      description: "Prospection manuelle et moteur automatisé.",
      icon: RadioTower,
      badge: failedCount > 0 ? String(failedCount) : isCronEnabled ? "ON" : "OFF",
    },
    {
      id: "systeme",
      label: "Système",
      description: "Santé de la plateforme et configuration critique.",
      icon: Server,
      badge: systemRiskCount > 0 ? String(systemRiskCount) : undefined,
    },
  ];

  function renderUserBadges(user: AdminUserRow) {
    return (
      <div className="flex flex-wrap gap-2">
        <span
          className={`admin-chip ${user.isPro ? "bg-sky-500/12 text-sky-100 ring-sky-300/20" : "bg-white/8 text-slate-200 ring-white/10"}`}
        >
          {user.isPro ? "PRO" : "Gratuit"}
        </span>
        {user.banned && (
          <span className="admin-chip bg-red-500/12 text-red-100 ring-red-300/20">Banni</span>
        )}
        {user.publicMetadata.isAdmin && (
          <span className="admin-chip bg-violet-500/12 text-violet-100 ring-violet-300/20">
            Admin
          </span>
        )}
      </div>
    );
  }

  function pushActivity(item: AdminActivityItem) {
    setActivityFeed((current) =>
      [item, ...current]
        .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
        .slice(0, 10),
    );
  }

  function openConfirmation(dialog: ConfirmDialogState) {
    setConfirmDialog(dialog);
  }

  async function handleDialogConfirm() {
    if (!confirmDialog) return;

    setConfirmPending(true);
    try {
      await confirmDialog.action();
      setConfirmDialog(null);
    } finally {
      setConfirmPending(false);
    }
  }

  async function handleTogglePro(user: AdminUserRow) {
    setLoadingUserId(user.id);
    try {
      await toggleUserProStatus(user.id, !user.isPro);
      setUsers((current) =>
        current.map((candidate) =>
          candidate.id === user.id
            ? {
                ...candidate,
                isPro: !user.isPro,
                publicMetadata: {
                  ...candidate.publicMetadata,
                  isPro: !user.isPro,
                },
              }
            : candidate,
        ),
      );
      toast.success(user.isPro ? "Statut PRO retiré" : "Statut PRO accordé");
      await mutateAuditLogs();
      pushActivity({
        id: `pro-${user.id}-${Date.now()}`,
        title: user.isPro ? "Statut PRO retiré" : "Statut PRO accordé",
        description: `${user.name} • ${user.email}`,
        timestamp: new Date().toISOString(),
        section: "utilisateurs",
        kind: "billing",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de modifier le statut PRO");
    } finally {
      setLoadingUserId(null);
    }
  }

  async function handleBanUser(user: AdminUserRow) {
    setLoadingUserId(user.id);
    try {
      await banUser(user.id, !user.banned);
      setUsers((current) =>
        current.map((candidate) =>
          candidate.id === user.id ? { ...candidate, banned: !user.banned } : candidate,
        ),
      );
      toast.success(user.banned ? "Utilisateur débanni" : "Utilisateur banni");
      await mutateAuditLogs();
      pushActivity({
        id: `ban-${user.id}-${Date.now()}`,
        title: user.banned ? "Compte débanni" : "Compte banni",
        description: `${user.name} • ${user.email}`,
        timestamp: new Date().toISOString(),
        section: "utilisateurs",
        kind: "system",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de modifier le statut de bannissement");
    } finally {
      setLoadingUserId(null);
    }
  }

  async function handleDeleteUser(user: AdminUserRow) {
    setLoadingUserId(user.id);
    try {
      await deleteUserAccount(user.id);
      setUsers((current) => current.filter((candidate) => candidate.id !== user.id));
      if (selectedUserId === user.id) {
        setSelectedUserId(null);
      }
      toast.success("Compte supprimé");
      await mutateAuditLogs();
      pushActivity({
        id: `delete-${user.id}-${Date.now()}`,
        title: "Compte supprimé",
        description: `${user.name} • ${user.email}`,
        timestamp: new Date().toISOString(),
        section: "utilisateurs",
        kind: "system",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de supprimer ce compte");
    } finally {
      setLoadingUserId(null);
    }
  }

  async function handleGrantAdmin(user: AdminUserRow) {
    setLoadingUserId(user.id);
    try {
      await grantAdminRole(user.id, !user.publicMetadata.isAdmin);
      setUsers((current) =>
        current.map((candidate) =>
          candidate.id === user.id
            ? {
                ...candidate,
                publicMetadata: {
                  ...candidate.publicMetadata,
                  isAdmin: !user.publicMetadata.isAdmin,
                },
              }
            : candidate,
        ),
      );
      toast.success(
        user.publicMetadata.isAdmin ? "Droits admin retirés" : "Droits admin accordés",
      );
      await mutateAuditLogs();
      pushActivity({
        id: `admin-${user.id}-${Date.now()}`,
        title: user.publicMetadata.isAdmin ? "Droits admin retirés" : "Droits admin accordés",
        description: `${user.name} • ${user.email}`,
        timestamp: new Date().toISOString(),
        section: "utilisateurs",
        kind: "system",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de modifier les droits admin");
    } finally {
      setLoadingUserId(null);
    }
  }

  async function handleSetBanner() {
    setSavingBanner(true);
    try {
      await setSystemBanner(bannerText);
      toast.success(bannerText ? "Bannière système déployée" : "Bannière système supprimée");
      await mutateAuditLogs();
      pushActivity({
        id: `banner-${Date.now()}`,
        title: bannerText ? "Bannière système mise à jour" : "Bannière système supprimée",
        description: bannerText || "Aucun message actif",
        timestamp: new Date().toISOString(),
        section: "systeme",
        kind: "system",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de mettre à jour la bannière");
    } finally {
      setSavingBanner(false);
    }
  }

  async function handleSaveMaintenance() {
    setSavingMaintenance(true);
    try {
      await setMaintenanceMode(maintenanceEnabled, maintenanceMessage);
      await mutateAuditLogs();
      toast.success(
        maintenanceEnabled ? "Mode maintenance activé" : "Mode maintenance désactivé",
      );
      pushActivity({
        id: `maintenance-${Date.now()}`,
        title: maintenanceEnabled ? "Mode maintenance activé" : "Mode maintenance désactivé",
        description:
          maintenanceMessage || "Aucun message de maintenance personnalisé n'est défini.",
        timestamp: new Date().toISOString(),
        section: "systeme",
        kind: "system",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de mettre à jour le mode maintenance");
    } finally {
      setSavingMaintenance(false);
    }
  }

  async function handleSaveGeminiKey() {
    setSavingGeminiKey(true);
    try {
      const formData = new FormData();
      formData.set("geminiKey", geminiKey);
      await updateAdminSettings(formData);
      toast.success("Clé Gemini sauvegardée");
      await mutateAuditLogs();
      pushActivity({
        id: `gemini-${Date.now()}`,
        title: "Configuration Gemini mise à jour",
        description: geminiKey ? "Surcharge admin active" : "Retour à la configuration serveur",
        timestamp: new Date().toISOString(),
        section: "systeme",
        kind: "system",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de sauvegarder la clé Gemini");
    } finally {
      setSavingGeminiKey(false);
    }
  }

  async function handleMarkAsFailed(mail: AdminMailItem) {
    try {
      await markMailAsFailed(mail.id);
      await mutateMails();
      await mutateAuditLogs();
      toast.success("Email marqué comme échec");
      pushActivity({
        id: `mail-failed-${mail.id}-${Date.now()}`,
        title: "Envoi marqué en échec",
        description: `${mail.email} • ${mail.source}`,
        timestamp: new Date().toISOString(),
        section: "acquisition",
        kind: "acquisition",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de marquer cet envoi en échec");
    }
  }

  async function handleTestCron() {
    setTestingCron(true);
    setProspectMessage(null);
    try {
      const response = await fetch("/api/cron/prospect");
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || payload.message || "Erreur lors du test du robot");
      }

      const message = payload.message || "Robot exécuté avec succès";
      setProspectMessage({ text: message, type: "success" });
      toast.success(message);
      await mutateMails();
      await mutateAuditLogs();
      pushActivity({
        id: `cron-test-${Date.now()}`,
        title: "Test du robot exécuté",
        description: message,
        timestamp: new Date().toISOString(),
        section: "acquisition",
        kind: "acquisition",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de l'exécution du robot";
      setProspectMessage({ text: message, type: "error" });
      toast.error(message);
    } finally {
      setTestingCron(false);
    }
  }

  async function handleToggleCron() {
    setTogglingCron(true);
    try {
      const newValue = isCronEnabled ? "false" : "true";
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "cron_prospect_enabled", value: newValue }),
      });

      if (!response.ok) {
        throw new Error("Impossible de modifier l'état du robot");
      }

      await mutateCron({ value: newValue }, { revalidate: false });
      await mutateAuditLogs();
      toast.success(newValue === "true" ? "Robot réactivé" : "Robot désactivé");
      pushActivity({
        id: `cron-toggle-${Date.now()}`,
        title: newValue === "true" ? "Robot réactivé" : "Robot désactivé",
        description: "Mise à jour du paramètre cron_prospect_enabled",
        timestamp: new Date().toISOString(),
        section: "acquisition",
        kind: "system",
      });
    } catch (error) {
      console.error(error);
      toast.error("Impossible de modifier l'état du robot");
    } finally {
      setTogglingCron(false);
    }
  }

  async function handleSendProspect(event: FormEvent) {
    event.preventDefault();
    const emails = prospectEmail
      .split(/[\s,;]+/)
      .map((value) => value.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      toast.error("Ajoute au moins un email valide");
      return;
    }

    setSendingProspect(true);
    setProspectMessage(null);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const email of emails) {
        const response = await fetch("/api/admin/mail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          successCount += 1;
        } else {
          failCount += 1;
        }
      }

      await mutateMails();
      await mutateAuditLogs();

      if (failCount === 0) {
        const message = `${successCount} email(s) envoyé(s) avec succès.`;
        setProspectMessage({ text: message, type: "success" });
        setProspectEmail("");
        toast.success(message);
      } else {
        const message = `${successCount} envoyés, ${failCount} en erreur.`;
        setProspectMessage({ text: message, type: "error" });
        toast.error(message);
      }

      pushActivity({
        id: `manual-campaign-${Date.now()}`,
        title: "Envoi manuel de prospection",
        description: `${emails.length} destinataire(s) ciblé(s)`,
        timestamp: new Date().toISOString(),
        section: "acquisition",
        kind: "acquisition",
      });
    } catch (error) {
      console.error(error);
      const message = "Erreur lors de l'envoi des emails";
      setProspectMessage({ text: message, type: "error" });
      toast.error(message);
    } finally {
      setSendingProspect(false);
    }
  }

  function handleExportCSV() {
    const headers = ["Nom", "Email", "Inscription", "Statut", "Devis IA"];
    const rows = users.map((user) => [
      user.name,
      user.email,
      user.createdAt ? new Date(user.createdAt).toLocaleDateString("fr-FR") : "",
      user.isPro ? "PRO" : "Gratuit",
      String(user.aiGenerations),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${cell.replace(/"/g, '""')}"`)
          .join(";"),
      )
      .join("\n");
    const blob = new Blob(["\ufeff" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `zolio-admin-users-${new Date().toISOString().split("T")[0]}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Export utilisateurs généré");
  }

  const currentSectionMeta = sections.find((section) => section.id === activeSection);

  function renderQuickAction() {
    if (activeSection === "utilisateurs") {
      return (
        <button
          type="button"
          onClick={handleExportCSV}
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
        >
          <span className="inline-flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter les utilisateurs
          </span>
        </button>
      );
    }

    if (activeSection === "acquisition") {
      return (
        <button
          type="button"
          onClick={handleTestCron}
          disabled={testingCron}
          className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 sm:w-auto"
        >
          <span className="inline-flex items-center gap-2">
            {testingCron ? <Loader2 className="h-4 w-4 animate-spin" /> : <RadioTower className="h-4 w-4" />}
            {testingCron ? "Exécution..." : "Tester le robot"}
          </span>
        </button>
      );
    }

    return null;
  }

  function renderPilotage() {
    return (
      <div className="space-y-6">
        <section className="admin-panel-strong relative overflow-hidden rounded-[34px] p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(244,114,182,0.16),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.05),transparent)]" />
          <div className="relative grid gap-8 xl:grid-cols-[1.35fr_0.95fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.34em] text-violet-200/70">
                Poste de pilotage
              </p>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Un centre de contrôle plus net, plus dense, plus utile.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Tu vois ici les signaux qui demandent une action, la traction récente et les briques
                critiques de la plateforme, sans faux modules ni bruit décoratif.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setActiveSection("acquisition")}
                  className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 sm:w-auto"
                >
                  Passer en acquisition
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection("utilisateurs")}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Inspecter les utilisateurs
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[26px] bg-white/6 p-4 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Alertes ouvertes</p>
                <p className="mt-4 text-3xl font-semibold text-white">{attentionCount}</p>
                <p className="mt-2 text-sm text-slate-300">Signalements qui demandent une décision.</p>
              </div>
              <div className="rounded-[26px] bg-white/6 p-4 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Base de données</p>
                <p className="mt-4 text-3xl font-semibold text-white">
                  {data.environment.dbLatencyMs === null ? "N/A" : `${data.environment.dbLatencyMs} ms`}
                </p>
                <p className="mt-2 text-sm text-slate-300">Dernière mesure de disponibilité Prisma.</p>
              </div>
              <div className="rounded-[26px] bg-white/6 p-4 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Robot acquisition</p>
                <p className="mt-4 text-3xl font-semibold text-white">{isCronEnabled ? "ON" : "OFF"}</p>
                <p className="mt-2 text-sm text-slate-300">Moteur automatisé de prospection.</p>
              </div>
              <div className="rounded-[26px] bg-white/6 p-4 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Délivrabilité</p>
                <p className="mt-4 text-3xl font-semibold text-white">{deliveryRate}%</p>
                <p className="mt-2 text-sm text-slate-300">Ratio d&apos;emails envoyés avec succès.</p>
              </div>
            </div>
          </div>
        </section>

        <AdminKpiStrip items={liveKpis} />

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel
            title="Alertes à traiter"
            description="Des signaux opérationnels triés par impact réel. Chaque carte t’amène au bon module."
          >
            <div className="grid gap-3">
              {alerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => setActiveSection(alert.section)}
                  className={`rounded-[26px] border p-4 text-left transition hover:translate-y-[-1px] hover:border-white/16 ${alertClasses(alert.severity)}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold">
                        {alertIcon(alert.severity)}
                        {alert.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-white/72">{alert.description}</p>
                    </div>
                    <span className="mt-1 inline-flex items-center gap-1 text-xs text-white/70">
                      {alert.ctaLabel}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Panel>

          <div className="grid gap-6">
            <Panel
              title="Activité récente"
              description="Ce qui vient de se passer sur la plateforme ou dans les actions admin."
            >
              <div className="space-y-3">
                {activityFeed.length === 0 ? (
                  <div className="rounded-[24px] border border-dashed border-white/12 bg-white/4 px-4 py-6 text-sm text-slate-400">
                    Aucun événement récent à afficher pour le moment.
                  </div>
                ) : (
                  activityFeed.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSection(item.section)}
                      className="flex w-full items-start justify-between gap-4 rounded-[24px] border border-white/8 bg-white/4 px-4 py-4 text-left transition hover:border-white/14 hover:bg-white/6"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{item.description}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-slate-500">{formatTimeAgo(item.timestamp)}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.timestamp)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </Panel>

            <Panel
              title="Santé système"
              description="Lecture rapide des briques critiques. Pas de faux logs, uniquement des états réels ou assumés."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {systemStatuses.slice(0, 4).map((status) => (
                  <button
                    key={status.id}
                    type="button"
                    onClick={() => setActiveSection("systeme")}
                    className="rounded-[24px] border border-white/8 bg-white/4 p-4 text-left transition hover:border-white/14 hover:bg-white/6"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-white">{status.label}</p>
                      <span className={`admin-chip ${systemStatusClasses(status.status)}`}>{status.status}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">{status.detail}</p>
                    {status.meta && <p className="mt-2 text-xs text-slate-500">{status.meta}</p>}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    );
  }

  function renderUsers() {
    return (
      <div className="space-y-6">
        <Panel
          title="Base utilisateurs"
          description="Inspection, privilèges et modération dans une table plus lisible. Les actions sensibles passent par le panneau latéral."
          action={
            <button
              type="button"
              onClick={handleExportCSV}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 sm:w-auto"
            >
              <span className="inline-flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </span>
            </button>
          }
        >
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Rechercher par nom ou email..."
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-300/30 focus:bg-white/7"
              />
            </div>

            <button
              type="button"
              onClick={() => setFilterProOnly((current) => !current)}
              className={`w-full rounded-2xl border px-4 py-3 text-sm font-medium transition ${filterProOnly ? "border-sky-300/20 bg-sky-400/10 text-sky-100" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"}`}
            >
              {filterProOnly ? "Filtre PRO actif" : "Filtrer PRO uniquement"}
            </button>
          </div>

          <div className="mt-6 space-y-3 md:hidden">
            {filteredUsers.map((user) => (
              <article
                key={user.id}
                className="rounded-[26px] border border-white/8 bg-white/4 p-4 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.72)]"
              >
                <button
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className="flex w-full items-start gap-3 text-left"
                >
                  {user.imageUrl ? (
                    <>
                      {/* External avatar URLs come from Clerk and are not optimized locally. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.imageUrl}
                        alt={user.name}
                        className="h-12 w-12 rounded-2xl object-cover ring-1 ring-white/10"
                      />
                    </>
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                        <p className="mt-1 truncate text-sm text-slate-400">{user.email}</p>
                      </div>
                      <span className="admin-chip bg-white/8 text-slate-200 ring-white/10">
                        {user.aiGenerations} IA
                      </span>
                    </div>
                  </div>
                </button>

                <div className="mt-4">{renderUserBadges(user)}</div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Dernière connexion
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {formatDateTime(user.lastSignInAt)}
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-white/8 bg-slate-950/35 p-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Inscription
                    </p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {formatDateTime(user.createdAt)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Inspecter ce compte
                </button>
              </article>
            ))}
            {filteredUsers.length === 0 && (
              <div className="rounded-[26px] border border-dashed border-white/12 bg-white/4 px-4 py-10 text-center text-sm text-slate-400">
                Aucun utilisateur ne correspond à ce filtre.
              </div>
            )}
          </div>

          <div className="mt-6 hidden overflow-hidden rounded-[26px] border border-white/8 md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-white/4 text-xs uppercase tracking-[0.24em] text-slate-500">
                  <tr>
                    <th className="px-4 py-4 font-medium">Utilisateur</th>
                    <th className="px-4 py-4 font-medium">Statut</th>
                    <th className="px-4 py-4 font-medium">IA</th>
                    <th className="px-4 py-4 font-medium">Dernière connexion</th>
                    <th className="px-4 py-4 font-medium text-right">Inspection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/8">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className={`transition hover:bg-white/[0.045] ${selectedUserId === user.id ? "bg-white/[0.055]" : ""}`}
                    >
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                          className="flex items-center gap-3 text-left"
                        >
                          {user.imageUrl ? (
                            <>
                              {/* External avatar URLs come from Clerk and are not optimized locally. */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={user.imageUrl}
                                alt={user.name}
                                className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10"
                              />
                            </>
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-sm font-semibold text-white">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">{user.name}</p>
                            <p className="truncate text-sm text-slate-400">{user.email}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        {renderUserBadges(user)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-300">{user.aiGenerations}</td>
                      <td className="px-4 py-4 text-sm text-slate-400">
                        {formatDateTime(user.lastSignInAt)}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(user.id)}
                          className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/10"
                        >
                          Inspecter
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400">
                        Aucun utilisateur ne correspond à ce filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-400">
            <span>{filteredUsers.length} utilisateur(s) affiché(s)</span>
            <span className="text-slate-600">•</span>
            <span>{users.filter((user) => user.isPro).length} compte(s) PRO</span>
            <span className="text-slate-600">•</span>
            <span>{users.filter((user) => user.banned).length} compte(s) banni(s)</span>
          </div>
        </Panel>
      </div>
    );
  }

  function renderRevenue() {
    const businessSignals = [
      {
        title: "Source de vérité",
        value: data.revenue.sourceLabel,
        detail: data.environment.hasStripe
          ? "Les abonnements actifs sont lus depuis Stripe."
          : "Le MRR est estimé à partir des comptes PRO.",
      },
      {
        title: "Conversion globale",
        value: `${data.revenue.conversionRate}%`,
        detail: `${data.revenue.proUsers} comptes PRO sur ${data.revenue.totalUsers} utilisateurs.`,
      },
      {
        title: "Arrivée récente",
        value: `${data.revenue.recentUsersCount}`,
        detail: "Nouveaux comptes sur les 30 derniers jours.",
      },
    ];
    const monetizationSignals = [
      {
        title: "PRO via Stripe",
        value: `${data.revenue.stripeBackedProUsers}`,
        detail: "Comptes PRO rattachés à un abonnement Stripe actif ou historisé.",
      },
      {
        title: "PRO manuels",
        value: `${data.revenue.manualProUsers}`,
        detail: "Comptes PRO accordés côté admin sans souscription Stripe détectée.",
      },
      {
        title: "Croissance 30j",
        value: `${data.revenue.userGrowthDelta >= 0 ? "+" : ""}${data.revenue.userGrowthDelta}%`,
        detail: `${data.revenue.previousPeriodUsersCount} inscriptions sur la période précédente.`,
      },
      {
        title: "Adoption IA",
        value: `${data.revenue.aiAdoptionRate}%`,
        detail: `${data.revenue.aiActiveUsers} compte(s) ont déjà généré au moins un devis IA.`,
      },
    ];

    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="admin-kpi-card bg-gradient-to-br from-emerald-500/18 via-emerald-400/10 to-transparent">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">MRR estimé</p>
            <p className="mt-4 text-3xl font-semibold text-white">{data.revenue.mrr} €</p>
            <p className="mt-3 text-sm text-slate-300">{data.revenue.sourceLabel}</p>
          </div>
          <div className="admin-kpi-card bg-gradient-to-br from-violet-500/18 via-fuchsia-500/10 to-transparent">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">ARR estimé</p>
            <p className="mt-4 text-3xl font-semibold text-white">{data.revenue.estimatedArr} €</p>
            <p className="mt-3 text-sm text-slate-300">Projection simple sur 12 mois.</p>
          </div>
          <div className="admin-kpi-card bg-gradient-to-br from-sky-500/18 via-sky-400/10 to-transparent">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Abonnements actifs</p>
            <p className="mt-4 text-3xl font-semibold text-white">{data.revenue.activeSubscriptions}</p>
            <p className="mt-3 text-sm text-slate-300">Souscriptions actuellement actives.</p>
          </div>
          <div className="admin-kpi-card bg-gradient-to-br from-amber-400/18 via-orange-400/10 to-transparent">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Conversion</p>
            <p className="mt-4 text-3xl font-semibold text-white">{data.revenue.conversionRate}%</p>
            <p className="mt-3 text-sm text-slate-300">Transformation global free vers PRO.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel
            title="Lecture business réelle"
            description="Seulement des indicateurs calculables aujourd’hui, sans graphiques inventés ni promesses produit."
          >
            <div className="grid gap-4 md:grid-cols-3">
              {businessSignals.map((signal) => (
                <article
                  key={signal.title}
                  className="rounded-[26px] border border-white/8 bg-white/4 p-5"
                >
                  <p className="text-sm text-slate-400">{signal.title}</p>
                  <p className="mt-4 text-2xl font-semibold text-white">{signal.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{signal.detail}</p>
                </article>
              ))}
            </div>
          </Panel>

          <Panel
            title="Lecture monétisation & usage"
            description="Un deuxième niveau de lecture pour distinguer abonnement réel, attribution manuelle et adoption produit."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {monetizationSignals.map((signal) => (
                <article
                  key={signal.title}
                  className="rounded-[26px] border border-white/8 bg-white/4 p-5"
                >
                  <p className="text-sm text-slate-400">{signal.title}</p>
                  <p className="mt-4 text-2xl font-semibold text-white">{signal.value}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{signal.detail}</p>
                </article>
              ))}
              <article className="rounded-[26px] border border-white/8 bg-white/4 p-5 md:col-span-2">
                <div className="flex items-center gap-3">
                  <MessageSquareDashed className="h-5 w-5 text-slate-400" />
                  <h4 className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
                    Intensité produit
                  </h4>
                </div>
                <p className="mt-4 text-2xl font-semibold text-white">
                  {data.revenue.averageAiGenerationsPerActiveUser}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  Nombre moyen de devis IA par compte déjà actif sur l’IA. Cette carte donne une
                  vraie lecture d’intensité produit calculée sur les usages existants.
                </p>
              </article>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  function renderAcquisition() {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="admin-kpi-card bg-gradient-to-br from-violet-500/18 via-fuchsia-500/10 to-transparent">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Total envoyés</p>
            <p className="mt-4 text-3xl font-semibold text-white">{totalMailCount}</p>
            <p className="mt-3 text-sm text-slate-300">{manualCount} manuels • {automatedCount} auto</p>
          </div>
          <div className="admin-kpi-card bg-gradient-to-br from-emerald-500/18 via-emerald-400/10 to-transparent">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Délivrabilité</p>
            <p className="mt-4 text-3xl font-semibold text-white">{deliveryRate}%</p>
            <p className="mt-3 text-sm text-slate-300">{sentCount} succès confirmés</p>
          </div>
          <div className="admin-kpi-card bg-gradient-to-br from-red-500/18 via-red-400/10 to-transparent">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Échecs</p>
            <p className="mt-4 text-3xl font-semibold text-white">{failedCount}</p>
            <p className="mt-3 text-sm text-slate-300">Requiert une revue ou un rebond contrôlé.</p>
          </div>
          <div className="admin-kpi-card bg-gradient-to-br from-sky-500/18 via-sky-400/10 to-transparent">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">Robot</p>
            <p className="mt-4 text-3xl font-semibold text-white">{isCronEnabled ? "ON" : "OFF"}</p>
            <p className="mt-3 text-sm text-slate-300">Piloté par cron + secret serveur.</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Panel
            title="Cockpit d’acquisition"
            description="Tout le nécessaire pour piloter la prospection réelle: état du robot, test manuel et campagne ciblée."
            action={
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleTestCron}
                  disabled={testingCron}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50 sm:w-auto"
                >
                  <span className="inline-flex items-center gap-2">
                    {testingCron ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock3 className="h-4 w-4" />}
                    {testingCron ? "Exécution..." : "Tester"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleCron}
                  disabled={togglingCron}
                  className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:opacity-50 sm:w-auto ${isCronEnabled ? "bg-white text-slate-950 hover:bg-slate-100" : "bg-amber-400 text-slate-950 hover:bg-amber-300"}`}
                >
                  {togglingCron ? "Mise à jour..." : isCronEnabled ? "Désactiver le robot" : "Activer le robot"}
                </button>
              </div>
            }
          >
            <div className="rounded-[26px] border border-white/8 bg-white/4 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`admin-chip ${isCronEnabled ? "bg-emerald-500/12 text-emerald-100 ring-emerald-300/20" : "bg-amber-400/12 text-amber-100 ring-amber-300/20"}`}>
                  {isCronEnabled ? "Robot activé" : "Robot désactivé"}
                </span>
                <span className="admin-chip bg-white/8 text-slate-200 ring-white/10">
                  {data.environment.hasHunter ? "Hunter configuré" : "Hunter optionnel absent"}
                </span>
                <span className={`admin-chip ${data.environment.hasCronSecret ? "bg-white/8 text-slate-200 ring-white/10" : "bg-red-500/12 text-red-100 ring-red-300/20"}`}>
                  {data.environment.hasCronSecret ? "CRON_SECRET présent" : "CRON_SECRET absent"}
                </span>
              </div>

              <form onSubmit={handleSendProspect} className="mt-5 space-y-4">
                <textarea
                  placeholder="contact@artisan.fr, dupont@plomberie.fr, ..."
                  rows={5}
                  value={prospectEmail}
                  onChange={(event) => setProspectEmail(event.target.value)}
                  className="w-full rounded-[24px] border border-white/10 bg-slate-950/45 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-300/25"
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-400">
                    Envoi manuel en lot. Les adresses peuvent être séparées par espace, virgule ou point-virgule.
                  </p>
                  <button
                    type="submit"
                    disabled={sendingProspect || !prospectEmail.trim()}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
                  >
                    <span className="inline-flex items-center gap-2">
                      {sendingProspect ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {sendingProspect ? "Envoi en cours..." : "Lancer la campagne"}
                    </span>
                  </button>
                </div>
              </form>

              {prospectMessage && (
                <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${prospectMessage.type === "success" ? "border-emerald-300/16 bg-emerald-500/10 text-emerald-100" : "border-red-300/16 bg-red-500/10 text-red-100"}`}>
                  {prospectMessage.text}
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Historique d’envoi"
            description="Journal réel des envois de prospection. Les échecs peuvent être marqués proprement depuis ici."
          >
            {mails.length === 0 ? (
              <div className="rounded-[26px] border border-dashed border-white/12 bg-white/4 px-5 py-10 text-center text-sm text-slate-400">
                Aucun envoi enregistré pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {mails.slice(0, 12).map((mail) => (
                  <article
                    key={mail.id}
                    className="rounded-[24px] border border-white/8 bg-white/4 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{mail.email}</p>
                        <p className="mt-1 text-sm text-slate-400">
                          {mail.source === "Manual" ? "Manuel" : "Automatique"} • {formatDateTime(mail.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`admin-chip ${mail.status === "Sent" ? "bg-emerald-500/12 text-emerald-100 ring-emerald-300/20" : "bg-red-500/12 text-red-100 ring-red-300/20"}`}>
                          {mail.status === "Sent" ? "Envoyé" : "Échec"}
                        </span>
                        {mail.status === "Sent" && (
                          <button
                            type="button"
                            onClick={() => handleMarkAsFailed(mail)}
                            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10"
                          >
                            Marquer en échec
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    );
  }

  function renderSystem() {
    const healthyCount = systemStatuses.filter((status) => status.status === "healthy").length;

    return (
      <div className="space-y-6">
        <Panel
          title="Santé de la plateforme"
          description="États réels des intégrations et de la configuration critique qui soutiennent Zolio."
          action={
            <div className="admin-chip bg-white/8 text-slate-200 ring-white/10">
              {healthyCount}/{systemStatuses.length} briques au vert
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {systemStatuses.map((status) => (
              <article
                key={status.id}
                className="rounded-[26px] border border-white/8 bg-white/4 p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-white">{status.label}</p>
                  <span className={`admin-chip ${systemStatusClasses(status.status)}`}>{status.status}</span>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-400">{status.detail}</p>
                {status.meta && <p className="mt-3 text-xs text-slate-500">{status.meta}</p>}
              </article>
            ))}
          </div>
        </Panel>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel
            title="Configuration admin"
            description="Réglages utiles immédiatement. Les feedbacks passent en inline et en toast, sans alertes natives."
          >
            <div className="space-y-6">
              <div className="rounded-[26px] border border-white/8 bg-white/4 p-5">
                <label className="block text-sm font-medium text-white">
                  Bannière d’information globale
                </label>
                <textarea
                  rows={4}
                  value={bannerText}
                  onChange={(event) => setBannerText(event.target.value)}
                  placeholder="Maintenance prévue ce soir à 23h..."
                  className="mt-3 w-full rounded-[22px] border border-white/10 bg-slate-950/45 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-300/25"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSetBanner}
                    disabled={savingBanner}
                    className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 disabled:opacity-50 sm:w-auto"
                  >
                    {savingBanner ? "Mise à jour..." : bannerText ? "Déployer la bannière" : "Supprimer la bannière"}
                  </button>
                  <span className="text-sm text-slate-400">
                    {bannerText ? "Message prêt à être publié à tous les utilisateurs." : "Aucun message global actif."}
                  </span>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/8 bg-white/4 p-5">
                <label className="block text-sm font-medium text-white">
                  Clé Gemini admin
                </label>
                <input
                  type="password"
                  value={geminiKey}
                  onChange={(event) => setGeminiKey(event.target.value)}
                  placeholder="Laisser vide pour utiliser la clé serveur"
                  className="mt-3 w-full rounded-[22px] border border-white/10 bg-slate-950/45 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-300/25"
                />
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveGeminiKey}
                    disabled={savingGeminiKey}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
                  >
                    {savingGeminiKey ? "Sauvegarde..." : "Sauvegarder la clé"}
                  </button>
                  <span className="text-sm text-slate-400">
                    {geminiKey ? "Surcharge admin active pour les tests." : "La configuration serveur reste prioritaire."}
                  </span>
                </div>
              </div>
            </div>
          </Panel>

          <Panel
            title="Maintenance & journal"
            description="Un vrai levier d’exploitation pour couper proprement l’accès public et garder une trace de ce qui s’est passé."
          >
            <div className="space-y-5">
              <div className="rounded-[26px] border border-white/8 bg-white/4 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-violet-200" />
                      <p className="text-sm font-medium text-white">Mode maintenance global</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Quand il est actif, les visiteurs non admin voient un écran de maintenance sur l’ensemble du site. Les admins gardent l’accès au cockpit.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaintenanceEnabled((current) => !current)}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold transition sm:w-auto ${maintenanceEnabled ? "bg-amber-400 text-slate-950 hover:bg-amber-300" : "border border-white/10 bg-white/6 text-white hover:bg-white/10"}`}
                  >
                    {maintenanceEnabled ? "Désactiver" : "Activer"}
                  </button>
                </div>

                <textarea
                  rows={4}
                  value={maintenanceMessage}
                  onChange={(event) => setMaintenanceMessage(event.target.value)}
                  placeholder="Maintenance en cours. Retour estimé à 23h15..."
                  className="mt-4 w-full rounded-[22px] border border-white/10 bg-slate-950/45 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-300/25"
                />

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`admin-chip ${maintenanceEnabled ? "bg-amber-400/12 text-amber-100 ring-amber-300/20" : "bg-emerald-500/12 text-emerald-100 ring-emerald-300/20"}`}>
                      {maintenanceEnabled ? "Maintenance active" : "Site ouvert"}
                    </span>
                    <span className="admin-chip bg-white/8 text-slate-200 ring-white/10">
                      Bypass admin actif
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveMaintenance}
                    disabled={savingMaintenance}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
                  >
                    {savingMaintenance ? "Mise à jour..." : "Appliquer la maintenance"}
                  </button>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/8 bg-white/4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-sky-200" />
                    <div>
                      <p className="text-sm font-medium text-white">Journal admin centralisé</p>
                      <p className="mt-1 text-sm text-slate-400">
                        Actions sensibles, erreurs serveur et changements système récents.
                      </p>
                    </div>
                  </div>
                  <span className="admin-chip bg-white/8 text-slate-200 ring-white/10">
                    {auditLogs.length} entrée{auditLogs.length > 1 ? "s" : ""}
                  </span>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="mt-4 rounded-[22px] border border-dashed border-white/12 bg-slate-950/35 px-4 py-8 text-sm text-slate-400">
                    Aucune entrée de journal pour le moment.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {auditLogs.slice(0, 10).map((log) => (
                      <article
                        key={log.id}
                        className="rounded-[22px] border border-white/8 bg-slate-950/35 p-4"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`admin-chip ${auditLogLevelClasses(log.level)}`}>
                                {log.level}
                              </span>
                              <span className="admin-chip bg-white/8 text-slate-200 ring-white/10">
                                {log.scope}
                              </span>
                              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">
                                {log.action}
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-medium text-white">{log.message}</p>
                            <p className="mt-2 text-sm text-slate-400">{log.actor}</p>
                            {log.meta && (
                              <p className="mt-2 font-mono text-xs text-slate-500">{log.meta}</p>
                            )}
                          </div>
                          <div className="shrink-0 text-right text-xs text-slate-500">
                            <p>{formatTimeAgo(log.createdAt)}</p>
                            <p className="mt-1">{formatDateTime(log.createdAt)}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen admin-cockpit">
      <div className="pointer-events-none absolute inset-0 admin-grid-overlay" />

      <div className="relative flex min-h-screen pb-[calc(env(safe-area-inset-bottom)+5.75rem)] lg:pb-0">
        <AdminSidebar
          activeSection={activeSection}
          currentAdmin={data.currentAdmin}
          heroStatus={heroStatus}
          sections={sections}
          onSelect={setActiveSection}
        />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-slate-950/55 backdrop-blur-xl">
            <div className="px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.34em] text-slate-500">Administration</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                    <h1 className="text-3xl font-semibold tracking-tight text-white">
                      {currentSectionMeta?.label}
                    </h1>
                    <span className={`admin-chip ${heroStatus.tone === "critical" ? "bg-red-500/12 text-red-100 ring-red-300/18" : heroStatus.tone === "warning" ? "bg-amber-400/12 text-amber-100 ring-amber-300/18" : "bg-emerald-500/12 text-emerald-100 ring-emerald-300/18"}`}>
                      {heroStatus.label}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                    {currentSectionMeta?.description}
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-3 xl:w-auto">
                  {renderQuickAction()}
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="mx-auto max-w-[1540px]"
              >
                {activeSection === "pilotage" && renderPilotage()}
                {activeSection === "utilisateurs" && renderUsers()}
                {activeSection === "revenus" && renderRevenue()}
                {activeSection === "acquisition" && renderAcquisition()}
                {activeSection === "systeme" && renderSystem()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AdminUserDrawer
        open={Boolean(selectedUser)}
        user={selectedUser}
        pending={loadingUserId === selectedUser?.id}
        onClose={() => setSelectedUserId(null)}
        onTogglePro={() => {
          if (!selectedUser) return;
          openConfirmation({
            title: selectedUser.isPro ? "Retirer le statut PRO ?" : "Accorder le statut PRO ?",
            description: `${selectedUser.name} conservera son compte, mais ses accès premium seront ${selectedUser.isPro ? "retirés" : "activés"}.`,
            confirmLabel: selectedUser.isPro ? "Retirer PRO" : "Accorder PRO",
            tone: "brand",
            action: async () => handleTogglePro(selectedUser),
          });
        }}
        onGrantAdmin={() => {
          if (!selectedUser) return;
          openConfirmation({
            title: selectedUser.publicMetadata.isAdmin ? "Retirer les droits admin ?" : "Promouvoir administrateur ?",
            description: `${selectedUser.name} ${selectedUser.publicMetadata.isAdmin ? "perdra" : "obtiendra"} l’accès complet au cockpit admin.`,
            confirmLabel: selectedUser.publicMetadata.isAdmin ? "Retirer les droits" : "Promouvoir admin",
            tone: "warning",
            action: async () => handleGrantAdmin(selectedUser),
          });
        }}
        onToggleBan={() => {
          if (!selectedUser) return;
          openConfirmation({
            title: selectedUser.banned ? "Débannir ce compte ?" : "Bannir ce compte ?",
            description: `${selectedUser.name} ${selectedUser.banned ? "retrouvera l’accès à la plateforme" : "sera bloqué au prochain contrôle d’accès"}.`,
            confirmLabel: selectedUser.banned ? "Débannir" : "Bannir",
            tone: "warning",
            action: async () => handleBanUser(selectedUser),
          });
        }}
        onDelete={() => {
          if (!selectedUser) return;
          openConfirmation({
            title: "Supprimer définitivement ce compte ?",
            description: `Le compte de ${selectedUser.name} sera supprimé de manière irréversible.`,
            confirmLabel: "Supprimer le compte",
            tone: "danger",
            action: async () => handleDeleteUser(selectedUser),
          });
        }}
      />

      <AdminConfirmDialog
        dialog={
          confirmDialog
            ? {
                title: confirmDialog.title,
                description: confirmDialog.description,
                confirmLabel: confirmDialog.confirmLabel,
                tone: confirmDialog.tone,
              }
            : null
        }
        isPending={confirmPending}
        onClose={() => !confirmPending && setConfirmDialog(null)}
        onConfirm={handleDialogConfirm}
      />

      <AdminMobileNav
        activeSection={activeSection}
        sections={sections}
        onSelect={setActiveSection}
      />
    </div>
  );
}
