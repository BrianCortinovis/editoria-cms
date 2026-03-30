#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local non trovato');
  }

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const vars = {};
  for (const line of envContent.split('\n')) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (!match) continue;
    vars[match[1].trim()] = match[2].trim();
  }
  return vars;
}

function isLocalSupabaseUrl(url) {
  return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(url);
}

async function ensureUser(admin, userConfig) {
  const { email, password, name } = userConfig;
  const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = existing.data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());

  if (found) {
    await admin.auth.admin.updateUserById(found.id, {
      password,
      user_metadata: {
        full_name: name,
      },
      email_confirm: true,
    });
    return found.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
    },
  });

  if (error || !data.user) {
    throw new Error(error?.message || `Creazione utente fallita per ${email}`);
  }

  return data.user.id;
}

async function main() {
  const env = readEnvFile();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Variabili Supabase mancanti in .env.local');
  }

  if (!isLocalSupabaseUrl(url)) {
    throw new Error(
      `Questo script è bloccato perché l'URL Supabase non è locale (${url}). ` +
      'Usalo solo con Supabase locale per evitare utenti di test su ambienti remoti.'
    );
  }

  const supabase = createClient(url, serviceKey);

  const tenantSlug = process.argv[2] || 'valbrembana';
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', tenantSlug)
    .single();

  if (tenantError || !tenant) {
    throw new Error(`Tenant non trovato: ${tenantSlug}`);
  }

  const users = [
    {
      email: 'admin.test@local.cms',
      password: 'admin1234',
      name: 'Admin Test Locale',
      role: 'admin',
    },
    {
      email: 'desk.test@local.cms',
      password: 'desk1234',
      name: 'Desk Test Locale',
      role: 'chief_editor',
    },
    {
      email: 'reporter.test@local.cms',
      password: 'reporter1234',
      name: 'Reporter Test Locale',
      role: 'contributor',
    },
  ];

  for (const entry of users) {
    const userId = await ensureUser(supabase, entry);

    await supabase.from('profiles').upsert({
      id: userId,
      email: entry.email,
      full_name: entry.name,
      is_platform_superadmin: entry.role === 'admin',
    });

    const { data: membership } = await supabase
      .from('user_tenants')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('user_id', userId)
      .maybeSingle();

    if (membership) {
      await supabase
        .from('user_tenants')
        .update({ role: entry.role })
        .eq('id', membership.id);
    } else {
      await supabase.from('user_tenants').insert({
        tenant_id: tenant.id,
        user_id: userId,
        role: entry.role,
      });
    }
  }

  console.log(`Utenti di test creati/aggiornati per tenant ${tenant.slug}:`);
  console.log('- admin.test@local.cms / admin1234 (admin)');
  console.log('- desk.test@local.cms / desk1234 (chief_editor)');
  console.log('- reporter.test@local.cms / reporter1234 (contributor)');
  console.log('');
  console.log('Script consentito solo su Supabase locale.');
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
