import { createContext, useContext, useState, ReactNode } from 'react';
import { ClientConfig } from '../../data/types/client';
import { vwConfig } from '../../data/clients/vw/client.config';
import { audiConfig } from '../../data/clients/audi/client.config';

const CLIENTS: Record<string, ClientConfig> = { vw: vwConfig, audi: audiConfig };

interface ClientContextValue {
  client: ClientConfig;
  switchClient: (id: string) => void;
  availableClients: ClientConfig[];
}

const ClientContext = createContext<ClientContextValue | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<string>('vw');
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
