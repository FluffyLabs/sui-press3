import { BrowserRouter, Route, Routes } from "react-router-dom";
import Admin from "./admin/Admin";
import { PageEditor } from "./admin/components/PageEditor";
import Dev from "./Dev";
import { Page } from "./Page";
import { Press3Provider } from "./providers/Press3Provider";

const DEFAULT_PACKAGE_ID =
  "0xc394806a04aca8aecae8f8550d1a535f8d880924444da2bca0c8066e11e88ca5";

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
    <Press3Provider packageId={getPackageId()}>
      <BrowserRouter>
        <Routes>
          <Route path="/dev" element={<Dev />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/edit/:pageId" element={<PageEditor />} />
          <Route path="*" element={<Page />} />
        </Routes>
      </BrowserRouter>
    </Press3Provider>
  );
}

export default App;
