import { BrowserRouter, Route, Routes } from "react-router-dom";
import Admin from "./admin/Admin";
import { PageCreate } from "./admin/components/PageCreate";
import { PageEditor } from "./admin/components/PageEditor";
import Dev from "./Dev";
import { Page } from "./Page";
import { LayoutProvider } from "./providers/LayoutProvider";
import { Press3Provider } from "./providers/Press3Provider";
import { WalletProvider } from "./providers/WalletProvider";
import "@fluffylabs/shared-ui/style.css";


const DEFAULT_PACKAGE_ID =
  "0xb23a6a6687bd1af39d5a2ac6739a7d36e331d6b0b39446101a59748c65ba58a8";
const DEFAULT_OBJECT_ID =
  "0x10c798b604846b4eace4f2966c1a93f07d49dce129dad99052fffc165fff36d3";

export function getSetEditors(): string {
  /// old version
  if (getPackageId() === '0xb23a6a6687bd1af39d5a2ac6739a7d36e331d6b0b39446101a59748c65ba58a8') {
    return 'set_editor';
  }
  return 'set_editors';
}

function getPackageId(): string {
  // Priority: localStorage > env variable > hardcoded default
  return (
    localStorage.getItem("press3_package_id") ??
    import.meta.env.VITE_PRESS3_PACKAGE_ID ??
    DEFAULT_PACKAGE_ID
  );
}

function getObjectId(): string {
  // Priority: localStorage > env variable > hardcoded default
  return (
    localStorage.getItem("press3_object_id") ??
    import.meta.env.VITE_PRESS3_OBJECT_ID ??
    DEFAULT_OBJECT_ID
  );
}

function App() {
  return (
    <WalletProvider>
      <Press3Provider packageId={getPackageId()} objectId={getObjectId()}>
        <BrowserRouter>
          <LayoutProvider>
            <Routes>
              <Route path="/dev" element={<Dev />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/create" element={<PageCreate />} />
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
