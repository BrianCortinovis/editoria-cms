"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

interface PlatformChartsProps {
  sites: Array<{
    name: string;
    storageUsagePercent: number | null;
    storageUsedBytes: number;
    storageHardLimitBytes: number | null;
    planCode: string | null;
    stackKind: string | null;
    activeModules: string[];
  }>;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function PlatformCharts({ sites }: PlatformChartsProps) {
  // Storage usage - top 10 sites
  const storageData = [...sites]
    .filter(s => s.storageUsagePercent != null && s.storageUsagePercent > 0)
    .sort((a, b) => (b.storageUsagePercent ?? 0) - (a.storageUsagePercent ?? 0))
    .slice(0, 10)
    .map(s => ({
      name: s.name.length > 15 ? s.name.slice(0, 15) + "…" : s.name,
      usage: Math.round(s.storageUsagePercent ?? 0),
      usedMB: Math.round(s.storageUsedBytes / 1024 / 1024),
    }));

  // Plan distribution
  const planCounts = new Map<string, number>();
  sites.forEach(s => {
    const plan = s.planCode || "nessuno";
    planCounts.set(plan, (planCounts.get(plan) || 0) + 1);
  });
  const planData = [...planCounts.entries()].map(([name, value]) => ({ name, value }));

  // Module adoption
  const moduleCounts = new Map<string, number>();
  sites.forEach(s => {
    (s.activeModules || []).forEach(m => {
      moduleCounts.set(m, (moduleCounts.get(m) || 0) + 1);
    });
  });
  const moduleData = [...moduleCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Stack distribution
  const stackCounts = new Map<string, number>();
  sites.forEach(s => {
    const stack = s.stackKind || "shared";
    stackCounts.set(stack, (stackCounts.get(stack) || 0) + 1);
  });
  const stackData = [...stackCounts.entries()].map(([name, value]) => ({ name, value }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Storage Usage */}
      <div className="overflow-hidden rounded-[1.5rem] border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>Storage Usage - Top 10 siti</h3>
        {storageData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={storageData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--c-text-2)" }} />
              <YAxis unit="%" tick={{ fill: "var(--c-text-2)" }} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="usage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm py-8 text-center" style={{ color: "var(--c-text-2)" }}>Nessun dato di storage disponibile</p>
        )}
      </div>

      {/* Plan Distribution */}
      <div className="overflow-hidden rounded-[1.5rem] border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>Distribuzione per piano</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={planData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Module Adoption */}
      <div className="overflow-hidden rounded-[1.5rem] border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>Adozione moduli</h3>
        {moduleData.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={moduleData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border)" />
              <XAxis type="number" tick={{ fill: "var(--c-text-2)" }} />
              <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: "var(--c-text-2)" }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm py-8 text-center" style={{ color: "var(--c-text-2)" }}>Nessun modulo attivo</p>
        )}
      </div>

      {/* Stack Distribution */}
      <div className="overflow-hidden rounded-[1.5rem] border p-5" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--c-text-0)" }}>Infrastruttura</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={stackData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {stackData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
