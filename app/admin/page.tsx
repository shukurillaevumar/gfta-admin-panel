"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

type ApiItem = {
  id: string;
  ip: string | null;
  userAgent: string | null;
  status: RequestStatus;
  createdAt: string;
  user: {
    id: string;
    email: string;
    role: "USER" | "ADMIN";
    status: string;
    createdAt: string;
  };
};

type RegistrationRequest = {
  id: string;
  email: string;
  ip: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString();
}

function statusBadge(status: RegistrationRequest["status"]) {
  if (status === "pending") return "bg-black/5 text-[#2B2E33] border-black/10";
  if (status === "approved")
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  return "bg-red-500/10 text-red-700 border-red-500/20";
}

function mapStatus(s: RequestStatus): RegistrationRequest["status"] {
  if (s === "APPROVED") return "approved";
  if (s === "REJECTED") return "rejected";
  return "pending";
}

export default function AdminRequestsPage() {
  const [items, setItems] = useState<RegistrationRequest[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<RegistrationRequest["status"] | "all">(
    "all",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadErr(null);
    try {
      // мы тянем до 200 итемов с бэка. фильтровать будем и на фронте тоже.
      const data = await apiGet<{ items: ApiItem[] }>(
        "/api/admin/registration-requests?status=PENDING",
      );

      const mapped: RegistrationRequest[] = (data.items ?? []).map((x) => ({
        id: x.id,
        email: x.user?.email ?? "unknown",
        ip: x.ip ?? "unknown",
        createdAt: x.createdAt,
        status: mapStatus(x.status),
      }));

      setItems(mapped);
    } catch (e: any) {
      setLoadErr(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const pendingCount = useMemo(
    () => items.filter((x) => x.status === "pending").length,
    [items],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((x) => (filter === "all" ? true : x.status === filter))
      .filter((x) => {
        if (!query) return true;
        return (
          x.email.toLowerCase().includes(query) ||
          x.ip.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [items, q, filter]);

  async function approve(id: string) {
    setBusyId(id);
    try {
      await apiPost(`/api/admin/registration-requests/${id}/approve`);
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: "approved" } : x)),
      );
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    try {
      await apiPost(`/api/admin/registration-requests/${id}/reject`);
      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, status: "rejected" } : x)),
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[28px] border border-white/55 bg-white/40 p-6 shadow-[0_20px_80px_rgba(43,46,51,0.12)] backdrop-blur-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Заявки на доступ</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-black/10 bg-white/50 px-5 py-3 text-base font-semibold">
              Pending:{" "}
              <span className="ml-2 rounded-xl bg-black/5 px-3 py-1 font-extrabold">
                {pendingCount}
              </span>
            </div>

            <button
              onClick={load}
              className="h-12 rounded-2xl border border-[#C1C4C8]/70 bg-white/55 px-5 text-base font-extrabold text-[#2B2E33] transition hover:bg-white/75"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск: email, IP"
            className="h-12 w-full rounded-2xl border border-[#C1C4C8]/60 bg-white/55 px-4 text-lg outline-none transition focus:border-[#2B2E33]/40 focus:bg-white/70"
          />

          <div className="grid grid-cols-2 gap-3 md:col-span-2 md:grid-cols-3">
            <button
              onClick={() => setFilter("all")}
              className={`h-12 rounded-2xl border px-4 text-base font-extrabold transition ${
                filter === "all"
                  ? "border-[#2B2E33]/25 bg-[#2B2E33] text-white"
                  : "border-[#C1C4C8]/60 bg-white/55 text-[#2B2E33] hover:bg-white/70"
              }`}
            >
              Все
            </button>
            <button
              onClick={() => setFilter("pending")}
              className={`h-12 rounded-2xl border px-4 text-base font-extrabold transition ${
                filter === "pending"
                  ? "border-[#2B2E33]/25 bg-[#2B2E33] text-white"
                  : "border-[#C1C4C8]/60 bg-white/55 text-[#2B2E33] hover:bg-white/70"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter("approved")}
              className={`h-12 rounded-2xl border px-4 text-base font-extrabold transition ${
                filter === "approved"
                  ? "border-[#2B2E33]/25 bg-[#2B2E33] text-white"
                  : "border-[#C1C4C8]/60 bg-white/55 text-[#2B2E33] hover:bg-white/70"
              }`}
            >
              Approved
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/55 bg-white/40 shadow-[0_20px_80px_rgba(43,46,51,0.12)] backdrop-blur-2xl">
        <div className="overflow-hidden">
          <div className="p-4">
            {loading && (
              <div className="rounded-3xl border border-black/10 bg-white/50 p-6 text-lg font-semibold text-[#7B7F85]">
                Загружаем...
              </div>
            )}

            {loadErr && (
              <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-6 text-lg font-semibold text-red-700">
                {loadErr}
              </div>
            )}
          </div>

          <div className="hidden md:block">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="text-left">
                  <th className="px-6 py-5 text-base font-extrabold text-[#2B2E33]">
                    Пользователь
                  </th>
                  <th className="px-6 py-5 text-base font-extrabold text-[#2B2E33]">
                    IP
                  </th>
                  <th className="px-6 py-5 text-base font-extrabold text-[#2B2E33]">
                    Дата
                  </th>
                  <th className="px-6 py-5 text-base font-extrabold text-[#2B2E33]">
                    Статус
                  </th>
                  <th className="px-6 py-5 text-base font-extrabold text-[#2B2E33]">
                    Действия
                  </th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((x) => {
                  const isBusy = busyId === x.id;
                  const isPending = x.status === "pending";

                  return (
                    <tr key={x.id} className="border-t border-black/5">
                      <td className="px-6 py-5 align-middle">
                        <div className="text-lg font-extrabold">{x.email}</div>
                      </td>

                      <td className="px-6 py-5 align-middle">
                        <div className="inline-flex items-center rounded-2xl border border-black/10 bg-white/45 px-4 py-2 text-base font-extrabold">
                          {x.ip}
                        </div>
                      </td>

                      <td className="px-6 py-5 align-middle">
                        <div className="text-base font-semibold text-[#2B2E33]">
                          {formatDate(x.createdAt)}
                        </div>
                      </td>

                      <td className="px-6 py-5 align-middle">
                        <span
                          className={`inline-flex rounded-2xl border px-4 py-2 text-base font-extrabold ${statusBadge(
                            x.status,
                          )}`}
                        >
                          {x.status}
                        </span>
                      </td>

                      <td className="px-6 py-5 align-middle">
                        <div className="flex flex-wrap gap-3">
                          <button
                            disabled={!isPending || isBusy}
                            onClick={() => approve(x.id)}
                            className="h-11 rounded-2xl bg-[#2B2E33] px-5 text-base font-extrabold text-white shadow-[0_14px_30px_rgba(43,46,51,0.20)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Approve
                          </button>
                          <button
                            disabled={!isPending || isBusy}
                            onClick={() => reject(x.id)}
                            className="h-11 rounded-2xl border border-[#C1C4C8]/70 bg-white/55 px-5 text-base font-extrabold text-[#2B2E33] transition hover:bg-white/75 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10">
                      <div className="rounded-3xl border border-black/10 bg-white/50 p-6 text-lg font-semibold text-[#7B7F85]">
                        Ничего не найдено.
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden">
            <div className="p-4">
              <div className="grid gap-4">
                {filtered.map((x) => {
                  const isBusy = busyId === x.id;
                  const isPending = x.status === "pending";

                  return (
                    <div
                      key={x.id}
                      className="rounded-[22px] border border-white/55 bg-white/45 p-5 shadow-[0_16px_50px_rgba(43,46,51,0.10)] backdrop-blur-xl"
                    >
                      <div className="text-xl font-extrabold">{x.email}</div>

                      <div className="mt-4 grid gap-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-base font-extrabold text-[#2B2E33]">
                            IP
                          </span>
                          <span className="rounded-2xl border border-black/10 bg-white/55 px-4 py-2 text-base font-extrabold">
                            {x.ip}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-base font-extrabold text-[#2B2E33]">
                            Дата
                          </span>
                          <span className="text-base font-semibold text-[#7B7F85]">
                            {formatDate(x.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <span className="text-base font-extrabold text-[#2B2E33]">
                            Статус
                          </span>
                          <span
                            className={`rounded-2xl border px-4 py-2 text-base font-extrabold ${statusBadge(
                              x.status,
                            )}`}
                          >
                            {x.status}
                          </span>
                        </div>

                        <div className="mt-2 flex gap-3">
                          <button
                            disabled={!isPending || isBusy}
                            onClick={() => approve(x.id)}
                            className="h-12 w-full rounded-2xl bg-[#2B2E33] text-lg font-extrabold text-white shadow-[0_14px_30px_rgba(43,46,51,0.20)] transition hover:brightness-110 disabled:opacity-40"
                          >
                            Approve
                          </button>
                          <button
                            disabled={!isPending || isBusy}
                            onClick={() => reject(x.id)}
                            className="h-12 w-full rounded-2xl border border-[#C1C4C8]/70 bg-white/55 text-lg font-extrabold text-[#2B2E33] transition hover:bg-white/75 disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!loading && filtered.length === 0 && (
                  <div className="rounded-[22px] border border-black/10 bg-white/50 p-6 text-lg font-semibold text-[#7B7F85]">
                    Ничего не найдено.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
