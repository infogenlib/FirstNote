import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { CaseTable } from "./hospital.index";

export const Route = createFileRoute("/hospital/all")({
  head: () => ({
    meta: [
      { title: "All cases — FirstNote" },
      { name: "description", content: "All received handovers, including closed cases." },
      { property: "og:title", content: "All cases — FirstNote" },
      { property: "og:description", content: "All received handovers." },
    ],
  }),
  component: () => {
    const { cases } = useStore();
    return <div className="space-y-4"><h1 className="text-xl font-semibold">All cases</h1><CaseTable cases={cases.filter((c) => c.status === "synced")} /></div>;
  },
});
