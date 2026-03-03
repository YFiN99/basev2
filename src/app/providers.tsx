'use client';

import dynamic from 'next/dynamic';
import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { AuthKitProvider } from '@farcaster/auth-kit'; // Pastikan ini ada
import { MiniAppProvider } from '@neynar/react';
import { ANALYTICS_ENABLED, RETURN_URL } from '~/lib/constants';

const WagmiProvider = dynamic(
  () => import('~/components/providers/WagmiProvider'),
  { ssr: false }
);

export function Providers({ 
  children, 
  session 
}: { 
  children: React.ReactNode; 
  session?: Session | null; 
}) {
  return (
    <SessionProvider session={session}>
      <AuthKitProvider>
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