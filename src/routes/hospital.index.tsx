import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Chip, ConnectivityBanner, HospitalChip, fmtTime } from "@/components/fn";
import { useStore } from "@/lib/store";
import type { Case } from "@/lib/data";

export const Route = createFileRoute("/hospital/")({
  head: () => ({
    meta: [
      { title: "Incoming cases — FirstNote" },
      { name: "description", content: "Incoming ambulance handovers awaiting acknowledgement." },
      { property: "og:title", content: "Incoming cases — FirstNote" },
      { property: "og:description", content: "Incoming ambulance handovers." },
    ],
  }),
  component: Incoming,
});

export const flagCount = (c: Case) => c.items.filter((i) => i.flag).length;

export function CaseTable({ cases }: { cases: Case[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b text-xs text-muted-foreground"><tr>{["Case ID", "Patient", "Presenting complaint", "Unit", "ETA", "Flags", "Status", "Last updated"].map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
        <tbody className="divide-y">
          {cases.map((c) => (
            <tr key={c.id} className="hover:bg-muted/50">
              <td className="p-3"><Link to="/hospital/case/$id" params={{ id: c.id }} className="font-mono text-primary underline-offset-2 hover:underline">{c.id}</Link>{c.isNew && <span className="ml-2 rounded bg-info-bg px-1.5 text-xs text-info">New</span>}</td>
              <td className="p-3">{c.descriptor || "Unidentified"}</td>
              <td className="p-3">{c.complaint}</td>
              <td className="p-3 font-mono">{c.unit}</td>
              <td className="p-3">{c.eta}</td>
              <td className="p-3">{flagCount(c) ? <Chip tone="warning" icon={AlertTriangle}>{flagCount(c)} flag</Chip> : <Chip tone="neutral" icon={CheckCircle2}>None</Chip>}</td>
              <td className="p-3"><HospitalChip status={c.hospitalStatus} /></td>
              <td className="p-3 font-mono text-xs">{fmtTime(c.updatedAt)}</td>
            </tr>
          ))}
          {cases.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No cases.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Incoming() {
  const { cases } = useStore();
  const [q, setQ] = useState("");
  const synced = cases.filter((c) => c.status === "synced").sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || b.updatedAt.localeCompare(a.updatedAt));
  const shown = synced.filter((c) => `${c.id} ${c.complaint} ${c.unit} ${c.descriptor}`.toLowerCase().includes(q.toLowerCase()));
  const stat = (l: string, v: number) => <div className="rounded-lg border bg-card p-4"><div className="text-xs text-muted-foreground">{l}</div><div className="mt-1 text-2xl font-semibold">{v}</div></div>;
  return (
    <div className="space-y-4">
      <ConnectivityBanner />
      <h1 className="text-xl font-semibold">Incoming cases</h1>
      <div className="grid gap-3 sm:grid-cols-3">
        {stat("Incoming", synced.filter((c) => c.hospitalStatus === "incoming").length)}
        {stat("Acknowledged today", synced.filter((c) => c.hospitalStatus === "acknowledged").length)}
        {stat("Cases with flags", synced.filter((c) => flagCount(c) > 0).length)}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search cases" className="h-10 pl-9" placeholder="Search case ID, complaint or unit" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="flex gap-1" aria-label="Status filter">{["All", "Incoming", "Acknowledged", "Closed"].map((s, i) => <span key={s} className={`rounded-md border px-3 py-2 text-sm ${i === 0 ? "border-primary bg-accent text-accent-foreground" : "bg-card"}`}>{s}</span>)}</div>
      </div>
      <CaseTable cases={shown} />
      <p className="text-xs text-muted-foreground">Prototype: responder cases appear here after simulated sync on this same device. No real multi-device sync.</p>
    </div>
  );
}
