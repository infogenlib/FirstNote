import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Ambulance, Hospital, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { USERS, type Role } from "@/lib/data";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in — FirstNote" },
      { name: "description", content: "Choose a demo role to sign in to FirstNote: first responder, hospital staff or administrator." },
      { property: "og:title", content: "Sign in — FirstNote" },
      { property: "og:description", content: "The first record and the first link in care." },
    ],
  }),
  component: Login,
});

const ROLES: { role: Role; icon: typeof Ambulance; desc: string; to: "/responder" | "/hospital" | "/admin" }[] = [
  { role: "responder", icon: Ambulance, desc: "Capture and hand over patient records in the field.", to: "/responder" },
  { role: "hospital", icon: Hospital, desc: "Receive and acknowledge incoming handovers.", to: "/hospital" },
  { role: "admin", icon: ShieldCheck, desc: "Manage access and review the audit log.", to: "/admin" },
];

function Login() {
  const { signIn, role: current } = useStore();
  const [role, setRole] = useState<Role>(current ?? "responder");
  const navigate = useNavigate();
  const r = ROLES.find((x) => x.role === role)!;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Sign in to FirstNote</h1>
      <p className="mt-1 text-muted-foreground">The first record and the first link in care.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Role">
        {ROLES.map(({ role: ro, icon: Icon, desc }) => (
          <button key={ro} role="radio" aria-checked={role === ro} onClick={() => setRole(ro)}
            className={cn("min-h-12 rounded-lg border bg-card p-4 text-left focus-visible:outline-2 focus-visible:outline-ring", role === ro && "border-primary ring-1 ring-primary")}>
            <Icon className="h-5 w-5 text-primary" />
            <div className="mt-2 font-medium">{USERS[ro].label}</div>
            <div className="mt-1 text-xs text-muted-foreground">{desc}</div>
          </button>
        ))}
      </div>
      <form className="mt-6 grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => { e.preventDefault(); signIn(role); navigate({ to: r.to }); }}>
        <div className="grid gap-1.5"><Label htmlFor="uid">Demo ID</Label><Input id="uid" className="h-12 font-mono" value={USERS[role].id} readOnly /></div>
        <div className="grid gap-1.5"><Label htmlFor="pin">PIN</Label><Input id="pin" className="h-12 font-mono" type="password" value="1234" readOnly /></div>
        <Button type="submit" className="h-12 px-6">Sign in</Button>
      </form>
      <p className="mt-3 text-xs text-muted-foreground">Demo sign-in only. No real authentication. All data is synthetic and stored on this device.</p>
    </div>
  );
}
