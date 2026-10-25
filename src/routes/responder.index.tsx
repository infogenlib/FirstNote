import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, CloudOff, Database, Download, Plus, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CaseStatusChip, Chip, ConnectivityBanner, Section, fmtTime } from "@/components/fn";
import { useStore } from "@/lib/store";
import { hhmmss } from "@/lib/data";

export const Route = createFileRoute("/responder/")({
  head: () => ({
    meta: [
      { title: "Responder home — FirstNote" },
      { name: "description", content: "Start new cases and review device readiness and recent records." },
      { property: "og:title", content: "Responder home — FirstNote" },
      { property: "og:description", content: "Offline-first case capture for first responders." },
    ],
  }),
  component: ResponderHome,
});

function ResponderHome() {
  const { cases, online, syncing, installed, upsertCase } = useStore();
  const navigate = useNavigate();
  const pending = cases.filter((c) => c.status === "pending_sync").length;

  const start = () => {
    const n = Math.floor(100 + Math.random() * 900);
    const now = new Date().toISOString();
    const id = `FN-2026-000${n}`;
    upsertCase({ id, descriptor: "", age: "", sex: "", complaint: "Chest pain", unit: "AMB-07", eta: "10 min", destination: "", status: "draft", hospitalStatus: "incoming", createdAt: now, updatedAt: now, transcript: [], items: [], corrections: [], timeline: [{ t: hhmmss(), label: "Case started" }] });
    navigate({ to: "/responder/case", search: { id } });
  };

  const row = (label: string, ok: boolean, okText: string, badText: string, Icon = CheckCircle2) => (
    <li className="flex items-center justify-between py-2"><span className="flex items-center gap-2 text-sm"><Icon className="h-4 w-4 text-muted-foreground" />{label}</span>
      {ok ? <Chip tone="success" icon={CheckCircle2}>{okText}</Chip> : <Chip tone="warning" icon={CloudOff}>{badText}</Chip>}</li>
  );

  return (
    <div className="mx-auto max-w-[420px] space-y-4 px-4 py-4">
      <ConnectivityBanner />
      <Button className="h-14 w-full text-base" onClick={start}><Plus className="h-5 w-5" />Start new case</Button>
      <Section title="Device readiness">
        <ul className="divide-y">
          {row("Offline ready", true, "Ready", "")}
          {row("Local storage", true, "Persistent", "", Database)}
          {row("Install status", installed, "Installed", "Browser", Download)}
          {row("Connection", online, "Online", "Offline", Wifi)}
          <li className="flex items-center justify-between py-2 text-sm"><span>Pending sync</span><span className="font-mono">{pending}</span></li>
        </ul>
      </Section>
      <Section title="Recent cases">
        <ul className="divide-y">
          {cases.map((c) => (
            <li key={c.id}>
              <Link to="/responder/case" search={{ id: c.id }} className="flex min-h-12 items-center justify-between gap-2 py-2">
                <div>
                  <div className="font-mono text-xs">{c.id}</div>
                  <div className="text-sm">{c.descriptor || "Unidentified patient"} · {c.complaint}</div>
                  <div className="font-mono text-xs text-muted-foreground">{fmtTime(c.createdAt)}</div>
                </div>
                <CaseStatusChip status={c.status} syncing={syncing} />
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
