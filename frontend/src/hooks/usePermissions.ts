import { useCurrentAccount } from "@mysten/dapp-kit";
import { usePress3 } from "../providers/Press3Provider";

/**
 * Hook for checking user permissions based on wallet connection and admin/editor status.
 *
 * @returns Permission checking utilities and current user info
 */
export function usePermissions() {
  const { admins, getPageWithIndex } = usePress3();
  const currentAccount = useCurrentAccount();

  const currentAddress = currentAccount?.address ?? null;

  const isAdmin = currentAddress ? admins.includes(currentAddress) : false;

  const isPageEditor = (path: string): boolean => {
    if (!currentAddress) return false;
    const pageData = getPageWithIndex(path);
    if (!pageData) return false;
    return pageData.editors.includes(currentAddress);
  };

  const canEditPage = (path: string): boolean => {
    if (!currentAddress) return false;
    return isAdmin || isPageEditor(path);
  };

  return {
    currentAddress,
    isAdmin,
    isPageEditor,
    canEditPage,
  };
}
