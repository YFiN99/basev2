'use client';

import dynamic from 'next/dynamic';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { AuthKitProvider } from '@farcaster/auth-kit';
import { MiniAppProvider } from '@neynar/react';
import { ANALYTICS_ENABLED, RETURN_URL } from '~/lib/constants';

const WagmiProvider = dynamic(
  () => import('~/components/providers/WagmiProvider'),
  { ssr: false }
);

// Konfigurasi minimal untuk Farcaster AuthKit
const farcasterConfig = {
  rpcUrl: 'https://mainnet.optimism.io', // Sesuaikan jika perlu rpc lain
  domain: 'localhost:3000', // Ganti dengan domain asli kamu saat production (misal: 'basev2.vercel.app')
  siweUri: 'http://localhost:3000/api/auth/siwe', // Sesuaikan dengan endpoint SIWE kamu
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
      <AuthKitProvider config={farcasterConfig}> {/* Tambahkan properti config di sini */}
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