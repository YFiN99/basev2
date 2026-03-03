"use client";

import { useState, useCallback, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import { useSwapPrice } from "~/hooks/useSwapPrice";
import { useSwap } from "~/hooks/useSwap";
import { useTokenBalance } from "~/hooks/useTokenBalance";
import { BASE_TOKENS, Token } from "~/lib/constants";
import { saveTx } from "~/components/ui/HistoryWidget"; // ✅ tambah import

function TokenModal({
  onSelect, onClose, exclude,
}: {
  onSelect: (t: Token) => void;
  onClose: () => void;
  exclude?: Token | null;
}) {
  const [search, setSearch] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const filtered = BASE_TOKENS.filter(
    (t) => t.symbol !== exclude?.symbol &&
      (t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: "24px 24px 0 0", width: "100%", maxWidth: "480px", padding: "20px", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700 }}>Select a token</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#888" }}>X</button>
        </div>
        <input placeholder="Search name or paste address" value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", padding: "12px 16px", borderRadius: "16px", border: "1px solid #E8ECEF", fontSize: "14px", outline: "none", marginBottom: "16px", boxSizing: "border-box" }} />
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "6px" }}>Paste token address</div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input placeholder="0x..." value={customAddress} onChange={(e) => setCustomAddress(e.target.value)}
              style={{ flex: 1, padding: "10px 14px", borderRadius: "12px", border: "1px solid #E8ECEF", fontSize: "13px", outline: "none" }} />
            <button onClick={() => {
              if (customAddress.startsWith("0x") && customAddress.length === 42) {
                onSelect({ symbol: "CUSTOM", name: "Custom Token", address: customAddress as `0x${string}`, decimals: 18, logoColor: "#888", logoText: "?" });
              }
            }} style={{ padding: "10px 16px", borderRadius: "12px", background: "#FF007A", color: "#fff", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Import</button>
          </div>
        </div>
        <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Common tokens</div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
          {BASE_TOKENS.slice(0, 4).filter(t => t.symbol !== exclude?.symbol).map((t) => (
            <button key={t.symbol} onClick={() => onSelect(t)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "20px", border: "1px solid #E8ECEF", background: "#F7F8FA", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: t.logoColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#fff" }}>{t.logoText}</div>
              {t.symbol}
            </button>
          ))}
        </div>
        {filtered.map((t) => (
          <div key={t.symbol} onClick={() => onSelect(t)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px", cursor: "pointer", borderRadius: "12px" }}
            onMouseOver={(e) => (e.currentTarget.style.background = "#F7F8FA")}
            onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: t.logoColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", color: "#fff", fontWeight: 700 }}>{t.logoText}</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "15px" }}>{t.symbol}</div>
              <div style={{ fontSize: "12px", color: "#888" }}>{t.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenButton({ token, onClick }: { token: Token | null; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "8px", background: "#fff", borderRadius: "20px", padding: "8px 12px 8px 8px", boxShadow: "0 2px 8px rgba(0,0,0,0.12)", cursor: "pointer", border: "none" }}>
      {token ? (
        <>
          <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: token.logoColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", color: "#fff", fontWeight: 700 }}>{token.logoText}</div>
          <span style={{ fontWeight: 700, fontSize: "16px" }}>{token.symbol}</span>
        </>
      ) : (
        <span style={{ fontWeight: 600, fontSize: "14px", color: "#FF007A", padding: "0 4px" }}>Select token</span>
      )}
      <span style={{ color: "#888", fontSize: "12px" }}>v</span>
    </button>
  );
}

export function SwapWidget() {
  const [tokenIn, setTokenIn]   = useState<Token>(BASE_TOKENS[0]);
  const [tokenOut, setTokenOut] = useState<Token>(BASE_TOKENS[1]);
  const [amountIn, setAmountIn] = useState("");
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [showTokenInModal, setShowTokenInModal]   = useState(false);
  const [showTokenOutModal, setShowTokenOutModal] = useState(false);

  const { address, isConnected } = useAccount();
  const { connect, connectors }  = useConnect();

  const { amountOut, isLoading: priceLoading } = useSwapPrice(tokenIn, tokenOut, amountIn);
  const { swap, txHash, isPending, isConfirming, isSuccess, error, reset } = useSwap();

  const { formatted: rawIn,  isLoading: loadingIn  } = useTokenBalance(tokenIn,  address as `0x${string}` | undefined);
  const { formatted: rawOut, isLoading: loadingOut } = useTokenBalance(tokenOut, address as `0x${string}` | undefined);

  const balanceIn  = loadingIn  ? "..." : (!rawIn  || rawIn  === "NaN" || isNaN(Number(rawIn)))  ? "0.0000" : rawIn;
  const balanceOut = loadingOut ? "..." : (!rawOut || rawOut === "NaN" || isNaN(Number(rawOut))) ? "0.0000" : rawOut;

  // ✅ Simpan ke history saat swap sukses
  useEffect(() => {
    if (isSuccess && txHash && tokenIn && tokenOut) {
      saveTx({
        hash: txHash,
        type: "swap",
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amountIn: amountIn,
        amountOut: amountOut,
        timestamp: Date.now(),
        status: "success",
      });
    }
  }, [isSuccess, txHash]);

  const isDisabled = isPending || isConfirming || !amountIn || Number(amountIn) <= 0 || priceLoading;

  const handleSwitch = useCallback(() => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
    setAmountIn(amountOut !== "0" ? Number(amountOut).toFixed(6) : "");
    reset();
  }, [tokenIn, tokenOut, amountOut, reset]);

  const handleSwap = async () => {
    if (!address || !tokenIn || !tokenOut) return;
    try { reset(); await swap(address, tokenIn, tokenOut, amountIn, amountOut, slippage); }
    catch (e) { console.error(e); }
  };

  const fee  = Number(amountIn) > 0 ? (Number(amountIn) * 0.003).toFixed(6) : "0";
  const rate = Number(amountIn) > 0 && Number(amountOut) > 0
    ? (Number(amountOut) / Number(amountIn)).toFixed(4) : "0";

  return (
    <div style={{ minHeight: "100vh", background: "#F7F8FA", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "20px", paddingBottom: "100px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ width: "100%", maxWidth: "480px", padding: "0 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
          <button onClick={() => setShowSettings(!showSettings)} style={{ background: showSettings ? "#F7F8FA" : "none", border: "none", cursor: "pointer", fontSize: "20px", padding: "4px 8px", borderRadius: "8px" }}>
            {showSettings ? "X" : "⚙️"}
          </button>
        </div>

        {showSettings && (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginBottom: "8px", border: "1px solid #E8ECEF", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>Transaction Settings</div>
            <div style={{ fontSize: "12px", color: "#888", marginBottom: "8px" }}>Slippage tolerance</div>
            <div style={{ display: "flex", gap: "8px" }}>
              {[0.1, 0.5, 1.0].map((s) => (
                <button key={s} onClick={() => setSlippage(s)} style={{ padding: "6px 14px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, cursor: "pointer", border: "none", background: slippage === s ? "#FF007A" : "#F7F8FA", color: slippage === s ? "#fff" : "#000" }}>{s}%</button>
              ))}
            </div>
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: "24px", padding: "4px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #E8ECEF" }}>

          {/* FROM */}
          <div style={{ background: "#F7F8FA", borderRadius: "20px", padding: "16px", marginBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", color: "#888" }}>You pay</span>
              <span style={{ fontSize: "13px", color: "#888" }}>
                Balance:{" "}
                <span
                  style={{ color: loadingIn ? "#888" : "#000", fontWeight: 500, cursor: loadingIn ? "default" : "pointer", textDecoration: loadingIn ? "none" : "underline" }}
                  onClick={() => { if (!loadingIn && balanceIn !== "0.0000") setAmountIn(balanceIn); }}
                >
                  {balanceIn}
                </span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <input type="number" value={amountIn} onChange={(e) => { reset(); setAmountIn(e.target.value); }} placeholder="0"
                style={{ background: "none", border: "none", outline: "none", fontSize: "36px", fontWeight: 500, width: "55%", color: amountIn ? "#000" : "#C3C5CB" }} />
              <TokenButton token={tokenIn} onClick={() => setShowTokenInModal(true)} />
            </div>
            {Number(amountIn) > 0 && <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>approx ${(Number(amountIn) * 2637).toFixed(2)}</div>}
          </div>

          {/* Switch */}
          <div style={{ display: "flex", justifyContent: "center", margin: "-2px 0", position: "relative", zIndex: 1 }}>
            <button onClick={handleSwitch} style={{ width: "36px", height: "36px", borderRadius: "12px", background: "#fff", border: "4px solid #F7F8FA", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "18px", fontWeight: 700, color: "#888", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              {"↕"}
            </button>
          </div>

          {/* TO */}
          <div style={{ background: "#F7F8FA", borderRadius: "20px", padding: "16px", marginTop: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", color: "#888" }}>You receive</span>
              <span style={{ fontSize: "13px", color: "#888" }}>Balance: <span style={{ color: "#000", fontWeight: 500 }}>{balanceOut}</span></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "36px", fontWeight: 500, color: priceLoading ? "#C3C5CB" : "#000" }}>
                {priceLoading ? <span style={{ fontSize: "18px" }}>Fetching...</span> : Number(amountIn) > 0 ? Number(amountOut).toFixed(4) : "0"}
              </div>
              <TokenButton token={tokenOut} onClick={() => setShowTokenOutModal(true)} />
            </div>
            {Number(amountOut) > 0 && <div style={{ fontSize: "13px", color: "#888", marginTop: "4px" }}>approx ${Number(amountOut).toFixed(2)}</div>}
          </div>

          {Number(amountIn) > 0 && Number(amountOut) > 0 && (
            <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>1 {tokenIn.symbol} = {rate} {tokenOut.symbol}</span>
              <span style={{ fontSize: "13px", color: "#888" }}>gas ~$0.50</span>
            </div>
          )}

          <div style={{ padding: "4px" }}>
            {!isConnected ? (
              <button onClick={() => connect({ connector: connectors[0] })} style={{ width: "100%", padding: "16px", borderRadius: "20px", background: "#FF007A", border: "none", cursor: "pointer", fontSize: "18px", fontWeight: 600, color: "#fff" }}>Connect Wallet</button>
            ) : !amountIn || Number(amountIn) <= 0 ? (
              <button disabled style={{ width: "100%", padding: "16px", borderRadius: "20px", background: "#F7F8FA", border: "none", fontSize: "18px", fontWeight: 600, color: "#C3C5CB", cursor: "not-allowed" }}>Enter an amount</button>
            ) : (
              <button onClick={handleSwap} disabled={isDisabled} style={{ width: "100%", padding: "16px", borderRadius: "20px", background: isDisabled ? "#F7F8FA" : "#FF007A", border: "none", cursor: isDisabled ? "not-allowed" : "pointer", fontSize: "18px", fontWeight: 600, color: isDisabled ? "#C3C5CB" : "#fff", transition: "all .2s" }}>
                {isPending ? "Confirm in wallet..." : isConfirming ? "Processing..." : "Swap " + tokenIn.symbol + " to " + tokenOut.symbol}
              </button>
            )}
          </div>
        </div>

        {Number(amountIn) > 0 && Number(amountOut) > 0 && (
          <div style={{ background: "#fff", borderRadius: "16px", padding: "16px", marginTop: "8px", border: "1px solid #E8ECEF" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Price impact</span>
              <span style={{ fontSize: "13px", color: "#27AE60", fontWeight: 500 }}>{"< 0.01%"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Liquidity fee (0.3%)</span>
              <span style={{ fontSize: "13px", color: "#000", fontWeight: 500 }}>{fee} {tokenIn.symbol}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Route</span>
              <span style={{ fontSize: "13px", color: "#000", fontWeight: 500 }}>{tokenIn.symbol} → {tokenOut.symbol}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "13px", color: "#888" }}>Slippage</span>
              <span style={{ fontSize: "13px", color: "#000", fontWeight: 500 }}>{slippage}%</span>
            </div>
          </div>
        )}

        {isSuccess && txHash && (
          <div style={{ background: "#E8F5E9", borderRadius: "16px", padding: "16px", marginTop: "8px", border: "1px solid #81C784", textAlign: "center" }}>
            <div style={{ fontSize: "15px", fontWeight: 600, color: "#2E7D32", marginBottom: "6px" }}>Swap Successful! 🎉</div>
            <a href={"https://basescan.org/tx/" + txHash} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "#1976D2" }}>View on BaseScan</a>
          </div>
        )}

        {error && (
          <div style={{ background: "#FFEBEE", borderRadius: "16px", padding: "16px", marginTop: "8px", border: "1px solid #EF9A9A" }}>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#C62828", marginBottom: "4px" }}>Failed</div>
            <div style={{ fontSize: "12px", color: "#B71C1C" }}>{error.message.slice(0, 120)}</div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#fff", borderRadius: "12px", padding: "6px 12px", fontSize: "12px", color: "#888", border: "1px solid #E8ECEF" }}>
            Base Network
          </span>
        </div>
      </div>

      {showTokenInModal && <TokenModal onSelect={(t) => { setTokenIn(t); setShowTokenInModal(false); reset(); }} onClose={() => setShowTokenInModal(false)} exclude={tokenOut} />}
      {showTokenOutModal && <TokenModal onSelect={(t) => { setTokenOut(t); setShowTokenOutModal(false); reset(); }} onClose={() => setShowTokenOutModal(false)} exclude={tokenIn} />}
    </div>
  );
}