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

console.log("Default contract", {
  packageId: DEFAULT_PACKAGE_ID,
  objectId: DEFAULT_OBJECT_ID,
});

console.log("Wiki contract", {
  packageId:
    "0x7be9e3f9be03af1835fdbbe05812d32755393b175362f62b25bfafdc01f3e9d0",
  objectId:
    "0xec6ed6f322d9c94e60efdd832ecd769d2baefaf8e68f146b7231dec177a21350",
});

console.log("Using contract", {
  packageId: getPackageId(),
  objectId: getObjectId(),
});

console.log(
  "Local storage configuration entries",
  "localStorage.setItem('press3_package_id', '0x7be9e3f9be03af1835fdbbe05812d32755393b175362f62b25bfafdc01f3e9d0')",
  "localStorage.setItem('press3_object_id', '0xec6ed6f322d9c94e60efdd832ecd769d2baefaf8e68f146b7231dec177a21350')",
);

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
