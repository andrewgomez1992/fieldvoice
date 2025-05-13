import { useLayoutEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);

  useLayoutEffect(() => {
    // only scroll on a *real* route change
    if (prevPath.current !== pathname) {
      window.scrollTo(0, 0);
      prevPath.current = pathname;
    }
  }, [pathname]);

  return null;
}
