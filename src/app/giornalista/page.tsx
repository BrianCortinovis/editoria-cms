import JournalistDeskApp from '@/components/desk/JournalistDeskApp';
import { requireAuth } from '@/lib/auth';

interface Props {
  searchParams?: Promise<{ frame?: string; device?: string }>;
}

export default async function GiornalistaPage({ searchParams }: Props) {
  await requireAuth();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const embeddedPreview = resolvedSearchParams.frame === '1';
  const previewDevice =
    resolvedSearchParams.device === 'phone' ||
    resolvedSearchParams.device === 'tablet' ||
    resolvedSearchParams.device === 'desktop'
      ? resolvedSearchParams.device
      : 'desktop';

  return (
    <main className="min-h-screen">
      <div
        className={
          embeddedPreview
            ? 'mx-auto w-full px-2 py-2 sm:px-3 sm:py-3'
            : 'mx-auto w-full max-w-[1320px] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8'
        }
      >
        <JournalistDeskApp
          standalone={!embeddedPreview}
          embeddedPreview={embeddedPreview}
          previewDevice={previewDevice}
        />
      </div>
    </main>
  );
}
