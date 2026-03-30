import CrispChat from "@/components/crisp-chat";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TooltipProvider>
      {children}
      <CrispChat />
      <Toaster />
    </TooltipProvider>
  );
}
