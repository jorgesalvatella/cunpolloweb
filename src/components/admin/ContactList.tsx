"use client";

import { useState, useEffect, useCallback } from "react";

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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
          type="text"
          placeholder="+52..."
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
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
              {contacts.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="py-2 pr-4">{c.name}</td>
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
              ))}
            </tbody>
          </table>
          <p className="text-xs text-dark/40 mt-2">{contacts.length} contactos activos</p>
        </div>
      )}
    </div>
  );
}
