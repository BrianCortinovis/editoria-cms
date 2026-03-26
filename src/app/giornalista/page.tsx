import JournalistDeskApp from '@/components/desk/JournalistDeskApp';
import { requireAuth } from '@/lib/auth';

export default async function GiornalistaPage() {
  await requireAuth();

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-[1320px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <JournalistDeskApp standalone />
      </div>
    </main>
  );
}
