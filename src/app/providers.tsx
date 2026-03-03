'use client';

import dynamic from 'next/dynamic';
import { MiniAppProvider } from '@neynar/react';
import { SessionProvider } from 'next-auth/react'; // Tambahkan ini
import { ANALYTICS_ENABLED, RETURN_URL } from '~/lib/constants';

const WagmiProvider = dynamic(
  () => import('~/components/providers/WagmiProvider'),
  { ssr: false }
);

// Tambahkan session di dalam destructuring props dan beri tipe data
export function Providers({ 
  children, 
  session 
}: { 
  children: React.ReactNode; 
  session?: any; // Tambahkan baris ini
}) {
  return (
    <SessionProvider session={session}>
      <WagmiProvider>
        <MiniAppProvider
          analyticsEnabled={ANALYTICS_ENABLED}
          backButtonEnabled={true}
          returnUrl={RETURN_URL}
        >
          {children}
        </MiniAppProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}