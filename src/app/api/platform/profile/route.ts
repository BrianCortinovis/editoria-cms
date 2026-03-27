import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const payload = {
    full_name: String(body.full_name || "").trim(),
    first_name: body.first_name ? String(body.first_name).trim() : null,
    last_name: body.last_name ? String(body.last_name).trim() : null,
    locale: body.locale ? String(body.locale) : "it",
    timezone: body.timezone ? String(body.timezone) : "Europe/Rome",
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("profiles").update(payload).eq("id", user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
