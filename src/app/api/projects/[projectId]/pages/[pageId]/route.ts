import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; pageId: string }> }
) {
  const { projectId, pageId } = await params;

  // For now, return empty blocks (development mode)
  // In production, this would load from database
  return NextResponse.json({
    projectId,
    pageId,
    blocks: [],
    metadata: {
      title: `${pageId}`,
      description: 'Page blocks',
    },
  });
}
