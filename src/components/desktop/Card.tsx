import type { ReactNode } from "react";

type CardVariant = "panel" | "panel-muted" | "card";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: CardVariant;
  as?: "div" | "section" | "article";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantClassMap: Record<CardVariant, string> = {
  panel: "lg-v2-panel",
  "panel-muted": "lg-v2-panel-muted",
  card: "lg-v2-card",
};

const paddingClassMap: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

/**
 * Surface v2 utilisée dans tout le SaaS côté desktop.
 * Pas de gradient, pas de backdrop-blur — un panneau opaque sobre.
 */
export function Card({
  children,
  className = "",
  variant = "panel",
  as: Tag = "section",
  padding = "lg",
}: CardProps) {
  return (
    <Tag className={`${variantClassMap[variant]} ${paddingClassMap[padding]} ${className}`}>
      {children}
    </Tag>
  );
}

interface CardHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ eyebrow, title, description, actions, className = "" }: CardHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        {eyebrow ? <p className="lg-v2-eyebrow">{eyebrow}</p> : null}
        <h2 className="mt-1 text-lg font-semibold lg-v2-text-strong">{title}</h2>
        {description ? <p className="mt-1 text-sm lg-v2-text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
