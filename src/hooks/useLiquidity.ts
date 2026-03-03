import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { BASE_CONTRACTS, Token } from '~/lib/constants';

const ROUTER_ABI = [
  {
    name: 'addLiquidityETH',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token',                type: 'address' },
      { name: 'amountTokenDesired',   type: 'uint256' },
      { name: 'amountTokenMin',       type: 'uint256' },
      { name: 'amountETHMin',         type: 'uint256' },
      { name: 'to',                   type: 'address' },
      { name: 'deadline',             type: 'uint256' },
    ],
    outputs: [
      { name: 'amountToken', type: 'uint256' },
      { name: 'amountETH',   type: 'uint256' },
      { name: 'liquidity',   type: 'uint256' },
    ],
  },
  {
    name: 'removeLiquidityETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token',        type: 'address' },
      { name: 'liquidity',    type: 'uint256' },
      { name: 'amountTokenMin', type: 'uint256' },
      { name: 'amountETHMin', type: 'uint256' },
      { name: 'to',           type: 'address' },
      { name: 'deadline',     type: 'uint256' },
    ],
    outputs: [
      { name: 'amountToken', type: 'uint256' },
      { name: 'amountETH',   type: 'uint256' },
    ],
  },
] as const;

const FACTORY_ABI = [
  {
    name: 'getPair',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
    ],
    outputs: [{ name: 'pair', type: 'address' }],
  },
] as const;

const PAIR_ABI = [
  {
    name: 'getReserves',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'reserve0', type: 'uint112' },
      { name: 'reserve1', type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32' },
    ],
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// Hook untuk get pair address
export function usePairAddress(tokenA: Token | null, tokenB: Token | null) {
  const addrA = tokenA?.isNative ? BASE_CONTRACTS.WETH : tokenA?.address;
  const addrB = tokenB?.isNative ? BASE_CONTRACTS.WETH : tokenB?.address;

  const { data: pairAddress } = useReadContract({
    address: BASE_CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: addrA && addrB ? [addrA, addrB] : undefined,
    query: { enabled: !!addrA && !!addrB },
  });

  return pairAddress as `0x${string}` | undefined;
}

// Hook untuk get pool info
export function usePoolInfo(tokenA: Token | null, tokenB: Token | null) {
  const pairAddress = usePairAddress(tokenA, tokenB);
  const isValidPair = !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';

  const { data: reserves } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    query: { enabled: isValidPair, refetchInterval: 15_000 },
  });

  const { data: totalSupply } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'totalSupply',
    query: { enabled: isValidPair },
  });

  const reserve0 = reserves ? formatUnits(reserves[0], tokenA?.decimals ?? 18) : '0';
  const reserve1 = reserves ? formatUnits(reserves[1], tokenB?.decimals ?? 18) : '0';
  const supply   = totalSupply ? formatUnits(totalSupply as bigint, 18) : '0';

  return { pairAddress, reserve0, reserve1, totalSupply: supply, isValidPair };
}

// Hook untuk get LP balance user
export function useLPBalance(pairAddress: `0x${string}` | undefined, userAddress?: `0x${string}`) {
  const { data } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!pairAddress && !!userAddress },
  });

  const formatted = data ? formatUnits(data as bigint, 18) : '0';
  return { lpBalance: data as bigint | undefined, lpFormatted: Number(formatted).toFixed(6) };
}

// Hook untuk add liquidity
export function useAddLiquidity() {
  const { writeContractAsync, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const addLiquidity = async (
    walletAddress: `0x${string}`,
    token: Token,
    tokenAmount: string,
    ethAmount: string,
    slippage = 0.5
  ) => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
    const tokenAmountParsed = parseUnits(tokenAmount, token.decimals);
    const ethAmountParsed   = parseUnits(ethAmount, 18);
    const tokenMin = parseUnits((Number(tokenAmount) * (1 - slippage / 100)).toFixed(token.decimals), token.decimals);
    const ethMin   = parseUnits((Number(ethAmount)   * (1 - slippage / 100)).toFixed(6), 18);

    return await writeContractAsync({
      address: BASE_CONTRACTS.ROUTER,
      abi: ROUTER_ABI,
      functionName: 'addLiquidityETH',
      args: [token.address, tokenAmountParsed, tokenMin, ethMin, walletAddress, deadline],
      value: ethAmountParsed,
    });
  };

  return { addLiquidity, txHash, isPending, isConfirming, isSuccess, error, reset };
}

// Hook untuk remove liquidity
export function useRemoveLiquidity() {
  const { writeContractAsync, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const removeLiquidity = async (
    walletAddress: `0x${string}`,
    token: Token,
    lpAmount: bigint,
    minToken: string,
    minEth: string
  ) => {
    const deadline  = BigInt(Math.floor(Date.now() / 1000) + 1200);
    const minTokenParsed = parseUnits(minToken, token.decimals);
    const minEthParsed   = parseUnits(minEth, 18);

    return await writeContractAsync({
      address: BASE_CONTRACTS.ROUTER,
      abi: ROUTER_ABI,
      functionName: 'removeLiquidityETH',
      args: [token.address, lpAmount, minTokenParsed, minEthParsed, walletAddress, deadline],
    });
  };

  return { removeLiquidity, txHash, isPending, isConfirming, isSuccess, error, reset };
}