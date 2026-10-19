import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MapPage } from "./pages/MapPage";
import { About } from "./pages/About";
import { Rules, RuleDetail } from "./pages/Rules";
import { Sources } from "./pages/Sources";
import { NotFound, Ranges, Terms } from "./pages/Static";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/rules" element={<Rules />} />
        <Route path="/rules/:id" element={<RuleDetail />} />
        <Route path="/sources" element={<Sources />} />
        <Route path="/ranges" element={<Ranges />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
