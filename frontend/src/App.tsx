import { HashRouter, Route, Routes } from "react-router-dom";
import Dev from "./Dev";
import { Page } from "./Page";
import { Press3Provider } from "./providers/Press3Provider";

const DEFAULT_PACKAGE_ID =
  "0xc394806a04aca8aecae8f8550d1a535f8d880924444da2bca0c8066e11e88ca5";

function getPackageId(): string {
  return localStorage.getItem("press3_package_id") ?? DEFAULT_PACKAGE_ID;
}

function App() {
  return (
    <Press3Provider packageId={getPackageId()}>
      <HashRouter>
        <Routes>
          <Route path="/dev" element={<Dev />} />
          <Route path="*" element={<Page />} />
        </Routes>
      </HashRouter>
    </Press3Provider>
  );
}

export default App;
