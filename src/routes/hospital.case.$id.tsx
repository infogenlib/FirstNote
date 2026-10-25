import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Chip, HospitalChip, ItemChip, Section, fmtTime, notAvailable } from "@/components/fn";
import { hhmmss, isResolved } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CorrectionTable } from "./responder.case";

export const Route = createFileRoute("/hospital/case/$id")({
  head: () => ({
    meta: [
      { title: "Case handover — FirstNote" },
      { name: "description", content: "Prehospital handover detail with medications, timeline and corrections." },
      { property: "og:title", content: "Case handover — FirstNote" },
      { property: "og:description", content: "Handover detail." },
    ],
  }),
  component: CaseDetail,
});

function CaseDetail() {
  const { id } = Route.useParams();
  const { cases, updateCase, addAudit } = useStore();
  const c = cases.find((x) => x.id === id);
  if (!c) return <p className="text-sm">Case not found. <Link to="/hospital" className="text-primary underline">Back</Link></p>;
  const stage = c.hospitalStatus === "closed" ? 3 : c.hospitalStatus === "acknowledged" ? 2 : 1;
  const ack = () => { updateCase(c.id, (x) => ({ ...x, hospitalStatus: "acknowledged", isNew: false, timeline: [...x.timeline, { t: hhmmss(), label: "Handover acknowledged" }] })); addAudit("Handover acknowledged", c.id); };
  const close = () => { updateCase(c.id, (x) => ({ ...x, hospitalStatus: "closed", isNew: false, timeline: [...x.timeline, { t: hhmmss(), label: "Case closed" }] })); addAudit("Case closed", c.id); };
  const items = (g: string) => c.items.filter((i) => i.group === g);

  return (
    <div className="space-y-4">
      <Link to="/hospital" className="text-sm text-primary">← Incoming cases</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-semibold">{c.id}</h1>
          <p className="text-muted-foreground">{c.descriptor || "Unidentified patient"} · {c.complaint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild><Button disabled={c.hospitalStatus !== "incoming"}>Acknowledge handover</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Acknowledge handover?</AlertDialogTitle><AlertDialogDescription>Confirms {c.id} has been received by the emergency department.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={ack}>Acknowledge</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" disabled={c.hospitalStatus === "closed"} onClick={close}>Close case</Button>
          <Button variant="ghost" onClick={notAvailable}>Request correction</Button>
        </div>
      </div>
      <ol className="grid grid-cols-4 gap-2">
        {["Sent", "Received", "Acknowledged", "Closed"].map((s, i) => (
          <li key={s} className={cn("rounded-md border p-2 text-center text-sm", i <= stage ? "border-primary bg-accent font-medium text-accent-foreground" : "bg-card text-muted-foreground")}>{s}</li>
        ))}
      </ol>
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Details">
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">Unit</dt><dd className="font-mono">{c.unit}</dd>
            <dt className="text-muted-foreground">Destination</dt><dd>{c.destination}</dd>
            <dt className="text-muted-foreground">Started</dt><dd className="font-mono">{fmtTime(c.createdAt)}</dd>
            <dt className="text-muted-foreground">Last updated</dt><dd className="font-mono">{fmtTime(c.updatedAt)}</dd>
            <dt className="text-muted-foreground">Status</dt><dd><HospitalChip status={c.hospitalStatus} /></dd>
          </dl>
        </Section>
        <Section title="Medications">
          <table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="pb-2">Drug</th><th className="pb-2">Dose / route / time</th><th className="pb-2">Status</th></tr></thead>
            <tbody className="divide-y">{items("med").map((i) => <tr key={i.id}><td className="py-2">{i.label}</td><td className="py-2">{i.status === "unknown" ? "Dose unknown" : i.value}</td><td className="py-2"><ItemChip status={i.status} /></td></tr>)}</tbody></table>
        </Section>
        <Section title="Procedures and observations">
          <ul className="space-y-1 text-sm">{[...items("proc"), ...items("obs")].map((i) => <li key={i.id} className="flex justify-between"><span>{i.label}</span><span>{i.status === "unknown" ? "Unknown" : i.value}</span></li>)}</ul>
        </Section>
        <Section title="Flags and resolutions">
          <ul className="space-y-2 text-sm">
            {c.items.filter((i) => i.flag).map((i) => <li key={i.id} className="flex flex-wrap items-center gap-2"><Chip tone="warning" icon={AlertTriangle}>{i.label}: {i.flag}</Chip>{isResolved(i) && <Chip tone="success" icon={CheckCircle2}>Resolved: {i.status === "unknown" ? "marked unknown" : i.value}</Chip>}</li>)}
            {c.items.every((i) => !i.flag) && <li className="text-muted-foreground">No flags.</li>}
          </ul>
        </Section>
        <Section title="Timeline">
          <ol className="space-y-1 border-l pl-4 text-sm">{c.timeline.map((t, i) => <li key={i}><span className="font-mono text-xs text-muted-foreground">{t.t}</span> {t.label}</li>)}</ol>
        </Section>
        <Section title="Correction history"><div className="overflow-x-auto"><CorrectionTable c={c} /></div></Section>
      </div>
    </div>
  );
}
