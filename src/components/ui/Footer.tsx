import React from "react";
import { Tab } from "~/components/App";

interface FooterProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  showWallet?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: Tab.Swap,      icon: "🦄", label: "Swap"      },
    { id: Tab.Liquidity, icon: "🏊", label: "Pool"      },
    { id: Tab.History,   icon: "📋", label: "History"   },
    { id: Tab.Wallet,    icon: "👛", label: "Wallet"    },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      background: "#fff",
      borderTop: "1px solid #E8ECEF",
      padding: "8px 0 16px",
      zIndex: 50,
      display: "flex",
      justifyContent: "space-around",
      alignItems: "center",
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            background: "none", border: "none", cursor: "pointer",
            padding: "4px 12px",
            color: activeTab === tab.id ? "#FF007A" : "#888",
            transition: "color .2s",
          }}
        >
          <span style={{ fontSize: "22px", marginBottom: "2px" }}>{tab.icon}</span>
          <span style={{
            fontSize: "11px", fontWeight: 600,
            color: activeTab === tab.id ? "#FF007A" : "#888",
          }}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};