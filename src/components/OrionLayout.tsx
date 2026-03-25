import { SidebarProvider } from "@/components/ui/sidebar";
import { OrionSidebar } from "@/components/OrionSidebar";
import { OrionTopBar } from "@/components/OrionTopBar";
import { OrionStatusBar } from "@/components/OrionStatusBar";

interface OrionLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function OrionLayout({ children, title }: OrionLayoutProps) {
  return (
    <SidebarProvider>
      <div className="h-screen flex w-full overflow-hidden">
        <OrionSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <OrionTopBar title={title} />
          <main className="flex-1 p-6 overflow-auto orion-thin-scroll">
            {children}
          </main>
          <OrionStatusBar />
        </div>
      </div>
    </SidebarProvider>
  );
}
