"use client";

import { useState, useEffect, useMemo } from "react";
import {
  getSelectableTemplates,
  type WhatsAppTemplate,
} from "@/lib/whatsapp-templates";

interface Contact {
  id: string;
  name: string;
  phone: string;
}

const templates = getSelectableTemplates();

export default function SendPromo() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sendAll, setSendAll] = useState(true);
  const [selectedTemplate, setSelectedTemplate] =
    useState<WhatsAppTemplate | null>(templates[0] ?? null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [contactSearch, setContactSearch] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    sent: number;
    failed: number;
  } | null>(null);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    fetch("/api/admin/contacts?active=true")
      .then((res) => res.json())
      .then(setContacts)
      .catch(() => {});
  }, []);

  // Reset variable values when template changes
  useEffect(() => {
    setVariableValues({});
    setConfirmOpen(false);
    setResult(null);
    setError("");
  }, [selectedTemplate?.contentSid]);

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts;
    const q = contactSearch.toLowerCase().trim();
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [contacts, contactSearch]);

  const toggleContact = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const recipientCount = sendAll ? contacts.length : selectedIds.size;

  // Build live preview: replace {{N}} with entered values
  const livePreview = useMemo(() => {
    if (!selectedTemplate) return "";
    let preview = selectedTemplate.bodyPreview;
    for (let i = 1; i <= selectedTemplate.variableCount; i++) {
      const key = String(i);
      const value =
        selectedTemplate.autoNameVariable && i === 1
          ? "Juan"
          : variableValues[key] || `{{${i}}}`;
      preview = preview.replace(new RegExp(`\\{\\{${i}\\}\\}`, "g"), value);
    }
    return preview;
  }, [selectedTemplate, variableValues]);

  // Check if all non-auto variables have values
  const allVariablesFilled = useMemo(() => {
    if (!selectedTemplate) return false;
    for (let i = 1; i <= selectedTemplate.variableCount; i++) {
      if (selectedTemplate.autoNameVariable && i === 1) continue;
      if (!variableValues[String(i)]?.trim()) return false;
    }
    return true;
  }, [selectedTemplate, variableValues]);

  const canSend =
    selectedTemplate && recipientCount > 0 && allVariablesFilled && !sending;

  const handleSend = async () => {
    if (!selectedTemplate) return;
    setConfirmOpen(false);
    setSending(true);
    setError("");
    setResult(null);

    // Build contentVariables for non-auto variables only
    // (variable {{1}} = contact name is injected server-side per contact)
    const variables: Record<string, string> = {};
    for (let i = 1; i <= selectedTemplate.variableCount; i++) {
      if (selectedTemplate.autoNameVariable && i === 1) continue;
      const val = variableValues[String(i)]?.trim();
      if (val) variables[String(i)] = val;
    }

    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateName: selectedTemplate.name,
        contentSid: selectedTemplate.contentSid,
        messagePreview: livePreview,
        contentVariables:
          Object.keys(variables).length > 0 ? variables : undefined,
        contactIds: sendAll ? undefined : Array.from(selectedIds),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult({ sent: data.sent, failed: data.failed });
    } else {
      const data = await res.json().catch(() => ({ error: "Error al enviar" }));
      setError(data.error || "Error al enviar");
    }
    setSending(false);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Template selector */}
      <div>
        <label className="block text-sm font-medium text-dark/70 mb-1">
          Template
        </label>
        <select
          value={selectedTemplate?.contentSid ?? ""}
          onChange={(e) => {
            const t = templates.find((t) => t.contentSid === e.target.value);
            setSelectedTemplate(t ?? null);
          }}
          className="border rounded px-3 py-2 text-sm w-full bg-white cursor-pointer"
        >
          {templates.map((t) => (
            <option key={t.contentSid} value={t.contentSid}>
              {t.label} ({t.name})
            </option>
          ))}
        </select>
      </div>

      {/* Dynamic variable inputs */}
      {selectedTemplate && selectedTemplate.variableCount > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-dark/70">Variables</p>
          {Array.from({ length: selectedTemplate.variableCount }, (_, i) => {
            const varNum = i + 1;
            const isAuto =
              selectedTemplate.autoNameVariable && varNum === 1;
            const label =
              selectedTemplate.variableLabels[i] || `Variable {{${varNum}}}`;

            return (
              <div key={varNum}>
                <label className="block text-xs text-dark/50 mb-0.5">
                  {`{{${varNum}}}`} — {label}
                </label>
                {isAuto ? (
                  <input
                    type="text"
                    value="Nombre del contacto (automatico)"
                    disabled
                    className="border rounded px-3 py-1.5 text-sm w-full bg-gray-50 text-dark/40"
                  />
                ) : (
                  <input
                    type="text"
                    value={variableValues[String(varNum)] ?? ""}
                    onChange={(e) =>
                      setVariableValues((prev) => ({
                        ...prev,
                        [String(varNum)]: e.target.value,
                      }))
                    }
                    placeholder={`Valor para {{${varNum}}}`}
                    className="border rounded px-3 py-1.5 text-sm w-full"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Recipients */}
      <div>
        <label className="flex items-center gap-2 text-sm mb-2">
          <input
            type="checkbox"
            checked={sendAll}
            onChange={(e) => setSendAll(e.target.checked)}
            className="cursor-pointer"
          />
          <span>
            Enviar a todos los contactos activos ({contacts.length})
          </span>
        </label>

        {!sendAll && (
          <div className="border rounded-lg overflow-hidden">
            {/* Selected chips */}
            {selectedIds.size > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border-b">
                {contacts
                  .filter((c) => selectedIds.has(c.id))
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleContact(c.id)}
                      className="flex items-center gap-1 bg-green-100 text-green-800 pl-1 pr-2 py-0.5 rounded-full text-xs font-medium hover:bg-green-200 transition-colors cursor-pointer"
                    >
                      <span className="w-5 h-5 rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-bold">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                      {c.name}
                      <svg className="w-3 h-3 ml-0.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ))}
                <span className="text-xs text-dark/40 self-center ml-1">
                  {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
                </span>
              </div>
            )}

            {/* Search input */}
            <div className="relative border-b">
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
                placeholder="Buscar contacto..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full px-3 py-2 pl-9 text-sm outline-none"
              />
              {contactSearch && (
                <button
                  type="button"
                  onClick={() => setContactSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Contact list */}
            <div className="max-h-56 overflow-y-auto divide-y">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-4 text-dark/30 text-sm">
                  Sin resultados para &quot;{contactSearch}&quot;
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = selectedIds.has(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleContact(c.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors cursor-pointer ${
                        isSelected ? "bg-green-50/50" : ""
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                          isSelected
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-dark/50"
                        }`}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        {isSelected && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.name}</p>
                        <p className="text-xs text-dark/40 font-mono">{c.phone}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live preview */}
      {selectedTemplate && livePreview && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-xs text-green-700 font-medium mb-1">
            Vista previa
          </p>
          <p className="text-sm whitespace-pre-wrap">{livePreview}</p>
        </div>
      )}

      {/* Send button */}
      {!confirmOpen ? (
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={!canSend}
          className="bg-green-600 text-white px-6 py-2 rounded font-medium hover:bg-green-700 disabled:opacity-50 cursor-pointer"
        >
          Enviar a {recipientCount} contacto
          {recipientCount !== 1 ? "s" : ""}
        </button>
      ) : (
        <div className="bg-yellow-50 border border-yellow-300 rounded p-3 space-y-2">
          <p className="text-sm font-medium text-yellow-800">
            Enviar &quot;{selectedTemplate?.label}&quot; a {recipientCount}{" "}
            contacto{recipientCount !== 1 ? "s" : ""}?
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

      {/* Progress */}
      {sending && (
        <div className="flex items-center gap-2 text-sm text-dark/50">
          <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          Enviando mensajes...
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
          Enviados: {result.sent} | Fallidos: {result.failed}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
