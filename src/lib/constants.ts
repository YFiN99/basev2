import { type AccountAssociation } from '@farcaster/miniapp-core/src/manifest';
export const APP_URL: string = process.env.NEXT_PUBLIC_URL!;
export const APP_NAME: string = 'CLAN';
export const APP_DESCRIPTION: string = 'CLAN - Swap on Base';
export const APP_PRIMARY_CATEGORY: string = 'Finance';
export const APP_TAGS: string[] = ['defi', 'swap', 'clan', 'base'];
export const APP_ICON_URL: string = `${APP_URL}/icon.png`;
export const APP_OG_IMAGE_URL: string = `${APP_URL}/api/opengraph-image`;
export const APP_SPLASH_URL: string = `${APP_URL}/splash.png`;
export const APP_SPLASH_BACKGROUND_COLOR: string = '#000000';
export const APP_ACCOUNT_ASSOCIATION: AccountAssociation = {
  header: "eyJmaWQiOjM4NjUwMSwidHlwZSI6ImF1dGgiLCJrZXkiOiIweDIzRjM5MTBDNjVjNWYzMjY5M0ZlRDlmMTM4MzM1ZDlCMURkQmE3NDEifQ",
  payload: "eyJkb21haW4iOiJhaXJkcm9wLW9saXZlLnZlcmNlbC5hcHAifQ",
  signature: "tWPVV3SBAXT3T42ZaXJFQnuP7E6mUewzjEMNpG7qCgpljC5o5QmjlYNpJqkXGzsENY42Xd58da6NC++0vHgA6hw="
};
export const APP_BUTTON_TEXT: string = 'Launch Mini App';
export const APP_WEBHOOK_URL: string =
  process.env.NEYNAR_API_KEY && process.env.NEYNAR_CLIENT_ID
    ? `https://api.neynar.com/f/app/${process.env.NEYNAR_CLIENT_ID}/event`
    : `${APP_URL}/api/webhook`;
export const USE_WALLET: boolean = true;
export const ANALYTICS_ENABLED: boolean = true;
export const APP_REQUIRED_CHAINS: string[] = ['eip155:8453'];
export const RETURN_URL: string | undefined = undefined;
export const BASE_CONTRACTS = {
  ROUTER:  '0x326004cD6328F98A672aDB3D0E0FEEC2c508c7FE' as `0x${string}`,
  FACTORY: '0xb89A03862a429A598182f9204612677798C1F84B' as `0x${string}`,
  WETH:    '0x4200000000000000000000000000000000000006' as `0x${string}`,
} as const;
export interface Token {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  logoColor: string;
  logoText: string;
  isNative?: boolean;
}
export const BASE_TOKENS: Token[] = [
  { symbol: 'ETH',   name: 'Ethereum',            address: '0x4200000000000000000000000000000000000006', decimals: 18, logoColor: '#627EEA', logoText: '⟠', isNative: true },
  { symbol: 'USDC',  name: 'USD Coin',             address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6,  logoColor: '#2775CA', logoText: '$' },
  { symbol: 'DAI',   name: 'Dai Stablecoin',       address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, logoColor: '#F5A623', logoText: '◈' },
  { symbol: 'WETH',  name: 'Wrapped Ether',        address: '0x4200000000000000000000000000000000000006', decimals: 18, logoColor: '#627EEA', logoText: 'W' },
  { symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', decimals: 8,  logoColor: '#F7931A', logoText: '₿' },
  { symbol: 'USDT',  name: 'Tether USD',           address: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2', decimals: 6,  logoColor: '#26A17B', logoText: '₮' },
];
export const TOKEN_DECIMALS = { ETH: 18, WETH: 18, USDC: 6, DAI: 18, USDT: 6, cbBTC: 8 } as const;
export const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: 'Farcaster SignedKeyRequestValidator', version: '1', chainId: 10,
  verifyingContract: '0x00000000fc700472606ed4fa22623acf62c60553' as `0x${string}`,
};
export const SIGNED_KEY_REQUEST_TYPE = [
  { name: 'requestFid', type: 'uint256' },
  { name: 'key', type: 'bytes' },
  { name: 'deadline', type: 'uint256' },
];
