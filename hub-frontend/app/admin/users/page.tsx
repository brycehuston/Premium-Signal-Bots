"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useSupabase } from "@/components/SupabaseProvider";

const PLAN_OPTIONS = ["free", "early", "trend", "runner", "bundle"] as const;

type AdminUser = {
  id: number;
  email: string;
  role: string;
  plan: string | null;
  is_active: boolean;
};

type EditMap = Record<number, Partial<AdminUser>>;

export default function AdminUsersPage() {
  const { session, loading: authLoading } = useSupabase();
  const [meRole, setMeRole] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [edits, setEdits] = useState<EditMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = session?.access_token || "";

  const authedApi = useMemo(
    () =>
      async (path: string, init: RequestInit = {}) => {
        return api(
          path,
          {
            ...init,
            headers: {
              "Content-Type": "application/json",
              ...(init.headers || {}),
            },
          },
          { token }
        );
      },
    [token]
  );

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setError("Not signed in.");
      setLoading(false);
      return;
    }

    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const me = await authedApi("/me");
        if (!alive) return;
        setMeRole(me.role || null);
        if (me.role !== "admin") {
          setLoading(false);
          return;
        }
        const res = await authedApi("/admin/users");
        if (!alive) return;
        setUsers(res.users || []);
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message || "Failed to load users.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [authLoading, session, authedApi]);

  function setEdit(id: number, patch: Partial<AdminUser>) {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  async function saveUser(id: number) {
    const patch = edits[id];
    if (!patch) return;
    try {
      await authedApi("/admin/users/update", {
        method: "POST",
        body: JSON.stringify({
          user_id: id,
          role: patch.role,
          plan: patch.plan,
          is_active: patch.is_active,
        }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
      );
      setEdits((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err: any) {
      setError(err?.message || "Failed to update user.");
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-muted">Loading admin users...</div>
      </main>
    );
  }

  if (meRole !== "admin") {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-red-400">Not authorized.</div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text">Admin Users</h1>
        <p className="text-muted text-sm">Toggle access and assign plans manually.</p>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>

      <div className="rounded-2xl border border-stroke/60 bg-surface/60">
        <div className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.4fr_0.4fr] gap-3 px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted border-b border-stroke/60">
          <div>Email</div>
          <div>Role</div>
          <div>Plan</div>
          <div>Active</div>
          <div></div>
        </div>
        <div className="divide-y divide-stroke/60">
          {users.map((u) => {
            const edit = edits[u.id] || {};
            const role = edit.role ?? u.role;
            const plan = edit.plan ?? (u.plan || "free");
            const isActive = edit.is_active ?? u.is_active;
            return (
              <div key={u.id} className="grid grid-cols-[1.4fr_0.6fr_0.6fr_0.4fr_0.4fr] gap-3 px-4 py-3 items-center text-sm">
                <div className="text-text">{u.email}</div>
                <select
                  className="rounded-pill border border-stroke/60 bg-bg/60 px-3 py-2 text-sm text-text"
                  value={role}
                  onChange={(e) => setEdit(u.id, { role: e.target.value })}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <select
                  className="rounded-pill border border-stroke/60 bg-bg/60 px-3 py-2 text-sm text-text"
                  value={plan}
                  onChange={(e) => setEdit(u.id, { plan: e.target.value })}
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <label className="inline-flex items-center gap-2 text-sm text-muted">
                  <input
                    type="checkbox"
                    checked={Boolean(isActive)}
                    onChange={(e) => setEdit(u.id, { is_active: e.target.checked })}
                  />
                  {isActive ? "yes" : "no"}
                </label>
                <button
                  className="rounded-pill border border-gold/40 px-3 py-2 text-xs uppercase tracking-[0.2em] text-gold hover:bg-gold/10"
                  onClick={() => saveUser(u.id)}
                  disabled={!edits[u.id]}
                >
                  Save
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
