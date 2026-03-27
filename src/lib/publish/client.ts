type PublishTaskRequest =
  | { type: 'settings' }
  | { type: 'menu' }
  | { type: 'homepage'; pageId?: string | null }
  | { type: 'page'; pageId: string }
  | { type: 'article'; articleId: string }
  | { type: 'category'; categoryId: string }
  | { type: 'full_rebuild' };

export async function requestPublishTrigger(tenantId: string, tasks: PublishTaskRequest[]) {
  const response = await fetch('/api/publish/trigger', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tenant_id: tenantId,
      tasks,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error || 'Publish trigger failed');
  }

  return payload;
}
