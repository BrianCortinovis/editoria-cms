#!/bin/bash

# GitHub Secrets per editoria-cms
gh secret set SUPABASE_URL --body "https://xtyoeajjxgeeemwlcotk.supabase.co" --repo BrianCortinovis/editoria-cms
gh secret set SUPABASE_ANON_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0eW9lYWpqeGdlZWVtd2xjb3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODQzMTYsImV4cCI6MjA4OTM2MDMxNn0.uzCnDb5o1nopzLaKEu6OPldZnTvAVXUxWt-wI9FShcI" --repo BrianCortinovis/editoria-cms
gh secret set SUPABASE_SERVICE_ROLE_KEY --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0eW9lYWpqeGdlZWVtd2xjb3RrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc4NDMxNiwiZXhwIjoyMDg5MzYwMzE2fQ.X2_wqdjxU5Ma-LNHke0oxV_t48Nk5HsnL_6UBJD2U6I" --repo BrianCortinovis/editoria-cms
gh secret set DATABASE_URL --body "postgresql://postgres:Saaspms8979.@db.xtyoeajjxgeeemwlcotk.supabase.co:5432/postgres" --repo BrianCortinovis/editoria-cms
gh secret set SUPABASE_ACCESS_TOKEN --body "sbp_5a2ca3b9c76e332b9d5d15d79f8dc64a32da5332" --repo BrianCortinovis/editoria-cms

echo "✅ GitHub Secrets configurati per editoria-cms"
