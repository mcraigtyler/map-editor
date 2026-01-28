import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrimeReactProvider } from 'primereact/api';
import { ReactNode, useMemo } from 'react';

type AppProvidersProps = {
  children: ReactNode;
};

const queryClient = new QueryClient();

export function AppProviders({ children }: AppProvidersProps) {
  const primeReactValue = useMemo(() => ({ ripple: true }), []);

  return (
    <PrimeReactProvider value={primeReactValue}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </PrimeReactProvider>
  );
}
