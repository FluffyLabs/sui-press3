import { createNetworkConfig } from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { SuiClientProvider, WalletProvider as SuiWalletProvider } from "@mysten/dapp-kit";
import "@mysten/dapp-kit/dist/index.css";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Configure supported networks
const { networkConfig } = createNetworkConfig({
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

// Create a query client for React Query
const queryClient = new QueryClient();

interface WalletProviderProps {
  children: ReactNode;
}

/**
 * WalletProvider wraps the application with Sui wallet integration.
 * Provides wallet connection, account management, and transaction signing capabilities.
 */
export function WalletProvider({ children }: WalletProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <SuiWalletProvider autoConnect>
          {children}
        </SuiWalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}
