'use client';

import dynamic from 'next/dynamic';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { AuthKitProvider, AuthKitConfig } from '@farcaster/auth-kit'; // Tambahkan AuthKitConfig
import { MiniAppProvider } from '@neynar/react';
import { ANALYTICS_ENABLED, RETURN_URL } from '~/lib/constants';

const WagmiProvider = dynamic(
  () => import('~/components/providers/WagmiProvider'),
  { ssr: false }
);

// Gunakan tipe AuthKitConfig agar TypeScript memvalidasi propertinya
const farcasterConfig: AuthKitConfig = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'localhost:3000', // Pastikan ganti ke domain asli saat sudah deploy
  siweUri: 'http://localhost:3000/api/auth/siwe',
};

export function Providers({ 
  children, 
  session 
}: { 
  children: React.ReactNode; 
  session?: Session | null; 
}) {
  return (
    <SessionProvider session={session}>
      <AuthKitProvider config={farcasterConfig}>
        <WagmiProvider>
          <MiniAppProvider
            analyticsEnabled={ANALYTICS_ENABLED}
            backButtonEnabled={true}
            returnUrl={RETURN_URL}
          >
            {children}
          </MiniAppProvider>
        </WagmiProvider>
      </AuthKitProvider>
    </SessionProvider>
  );
}