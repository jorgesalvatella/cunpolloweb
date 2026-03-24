"use client";

import { useState, useEffect, useCallback } from "react";

type AdminPhone = {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  created_at: string;
};

export default function AdminPhonesManager() {
  const [phones, setPhones] = useState<AdminPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Delete confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchPhones = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/phones");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setPhones(data);
    } catch {
      setError("Error al cargar telefonos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhones();
  }, [fetchPhones]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/phones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al agregar");
      }

      setName("");
      setPhone("");
      await fetchPhones();
      showSuccess("Telefono agregado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al agregar");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (item: AdminPhone) => {
    try {
      const res = await fetch("/api/admin/phones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, active: !item.active }),
      });

      if (!res.ok) throw new Error("Error al actualizar");
      await fetchPhones();
    } catch {
      setError("Error al cambiar estado");
    }
  };

  const handleStartEdit = (item: AdminPhone) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPhone(item.phone);
    setConfirmDeleteId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim() || !editPhone.trim()) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/phones", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: editName.trim(),
          phone: editPhone.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al actualizar");
      }

      setEditingId(null);
      await fetchPhones();
      showSuccess("Telefono actualizado");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }

    try {
      const res = await fetch(`/api/admin/phones?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Error al eliminar");

      setConfirmDeleteId(null);
      await fetchPhones();
      showSuccess("Telefono eliminado");
    } catch {
      setError("Error al eliminar");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Cargando telefonos...
      </div>
    );
  }

  const activeCount = phones.filter((p) => p.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">
          Telefonos de notificacion
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Estos numeros reciben WhatsApp cuando entra un pedido nuevo.
          {activeCount > 0 && (
            <span className="ml-1 font-medium text-green-700">
              {activeCount} activo{activeCount !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
          <button
            onClick={() => setError("")}
            className="ml-2 font-bold cursor-pointer"
          >
            x
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Add form */}
      <form
        onSubmit={handleAdd}
        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
      >
        <p className="text-sm font-semibold text-gray-700 mb-3">
          Agregar telefono
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Nombre (ej: Beto)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <input
            type="tel"
            placeholder="Telefono (ej: 9981488987)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="submit"
            disabled={saving || !name.trim() || !phone.trim()}
            className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors whitespace-nowrap"
          >
            {saving ? "Guardando..." : "Agregar"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Formato: 10 digitos (se agrega +521 automaticamente) o numero completo
          con codigo de pais
        </p>
      </form>

      {/* Phone list */}
      {phones.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-sm">
          No hay telefonos registrados. Agrega uno arriba.
        </div>
      ) : (
        <div className="space-y-3">
          {phones.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 transition-colors ${
                item.active
                  ? "bg-white border-gray-200"
                  : "bg-gray-50 border-gray-200 opacity-60"
              }`}
            >
              {editingId === item.id ? (
                /* Edit mode */
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">
                      Telefono
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 cursor-pointer transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {item.name}
                      </span>
                      {item.active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 font-mono">
                      {item.phone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Toggle active */}
                    <button
                      onClick={() => handleToggleActive(item)}
                      title={item.active ? "Desactivar" : "Activar"}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                        item.active ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          item.active ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                      title="Editar"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        confirmDeleteId === item.id
                          ? "bg-red-600 text-white"
                          : "text-gray-400 hover:text-red-600 hover:bg-red-50"
                      }`}
                      title={
                        confirmDeleteId === item.id
                          ? "Confirmar eliminar"
                          : "Eliminar"
                      }
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {confirmDeleteId === item.id && editingId !== item.id && (
                <p className="text-xs text-red-600 mt-2">
                  Haz clic de nuevo en el boton rojo para confirmar la
                  eliminacion.
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="ml-2 text-gray-500 underline cursor-pointer"
                  >
                    Cancelar
                  </button>
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
