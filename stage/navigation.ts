import { useEffect, useState } from "react";

export type Location = { path: string; search: string };

const readLocation = (): Location => ({
  path: window.location.pathname,
  search: window.location.search,
});

export function navigate(url: string, options: { replace?: boolean } = {}): void {
  if (options.replace) window.history.replaceState(null, "", url);
  else window.history.pushState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function useLocation(): Location {
  const [location, setLocation] = useState(readLocation);
  useEffect(() => {
    const onChange = (): void => setLocation(readLocation());
    window.addEventListener("popstate", onChange);
    return () => window.removeEventListener("popstate", onChange);
  }, []);
  return location;
}
