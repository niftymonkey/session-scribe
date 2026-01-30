import { useEffect, useState } from "react";

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.0;
const STORAGE_KEY = "app-zoom-level";

export function useZoom() {
  const [zoom, setZoom] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? parseFloat(stored) : 1.0;
  });

  useEffect(() => {
    document.documentElement.style.fontSize = `${zoom * 100}%`;
    localStorage.setItem(STORAGE_KEY, zoom.toString());
  }, [zoom]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
      } else if (e.key === "-") {
        e.preventDefault();
        setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoom(1.0);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;

      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP));
      } else {
        setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
    };
  }, []);

  return zoom;
}
