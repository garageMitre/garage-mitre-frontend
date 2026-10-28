import { AdminNavbarSidebar } from "@/components/navegation/admin-navbar-sidebar";
import { AppNavbar } from "@/components/navegation/app-navbar";
import { UserNavbarSidebar } from "@/components/navegation/user-navbar-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";


export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar:state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppNavbar adminSidebar={<AdminNavbarSidebar/>} userSidebar={<UserNavbarSidebar/>}>
      <div className="flex flex-col flex-1 h-full">
          <main className="container mx-auto px-6 py-6">{children}</main>
        </div>
      </AppNavbar>
    </SidebarProvider>
  );
}
