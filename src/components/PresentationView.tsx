"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface PresentationBlockData {
  id: string;
  order: number;
  layout: string;
  bgColor: string;
  align: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  text: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
  active: boolean;
}

/** Background presets mapped to the store's brand palette. */
function bgClasses(bgColor: string): { section: string; dark: boolean } {
  switch (bgColor) {
    case "light":
      return { section: "bg-bg-light text-text-dark", dark: false };
    case "gradient":
      return { section: "pres-animated-gradient text-text-dark", dark: false };
    case "primary":
      return { section: "bg-gradient-to-br from-primary to-primary-dark text-white", dark: true };
    case "accent":
      return { section: "bg-gradient-to-br from-accent to-accent-dark text-white", dark: true };
    case "dark":
      return { section: "bg-text-dark text-white", dark: true };
    case "white":
    default:
      return { section: "bg-bg-white text-text-dark", dark: false };
  }
}

/** Split a multi-line string into rows of "|"-separated parts. */
function parseRows(text: string): string[][] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("|").map((p) => p.trim()));
}

function CtaButton({ text, link, dark }: { text: string; link: string; dark: boolean }) {
  if (!text) return null;
  const base = "inline-flex items-center gap-2 font-bold px-8 py-3.5 rounded-xl transition-all text-sm sm:text-base shadow-md hover:shadow-xl hover:-translate-y-0.5";
  const style = dark
    ? "bg-white text-primary hover:bg-white/90"
    : "bg-primary hover:bg-primary-dark text-white";
  const cls = `${base} ${style}`;
  const arrow = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  );
  if (/^https?:\/\//.test(link)) {
    return (
      <a href={link} className={cls} target="_blank" rel="noopener noreferrer">
        {text} {arrow}
      </a>
    );
  }
  return (
    <Link href={link || "#"} className={cls}>
      {text} {arrow}
    </Link>
  );
}

function Eyebrow({ text, dark }: { text: string; dark: boolean }) {
  if (!text) return null;
  return (
    <span
      className={`inline-block text-xs sm:text-sm font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 ${
        dark ? "bg-white/15 text-white" : "bg-primary/10 text-primary"
      }`}
    >
      {text}
    </span>
  );
}

/** A styled placeholder shown when a block has no uploaded image. */
function MediaPlaceholder() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-primary/10 via-bg-light to-accent/10 border border-border flex items-center justify-center">
      <div className="pres-float absolute -top-8 -left-8 w-40 h-40 rounded-full bg-primary/15 blur-2xl" />
      <div className="pres-float-slow absolute -bottom-10 -right-6 w-48 h-48 rounded-full bg-accent/15 blur-2xl" />
      <svg className="w-20 h-20 text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </div>
  );
}

function Media({ src, alt }: { src: string; alt: string }) {
  if (!src) return <MediaPlaceholder />;
  return (
    <div className="relative w-full rounded-3xl overflow-hidden border border-border shadow-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="w-full h-full object-cover img-zoom" loading="lazy" />
    </div>
  );
}

function BlockContent({ block, dark }: { block: PresentationBlockData; dark: boolean }) {
  const alignCls = block.align === "center" ? "text-center items-center" : "text-left items-start";
  return (
    <div className={`flex flex-col ${alignCls}`}>
      <Eyebrow text={block.eyebrow} dark={dark} />
      {block.title && (
        <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mb-4">
          {block.title}
        </h2>
      )}
      {block.subtitle && (
        <p className={`text-base sm:text-lg mb-5 leading-relaxed ${dark ? "text-white/85" : "text-text-gray"}`}>
          {block.subtitle}
        </p>
      )}
      {block.text &&
        block.text
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, i) => (
            <p key={i} className={`text-sm sm:text-base mb-3 leading-relaxed ${dark ? "text-white/80" : "text-text-gray"}`}>
              {line}
            </p>
          ))}
      {block.buttonText && (
        <div className="mt-4">
          <CtaButton text={block.buttonText} link={block.buttonLink} dark={dark} />
        </div>
      )}
    </div>
  );
}

// Matches an optional prefix, a number (digits with optional inner spaces, but
// never a trailing space), and an optional suffix. Keeps the space before a
// unit intact: "10 000+" -> ["", "10 000", "+"], "5 лет" -> ["", "5", " лет"].
const COUNTER_RE = /^([^\d]*)(\d[\d\s]*\d|\d)(.*)$/;

function AnimatedCounter({ value }: { value: string }) {
  const match = value.match(COUNTER_RE);
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(() => {
    if (!match) return value;
    const target = parseInt(match[2].replace(/\s/g, ""), 10);
    return Number.isNaN(target) ? match[2] : "0";
  });

  useEffect(() => {
    const m = value.match(COUNTER_RE);
    if (!m) return;
    const target = parseInt(m[2].replace(/\s/g, ""), 10);
    if (Number.isNaN(target)) return;
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        if (reduce) {
          setDisplay(target.toLocaleString("ru-RU"));
          return;
        }
        const duration = 1400;
        const start = performance.now();
        const step = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(target * eased).toLocaleString("ru-RU"));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  if (!match) return <span ref={ref}>{value}</span>;
  return (
    <span ref={ref}>
      {match[1]}
      {display}
      {match[3]}
    </span>
  );
}

function PresentationBlock({ block }: { block: PresentationBlockData }) {
  const { section, dark } = bgClasses(block.bgColor);
  const inner = "max-w-7xl mx-auto px-4 sm:px-6";

  let body: React.ReactNode;

  switch (block.layout) {
    case "hero":
      body = (
        <div className={`${inner} relative min-h-[78vh] flex flex-col items-center justify-center text-center py-20`}>
          <div className="pres-float absolute top-16 left-[8%] w-24 h-24 rounded-full bg-primary/20 blur-xl" aria-hidden />
          <div className="pres-float-slow absolute bottom-24 right-[10%] w-32 h-32 rounded-full bg-accent/20 blur-xl" aria-hidden />
          <div className="pres-reveal-scale is-visible relative z-10 max-w-3xl">
            <Eyebrow text={block.eyebrow} dark={dark} />
            {block.title && (
              <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-5">
                {block.title}
              </h1>
            )}
            {block.subtitle && (
              <p className={`text-base sm:text-xl mb-8 leading-relaxed ${dark ? "text-white/85" : "text-text-gray"}`}>
                {block.subtitle}
              </p>
            )}
            <CtaButton text={block.buttonText} link={block.buttonLink} dark={dark} />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pres-scroll-indicator" aria-hidden>
            <svg className={`w-7 h-7 ${dark ? "text-white/70" : "text-primary/60"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      );
      break;

    case "split-left":
      body = (
        <div className={`${inner} grid md:grid-cols-2 gap-10 lg:gap-16 items-center`}>
          <div className="pres-reveal-left order-2 md:order-1">
            <Media src={block.imageUrl} alt={block.title || "Изображение"} />
          </div>
          <div className="pres-reveal-right order-1 md:order-2">
            <BlockContent block={block} dark={dark} />
          </div>
        </div>
      );
      break;

    case "split-right":
      body = (
        <div className={`${inner} grid md:grid-cols-2 gap-10 lg:gap-16 items-center`}>
          <div className="pres-reveal-left">
            <BlockContent block={block} dark={dark} />
          </div>
          <div className="pres-reveal-right">
            <Media src={block.imageUrl} alt={block.title || "Изображение"} />
          </div>
        </div>
      );
      break;

    case "features": {
      const rows = parseRows(block.text);
      body = (
        <div className={inner}>
          <div className="pres-reveal text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <Eyebrow text={block.eyebrow} dark={dark} />
            {block.title && <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3">{block.title}</h2>}
            {block.subtitle && <p className={`text-base sm:text-lg ${dark ? "text-white/85" : "text-text-gray"}`}>{block.subtitle}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {rows.map((parts, i) => {
              const hasIcon = parts.length >= 3;
              const icon = hasIcon ? parts[0] : "";
              const title = hasIcon ? parts[1] : parts[0];
              const desc = hasIcon ? parts[2] : parts[1] ?? "";
              return (
                <div
                  key={i}
                  className="pres-reveal bg-bg-white rounded-2xl border border-border p-5 sm:p-6 hover:shadow-lg hover:-translate-y-1 transition-all"
                  style={{ transitionDelay: `${i * 90}ms` }}
                >
                  {icon && <div className="text-3xl sm:text-4xl mb-3">{icon}</div>}
                  <h3 className="font-heading font-bold text-text-dark text-base sm:text-lg mb-1.5">{title}</h3>
                  {desc && <p className="text-sm text-text-gray leading-relaxed">{desc}</p>}
                </div>
              );
            })}
          </div>
        </div>
      );
      break;
    }

    case "stats": {
      const rows = parseRows(block.text);
      body = (
        <div className={inner}>
          <div className="pres-reveal text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <Eyebrow text={block.eyebrow} dark={dark} />
            {block.title && <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3">{block.title}</h2>}
            {block.subtitle && <p className={`text-base sm:text-lg ${dark ? "text-white/85" : "text-text-gray"}`}>{block.subtitle}</p>}
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {rows.map((parts, i) => (
              <div
                key={i}
                className={`pres-reveal-scale rounded-2xl p-6 text-center ${dark ? "bg-white/10 border border-white/15" : "bg-bg-white border border-border shadow-sm"}`}
                style={{ transitionDelay: `${i * 110}ms` }}
              >
                <div className={`font-heading text-3xl sm:text-4xl font-extrabold mb-1 ${dark ? "text-white" : "text-primary"}`}>
                  <AnimatedCounter value={parts[0] ?? ""} />
                </div>
                <div className={`text-xs sm:text-sm ${dark ? "text-white/80" : "text-text-gray"}`}>{parts[1] ?? ""}</div>
              </div>
            ))}
          </div>
        </div>
      );
      break;
    }

    case "quote":
      body = (
        <div className={`${inner} max-w-3xl text-center pres-reveal`}>
          <svg className={`w-12 h-12 mx-auto mb-6 ${dark ? "text-white/40" : "text-primary/25"}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M7.17 6A5.17 5.17 0 002 11.17V18h6.83v-6.83H5.5A1.67 1.67 0 017.17 9.5V6zm9 0A5.17 5.17 0 0011 11.17V18h6.83v-6.83H14.5a1.67 1.67 0 011.67-1.67V6z" />
          </svg>
          {block.title && (
            <p className="font-heading text-xl sm:text-2xl md:text-3xl font-bold leading-snug mb-5">{block.title}</p>
          )}
          {block.subtitle && (
            <p className={`text-sm sm:text-base font-medium ${dark ? "text-white/80" : "text-text-gray"}`}>{block.subtitle}</p>
          )}
        </div>
      );
      break;

    case "banner":
      body = (
        <div className={`${inner} pres-reveal-scale`}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <Eyebrow text={block.eyebrow} dark={dark} />
              {block.title && <h2 className="font-heading text-2xl sm:text-3xl font-extrabold leading-tight">{block.title}</h2>}
              {block.subtitle && <p className={`mt-2 text-base sm:text-lg ${dark ? "text-white/85" : "text-text-gray"}`}>{block.subtitle}</p>}
            </div>
            <div className="flex-shrink-0">
              <CtaButton text={block.buttonText} link={block.buttonLink} dark={dark} />
            </div>
          </div>
        </div>
      );
      break;

    case "cta":
    default:
      body = (
        <div className={`${inner} max-w-2xl text-center pres-reveal`}>
          <Eyebrow text={block.eyebrow} dark={dark} />
          {block.title && <h2 className="font-heading text-2xl sm:text-4xl font-extrabold mb-4">{block.title}</h2>}
          {block.subtitle && <p className={`text-base sm:text-lg mb-8 ${dark ? "text-white/85" : "text-text-gray"}`}>{block.subtitle}</p>}
          <CtaButton text={block.buttonText} link={block.buttonLink} dark={dark} />
        </div>
      );
      break;
  }

  const pad = block.layout === "hero" ? "" : "py-16 sm:py-24";
  return <section className={`relative overflow-hidden ${section} ${pad}`}>{body}</section>;
}

export default function PresentationView({ blocks }: { blocks: PresentationBlockData[] }) {
  const [progress, setProgress] = useState(0);

  // Reveal-on-scroll via IntersectionObserver.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".pres-reveal, .pres-reveal-left, .pres-reveal-right, .pres-reveal-scale"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    els.forEach((el) => {
      if (!el.classList.contains("is-visible")) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [blocks]);

  // Top scroll-progress bar.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setProgress(max > 0 ? (h.scrollTop / max) * 100 : 0);
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 h-1 z-50 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      {blocks.map((block) => (
        <PresentationBlock key={block.id} block={block} />
      ))}
    </>
  );
}
