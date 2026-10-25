import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ClipboardList, Inbox, ScrollText } from "lucide-react";

export const Route = createFileRoute("/hospital")({
  head: () => ({
    meta: [
      { title: "Hospital handovers — FirstNote" },
      { name: "description", content: "Incoming prehospital handovers for the emergency department." },
      { property: "og:title", content: "Hospital handovers — FirstNote" },
      { property: "og:description", content: "Receive and acknowledge handovers." },
    ],
  }),
  component: HospitalLayout,
});

const NAV = [
  { to: "/hospital", label: "Incoming cases", icon: Inbox },
  { to: "/hospital/all", label: "All cases", icon: ClipboardList },
  { to: "/hospital/log", label: "Handover log", icon: ScrollText },
] as const;

function HospitalLayout() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
      <nav className="flex gap-1 border-b bg-card p-2 md:min-h-[calc(100vh-110px)] md:w-56 md:flex-col md:border-b-0 md:border-r">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} activeOptions={{ exact: true }} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent" activeProps={{ className: "bg-accent text-accent-foreground font-medium" }}>
            <Icon className="h-4 w-4" />{label}
          </Link>
        ))}
      </nav>
      <div className="min-w-0 flex-1 p-4 md:p-6"><Outlet /></div>
    </div>
  );
}
