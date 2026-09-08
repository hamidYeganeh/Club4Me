import { http, getHttpClient } from "../../http/client";

export type Exercise = {
  id: string;
  name: string;
  muscle: string;
  equipment: string;
  instructions: string;
  originalName?: string;
  animation?: boolean;
  instructionsLanguage?: string;
  attribution?: { publisher: string; licenseUrl: string };
};
export type Prescription = {
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  restSeconds: number;
  note: string;
};
export type TrainingPlan = {
  title: string;
  description: string;
  days: {
    id: string;
    title: string;
    weekday: number;
    exercises: Prescription[];
  }[];
};
export type PlanRecord = {
  id: string;
  version: number;
  versions: { version: number; createdAt: string; plan: TrainingPlan }[];
};
export type Assignment = {
  id: string;
  athleteId: string;
  version: number;
  snapshot: TrainingPlan;
  startsAt: string;
  endsAt: string;
  status: "active" | "revoked";
  consentAt: string | null;
  available: boolean;
};
export type TrainingSet = {
  exerciseIndex: number;
  setIndex: number;
  reps: number;
  weight: number;
  done: boolean;
};
export type SessionBody = {
  assignmentId: string;
  dayId: string;
  startedAt: string;
  finishedAt: string | null;
  status: "active" | "completed" | "discarded";
  sets: TrainingSet[];
  note: string;
};
export type SessionRecord = SessionBody & {
  clientId: string;
  revision: number;
  snapshot: TrainingPlan;
};
export type SessionWrite = SessionBody & {
  mutationId: string;
  expectedRevision: number;
};
export type TrainingClients = {
  items: { id: string; name: string }[];
  classes: { id: string; title: string }[];
};
export const trainingApi = {
  animation: async (id: string, signal?: AbortSignal) =>
    (
      await getHttpClient().get<Blob>(
        `/training/exercises/${encodeURIComponent(id)}/animation`,
        { responseType: "blob", signal, timeout: 60000 },
      )
    ).data,
  exercises: () => http.get<{ items: Exercise[] }>("/training/exercises"),
  assignments: () => http.get<{ items: Assignment[] }>("/training/assignments"),
  sessions: () => http.get<{ items: SessionRecord[] }>("/training/sessions"),
  consent: (id: string, accepted: boolean) =>
    http.put(`/training/assignments/${id}/consent`, { accepted }),
  plans: () => http.get<{ items: PlanRecord[] }>("/training/coach/plans"),
  clients: () => http.get<TrainingClients>("/training/coach/clients"),
  coachAssignments: () =>
    http.get<{ items: Assignment[] }>("/training/coach/assignments"),
  coachSessions: (id: string) =>
    http.get<{ items: SessionRecord[] }>(
      `/training/coach/assignments/${id}/sessions`,
    ),
  savePlan: (
    id: string,
    expectedVersion: number,
    plan: TrainingPlan,
    mutationId: string,
  ) =>
    http.put<PlanRecord>(`/training/coach/plans/${id}`, {
      expectedVersion,
      plan,
      mutationId,
    }),
  assign: (data: {
    planId: string;
    version: number;
    recipient: "athlete" | "class";
    recipientId: string;
    startsAt: string;
    endsAt: string;
    mutationId: string;
  }) => http.put("/training/coach/assignments", data),
  revoke: (id: string) => http.put(`/training/coach/assignments/${id}/revoke`),
};
