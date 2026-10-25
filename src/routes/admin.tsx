import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CaseStatusChip, Chip, HospitalChip, fmtTime, notAvailable } from "@/components/fn";
import { ADMIN_USERS } from "@/lib/data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — FirstNote" },
      { name: "description", content: "Users and access, audit log and case history for FirstNote." },
      { property: "og:title", content: "Administration — FirstNote" },
      { property: "og:description", content: "Audit log and access management." },
    ],
  }),
  component: Admin,
});

const Th = ({ cols }: { cols: string[] }) => <thead className="border-b text-xs text-muted-foreground"><tr>{cols.map((h) => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>;

function Admin() {
  const { audit, cases, reset } = useStore();
  const [verify, setVerify] = useState<"idle" | "busy" | "ok">("idle");
  return (
    <div className="mx-auto max-w-7xl space-y-4 p-4 md:p-6">
      <h1 className="text-xl font-semibold">Administration</h1>
      <Tabs defaultValue="users">
        <TabsList><TabsTrigger value="users">Users and access</TabsTrigger><TabsTrigger value="audit">Audit log</TabsTrigger><TabsTrigger value="history">Case history</TabsTrigger></TabsList>
        <TabsContent value="users" className="space-y-3">
          <Button onClick={notAvailable}><UserPlus className="h-4 w-4" />Add user</Button>
          <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-left text-sm"><Th cols={["Name", "User ID", "Role", "Organisation", "Status", "Last active"]} />
            <tbody className="divide-y">{ADMIN_USERS.map((u) => <tr key={u[1]}><td className="p-3">{u[0]}</td><td className="p-3 font-mono">{u[1]}</td><td className="p-3">{u[2]}</td><td className="p-3">{u[3]}</td><td className="p-3">{u[4] === "Active" ? <Chip tone="success" icon={CheckCircle2}>Active</Chip> : <Chip tone="critical" icon={ShieldCheck}>Suspended</Chip>}</td><td className="p-3">{u[5]}</td></tr>)}</tbody></table></div>
        </TabsContent>
        <TabsContent value="audit" className="space-y-3">
          <div className="flex items-center gap-3">
            <Button variant="outline" disabled={verify === "busy"} onClick={() => { setVerify("busy"); setTimeout(() => setVerify("ok"), 1000); }}>
              {verify === "busy" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Verify audit chain
            </Button>
            {verify === "ok" && <Chip tone="success" icon={CheckCircle2}>Chain verified</Chip>}
            <span className="text-xs text-muted-foreground">Demo hashes only. No cryptographic verification.</span>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-left text-sm"><Th cols={["Timestamp", "Actor", "Role", "Action", "Target", "Hash"]} />
            <tbody className="divide-y">{audit.map((a, i) => <tr key={i}><td className="p-3 font-mono text-xs">{fmtTime(a.ts)}</td><td className="p-3 font-mono">{a.actor}</td><td className="p-3">{a.role}</td><td className="p-3">{a.action}</td><td className="p-3 font-mono text-xs">{a.target}</td><td className="p-3 font-mono text-xs">{a.hash}</td></tr>)}</tbody></table></div>
        </TabsContent>
        <TabsContent value="history" className="space-y-3">
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive">Reset demo data</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>Reset demo data?</AlertDialogTitle><AlertDialogDescription>Restores seeded cases, users and audit events, and clears all local demo records on this device.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => { reset(); setVerify("idle"); toast("Demo data reset"); }}>Reset</AlertDialogAction></AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="overflow-x-auto rounded-lg border bg-card"><table className="w-full text-left text-sm"><Th cols={["Case ID", "Patient", "Destination", "Record", "Hospital", "Created"]} />
            <tbody className="divide-y">{cases.map((c) => <tr key={c.id}><td className="p-3 font-mono">{c.id}</td><td className="p-3">{c.descriptor || "Unidentified"}</td><td className="p-3">{c.destination || "—"}</td><td className="p-3"><CaseStatusChip status={c.status} /></td><td className="p-3"><HospitalChip status={c.hospitalStatus} /></td><td className="p-3 font-mono text-xs">{fmtTime(c.createdAt)}</td></tr>)}</tbody></table></div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
