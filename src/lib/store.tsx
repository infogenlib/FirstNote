import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { type AuditEntry, type Case, type Role, USERS, fakeHash, seedAudit, seedCases, hhmmss } from "./data";

const KEY = "firstnote-demo-v1";
interface Persisted { role: Role | null; forceOffline: boolean; cases: Case[]; audit: AuditEntry[] }
const defaults = (): Persisted => ({ role: null, forceOffline: false, cases: seedCases(), audit: seedAudit() });

interface Ctx extends Persisted {
  ready: boolean;
  online: boolean;
  syncing: boolean;
  installPrompt: { prompt: () => void } | null;
  installed: boolean;
  signIn: (r: Role) => void;
  setForceOffline: (v: boolean) => void;
  upsertCase: (c: Case) => void;
  updateCase: (id: string, fn: (c: Case) => Case) => void;
  addAudit: (action: string, target: string) => void;
  reset: () => void;
}
const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Persisted>(defaults);
  const [ready, setReady] = useState(false);
  const [netOnline, setNetOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<Ctx["installPrompt"]>(null);
  const [installed, setInstalled] = useState(false);
  const sRef = useRef(s);
  sRef.current = s;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setS({ ...defaults(), ...JSON.parse(raw) });
    } catch { /* ignore */ }
    setNetOnline(navigator.onLine);
    const on = () => setNetOnline(true), off = () => setNetOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const bip = (e: Event) => { e.preventDefault(); const ev = e as Event & { prompt: () => void }; setInstallPrompt({ prompt: () => { ev.prompt(); setInstallPrompt(null); } }); };
    const inst = () => { setInstalled(true); setInstallPrompt(null); };
    window.addEventListener("beforeinstallprompt", bip);
    window.addEventListener("appinstalled", inst);
    setReady(true);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); window.removeEventListener("beforeinstallprompt", bip); window.removeEventListener("appinstalled", inst); };
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(KEY, JSON.stringify(s)); }, [s, ready]);

  const online = netOnline && !s.forceOffline;
  const role = s.role ?? "responder";

  const addAudit = useCallback((action: string, target: string) => {
    setS((p) => {
      const r = p.role ?? "responder";
      return { ...p, audit: [{ ts: new Date().toISOString(), actor: USERS[r].id, role: USERS[r].label, action, target, hash: fakeHash() }, ...p.audit] };
    });
  }, []);

  const pendingCount = s.cases.filter((c) => c.status === "pending_sync").length;
  useEffect(() => {
    if (!ready || !online || pendingCount === 0) return;
    setSyncing(true);
    const t = setTimeout(() => {
      const ids = sRef.current.cases.filter((c) => c.status === "pending_sync").map((c) => c.id);
      setS((p) => ({
        ...p,
        cases: p.cases.map((c) => ids.includes(c.id) ? { ...c, status: "synced", isNew: true, updatedAt: new Date().toISOString(), timeline: [...c.timeline, { t: hhmmss(), label: "Synced to hospital" }] } : c),
        audit: [...ids.map((id) => ({ ts: new Date().toISOString(), actor: USERS.responder.id, role: USERS.responder.label, action: "Sync completed", target: id, hash: fakeHash() })), ...p.audit],
      }));
      setSyncing(false);
    }, 1500);
    return () => { clearTimeout(t); setSyncing(false); };
  }, [ready, online, pendingCount]);

  const value: Ctx = {
    ...s, ready, online, syncing, installPrompt, installed,
    signIn: (r) => { setS((p) => ({ ...p, role: r })); setTimeout(() => addAudit("Sign-in", `${USERS[r].label} console`), 0); },
    setForceOffline: (v) => setS((p) => ({ ...p, forceOffline: v })),
    upsertCase: (c) => setS((p) => ({ ...p, cases: [c, ...p.cases.filter((x) => x.id !== c.id)] })),
    updateCase: (id, fn) => setS((p) => ({ ...p, cases: p.cases.map((c) => (c.id === id ? { ...fn(c), updatedAt: new Date().toISOString() } : c)) })),
    addAudit,
    reset: () => { localStorage.removeItem(KEY); setS({ ...defaults(), role }); },
  };
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
}
