import { useReadContract, usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';
import { useEffect, useState } from 'react';
import { Token } from '~/lib/constants';

const ERC20_ABI = [{
  name: 'balanceOf',
  type: 'function',
  stateMutability: 'view',
  inputs: [{ name: 'account', type: 'address' }],
  outputs: [{ name: 'balance', type: 'uint256' }],
}] as const;

export function useTokenBalance(token: Token | null, address?: `0x${string}`) {
  const isNative = token?.isNative ?? false;
  const publicClient = usePublicClient({ chainId: 8453 });

  // ✅ ETH native: pakai eth_getBalance manual via publicClient
  const [ethNativeBalance, setEthNativeBalance] = useState<bigint | null>(null);
  const [ethNativeLoading, setEthNativeLoading] = useState(false);

  useEffect(() => {
    if (!address || !isNative || !publicClient) return;

    let cancelled = false;
    setEthNativeLoading(true);

    publicClient.getBalance({ address })
      .then((bal) => {
        if (!cancelled) {
          setEthNativeBalance(bal);
          setEthNativeLoading(false);
        }
      })
      .catch((err) => {
        console.error('[eth_getBalance error]', err);
        if (!cancelled) setEthNativeLoading(false);
      });

    // Refetch setiap 15 detik
    const interval = setInterval(() => {
      publicClient.getBalance({ address })
        .then((bal) => { if (!cancelled) setEthNativeBalance(bal); })
        .catch(() => {});
    }, 15_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [address, isNative, publicClient]);

  // ERC20 tetap pakai useReadContract
  const {
    data: erc20Balance,
    isLoading: erc20Loading,
    isFetching: erc20Fetching,
    isSuccess: erc20Success,
  } = useReadContract({
    address: token?.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : ['0x0000000000000000000000000000000000000000'],
    chainId: 8453,
    query: {
      enabled: !!address && !!token && !isNative,
      staleTime: 10_000,
      refetchInterval: 15_000,
    },
  });

  if (!token || !address) {
    return { balance: '0', formatted: '0.0000', isLoading: false };
  }

  const isLoading = isNative
    ? ethNativeLoading
    : (erc20Loading || erc20Fetching);

  if (isLoading) {
    return { balance: '0', formatted: '...', isLoading: true };
  }

  // Native ETH
  if (isNative) {
    if (ethNativeBalance !== null) {
      const formatted = formatUnits(ethNativeBalance, 18);
      return {
        balance: ethNativeBalance.toString(),
        formatted: Number(formatted).toFixed(4),
        isLoading: false,
      };
    }
    return { balance: '0', formatted: '0.0000', isLoading: false };
  }

  // ERC20
  if (erc20Success && erc20Balance !== undefined) {
    const formatted = formatUnits(erc20Balance as bigint, token.decimals);
    return {
      balance: (erc20Balance as bigint).toString(),
      formatted: Number(formatted).toFixed(4),
      isLoading: false,
    };
  }

  return { balance: '0', formatted: '0.0000', isLoading: false };
}