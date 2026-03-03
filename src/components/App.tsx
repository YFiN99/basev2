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
        height: "100vh", background: "#F7F8FA",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🦄</div>
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