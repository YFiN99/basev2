import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { parseUnits, maxUint256 } from 'viem';
import { BASE_CONTRACTS, Token } from '~/lib/constants';

const ERC20_APPROVE_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner',   type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount',  type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

const ROUTER_ABI = [
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256'   },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address'   },
      { name: 'deadline',     type: 'uint256'   },
    ],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn',     type: 'uint256'   },
      { name: 'amountOutMin', type: 'uint256'   },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address'   },
      { name: 'deadline',     type: 'uint256'   },
    ],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn',     type: 'uint256'   },
      { name: 'amountOutMin', type: 'uint256'   },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address'   },
      { name: 'deadline',     type: 'uint256'   },
    ],
    outputs: [{ type: 'uint256[]' }],
  },
] as const;

export function useSwap() {
  const { writeContractAsync, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const publicClient = usePublicClient();

  // ✅ Helper: cek & approve allowance jika kurang
  const ensureAllowance = async (
    tokenAddress: `0x${string}`,
    owner: `0x${string}`,
    spender: `0x${string}`,
    amount: bigint,
  ) => {
    const allowance = await publicClient!.readContract({
      address: tokenAddress,
      abi: ERC20_APPROVE_ABI,
      functionName: 'allowance',
      args: [owner, spender],
    });

    if ((allowance as bigint) < amount) {
      // Approve maxUint256 supaya tidak perlu approve lagi next time
      await writeContractAsync({
        address: tokenAddress,
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [spender, maxUint256],
      });
    }
  };

  const swap = async (
    walletAddress: `0x${string}`,
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    amountOut: string,
    slippage = 0.5
  ) => {
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
    const weth = BASE_CONTRACTS.WETH as `0x${string}`;

    // ✅ Fix path: gunakan WETH address untuk native ETH, bukan token.address
    const inAddr  = tokenIn.isNative  ? weth : tokenIn.address  as `0x${string}`;
    const outAddr = tokenOut.isNative ? weth : tokenOut.address as `0x${string}`;

    const path: `0x${string}`[] =
      inAddr === weth || outAddr === weth
        ? [inAddr, outAddr]
        : [inAddr, weth, outAddr];

    const amountInParsed = parseUnits(amountIn, tokenIn.decimals);

    // ✅ Fix amountOutMin: pakai bigint math, hindari floating point error
    const amountOutRaw = parseUnits(
      Number(amountOut).toFixed(tokenOut.decimals),
      tokenOut.decimals
    );
    const slippageBps = BigInt(Math.round(slippage * 100)); // 0.5% → 50n
    const amountOutMin = (amountOutRaw * (10000n - slippageBps)) / 10000n;

    // ETH → Token
    if (tokenIn.isNative) {
      return await writeContractAsync({
        address: BASE_CONTRACTS.ROUTER as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'swapExactETHForTokens',
        args: [amountOutMin, path, walletAddress, deadline],
        value: amountInParsed,
      });
    }

    // ✅ Approve dulu sebelum Token → ETH / Token → Token
    await ensureAllowance(
      tokenIn.address as `0x${string}`,
      walletAddress,
      BASE_CONTRACTS.ROUTER as `0x${string}`,
      amountInParsed,
    );

    // Token → ETH
    if (tokenOut.isNative) {
      return await writeContractAsync({
        address: BASE_CONTRACTS.ROUTER as `0x${string}`,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForETH',
        args: [amountInParsed, amountOutMin, path, walletAddress, deadline],
      });
    }

    // Token → Token
    return await writeContractAsync({
      address: BASE_CONTRACTS.ROUTER as `0x${string}`,
      abi: ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [amountInParsed, amountOutMin, path, walletAddress, deadline],
    });
  };

  return { swap, txHash, isPending, isConfirming, isSuccess, error, reset };
}