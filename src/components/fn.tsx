import { Link, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Circle, CloudOff, FileHeart, HelpCircle, Info, Loader2, Menu, PenLine, RefreshCw, Wifi, XCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { USERS, type CaseStatus, type HospitalStatus, type ItemStatus } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const notAvailable = () => toast("Not available in this prototype.");

type Tone = "success" | "warning" | "critical" | "info" | "neutral";
const toneCls: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  critical: "bg-critical-bg text-critical",
  info: "bg-info-bg text-info",
  neutral: "bg-muted text-muted-foreground",
};
export function Chip({ tone, icon: Icon, children, className }: { tone: Tone; icon: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium", toneCls[tone], className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {children}
    </span>
  );
}

export function CaseStatusChip({ status, syncing }: { status: CaseStatus; syncing?: boolean }) {
  if (status === "pending_sync" && syncing) return <Chip tone="info" icon={Loader2}>Syncing...</Chip>;
  const m: Record<CaseStatus, [Tone, LucideIcon, string]> = {
    draft: ["neutral", PenLine, "Draft"],
    needs_review: ["warning", AlertTriangle, "Needs review"],
    finalized: ["info", CheckCircle2, "Finalized"],
    pending_sync: ["warning", CloudOff, "Pending sync"],
    synced: ["success", CheckCircle2, "Synced"],
  };
  const [t, i, l] = m[status];
  return <Chip tone={t} icon={i}>{l}</Chip>;
}
export function HospitalChip({ status }: { status: HospitalStatus }) {
  const m: Record<HospitalStatus, [Tone, LucideIcon, string]> = {
    incoming: ["info", Circle, "Incoming"],
    acknowledged: ["success", CheckCircle2, "Acknowledged"],
    closed: ["neutral", XCircle, "Closed"],
  };
  const [t, i, l] = m[status];
  return <Chip tone={t} icon={i}>{l}</Chip>;
}
export function ItemChip({ status }: { status: ItemStatus }) {
  const m: Record<ItemStatus, [Tone, LucideIcon, string]> = {
    auto: ["info", Info, "Auto-extracted"],
    confirmed: ["success", CheckCircle2, "Confirmed"],
    corrected: ["warning", PenLine, "Corrected"],
    unknown: ["neutral", HelpCircle, "Unknown"],
  };
  const [t, i, l] = m[status];
  return <Chip tone={t} icon={i}>{l}</Chip>;
}

export function ConnectivityBanner() {
  const { online, syncing } = useStore();
  if (online && !syncing) return null;
  return (
    <div role="status" className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", online ? "border-info/30 bg-info-bg text-info" : "border-warning/30 bg-warning-bg text-warning")}>
      {online ? <RefreshCw className="mt-0.5 h-4 w-4 animate-spin" /> : <CloudOff className="mt-0.5 h-4 w-4" />}
      <span>{online ? "Connection restored. Syncing records..." : "Offline. Records are saved on this device and will sync when connection returns."}</span>
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md text-primary focus-visible:outline-2 focus-visible:outline-ring">
      <FileHeart className="h-6 w-6" aria-hidden />
      <span className="text-lg font-semibold tracking-tight">FirstNote</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { role, online, forceOffline, setForceOffline, installPrompt, installed } = useStore();
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col bg-background text-[15px]">
      <header className="safe-top sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 pb-2">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            {role && (
              <span className="hidden items-center gap-1 rounded-md border px-2 py-0.5 text-xs sm:inline-flex">
                {USERS[role].label} <span className="font-mono text-muted-foreground">{USERS[role].id}</span>
              </span>
            )}
            {online ? <Chip tone="success" icon={Wifi}>Online</Chip> : <Chip tone="warning" icon={CloudOff}>Offline</Chip>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu" className="h-11 w-11"><Menu className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>FirstNote</DropdownMenuLabel>
                {installPrompt && !installed && <DropdownMenuItem onClick={installPrompt.prompt}>Install FirstNote</DropdownMenuItem>}
                {!installed && <p className="px-2 py-1 text-xs text-muted-foreground">On iPhone: Share, then Add to Home Screen.</p>}
                <DropdownMenuItem onClick={() => navigate({ to: "/" })}>Switch role</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={forceOffline} onCheckedChange={(v) => setForceOffline(!!v)}>Demo: force offline</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="safe-bottom border-t bg-card px-4 pt-3 text-center text-xs text-muted-foreground">
        Documentation support only. Not a diagnostic or treatment tool. Prototype: synthetic data only.
      </footer>
    </div>
  );
}

export function Section({ title, action, children, className }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export const fmtTime = (iso: string) => new Date(iso).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
