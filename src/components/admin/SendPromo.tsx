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
          <div className="border rounded p-3 max-h-48 overflow-y-auto space-y-1">
            {contacts.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(c.id)}
                  onChange={() => toggleContact(c.id)}
                />
                <span>{c.name}</span>
                <span className="text-dark/40 font-mono text-xs">
                  {c.phone}
                </span>
              </label>
            ))}
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
