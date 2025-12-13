import { Header } from "@fluffylabs/shared-ui";
import type { JSX, ReactNode } from "react";

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
        endSlot={headerEndSlot}
      />
      <div className={`max-w-[1280px] mx-auto p-4`}>{children}</div>
    </div>
  );
}
