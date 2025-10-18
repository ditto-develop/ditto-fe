"use client";

import { useEffect, useState } from "react";

type DeviceType = "desktop" | "tablet" | "mobile";

export default function useDeviceType(): DeviceType {
  const [device, setDevice] = useState<DeviceType>("desktop");

  useEffect(() => {
    function detectDeviceType(): DeviceType {
      const ua = navigator.userAgent || navigator.vendor || "";

      if (/android.+mobile|iphone|ipod|blackberry|bb10|mini|windows phone|iemobile|opera mini/i.test(ua))
        return "mobile";
      if (/ipad|tablet|android(?!.*mobile)/i.test(ua))
        return "tablet";

      // 포인터/터치 기반
      if (window.matchMedia && window.matchMedia("(pointer:coarse)").matches) {
        const width = Math.max(window.innerWidth, window.screen.width);
        return width >= 900 ? "tablet" : "mobile";
      }

      const width = Math.max(window.innerWidth, window.screen.width);
      if (width <= 767) return "mobile";
      if (width <= 1024) return "tablet";

      return "desktop";
    }

    setDevice(detectDeviceType());
  }, []);

  return device;
}
