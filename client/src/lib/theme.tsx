import { useEffect, useState } from "react";

const KEY = "shopsphere.theme";

/** Light/dark toggle. The initial class is set by an inline script in index.html to avoid a flash. */
export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(KEY, dark ? "dark" : "light");
    } catch {
      // Storage may be unavailable (private mode); the toggle still works for this visit.
    }
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}
