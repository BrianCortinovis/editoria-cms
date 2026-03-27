import AuthProvider from "@/components/layout/AuthProvider";
import { getInitialAuthPayload } from "@/lib/auth-bootstrap";

export default async function DesktopEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialAuth = await getInitialAuthPayload();

  return <AuthProvider initialAuth={initialAuth}>{children}</AuthProvider>;
}
