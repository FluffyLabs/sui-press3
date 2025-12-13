import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Dev from "./Dev";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dev" element={<Dev />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
