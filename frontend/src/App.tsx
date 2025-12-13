import { HashRouter, Route, Routes } from "react-router-dom";
import Dev from "./Dev";
import Home from "./Home";

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dev" element={<Dev />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
