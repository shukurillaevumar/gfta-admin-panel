"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type UserItem = {
  id: string;
  email: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "PENDING" | "BLOCKED";
  createdAt: string;
  ip: string;
};

type UpdateBody = {
  status?: "ACTIVE" | "PENDING" | "BLOCKED";
  role?: "USER" | "ADMIN";
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString();
}

function pill(status: UserItem["status"]) {
  if (status === "ACTIVE")
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (status === "PENDING") return "bg-black/5 text-[#2B2E33] border-black/10";
  return "bg-red-500/10 text-red-700 border-red-500/20";
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserItem[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "PENDING" | "BLOCKED"
  >("ALL");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const data = await apiGet<{ items: UserItem[] }>("/api/admin/users");
      setItems(data.items ?? []);
    } catch (e: any) {
      setErr(e?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((x) =>
        statusFilter === "ALL" ? true : x.status === statusFilter,
      )
      .filter((x) => {
        if (!query) return true;
        return (
          x.email.toLowerCase().includes(query) ||
          (x.ip || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [items, q, statusFilter]);

  async function patchUser(id: string, body: UpdateBody) {
    setBusyId(id);
    try {
      // У нас нет apiPatch, поэтому используем apiPost на локальный route
      // Сделаем минимально: создаём route /api/admin/users/[id] ниже в этом ответе.
      const updated = await apiPost<{ ok: true; user: UserItem }>(
        `/api/admin/users/${id}`,
        body,
      );

      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...updated.user } : x)),
      );
    } catch (e: any) {
      setErr(e?.message || "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-white/55 bg-white/40 p-6 shadow-[0_20px_80px_rgba(43,46,51,0.12)] backdrop-blur-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-extrabold">Пользователи</h1>

          <button
            onClick={load}
            className="h-12 rounded-2xl border border-[#C1C4C8]/70 bg-white/55 px-5 text-base font-extrabold text-[#2B2E33] transition hover:bg-white/75"
          >
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск: email или IP"
            className="h-12 w-full rounded-2xl border border-[#C1C4C8]/60 bg-white/55 px-4 text-lg outline-none transition focus:border-[#2B2E33]/40 focus:bg-white/70"
          />

          <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-4">
            {(["ALL", "ACTIVE", "PENDING", "BLOCKED"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`h-12 rounded-2xl border px-4 text-base font-extrabold transition ${
                  statusFilter === s
                    ? "border-[#2B2E33]/25 bg-[#2B2E33] text-white"
                    : "border-[#C1C4C8]/60 bg-white/55 text-[#2B2E33] hover:bg-white/70"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {err && (
          <div className="mt-5 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-base font-semibold text-red-700">
            {err}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-white/55 bg-white/40 p-6 shadow-[0_20px_80px_rgba(43,46,51,0.12)] backdrop-blur-2xl">
        {loading && (
          <div className="rounded-3xl border border-black/10 bg-white/50 p-6 text-lg font-semibold text-[#7B7F85]">
            Загружаем...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl border border-black/10 bg-white/50 p-6 text-lg font-semibold text-[#7B7F85]">
            Ничего не найдено.
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((u) => {
              const busy = busyId === u.id;

              const canActivate = u.status !== "ACTIVE";
              const canBlock = u.status !== "BLOCKED";

              const canMakeAdmin = u.role !== "ADMIN";
              const canMakeUser = u.role !== "USER";

              return (
                <div
                  key={u.id}
                  className="rounded-3xl border border-black/10 bg-white/55 p-5"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-lg font-extrabold">
                        {u.email}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-2xl border px-4 py-2 text-base font-extrabold ${pill(
                            u.status,
                          )}`}
                        >
                          {u.status}
                        </span>

                        <span className="inline-flex rounded-2xl border border-black/10 bg-white/50 px-4 py-2 text-base font-extrabold">
                          {u.role}
                        </span>

                        <span className="inline-flex rounded-2xl border border-black/10 bg-white/50 px-4 py-2 text-base font-extrabold">
                          IP: {u.ip || "unknown"}
                        </span>

                        <span className="text-base font-semibold text-[#7B7F85]">
                          {fmt(u.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        disabled={!canActivate || busy}
                        onClick={() =>
                          patchUser(u.id, {
                            status: "ACTIVE",
                          })
                        }
                        className="h-11 rounded-2xl bg-[#2B2E33] px-5 text-base font-extrabold text-white shadow-[0_14px_30px_rgba(43,46,51,0.20)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Give access
                      </button>

                      <button
                        disabled={!canBlock || busy}
                        onClick={() =>
                          patchUser(u.id, {
                            status: "BLOCKED",
                          })
                        }
                        className="h-11 rounded-2xl border border-[#C1C4C8]/70 bg-white/55 px-5 text-base font-extrabold text-[#2B2E33] transition hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Remove access
                      </button>

                      <button
                        disabled={!canMakeAdmin || busy}
                        onClick={() => patchUser(u.id, { role: "ADMIN" })}
                        className="h-11 rounded-2xl border border-black/10 bg-white/50 px-5 text-base font-extrabold text-[#2B2E33] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Set admin
                      </button>

                      <button
                        disabled={!canMakeUser || busy}
                        onClick={() => patchUser(u.id, { role: "USER" })}
                        className="h-11 rounded-2xl border border-black/10 bg-white/50 px-5 text-base font-extrabold text-[#2B2E33] transition hover:bg-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Set user
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
