import type { Metadata } from "next";
import PetCollection from "@/components/pets/PetCollection";

export const metadata: Metadata = {
  title: "Pet Collection — DL Typing",
  description: "Unlock pet companions by practicing every day. Collect, preview and choose your companion.",
};

export default function PetsPage() {
  return <PetCollection />;
}
