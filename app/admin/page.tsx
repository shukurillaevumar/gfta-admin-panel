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
  userAgent: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
};

const filters = [
  { value: "all", label: "Все" },
  { value: "pending", label: "Ожидают" },
  { value: "approved", label: "Одобрены" },
  { value: "rejected", label: "Отклонены" },
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: RegistrationRequest["status"]) {
  if (status === "approved") return "Одобрено";
  if (status === "rejected") return "Отклонено";
  return "Ожидает";
}

function statusBadge(status: RegistrationRequest["status"]) {
  if (status === "approved") return "badge badge-success";
  if (status === "rejected") return "badge badge-danger";
  return "badge badge-warning";
}

function mapStatus(s: RequestStatus): RegistrationRequest["status"] {
  if (s === "APPROVED") return "approved";
  if (s === "REJECTED") return "rejected";
  return "pending";
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function SkeletonRows() {
  return (
    <div className="grid gap-3 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl bg-[#eef1f5]"
        />
      ))}
    </div>
  );
}

export default function AdminRequestsPage() {
  const [items, setItems] = useState<RegistrationRequest[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<RegistrationRequest["status"] | "all">(
    "pending",
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setLoadErr(null);
    try {
      const data = await apiGet<{ items: ApiItem[] }>(
        "/api/admin/registration-requests",
      );

      const mapped: RegistrationRequest[] = (data.items ?? []).map((x) => ({
        id: x.id,
        email: x.user?.email ?? "unknown",
        ip: x.ip ?? "unknown",
        userAgent: x.userAgent ?? "unknown",
        createdAt: x.createdAt,
        status: mapStatus(x.status),
      }));

      setItems(mapped);
    } catch (e: unknown) {
      setLoadErr(getErrorMessage(e, "Не удалось загрузить заявки"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const counts = useMemo(
    () => ({
      all: items.length,
      pending: items.filter((x) => x.status === "pending").length,
      approved: items.filter((x) => x.status === "approved").length,
      rejected: items.filter((x) => x.status === "rejected").length,
    }),
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
          x.ip.toLowerCase().includes(query) ||
          x.userAgent.toLowerCase().includes(query)
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
    if (!window.confirm("Отклонить эту заявку?")) return;

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
    <section className="space-y-5">
      <div className="toolbar p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-[#68707d]">
              Access review
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Заявки на доступ
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68707d]">
              Проверяйте новые регистрации, IP и user-agent перед выдачей
              доступа.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[460px]">
            <Metric label="Всего" value={counts.all} />
            <Metric label="Ожидают" value={counts.pending} accent />
            <Metric label="Одобрены" value={counts.approved} />
            <Metric label="Отклонены" value={counts.rejected} />
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по email, IP или user-agent"
            className="field"
          />

          <div className="grid grid-cols-2 gap-2 sm:flex">
            {filters.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`btn ${
                  filter === f.value ? "btn-primary" : "btn-secondary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button onClick={load} className="btn btn-secondary">
            Обновить
          </button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        {loading && <SkeletonRows />}

        {loadErr && (
          <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {loadErr}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            title="Заявки не найдены"
            text="Попробуйте изменить фильтр или поисковый запрос."
          />
        )}

        {!loading && filtered.length > 0 && (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse">
                <thead className="table-head">
                  <tr>
                    <th className="px-5 py-3 text-left">Пользователь</th>
                    <th className="px-5 py-3 text-left">IP</th>
                    <th className="px-5 py-3 text-left">Дата</th>
                    <th className="px-5 py-3 text-left">Статус</th>
                    <th className="px-5 py-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((x) => (
                    <RequestRow
                      key={x.id}
                      item={x}
                      busy={busyId === x.id}
                      onApprove={approve}
                      onReject={reject}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filtered.map((x) => (
                <RequestCard
                  key={x.id}
                  item={x}
                  busy={busyId === x.id}
                  onApprove={approve}
                  onReject={reject}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#dde1e7] bg-white p-3">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#68707d]">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-black ${
          accent ? "text-[#a16207]" : "text-[#17191d]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function RequestRow({
  item,
  busy,
  onApprove,
  onReject,
}: {
  item: RegistrationRequest;
  busy: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const pending = item.status === "pending";

  return (
    <tr className="table-row">
      <td className="max-w-[360px] px-5 py-4">
        <div className="truncate text-sm font-black">{item.email}</div>
        <div className="mt-1 truncate text-xs font-medium text-[#68707d]">
          {item.userAgent}
        </div>
      </td>
      <td className="px-5 py-4">
        <span className="badge badge-neutral">{item.ip}</span>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#343941]">
        {formatDate(item.createdAt)}
      </td>
      <td className="px-5 py-4">
        <span className={statusBadge(item.status)}>
          {statusLabel(item.status)}
        </span>
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <button
            disabled={!pending || busy}
            onClick={() => onApprove(item.id)}
            className="btn btn-primary min-h-9"
          >
            {busy ? "..." : "Одобрить"}
          </button>
          <button
            disabled={!pending || busy}
            onClick={() => onReject(item.id)}
            className="btn btn-danger min-h-9"
          >
            Отклонить
          </button>
        </div>
      </td>
    </tr>
  );
}

function RequestCard({
  item,
  busy,
  onApprove,
  onReject,
}: {
  item: RegistrationRequest;
  busy: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const pending = item.status === "pending";

  return (
    <div className="rounded-xl border border-[#dde1e7] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-black">{item.email}</div>
          <div className="mt-1 text-sm font-semibold text-[#68707d]">
            {formatDate(item.createdAt)}
          </div>
        </div>
        <span className={statusBadge(item.status)}>
          {statusLabel(item.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <div className="flex justify-between gap-3">
          <span className="font-bold text-[#68707d]">IP</span>
          <span className="font-black">{item.ip}</span>
        </div>
        <div className="line-clamp-2 text-[#68707d]">{item.userAgent}</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          disabled={!pending || busy}
          onClick={() => onApprove(item.id)}
          className="btn btn-primary"
        >
          Одобрить
        </button>
        <button
          disabled={!pending || busy}
          onClick={() => onReject(item.id)}
          className="btn btn-danger"
        >
          Отклонить
        </button>
      </div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="grid min-h-56 place-items-center p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#f1f3f6] text-xl font-black">
          0
        </div>
        <h2 className="text-lg font-black">{title}</h2>
        <p className="mt-2 text-sm font-medium text-[#68707d]">{text}</p>
      </div>
    </div>
  );
}
