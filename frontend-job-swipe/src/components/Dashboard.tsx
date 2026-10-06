import React, { useCallback, useEffect, useState } from "react";

/**
 * JobSwipeDashboard : aucun prop, toutes les données viennent de l'API.
 *
 * Configuration :
 *  - Vite : VITE_API_URL=https://api.example.com   (CRA : remplacer par process.env.REACT_APP_API_URL)
 *  - Auth par cookie de session (credentials: "include"). Pour un token, ajoutez l'en-tête dans `request`.
 *
 * Contrat d'API attendu (JSON) :
 *  GET /candidates/me     -> { name, avatarUrl, roleLabel }
 *  GET /applications      -> [{ id, company, title, salary, location, appliedLabel, tags: [], verified,
 *                               status: "match" | "pending" | "seen", statusLabel, seenLabel }]
 *  GET /matches           -> [{ id, company }]
 *  GET /stats             -> { liked, matches, successRate, interviews, periodLabel }
 *
 * Navigation : les routes ci-dessous sont à adapter à votre application.
 */

const API_URL = import.meta.env?.VITE_API_URL ?? "";

const ROUTES = {
  discover: "/discover",
  matches: "/matches",
  saved: "/saved",
  profile: "/profile",
  filters: "/preferences",
  conversations: "/conversations",
  chat: (application) => `/conversations/${application.id}`,
  offer: (application) => `/offers/${application.id}`,
};

const go = (path) => window.location.assign(path);

async function request(path, signal) {
  const response = await fetch(`${API_URL}${path}`, {
    signal,
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`${path} : ${response.status}`);
  return response.json();
}

function useDashboardData() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    candidate: null,
    applications: [],
    matches: [],
    stats: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      request("/candidates/me", signal),
      request("/applications", signal),
      request("/matches", signal),
      request("/stats", signal),
    ])
      .then(([candidate, applications, matches, stats]) => {
        setState({ loading: false, error: null, candidate, applications, matches, stats });
      })
      .catch((error) => {
        if (error.name === "AbortError") return;
        setState((s) => ({ ...s, loading: false, error }));
      });

    return () => controller.abort();
  }, [reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { ...state, reload };
}

const Icon = ({ name, className = "", filled = false }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    aria-hidden="true"
  >
    {name}
  </span>
);

const initial = (text = "") => text.trim().charAt(0).toUpperCase();

function StatCard({ label, icon, iconClass = "text-primary", value, suffix, caption, valueClass = "text-on-surface" }) {
  return (
    <div className="bg-surface-container-lowest p-3.5 rounded-DEFAULT shadow-sm border border-outline-variant/30 flex flex-col justify-between">
      <div className="flex items-center justify-between text-on-surface-variant">
        <span className="text-label-sm font-label-sm">{label}</span>
        <Icon name={icon} className={`${iconClass} text-[18px]`} />
      </div>
      <div className="mt-2">
        <div className={`text-stat-numeric font-stat-numeric flex items-baseline space-x-1 ${valueClass}`}>
          <span>{value ?? "–"}</span>
          {suffix && <span className="text-[11px] font-bold text-secondary font-label-sm">{suffix}</span>}
        </div>
        <span className="text-body-sm font-body-sm text-on-surface-variant text-[10px]">{caption}</span>
      </div>
    </div>
  );
}

function ApplicationCard({ application }) {
  const { company, title, salary, location, appliedLabel, tags = [], verified, status, statusLabel, seenLabel } = application;

  return (
    <article className="bg-surface-container-lowest rounded-DEFAULT p-4 border border-outline-variant/40 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-DEFAULT bg-primary/5 border border-primary/10 flex items-center justify-center font-bold text-primary text-xl tracking-tight">
            {initial(company)}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="font-headline-sm text-headline-sm text-on-surface">{company}</h4>
              {verified && <Icon name="verified" filled className="text-primary text-[16px]" />}
            </div>
            <p className="text-body-md font-body-md text-on-surface-variant font-medium">{title}</p>
          </div>
        </div>
        {salary && (
          <span className="text-label-sm font-label-sm bg-surface-container text-primary font-bold px-2 py-1 rounded-md">{salary}</span>
        )}
      </div>

      {(location || (status === "match" && appliedLabel) || tags.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {location && (
            <span className="text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full flex items-center space-x-1">
              <Icon name="location_on" className="text-[13px]" />
              <span>{location}</span>
            </span>
          )}
          {status === "match" && appliedLabel && (
            <span className="text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full flex items-center space-x-1">
              <Icon name="schedule" className="text-[13px]" />
              <span>{appliedLabel}</span>
            </span>
          )}
          {tags.map((tag) => (
            <span key={tag} className="text-label-sm font-label-sm bg-surface-container-low text-on-surface-variant px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
        {status === "match" && (
          <>
            <div className="inline-flex items-center space-x-1.5 bg-secondary-container/30 border border-secondary/20 text-secondary px-2.5 py-1 rounded-full text-label-sm font-label-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              <span>{statusLabel ?? "Match confirmé"}</span>
            </div>
            <button
              type="button"
              onClick={() => go(ROUTES.chat(application))}
              className="bg-secondary text-on-secondary px-3.5 py-1.5 rounded-DEFAULT text-label-md font-label-md flex items-center space-x-1.5 hover:bg-secondary/90 active:scale-95 transition-all shadow-sm"
            >
              <Icon name="forum" className="text-[16px]" />
              <span>Discuter</span>
            </button>
          </>
        )}

        {status === "pending" && (
          <>
            <div className="inline-flex items-center bg-amber-500/10 border border-amber-500/20 text-amber-800 px-2.5 py-1 rounded-full text-label-sm font-label-sm font-bold">
              <span>{statusLabel ?? "En attente de retour du recruteur"}</span>
            </div>
            {appliedLabel && <span className="text-label-sm font-label-sm text-on-surface-variant">{appliedLabel}</span>}
          </>
        )}

        {status === "seen" && (
          <>
            <div className="inline-flex items-center bg-surface-container text-on-surface-variant px-2.5 py-1 rounded-full text-label-sm font-label-sm font-medium">
              <span>{seenLabel ?? statusLabel ?? "Vu par le recruteur"}</span>
            </div>
            <button
              type="button"
              onClick={() => go(ROUTES.offer(application))}
              className="text-label-sm font-label-sm text-primary hover:text-primary-fixed-variant flex items-center space-x-0.5"
            >
              <span>Détails offre</span>
              <Icon name="arrow_forward" className="text-[14px]" />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-surface-container-high rounded-DEFAULT ${className}`} />;
}

function LoadingState() {
  return (
    <div className="flex flex-col space-y-5" aria-busy="true" aria-label="Chargement">
      <Skeleton className="h-12" />
      <div className="grid grid-cols-3 gap-2.5">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-36" />
      <Skeleton className="h-36" />
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="bg-error-container text-on-error-container rounded-DEFAULT p-5 flex flex-col items-center text-center space-y-3" role="alert">
      <Icon name="error" className="text-[28px]" />
      <p className="text-headline-sm font-headline-sm">Impossible de charger votre tableau de bord</p>
      <p className="text-body-md font-body-md">Vérifiez votre connexion, puis réessayez.</p>
      <button
        type="button"
        onClick={onRetry}
        className="bg-error text-on-error px-4 py-2 rounded-DEFAULT text-label-md font-label-md active:scale-95 transition-all"
      >
        Réessayer
      </button>
    </div>
  );
}

const NAV_ITEMS = [
  { id: "discover", label: "Discover", icon: "style" },
  { id: "matches", label: "Matches", icon: "chat_bubble" },
  { id: "saved", label: "Saved", icon: "bookmark" },
  { id: "profile", label: "Profile", icon: "person" },
];

export default function Dashboard() {
  const { loading, error, candidate, applications, matches, stats, reload } = useDashboardData();
  const [activeTab, setActiveTab] = useState("applications");

  const matchCount = matches.length;
  const hasStats = stats && Object.keys(stats).length > 0;
  const visibleApplications =
    activeTab === "matches" ? applications.filter((a) => a.status === "match") : applications;

  const tabs = [
    { id: "applications", label: "Mes Candidatures", count: applications.length, badgeClass: "bg-primary/10 text-primary" },
    { id: "matches", label: "Matchs Réciproques", count: matchCount, badgeClass: "bg-secondary-container text-on-secondary-fixed" },
  ];

  return (
    <div className="bg-background text-on-surface min-h-screen font-body-md antialiased pb-28">
      <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-margin-mobile h-16 max-w-md mx-auto bg-surface/90 backdrop-blur-md shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/20 bg-surface-container-high flex items-center justify-center">
            {candidate?.avatarUrl ? (
              <img className="w-full h-full object-cover" src={candidate.avatarUrl} alt={candidate.name ?? "Avatar"} />
            ) : (
              <Icon name="person" className="text-on-surface-variant" />
            )}
          </div>
          <div className="flex flex-col">
            {candidate?.roleLabel && (
              <span className="text-label-sm font-label-sm text-on-surface-variant leading-none">{candidate.roleLabel}</span>
            )}
            {candidate?.name && (
              <span className="text-headline-sm font-headline-sm text-on-surface leading-tight">{candidate.name}</span>
            )}
          </div>
        </div>
        <div className="text-headline-xl-mobile font-headline-xl-mobile font-bold tracking-tight text-primary">JobSwipe</div>
        <button
          type="button"
          aria-label="Filtres et préférences"
          onClick={() => go(ROUTES.filters)}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors duration-150 active:scale-95 text-on-surface-variant"
        >
          <Icon name="tune" />
        </button>
      </header>

      <main className="max-w-md mx-auto pt-20 px-margin-mobile flex flex-col space-y-5">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : (
          <>
            <div className="bg-surface-container-low p-1.5 rounded-DEFAULT flex items-center justify-between shadow-sm">
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2.5 px-3 rounded-DEFAULT transition-all duration-150 flex items-center justify-center space-x-2 ${
                      active
                        ? "bg-surface-container-lowest text-primary font-headline-sm text-headline-sm shadow-sm"
                        : "text-on-surface-variant font-label-lg text-label-lg hover:text-primary"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className={`${tab.badgeClass} px-2 py-0.5 rounded-full text-label-sm font-label-sm font-bold`}>{tab.count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {matchCount > 0 && (
              <div className="relative overflow-hidden bg-gradient-to-br from-primary-container to-primary rounded-DEFAULT p-space-lg text-on-primary shadow-lg">
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="flex items-start space-x-3.5 relative z-10">
                  <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                    <Icon name="celebration" className="text-xl" />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-label-sm font-label-sm text-on-primary-container tracking-wider uppercase">Nouvelle dynamique</span>
                      <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                    </div>
                    <h2 className="text-headline-sm font-headline-sm leading-snug">
                      {matchCount === 1
                        ? "Vous avez 1 nouveau match réciproque prêt à discuter."
                        : `Vous avez ${matchCount} nouveaux matchs réciproques prêts à discuter.`}
                    </h2>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between">
                  <div className="flex -space-x-2 overflow-hidden">
                    {matches.slice(0, 3).map((match) => (
                      <div
                        key={match.id}
                        className="inline-block h-7 w-7 rounded-full ring-2 ring-primary-container bg-surface-container-lowest flex items-center justify-center text-label-sm font-bold text-primary"
                      >
                        {initial(match.company)}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => go(ROUTES.conversations)}
                    className="text-label-md font-label-md bg-white text-primary px-3.5 py-1.5 rounded-full hover:bg-surface-container-lowest active:scale-95 transition-all shadow-sm"
                  >
                    Voir les conversations
                  </button>
                </div>
              </div>
            )}

            {hasStats && (
              <section className="flex flex-col space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-headline-sm font-headline-sm text-on-surface">Statistiques de swipe</h3>
                  {stats.periodLabel && (
                    <span className="text-label-sm font-label-sm text-on-surface-variant">{stats.periodLabel}</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <StatCard label="Likées" icon="favorite" value={stats.liked} caption="Offres retenues" />
                  <StatCard
                    label="Matchs"
                    icon="handshake"
                    iconClass="text-secondary"
                    value={stats.matches}
                    suffix={stats.successRate != null ? `(${stats.successRate}%)` : undefined}
                    caption="Taux de succès"
                  />
                  <StatCard label="Entretiens" icon="event" value={stats.interviews} valueClass="text-primary" caption="Planifiés" />
                </div>
              </section>
            )}

            <section className="flex flex-col space-y-3 pt-1">
              <h3 className="text-headline-sm font-headline-sm text-on-surface">
                {activeTab === "matches" ? "Matchs réciproques" : "Candidatures en cours"}
              </h3>

              {visibleApplications.length === 0 ? (
                <div className="bg-surface-container-lowest rounded-DEFAULT p-6 border border-dashed border-outline-variant/60 flex flex-col items-center text-center space-y-2">
                  <Icon name="work" className="text-on-surface-variant text-[28px]" />
                  <p className="text-headline-sm font-headline-sm text-on-surface">
                    {activeTab === "matches" ? "Aucun match pour le moment" : "Aucune candidature pour le moment"}
                  </p>
                  <p className="text-body-md font-body-md text-on-surface-variant">
                    Swipez des offres dans Discover : celles que vous likez apparaîtront ici.
                  </p>
                </div>
              ) : (
                visibleApplications.map((application) => <ApplicationCard key={application.id} application={application} />)
              )}
            </section>
          </>
        )}
      </main>

      <nav className="fixed bottom-4 left-4 right-4 rounded-xl z-50 max-w-md mx-auto bg-surface-container-lowest/95 backdrop-blur-lg ring-1 ring-outline-variant/20 shadow-xl shadow-on-surface/10 px-margin-mobile py-2.5 flex justify-around items-center">
        {NAV_ITEMS.map((item) => {
          const active = item.id === "matches";
          const badge = item.id === "matches" ? matchCount : 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(ROUTES[item.id])}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center transition-all duration-150 ${
                active ? "text-primary" : "text-on-surface-variant opacity-70 hover:opacity-100 hover:text-primary"
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon name={item.icon} filled={active} className="text-[22px]" />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-secondary text-on-secondary text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center ring-2 ring-surface-container-lowest">
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-label-sm font-label-sm mt-0.5 ${active ? "font-bold" : ""}`}>{item.label}</span>
              {active && <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
