"use client";

import { useState } from "react";
import ContactList from "./ContactList";
import SendPromo from "./SendPromo";
import CampaignHistory from "./CampaignHistory";
import AdminPhonesManager from "./AdminPhonesManager";

const tabs = ["Notificaciones", "Contactos", "Enviar Promo", "Historial"];

export default function WhatsAppHub() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === i
                ? "bg-green-600 text-white"
                : "bg-white text-dark/70 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <AdminPhonesManager />}
      {activeTab === 1 && <ContactList />}
      {activeTab === 2 && <SendPromo />}
      {activeTab === 3 && <CampaignHistory />}
    </div>
  );
}
