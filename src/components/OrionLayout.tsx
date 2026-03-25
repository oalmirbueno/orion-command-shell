import { SidebarProvider } from "@/components/ui/sidebar";
import { OrionSidebar } from "@/components/OrionSidebar";
import { OrionTopBar } from "@/components/OrionTopBar";

interface OrionLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function OrionLayout({ children, title }: OrionLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <OrionSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <OrionTopBar title={title} />
          <main className="flex-1 p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
