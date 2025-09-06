import { useEffect, useState } from "react";

export const useSafeArea = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      const top = parseInt(computedStyle.getPropertyValue("--sat") || "0");
      const right = parseInt(computedStyle.getPropertyValue("--sar") || "0");
      const bottom = parseInt(computedStyle.getPropertyValue("--sab") || "0");
      const left = parseInt(computedStyle.getPropertyValue("--sal") || "0");

      setSafeAreaInsets({ top, right, bottom, left });
    };

    // Check if CSS environment variables are supported
    if (CSS.supports("padding: env(safe-area-inset-top)")) {
      updateSafeArea();
    }

    // Listen for orientation changes
    window.addEventListener("orientationchange", updateSafeArea);
    window.addEventListener("resize", updateSafeArea);

    return () => {
      window.removeEventListener("orientationchange", updateSafeArea);
      window.removeEventListener("resize", updateSafeArea);
    };
  }, []);

  return safeAreaInsets;
};
