"use client";

import Link from "next/link";
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

const statusFilters = ["ALL", "ACTIVE", "PENDING", "BLOCKED"] as const;

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: UserItem["status"]) {
  if (status === "ACTIVE") return "Активен";
  if (status === "BLOCKED") return "Заблокирован";
  return "Ожидает";
}

function roleLabel(role: UserItem["role"]) {
  return role === "ADMIN" ? "Админ" : "Пользователь";
}

function statusBadge(status: UserItem["status"]) {
  if (status === "ACTIVE") return "badge badge-success";
  if (status === "BLOCKED") return "badge badge-danger";
  return "badge badge-warning";
}

function filterLabel(filter: (typeof statusFilters)[number]) {
  if (filter === "ALL") return "Все";
  if (filter === "ACTIVE") return "Активные";
  if (filter === "BLOCKED") return "Блок";
  return "Ожидают";
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function SkeletonRows() {
  return (
    <div className="grid gap-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl bg-[#eef1f5]"
        />
      ))}
    </div>
  );
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
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Не удалось загрузить пользователей"));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(
    () => ({
      all: items.length,
      active: items.filter((x) => x.status === "ACTIVE").length,
      pending: items.filter((x) => x.status === "PENDING").length,
      blocked: items.filter((x) => x.status === "BLOCKED").length,
    }),
    [items],
  );

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
          (x.ip || "").toLowerCase().includes(query) ||
          x.role.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [items, q, statusFilter]);

  async function patchUser(id: string, body: UpdateBody) {
    const isRisky = body.status === "BLOCKED" || body.role === "ADMIN";
    if (isRisky && !window.confirm("Подтвердить изменение пользователя?")) {
      return;
    }

    setBusyId(id);
    setErr(null);
    try {
      const updated = await apiPost<{ ok: true; user: UserItem }>(
        `/api/admin/users/${id}`,
        body,
      );

      setItems((prev) =>
        prev.map((x) => (x.id === id ? { ...x, ...updated.user } : x)),
      );
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Не удалось обновить пользователя"));
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
              User access
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight">
              Пользователи
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68707d]">
              Управляйте статусами, ролями и доступом к системе.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[460px]">
            <Metric label="Всего" value={stats.all} />
            <Metric label="Активные" value={stats.active} />
            <Metric label="Ожидают" value={stats.pending} accent />
            <Metric label="Блок" value={stats.blocked} danger />
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по email, IP или роли"
            className="field"
          />

          <div className="grid grid-cols-2 gap-2 sm:flex">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`btn ${
                  statusFilter === s ? "btn-primary" : "btn-secondary"
                }`}
              >
                {filterLabel(s)}
              </button>
            ))}
          </div>

          <button onClick={load} className="btn btn-secondary">
            Обновить
          </button>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {err}
          </div>
        )}
      </div>

      <div className="panel overflow-hidden">
        {loading && <SkeletonRows />}

        {!loading && filtered.length === 0 && (
          <EmptyState
            title="Пользователи не найдены"
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
                    <th className="px-5 py-3 text-left">Статус</th>
                    <th className="px-5 py-3 text-left">Роль</th>
                    <th className="px-5 py-3 text-left">IP</th>
                    <th className="px-5 py-3 text-left">Создан</th>
                    <th className="px-5 py-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <UserRow
                      key={u.id}
                      user={u}
                      busy={busyId === u.id}
                      onPatch={patchUser}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-3 md:hidden">
              {filtered.map((u) => (
                <UserCard
                  key={u.id}
                  user={u}
                  busy={busyId === u.id}
                  onPatch={patchUser}
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
  danger = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#dde1e7] bg-white p-3">
      <div className="text-xs font-bold uppercase tracking-[0.08em] text-[#68707d]">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-black ${
          danger
            ? "text-[#c93c3c]"
            : accent
              ? "text-[#a16207]"
              : "text-[#17191d]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function UserRow({
  user,
  busy,
  onPatch,
}: {
  user: UserItem;
  busy: boolean;
  onPatch: (id: string, body: UpdateBody) => void;
}) {
  return (
    <tr className="table-row">
      <td className="max-w-[300px] px-5 py-4">
        <Link
          href={`/admin/users/${user.id}`}
          className="truncate text-sm font-black hover:underline"
        >
          {user.email}
        </Link>
      </td>
      <td className="px-5 py-4">
        <span className={statusBadge(user.status)}>
          {statusLabel(user.status)}
        </span>
      </td>
      <td className="px-5 py-4">
        <span className="badge badge-neutral">{roleLabel(user.role)}</span>
      </td>
      <td className="px-5 py-4">
        <span className="badge badge-neutral">{user.ip || "unknown"}</span>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#343941]">
        {fmt(user.createdAt)}
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            disabled={user.status === "ACTIVE" || busy}
            onClick={() => onPatch(user.id, { status: "ACTIVE" })}
            className="btn btn-primary min-h-9"
          >
            Дать доступ
          </button>
          <button
            disabled={user.status === "BLOCKED" || busy}
            onClick={() => onPatch(user.id, { status: "BLOCKED" })}
            className="btn btn-danger min-h-9"
          >
            Заблокировать
          </button>
          <button
            disabled={user.role === "ADMIN" || busy}
            onClick={() => onPatch(user.id, { role: "ADMIN" })}
            className="btn btn-secondary min-h-9"
          >
            Админ
          </button>
          <button
            disabled={user.role === "USER" || busy}
            onClick={() => onPatch(user.id, { role: "USER" })}
            className="btn btn-secondary min-h-9"
          >
            User
          </button>
        </div>
      </td>
    </tr>
  );
}

function UserCard({
  user,
  busy,
  onPatch,
}: {
  user: UserItem;
  busy: boolean;
  onPatch: (id: string, body: UpdateBody) => void;
}) {
  return (
    <div className="rounded-xl border border-[#dde1e7] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/admin/users/${user.id}`}
          className="min-w-0 truncate text-base font-black hover:underline"
        >
          {user.email}
        </Link>
        <span className={statusBadge(user.status)}>
          {statusLabel(user.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-2 text-sm">
        <Info label="Роль" value={roleLabel(user.role)} />
        <Info label="IP" value={user.ip || "unknown"} />
        <Info label="Создан" value={fmt(user.createdAt)} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          disabled={user.status === "ACTIVE" || busy}
          onClick={() => onPatch(user.id, { status: "ACTIVE" })}
          className="btn btn-primary"
        >
          Доступ
        </button>
        <button
          disabled={user.status === "BLOCKED" || busy}
          onClick={() => onPatch(user.id, { status: "BLOCKED" })}
          className="btn btn-danger"
        >
          Блок
        </button>
        <button
          disabled={user.role === "ADMIN" || busy}
          onClick={() => onPatch(user.id, { role: "ADMIN" })}
          className="btn btn-secondary"
        >
          Админ
        </button>
        <button
          disabled={user.role === "USER" || busy}
          onClick={() => onPatch(user.id, { role: "USER" })}
          className="btn btn-secondary"
        >
          User
        </button>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="font-bold text-[#68707d]">{label}</span>
      <span className="truncate font-black">{value}</span>
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
