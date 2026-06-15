"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  distance = 24,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    let frame: number | null = null;
    let observer: IntersectionObserver | null = null;

    const cleanup = () => {
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
        frame = null;
      }

      observer?.disconnect();
      window.removeEventListener("scroll", scheduleCheck);
      window.removeEventListener("resize", scheduleCheck);
    };

    const reveal = () => {
      setIsVisible(true);
      cleanup();
    };

    const checkVisibility = () => {
      const rect = element.getBoundingClientRect();
      const triggerPoint = window.innerHeight * 0.9;

      if (rect.top <= triggerPoint && rect.bottom >= 0) {
        reveal();
      }
    };

    function scheduleCheck() {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        checkVisibility();
      });
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          reveal();
        }
      },
      {
        rootMargin: "0px 0px -10% 0px",
        threshold: 0.05,
      },
    );

    observer.observe(element);
    window.addEventListener("scroll", scheduleCheck, { passive: true });
    window.addEventListener("resize", scheduleCheck);
    scheduleCheck();

    return cleanup;
  }, []);

  const style = {
    opacity: isVisible ? 1 : 0,
    transform: isVisible
      ? "translate3d(0, 0, 0)"
      : `translate3d(0, ${distance}px, 0)`,
    filter: isVisible ? "blur(0)" : "blur(2px)",
    transitionProperty: "opacity, transform, filter",
    transitionDuration: "700ms",
    transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
    transitionDelay: `${delay}ms`,
    willChange: "opacity, transform, filter",
  } as CSSProperties;

  return (
    <div
      ref={ref}
      data-reveal={isVisible ? "visible" : "hidden"}
      style={style}
      className={cn("transform-gpu", className)}
    >
      {children}
    </div>
  );
}
