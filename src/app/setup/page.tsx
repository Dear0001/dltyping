
import SetupForm from "@/components/setup/SetupForm";
import { SetupHeader, SetupHeading } from "@/components/setup/SetupHeader";
import VirtualKeyboard from "@/components/keyboard/VirtualKeyboard";

export default function SetupPage() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <SetupHeader />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <SetupHeading />
        <SetupForm />
        <section className="mt-6">
          <VirtualKeyboard language="english" languageSelectable />
        </section>
      </div>
    </main>
  );
}
