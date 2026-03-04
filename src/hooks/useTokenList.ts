import { useState, useEffect } from 'react';
import { Token } from '~/lib/constants';

// Token list dari Base yang sudah diverifikasi (fallback)
const STATIC_BASE_TOKENS: Token[] = [
  { symbol: 'ETH',    name: 'Ethereum',            address: '0x4200000000000000000000000000000000000006', decimals: 18, logoColor: '#627EEA', logoText: '⟠', isNative: true },
  { symbol: 'CLAN',   name: 'Clan',                address: '0x7f05783BAeC7193d10A2687AB372A64AB6C30B07', decimals: 18, logoColor: '#222222', logoText: '🐉' },
  { symbol: 'USDC',   name: 'USD Coin',             address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6,  logoColor: '#2775CA', logoText: '$' },
  { symbol: 'WETH',   name: 'Wrapped Ether',        address: '0x4200000000000000000000000000000000000006', decimals: 18, logoColor: '#627EEA', logoText: 'W' },
  { symbol: 'DAI',    name: 'Dai Stablecoin',       address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, logoColor: '#F5A623', logoText: '◈' },
  { symbol: 'USDT',   name: 'Tether USD',           address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6,  logoColor: '#26A17B', logoText: '₮' },
  { symbol: 'cbBTC',  name: 'Coinbase Wrapped BTC', address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', decimals: 8,  logoColor: '#F7931A', logoText: '₿' },
  { symbol: 'BRETT',  name: 'Brett',                address: '0x532f27101965dd16442E59d40670FaF5eBB142E4', decimals: 18, logoColor: '#4CAF50', logoText: 'B' },
  { symbol: 'DEGEN',  name: 'Degen',                address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18, logoColor: '#A855F7', logoText: 'D' },
  { symbol: 'AERO',   name: 'Aerodrome',            address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, logoColor: '#FF4D4D', logoText: 'A' },
  { symbol: 'cbETH',  name: 'Coinbase Wrapped ETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18, logoColor: '#0052FF', logoText: 'cb' },
  { symbol: 'TOSHI',  name: 'Toshi',                address: '0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4', decimals: 18, logoColor: '#FF8C00', logoText: 'T' },
  { symbol: 'WELL',   name: 'Moonwell',             address: '0xA88594D404727625A9437C3f886C7643872296AE', decimals: 18, logoColor: '#6366F1', logoText: 'W' },
  { symbol: 'MORPHO', name: 'Morpho',               address: '0xBAa5CC21fd487B8Fcc2F632f8F4e3f4dc4a5D5f2', decimals: 18, logoColor: '#00C2FF', logoText: 'M' },
  { symbol: 'SNX',    name: 'Synthetix',            address: '0x22e6966B799c4D5B13BE962E1D117b56327FDa66', decimals: 18, logoColor: '#00D1FF', logoText: 'S' },
  { symbol: 'PRIME',  name: 'Echelon Prime',        address: '0xfA980cEd6895AC314E7dE34Ef1bFAE90a5AdD21', decimals: 18, logoColor: '#FFD700', logoText: 'P' },
];

// Token yang wajib selalu ada (pinned), tidak tergantikan oleh CoinGecko
const PINNED_TOKENS: Token[] = [
  { symbol: 'CLAN', name: 'Clan', address: '0x7f05783BAeC7193d10A2687AB372A64AB6C30B07', decimals: 18, logoColor: '#222222', logoText: '🐉' },
];

// Ambil warna dari symbol
function getLogoColor(symbol: string): string {
  const colors: Record<string, string> = {
    ETH: '#627EEA', BTC: '#F7931A', USDC: '#2775CA', USDT: '#26A17B',
    DAI: '#F5A623', MATIC: '#8247E5', SOL: '#9945FF', BNB: '#F3BA2F',
    AVAX: '#E84142', LINK: '#2A5ADA', UNI: '#FF007A', AAVE: '#B6509E',
    CRV: '#3466AA', COMP: '#00D395', MKR: '#1AAB9B', SNX: '#00D1FF',
    default: '#888888',
  };
  return colors[symbol.toUpperCase()] ?? colors.default;
}

// Fetch top tokens Base dari CoinGecko
async function fetchBaseTokens(): Promise<Token[]> {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=base-ecosystem&order=market_cap_desc&per_page=100&page=1&sparkline=false',
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) throw new Error('CoinGecko fetch failed');
    const data = await res.json();

    const tokens: Token[] = [];
    for (const coin of data) {
      const detailRes = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`,
        { next: { revalidate: 3600 } }
      );
      if (!detailRes.ok) continue;
      const detail = await detailRes.json();
      const baseAddress = detail?.detail_platforms?.base?.contract_address;
      if (!baseAddress) continue;

      tokens.push({
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        address: baseAddress as `0x${string}`,
        decimals: detail?.detail_platforms?.base?.decimal_place ?? 18,
        logoColor: getLogoColor(coin.symbol),
        logoText: coin.symbol.slice(0, 2).toUpperCase(),
      });

      if (tokens.length >= 50) break;
    }

    if (tokens.length > 0) {
      // Gabung: pinned tokens di atas, lalu hasil CoinGecko (tanpa duplikat)
      const pinnedSymbols = new Set(PINNED_TOKENS.map(t => t.symbol));
      const filtered = tokens.filter(t => !pinnedSymbols.has(t.symbol));
      return [...PINNED_TOKENS, ...filtered];
    }

    return STATIC_BASE_TOKENS;
  } catch (e) {
    console.error('Failed to fetch token list, using static list:', e);
    return STATIC_BASE_TOKENS;
  }
}

// Hook utama
export function useTokenList() {
  const [tokens, setTokens] = useState<Token[]>(STATIC_BASE_TOKENS);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const cached = sessionStorage.getItem('base_token_list');
    const cachedTime = sessionStorage.getItem('base_token_list_time');
    const ONE_HOUR = 60 * 60 * 1000;

    if (cached && cachedTime && Date.now() - Number(cachedTime) < ONE_HOUR) {
      setTokens(JSON.parse(cached));
      return;
    }

    setIsLoading(true);
    fetchBaseTokens().then((list) => {
      setTokens(list);
      sessionStorage.setItem('base_token_list', JSON.stringify(list));
      sessionStorage.setItem('base_token_list_time', String(Date.now()));
      setIsLoading(false);
    });
  }, []);

  return { tokens, isLoading };
}
