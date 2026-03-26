import AuthProvider from '@/components/layout/AuthProvider';

export default function JournalistAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="min-h-screen w-full" style={{ background: 'var(--c-bg-0)' }}>
        {children}
      </div>
    </AuthProvider>
  );
}
