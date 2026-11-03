/** Pure parsing and matching for the PET_UNLOCK_ALL_EMAILS list (kept separate so it can be tested without the server runtime). */
export const parseEmailList = (raw: string | undefined): string[] => (raw ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
export const emailInList = (raw: string | undefined, email: string): boolean => parseEmailList(raw).includes(email.trim().toLowerCase());
