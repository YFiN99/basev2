import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';

const SWAP_GAS_UNITS = 150_000n;

export function useGasEstimate() {
  const [gasUsd, setGasUsd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const publicClient = usePublicClient();

  useEffect(() => {
    let cancelled = false;

    async function fetchGas() {
      if (!publicClient) return;
      setIsLoading(true);
      try {
        // 1. Fetch gas price dari Base RPC
        const gasPrice = await publicClient.getGasPrice();

        // 2. Hitung gas cost dalam ETH
        const gasCostWei = gasPrice * SWAP_GAS_UNITS;
        const gasCostEth = Number(formatUnits(gasCostWei, 18));

        // 3. Fetch harga ETH dari CoinGecko
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
        );
        const data = await res.json();
        const ethPrice = data?.ethereum?.usd ?? 2500;

        // 4. Hitung gas dalam USD
        const gasUsdValue = gasCostEth * ethPrice;

        if (!cancelled) {
          if (gasUsdValue < 0.000001) {
            setGasUsd('< $0.000001');
          } else if (gasUsdValue < 0.001) {
            setGasUsd(`~$${gasUsdValue.toFixed(6)}`);
          } else if (gasUsdValue < 0.01) {
            setGasUsd(`~$${gasUsdValue.toFixed(4)}`);
          } else {
            setGasUsd(`~$${gasUsdValue.toFixed(3)}`);
          }
        }
      } catch (e) {
        if (!cancelled) setGasUsd('~$0.001'); // fallback
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchGas();
    const interval = setInterval(fetchGas, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [publicClient]);

  return { gasUsd, isLoading };
}
