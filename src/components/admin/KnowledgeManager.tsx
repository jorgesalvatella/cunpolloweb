"use client";

import { useEffect, useState, useCallback } from "react";

type KnowledgeEntry = {
  id: string;
  title: string;
  content: string;
  category: string;
  active: boolean;
  created_at: string;
  updated_at: string;
};

const CATEGORIES = [
  "general",
  "fiestas",
  "eventos",
  "mundial",
  "temporada",
  "servicios",
];

export default function KnowledgeManager() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    content: "",
    category: "general",
  });
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/knowledge");
      if (res.ok) {
        setEntries(await res.json());
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function resetForm() {
    setForm({ title: "", content: "", category: "general" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(entry: KnowledgeEntry) {
    setForm({
      title: entry.title,
      content: entry.content,
      category: entry.category,
    });
    setEditingId(entry.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);

    try {
      if (editingId) {
        await fetch("/api/admin/knowledge", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form }),
        });
      } else {
        await fetch("/api/admin/knowledge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
      }
      resetForm();
      fetchEntries();
    } catch {}
    setSaving(false);
  }

  async function handleToggle(entry: KnowledgeEntry) {
    await fetch("/api/admin/knowledge", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, active: !entry.active }),
    });
    fetchEntries();
  }

  async function handleDelete(id: string) {
    if (deleteConfirm !== id) {
      setDeleteConfirm(id);
      return;
    }
    await fetch(`/api/admin/knowledge?id=${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    fetchEntries();
  }

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Base de Conocimiento del Bot
          </h2>
          <p className="text-sm text-gray-500">
            Agrega info que el chatbot pueda consultar: eventos, fiestas, mundial, paquetes, etc.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          + Agregar
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 border rounded-xl p-4 mb-4">
          <div className="grid gap-3">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Titulo (ej: Paquetes de Fiestas Infantiles)"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              />
              <select
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              placeholder="Contenido completo que el bot puede usar para responder preguntas. Incluye precios, horarios, condiciones, etc."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              rows={6}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-400 resize-y"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={resetForm}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                  ? "Actualizar"
                  : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Entries list */}
      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">Sin entradas</p>
          <p className="text-sm">
            Agrega info sobre fiestas, eventos, mundial, etc. y el bot la usara para responder.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`border rounded-xl p-4 ${
                entry.active ? "bg-white" : "bg-gray-50 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {entry.title}
                    </h3>
                    <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">
                      {entry.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap line-clamp-3">
                    {entry.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(entry.updated_at).toLocaleDateString("es-MX", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(entry)}
                    className={`w-10 h-5 rounded-full transition-colors relative ${
                      entry.active ? "bg-green-500" : "bg-gray-300"
                    }`}
                    title={entry.active ? "Desactivar" : "Activar"}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        entry.active ? "left-5" : "left-0.5"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => startEdit(entry)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    title="Editar"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className={`text-sm transition-colors ${
                      deleteConfirm === entry.id
                        ? "text-red-600 font-bold"
                        : "text-gray-400 hover:text-red-600"
                    }`}
                    title={
                      deleteConfirm === entry.id
                        ? "Click de nuevo para confirmar"
                        : "Eliminar"
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
