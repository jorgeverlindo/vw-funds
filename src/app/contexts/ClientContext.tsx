import { createContext, useContext, useState, ReactNode } from 'react';
import { ClientConfig } from '../../data/types/client';
import { vwConfig } from '../../data/clients/vw/client.config';
import { audiConfig } from '../../data/clients/audi/client.config';
import { rideNowConfig } from '../../data/clients/ride-now/client.config';

const CLIENTS: Record<string, ClientConfig> = { vw: vwConfig, audi: audiConfig, 'ride-now': rideNowConfig };

interface ClientContextValue {
  client: ClientConfig;
  switchClient: (id: string) => void;
  availableClients: ClientConfig[];
}

const ClientContext = createContext<ClientContextValue | null>(null);

/** Derive initial client from the URL so deep-links and reloads start in the right context. */
function getInitialClientId(): string {
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith('/ride-now/') || path.startsWith('/ride-now')) return 'ride-now';
  if (path.startsWith('/audi/'))  return 'audi';
  return 'vw';
}

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<string>(getInitialClientId);
  const client = CLIENTS[clientId] ?? vwConfig;

  return (
    <ClientContext.Provider value={{
      client,
      switchClient: setClientId,
      availableClients: Object.values(CLIENTS),
    }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const ctx = useContext(ClientContext);
  if (!ctx) throw new Error('useClient must be used inside ClientProvider');
  return ctx;
}
