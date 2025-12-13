import { BrowserRouter, Route, Routes } from "react-router-dom";
import Admin from "./admin/Admin";
import { PageEditor } from "./admin/components/PageEditor";
import Dev from "./Dev";
import { Page } from "./Page";
import { LayoutProvider } from "./providers/LayoutProvider";
import { Press3Provider } from "./providers/Press3Provider";
import { WalletProvider } from "./providers/WalletProvider";
import "@fluffylabs/shared-ui/style.css";

const DEFAULT_PACKAGE_ID =
  "0xb23a6a6687bd1af39d5a2ac6739a7d36e331d6b0b39446101a59748c65ba58a8";

function getPackageId(): string {
  // Priority: localStorage > env variable > hardcoded default
  return (
    localStorage.getItem("press3_package_id") ??
    import.meta.env.VITE_PRESS3_PACKAGE_ID ??
    DEFAULT_PACKAGE_ID
  );
}

function App() {
  return (
    <WalletProvider>
      <Press3Provider packageId={getPackageId()}>
        <BrowserRouter>
          <LayoutProvider>
            <Routes>
              <Route path="/dev" element={<Dev />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/edit/:pageId" element={<PageEditor />} />
              <Route path="*" element={<Page />} />
            </Routes>
          </LayoutProvider>
        </BrowserRouter>
      </Press3Provider>
    </WalletProvider>
  );
}

export default App;
