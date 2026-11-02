import { getOSPlatform } from "@/lib/os-detect";
import MacKeyboardLayout from "@/components/keyboard/MacKeyboardLayout";
import WindowsKeyboardLayout from "@/components/keyboard/WindowsKeyboardLayout";
import UnknownKeyboardLayout from "@/components/keyboard/UnknownKeyboardLayout";

export default async function VirtualKeyboard() {
  const platform = await getOSPlatform();

  if (platform === "macOS") return <MacKeyboardLayout />;
  if (platform === "Windows") return <WindowsKeyboardLayout />;

  return <UnknownKeyboardLayout />;
}
