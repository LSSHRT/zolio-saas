import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type StatusTone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface DetailHeaderProps {
  /** breadcrumbs au-dessus du titre, fil d'ariane */
  breadcrumbs?: BreadcrumbItem[];
  /** eyebrow uppercase au-dessus du titre */
  eyebrow?: string;
  /** titre principal de la page détail */
  title: ReactNode;
  /** description sous le titre */
  description?: ReactNode;
  /** badge statut (ex: "Accepté", "Payée") */
  status?: { label: string; tone?: StatusTone; icon?: LucideIcon };
  /** identité visuelle (avatar / icône) */
  avatar?: ReactNode;
  /** zone d'actions à droite */
  actions?: ReactNode;
  /** rangée de KPIs en bas du header */
  metrics?: ReactNode;
  className?: string;
}

const statusToneMap: Record<StatusTone, string> = {
  neutral: "lg-v2-pill-neutral",
  primary: "lg-v2-pill-primary",
  success: "lg-v2-pill-success",
  warning: "lg-v2-pill-warning",
  danger: "lg-v2-pill-danger",
  info: "lg-v2-pill-info",
};

/**
 * Header pour pages détail (devis/facture/client) desktop.
 * 2 zones : identité (gauche) + actions (droite), KPIs en strip en dessous.
 * À enrober dans `<div className="hidden lg:block">` pour le strict mobile-protect.
 */
export function DetailHeader({
  breadcrumbs,
  eyebrow,
  title,
  description,
  status,
  avatar,
  actions,
  metrics,
  className = "",
}: DetailHeaderProps) {
  const StatusIcon = status?.icon;
  return (
    <header className={`lg-v2-panel p-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav aria-label="Fil d'Ariane" className="mb-3 flex items-center gap-1.5 text-xs lg-v2-text-subtle">
          {breadcrumbs.map((crumb, i) => (
            <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 ? <ChevronRight size={12} aria-hidden /> : null}
              {crumb.href ? (
                <Link href={crumb.href} className="transition hover:lg-v2-text-muted">
                  {crumb.label}
                </Link>
              ) : (
                <span className="lg-v2-text-muted font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}

      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-start gap-4">
          {avatar ? <div className="shrink-0">{avatar}</div> : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {eyebrow ? <p className="lg-v2-eyebrow">{eyebrow}</p> : null}
              {status ? (
                <span className={`lg-v2-pill ${statusToneMap[status.tone ?? "neutral"]}`}>
                  {StatusIcon ? <StatusIcon size={11} aria-hidden /> : null}
                  {status.label}
                </span>
              ) : null}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight lg-v2-text-strong">{title}</h1>
            {description ? <p className="mt-1 text-sm lg-v2-text-muted">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>

      {metrics ? <div className="mt-6 border-t lg-v2-divider pt-5">{metrics}</div> : null}
    </header>
  );
}
