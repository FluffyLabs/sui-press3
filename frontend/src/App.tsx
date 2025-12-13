import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dev from "./Dev";
import Home from "./Home";
import { Press3Provider } from "./providers/Press3Provider";

const PACKAGE_ID =
  "0xc394806a04aca8aecae8f8550d1a535f8d880924444da2bca0c8066e11e88ca5";

function App() {
  return (
    <Press3Provider packageId={PACKAGE_ID}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dev" element={<Dev />} />
        </Routes>
      </BrowserRouter>
    </Press3Provider>
  );
}

export default App;
