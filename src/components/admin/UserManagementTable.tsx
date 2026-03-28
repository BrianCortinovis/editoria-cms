"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

interface PlatformUser {
  id: string;
  email: string | null;
  fullName: string | null;
  firstName: string | null;
  aiEnabled: boolean;
  createdAt: string;
  siteCount: number;
}

export function UserManagementTable({ users }: { users: PlatformUser[] }) {
  const [userStates, setUserStates] = useState<Record<string, boolean>>(
    Object.fromEntries(users.map((u) => [u.id, u.aiEnabled]))
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function toggleAi(userId: string, enabled: boolean) {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_enabled: enabled }),
      });

      if (res.ok) {
        startTransition(() => {
          setUserStates((prev) => ({ ...prev, [userId]: enabled }));
        });
      }
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div
      className="overflow-x-auto border-y"
      style={{ borderColor: "var(--c-border)" }}
    >
      <table className="min-w-full text-sm">
        <thead>
          <tr>
            <th
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--c-text-2)" }}
            >
              Utente
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--c-text-2)" }}
            >
              Email
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--c-text-2)" }}
            >
              Siti
            </th>
            <th
              className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--c-text-2)" }}
            >
              Registrato
            </th>
            <th
              className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em]"
              style={{ color: "var(--c-text-2)" }}
            >
              IA Abilitata
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const aiOn = userStates[user.id] ?? user.aiEnabled;
            const isLoading = loadingId === user.id;

            return (
              <tr
                key={user.id}
                className="border-t"
                style={{ borderColor: "var(--c-border)" }}
              >
                <td className="px-4 py-3">
                  <p
                    className="font-semibold"
                    style={{ color: "var(--c-text-0)" }}
                  >
                    {user.fullName || user.firstName || "Senza nome"}
                  </p>
                  <p
                    className="mt-0.5 text-xs font-mono"
                    style={{ color: "var(--c-text-2)" }}
                  >
                    {user.id.slice(0, 8)}...
                  </p>
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--c-text-1)" }}
                >
                  {user.email || "n/d"}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--c-text-1)" }}
                >
                  {user.siteCount}
                </td>
                <td
                  className="px-4 py-3"
                  style={{ color: "var(--c-text-1)" }}
                >
                  {new Date(user.createdAt).toLocaleDateString("it-IT")}
                </td>
                <td className="px-4 py-3 text-center">
                  {isLoading ? (
                    <Loader2
                      className="mx-auto h-4 w-4 animate-spin"
                      style={{ color: "var(--c-text-2)" }}
                    />
                  ) : (
                    <button
                      onClick={() => toggleAi(user.id, !aiOn)}
                      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                      style={{
                        background: aiOn ? "var(--c-danger)" : "var(--c-bg-2)",
                        border: aiOn ? "none" : "1px solid var(--c-border)",
                      }}
                      title={aiOn ? "Disabilita IA" : "Abilita IA"}
                    >
                      <span
                        className="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                        style={{
                          transform: aiOn
                            ? "translateX(24px)"
                            : "translateX(4px)",
                        }}
                      />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
          {users.length === 0 && (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-sm"
                style={{ color: "var(--c-text-2)" }}
              >
                Nessun utente trovato.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
