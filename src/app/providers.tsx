'use client';

import dynamic from 'next/dynamic';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { AuthKitProvider } from '@farcaster/auth-kit'; // Hapus AuthKitConfig dari sini
import { MiniAppProvider } from '@neynar/react';
import { ANALYTICS_ENABLED, RETURN_URL } from '~/lib/constants';

const WagmiProvider = dynamic(
  () => import('~/components/providers/WagmiProvider'),
  { ssr: false }
);

// Gunakan 'any' karena library tidak mengekspor tipe config secara publik
const farcasterConfig: any = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'localhost:3000', 
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