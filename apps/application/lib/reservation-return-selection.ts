type ReservationSelection = {
  sessionId: string;
  participantCount: number;
  quantities: Record<string, number>;
};

export function readReservationSelection(
  params: Pick<URLSearchParams, "get">,
): ReservationSelection {
  const count = Number(params.get("participants") ?? 1);
  const quantities: Record<string, number> = {};
  const encoded = params.get("extras");
  if (encoded && encoded.length <= 8_000) {
    try {
      const value: unknown = JSON.parse(encoded);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        for (const [id, quantity] of Object.entries(value).slice(0, 50)) {
          if (
            /^[a-zA-Z0-9-]{1,100}$/.test(id) &&
            typeof quantity === "number" &&
            Number.isInteger(quantity) &&
            quantity > 0 &&
            quantity <= 1000
          )
            quantities[id] = quantity;
        }
      }
    } catch {
      /* A malformed shared link must not block booking. */
    }
  }
  return {
    sessionId: params.get("session") ?? "",
    participantCount:
      Number.isInteger(count) && count >= 1 && count <= 100 ? count : 1,
    quantities,
  };
}

export function writeReservationSelection(
  params: URLSearchParams,
  selection: ReservationSelection,
): void {
  params.set("session", selection.sessionId);
  params.set("participants", String(selection.participantCount));
  params.set("extras", JSON.stringify(selection.quantities));
}
