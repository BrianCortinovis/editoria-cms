import DashboardShell from "@/components/layout/DashboardShell";
import { getInitialAuthPayload } from "@/lib/auth-bootstrap";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const initialAuth = await getInitialAuthPayload();

  return <DashboardShell initialAuth={initialAuth}>{children}</DashboardShell>;
}
