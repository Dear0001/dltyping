import type { Metadata } from "next";
import ContactPage from "@/components/support/ContactPage";

export const metadata: Metadata = {
  title: "Contact Us — DL Typing",
  description: "Get in touch with DL Typing by email, LinkedIn, GitHub or the contact form.",
};

export default function Page() {
  return <ContactPage />;
}
