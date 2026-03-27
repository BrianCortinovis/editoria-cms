const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
function loadEnvFile(path) {
  if (!fs.existsSync(path)) return {};
  return Object.fromEntries(fs.readFileSync(path, 'utf8').split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#') && line.includes('=')).map(line => { const index = line.indexOf('='); return [line.slice(0, index), line.slice(index + 1)]; }));
}
const env = { ...loadEnvFile('.env.local'), ...process.env };
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
  const { data: tenant } = await supabase.from('tenants').select('id,slug,settings,logo_url').eq('slug','valbrembana').single();
  const { data: media, count } = await supabase.from('media').select('id,filename,original_filename,mime_type,url,folder', { count: 'exact' }).eq('tenant_id', tenant.id).limit(20);
  console.log(JSON.stringify({ tenant, count, media }, null, 2));
})();
