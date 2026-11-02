import { getOSPlatform } from "@/lib/os-detect";
import MacKeyboardLayout from "@/components/keyboard/MacKeyboardLayout";
import WindowsKeyboardLayout from "@/components/keyboard/WindowsKeyboardLayout";

export default async function VirtualKeyboard() {
  const platform = await getOSPlatform();

  if (platform === "macOS") return <MacKeyboardLayout />;
  if (platform === "Windows") return <WindowsKeyboardLayout />;

  return (
    <div className="rounded-2xl border border-dashed border-[#dfe2d9] bg-[#f7f8f4] p-5 text-center text-sm text-[#7d8479]">
      Keyboard preview adapts to your computer. You can still type with your physical keyboard.
    </div>
  );
}
