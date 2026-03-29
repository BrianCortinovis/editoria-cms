const { createClient } = require('@supabase/supabase-js');
(async () => {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await supabase.from('tenants').select('id,settings').eq('slug','valbrembana').single();
  if (error) throw error;
  const currentSettings = data.settings || {};
  const ai = currentSettings.module_config?.ai_assistant || {};
  const originalUrl = ai.ollama_url || '';
  const patchedSettings = {
    ...currentSettings,
    module_config: {
      ...(currentSettings.module_config || {}),
      ai_assistant: {
        ...ai,
        ollama_url: `  ${originalUrl}  `,
      },
    },
  };
  async function restore() {
    await supabase.from('tenants').update({ settings: currentSettings }).eq('id', data.id);
  }
  try {
    const { error: updateError } = await supabase.from('tenants').update({ settings: patchedSettings }).eq('id', data.id);
    if (updateError) throw updateError;
    const res = await fetch('http://127.0.0.1:3000/api/ai/test-cms-local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenant_id: data.id })
    });
    const json = await res.json();
    console.log(JSON.stringify({ status: res.status, ok: res.ok, passed: json.passed, total: json.total, overallOk: json.ok }, null, 2));
  } finally {
    await restore();
  }
})();
