"use client";

import type { ReactNode } from "react";
import { ReactLenis } from "lenis/react";

type SmoothScrollProps = {
  children: ReactNode;
};

// Start Lenis on the window so wheel, trackpad, and touch scrolling feel the same
export default function SmoothScroll({ children }: SmoothScrollProps) {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.1,
        duration: 1.2,
        // Touch already scrolls natively; syncing it on iPhone can shift the page sideways
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
}
