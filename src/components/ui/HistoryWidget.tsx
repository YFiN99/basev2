"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";

export interface TxRecord {
  hash: string;
  type: "swap" | "add" | "remove";
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  timestamp: number;
  status: "success" | "pending" | "failed";
}

// ✅ In-memory store — works in Farcaster iframe
let memoryStore: TxRecord[] = [];
const listeners: Set<() => void> = new Set();

function notify() {
  listeners.forEach(fn => fn());
}

export function saveTx(tx: TxRecord) {
  memoryStore = [tx, ...memoryStore].slice(0, 50);
  // Coba juga sessionStorage sebagai backup
  try {
    sessionStorage.setItem("uniswap_tx_history", JSON.stringify(memoryStore));
  } catch {}
  notify();
}

function loadHistory(): TxRecord[] {
  // Coba load dari sessionStorage kalau ada
  try {
    const stored = sessionStorage.getItem("uniswap_tx_history");
    if (stored) {
      memoryStore = JSON.parse(stored);
      return memoryStore;
    }
  } catch {}
  return memoryStore;
}

export function HistoryWidget() {
  const { address, isConnected } = useAccount();
  const [history, setHistory] = useState<TxRecord[]>(() => loadHistory());
  const [filter, setFilter] = useState<"all" | "swap" | "add" | "remove">("all");

  // ✅ Subscribe ke in-memory updates
  useEffect(() => {
    const update = () => setHistory([...memoryStore]);
    listeners.add(update);
    return () => { listeners.delete(update); };
  }, []);

  const filtered = history.filter(tx => filter === "all" || tx.type === filter);

  const typeColor = { swap: "#FF007A", add: "#27AE60", remove: "#E74C3C" };
  const typeIcon  = { swap: "🔄", add: "➕", remove: "➖" };
  const typeLabel = { swap: "Swap", add: "Add Liquidity", remove: "Remove Liquidity" };

  if (!isConnected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "12px" }}>
        <span style={{ fontSize: "48px" }}>📋</span>
        <p style={{ fontWeight: 600, color: "#000" }}>Connect wallet to see history</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", padding: "20px 16px 100px", fontFamily: "'Inter', sans-serif", maxWidth: "480px", margin: "0 auto" }}>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Transaction History</h2>
        {history.length > 0 && (
          <button onClick={() => {
            memoryStore = [];
            try { sessionStorage.removeItem("uniswap_tx_history"); } catch {}
            setHistory([]);
          }} style={{ background: "none", border: "none", color: "#888", fontSize: "13px", cursor: "pointer" }}>
            Clear all
          </button>
        )}
      </div>

      <div style={{ background: "#fff", borderRadius: "12px", padding: "10px 14px", marginBottom: "16px", border: "1px solid #E8ECEF", fontSize: "12px", color: "#888", fontFamily: "monospace" }}>
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto" }}>
        {(["all", "swap", "add", "remove"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 14px", borderRadius: "12px", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
            background: filter === f ? "#FF007A" : "#fff",
            color: filter === f ? "#fff" : "#888",
            border: filter === f ? "none" : "1px solid #E8ECEF",
          } as React.CSSProperties}>
            {f === "all" ? "All" : typeLabel[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>📭</div>
          <p style={{ color: "#888", fontSize: "14px" }}>No transactions yet</p>
          <p style={{ color: "#C3C5CB", fontSize: "12px" }}>Your swaps and liquidity actions will appear here</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {filtered.map((tx) => (
            <div key={tx.hash} style={{ background: "#fff", borderRadius: "16px", padding: "14px 16px", border: "1px solid #E8ECEF", borderLeft: `4px solid ${typeColor[tx.type]}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>{typeIcon[tx.type]}</span>
                  <span style={{ fontWeight: 700, fontSize: "14px", color: typeColor[tx.type] }}>{typeLabel[tx.type]}</span>
                </div>
                <span style={{
                  fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "8px",
                  background: tx.status === "success" ? "#E8F5E9" : tx.status === "pending" ? "#FFF8E1" : "#FFEBEE",
                  color: tx.status === "success" ? "#2E7D32" : tx.status === "pending" ? "#F57F17" : "#C62828",
                }}>
                  {tx.status === "success" ? "✓ Success" : tx.status === "pending" ? "⏳ Pending" : "✗ Failed"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ background: "#F7F8FA", borderRadius: "10px", padding: "6px 10px", fontSize: "13px", fontWeight: 600 }}>
                  {Number(tx.amountIn).toFixed(4)} {tx.tokenIn}
                </div>
                <span style={{ color: "#888", fontSize: "16px" }}>→</span>
                <div style={{ background: "#F7F8FA", borderRadius: "10px", padding: "6px 10px", fontSize: "13px", fontWeight: 600 }}>
                  {Number(tx.amountOut).toFixed(4)} {tx.tokenOut}
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#C3C5CB" }}>
                  {new Date(tx.timestamp).toLocaleString()}
                </span>
                <a href={"https://basescan.org/tx/" + tx.hash} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#1976D2", textDecoration: "none" }}>View ↗</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}