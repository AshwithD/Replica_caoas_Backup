import { useEffect, useState } from "react";

// Tiny hash-based router — no react-router needed, and deep links work on
// any static host without a try_files fallback.

export function parseHash() {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query] = raw.split("?");
  return { path: path || "/", params: new URLSearchParams(query || "") };
}

export function navigate(to) {
  window.location.hash = to.startsWith("#") ? to.slice(1) : to;
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash());
  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
