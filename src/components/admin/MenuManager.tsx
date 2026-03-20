"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase/client";
import type { DbMenuItem, DbCategory } from "@/types/menu";

type DiscountMode = "none" | "percent" | "fixed";

function getDiscountMode(item: DbMenuItem): DiscountMode {
  if (item.discount_percent && item.discount_percent > 0) return "percent";
  if (item.discount_fixed && item.discount_fixed > 0) return "fixed";
  return "none";
}

function getDiscountValue(item: DbMenuItem): number {
  if (item.discount_percent && item.discount_percent > 0) return item.discount_percent;
  if (item.discount_fixed && item.discount_fixed > 0) return item.discount_fixed;
  return 0;
}

function effectivePrice(item: DbMenuItem): number {
  if (item.discount_percent && item.discount_percent > 0) {
    return Math.round(item.price * (1 - item.discount_percent / 100));
  }
  if (item.discount_fixed && item.discount_fixed > 0) {
    return Math.max(0, item.price - item.discount_fixed);
  }
  return item.price;
}

export default function MenuManager() {
  const [items, setItems] = useState<DbMenuItem[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [savedId, setSavedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const savedTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchMenu = useCallback(async () => {
    const res = await fetch("/api/admin/menu");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setCategories(data.categories);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Realtime subscription on menu_items
  useEffect(() => {
    const sb = getSupabase();
    const channel = sb
      .channel("menu-items-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        () => {
          fetchMenu();
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [fetchMenu]);

  const updateItem = async (id: string, fields: Partial<DbMenuItem>) => {
    setSavingId(id);
    const res = await fetch("/api/admin/menu", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });

    if (res.ok) {
      const updated = await res.json();
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
      setSavedId(id);
      if (savedTimeout.current) clearTimeout(savedTimeout.current);
      savedTimeout.current = setTimeout(() => setSavedId(null), 1500);
    }
    setSavingId(null);
  };

  const createItem = async (newItem: Record<string, unknown>) => {
    const res = await fetch("/api/admin/menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newItem),
    });
    if (res.ok) {
      const created = await res.json();
      setItems((prev) => [...prev, created]);
      setShowAddForm(false);
      return null;
    }
    const err = await res.json();
    return err.error || "Error al crear";
  };

  const deleteItem = async (id: string) => {
    const res = await fetch(`/api/admin/menu?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      setDeletingId(null);
    }
  };

  const categoryName = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name_es : catId;
  };

  // Filter items
  const filtered = items.filter((item) => {
    if (activeCategory && item.category_id !== activeCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.name_es.toLowerCase().includes(q) ||
        item.name_en.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) {
    return <div className="text-center py-12 text-dark/30">Cargando menu...</div>;
  }

  return (
    <div>
      {/* Search bar + Add button */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Buscar item por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 sm:max-w-80 px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 cursor-pointer whitespace-nowrap"
        >
          {showAddForm ? "Cancelar" : "+ Agregar producto"}
        </button>
      </div>

      {/* Add product form */}
      {showAddForm && (
        <AddProductForm categories={categories} onSubmit={createItem} />
      )}

      {/* Category filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
            activeCategory === null
              ? "bg-red-600 text-white"
              : "bg-white text-dark/70 hover:bg-gray-100"
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
              activeCategory === cat.id
                ? "bg-red-600 text-white"
                : "bg-white text-dark/70 hover:bg-gray-100"
            }`}
          >
            {cat.name_es}
          </button>
        ))}
      </div>

      {/* Items count */}
      <p className="text-sm text-dark/50 mb-4">
        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-dark/30">
          No se encontraron items
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <MenuItemRow
              key={item.id}
              item={item}
              categoryName={categoryName(item.category_id)}
              onUpdate={updateItem}
              onDelete={deleteItem}
              isDeleting={deletingId === item.id}
              onConfirmDelete={() => setDeletingId(item.id)}
              onCancelDelete={() => setDeletingId(null)}
              isSaving={savingId === item.id}
              isSaved={savedId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItemRow({
  item,
  categoryName,
  onUpdate,
  onDelete,
  isDeleting,
  onConfirmDelete,
  onCancelDelete,
  isSaving,
  isSaved,
}: {
  item: DbMenuItem;
  categoryName: string;
  onUpdate: (id: string, fields: Partial<DbMenuItem>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDeleting: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  isSaving: boolean;
  isSaved: boolean;
}) {
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValue, setPriceValue] = useState(String(item.price));
  const [discountMode, setDiscountMode] = useState<DiscountMode>(getDiscountMode(item));
  const [discountVal, setDiscountVal] = useState(String(getDiscountValue(item)));
  const priceInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when item changes externally
  useEffect(() => {
    setPriceValue(String(item.price));
    setDiscountMode(getDiscountMode(item));
    setDiscountVal(String(getDiscountValue(item)));
  }, [item]);

  useEffect(() => {
    if (editingPrice && priceInputRef.current) {
      priceInputRef.current.focus();
      priceInputRef.current.select();
    }
  }, [editingPrice]);

  const commitPrice = () => {
    setEditingPrice(false);
    const newPrice = parseInt(priceValue, 10);
    if (!isNaN(newPrice) && newPrice >= 0 && newPrice !== item.price) {
      onUpdate(item.id, { price: newPrice });
    } else {
      setPriceValue(String(item.price));
    }
  };

  const handleDiscountModeChange = (mode: DiscountMode) => {
    setDiscountMode(mode);
    setDiscountVal("0");
    if (mode === "none") {
      onUpdate(item.id, { discount_percent: null, discount_fixed: null });
    }
  };

  const commitDiscount = () => {
    const val = parseInt(discountVal, 10);
    if (isNaN(val) || val < 0) {
      setDiscountVal(String(getDiscountValue(item)));
      return;
    }
    if (discountMode === "percent") {
      const clamped = Math.min(val, 100);
      onUpdate(item.id, { discount_percent: clamped || null, discount_fixed: null });
    } else if (discountMode === "fixed") {
      onUpdate(item.id, { discount_fixed: val || null, discount_percent: null });
    }
  };

  const ep = effectivePrice(item);
  const hasDiscount = ep < item.price;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 transition-all ${
        !item.available ? "opacity-50" : ""
      } ${isSaved ? "ring-2 ring-green-400" : ""}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Name and category */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-dark truncate">{item.name_es}</h3>
            {item.is_promo && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                Promo
              </span>
            )}
            {isSaving && (
              <span className="text-xs text-dark/40">Guardando...</span>
            )}
            {isSaved && (
              <span className="text-xs text-green-600 font-medium">Guardado</span>
            )}
          </div>
          <p className="text-xs text-dark/50">{categoryName}</p>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark/50">Precio:</span>
          {editingPrice ? (
            <input
              ref={priceInputRef}
              type="number"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitPrice();
                if (e.key === "Escape") {
                  setPriceValue(String(item.price));
                  setEditingPrice(false);
                }
              }}
              className="w-20 px-2 py-1 rounded border border-gray-300 text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500"
              min={0}
            />
          ) : (
            <button
              onClick={() => setEditingPrice(true)}
              className="cursor-pointer text-sm font-medium hover:text-red-600 transition-colors"
              title="Clic para editar precio"
            >
              {hasDiscount ? (
                <>
                  <span className="line-through text-dark/40">${item.price}</span>{" "}
                  <span className="text-red-600">${ep}</span>
                </>
              ) : (
                <span>${item.price}</span>
              )}
            </button>
          )}
          <span className="text-xs text-dark/40">MXN</span>
        </div>

        {/* Discount */}
        <div className="flex items-center gap-2">
          <select
            value={discountMode}
            onChange={(e) => handleDiscountModeChange(e.target.value as DiscountMode)}
            className="text-xs px-2 py-1 rounded border border-gray-200 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="none">Sin descuento</option>
            <option value="percent">% descuento</option>
            <option value="fixed">$ descuento</option>
          </select>
          {discountMode !== "none" && (
            <input
              type="number"
              value={discountVal}
              onChange={(e) => setDiscountVal(e.target.value)}
              onBlur={commitDiscount}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDiscount();
              }}
              className="w-16 px-2 py-1 rounded border border-gray-300 text-sm text-right focus:outline-none focus:ring-2 focus:ring-red-500"
              min={0}
              max={discountMode === "percent" ? 100 : undefined}
              placeholder={discountMode === "percent" ? "%" : "$"}
            />
          )}
        </div>

        {/* Available toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-dark/50">
            {item.available ? "Disponible" : "No disponible"}
          </span>
          <button
            onClick={() => onUpdate(item.id, { available: !item.available })}
            className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors ${
              item.available ? "bg-green-500" : "bg-gray-300"
            }`}
            aria-label={item.available ? "Desactivar disponibilidad" : "Activar disponibilidad"}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                item.available ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Delete */}
        <div className="flex items-center gap-1">
          {isDeleting ? (
            <>
              <button
                onClick={() => onDelete(item.id)}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded cursor-pointer hover:bg-red-700"
              >
                Confirmar
              </button>
              <button
                onClick={onCancelDelete}
                className="px-2 py-1 text-xs bg-gray-200 text-dark rounded cursor-pointer hover:bg-gray-300"
              >
                No
              </button>
            </>
          ) : (
            <button
              onClick={onConfirmDelete}
              className="px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer"
              title="Eliminar producto"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AddProductForm({
  categories,
  onSubmit,
}: {
  categories: DbCategory[];
  onSubmit: (item: Record<string, unknown>) => Promise<string | null>;
}) {
  const [id, setId] = useState("");
  const [nameEs, setNameEs] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descEs, setDescEs] = useState("");
  const [descEn, setDescEn] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id || "");
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Auto-generate ID from name
  const autoId = nameEs
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!nameEs || !price || !categoryId) {
      setError("Nombre, precio y categoria son requeridos");
      return;
    }
    setSubmitting(true);
    const err = await onSubmit({
      id: id || autoId,
      name_es: nameEs,
      name_en: nameEn || nameEs,
      description_es: descEs,
      description_en: descEn,
      price: parseInt(price, 10),
      category_id: categoryId,
      image: image || "/logo.png",
    });
    if (err) setError(err);
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 space-y-3">
      <h3 className="font-bold text-dark">Nuevo producto</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-dark/60 mb-1">Nombre (ES) *</label>
          <input
            type="text"
            value={nameEs}
            onChange={(e) => setNameEs(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-dark/60 mb-1">Nombre (EN)</label>
          <input
            type="text"
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder={nameEs}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-xs text-dark/60 mb-1">Descripcion (ES)</label>
          <input
            type="text"
            value={descEs}
            onChange={(e) => setDescEs(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-xs text-dark/60 mb-1">Descripcion (EN)</label>
          <input
            type="text"
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-xs text-dark/60 mb-1">Precio (MXN) *</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min={0}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-dark/60 mb-1">Categoria *</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white cursor-pointer"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_es}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-dark/60 mb-1">ID (slug, auto-generado)</label>
          <input
            type="text"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder={autoId}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
        <div>
          <label className="block text-xs text-dark/60 mb-1">Imagen del producto</label>
          <div className="flex items-center gap-2">
            <label className={`px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              uploading ? "bg-gray-200 text-dark/50" : "bg-white border border-gray-200 hover:bg-gray-50 text-dark/70"
            }`}>
              {uploading ? "Subiendo..." : image ? "Cambiar imagen" : "Subir imagen"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setError("");
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
                    if (res.ok) {
                      const { url } = await res.json();
                      setImage(url);
                    } else {
                      const err = await res.json();
                      setError(err.error || "Error al subir imagen");
                    }
                  } catch {
                    setError("Error al subir imagen");
                  }
                  setUploading(false);
                  e.target.value = "";
                }}
              />
            </label>
            {image && (
              <div className="flex items-center gap-2">
                <img src={image} alt="" className="w-10 h-10 rounded object-cover" />
                <span className="text-xs text-green-600">Imagen lista</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 cursor-pointer"
      >
        {submitting ? "Creando..." : "Crear producto"}
      </button>
    </form>
  );
}
