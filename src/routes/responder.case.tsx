import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, Check, CheckCircle2, CloudOff, Copy, HelpCircle, Mic, PenLine, Play, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CaseStatusChip, Chip, ConnectivityBanner, ItemChip, Section } from "@/components/fn";
import { DESTINATIONS, NARRATION, USERS, buildFhir, extractedItems, hhmmss, isResolved, type Case, type Item } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/responder/case")({
  validateSearch: (s: Record<string, unknown>) => ({ id: typeof s.id === "string" ? s.id : "" }),
  head: () => ({
    meta: [
      { title: "Case capture — FirstNote" },
      { name: "description", content: "Capture, review and record a prehospital case with simulated on-device transcription." },
      { property: "og:title", content: "Case capture — FirstNote" },
      { property: "og:description", content: "Capture, review and record." },
    ],
  }),
  component: CasePage,
});

const STEPS = ["Capture", "Review", "Record"] as const;
const GROUPS: [Item["group"], string][] = [["med", "Medications"], ["proc", "Procedures"], ["obs", "Observations"]];

function CasePage() {
  const { id } = Route.useSearch();
  const { cases, updateCase } = useStore();
  const c = cases.find((x) => x.id === id);
  const [step, setStep] = useState<number>(() => (c && ["finalized", "pending_sync", "synced"].includes(c.status) ? 2 : 0));
  if (!c) return <div className="p-8 text-center text-sm">Case not found. <Link to="/responder" className="text-primary underline">Back to responder home</Link></div>;
  const update = (fn: (c: Case) => Case) => updateCase(c.id, fn);
  const locked = ["finalized", "pending_sync", "synced"].includes(c.status);

  return (
    <div className="mx-auto max-w-[420px] space-y-4 px-4 py-4">
      <ConnectivityBanner />
      <div className="flex items-center justify-between">
        <Link to="/responder" className="text-sm text-primary">← Responder home</Link>
        <CaseStatusChip status={c.status} />
      </div>
      <ol className="grid grid-cols-3 gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button disabled={(i < 2 && locked) || (i === 2 && !locked)} onClick={() => setStep(i)}
              className={cn("h-12 w-full rounded-md border text-sm font-medium disabled:opacity-50", step === i ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
              {i + 1}. {s}
            </button>
          </li>
        ))}
      </ol>
      {step === 0 && <Capture c={c} update={update} onNext={() => { update((x) => ({ ...x, status: "needs_review" })); setStep(1); }} />}
      {step === 1 && <Review c={c} update={update} onFinalize={() => setStep(2)} />}
      {step === 2 && <RecordStep c={c} update={update} />}
    </div>
  );
}

function Elapsed({ since }: { since: string }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000));
  return <span className="font-mono">{String(Math.floor(s / 3600)).padStart(2, "0")}:{String(Math.floor(s / 60) % 60).padStart(2, "0")}:{String(s % 60).padStart(2, "0")}</span>;
}

function Capture({ c, update, onNext }: { c: Case; update: (fn: (c: Case) => Case) => void; onNext: () => void }) {
  const [recording, setRecording] = useState(false);
  const [note, setNote] = useState("");
  const [playing, setPlaying] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = () => {
    setPlaying(true); setRecording(true);
    NARRATION.forEach((text, i) => {
      timers.current.push(setTimeout(() => {
        update((x) => ({ ...x, transcript: [...x.transcript, { t: hhmmss(), text }] }));
        if (i === NARRATION.length - 1) {
          update((x) => ({ ...x, descriptor: x.descriptor || "Male, 60–69", age: x.age || "60–69", sex: x.sex || "Male", items: extractedItems(), timeline: [...x.timeline, { t: hhmmss(), label: "Narration transcribed (simulated)" }, { t: "02:14:00", label: "Aspirin 300 mg oral given" }, { t: hhmmss(), label: "Oxygen started" }, { t: hhmmss(), label: "GTN sublingual given" }] }));
          setPlaying(false); setRecording(false);
        }
      }, (i + 1) * 1200));
    });
  };

  return (
    <div className="space-y-4">
      <Section title="Case">
        <div className="flex items-center justify-between text-sm"><span className="font-mono">{c.id}</span><span className="text-muted-foreground">Elapsed <Elapsed since={c.createdAt} /></span></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="grid gap-1"><Label>Age band (optional)</Label>
            <Select value={c.age} onValueChange={(v) => update((x) => ({ ...x, age: v, descriptor: `${x.sex || "Unknown"}, ${v}` }))}>
              <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["0–17", "18–39", "40–59", "60–69", "70–79", "80+"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select></div>
          <div className="grid gap-1"><Label>Sex (optional)</Label>
            <Select value={c.sex} onValueChange={(v) => update((x) => ({ ...x, sex: v, descriptor: `${v}, ${x.age || "age unknown"}` }))}>
              <SelectTrigger className="h-12"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["Male", "Female", "Other", "Unknown"].map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
            </Select></div>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Never record patient names.</p>
      </Section>

      <Section title="On-device transcription (simulated)">
        <div className="flex flex-col items-center gap-2">
          <button aria-label={recording ? "Stop recording" : "Start recording"} onClick={() => setRecording(!recording)}
            className={cn("flex h-24 w-24 items-center justify-center rounded-full border-4 focus-visible:outline-2 focus-visible:outline-ring", recording ? "border-critical bg-critical-bg text-critical animate-pulse" : "border-primary bg-accent text-primary")}>
            <Mic className="h-10 w-10" />
          </button>
          <span className="text-sm font-medium">{recording ? "Recording" : "Ready"}</span>
          <Button variant="outline" className="h-12" disabled={playing || c.items.length > 0} onClick={play}><Play className="h-4 w-4" />Play demo narration</Button>
        </div>
        <ul className="mt-4 space-y-2">
          {c.transcript.map((s, i) => <li key={i} className="flex gap-2 text-sm"><span className="font-mono text-xs text-muted-foreground">{s.t}</span><span>{s.text}</span></li>)}
          {c.transcript.length === 0 && <li className="text-sm text-muted-foreground">No transcript yet.</li>}
        </ul>
        <div className="mt-4 grid gap-2">
          <Label htmlFor="note">Type a note</Label>
          <Textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button variant="secondary" className="h-12" disabled={!note.trim()} onClick={() => { update((x) => ({ ...x, transcript: [...x.transcript, { t: hhmmss(), text: note.trim() }] })); setNote(""); }}>Add note</Button>
        </div>
      </Section>

      {c.items.length > 0 && (
        <Section title="Extracted information">
          <p className="mb-3 text-xs text-muted-foreground">Predefined mock extraction for demonstration. Not real language processing.</p>
          {GROUPS.map(([g, label]) => (
            <div key={g} className="mb-3">
              <h3 className="mb-1 text-xs font-semibold uppercase text-muted-foreground">{label}</h3>
              {c.items.filter((i) => i.group === g).map((i) => (
                <div key={i.id} className="mb-2 rounded-md border p-2">
                  <div className="flex justify-between text-sm"><span className="font-medium">{i.label}</span><span>{i.value}</span></div>
                  <div className="mt-1 flex items-center gap-2"><div className="h-1.5 flex-1 rounded bg-muted"><div className="h-1.5 rounded bg-teal" style={{ width: `${i.confidence}%` }} /></div><span className="font-mono text-xs">{i.confidence}%</span></div>
                  <div className="mt-1 text-xs text-muted-foreground">Source: “{i.source}”</div>
                  {i.flag && !isResolved(i) && <div className="mt-2"><Chip tone="warning" icon={AlertTriangle}>{i.flag}</Chip></div>}
                </div>
              ))}
            </div>
          ))}
          <DestinationPicker c={c} update={update} />
          <Button className="mt-4 h-12 w-full" onClick={onNext}>Continue to review</Button>
        </Section>
      )}
    </div>
  );
}

function DestinationPicker({ c, update }: { c: Case; update: (fn: (c: Case) => Case) => void }) {
  return (
    <div className="grid gap-1">
      <Label>Destination</Label>
      <Select value={c.destination} onValueChange={(v) => update((x) => ({ ...x, destination: v }))}>
        <SelectTrigger className="h-12"><SelectValue placeholder="Select destination" /></SelectTrigger>
        <SelectContent>{DESTINATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}

function ReviewCard({ item, onChange }: { item: Item; onChange: (next: Item, reason?: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(item.flag && item.status === "auto" ? "" : item.value);
  const [reason, setReason] = useState("");
  return (
    <div className={cn("rounded-lg border bg-card p-3", item.flag && !isResolved(item) && "border-warning")}>
      <div className="flex items-center justify-between gap-2"><span className="font-medium">{item.label}</span><ItemChip status={item.status} /></div>
      <div className="mt-1 text-sm">
        {item.status === "corrected" && <span className="mr-2 text-muted-foreground line-through">{item.original}</span>}
        <span>{item.status === "unknown" ? "Unknown" : item.value}</span>
      </div>
      {item.flag && !isResolved(item) && <div className="mt-2"><Chip tone="warning" icon={AlertTriangle}>{item.flag}</Chip></div>}
      {editing ? (
        <div className="mt-3 grid gap-2">
          <Label htmlFor={`v-${item.id}`}>{item.id === "med-gtn" ? "Dose and route" : "Value"}</Label>
          <Input id={`v-${item.id}`} className="h-12" value={val} placeholder={item.id === "med-gtn" ? "e.g. 0.4 mg, sublingual" : ""} onChange={(e) => setVal(e.target.value)} />
          <Label htmlFor={`r-${item.id}`}>Correction reason (optional)</Label>
          <Input id={`r-${item.id}`} className="h-12" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="flex gap-2">
            <Button className="h-12 flex-1" disabled={!val.trim()} onClick={() => { onChange({ ...item, value: val.trim(), status: "corrected" }, reason); setEditing(false); }}>Save</Button>
            <Button variant="outline" className="h-12" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Button variant="outline" className="h-12" disabled={!!item.flag && !isResolved(item)} onClick={() => onChange({ ...item, status: "confirmed" })}><Check className="h-4 w-4" />Confirm</Button>
          <Button variant="outline" className="h-12" onClick={() => setEditing(true)}><PenLine className="h-4 w-4" />Edit</Button>
          <Button variant="outline" className="h-12" onClick={() => onChange({ ...item, status: "unknown" }, "Marked unknown")}><HelpCircle className="h-4 w-4" />Unknown</Button>
        </div>
      )}
    </div>
  );
}

function Review({ c, update, onFinalize }: { c: Case; update: (fn: (c: Case) => Case) => void; onFinalize: () => void }) {
  const { addAudit } = useStore();
  const unresolved = c.items.filter((i) => !isResolved(i));
  const blockers = [...unresolved.map((i) => `${i.label}: ${i.flag}`), ...(!c.destination ? ["Select a destination hospital."] : [])];
  const change = (next: Item, reason?: string) =>
    update((x) => {
      const prev = x.items.find((i) => i.id === next.id)!;
      const corr = prev.value !== next.value || next.status === "unknown"
        ? [...x.corrections, { item: next.label, prev: prev.status === "unknown" ? "Unknown" : prev.value, next: next.status === "unknown" ? "Unknown" : next.value, user: USERS.responder.id, ts: new Date().toISOString(), reason: reason || "—" }]
        : x.corrections;
      return { ...x, items: x.items.map((i) => (i.id === next.id ? next : i)), corrections: corr };
    });
  return (
    <div className="space-y-4">
      {c.items.length === 0 && <p className="text-sm text-muted-foreground">No extracted items. Return to capture and play the demo narration.</p>}
      {GROUPS.map(([g, label]) => (
        <div key={g} className="space-y-2">
          <h2 className="text-sm font-semibold">{label}</h2>
          {c.items.filter((i) => i.group === g).map((i) => <ReviewCard key={i.id + i.status} item={i} onChange={change} />)}
        </div>
      ))}
      <Section title="Destination"><DestinationPicker c={c} update={update} /></Section>
      {blockers.length > 0 && (
        <div className="rounded-lg border border-warning/40 bg-warning-bg p-3 text-sm text-warning">
          <p className="font-medium">Finalize is disabled until these are resolved:</p>
          <ul className="mt-1 list-disc pl-5">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      )}
      <Button className="h-12 w-full" disabled={blockers.length > 0 || c.items.length === 0}
        onClick={() => { update((x) => ({ ...x, status: "finalized", timeline: [...x.timeline, { t: hhmmss(), label: "Record finalized" }] })); addAudit("Record finalized", c.id); onFinalize(); }}>
        <CheckCircle2 className="h-4 w-4" />Finalize record
      </Button>
    </div>
  );
}

function RecordStep({ c, update }: { c: Case; update: (fn: (c: Case) => Case) => void }) {
  const { online, syncing } = useStore();
  const json = JSON.stringify(buildFhir(c), null, 2);
  const med = c.items.filter((i) => i.group === "med"), proc = c.items.filter((i) => i.group === "proc"), obs = c.items.filter((i) => i.group === "obs");
  const v = (i: Item) => (i.status === "unknown" ? `${i.label} (dose unknown)` : `${i.label} ${i.value}`);
  return (
    <div className="space-y-4">
      <Tabs defaultValue="note">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4">
          <TabsTrigger value="note">Clinical note</TabsTrigger>
          <TabsTrigger value="json">Structured data</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="corr">Corrections</TabsTrigger>
        </TabsList>
        <TabsContent value="note" className="space-y-3 rounded-lg border bg-card p-4 text-sm">
          <p><span className="font-mono text-xs text-muted-foreground">{c.transcript[0]?.t ?? "—"}</span> {c.descriptor || "Patient"} presenting with {c.complaint.toLowerCase()} for approximately forty minutes.</p>
          <p><span className="font-mono text-xs text-muted-foreground">Obs</span> {obs.map(v).join("; ")}.</p>
          <p><span className="font-mono text-xs text-muted-foreground">Tx</span> {med.map(v).join("; ")}. {proc.map((p) => p.value).join("; ")}.</p>
          <p><span className="font-mono text-xs text-muted-foreground">Dest</span> {c.destination || "Not selected"}.</p>
        </TabsContent>
        <TabsContent value="json" className="rounded-lg border bg-card p-2">
          <Button variant="outline" size="sm" className="mb-2" onClick={() => navigator.clipboard.writeText(json).then(() => toast("JSON copied"), () => toast("Copy failed"))}><Copy className="h-4 w-4" />Copy JSON</Button>
          <pre className="max-h-96 overflow-auto rounded bg-muted p-3 font-mono text-xs">{json}</pre>
        </TabsContent>
        <TabsContent value="timeline" className="rounded-lg border bg-card p-4">
          <ol className="relative space-y-3 border-l pl-4">
            {c.timeline.map((t, i) => <li key={i} className="text-sm"><span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-primary" /><span className="font-mono text-xs text-muted-foreground">{t.t}</span> {t.label}</li>)}
          </ol>
        </TabsContent>
        <TabsContent value="corr" className="overflow-x-auto rounded-lg border bg-card p-2"><CorrectionTable c={c} /></TabsContent>
      </Tabs>
      {c.status === "finalized" ? (
        <Button className="h-12 w-full" onClick={() => update((x) => ({ ...x, status: "pending_sync", timeline: [...x.timeline, { t: hhmmss(), label: "Handover sent" }] }))}><Send className="h-4 w-4" />Send handover to hospital</Button>
      ) : (
        <div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
          {c.status === "synced" ? <Chip tone="success" icon={CheckCircle2}>Synced</Chip> : online && syncing ? <CaseStatusChip status="pending_sync" syncing /> : <Chip tone="warning" icon={CloudOff}>Saved on device, pending sync</Chip>}
          <span className="text-xs text-muted-foreground">Local demo sync on this device only.</span>
        </div>
      )}
    </div>
  );
}

export function CorrectionTable({ c }: { c: Case }) {
  return (
    <table className="w-full text-left text-xs">
      <thead className="text-muted-foreground"><tr>{["Item", "Previous", "New", "User", "Time", "Reason"].map((h) => <th key={h} className="p-2 font-medium">{h}</th>)}</tr></thead>
      <tbody className="divide-y">
        <tr className="text-muted-foreground"><td className="p-2">Pulse <em>(synthetic example)</em></td><td className="p-2">100</td><td className="p-2">110</td><td className="p-2 font-mono">R-1042</td><td className="p-2 font-mono">02:10</td><td className="p-2">Misheard value</td></tr>
        {c.corrections.map((r, i) => <tr key={i}><td className="p-2">{r.item}</td><td className="p-2">{r.prev}</td><td className="p-2">{r.next}</td><td className="p-2 font-mono">{r.user}</td><td className="p-2 font-mono">{hhmmss(new Date(r.ts))}</td><td className="p-2">{r.reason}</td></tr>)}
      </tbody>
    </table>
  );
}
