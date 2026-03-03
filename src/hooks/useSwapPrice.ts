import { useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { BASE_CONTRACTS, Token } from '~/lib/constants';

const ROUTER_ABI = [{
  name: 'getAmountsOut',
  type: 'function',
  stateMutability: 'view',
  inputs: [
    { name: 'amountIn', type: 'uint256' },
    { name: 'path',     type: 'address[]' },
  ],
  outputs: [{ name: 'amounts', type: 'uint256[]' }],
}] as const;

/**
 * Hook untuk baca harga swap antara 2 token apapun
 * Support semua pasangan token di Base network
 */
export function useSwapPrice(
  tokenIn: Token | null,
  tokenOut: Token | null,
  amountIn: string
) {
  let parsedAmount = 0n;
  try {
    if (amountIn && Number(amountIn) > 0 && tokenIn) {
      parsedAmount = parseUnits(amountIn, tokenIn.decimals);
    }
  } catch { parsedAmount = 0n; }

  // Build path — jika bukan WETH, route melalui WETH
  const path: `0x${string}`[] = [];
  if (tokenIn && tokenOut && parsedAmount > 0n) {
    const inAddr  = tokenIn.address;
    const outAddr = tokenOut.address;
    const weth    = BASE_CONTRACTS.WETH;

    if (inAddr === weth || outAddr === weth) {
      // Direct path
      path.push(inAddr, outAddr);
    } else {
      // Route via WETH
      path.push(inAddr, weth, outAddr);
    }
  }

  const { data, isLoading, error } = useReadContract({
    address: BASE_CONTRACTS.ROUTER,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [parsedAmount, path],
    query: {
      enabled: parsedAmount > 0n && path.length >= 2,
      refetchInterval: 10_000,
    },
  });

  const amountOut = data && tokenOut
    ? formatUnits(data[data.length - 1], tokenOut.decimals)
    : '0';

  return { amountOut, isLoading, error };
}