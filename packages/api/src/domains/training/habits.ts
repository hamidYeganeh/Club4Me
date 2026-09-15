import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "../../http/client";
export type Habit = {
  id: string;
  title: string;
  unit: string;
  target: number;
  logs: { date: string; value: number; target: number }[];
};
const key = ["training", "habits"] as const;
export function useHabits() {
  return useQuery({
    queryKey: key,
    queryFn: () =>
      http.get<{ today: string; items: Habit[] }>("/training/habits"),
  });
}
export function useHabitActions() {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: key });
  return {
    save: useMutation({
      mutationFn: (habit: Pick<Habit, "id" | "title" | "unit" | "target">) =>
        http.put(`/training/habits/${habit.id}`, habit),
      onSuccess: refresh,
    }),
    log: useMutation({
      mutationFn: (body: { id: string; date: string; value: number }) =>
        http.put(`/training/habits/${body.id}/log`, body),
      onSuccess: refresh,
    }),
    archive: useMutation({
      mutationFn: (id: string) => http.delete(`/training/habits/${id}`),
      onSuccess: refresh,
    }),
  };
}
