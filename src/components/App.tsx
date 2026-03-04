"use client";
import { useEffect } from "react";
import { useMiniApp } from "@neynar/react";
import sdk from "@farcaster/miniapp-sdk";
import { Footer } from "~/components/ui/Footer";
import { WalletTab } from "~/components/ui/tabs";
import { SwapWidget } from "~/components/ui/SwapWidget";
import { LiquidityWidget } from "~/components/ui/LiquidityWidget";
import { HistoryWidget } from "~/components/ui/HistoryWidget";

export enum Tab {
  Home      = "home",
  Actions   = "actions",
  Context   = "context",
  Wallet    = "wallet",
  Swap      = "swap",
  Liquidity = "liquidity",
  History   = "history",
}

export interface AppProps {
  title?: string;
}

export default function App({ title }: AppProps = {}) {
  const {
    isSDKLoaded,
    context,
    setInitialTab,
    setActiveTab,
    currentTab,
  } = useMiniApp();

  useEffect(() => {
    if (isSDKLoaded) {
      setInitialTab(Tab.Swap);
      sdk.actions.ready();
    }
  }, [isSDKLoaded, setInitialTab]);

  if (!isSDKLoaded) {
    return (
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        height: "100vh", background: "#000",
      }}>
        <div style={{ textAlign: "center" }}>
          <img src="/icon.png" width={64} height={64} style={{ borderRadius: "16px", marginBottom: "12px" }} />
          <p style={{ color: "#888", fontSize: "14px" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      paddingTop:    context?.client.safeAreaInsets?.top    ?? 0,
      paddingBottom: context?.client.safeAreaInsets?.bottom ?? 0,
      paddingLeft:   context?.client.safeAreaInsets?.left   ?? 0,
      paddingRight:  context?.client.safeAreaInsets?.right  ?? 0,
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "12px 16px", background: "#000",
        borderBottom: "1px solid #222",
        position: "sticky", top: 0, zIndex: 40,
      }}>
        <img src="/icon.png" width={28} height={28} style={{ borderRadius: "8px" }} />
        <span style={{ fontWeight: 700, fontSize: "16px", color: "#fff", letterSpacing: "2px" }}>CLAN</span>
        <span style={{
          marginLeft: "auto", fontSize: "11px",
          background: "#0052FF", color: "#fff",
          padding: "2px 8px", borderRadius: "8px", fontWeight: 600,
        }}>Base</span>
      </div>

      <div style={{ paddingBottom: "80px" }}>
        {currentTab === Tab.Swap      && <SwapWidget />}
        {currentTab === Tab.Liquidity && <LiquidityWidget />}
        {currentTab === Tab.History   && <HistoryWidget />}
        {currentTab === Tab.Wallet    && <WalletTab />}
      </div>

      <Footer
        activeTab={currentTab as Tab}
        setActiveTab={setActiveTab}
        showWallet={true}
      />
    </div>
  );
}
