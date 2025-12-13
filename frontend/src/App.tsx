import { HashRouter, Route, Routes } from "react-router-dom";
import Dev from "./Dev";
import Home from "./Home";
import Admin from "./admin/Admin";
import { PageEditor } from "./admin/components/PageEditor";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dev" element={<Dev />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/edit/:pageId" element={<PageEditor />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
