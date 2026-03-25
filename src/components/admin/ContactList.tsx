"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

interface Contact {
  id: string;
  name: string;
  phone: string;
  source: string;
  active: boolean;
  created_at: string;
}

export default function ContactList() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchContacts = useCallback(async () => {
    const res = await fetch("/api/admin/contacts?active=true");
    if (res.ok) {
      setContacts(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const filtered = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase().trim();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [contacts, search]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("El telefono debe tener exactamente 10 digitos");
      return;
    }

    setAdding(true);

    const res = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });

    if (res.ok) {
      setName("");
      setPhone("");
      fetchContacts();
    } else {
      const data = await res.json();
      setError(data.error || "Error al agregar");
    }
    setAdding(false);
  };

  const handleImport = async () => {
    setImporting(true);
    setError("");

    const res = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importFromOrders: true }),
    });

    if (res.ok) {
      const data = await res.json();
      setError(`Importados: ${data.imported} contactos`);
      fetchContacts();
    } else {
      setError("Error al importar");
    }
    setImporting(false);
  };

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/admin/contacts/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchContacts();
    }
  };

  return (
    <div className="space-y-4">
      {/* Add contact form */}
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[120px]"
          required
        />
        <input
          type="tel"
          placeholder="10 digitos, ej: 9981234567"
          value={phone}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, "");
            if (val.length <= 10) setPhone(val);
          }}
          pattern="[0-9]{10}"
          title="Ingresa 10 digitos del numero celular"
          className="border rounded px-3 py-2 text-sm flex-1 min-w-[120px]"
          required
        />
        <button
          type="submit"
          disabled={adding}
          className="bg-red-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-red-700 disabled:opacity-50 cursor-pointer"
        >
          {adding ? "Agregando..." : "Agregar"}
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={importing}
          className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50 cursor-pointer"
        >
          {importing ? "Importando..." : "Importar de Pedidos"}
        </button>
      </form>

      {error && (
        <p className={`text-sm ${error.startsWith("Importados") ? "text-green-600" : "text-red-600"}`}>
          {error}
        </p>
      )}

      {/* Search bar */}
      {contacts.length > 0 && (
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
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Contacts table */}
      {loading ? (
        <div className="text-center py-8 text-dark/30">Cargando...</div>
      ) : contacts.length === 0 ? (
        <div className="text-center py-8 text-dark/30">No hay contactos</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-dark/50">
                <th className="py-2 pr-4">Nombre</th>
                <th className="py-2 pr-4">Telefono</th>
                <th className="py-2 pr-4">Origen</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-dark/30">
                    Sin resultados para &quot;{search}&quot;
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        {c.name}
                      </div>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{c.phone}</td>
                    <td className="py-2 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        c.source === "order" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {c.source === "order" ? "Pedido" : "Manual"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-dark/50">
                      {new Date(c.created_at).toLocaleDateString("es-MX")}
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-red-500 hover:text-red-700 text-xs cursor-pointer"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p className="text-xs text-dark/40 mt-2">
            {search
              ? `${filtered.length} de ${contacts.length} contactos`
              : `${contacts.length} contactos activos`}
          </p>
        </div>
      )}
    </div>
  );
}
