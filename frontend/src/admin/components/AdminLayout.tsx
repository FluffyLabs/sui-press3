import { Header } from "@fluffylabs/shared-ui";
import type { JSX, ReactNode } from "react";
import { WalletConnectButton } from "./WalletConnectButton";

interface AdminLayoutProps {
  children: ReactNode;
  headerEndSlot?: JSX.Element;
}

export function AdminLayout({ children, headerEndSlot }: AdminLayoutProps) {
  return (
    <div className="min-h-screen">
      <Header
        toolNameSrc="/press3-logo-256.png"
        ghRepoName="FluffyLabs/sui-press3"
        endSlot={
          <div className="flex items-center gap-3 mr-3">
            {headerEndSlot}
            <WalletConnectButton />
          </div>
        }
      />
      <div className={`max-w-[1280px] mx-auto p-4`}>{children}</div>
    </div>
  );
}
