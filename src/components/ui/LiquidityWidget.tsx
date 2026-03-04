"use client";

import { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { useAddLiquidity, useRemoveLiquidity, usePoolInfo, useLPBalance } from "~/hooks/useLiquidity";
import { useTokenBalance } from "~/hooks/useTokenBalance";
import { useTokenList } from "~/hooks/useTokenList";
import { Token } from "~/lib/constants";

function TokenButton({ token, onClick }: { token: Token | null; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: "8px",
      background: "#fff", borderRadius: "20px", padding: "8px 12px 8px 8px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: "pointer", border: "none",
    }}>
      {token && (
        <div style={{
          width: "24px", height: "24px", borderRadius: "50%",
          background: token.logoColor, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: "11px", color: "#fff", fontWeight: 700,
        }}>{token.logoText}</div>
      )}
      <span style={{ fontWeight: 700, fontSize: "15px" }}>{token?.symbol ?? "Select"}</span>
      <span style={{ color: "#888", fontSize: "12px" }}>▼</span>
    </button>
  );
}

function TokenModal({ onSelect, onClose, exclude, tokens }: {
  onSelect: (t: Token) => void;
  onClose: () => void;
  exclude?: Token | null;
  tokens: Token[];
}) {
  const [search, setSearch] = useState("");
  const filtered = tokens.filter(t =>
    t.symbol !== exclude?.symbol &&
    (t.symbol.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "480px", padding: "20px", maxHeight: "70vh", overflowY: "auto" }}
        onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700 }}>Select Token</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}>X</button>
        </div>
        <input placeholder="Search token..." value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: "14px", border: "1px solid #E8ECEF", fontSize: "14px", outline: "none", marginBottom: "12px", boxSizing: "border-box" }}
        />
        {filtered.map((t) => (
          <div key={t.symbol} onClick={() => onSelect(t)}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px", cursor: "pointer", borderRadius: "12px" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#F7F8FA")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: t.logoColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff", fontWeight: 700 }}>{t.logoText}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{t.symbol}</div>
              <div style={{ fontSize: "12px", color: "#888" }}>{t.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SLIPPAGE_OPTIONS = [1, 5, 10, 49];

export function LiquidityWidget() {
  const { tokens } = useTokenList();

  const [mode, setMode] = useState<"add" | "remove">("add");
  const [slippage, setSlippage] = useState(5);

  const [tokenA, setTokenA] = useState<Token | null>(null);
  const [tokenB, setTokenB] = useState<Token | null>(null);

  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");

  const [showModalA, setShowModalA] = useState(false);
  const [showModalB, setShowModalB] = useState(false);

  // Set default tokens setelah list loaded
  useEffect(() => {
    if (tokens.length >= 2 && !tokenA && !tokenB) {
      setTokenA(tokens[0]);
      setTokenB(tokens[1]);
    }
  }, [tokens]);

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const { addLiquidity, isPending: isAdding, isConfirming: isAddConfirming, isSuccess: isAddSuccess, txHash: addTx, error: addError, reset: resetAdd } = useAddLiquidity();
  const { removeLiquidity, isPending: isRemoving, isConfirming: isRemoveConfirming, isSuccess: isRemoveSuccess, txHash: removeTx, error: removeError, reset: resetRemove } = useRemoveLiquidity();

  const { reserve0, reserve1, isValidPair, pairAddress } = usePoolInfo(tokenA, tokenB);
  const { lpFormatted, lpBalance } = useLPBalance(pairAddress, address);

  const { formatted: balanceA } = useTokenBalance(tokenA!, address);
  const { formatted: balanceB } = useTokenBalance(tokenB!, address);

  const handleAmountAChange = (val: string) => {
    setAmountA(val);
    if (isValidPair && val && Number(reserve0) > 0 && Number(reserve1) > 0) {
      const ratio = Number(reserve1) / Number(reserve0);
      setAmountB((Number(val) * ratio).toFixed((tokenB?.decimals ?? 18) > 6 ? 6 : (tokenB?.decimals ?? 6)));
    }
  };

  const handleAmountBChange = (val: string) => {
    setAmountB(val);
    if (isValidPair && val && Number(reserve0) > 0 && Number(reserve1) > 0) {
      const ratio = Number(reserve0) / Number(reserve1);
      setAmountA((Number(val) * ratio).toFixed(6));
    }
  };

  const handleAdd = async () => {
    if (!address || !tokenA || !tokenB) return;
    try {
      resetAdd();
      if (tokenA.isNative) {
        await addLiquidity(address, tokenB, amountB, amountA, slippage);
      } else if (tokenB.isNative) {
        await addLiquidity(address, tokenA, amountA, amountB, slippage);
      } else {
        await addLiquidity(address, tokenB, amountB, amountA, slippage);
      }
    } catch (e) { console.error(e); }
  };

  const handleRemove = async () => {
    if (!address || !lpBalance || !tokenA || !tokenB || !pairAddress) return;
    try {
      resetRemove();
      const slippageFactor = 1 - slippage / 100;
      const minA = (Number(reserve0) * slippageFactor).toFixed(tokenA.decimals > 6 ? 6 : tokenA.decimals);
      const minB = (Number(reserve1) * slippageFactor).toFixed(tokenB.decimals > 6 ? 6 : tokenB.decimals);
      // Pass pairAddress untuk approve LP token
      await removeLiquidity(address, tokenB, lpBalance, minB, minA, pairAddress);
    } catch (e) { console.error(e); }
  };

  if (!isConnected) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "12px" }}>
        <span style={{ fontSize: "48px" }}>🏊</span>
        <p style={{ fontWeight: 600, color: "#000" }}>Connect wallet to manage liquidity</p>
        <button onClick={() => connect({ connector: connectors[0] })} style={{ padding: "12px 24px", borderRadius: "16px", background: "#FF007A", color: "#fff", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "15px" }}>
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", padding: "20px 16px 100px", fontFamily: "'Inter', sans-serif", maxWidth: "480px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          {mode === "add" ? "Add Liquidity" : "Remove Liquidity"}
        </h2>
        <div style={{ display: "flex", gap: "8px" }}>
          {(["add", "remove"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} style={{
              padding: "6px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 600,
              border: "none", cursor: "pointer",
              background: mode === m ? "#FF007A" : "#E8ECEF",
              color: mode === m ? "#fff" : "#888",
            }}>{m === "add" ? "Add" : "Remove"}</button>
          ))}
        </div>
      </div>

      {/* Slippage Selector */}
      <div style={{ background: "#fff", borderRadius: "16px", padding: "12px 16px", marginBottom: "12px", border: "1px solid #E8ECEF" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "#888", fontWeight: 600 }}>Slippage Tolerance</span>
          <div style={{ display: "flex", gap: "6px" }}>
            {SLIPPAGE_OPTIONS.map((s) => (
              <button key={s} onClick={() => setSlippage(s)} style={{
                padding: "4px 10px", borderRadius: "8px", fontSize: "12px",
                border: "none", cursor: "pointer", fontWeight: 600,
                background: slippage === s ? "#FF007A" : "#E8ECEF",
                color: slippage === s ? "#fff" : "#888",
              }}>{s}%</button>
            ))}
          </div>
        </div>
      </div>

      {/* Pool info */}
      {isValidPair && (
        <div style={{ background: "#fff", borderRadius: "16px", padding: "14px 16px", marginBottom: "12px", border: "1px solid #E8ECEF" }}>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px", fontWeight: 600 }}>POOL INFO</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", color: "#888" }}>{tokenA?.symbol} Reserve</span>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>{Number(reserve0).toFixed(4)} {tokenA?.symbol}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "13px", color: "#888" }}>{tokenB?.symbol} Reserve</span>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>{Number(reserve1).toFixed(4)} {tokenB?.symbol}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", color: "#888" }}>Your LP tokens</span>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#FF007A" }}>{lpFormatted}</span>
          </div>
        </div>
      )}

      {/* New pool notice */}
      {!isValidPair && mode === "add" && (
        <div style={{ background: "#FFF8E1", borderRadius: "16px", padding: "12px 16px", marginBottom: "12px", border: "1px solid #FFE082" }}>
          <div style={{ fontSize: "13px", color: "#F57F17", fontWeight: 600 }}>⚠️ Pool Baru</div>
          <div style={{ fontSize: "12px", color: "#F57F17", marginTop: "4px" }}>Pair ini belum ada. Input bebas — kamu yang menentukan harga awal pool.</div>
        </div>
      )}

      {mode === "add" ? (
        <div style={{ background: "#fff", borderRadius: "24px", padding: "4px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #E8ECEF" }}>
          <div style={{ background: "#F7F8FA", borderRadius: "20px", padding: "16px", marginBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>{tokenA?.symbol} Amount</span>
              <span style={{ fontSize: "12px", color: "#888" }}>
                Balance: <span style={{ color: "#000", fontWeight: 500, cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => handleAmountAChange(balanceA)}>{balanceA}</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <input type="number" value={amountA} placeholder="0.0"
                onChange={(e) => handleAmountAChange(e.target.value)}
                style={{ background: "none", border: "none", outline: "none", fontSize: "32px", fontWeight: 500, width: "55%", color: amountA ? "#000" : "#C3C5CB" }} />
              <TokenButton token={tokenA} onClick={() => setShowModalA(true)} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", margin: "-2px 0" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "10px", background: "#fff", border: "4px solid #F7F8FA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>+</div>
          </div>

          <div style={{ background: "#F7F8FA", borderRadius: "20px", padding: "16px", marginTop: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>{tokenB?.symbol} Amount</span>
              <span style={{ fontSize: "12px", color: "#888" }}>
                Balance: <span style={{ color: "#000", fontWeight: 500, cursor: "pointer", textDecoration: "underline" }}
                  onClick={() => handleAmountBChange(balanceB)}>{balanceB}</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <input type="number" value={amountB} placeholder={isValidPair ? "Auto" : "0.0"}
                onChange={(e) => handleAmountBChange(e.target.value)}
                style={{ background: "none", border: "none", outline: "none", fontSize: "32px", fontWeight: 500, width: "55%", color: amountB ? "#000" : "#C3C5CB" }} />
              <TokenButton token={tokenB} onClick={() => setShowModalB(true)} />
            </div>
          </div>

          {isValidPair && amountA && amountB && (
            <div style={{ padding: "8px 16px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "12px", color: "#888" }}>Rate</span>
              <span style={{ fontSize: "12px", color: "#888" }}>1 {tokenA?.symbol} = {(Number(amountB) / Number(amountA)).toFixed(4)} {tokenB?.symbol}</span>
            </div>
          )}

          <div style={{ padding: "4px" }}>
            <button onClick={handleAdd} disabled={isAdding || isAddConfirming || !amountA || !amountB}
              style={{ width: "100%", padding: "16px", borderRadius: "20px", background: isAdding || isAddConfirming ? "#F7F8FA" : "#FF007A", border: "none", cursor: isAdding || isAddConfirming ? "not-allowed" : "pointer", fontSize: "18px", fontWeight: 600, color: isAdding || isAddConfirming ? "#C3C5CB" : "#fff" }}>
              {isAdding ? "⏳ Approving..." : isAddConfirming ? "⛓️ Processing..." : `Supply (${slippage}% slippage)`}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: "24px", padding: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #E8ECEF" }}>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Your LP Balance</div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginBottom: "16px", color: "#FF007A" }}>{lpFormatted} LP</div>
          <div style={{ fontSize: "13px", color: "#888", marginBottom: "8px" }}>Token pair</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
            <TokenButton token={tokenA} onClick={() => setShowModalA(true)} />
            <span style={{ color: "#888", fontWeight: 700 }}>+</span>
            <TokenButton token={tokenB} onClick={() => setShowModalB(true)} />
          </div>
          <button onClick={handleRemove} disabled={isRemoving || isRemoveConfirming || !lpBalance || lpBalance === 0n}
            style={{ width: "100%", padding: "16px", borderRadius: "20px", background: isRemoving || isRemoveConfirming || !lpBalance ? "#F7F8FA" : "#FF007A", border: "none", cursor: "pointer", fontSize: "18px", fontWeight: 600, color: isRemoving || isRemoveConfirming || !lpBalance ? "#C3C5CB" : "#fff" }}>
            {isRemoving ? "⏳ Approving..." : isRemoveConfirming ? "⛓️ Processing..." : `Remove Liquidity (${slippage}% slippage)`}
          </button>
        </div>
      )}

      {(isAddSuccess || isRemoveSuccess) && (
        <div style={{ background: "#E8F5E9", borderRadius: "16px", padding: "16px", marginTop: "8px", border: "1px solid #81C784", textAlign: "center" }}>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#2E7D32", marginBottom: "6px" }}>✅ Transaction Successful!</div>
          <a href={`https://basescan.org/tx/${addTx || removeTx}`} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#1976D2" }}>View on BaseScan ↗</a>
        </div>
      )}

      {(addError || removeError) && (
        <div style={{ background: "#FFEBEE", borderRadius: "16px", padding: "16px", marginTop: "8px", border: "1px solid #EF9A9A" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, color: "#C62828" }}>❌ Failed</div>
          <div style={{ fontSize: "12px", color: "#B71C1C" }}>{(addError || removeError)?.message.slice(0, 120)}</div>
        </div>
      )}

      {showModalA && <TokenModal tokens={tokens} onSelect={(t) => { setTokenA(t); setAmountA(""); setAmountB(""); setShowModalA(false); }} onClose={() => setShowModalA(false)} exclude={tokenB} />}
      {showModalB && <TokenModal tokens={tokens} onSelect={(t) => { setTokenB(t); setAmountA(""); setAmountB(""); setShowModalB(false); }} onClose={() => setShowModalB(false)} exclude={tokenA} />}
    </div>
  );
}
