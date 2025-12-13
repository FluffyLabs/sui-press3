import { Button } from "@fluffylabs/shared-ui";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";

/**
 * Wallet connect button that integrates with the admin UI.
 * Shows connection status and allows users to connect/disconnect their wallet.
 */
export function WalletConnectButton() {
  const currentAccount = useCurrentAccount();

  if (currentAccount) {
    return (
      <div className="flex items-center gap-2">
        <ConnectButton />
      </div>
    );
  }

  return (
    <ConnectButton>
      <Button variant="primary">Connect Wallet</Button>
    </ConnectButton>
  );
}
