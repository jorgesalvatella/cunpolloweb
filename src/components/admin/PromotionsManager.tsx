"use client";

import { useState, useEffect, useCallback } from "react";
import type { DbPromotion } from "@/types/menu";

const orderTypeLabels: Record<string, string> = {
  pickup: "Para llevar",
  dine_in: "Comer aqui",
  all: "Ambos",
};

function promoPreviewText(p: DbPromotion): string {
  const discount =
    p.discount_type === "percent"
      ? `${p.discount_value}% de descuento`
      : `$${p.discount_value} de descuento`;
  const target = orderTypeLabels[p.target_order_type] || p.target_order_type;
  const minText =
    p.min_order_amount && p.min_order_amount > 0
      ? ` (minimo $${p.min_order_amount})`
      : "";
  return `${discount} en pedidos ${target.toLowerCase()}${minText}`;
}

type FormData = {
  name: string;
  description_es: string;
  description_en: string;
  discount_type: "percent" | "fixed";
  discount_value: string;
  target_order_type: "pickup" | "dine_in" | "all";
  min_order_amount: string;
  active: boolean;
};

const emptyForm: FormData = {
  name: "",
  description_es: "",
  description_en: "",
  discount_type: "percent",
  discount_value: "",
  target_order_type: "all",
  min_order_amount: "",
  active: true,
};

export default function PromotionsManager() {
  const [promotions, setPromotions] = useState<DbPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPromotions = useCallback(async () => {
    const res = await fetch("/api/admin/promotions");
    if (res.ok) {
      const data = await res.json();
      setPromotions(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const resetForm = () => {
    setForm({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setError(null);
  };

  const startEdit = (promo: DbPromotion) => {
    setForm({
      name: promo.name,
      description_es: promo.description_es || "",
      description_en: promo.description_en || "",
      discount_type: promo.discount_type,
      discount_value: String(promo.discount_value),
      target_order_type: promo.target_order_type,
      min_order_amount: promo.min_order_amount ? String(promo.min_order_amount) : "",
      active: promo.active,
    });
    setEditingId(promo.id);
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("El nombre es requerido");
      return;
    }
    const discountValue = parseFloat(form.discount_value);
    if (isNaN(discountValue) || discountValue <= 0) {
      setError("El valor del descuento debe ser mayor a 0");
      return;
    }

    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      description_es: form.description_es.trim() || null,
      description_en: form.description_en.trim() || null,
      discount_type: form.discount_type,
      discount_value: discountValue,
      target_order_type: form.target_order_type,
      min_order_amount: form.min_order_amount ? parseInt(form.min_order_amount, 10) : null,
      active: form.active,
    };

    let res: Response;
    if (editingId) {
      res = await fetch("/api/admin/promotions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...payload }),
      });
    } else {
      res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      resetForm();
      fetchPromotions();
    } else {
      const data = await res.json().catch(() => null);
      setError(data?.error || "Error al guardar la promocion");
    }
    setSubmitting(false);
  };

  const toggleActive = async (promo: DbPromotion) => {
    const res = await fetch("/api/admin/promotions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: promo.id, active: !promo.active }),
    });
    if (res.ok) {
      fetchPromotions();
    }
  };

  const deletePromo = async (id: string) => {
    const res = await fetch(`/api/admin/promotions/${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setDeleteConfirmId(null);
      fetchPromotions();
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-dark/30">Cargando promociones...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-dark/50">
          {promotions.length} promocion{promotions.length !== 1 ? "es" : ""}
        </p>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer"
          >
            Nueva promocion
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h3 className="font-semibold text-dark mb-4">
            {editingId ? "Editar promocion" : "Nueva promocion"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-dark/70 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej: Promo Verano"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Description ES */}
            <div>
              <label className="block text-sm font-medium text-dark/70 mb-1">
                Descripcion (ES, opcional)
              </label>
              <input
                type="text"
                value={form.description_es}
                onChange={(e) => setForm({ ...form, description_es: e.target.value })}
                placeholder="Descripcion en espanol"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Description EN */}
            <div>
              <label className="block text-sm font-medium text-dark/70 mb-1">
                Descripcion (EN, opcional)
              </label>
              <input
                type="text"
                value={form.description_en}
                onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                placeholder="Description in English"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Discount type and value */}
            <div className="flex gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">
                  Tipo de descuento
                </label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discount_type: "percent" })}
                    className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
                      form.discount_type === "percent"
                        ? "bg-red-600 text-white"
                        : "bg-white text-dark/70 hover:bg-gray-50"
                    }`}
                  >
                    % Porcentaje
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, discount_type: "fixed" })}
                    className={`px-4 py-2 text-sm font-medium cursor-pointer transition-colors ${
                      form.discount_type === "fixed"
                        ? "bg-red-600 text-white"
                        : "bg-white text-dark/70 hover:bg-gray-50"
                    }`}
                  >
                    $ Fijo
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark/70 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  value={form.discount_value}
                  onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
                  placeholder={form.discount_type === "percent" ? "%" : "$"}
                  min={0}
                  max={form.discount_type === "percent" ? 100 : undefined}
                  className="w-24 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Target order type */}
            <div>
              <label className="block text-sm font-medium text-dark/70 mb-1">
                Aplica a
              </label>
              <select
                value={form.target_order_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    target_order_type: e.target.value as "pickup" | "dine_in" | "all",
                  })
                }
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">Ambos</option>
                <option value="pickup">Para llevar</option>
                <option value="dine_in">Comer aqui</option>
              </select>
            </div>

            {/* Min order amount */}
            <div>
              <label className="block text-sm font-medium text-dark/70 mb-1">
                Monto minimo (opcional)
              </label>
              <input
                type="number"
                value={form.min_order_amount}
                onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })}
                placeholder="$0"
                min={0}
                className="w-32 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-dark/70">Activa</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, active: !form.active })}
                className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${
                  form.active ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.active ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Preview text */}
            {form.name && form.discount_value && (
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-dark/70">
                <span className="font-medium">Vista previa: </span>
                {promoPreviewText({
                  ...({} as DbPromotion),
                  name: form.name,
                  discount_type: form.discount_type,
                  discount_value: parseFloat(form.discount_value) || 0,
                  target_order_type: form.target_order_type,
                  min_order_amount: form.min_order_amount
                    ? parseInt(form.min_order_amount, 10)
                    : 0,
                })}
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? "Guardando..."
                  : editingId
                  ? "Actualizar"
                  : "Crear promocion"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2 bg-white text-dark/70 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Promotions list */}
      {promotions.length === 0 ? (
        <div className="text-center py-12 text-dark/30">No hay promociones</div>
      ) : (
        <div className="space-y-3">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className={`bg-white rounded-xl shadow-sm border p-4 transition-all ${
                promo.active
                  ? "border-green-200 bg-green-50/30"
                  : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-dark">{promo.name}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        promo.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {promo.active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                  <p className="text-sm text-dark/60 mt-1">
                    {promoPreviewText(promo)}
                  </p>
                  {promo.description_es && (
                    <p className="text-xs text-dark/40 mt-1">{promo.description_es}</p>
                  )}
                  {(promo.starts_at || promo.ends_at) && (
                    <p className="text-xs text-dark/40 mt-1">
                      {promo.starts_at &&
                        `Desde: ${new Date(promo.starts_at).toLocaleDateString("es-MX")}`}
                      {promo.starts_at && promo.ends_at && " | "}
                      {promo.ends_at &&
                        `Hasta: ${new Date(promo.ends_at).toLocaleDateString("es-MX")}`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                  {/* Active toggle */}
                  <button
                    onClick={() => toggleActive(promo)}
                    className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${
                      promo.active ? "bg-green-500" : "bg-gray-300"
                    }`}
                    aria-label={promo.active ? "Desactivar" : "Activar"}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        promo.active ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => startEdit(promo)}
                    className="px-3 py-1.5 text-sm text-dark/70 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Editar
                  </button>

                  {/* Delete */}
                  {deleteConfirmId === promo.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => deletePromo(promo.id)}
                        className="px-3 py-1.5 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1.5 text-sm text-dark/50 hover:text-dark transition-colors cursor-pointer"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(promo.id)}
                      className="px-3 py-1.5 text-sm text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
