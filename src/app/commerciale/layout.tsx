import AuthProvider from "@/components/layout/AuthProvider";
import { getInitialAuthPayload } from "@/lib/auth-bootstrap";

export default async function CommercialAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialAuth = await getInitialAuthPayload();

  return (
    <AuthProvider initialAuth={initialAuth}>
      <div className="min-h-screen w-full" style={{ background: "var(--c-bg-0)" }}>
        {children}
      </div>
    </AuthProvider>
  );
}
