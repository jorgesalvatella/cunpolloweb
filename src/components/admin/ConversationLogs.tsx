"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Conversation {
  id: string;
  phone: string;
  profile_name: string | null;
  mode: "bot" | "human";
  transfer_reason: string | null;
  transferred_at: string | null;
  last_message_at: string | null;
  wa_messages: { count: number }[];
}

interface Message {
  role: "user" | "assistant" | "advisor" | "system";
  content: string;
  button_payload: string | null;
  created_at: string;
}

const DAY_OPTIONS = [
  { label: "Hoy", value: 1 },
  { label: "7 dias", value: 7 },
  { label: "30 dias", value: 30 },
];

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ConversationLogs() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [transferredOnly, setTransferredOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ days: String(days) });
    if (transferredOnly) params.set("transferred", "true");
    const res = await fetch(`/api/admin/conversations?${params}`);
    if (res.ok) {
      setConversations(await res.json());
    }
    setLoading(false);
  }, [days, transferredOnly]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase().trim();
    return conversations.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        (c.profile_name || "").toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setMessages([]);
      return;
    }
    setExpandedId(id);
    setMessages([]);
    setLoadingMessages(true);
    const res = await fetch(`/api/admin/conversations?id=${id}`);
    if (res.ok) {
      setMessages(await res.json());
    }
    setLoadingMessages(false);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                days === opt.value
                  ? "bg-green-600 text-white"
                  : "bg-white text-dark/70 hover:bg-gray-100 border"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-dark/70 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={transferredOnly}
            onChange={(e) => setTransferredOnly(e.target.checked)}
            className="accent-amber-500"
          />
          Solo con asesor solicitado
        </label>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre o telefono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 pl-9 text-sm w-full"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-dark/30">Cargando...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-dark/30">
          {search ? `Sin resultados para "${search}"` : "No hay conversaciones en este periodo"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => {
            const msgCount = c.wa_messages?.[0]?.count ?? 0;
            const expanded = expandedId === c.id;
            return (
              <div key={c.id} className="bg-white rounded-lg border overflow-hidden">
                <button
                  onClick={() => toggleExpand(c.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm">
                      {c.profile_name || c.phone}
                    </span>
                    <span className="font-mono text-xs text-dark/50">{c.phone}</span>
                    {c.mode === "human" ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                        Con asesor ahora
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600">
                        Bot
                      </span>
                    )}
                    {c.transferred_at && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">
                        Pidio asesor · {formatDateTime(c.transferred_at)}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-dark/40">
                      {msgCount} msgs · {relativeTime(c.last_message_at)}
                    </span>
                  </div>
                  {c.transfer_reason && (
                    <p className="text-xs text-amber-700/80 mt-1 italic">
                      Motivo: {c.transfer_reason}
                    </p>
                  )}
                </button>

                {expanded && (
                  <div className="border-t bg-gray-50 p-4 max-h-[28rem] overflow-y-auto">
                    {loadingMessages ? (
                      <div className="text-center py-4 text-dark/30 text-sm">
                        Cargando mensajes...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-4 text-dark/30 text-sm">
                        Sin mensajes (purgados o vacio)
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {messages.map((m, i) =>
                          m.role === "system" ? (
                            <p
                              key={i}
                              className="text-center text-xs italic text-dark/40 py-1"
                            >
                              {m.content} · {formatDateTime(m.created_at)}
                            </p>
                          ) : (
                            <div
                              key={i}
                              className={`flex ${
                                m.role === "user" ? "justify-end" : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                                  m.role === "user"
                                    ? "bg-green-100 text-green-900"
                                    : m.role === "advisor"
                                    ? "bg-blue-100 text-blue-900"
                                    : "bg-white border text-dark/80"
                                }`}
                              >
                                {m.role === "advisor" && (
                                  <p className="text-[10px] font-bold text-blue-600 mb-0.5">
                                    Asesor
                                  </p>
                                )}
                                <p className="whitespace-pre-wrap break-words">
                                  {m.content}
                                </p>
                                <p className="text-[10px] text-dark/40 mt-1 text-right">
                                  {formatDateTime(m.created_at)}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <p className="text-xs text-dark/40">
            {filtered.length} conversaciones · mensajes se conservan 30 dias
          </p>
        </div>
      )}
    </div>
  );
}
