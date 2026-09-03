export type Club = {
  id: string;
  name: string;
  slug: string;
  city?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClubClass = {
  id: string;
  clubId: string;
  name: string;
  sport?: string;
  createdAt: string;
  updatedAt: string;
};

export type ClubSlot = {
  id: string;
  clubId: string;
  classId?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reservedCount: number;
};

export type Reservation = {
  id: string;
  clubId: string;
  slotId: string;
  userId: string;
  participantCount: number;
  status: "reserved";
  createdAt: string;
};

export type ListClubsParams = {
  city?: string;
  q?: string;
  page?: number;
  limit?: number;
};

export type ListClubsResponse = {
  items: Club[];
  page: number;
  limit: number;
  total: number;
};

export type CreateClubPayload = {
  name: string;
  city?: string;
  description?: string;
};

export type CreateClassPayload = {
  name: string;
  sport?: string;
};

export type CreateSlotPayload = {
  classId?: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
};

export type ReserveSlotPayload = {
  slotId: string;
  participantCount?: number;
};

export type ListClassesResponse = {
  items: ClubClass[];
};

export type ListSlotsResponse = {
  items: ClubSlot[];
};
