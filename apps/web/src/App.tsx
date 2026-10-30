import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MapPage } from "./pages/MapPage";
import { About } from "./pages/About";
import { Rules, RuleDetail } from "./pages/Rules";
import { Sources } from "./pages/Sources";
import { NotFound, Ranges, Terms } from "./pages/Static";

// The map editor (and its geometry library) loads only when someone opens it.
const Editor = lazy(() => import("./pages/Editor").then((m) => ({ default: m.Editor })));
const editor = (
  <Suspense fallback={<p className="hint" style={{ padding: 24 }}>Loading the map editor…</p>}>
    <Editor />
  </Suspense>
);

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/editor" element={editor} />
        <Route path="/editor/:kind/:id" element={editor} />
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
