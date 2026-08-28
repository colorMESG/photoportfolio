import {
  useState, useEffect, useRef, useCallback, createContext, useContext,
  type ReactNode, type CSSProperties, type MouseEvent as RME,
} from "react";

import {
  eventAward, eventGala, eventNetworking, eventPanel, eventStage,
  headshots, retouchContent,
  teamBusiness, teamDiverse, teamOutdoor, teamOverhead,
} from "./content/corporate";
import {
  flyBaiTuLong, flyHaLong, flyMuCangChai, flySaPa,
} from "./content/flycam";
import {
  contactSheet, fragments, locationSeries,
  portraitStudy, rosieProject, veilStudy,
} from "./content/projects";
import { exifPresets } from "./content/site";
import type { ProjectImage } from "./content/types";
import {
  PortfolioProvider,
  useAerial,
  useCorporate,
  useCorporateList,
  useCover,
  usePhotography,
} from "./lib/content/PortfolioProvider";
import { SiteCopyProvider, useSiteCopy } from "./lib/content/SiteCopyProvider";
import { managedObjectPosition } from "./lib/images";

function imgPos(image?: Pick<ProjectImage, "focalPointX" | "focalPointY">) {
  return image ? managedObjectPosition(image.focalPointX, image.focalPointY) : undefined;
}

function PhotoOverflow({
  images,
  onImgHover,
  onImgLeave,
}: {
  images: ProjectImage[];
} & HP) {
  if (images.length === 0) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
      {images.map((img, i) => (
        <Reveal key={img.id} delay={i * 80}>
          <Photo
            src={img.src}
            alt={img.alt}
            className="w-full"
            style={{ aspectRatio: "3/4" }}
            onHover={onImgHover}
            onLeave={onImgLeave}
            exifIdx={img.exifIdx}
            objectPosition={imgPos(img)}
          />
        </Reveal>
      ))}
    </div>
  );
}

type HP = { onImgHover: () => void; onImgLeave: () => void };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// ─── Lightbox context ─────────────────────────────────────────────────────────
const LbCtx = createContext<{ open: (src: string, ei: number) => void }>({ open: () => {} });

// ─── hooks ───────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, v] as const;
}

// ─── FILM GRAIN ───────────────────────────────────────────────────────────────
const grainSvg = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/></filter><rect width='180' height='180' filter='url(#g)' opacity='1'/></svg>`);

function FilmGrain() {
  return (
    <>
      <style>{`@keyframes grainShift{0%{transform:translate(0,0)}20%{transform:translate(-6px,-4px)}40%{transform:translate(4px,6px)}60%{transform:translate(-4px,4px)}80%{transform:translate(6px,-6px)}100%{transform:translate(0,0)}}`}</style>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex:9988, backgroundImage:`url("data:image/svg+xml;charset=utf-8,${grainSvg}")`, backgroundRepeat:"repeat", backgroundSize:"180px 180px", opacity:0.048, mixBlendMode:"overlay", animation:"grainShift 0.35s steps(2) infinite" }} />
    </>
  );
}

// ─── CUSTOM CURSOR ────────────────────────────────────────────────────────────
function CustomCursor({ imgHover, dragging, label }: { imgHover: boolean; dragging: boolean; label?: string }) {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const mouse   = useRef({ x: -300, y: -300 });
  const ring    = useRef({ x: -300, y: -300 });
  const rafId   = useRef(0);
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
      if (dotRef.current) dotRef.current.style.transform = `translate(calc(${e.clientX}px - 50%), calc(${e.clientY}px - 50%))`;
    };
    window.addEventListener("mousemove", onMove);
    const tick = () => {
      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.09);
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.09);
      if (ringRef.current) ringRef.current.style.transform = `translate(calc(${ring.current.x}px - 50%), calc(${ring.current.y}px - 50%))`;
      rafId.current = requestAnimationFrame(tick);
    };
    rafId.current = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafId.current); };
  }, []);
  const size = dragging ? 54 : imgHover ? 80 : 38;
  const txt = dragging ? "DRAG" : label || "VIEW";
  return (
    <>
      <div ref={dotRef} className="fixed top-0 left-0 pointer-events-none rounded-full" style={{ zIndex:9999, width:6, height:6, background:"#fff", mixBlendMode:"difference", willChange:"transform" }} />
      <div ref={ringRef} className="fixed top-0 left-0 pointer-events-none rounded-full flex items-center justify-center" style={{ zIndex:9998, width:size, height:size, border:`1px solid rgba(255,255,255,${imgHover?0.9:0.65})`, mixBlendMode:"difference", transition:"width 0.45s cubic-bezier(0.16,1,0.3,1),height 0.45s cubic-bezier(0.16,1,0.3,1)", willChange:"transform" }}>
        <span className="font-mono uppercase text-white" style={{ fontSize:9, letterSpacing:"0.22em", opacity:imgHover?1:0, transition:"opacity 0.3s" }}>{txt}</span>
      </div>
    </>
  );
}

// ─── SCROLL PROGRESS ─────────────────────────────────────────────────────────
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const h = () => { const max = document.documentElement.scrollHeight - window.innerHeight; setP(max > 0 ? window.scrollY / max : 0); };
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 pointer-events-none" style={{ zIndex:9997, height:1 }}><div className="h-full bg-white" style={{ width:`${p*100}%`, mixBlendMode:"difference", transition:"width 0.08s linear" }} /></div>;
}

// ─── SCRAMBLE TEXT ────────────────────────────────────────────────────────────
function ScrambleText({ text, className, style }: { text:string; className?:string; style?:CSSProperties }) {
  const [d, setD] = useState(text);
  const r = useRef(0);
  const scramble = useCallback(() => {
    let f = 0; const tot = text.length * 2;
    const tick = () => {
      const rev = Math.floor(f / 2);
      setD(text.split("").map((ch, i) => { if (" .,'-–".includes(ch)) return ch; if (i < rev) return text[i]; return CHARS[Math.floor(Math.random() * CHARS.length)]; }).join(""));
      f++; if (f <= tot) { r.current = requestAnimationFrame(tick); } else { setD(text); }
    };
    cancelAnimationFrame(r.current); r.current = requestAnimationFrame(tick);
  }, [text]);
  useEffect(() => { setD(text); }, [text]);
  useEffect(() => () => cancelAnimationFrame(r.current), []);
  return <div className={className} style={style} onMouseEnter={scramble}>{d}</div>;
}

// ─── MAGNETIC LINK ────────────────────────────────────────────────────────────
function MagneticLink({ href, children, color }: { href:string; children:ReactNode; color:string }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [off, setOff] = useState({ x:0, y:0 });
  const resting = off.x === 0 && off.y === 0;
  const onMove = (e: RME<HTMLAnchorElement>) => { const r = ref.current!.getBoundingClientRect(); setOff({ x:(e.clientX-r.left-r.width/2)*0.38, y:(e.clientY-r.top-r.height/2)*0.38 }); };
  return (
    <a ref={ref} href={href} className="font-mono text-[10px] tracking-[0.2em] uppercase inline-block"
      style={{ color, transform:`translate(${off.x}px,${off.y}px)`, transition:resting?"transform 0.6s cubic-bezier(0.16,1,0.3,1)":"transform 0.12s ease" }}
      onMouseMove={onMove} onMouseEnter={onMove} onMouseLeave={() => setOff({ x:0, y:0 })}>
      {children}
    </a>
  );
}

// ─── REVEAL ───────────────────────────────────────────────────────────────────
function Reveal({ children, delay=0, className="", style }: { children:ReactNode; delay?:number; className?:string; style?:CSSProperties }) {
  const [ref, v] = useReveal();
  return <div ref={ref} className={className} style={{ opacity:v?1:0, transform:v?"none":"translateY(44px)", transition:`opacity 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms,transform 1s cubic-bezier(0.16,1,0.3,1) ${delay}ms`, ...style }}>{children}</div>;
}

// ─── PHOTO — editorial: B&W reveal + EXIF + tilt + lightbox ──────────────────
function Photo({ src, alt, className="", style, onHover, onLeave, exifIdx=0, objectPosition }: {
  src:string; alt:string; className?:string; style?:CSSProperties;
  onHover?:()=>void; onLeave?:()=>void; exifIdx?:number; objectPosition?:string;
}) {
  const lb = useContext(LbCtx);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x:50, y:50 });
  const exif = exifPresets[exifIdx % exifPresets.length];
  const onMove = (e: RME<HTMLDivElement>) => {
    const el = wrapRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const xp = ((e.clientX-r.left)/r.width)*100, yp = ((e.clientY-r.top)/r.height)*100;
    setPos({ x:xp, y:yp });
    el.style.transform = `perspective(900px) rotateY(${(xp/100-.5)*9}deg) rotateX(${-(yp/100-.5)*9}deg) scale(1.015)`;
    el.style.transition = "transform 0.1s ease";
  };
  const onOut = () => {
    setHovered(false); onLeave?.();
    const el = wrapRef.current; if (!el) return;
    el.style.transform=""; el.style.transition="transform 0.7s cubic-bezier(0.16,1,0.3,1)";
  };
  const mask = hovered ? `radial-gradient(circle 160px at ${pos.x}% ${pos.y}%, transparent 20%, rgba(0,0,0,0.96) 70%)` : undefined;
  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-neutral-800 ${className}`} style={{ willChange:"transform", cursor:"none", ...style }}
      onMouseMove={onMove} onMouseEnter={e => { setHovered(true); onHover?.(); onMove(e); }} onMouseLeave={onOut}
      onClick={() => lb.open(src, exifIdx)}>
      <img src={src} alt={alt} className="w-full h-full object-cover block" style={objectPosition ? { objectPosition } : undefined} />
      <div className="absolute inset-0" style={{ backgroundImage:`url(${src})`, backgroundSize:"cover", backgroundPosition:objectPosition ?? "center", filter:"grayscale(1) contrast(1.08)", WebkitMaskImage:mask, maskImage:mask }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ background:"linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)", padding:"24px 14px 12px", transform:hovered?"translateY(0)":"translateY(100%)", transition:"transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="font-mono text-[9px] tracking-[0.18em] text-white/50 uppercase mb-0.5">{exif.camera}</div>
        <div className="font-mono text-[9px] tracking-[0.18em] text-white/70 uppercase">{exif.lens} &nbsp;·&nbsp; {exif.exp}</div>
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow:hovered?"inset 0 0 0 1px rgba(255,255,255,0.12)":"none", transition:"box-shadow 0.3s" }} />
    </div>
  );
}

// ─── CORP PHOTO — corporate: full color + info card + tilt + lightbox ────────
function CorpPhoto({ src, alt, className="", style, onHover, onLeave, category, client, year="2026", objectPosition }: {
  src:string; alt:string; className?:string; style?:CSSProperties;
  onHover?:()=>void; onLeave?:()=>void;
  category:string; client:string; year?:string; objectPosition?:string;
}) {
  const lb = useContext(LbCtx);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const onMove = (e: RME<HTMLDivElement>) => {
    const el = wrapRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX-r.left)/r.width)-.5, y = ((e.clientY-r.top)/r.height)-.5;
    el.style.transform = `perspective(900px) rotateY(${x*7}deg) rotateX(${-y*7}deg) scale(1.015)`;
    el.style.transition = "transform 0.1s ease";
  };
  const onOut = () => {
    setHovered(false); onLeave?.();
    const el = wrapRef.current; if (!el) return;
    el.style.transform=""; el.style.transition="transform 0.7s cubic-bezier(0.16,1,0.3,1)";
  };
  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-neutral-200 ${className}`} style={{ willChange:"transform", cursor:"none", ...style }}
      onMouseMove={onMove} onMouseEnter={e => { setHovered(true); onHover?.(); onMove(e); }} onMouseLeave={onOut}
      onClick={() => lb.open(src, 0)}>
      <img src={src} alt={alt} className="w-full h-full object-cover block" style={{ transform:hovered?"scale(1.06)":"scale(1)", transition:"transform 1s cubic-bezier(0.16,1,0.3,1)", filter:hovered?"brightness(1.04)":"brightness(1)", ...(objectPosition ? { objectPosition } : {}) }} />
      {/* Category badge */}
      <div className="absolute top-3 left-3" style={{ opacity:hovered?1:0, transform:hovered?"translateY(0)":"translateY(-6px)", transition:"all 0.35s cubic-bezier(0.16,1,0.3,1)" }}>
        <span className="font-mono text-[8px] tracking-[0.25em] uppercase px-2 py-1 bg-black/80 text-white/80">{category}</span>
      </div>
      {/* Info card */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm" style={{ padding:"14px 16px 12px", transform:hovered?"translateY(0)":"translateY(100%)", transition:"transform 0.45s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="font-display font-black text-[#0a0a0a] leading-none" style={{ fontSize:"clamp(16px,2.2vw,26px)", letterSpacing:"-0.02em" }}>{client}</div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#888] uppercase">{category}</span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-[#aaa]">{year}</span>
        </div>
      </div>
    </div>
  );
}

// ─── BEFORE / AFTER SLIDER ───────────────────────────────────────────────────
function BeforeAfter({ src, alt }: { src:string; alt:string }) {
  const { retouch: labels } = useSiteCopy();
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const update = useCallback((clientX: number) => {
    const r = containerRef.current!.getBoundingClientRect();
    setPos(Math.max(4, Math.min(96, ((clientX-r.left)/r.width)*100)));
  }, []);
  return (
    <div ref={containerRef} className="relative overflow-hidden select-none bg-neutral-900" style={{ aspectRatio:"2/3", cursor:"none" }}
      onMouseDown={e => { dragging.current=true; update(e.clientX); }}
      onMouseMove={e => dragging.current && update(e.clientX)}
      onMouseUp={() => dragging.current=false}
      onMouseLeave={() => dragging.current=false}>
      {/* AFTER — full retouched color */}
      <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
      {/* BEFORE — simulate unedited via filter */}
      <div className="absolute inset-0" style={{ clipPath:`inset(0 ${100-pos}% 0 0)` }}>
        <img src={src} alt={`${alt} before`} className="absolute inset-0 w-full h-full object-cover"
          style={{ filter:"saturate(0.22) contrast(0.8) brightness(1.14) sepia(0.06)" }} />
      </div>
      {/* Drag line */}
      <div className="absolute top-0 bottom-0 z-10" style={{ left:`${pos}%`, width:1, background:"rgba(255,255,255,0.9)" }}>
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-2xl flex items-center justify-center border border-white/20">
          <span className="font-mono text-[9px] text-[#0a0a0a] tracking-widest select-none">↔</span>
        </div>
      </div>
      {/* Labels */}
      <div className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-black/60"><span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/70">{labels.beforeLabel}</span></div>
      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-black/60"><span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/70">{labels.afterLabel}</span></div>
      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/40">{labels.dragHint}</span>
      </div>
    </div>
  );
}

// ─── ANIMATED STAT COUNTER ───────────────────────────────────────────────────
function StatCounter({ target, suffix="+", label }: { target:number; suffix?:string; label:string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const dur = 1800, t0 = performance.now();
      const tick = (now: number) => {
        const t = Math.min((now-t0)/dur, 1);
        setCount(Math.round((1-Math.pow(1-t,3)) * target));
        if (t < 1) requestAnimationFrame(tick); else setCount(target);
      };
      requestAnimationFrame(tick);
    }, { threshold:0.6 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [target]);
  return (
    <div ref={ref} className="text-center">
      <div className="font-display font-black text-white leading-none" style={{ fontSize:"clamp(48px,7vw,110px)", letterSpacing:"-0.025em" }}>{count}{suffix}</div>
      <div className="font-mono text-[9px] tracking-[0.25em] text-white/40 uppercase mt-2">{label}</div>
    </div>
  );
}

// ─── MARQUEE ─────────────────────────────────────────────────────────────────
function Marquee() {
  const { marquee } = useSiteCopy();
  const text = marquee.map(s => `${s}  ·  `).join("");
  return (
    <>
      <style>{`@keyframes mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <div className="overflow-hidden py-4 border-y" style={{ background:"#0a0a0a", borderColor:"rgba(255,255,255,0.07)" }}>
        <div className="whitespace-nowrap inline-block" style={{ animation:"mq 32s linear infinite" }}>
          {[text, text].map((t, i) => (
            <span key={i} className="font-mono text-[10px] tracking-[0.22em] uppercase text-white/30">{t}</span>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── SERVICE ITEM ─────────────────────────────────────────────────────────────
function ServiceItem({ num, title, subtitle, previewSrc }: { num:string; title:string; subtitle:string; previewSrc:string }) {
  const [hovered, setHovered] = useState(false);
  const [mp, setMp] = useState({ x:0, y:0 });
  return (
    <div className="border-b border-[#e0dbd4] group" style={{ cursor:"none" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={e => setMp({ x:e.clientX, y:e.clientY })}>
      <div className="flex items-center gap-5 py-6 md:py-7">
        <span className="font-mono text-[9px] tracking-[0.25em] text-[#bbb] w-7 flex-shrink-0">{num}</span>
        <div className="flex-1 min-w-0">
          <div className="font-display font-black leading-none" style={{ fontSize:"clamp(20px,3.5vw,52px)", letterSpacing:"-0.02em", lineHeight:1, color: hovered ? "#0a0a0a" : "#333", transition:"color 0.3s" }}>{title}</div>
          <div className="font-mono text-[9px] tracking-[0.22em] text-[#aaa] uppercase mt-1.5">{subtitle}</div>
        </div>
        <span className="font-mono text-[10px] tracking-[0.15em] text-[#ccc] flex-shrink-0 transition-transform duration-300" style={{ transform:hovered?"translateX(8px)":"none" }}>→</span>
      </div>
      {/* Floating preview — follows cursor */}
      <div className="fixed pointer-events-none z-50 w-44 overflow-hidden shadow-2xl"
        style={{ left:mp.x+18, top:mp.y-88, opacity:hovered?1:0, transform:hovered?"translateY(0) scale(1)":"translateY(14px) scale(0.93)", transition:"opacity 0.38s cubic-bezier(0.16,1,0.3,1),transform 0.38s cubic-bezier(0.16,1,0.3,1)" }}>
        <img src={previewSrc} alt="" className="w-full object-cover" style={{ aspectRatio:"2/3", display:"block" }} />
      </div>
    </div>
  );
}

// ─── LIGHTBOX ─────────────────────────────────────────────────────────────────
function Lightbox({ src, ei, onClose }: { src:string; ei:number; onClose:()=>void }) {
  const { ui } = useSiteCopy();
  const exif = exifPresets[ei % exifPresets.length];
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <>
      <style>{`@keyframes lbIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}} @keyframes lbBg{from{opacity:0}to{opacity:1}}`}</style>
      <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex:9994, background:"rgba(0,0,0,0.97)", animation:"lbBg 0.3s ease", cursor:"none" }} onClick={onClose}>
        <div className="relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
          <img src={src.replace(/w=\d+/,"w=1600").replace(/h=\d+/,"h=1200")} alt="Fullscreen" className="block object-contain" style={{ maxWidth:"86vw", maxHeight:"82vh", animation:"lbIn 0.45s cubic-bezier(0.16,1,0.3,1)" }} />
          <div className="mt-4 flex items-center gap-5" style={{ animation:"lbIn 0.5s 0.1s both cubic-bezier(0.16,1,0.3,1)" }}>
            <span className="font-mono text-[9px] tracking-[0.2em] text-white/35 uppercase">{exif.camera}</span>
            <span className="w-px h-3 bg-white/15" /><span className="font-mono text-[9px] tracking-[0.2em] text-white/35 uppercase">{exif.lens}</span>
            <span className="w-px h-3 bg-white/15" /><span className="font-mono text-[9px] tracking-[0.2em] text-white/35 uppercase">{exif.exp}</span>
          </div>
          <button onClick={onClose} className="absolute -top-10 right-0 font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 hover:text-white/70 transition-colors">{ui.lightboxClose}</button>
        </div>
      </div>
    </>
  );
}

// ─── FILM STRIP ───────────────────────────────────────────────────────────────
function FilmStrip({ onImgHover, onImgLeave, onDragChange }: HP & { onDragChange:(v:boolean)=>void }) {
  const { filmStrip } = useSiteCopy();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const h = (e: WheelEvent) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { e.preventDefault(); el.scrollLeft += e.deltaY * 1.2; } };
    el.addEventListener("wheel", h, { passive:false });
    return () => el.removeEventListener("wheel", h);
  }, []);
  const onMouseDown = (e: RME<HTMLDivElement>) => { dragging.current=true; onDragChange(true); startX.current=e.clientX; scrollStart.current=containerRef.current!.scrollLeft; };
  const onMouseMove = (e: RME<HTMLDivElement>) => { if (dragging.current) containerRef.current!.scrollLeft = scrollStart.current-(e.clientX-startX.current); };
  const onMouseUp = () => { dragging.current=false; onDragChange(false); };
  return (
    <section className="bg-[#0a0a0a] py-16 overflow-hidden select-none">
      <div className="px-8 md:px-14 mb-8 flex items-center gap-8">
        <Reveal><ScrambleText text={filmStrip.heading} className="font-display font-black leading-none text-white/10" style={{ fontSize:"clamp(40px,6vw,90px)", letterSpacing:"-0.02em" }} /></Reveal>
        <Reveal delay={60} className="hidden md:flex flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/25">{filmStrip.labels[0]}</span>
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/15">{filmStrip.labels[1]}</span>
        </Reveal>
      </div>
      <div className="relative">
        <div className="overflow-hidden" style={{ height:22, background:"#111" }}><div className="flex items-center px-3 gap-[9px]" style={{ height:"100%" }}>{Array.from({length:80}).map((_,i) => <div key={i} className="flex-shrink-0 rounded-sm bg-[#0a0a0a]" style={{ width:12, height:14 }} />)}</div></div>
        <div ref={containerRef} className="flex gap-[2px] overflow-x-auto" style={{ scrollbarWidth:"none", cursor:"none", background:"#080808" }} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          {filmStrip.frames.map((f, idx) => (
            <div key={f.id} className="flex-shrink-0 relative group" style={{ width:f.portrait?260:400, height:390, background:"#111" }} onMouseEnter={onImgHover} onMouseLeave={onImgLeave}>
              <Photo src={f.src} alt={`Film frame ${f.n}`} className="w-full h-full" exifIdx={idx} onHover={onImgHover} onLeave={onImgLeave} />
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"><span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/60">{f.loc}</span></div>
            </div>
          ))}
          <div className="flex-shrink-0 w-16" />
        </div>
        <div className="overflow-hidden" style={{ height:22, background:"#111" }}><div className="flex items-center px-3 gap-[9px]" style={{ height:"100%" }}>{Array.from({length:80}).map((_,i) => <div key={i} className="flex-shrink-0 rounded-sm bg-[#0a0a0a]" style={{ width:12, height:14 }} />)}</div></div>
        <div className="absolute top-0 right-0 bottom-0 w-32 pointer-events-none" style={{ background:"linear-gradient(to left,#0a0a0a 0%,transparent 100%)" }} />
      </div>
    </section>
  );
}

function Lbl({ children, light=false }: { children:ReactNode; light?:boolean }) {
  return <span className="font-mono text-[10px] tracking-[0.22em] uppercase block" style={{ color:light?"rgba(255,255,255,0.45)":"#999" }}>{children}</span>;
}

// ─── HEADER ──────────────────────────────────────────────────────────────────
function Header() {
  const { settings } = useSiteCopy();
  const [sc, setSc] = useState(false);
  useEffect(() => { const h = () => setSc(window.scrollY > 70); window.addEventListener("scroll", h, { passive:true }); return () => window.removeEventListener("scroll", h); }, []);
  const fg = sc ? "#0a0a0a" : "#fff";
  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-8 md:px-14 py-5 flex items-center justify-between"
      style={{ backgroundColor:sc?"rgba(245,240,232,0.96)":"transparent", backdropFilter:sc?"blur(10px)":"none", transition:"background-color 0.5s ease" }}>
      <div>
        <div className="font-display font-black text-sm tracking-widest leading-none" style={{ color:fg }}>{settings.name}</div>
        <div className="font-mono text-[9px] tracking-[0.22em] uppercase mt-0.5" style={{ color:sc?"#aaa":"rgba(255,255,255,0.4)" }}>{settings.tagline}</div>
      </div>
      <nav className="flex items-center gap-7 md:gap-10">
        {settings.nav.map(({label,href}) => (
          <MagneticLink key={label} href={href} color={fg}>{label}</MagneticLink>
        ))}
      </nav>
    </header>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero({ scrollY, onImgHover, onImgLeave }: HP & { scrollY:number }) {
  const { hero } = useSiteCopy();
  const heroPos = managedObjectPosition(hero.image.focalPointX, hero.image.focalPointY);
  const [mx, setMx] = useState(0); const [my, setMy] = useState(0);
  useEffect(() => { const h = (e: MouseEvent) => { setMx(((e.clientX/window.innerWidth)-.5)*-18); setMy(((e.clientY/window.innerHeight)-.5)*-12); }; window.addEventListener("mousemove", h); return () => window.removeEventListener("mousemove", h); }, []);
  return (
    <section className="relative h-screen overflow-hidden bg-[#0a0a0a]" id="hero">
      <div className="absolute inset-[-4%]" style={{ transform:`translateX(${mx}px) translateY(calc(${scrollY*.28}px + ${my}px))`, transition:"transform 0.08s linear", willChange:"transform" }} onMouseEnter={onImgHover} onMouseLeave={onImgLeave}>
        <img src={hero.image.src} alt={hero.image.alt} className="w-full h-full object-cover" style={heroPos ? { objectPosition: heroPos } : undefined} />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
      <div className="absolute inset-0 flex flex-col justify-center overflow-visible pointer-events-none" style={{ paddingLeft:"5vw" }}>
        {hero.words.map((word, idx) => (
          <ScrambleText key={word} text={word} className="font-display font-black leading-none pointer-events-auto"
            style={{ fontSize:"clamp(64px,18vw,290px)", letterSpacing:"-0.03em", lineHeight:0.92, marginTop:idx===0?0:"-0.04em", color:idx===2?"transparent":"#fff", WebkitTextStroke:idx===2?"1.5px rgba(255,255,255,0.5)":undefined }} />
        ))}
      </div>
      <div className="absolute bottom-28 right-10 text-right space-y-1 hidden md:block">
        {hero.meta.map(m => <Lbl key={m} light>{m}</Lbl>)}
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <Lbl light>{hero.scrollLabel}</Lbl>
        <div className="relative w-px h-12 overflow-hidden bg-white/20"><div className="absolute w-full bg-white/70" style={{ height:"40%", animation:"scrollDrop 1.8s ease-in-out infinite" }} /></div>
      </div>
      <style>{`@keyframes scrollDrop{0%{transform:translateY(-100%)}100%{transform:translateY(300%)}}`}</style>
    </section>
  );
}

// ─── SELECTED WORK ───────────────────────────────────────────────────────────
function SelectedWork({ onImgHover, onImgLeave }: HP) {
  const { headings, ghost } = useSiteCopy();
  const study = usePhotography(portraitStudy);
  const location = usePhotography(locationSeries);
  const sheet = usePhotography(contactSheet);
  const veil = usePhotography(veilStudy);
  const frag = usePhotography(fragments);
  const [p1a, p1b] = study?.images ?? [];
  const [p2a, p2b] = location?.images ?? [];
  const [p4] = veil?.images ?? [];
  const [p5a, p5b, p5c] = frag?.images ?? [];
  return (
    <section id="work" className="bg-[#f5f0e8] pt-28 pb-0">
      <div className="px-8 md:px-14 overflow-hidden">
        <Reveal><ScrambleText text={headings.selectedWorks.lines[0]} className="font-display font-black leading-none" style={{ fontSize:"clamp(52px,11vw,170px)", letterSpacing:"-0.02em", lineHeight:0.9 }} /></Reveal>
        <Reveal delay={80}><ScrambleText text={headings.selectedWorks.lines[1]} className="font-display font-black leading-none" style={{ fontSize:"clamp(52px,11vw,170px)", letterSpacing:"-0.02em", lineHeight:0.9, marginLeft:"8vw", color:"transparent", WebkitTextStroke:"1.5px #0a0a0a" }} /></Reveal>
      </div>
      {study && (
      <div className="mt-24 px-8 md:px-14">
        <Reveal className="flex items-start gap-3 md:gap-6 mb-6"><Lbl>{study.displayNumber}</Lbl><div><Lbl>{study.title}</Lbl><Lbl>{study.year}</Lbl></div></Reveal>
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 md:gap-6 items-start">
          {p1a && <Reveal><Photo src={p1a.src} alt={p1a.alt} className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={p1a.exifIdx} objectPosition={imgPos(p1a)} /></Reveal>}
          {p1b && <Reveal delay={160} className="md:mt-32"><Photo src={p1b.src} alt={p1b.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={p1b.exifIdx} objectPosition={imgPos(p1b)} /></Reveal>}
        </div>
        <PhotoOverflow images={study.images.slice(2)} onImgHover={onImgHover} onImgLeave={onImgLeave} />
      </div>
      )}
      {location && (
      <div className="mt-24 bg-[#0a0a0a] py-20 px-8 md:px-14">
        <Reveal className="flex items-center gap-4 mb-8"><Lbl light>{location.displayNumber}</Lbl><div><Lbl light>{location.title}</Lbl><Lbl light>{location.year}</Lbl></div></Reveal>
        <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-end">
          {p2a && <Reveal className="w-full md:w-[68%]"><Photo src={p2a.src} alt={p2a.alt} className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={p2a.exifIdx} objectPosition={imgPos(p2a)} /></Reveal>}
          {p2b && <Reveal delay={140} className="w-full md:w-[30%]"><Photo src={p2b.src} alt={p2b.alt} className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={p2b.exifIdx} objectPosition={imgPos(p2b)} /></Reveal>}
        </div>
        <PhotoOverflow images={location.images.slice(2)} onImgHover={onImgHover} onImgLeave={onImgLeave} />
        <Reveal delay={200} className="mt-8"><ScrambleText text={ghost.locationSeries} className="font-display font-black leading-none" style={{ fontSize:"clamp(40px,8vw,130px)", letterSpacing:"-0.02em", color:"rgba(255,255,255,0.07)" }} /></Reveal>
      </div>
      )}
      {sheet && (
      <div className="mt-24 px-8 md:px-14">
        <Reveal className="flex items-center gap-4 mb-8"><Lbl>{sheet.displayNumber}</Lbl><div><Lbl>{sheet.title}</Lbl><Lbl>{sheet.year}</Lbl></div></Reveal>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {sheet.images.map((img,i) => <Reveal key={img.id} delay={i*100}><Photo src={img.src} alt={img.alt} className="w-full" style={{ aspectRatio:"2/3.2" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={img.exifIdx} objectPosition={imgPos(img)} /></Reveal>)}
        </div>
      </div>
      )}
      {veil && (
      <div className="mt-24">
        {p4 && (
          <Reveal>
            <div className="relative mx-4 md:mx-8">
              <Photo src={p4.src} alt={p4.alt} className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={p4.exifIdx} objectPosition={imgPos(p4)} />
              <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10"><Lbl light>{veil.displayNumber}</Lbl><Lbl light>{veil.title}</Lbl><Lbl light>{veil.year}</Lbl></div>
            </div>
          </Reveal>
        )}
        <div className="px-4 md:px-8">
          <PhotoOverflow images={veil.images.slice(1)} onImgHover={onImgHover} onImgLeave={onImgLeave} />
        </div>
      </div>
      )}
      {frag && (
      <div className="mt-24 px-8 md:px-14 pb-24">
        <Reveal className="flex items-center gap-4 mb-8"><Lbl>{frag.displayNumber}</Lbl><div><Lbl>{frag.title}</Lbl><Lbl>{frag.year}</Lbl></div></Reveal>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_0.6fr_0.5fr] gap-4 items-start">
          {p5a && <Reveal><Photo src={p5a.src} alt={p5a.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={p5a.exifIdx} objectPosition={imgPos(p5a)} /></Reveal>}
          {p5b && <Reveal delay={120} className="md:mt-16"><Photo src={p5b.src} alt={p5b.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={p5b.exifIdx} objectPosition={imgPos(p5b)} /></Reveal>}
          {p5c && <Reveal delay={220} className="md:mt-40"><Photo src={p5c.src} alt={p5c.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={p5c.exifIdx} objectPosition={imgPos(p5c)} /></Reveal>}
        </div>
        <PhotoOverflow images={frag.images.slice(3)} onImgHover={onImgHover} onImgLeave={onImgLeave} />
      </div>
      )}
    </section>
  );
}

// ─── STATEMENT ───────────────────────────────────────────────────────────────
function StatementSection() {
  const { statement } = useSiteCopy();
  return (
    <section className="bg-white py-28 md:py-40 px-8 md:px-20">
      <Reveal>
        <div className="font-display font-black leading-none" style={{ fontSize:"clamp(42px,9vw,148px)", letterSpacing:"-0.025em", lineHeight:0.88 }}>
          {statement.lines.map((line,i) => (
            <ScrambleText key={line} text={line} className="block" style={{ marginLeft:[0,"12vw",0,"6vw",0,"16vw",0][i]??0 }} />
          ))}
        </div>
      </Reveal>
      <Reveal delay={200} className="mt-16 max-w-sm md:ml-[20vw]">
        <p className="font-sans text-[13px] leading-relaxed text-[#555] font-light">{statement.paragraph}</p>
      </Reveal>
    </section>
  );
}

const HEADSHOT_SLOTS: { delay: number; className: string }[] = [
  { delay: 0, className: "" },
  { delay: 80, className: "md:mt-10" },
  { delay: 160, className: "" },
  { delay: 60, className: "md:mt-6" },
  { delay: 140, className: "" },
  { delay: 220, className: "md:mt-10" },
];

// ─── CORPORATE & EVENTS ──────────────────────────────────────────────────────
function CorporateSection({ onImgHover, onImgLeave }: HP) {
  const { headings, ghost } = useSiteCopy();
  const portraits = useCorporateList("chan-dung-headshot", headshots);
  const panel = useCorporate("techsummit-vietnam-2026", eventPanel);
  const award = useCorporate("giai-thuong-xuat-sac", eventAward);
  const gala = useCorporate("gala-thuong-nien-2026", eventGala);
  const networking = useCorporate("dem-ket-noi", eventNetworking);
  const stage = useCorporate("giai-thuong-doi-moi", eventStage);
  const diverse = useCorporate("startup-hcm", teamDiverse);
  const business = useCorporate("doanh-nghiep-hcm", teamBusiness);
  const outdoor = useCorporate("teambuilding-2025", teamOutdoor);
  const overhead = useCorporate("creative-agency", teamOverhead);
  return (
    <section id="business" className="bg-[#fafafa] pt-28 pb-24">
      {/* Heading */}
      <div className="px-8 md:px-14 mb-16">
        <Reveal>
          <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#aaa] mb-4">{headings.corporate.eyebrow}</div>
          <ScrambleText text={headings.corporate.lines[0]} className="font-display font-black leading-none" style={{ fontSize:"clamp(40px,8.5vw,140px)", letterSpacing:"-0.025em", lineHeight:0.88 }} />
          <ScrambleText text={headings.corporate.lines[1]} className="font-display font-black leading-none" style={{ fontSize:"clamp(40px,8.5vw,140px)", letterSpacing:"-0.025em", lineHeight:0.88, marginLeft:"10vw", color:"transparent", WebkitTextStroke:"1.5px #0a0a0a" }} />
        </Reveal>
        <Reveal delay={120} className="mt-6 max-w-md md:ml-[14vw]">
          <p className="font-sans text-[13px] leading-relaxed text-[#777] font-light">{headings.corporate.description}</p>
        </Reveal>
      </div>

      {/* HEADSHOTS ─ lưới 3 cột */}
      {portraits.length > 0 && (
      <div className="px-8 md:px-14 mb-20">
        <Reveal className="flex items-center gap-4 mb-8">
          <div className="w-8 h-px bg-[#0a0a0a]" />
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#888]">{headings.corporate.headshotsLabel}</span>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 items-start">
          {portraits.map((h, i) => {
            const slot = HEADSHOT_SLOTS[i] ?? { delay: 0, className: "" };
            return (
              <Reveal key={h.id} delay={slot.delay} className={slot.className}>
                <CorpPhoto src={h.src} alt={h.alt} className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} category={h.category} client={h.client} year={h.year} objectPosition={imgPos(h)} />
              </Reveal>
            );
          })}
        </div>
      </div>
      )}

      {/* EVENTS */}
      <div className="bg-[#0a0a0a] py-20 px-8 md:px-14 mb-0">
        <Reveal className="flex items-center gap-4 mb-10">
          <div className="w-8 h-px bg-white/20" />
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">{headings.corporate.eventsLabel}</span>
        </Reveal>
        {/* Large event + small portrait */}
        <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] gap-3 md:gap-4 mb-4 items-start">
          {panel && <Reveal><CorpPhoto src={panel.src} alt={panel.alt} className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} category={panel.category} client={panel.client} year={panel.year} objectPosition={imgPos(panel)} /></Reveal>}
          {award && <Reveal delay={120} className="md:mt-12"><CorpPhoto src={award.src} alt={award.alt} className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} category={award.category} client={award.client} year={award.year} objectPosition={imgPos(award)} /></Reveal>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
          {gala && <Reveal><CorpPhoto src={gala.src} alt={gala.alt} className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} category={gala.category} client={gala.client} year={gala.year} objectPosition={imgPos(gala)} /></Reveal>}
          {(networking || stage) && (
          <Reveal delay={100}>
            <div className="grid grid-cols-2 gap-3 md:gap-4 h-full">
              {networking && <CorpPhoto src={networking.src} alt={networking.alt} className="w-full" style={{ aspectRatio:"1" }} onHover={onImgHover} onLeave={onImgLeave} category={networking.category} client={networking.client} year={networking.year} objectPosition={imgPos(networking)} />}
              {stage && <CorpPhoto src={stage.src} alt={stage.alt} className="w-full" style={{ aspectRatio:"1" }} onHover={onImgHover} onLeave={onImgLeave} category={stage.category} client={stage.client} year={stage.year} objectPosition={imgPos(stage)} />}
            </div>
          </Reveal>
          )}
        </div>
        <Reveal delay={160} className="mt-10">
          <ScrambleText text={ghost.events} className="font-display font-black leading-none" style={{ fontSize:"clamp(40px,8vw,130px)", letterSpacing:"-0.02em", color:"rgba(255,255,255,0.06)" }} />
        </Reveal>
      </div>

      {/* TEAM PHOTOS */}
      <div className="px-8 md:px-14 pt-20">
        <Reveal className="flex items-center gap-4 mb-10">
          <div className="w-8 h-px bg-[#0a0a0a]" />
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#888]">{headings.corporate.teamsLabel}</span>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 mb-4">
          {diverse && <Reveal><CorpPhoto src={diverse.src} alt={diverse.alt} className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} category={diverse.category} client={diverse.client} year={diverse.year} objectPosition={imgPos(diverse)} /></Reveal>}
          {business && <Reveal delay={100}><CorpPhoto src={business.src} alt={business.alt} className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} category={business.category} client={business.client} year={business.year} objectPosition={imgPos(business)} /></Reveal>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
          {outdoor && <Reveal><CorpPhoto src={outdoor.src} alt={outdoor.alt} className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} category={outdoor.category} client={outdoor.client} year={outdoor.year} objectPosition={imgPos(outdoor)} /></Reveal>}
          {overhead && <Reveal delay={120}><CorpPhoto src={overhead.src} alt={overhead.alt} className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} category={overhead.category} client={overhead.client} year={overhead.year} objectPosition={imgPos(overhead)} /></Reveal>}
        </div>
      </div>
    </section>
  );
}

// ─── BEFORE/AFTER + STATS ────────────────────────────────────────────────────
function RetouchSection({ onImgHover, onImgLeave }: HP) {
  const { retouch } = useSiteCopy();
  const cover = useCover("corporate", "chan-dung-headshot", {
    id: retouchContent.image.src,
    src: retouchContent.image.src,
    alt: retouchContent.image.alt,
  });
  return (
    <section className="bg-[#0a0a0a] py-24 px-8 md:px-14">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-16 md:gap-20 items-center">
        {/* Before / After */}
        <Reveal>
          <div className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/30 mb-6">{retouch.label}</div>
          <BeforeAfter src={cover?.src ?? retouch.image.src} alt={cover?.alt ?? retouch.image.alt} />
        </Reveal>
        {/* Stats */}
        <div>
          <Reveal className="mb-12">
            <ScrambleText text={retouch.statsWord} className="font-display font-black leading-none text-white/10" style={{ fontSize:"clamp(36px,5vw,80px)", letterSpacing:"-0.025em" }} />
          </Reveal>
          <div className="grid grid-cols-2 gap-8 md:gap-12">
            {retouch.stats.map(s => <StatCounter key={s.id} target={s.target} suffix={s.suffix} label={s.label} />)}
          </div>
          <Reveal delay={200} className="mt-12 border-t border-white/8 pt-8">
            <p className="font-sans text-[12px] leading-relaxed text-white/35 font-light">{retouch.note}</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── FLYCAM ──────────────────────────────────────────────────────────────────
function AerialPhoto({ src, loc, region, alt: altitude, onHover, onLeave, className = "", style, objectPosition }: {
  src: string; loc: string; region: string; alt: string; onHover?:()=>void; onLeave?:()=>void; className?:string; style?:CSSProperties; objectPosition?:string;
}) {
  const lb = useContext(LbCtx);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const onMove = (e: RME<HTMLDivElement>) => {
    const el = wrapRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX-r.left)/r.width)-.5, y = ((e.clientY-r.top)/r.height)-.5;
    el.style.transform = `perspective(1000px) rotateY(${x*5}deg) rotateX(${-y*5}deg) scale(1.012)`;
    el.style.transition = "transform 0.1s ease";
  };
  const onOut = () => {
    setHovered(false); onLeave?.();
    const el = wrapRef.current; if (!el) return;
    el.style.transform = ""; el.style.transition = "transform 0.7s cubic-bezier(0.16,1,0.3,1)";
  };
  return (
    <div ref={wrapRef} className={`relative overflow-hidden bg-[#111] ${className}`}
      style={{ willChange:"transform", cursor:"none", ...style }}
      onMouseMove={onMove}
      onMouseEnter={e => { setHovered(true); onHover?.(); onMove(e); }}
      onMouseLeave={onOut}
      onClick={() => lb.open(src, 0)}>
      <img src={src} alt={loc} className="w-full h-full object-cover block"
        style={{ transform: hovered ? "scale(1.05)" : "scale(1)", transition: "transform 1.2s cubic-bezier(0.16,1,0.3,1)", ...(objectPosition ? { objectPosition } : {}) }} />
      {/* altitude badge */}
      <div className="absolute top-3 right-3" style={{ opacity: hovered ? 1 : 0, transition: "opacity 0.3s" }}>
        <span className="font-mono text-[8px] tracking-[0.22em] uppercase px-2 py-1 bg-black/70 text-white/70">↑ {altitude}</span>
      </div>
      {/* location info */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent"
        style={{ transform: hovered ? "translateY(0)" : "translateY(100%)", transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="font-display font-black leading-none text-white" style={{ fontSize: "clamp(14px,2vw,22px)", letterSpacing: "-0.02em" }}>{loc}</div>
        <div className="font-mono text-[8px] tracking-[0.22em] uppercase text-white/50 mt-0.5">{`${region} · ${altitude}`}</div>
      </div>
    </div>
  );
}

function FlycamSection({ onImgHover, onImgLeave }: HP) {
  const { headings, ghost, flycamCapabilities, aerialFrames } = useSiteCopy();
  const haLong = useAerial("vinh-ha-long", flyHaLong);
  const saPa = useAerial("thung-lung-sa-pa", flySaPa);
  const muCangChai = useAerial("mu-cang-chai", flyMuCangChai);
  const baiTuLong = useAerial("vinh-bai-tu-long", flyBaiTuLong);
  return (
    <section id="flycam" className="bg-[#050505] pt-28 pb-24">
      {/* Heading */}
      <div className="px-8 md:px-14 mb-14">
        <Reveal>
          <div className="flex items-end gap-5 mb-3">
            <div className="w-6 h-px bg-white/20" />
            <span className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/30">{headings.flycam.eyebrow}</span>
          </div>
          <ScrambleText text={headings.flycam.lines[0]} className="font-display font-black leading-none text-white"
            style={{ fontSize:"clamp(60px,14vw,220px)", letterSpacing:"-0.03em", lineHeight:0.88 }} />
          <ScrambleText text={headings.flycam.lines[1]} className="font-display font-black leading-none"
            style={{ fontSize:"clamp(60px,14vw,220px)", letterSpacing:"-0.03em", lineHeight:0.88, marginLeft:"12vw", color:"transparent", WebkitTextStroke:"1.5px rgba(255,255,255,0.18)" }} />
        </Reveal>
        <Reveal delay={140} className="mt-8 max-w-sm md:ml-[16vw]">
          <p className="font-sans text-[12px] leading-relaxed text-white/35 font-light">{headings.flycam.description}</p>
        </Reveal>
      </div>

      {/* Hero aerial — full width */}
      {haLong && (
      <Reveal className="px-4 md:px-8 mb-4">
        <div className="relative overflow-hidden" style={{ cursor:"none" }}
          onMouseEnter={onImgHover} onMouseLeave={onImgLeave}
          onClick={() => {}}>
          <img src={haLong.src} alt={haLong.alt} className="w-full object-cover block"
            style={{ aspectRatio:"21/9", ...(imgPos(haLong) ? { objectPosition: imgPos(haLong) } : {}) }} />
          <div className="absolute bottom-5 left-6">
            <div className="font-display font-black text-white leading-none" style={{ fontSize:"clamp(18px,3vw,40px)", letterSpacing:"-0.02em" }}>{haLong.title}</div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-white/50 uppercase mt-0.5">{`${haLong.region} · ↑ ${haLong.altitude}`}</div>
          </div>
          <div className="absolute top-4 right-5 font-mono text-[8px] tracking-[0.2em] uppercase text-white/30">{haLong.coordinates}</div>
        </div>
      </Reveal>
      )}

      {/* Second wide aerial */}
      {saPa && (
      <Reveal className="px-4 md:px-8 mb-4">
        <div className="relative overflow-hidden" style={{ cursor:"none" }}
          onMouseEnter={onImgHover} onMouseLeave={onImgLeave}>
          <img src={saPa.src} alt={saPa.alt} className="w-full object-cover block"
            style={{ aspectRatio:"21/9", ...(imgPos(saPa) ? { objectPosition: imgPos(saPa) } : {}) }} />
          <div className="absolute bottom-5 left-6">
            <div className="font-display font-black text-white leading-none" style={{ fontSize:"clamp(18px,3vw,40px)", letterSpacing:"-0.02em" }}>{saPa.title}</div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-white/50 uppercase mt-0.5">{`${saPa.region} · ↑ ${saPa.altitude}`}</div>
          </div>
          <div className="absolute top-4 right-5 font-mono text-[8px] tracking-[0.2em] uppercase text-white/30">{saPa.coordinates}</div>
        </div>
      </Reveal>
      )}

      {/* Grid of 4 portraits */}
      <div className="px-4 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-[3px] mb-4">
        {aerialFrames.map((f, i) => (
          <Reveal key={f.id} delay={i * 80}>
            <AerialPhoto src={f.src} loc={f.loc} region={f.region} alt={f.altitude}
              className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} />
          </Reveal>
        ))}
      </div>

      {/* Panoramic closer */}
      {muCangChai && (
      <Reveal className="px-4 md:px-8">
        <div className="relative overflow-hidden" style={{ cursor:"none" }}
          onMouseEnter={onImgHover} onMouseLeave={onImgLeave}>
          <img src={muCangChai.src} alt={muCangChai.alt} className="w-full object-cover block"
            style={{ aspectRatio:"21/9", ...(imgPos(muCangChai) ? { objectPosition: imgPos(muCangChai) } : {}) }} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ScrambleText text={ghost.flycam} className="font-display font-black leading-none text-white/10 text-center"
              style={{ fontSize:"clamp(40px,8vw,130px)", letterSpacing:"-0.025em" }} />
          </div>
          <div className="absolute bottom-5 right-6 text-right">
            <div className="font-display font-black text-white leading-none" style={{ fontSize:"clamp(18px,3vw,40px)", letterSpacing:"-0.02em" }}>{muCangChai.title}</div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-white/50 uppercase mt-0.5">{`${muCangChai.region} · ↑ ${muCangChai.altitude}`}</div>
          </div>
        </div>
      </Reveal>
      )}

      {/* Karst panoramic */}
      {baiTuLong && (
      <Reveal className="px-4 md:px-8 mt-[3px]">
        <div className="relative overflow-hidden" style={{ cursor:"none" }}
          onMouseEnter={onImgHover} onMouseLeave={onImgLeave}>
          <img src={baiTuLong.src} alt={baiTuLong.alt} className="w-full object-cover block"
            style={{ aspectRatio:"21/9", ...(imgPos(baiTuLong) ? { objectPosition: imgPos(baiTuLong) } : {}) }} />
          <div className="absolute bottom-5 left-6">
            <div className="font-display font-black text-white leading-none" style={{ fontSize:"clamp(18px,3vw,40px)", letterSpacing:"-0.02em" }}>{baiTuLong.title}</div>
            <div className="font-mono text-[9px] tracking-[0.2em] text-white/50 uppercase mt-0.5">{`${baiTuLong.region} · ↑ ${baiTuLong.altitude}`}</div>
          </div>
        </div>
      </Reveal>
      )}

      {/* Capabilities strip */}
      <Reveal className="px-8 md:px-14 mt-16">
        <div className="border-t border-white/8 pt-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {flycamCapabilities.map(({ id, label, val }) => (
            <div key={id}>
              <div className="font-mono text-[8px] tracking-[0.22em] uppercase text-white/25 mb-1">{label}</div>
              <div className="font-sans text-[12px] text-white/60 font-light">{val}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

// ─── ROSIE ───────────────────────────────────────────────────────────────────
function RosieStory({ onImgHover, onImgLeave }: HP) {
  const { rosieNumerals } = useSiteCopy();
  const rosie = usePhotography(rosieProject);
  if (!rosie) return null;
  const [r1, r2, r3, r4a, r4b, r5a, r5b, r5c, r6] = rosie.images;
  return (
    <section className="bg-[#f5f0e8] pt-24 pb-28">
      <div className="px-8 md:px-14 mb-14">
        <Reveal>
          <div className="flex items-end gap-8">
            <ScrambleText text={rosie.title} className="font-display font-black leading-none" style={{ fontSize:"clamp(60px,14vw,220px)", letterSpacing:"-0.03em", lineHeight:0.88 }} />
            <div className="mb-2 hidden md:block"><Lbl>{rosie.subtitle}</Lbl><Lbl>{rosie.location}</Lbl><Lbl>{rosie.year}</Lbl></div>
          </div>
          <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-[#888] mt-2">{rosie.subtitle}</div>
        </Reveal>
      </div>
      {r1 && <Reveal className="px-4 md:px-8 mb-6"><Photo src={r1.src} alt={r1.alt} className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={r1.exifIdx} objectPosition={imgPos(r1)} /></Reveal>}
      <div className="px-8 md:px-14 my-16 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 items-start">
        {r2 && <Reveal><Photo src={r2.src} alt={r2.alt} className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={r2.exifIdx} objectPosition={imgPos(r2)} /></Reveal>}
        <Reveal delay={100} className="hidden md:flex items-end justify-end pb-6"><div className="text-right"><ScrambleText text={rosieNumerals[0].numeral} className="font-display font-black leading-none text-[#e8e3da]" style={{ fontSize:"clamp(40px,7vw,120px)", letterSpacing:"-0.02em" }} /><Lbl>{rosieNumerals[0].label}</Lbl></div></Reveal>
      </div>
      <div className="px-8 md:px-14 my-16 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 items-start">
        <Reveal delay={80} className="hidden md:flex items-start pt-20"><div><ScrambleText text={rosieNumerals[1].numeral} className="font-display font-black leading-none text-[#e8e3da]" style={{ fontSize:"clamp(40px,7vw,120px)", letterSpacing:"-0.02em" }} /><Lbl>{rosieNumerals[1].label}</Lbl></div></Reveal>
        {r3 && <Reveal><Photo src={r3.src} alt={r3.alt} className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={r3.exifIdx} objectPosition={imgPos(r3)} /></Reveal>}
      </div>
      <div className="px-8 md:px-14 my-6 grid grid-cols-2 gap-3 md:gap-6">{[r4a,r4b].filter(Boolean).map((img,i)=><Reveal key={img.id} delay={i*120}><Photo src={img.src} alt={img.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={img.exifIdx} objectPosition={imgPos(img)} /></Reveal>)}</div>
      <div className="px-8 md:px-20 my-16 grid grid-cols-3 gap-2 md:gap-5">{[r5a,r5b,r5c].filter(Boolean).map((img,i)=><Reveal key={img.id} delay={i*90}><Photo src={img.src} alt={img.alt} className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={img.exifIdx} objectPosition={imgPos(img)} /></Reveal>)}</div>
      {r6 && <Reveal className="px-4 md:px-8"><Photo src={r6.src} alt={r6.alt} className="w-full" style={{ aspectRatio:"21/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={r6.exifIdx} objectPosition={imgPos(r6)} /></Reveal>}
      <div className="px-8 md:px-14">
        <PhotoOverflow images={rosie.images.slice(9)} onImgHover={onImgHover} onImgLeave={onImgLeave} />
      </div>
    </section>
  );
}

// ─── COLLAGE ─────────────────────────────────────────────────────────────────
function CollageSection({ onImgHover, onImgLeave }: HP) {
  const { collage } = useSiteCopy();
  const [c1, c2, c3] = collage.overlays;
  return (
    <section className="bg-[#0a0a0a] py-24 px-4 md:px-8">
      <div className="relative">
        <Reveal><Photo src={collage.background.src} alt={collage.background.alt} className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={collage.background.exifIdx} /></Reveal>
        {c1 && <div className="absolute top-0 right-0 w-[22%] md:w-[18%]" style={{ transform:"translate(6%,-12%)" }}><Reveal delay={200}><Photo src={c1.src} alt={c1.alt} className="w-full shadow-2xl" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={c1.exifIdx} /></Reveal></div>}
        {c2 && <div className="absolute bottom-0 left-0 w-[20%] md:w-[16%]" style={{ transform:"translate(-4%,14%)" }}><Reveal delay={280}><Photo src={c2.src} alt={c2.alt} className="w-full shadow-2xl" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={c2.exifIdx} /></Reveal></div>}
        {c3 && <div className="absolute top-[30%] left-[4%] w-[28%] md:w-[22%]" style={{ transform:"rotate(-1.5deg)" }}><Reveal delay={160}><Photo src={c3.src} alt={c3.alt} className="w-full shadow-xl" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={c3.exifIdx} /></Reveal></div>}
        <div className="absolute bottom-6 right-6 text-right">{collage.meta.map(m => <Lbl key={m} light>{m}</Lbl>)}</div>
      </div>
      <Reveal className="mt-16 px-4 md:px-6"><ScrambleText text={collage.word} className="font-display font-black leading-none" style={{ fontSize:"clamp(50px,10vw,160px)", letterSpacing:"-0.02em", color:"rgba(255,255,255,0.07)" }} /></Reveal>
    </section>
  );
}

// ─── PERSONAL GALLERY ────────────────────────────────────────────────────────
function PersonalGallery({ onImgHover, onImgLeave }: HP) {
  const { headings, gallery } = useSiteCopy();
  const [g0, g1, g2, g3, g4, g5, ...extras] = gallery;
  return (
    <section id="gallery" className="bg-white pt-24 pb-28">
      <div className="px-8 md:px-14 mb-14">
        <Reveal><ScrambleText text={headings.gallery.lines[0]} className="font-display font-black leading-none" style={{ fontSize:"clamp(46px,10vw,160px)", letterSpacing:"-0.025em", lineHeight:0.88 }} /></Reveal>
        <Reveal delay={80}><ScrambleText text={headings.gallery.lines[1]} className="font-display font-black leading-none" style={{ fontSize:"clamp(46px,10vw,160px)", letterSpacing:"-0.025em", lineHeight:0.88, marginLeft:"10vw", color:"transparent", WebkitTextStroke:"1.5px #0a0a0a" }} /></Reveal>
      </div>
      <div className="px-8 md:px-14">
        {(g0 || g1) && (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-4 mb-4 items-end">
            {g0 && <Reveal><div><Photo src={g0.src} alt={g0.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={g0.exifIdx} objectPosition={imgPos(g0)} /><div className="mt-2"><Lbl>{g0.location}</Lbl><Lbl>{g0.year}</Lbl></div></div></Reveal>}
            {g1 && <Reveal delay={130}><div className="md:mt-16"><Photo src={g1.src} alt={g1.alt} className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={g1.exifIdx} objectPosition={imgPos(g1)} /><div className="mt-2"><Lbl>{g1.location}</Lbl><Lbl>{g1.year}</Lbl></div></div></Reveal>}
          </div>
        )}
        {(g2 || g3 || g4) && (
          <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_0.8fr] gap-4 mt-6 items-start">
            {g2 && <Reveal><div><Photo src={g2.src} alt={g2.alt} className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={g2.exifIdx} objectPosition={imgPos(g2)} /><div className="mt-2"><Lbl>{g2.location}</Lbl><Lbl>{g2.year}</Lbl></div></div></Reveal>}
            {g3 && <Reveal delay={100}><div className="md:mt-24"><Photo src={g3.src} alt={g3.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={g3.exifIdx} objectPosition={imgPos(g3)} /><div className="mt-2"><Lbl>{g3.location}</Lbl><Lbl>{g3.year}</Lbl></div></div></Reveal>}
            {g4 && <Reveal delay={180}><div className="md:mt-10"><Photo src={g4.src} alt={g4.alt} className="w-full" style={{ aspectRatio:"4/5" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={g4.exifIdx} objectPosition={imgPos(g4)} /><div className="mt-2"><Lbl>{g4.location}</Lbl><Lbl>{g4.year}</Lbl></div></div></Reveal>}
          </div>
        )}
        {g5 && <Reveal className="mt-6"><Photo src={g5.src} alt={g5.alt} className="w-full" style={{ aspectRatio:"21/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={g5.exifIdx} objectPosition={imgPos(g5)} /><div className="mt-2"><Lbl>{g5.location}</Lbl><Lbl>{g5.year}</Lbl></div></Reveal>}
        {extras.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {extras.map((image, index) => (
              <Reveal key={image.id} delay={index * 80}>
                <div>
                  <Photo src={image.src} alt={image.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={image.exifIdx} objectPosition={imgPos(image)} />
                  <div className="mt-2"><Lbl>{image.location}</Lbl><Lbl>{image.year}</Lbl></div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── SERVICES LIST ────────────────────────────────────────────────────────────
function ServicesSection() {
  const { services } = useSiteCopy();
  return (
    <section id="services" className="bg-[#f5f0e8] py-24 px-8 md:px-14">
      <Reveal className="mb-12">
        <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#aaa] mb-4">{services.eyebrow}</div>
        <ScrambleText text={services.heading} className="font-display font-black leading-none" style={{ fontSize:"clamp(48px,9vw,140px)", letterSpacing:"-0.025em", lineHeight:0.88 }} />
      </Reveal>
      <div className="border-t border-[#e0dbd4]">
        {services.items.map(s => (
          <Reveal key={s.id}><ServiceItem num={s.num} title={s.title} subtitle={s.subtitle} previewSrc={s.previewSrc} /></Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── ABOUT ───────────────────────────────────────────────────────────────────
function AboutSection({ onImgHover, onImgLeave }: HP) {
  const { about } = useSiteCopy();
  return (
    <section id="about" className="bg-white py-24 md:py-32 px-8 md:px-14">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10 md:gap-16 items-start">
        <Reveal><Photo src={about.image.src} alt={about.image.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={about.image.exifIdx} objectPosition={managedObjectPosition(about.image.focalPointX, about.image.focalPointY)} /></Reveal>
        <Reveal delay={150} className="flex flex-col justify-end md:pb-10">
          <ScrambleText text={about.headings[0]} className="font-display font-black leading-none" style={{ fontSize:"clamp(44px,8vw,130px)", letterSpacing:"-0.025em", lineHeight:0.88 }} />
          <ScrambleText text={about.headings[1]} className="font-display font-black leading-none mt-1" style={{ fontSize:"clamp(44px,8vw,130px)", letterSpacing:"-0.025em", lineHeight:0.88, color:"transparent", WebkitTextStroke:"1.5px #0a0a0a" }} />
          <div className="mt-10 space-y-4">
            {about.paragraphs.map(p => (
              <p key={p} className="font-sans text-sm leading-relaxed text-[#444] font-light">{p}</p>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-[#ddd] space-y-2">
            {about.details.map(d => <Lbl key={d}>{d}</Lbl>)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── CONTACT ─────────────────────────────────────────────────────────────────
function ContactSection({ onImgHover, onImgLeave }: HP) {
  const { contact } = useSiteCopy();
  return (
    <section id="contact" className="bg-[#0a0a0a] py-24 md:py-32 px-8 md:px-14">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-10 md:gap-16 items-start">
        <Reveal className="flex flex-col justify-between h-full">
          <div>
            {contact.words.map((w,i) => (
              <ScrambleText key={w} text={w} className="font-display font-black leading-none" style={{ fontSize:"clamp(58px,10vw,160px)", letterSpacing:"-0.025em", lineHeight:0.86, color:i<2?"#fff":"transparent", WebkitTextStroke:i>=2?"1.5px rgba(255,255,255,0.4)":undefined }} />
            ))}
          </div>
          <div className="mt-16 md:mt-20 space-y-5 border-t border-white/10 pt-8">
            {contact.links.map(({ label,val,href })=>(
              <div key={label}><Lbl light>{label}</Lbl><a href={href} className="font-sans text-sm text-white/60 hover:text-white transition-colors duration-300">{val}</a></div>
            ))}
            <div><Lbl light>{contact.addressLabel}</Lbl><span className="font-sans text-sm text-white/60">{contact.address}</span></div>
          </div>
        </Reveal>
        <Reveal delay={160}><Photo src={contact.image.src} alt={contact.image.alt} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={contact.image.exifIdx} objectPosition={managedObjectPosition(contact.image.focalPointX, contact.image.focalPointY)} /></Reveal>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  const { settings, footer } = useSiteCopy();
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/8 px-8 md:px-14 py-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="font-display font-black text-white text-sm tracking-widest">{settings.name}</div>
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-white/30 mt-1">{footer.tagline}</div>
        </div>
        <div className="flex items-center gap-8">
          {footer.links.map(({ label, href }) => (
            <MagneticLink key={label} href={href} color="rgba(255,255,255,0.4)">{label}</MagneticLink>
          ))}
          <button onClick={() => window.scrollTo({ top:0, behavior:"smooth" })} className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/40 hover:text-white/80 transition-colors duration-200">{footer.backToTop}</button>
        </div>
        <div className="font-mono text-[9px] tracking-[0.18em] text-white/25">{footer.copyright}</div>
      </div>
    </footer>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <SiteCopyProvider>
      <PortfolioProvider>
        <Portfolio />
      </PortfolioProvider>
    </SiteCopyProvider>
  );
}

function Portfolio() {
  const [imgHover, setImgHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [scrollY, setScrollY]   = useState(0);
  const [lb, setLb]             = useState<{ src:string; ei:number }|null>(null);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  const hp: HP = { onImgHover:()=>setImgHover(true), onImgLeave:()=>setImgHover(false) };
  return (
    <LbCtx.Provider value={{ open:(src,ei)=>setLb({src,ei}) }}>
      <div className="bg-[#f5f0e8] text-[#0a0a0a] font-sans" style={{ cursor:"none" }}>
        <FilmGrain />
        <CustomCursor imgHover={imgHover} dragging={dragging} />
        <ScrollProgress />
        <Header />
        <Hero scrollY={scrollY} {...hp} />
        <Marquee />
        <SelectedWork {...hp} />
        <StatementSection />
        <FilmStrip {...hp} onDragChange={setDragging} />
        <FlycamSection {...hp} />
        <CorporateSection {...hp} />
        <RetouchSection {...hp} />
        <RosieStory {...hp} />
        <CollageSection {...hp} />
        <PersonalGallery {...hp} />
        <ServicesSection />
        <AboutSection {...hp} />
        <ContactSection {...hp} />
        <Footer />
        {lb && <Lightbox src={lb.src} ei={lb.ei} onClose={()=>setLb(null)} />}
      </div>
    </LbCtx.Provider>
  );
}
