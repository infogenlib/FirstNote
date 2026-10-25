import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { fmtTime } from "@/components/fn";

export const Route = createFileRoute("/hospital/log")({
  head: () => ({
    meta: [
      { title: "Handover log — FirstNote" },
      { name: "description", content: "Log of handover acknowledgements and closures." },
      { property: "og:title", content: "Handover log — FirstNote" },
      { property: "og:description", content: "Handover activity log." },
    ],
  }),
  component: () => {
    const { audit } = useStore();
    const rows = audit.filter((a) => ["Sync completed", "Handover acknowledged", "Case closed"].includes(a.action));
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Handover log</h1>
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((a, i) => <li key={i} className="flex flex-wrap gap-3 p-3 text-sm"><span className="font-mono text-xs text-muted-foreground">{fmtTime(a.ts)}</span><span className="font-medium">{a.action}</span><span className="font-mono">{a.target}</span><span className="text-muted-foreground">{a.actor}</span></li>)}
        </ul>
      </div>
    );
  },
});
