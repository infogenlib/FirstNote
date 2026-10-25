export type Role = "responder" | "hospital" | "admin";
export type ItemStatus = "auto" | "confirmed" | "corrected" | "unknown";
export type CaseStatus = "draft" | "needs_review" | "finalized" | "pending_sync" | "synced";
export type HospitalStatus = "incoming" | "acknowledged" | "closed";

export interface Item {
  id: string;
  group: "med" | "proc" | "obs";
  label: string;
  value: string;
  original: string;
  confidence: number;
  source: string;
  status: ItemStatus;
  flag?: string | undefined;
}
export interface Correction { item: string; prev: string; next: string; user: string; ts: string; reason: string; synthetic?: boolean }
export interface Case {
  id: string;
  descriptor: string;
  age: string;
  sex: string;
  complaint: string;
  unit: string;
  eta: string;
  destination: string;
  status: CaseStatus;
  hospitalStatus: HospitalStatus;
  createdAt: string;
  updatedAt: string;
  transcript: { t: string; text: string }[];
  items: Item[];
  corrections: Correction[];
  timeline: { t: string; label: string }[];
  isNew?: boolean;
}
export interface AuditEntry { ts: string; actor: string; role: string; action: string; target: string; hash: string }

export const USERS: Record<Role, { id: string; label: string; name: string }> = {
  responder: { id: "R-1042", label: "First responder", name: "Alex Moreno" },
  hospital: { id: "H-2210", label: "Hospital staff", name: "Dr. Priya Nair" },
  admin: { id: "A-0001", label: "Administrator", name: "Jordan Ellis" },
};

export const DESTINATIONS = [
  "City General Hospital, Emergency Department",
  "Riverside Medical Centre, Emergency Department",
  "Lakeside District Hospital, Casualty",
];

export const NARRATION = [
  "Male, around sixty, chest pain for forty minutes.",
  "BP one forty over ninety, pulse one ten, SpO2 ninety-four on air.",
  "Gave aspirin three hundred milligrams orally at two fourteen.",
  "Started oxygen.",
  "Gave GTN under the tongue.",
];

export function extractedItems(): Item[] {
  const mk = (id: string, group: Item["group"], label: string, value: string, confidence: number, source: string, flag?: string): Item =>
    ({ id, group, label, value, original: value, confidence, source, status: "auto", flag });
  return [
    mk("med-asp", "med", "Aspirin", "300 mg, oral, 02:14", 92, "aspirin three hundred milligrams orally at two fourteen"),
    mk("med-gtn", "med", "GTN", "sublingual, dose missing", 78, "GTN under the tongue", "Dose missing. Confirm or mark unknown."),
    mk("proc-o2", "proc", "Oxygen", "Oxygen started", 95, "Started oxygen"),
    mk("obs-bp", "obs", "Blood pressure", "140/90", 90, "BP one forty over ninety"),
    mk("obs-hr", "obs", "Pulse", "110", 93, "pulse one ten"),
    mk("obs-spo2", "obs", "SpO2", "94% on air", 91, "SpO2 ninety-four on air"),
  ];
}

export const hhmmss = (d = new Date()) => d.toTimeString().slice(0, 8);
export const fakeHash = () => Math.random().toString(16).slice(2, 10);
export const isResolved = (i: Item) => !i.flag || i.status === "unknown" || i.status === "corrected";

const iso = (minsAgo: number) => new Date(Date.now() - minsAgo * 60000).toISOString();

function seedCase(n: number, descriptor: string, complaint: string, unit: string, eta: string, status: CaseStatus, hs: HospitalStatus, mins: number, dest = DESTINATIONS[n % 3]): Case {
  const items = extractedItems().map((i) => (i.flag ? { ...i, flag: n === 1 ? i.flag : undefined, value: "0.4 mg, sublingual", status: "corrected" as const } : { ...i, status: "confirmed" as const }));
  return {
    id: `FN-2026-0000${80 + n}`, descriptor, age: "", sex: "", complaint, unit, eta, destination: dest ?? DESTINATIONS[0]!, status, hospitalStatus: hs,
    createdAt: iso(mins), updatedAt: iso(mins - 5),
    transcript: [{ t: hhmmss(new Date(Date.now() - mins * 60000)), text: `${descriptor}, ${complaint.toLowerCase()}.` }],
    items: status === "needs_review" ? extractedItems() : items,
    corrections: [], timeline: [{ t: hhmmss(new Date(Date.now() - mins * 60000)), label: "Case started" }],
  };
}

export function seedCases(): Case[] {
  return [
    seedCase(1, "Female, 70–79", "Shortness of breath", "AMB-07", "6 min", "synced", "incoming", 30),
    seedCase(2, "Male, 40–49", "Fall from height", "AMB-12", "12 min", "synced", "incoming", 45),
    seedCase(3, "Female, 20–29", "Allergic reaction", "AMB-03", "Arrived", "synced", "acknowledged", 90),
    seedCase(4, "Male, 50–59", "Chest pain", "AMB-21", "Arrived", "synced", "acknowledged", 140),
    seedCase(5, "Male, 80–89", "Confusion", "AMB-09", "Arrived", "synced", "closed", 300),
    seedCase(6, "Female, 30–39", "Abdominal pain", "AMB-07", "—", "needs_review", "incoming", 20),
  ];
}

export function seedAudit(): AuditEntry[] {
  const e = (m: number, actor: string, role: string, action: string, target: string, hash: string) => ({ ts: iso(m), actor, role, action, target, hash });
  return [
    e(10, "H-2210", "Hospital staff", "Handover acknowledged", "FN-2026-000083", "a91f3c20"),
    e(60, "R-1042", "First responder", "Sync completed", "FN-2026-000082", "4be07d11"),
    e(65, "R-1042", "First responder", "Record finalized", "FN-2026-000082", "c3d8e9a2"),
    e(240, "A-0001", "Administrator", "Sign-in", "Admin console", "0f6b2e77"),
  ];
}

export const ADMIN_USERS = [
  ["Alex Moreno", "R-1042", "First responder", "Northshore Ambulance Service", "Active", "Today 08:40"],
  ["Sam Okafor", "R-1077", "First responder", "Northshore Ambulance Service", "Active", "Yesterday 22:10"],
  ["Dr. Priya Nair", "H-2210", "Hospital staff", "City General Hospital", "Active", "Today 08:12"],
  ["Lena Fischer", "H-2234", "Hospital staff", "Riverside Medical Centre", "Suspended", "12 Oct 2026"],
  ["Jordan Ellis", "A-0001", "Administrator", "FirstNote Demo Org", "Active", "Today 07:55"],
];

export function buildFhir(c: Case) {
  const ref = `Encounter/${c.id}`;
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: [
      { resourceType: "Encounter", id: c.id, status: c.status === "synced" ? "finished" : "in-progress", class: "EMER", subject: { display: c.descriptor || "Unidentified patient" }, serviceProvider: { display: c.destination || "Not selected" }, period: { start: c.createdAt } },
      ...c.items.filter((i) => i.group === "med").map((i) => ({ resourceType: "MedicationAdministration", id: i.id, status: "completed", medication: i.label, dosage: i.status === "unknown" ? "unknown" : i.value, context: ref })),
      ...c.items.filter((i) => i.group === "proc").map((i) => ({ resourceType: "Procedure", id: i.id, status: "completed", code: i.value, encounter: ref })),
      ...c.items.filter((i) => i.group === "obs").map((i) => ({ resourceType: "Observation", id: i.id, status: i.status === "unknown" ? "preliminary" : "final", code: i.label, value: i.status === "unknown" ? "unknown" : i.value, encounter: ref })),
      { resourceType: "Provenance", target: [ref], recorded: c.updatedAt, agent: [{ who: USERS.responder.id }], activity: "on-device transcription (simulated), clinician reviewed" },
    ],
  };
}
