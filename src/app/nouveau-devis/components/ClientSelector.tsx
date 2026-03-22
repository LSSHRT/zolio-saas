import { Mail, MapPin, Phone, Plus, Search, UserCircle2, X } from "lucide-react";
import { ClientSectionCard } from "@/components/client-shell";
import type { Client, QuickClientForm } from "../types";

type ClientSelectorProps = {
  filteredClients: Client[];
  isCreating: boolean;
  isLoading: boolean;
  newClient: QuickClientForm;
  onClearSelection: () => void;
  onCreateClient: () => void;
  onNewClientChange: (field: keyof QuickClientForm, value: string) => void;
  onSearchChange: (value: string) => void;
  onSelectClient: (client: Client) => void;
  recentClients: Client[];
  searchValue: string;
  selectedClient: Client | null;
  showNewClient: boolean;
  onToggleNewClient: () => void;
};

export function ClientSelector({
  filteredClients,
  isCreating,
  isLoading,
  newClient,
  onClearSelection,
  onCreateClient,
  onNewClientChange,
  onSearchChange,
  onSelectClient,
  recentClients,
  searchValue,
  selectedClient,
  showNewClient,
  onToggleNewClient,
}: ClientSelectorProps) {
  const selectedPrimaryContact = selectedClient?.email || selectedClient?.telephone || selectedClient?.adresse;

  return (
    <ClientSectionCard>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600 dark:text-violet-200">
              Client
            </p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950 dark:text-white">
              Étape 1. Choisissez le bon contact
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Une fois le client lié, le parcours déverrouille le chiffrage et vous évite de revenir en arrière.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleNewClient}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/6 dark:text-slate-100 dark:hover:border-violet-400/20"
          >
            {showNewClient ? <X size={16} /> : <Plus size={16} />}
            {showNewClient ? "Fermer" : "Créer un client"}
          </button>
        </div>

        {selectedClient ? (
          <div className="rounded-[1.75rem] border border-emerald-300/40 bg-emerald-500/10 p-5 dark:border-emerald-400/20 dark:bg-emerald-500/10">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-emerald-700 ring-1 ring-emerald-300/40 dark:bg-white/8 dark:text-emerald-200 dark:ring-emerald-400/20">
                  <UserCircle2 size={24} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700 dark:text-emerald-200">
                    Client actif
                  </p>
                  <h3 className="mt-2 truncate text-lg font-semibold text-slate-950 dark:text-white">
                    {selectedClient.nom}
                  </h3>
                  {selectedPrimaryContact ? (
                    <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm text-slate-600 dark:bg-white/8 dark:text-slate-300">
                      {selectedClient.email ? <Mail size={14} /> : selectedClient.telephone ? <Phone size={14} /> : <MapPin size={14} />}
                      <span className="truncate">{selectedPrimaryContact}</span>
                    </div>
                  ) : null}

                  {(selectedClient.email && selectedClient.telephone) || selectedClient.adresse ? (
                    <details className="mt-3 rounded-[1.2rem] border border-emerald-300/40 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-emerald-400/20 dark:bg-white/6 dark:text-slate-300 md:hidden">
                      <summary className="cursor-pointer list-none font-semibold text-emerald-700 dark:text-emerald-200 [&::-webkit-details-marker]:hidden">
                        Voir plus
                      </summary>
                      <div className="mt-3 space-y-2">
                        {selectedClient.email && selectedClient.telephone ? (
                          <div className="flex items-start gap-2">
                            <Phone size={14} className="mt-0.5 shrink-0" />
                            <span>{selectedClient.telephone}</span>
                          </div>
                        ) : null}
                        {selectedClient.adresse ? (
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className="mt-0.5 shrink-0" />
                            <span>{selectedClient.adresse}</span>
                          </div>
                        ) : null}
                      </div>
                    </details>
                  ) : null}

                  <div className="mt-3 hidden flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300 md:flex">
                    {selectedClient.email ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 dark:bg-white/8">
                        <Mail size={14} />
                        {selectedClient.email}
                      </span>
                    ) : null}
                    {selectedClient.telephone ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 dark:bg-white/8">
                        <Phone size={14} />
                        {selectedClient.telephone}
                      </span>
                    ) : null}
                    {selectedClient.adresse ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 dark:bg-white/8">
                        <MapPin size={14} />
                        {selectedClient.adresse}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClearSelection}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/40 bg-white/80 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-white dark:border-emerald-400/20 dark:bg-white/8 dark:text-emerald-200 dark:hover:bg-white/12"
              >
                Changer
              </button>
            </div>
          </div>
        ) : null}

        {!selectedClient ? (
          <>
            {!showNewClient && recentClients.length > 0 ? (
              <div className="grid gap-3 rounded-[1.6rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-600 dark:text-violet-200">
                      Devis express
                    </p>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      Reprenez un client récent en un tap pour lancer le devis plus vite.
                    </p>
                  </div>
                  <span className="rounded-full bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200 dark:bg-white/8 dark:text-slate-200 dark:ring-white/10">
                    {recentClients.length} rapide{recentClients.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="grid gap-2 min-[380px]:grid-cols-2 xl:grid-cols-4">
                  {recentClients.map((client) => (
                    <button
                      key={`recent-${client.id}`}
                      type="button"
                      onClick={() => onSelectClient(client)}
                      className="rounded-[1.2rem] border border-slate-200/80 bg-white/90 px-4 py-3 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 dark:border-white/10 dark:bg-white/6 dark:hover:border-violet-400/20 dark:hover:bg-violet-500/8"
                    >
                      <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{client.nom}</p>
                      <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                        {client.telephone || client.email || "Client récent"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Rechercher un client par nom, email ou téléphone..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/6"
              />
            </div>

            {showNewClient ? (
              <div className="grid gap-3 rounded-[1.6rem] border border-slate-200/70 bg-slate-50/80 p-4 dark:border-white/8 dark:bg-white/4 lg:grid-cols-2">
                <input
                  type="text"
                  value={newClient.nom}
                  onChange={(event) => onNewClientChange("nom", event.target.value)}
                  placeholder="Nom du client"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/8"
                />
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(event) => onNewClientChange("email", event.target.value)}
                  placeholder="Email client"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/8"
                />
                <input
                  type="text"
                  value={newClient.telephone}
                  onChange={(event) => onNewClientChange("telephone", event.target.value)}
                  placeholder="Téléphone"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/8"
                />
                <input
                  type="text"
                  value={newClient.adresse}
                  onChange={(event) => onNewClientChange("adresse", event.target.value)}
                  placeholder="Adresse / chantier"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-white/10 dark:bg-white/8"
                />
                <div className="lg:col-span-2 flex flex-col items-start gap-3 rounded-xl border border-dashed border-slate-300/70 bg-white/70 px-4 py-3 text-sm text-slate-500 dark:border-white/10 dark:bg-white/6 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Le nom suffit pour créer la fiche. L’email accélère ensuite le bouton “Créer et envoyer”.
                  </span>
                  <button
                    type="button"
                    onClick={onCreateClient}
                    disabled={isCreating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-zolio px-4 py-2.5 font-semibold text-white shadow-brand disabled:opacity-60"
                  >
                    {isCreating ? "Création..." : "Ajouter ce client"}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid gap-3 lg:grid-cols-2">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-[1.4rem] border border-slate-200/70 bg-slate-50/80 p-4 animate-pulse dark:border-white/8 dark:bg-white/4"
                  >
                    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10" />
                    <div className="mt-3 h-3 w-40 rounded bg-slate-100 dark:bg-white/6" />
                  </div>
                ))
              ) : filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => onSelectClient(client)}
                    className="rounded-[1.4rem] border border-slate-200/70 bg-white/80 p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 dark:border-white/8 dark:bg-white/4 dark:hover:border-violet-400/20 dark:hover:bg-violet-500/8"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-white/8 dark:text-slate-200">
                        <UserCircle2 size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">
                          {client.nom}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
                          {client.email || client.telephone || "Coordonnées à compléter"}
                        </p>
                        <p className="mt-2 hidden truncate text-xs text-slate-400 dark:text-slate-500 md:block">
                          {client.telephone || client.adresse || "Fiche prête à être utilisée dans un devis"}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-violet-600 dark:text-violet-200 md:hidden">
                          Toucher pour sélectionner
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="lg:col-span-2 rounded-[1.4rem] border border-dashed border-slate-300/70 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-white/4 dark:text-slate-300">
                  {searchValue
                    ? `Aucun client ne correspond à “${searchValue}”.`
                    : "Aucun client enregistré pour l’instant. Créez-en un ici pour démarrer votre devis."}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </ClientSectionCard>
  );
}
