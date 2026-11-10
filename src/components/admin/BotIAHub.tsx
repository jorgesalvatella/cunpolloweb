"use client";

import { useState } from "react";
import KnowledgeManager from "./KnowledgeManager";
import CampaignInfoManager from "./CampaignInfoManager";

const tabs = ["Conocimiento", "Campanas"];

export default function BotIAHub() {
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
                ? "bg-red-600 text-white"
                : "bg-white text-dark/70 hover:bg-gray-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 0 && <KnowledgeManager />}
      {activeTab === 1 && <CampaignInfoManager />}
    </div>
  );
}
