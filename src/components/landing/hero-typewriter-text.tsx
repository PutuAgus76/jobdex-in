"use client";

import { useState, useEffect } from "react";

const cyclingWords = [
  "terorganisir",
  "terpantau",
  "tepat waktu",
  "transparan",
  "terarsipkan",
  "terkontrol",
];

export function HeroTypewriterText() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Detect reduced motion preference asynchronously
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hasReducedMotion = mediaQuery.matches;

    const timer = setTimeout(() => {
      if (hasReducedMotion) {
        setPrefersReducedMotion(true);
      }
    }, 0);

    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", listener);
    return () => {
      clearTimeout(timer);
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (prefersReducedMotion) {
      const timer = setTimeout(() => {
        setDisplayText(cyclingWords[0] + ".");
      }, 0);
      return () => clearTimeout(timer);
    }

    const currentWord = cyclingWords[wordIndex] + ".";
    let timer: NodeJS.Timeout;

    if (isDeleting) {
      // Deleting character
      timer = setTimeout(() => {
        setDisplayText((prev) => prev.slice(0, -1));
      }, 50); // deleting speed: 40-60ms
    } else {
      // Typing character
      timer = setTimeout(() => {
        setDisplayText((prev) => currentWord.slice(0, prev.length + 1));
      }, 80); // typing speed: 70-90ms
    }

    // State transitions
    if (!isDeleting && displayText === currentWord) {
      // Pause at full word
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 1400); // pause after complete: 1200-1600ms
    } else if (isDeleting && displayText === "") {
      timer = setTimeout(() => {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % cyclingWords.length);
      }, 0);
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, wordIndex, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <span className="text-sky-600">terorganisir.</span>;
  }

  return (
    <span className="inline-flex items-baseline">
      <span
        className="inline-block text-sky-600 text-left transition-all duration-300"
        style={{ minWidth: "13.5ch" }}
      >
        {displayText}
      </span>
      <span className="text-sky-600 font-light animate-typewriter-blink ml-0.5 select-none">
        |
      </span>
    </span>
  );
}
