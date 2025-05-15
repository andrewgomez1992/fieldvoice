import { useEffect } from "react";

/**
 * useViewportHeight
 * -----------------
 * Ensures our CSS custom property `--vh` always reflects the true visible
 * viewport height (1% increments), instead of the full window height including
 * mobile browser chrome (address bar, toolbars) which can appear/disappear on scroll.
 *
 * On many mobile browsers, CSS `100vh` is calculated against the total window
 * size (including UI chrome), leading to unwanted jumps or extra scrollbars
 * when the browser UI resizes. By measuring `window.innerHeight` directly and
 * setting `--vh` to 1% of that value, we can then size containers via:
 *
 *     height: calc(var(--vh) * 100);
 *
 * ...and always fill exactly the visible area.
 */
export const useViewportHeight = () => {
  useEffect(() => {
    const setVh = () => {
      // 1% of the actual viewport height
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Initialize the value on mount
    setVh();
    // Keep it updated on resize/orientation change
    window.addEventListener("resize", setVh);
    return () => window.removeEventListener("resize", setVh);
  }, []);
};
