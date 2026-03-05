"use client";

import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  template_name: string;
  message_preview: string;
  recipients_count: number;
  sent_count: number;
  failed_count: number;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sending: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function CampaignHistory() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/campaigns")
      .then((res) => res.json())
      .then((data) => {
        setCampaigns(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-8 text-dark/30">Cargando...</div>;
  }

  if (campaigns.length === 0) {
    return <div className="text-center py-8 text-dark/30">No hay campanas enviadas</div>;
  }

  return (
    <div className="space-y-3">
      {campaigns.map((c) => (
        <div key={c.id} className="bg-white border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-sm">{c.template_name}</p>
              <p className="text-xs text-dark/50 mt-0.5 line-clamp-2">{c.message_preview}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${statusColors[c.status] || statusColors.draft}`}>
              {c.status}
            </span>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-dark/50">
            <span>Destinatarios: {c.recipients_count}</span>
            <span>Enviados: {c.sent_count}</span>
            <span>Fallidos: {c.failed_count}</span>
            <span>{new Date(c.created_at).toLocaleString("es-MX")}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
