import "server-only";
import { emailInList } from "@/lib/perks-core";

/**
 * Account perks, decided on the server so the list of emails never reaches the browser.
 * Set PET_UNLOCK_ALL_EMAILS to a comma-separated list (see .env.example). Emails are compared
 * case-insensitively, matching how accounts are stored.
 */
export type Perks = { allPets: boolean };

export const perksFor = (email: string): Perks => ({ allPets: emailInList(process.env.PET_UNLOCK_ALL_EMAILS, email) });
