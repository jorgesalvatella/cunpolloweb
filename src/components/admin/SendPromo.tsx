"use client";

import { useState, useEffect } from "react";

interface Contact {
  id: string;
  name: string;
  phone: string;
}

export default function SendPromo() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendAll, setSendAll] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [contentSid, setContentSid] = useState("");
  const [messagePreview, setMessagePreview] = useState("");
  const [contentVariables, setContentVariables] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/contacts?active=true")
      .then((res) => res.json())
      .then(setContacts)
      .catch(() => {});
  }, []);

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const recipientCount = sendAll ? contacts.length : selectedIds.size;

  const handleSend = async () => {
    setConfirmOpen(false);
    setSending(true);
    setError("");
    setResult(null);

    let variables: Record<string, string> | undefined;
    if (contentVariables.trim()) {
      try {
        variables = JSON.parse(contentVariables);
      } catch {
        setError("Variables JSON invalido");
        setSending(false);
        return;
      }
    }

    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateName,
        contentSid,
        messagePreview,
        contentVariables: variables,
        contactIds: sendAll ? undefined : Array.from(selectedIds),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult({ sent: data.sent, failed: data.failed });
    } else {
      const data = await res.json();
      setError(data.error || "Error al enviar");
    }
    setSending(false);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Template info */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-dark/70 mb-1">Nombre del Template</label>
          <input
            type="text"
            placeholder="ej: lanzamiento_delivery"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark/70 mb-1">Content SID (Twilio)</label>
          <input
            type="text"
            placeholder="ej: HXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            value={contentSid}
            onChange={(e) => setContentSid(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full font-mono"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark/70 mb-1">Vista previa del mensaje</label>
          <textarea
            placeholder="Texto de referencia del template..."
            value={messagePreview}
            onChange={(e) => setMessagePreview(e.target.value)}
            rows={3}
            className="border rounded px-3 py-2 text-sm w-full resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark/70 mb-1">
            Variables (JSON, opcional)
          </label>
          <input
            type="text"
            placeholder='ej: {"1": "CUNPOLLO"}'
            value={contentVariables}
            onChange={(e) => setContentVariables(e.target.value)}
            className="border rounded px-3 py-2 text-sm w-full font-mono"
          />
        </div>
      </div>

      {/* Recipients */}
      <div>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input
            type="checkbox"
            checked={sendAll}
            onChange={(e) => setSendAll(e.target.checked)}
            className="cursor-pointer"
          />
          <span>Enviar a todos los contactos activos ({contacts.length})</span>
        </label>

        {!sendAll && (
          <div className="border rounded p-3 max-h-48 overflow-y-auto space-y-1">
            {contacts.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleContact(c.id)}
                />
                <span>{c.name}</span>
                <span className="text-dark/40 font-mono text-xs">{c.phone}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Preview box */}
      {messagePreview && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-xs text-green-700 font-medium mb-1">Vista previa</p>
          <p className="text-sm whitespace-pre-wrap">{messagePreview}</p>
        </div>
      )}

      {/* Send button */}
      {!confirmOpen ? (
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!templateName || !contentSid || !messagePreview || recipientCount === 0 || sending}
          className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 cursor-pointer"
        >
          Enviar a {recipientCount} contacto{recipientCount !== 1 ? "s" : ""}
        </button>
      ) : (
        <div className="bg-yellow-50 border border-yellow-300 rounded p-3 space-y-2">
          <p className="text-sm font-medium text-yellow-800">
            Enviar &quot;{templateName}&quot; a {recipientCount} contacto{recipientCount !== 1 ? "s" : ""}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="bg-green-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 cursor-pointer"
            >
              {sending ? "Enviando..." : "Confirmar envio"}
            </button>
            <button
              onClick={() => setConfirmOpen(false)}
              className="bg-gray-200 text-dark px-4 py-1.5 rounded text-sm hover:bg-gray-300 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Progress / result */}
      {sending && (
        <div className="flex items-center gap-2 text-sm text-dark/50">
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          Enviando mensajes...
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
          Enviados: {result.sent} | Fallidos: {result.failed}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
