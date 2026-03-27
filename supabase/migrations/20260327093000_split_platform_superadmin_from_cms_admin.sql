ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_platform_superadmin BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE profiles
SET is_platform_superadmin = TRUE
WHERE id IN (
  SELECT DISTINCT user_id
  FROM user_tenants
  WHERE role::text = 'super_admin'
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'user_role'
      AND e.enumlabel = 'super_admin'
  ) THEN
    ALTER TYPE user_role RENAME VALUE 'super_admin' TO 'admin';
  END IF;
END $$;
