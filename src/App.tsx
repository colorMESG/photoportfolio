import {
  useState, useEffect, useRef, useCallback, createContext, useContext,
  type ReactNode, type CSSProperties, type MouseEvent as RME,
} from "react";

// ─── image map — Vietnamese photography ─────────────────────────────────────
const I = {
  // editorial / fashion — nguồn: Unsplash photographers Việt Nam
  hero:  "https://images.unsplash.com/photo-1760341682460-ca6f13eb035a?w=1400&h=2000&fit=crop&auto=format",
  p1a:   "https://images.unsplash.com/photo-1772443325915-06ebf4d80fd3?w=700&h=1050&fit=crop&auto=format",
  p1b:   "https://images.unsplash.com/photo-1761014219776-4ac940eca1c2?w=500&h=700&fit=crop&auto=format",
  p2a:   "https://images.unsplash.com/photo-1765021560210-5b0d950b45a9?w=1100&h=650&fit=crop&auto=format",
  p2b:   "https://images.unsplash.com/photo-1578409682213-e27b3355cad7?w=420&h=600&fit=crop&auto=format",
  p3a:   "https://images.unsplash.com/photo-1768452570546-6f82796c240b?w=400&h=640&fit=crop&auto=format",
  p3b:   "https://images.unsplash.com/photo-1761014219855-4f598e712c26?w=400&h=640&fit=crop&auto=format",
  p3c:   "https://images.unsplash.com/photo-1765021561938-fad3f1122b14?w=400&h=640&fit=crop&auto=format",
  p4:    "https://images.unsplash.com/photo-1591866605101-67aa6d498cce?w=1400&h=900&fit=crop&auto=format",
  p5a:   "https://images.unsplash.com/photo-1674401770404-7d05485deb6a?w=650&h=850&fit=crop&auto=format",
  p5b:   "https://images.unsplash.com/photo-1733561315077-3c7206344333?w=380&h=520&fit=crop&auto=format",
  p5c:   "https://images.unsplash.com/photo-1576565315529-dd151aeebb8d?w=320&h=440&fit=crop&auto=format",
  // rosie portrait story
  r1:    "https://images.unsplash.com/photo-1672039316587-0acb7676f754?w=1400&h=800&fit=crop&auto=format",
  r2:    "https://images.unsplash.com/photo-1768017093116-42ee61fd5d2b?w=600&h=860&fit=crop&auto=format",
  r3:    "https://images.unsplash.com/photo-1674401770404-7d05485deb6a?w=600&h=860&fit=crop&auto=format",
  r4a:   "https://images.unsplash.com/photo-1576565315529-dd151aeebb8d?w=700&h=900&fit=crop&auto=format",
  r4b:   "https://images.unsplash.com/photo-1733561315077-3c7206344333?w=700&h=900&fit=crop&auto=format",
  r5a:   "https://images.unsplash.com/photo-1761014219776-4ac940eca1c2?w=360&h=540&fit=crop&auto=format",
  r5b:   "https://images.unsplash.com/photo-1761014219855-4f598e712c26?w=360&h=540&fit=crop&auto=format",
  r5c:   "https://images.unsplash.com/photo-1765021561938-fad3f1122b14?w=360&h=540&fit=crop&auto=format",
  r6:    "https://images.unsplash.com/photo-1591866605101-67aa6d498cce?w=1400&h=700&fit=crop&auto=format",
  // collage / gallery
  cbg:   "https://images.unsplash.com/photo-1764136454026-172c59780914?w=1400&h=900&fit=crop&auto=format",
  c1:    "https://images.unsplash.com/photo-1688504087674-43c79cf49a84?w=260&h=360&fit=crop&auto=format",
  c2:    "https://images.unsplash.com/photo-1616472961382-13c212a1911b?w=240&h=320&fit=crop&auto=format",
  c3:    "https://images.unsplash.com/photo-1776236075200-7c9b1b2d327e?w=280&h=180&fit=crop&auto=format",
  g1:    "https://images.unsplash.com/photo-1761150285751-c593ab20159c?w=600&h=800&fit=crop&auto=format",
  g2:    "https://images.unsplash.com/photo-1574699404005-b6120622b1e7?w=500&h=700&fit=crop&auto=format",
  g3:    "https://images.unsplash.com/photo-1585970661791-9cec67470281?w=700&h=480&fit=crop&auto=format",
  g4:    "https://images.unsplash.com/photo-1528127269322-539801943592?w=700&h=480&fit=crop&auto=format",
  g5:    "https://images.unsplash.com/photo-1687902409602-8b7cf039a44a?w=500&h=640&fit=crop&auto=format",
  g6:    "https://images.unsplash.com/photo-1776236075314-f5de886f8d2c?w=640&h=420&fit=crop&auto=format",
  about: "https://images.unsplash.com/photo-1578409682213-e27b3355cad7?w=700&h=950&fit=crop&auto=format",
  ctct:  "https://images.unsplash.com/photo-1768017093116-42ee61fd5d2b?w=900&h=1100&fit=crop&auto=format",
  // ── CORPORATE headshots — Ky Nang / Nerf Portraits (Asian professional)
  h1:    "https://images.unsplash.com/photo-1665224752561-85f4da9a5658?w=500&h=700&fit=crop&auto=format",
  h2:    "https://images.unsplash.com/photo-1616639943825-e0fbad20a3d3?w=500&h=700&fit=crop&auto=format",
  h3:    "https://images.unsplash.com/photo-1665224752136-4dbe2dfc8195?w=500&h=700&fit=crop&auto=format",
  h4:    "https://images.unsplash.com/photo-1665224752123-a2ea29dddcb2?w=500&h=700&fit=crop&auto=format",
  h5:    "https://images.unsplash.com/photo-1665224751641-8ea911ca2267?w=500&h=700&fit=crop&auto=format",
  h6:    "https://images.unsplash.com/photo-1697288454587-14d38111df00?w=500&h=700&fit=crop&auto=format",
  // ── CORPORATE events — Bùi Đạt + Elist Nguyen
  e1:    "https://images.unsplash.com/photo-1756806481210-672c297558e7?w=900&h=600&fit=crop&auto=format",
  e2:    "https://images.unsplash.com/photo-1756806481200-4c35450e87e4?w=900&h=600&fit=crop&auto=format",
  e3:    "https://images.unsplash.com/photo-1529739195191-4246f11b3382?w=500&h=700&fit=crop&auto=format",
  e4:    "https://images.unsplash.com/photo-1650732325541-8de724c00601?w=900&h=600&fit=crop&auto=format",
  e5:    "https://images.unsplash.com/photo-1743128105803-961ff400c83e?w=900&h=600&fit=crop&auto=format",
  // ── CORPORATE teams
  t1:    "https://images.unsplash.com/photo-1529739195191-4246f11b3382?w=900&h=500&fit=crop&auto=format",
  t2:    "https://images.unsplash.com/photo-1756806481210-672c297558e7?w=900&h=500&fit=crop&auto=format",
  t3:    "https://images.unsplash.com/photo-1650732325522-6f758102e71a?w=900&h=500&fit=crop&auto=format",
  t4:    "https://images.unsplash.com/photo-1776236075200-7c9b1b2d327e?w=900&h=600&fit=crop&auto=format",
};

const EXIF = [
  { camera: "NIKON Z9",     lens: "85mm f/1.4G",   exp: "f/1.4 · 1/640s · ISO 400" },
  { camera: "SONY A7R V",   lens: "50mm f/1.2 GM",  exp: "f/1.2 · 1/500s · ISO 200" },
  { camera: "CANON EOS R5", lens: "135mm f/1.8L",   exp: "f/1.8 · 1/320s · ISO 800" },
  { camera: "LEICA M11",    lens: "35mm f/1.4 ASPH",exp: "f/2.0 · 1/250s · ISO 640" },
  { camera: "FUJI X-T5",    lens: "56mm f/1.2 R",   exp: "f/1.2 · 1/800s · ISO 160" },
  { camera: "NIKON Z9",     lens: "70–200mm f/2.8",  exp: "f/2.8 · 1/1000s · ISO 320" },
];

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
function Photo({ src, alt, className="", style, onHover, onLeave, exifIdx=0 }: {
  src:string; alt:string; className?:string; style?:CSSProperties;
  onHover?:()=>void; onLeave?:()=>void; exifIdx?:number;
}) {
  const lb = useContext(LbCtx);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [pos, setPos] = useState({ x:50, y:50 });
  const exif = EXIF[exifIdx % EXIF.length];
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
      <img src={src} alt={alt} className="w-full h-full object-cover block" />
      <div className="absolute inset-0" style={{ backgroundImage:`url(${src})`, backgroundSize:"cover", backgroundPosition:"center", filter:"grayscale(1) contrast(1.08)", WebkitMaskImage:mask, maskImage:mask }} />
      <div className="absolute bottom-0 left-0 right-0" style={{ background:"linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)", padding:"24px 14px 12px", transform:hovered?"translateY(0)":"translateY(100%)", transition:"transform 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="font-mono text-[9px] tracking-[0.18em] text-white/50 uppercase mb-0.5">{exif.camera}</div>
        <div className="font-mono text-[9px] tracking-[0.18em] text-white/70 uppercase">{exif.lens} &nbsp;·&nbsp; {exif.exp}</div>
      </div>
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow:hovered?"inset 0 0 0 1px rgba(255,255,255,0.12)":"none", transition:"box-shadow 0.3s" }} />
    </div>
  );
}

// ─── CORP PHOTO — corporate: full color + info card + tilt + lightbox ────────
function CorpPhoto({ src, alt, className="", style, onHover, onLeave, category, client, year="2026" }: {
  src:string; alt:string; className?:string; style?:CSSProperties;
  onHover?:()=>void; onLeave?:()=>void;
  category:string; client:string; year?:string;
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
      <img src={src} alt={alt} className="w-full h-full object-cover block" style={{ transform:hovered?"scale(1.06)":"scale(1)", transition:"transform 1s cubic-bezier(0.16,1,0.3,1)", filter:hovered?"brightness(1.04)":"brightness(1)" }} />
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
      <div className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-black/60"><span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/70">Trước</span></div>
      <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-black/60"><span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/70">Sau</span></div>
      <div className="absolute bottom-4 left-0 right-0 text-center z-10">
        <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/40">Kéo để so sánh</span>
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
  const items = ["Chân dung Doanh nghiệp","Headshot","Nhiếp ảnh Sự kiện","Ảnh Nhân sự","Chiến dịch Thương hiệu","Báo cáo Thường niên","Nhiếp ảnh Hội nghị","Ra mắt Sản phẩm","Ảnh Đội nhóm","Lễ trao giải"];
  const text = items.map(s => `${s}  ·  `).join("");
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
  const exif = EXIF[ei % EXIF.length];
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
          <button onClick={onClose} className="absolute -top-10 right-0 font-mono text-[9px] tracking-[0.2em] uppercase text-white/30 hover:text-white/70 transition-colors">ESC / ĐÓNG</button>
        </div>
      </div>
    </>
  );
}

// ─── FILM STRIP ───────────────────────────────────────────────────────────────
const STRIP = [
  { src:`https://images.unsplash.com/photo-1616472961382-13c212a1911b?w=260&h=390&fit=crop&auto=format`, n:"001", loc:"Tp. HCM", p:true },
  { src:`https://images.unsplash.com/photo-1776236075200-7c9b1b2d327e?w=400&h=260&fit=crop&auto=format`, n:"002", loc:"Hội An", p:false },
  { src:`https://images.unsplash.com/photo-1772443325915-06ebf4d80fd3?w=260&h=390&fit=crop&auto=format`, n:"003", loc:"Tp. HCM", p:true },
  { src:`https://images.unsplash.com/photo-1591866605101-67aa6d498cce?w=400&h=260&fit=crop&auto=format`, n:"004", loc:"Tp. HCM", p:false },
  { src:`https://images.unsplash.com/photo-1578409682213-e27b3355cad7?w=260&h=390&fit=crop&auto=format`, n:"005", loc:"Hội An", p:true },
  { src:`https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=260&fit=crop&auto=format`, n:"006", loc:"Hạ Long", p:false },
  { src:`https://images.unsplash.com/photo-1688504087674-43c79cf49a84?w=260&h=390&fit=crop&auto=format`, n:"007", loc:"Tp. HCM", p:true },
  { src:`https://images.unsplash.com/photo-1740232187966-a42e7e4d1e76?w=400&h=260&fit=crop&auto=format`, n:"008", loc:"Hà Nội", p:false },
  { src:`https://images.unsplash.com/photo-1765021561938-fad3f1122b14?w=260&h=390&fit=crop&auto=format`, n:"009", loc:"Tp. HCM", p:true },
  { src:`https://images.unsplash.com/photo-1687902409602-8b7cf039a44a?w=400&h=260&fit=crop&auto=format`, n:"010", loc:"Tp. HCM", p:false },
];

function FilmStrip({ onImgHover, onImgLeave, onDragChange }: HP & { onDragChange:(v:boolean)=>void }) {
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
        <Reveal><ScrambleText text="35mm" className="font-display font-black leading-none text-white/10" style={{ fontSize:"clamp(40px,6vw,90px)", letterSpacing:"-0.02em" }} /></Reveal>
        <Reveal delay={60} className="hidden md:flex flex-col gap-1">
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/25">Thước phim tiếp xúc</span>
          <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/15">NAHN · 2026 · Kéo để cuộn</span>
        </Reveal>
      </div>
      <div className="relative">
        <div className="overflow-hidden" style={{ height:22, background:"#111" }}><div className="flex items-center px-3 gap-[9px]" style={{ height:"100%" }}>{Array.from({length:80}).map((_,i) => <div key={i} className="flex-shrink-0 rounded-sm bg-[#0a0a0a]" style={{ width:12, height:14 }} />)}</div></div>
        <div ref={containerRef} className="flex gap-[2px] overflow-x-auto" style={{ scrollbarWidth:"none", cursor:"none", background:"#080808" }} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
          {STRIP.map((f, idx) => (
            <div key={f.n} className="flex-shrink-0 relative group" style={{ width:f.p?260:400, height:390, background:"#111" }} onMouseEnter={onImgHover} onMouseLeave={onImgLeave}>
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
  const [sc, setSc] = useState(false);
  useEffect(() => { const h = () => setSc(window.scrollY > 70); window.addEventListener("scroll", h, { passive:true }); return () => window.removeEventListener("scroll", h); }, []);
  const fg = sc ? "#0a0a0a" : "#fff";
  return (
    <header className="fixed top-0 left-0 right-0 z-40 px-8 md:px-14 py-5 flex items-center justify-between"
      style={{ backgroundColor:sc?"rgba(245,240,232,0.96)":"transparent", backdropFilter:sc?"blur(10px)":"none", transition:"background-color 0.5s ease" }}>
      <div>
        <div className="font-display font-black text-sm tracking-widest leading-none" style={{ color:fg }}>NAHN</div>
        <div className="font-mono text-[9px] tracking-[0.22em] uppercase mt-0.5" style={{ color:sc?"#aaa":"rgba(255,255,255,0.4)" }}>Nhiếp ảnh</div>
      </div>
      <nav className="flex items-center gap-7 md:gap-10">
        {[{label:"Tác phẩm",href:"#work"},{label:"Doanh nghiệp",href:"#business"},{label:"Về tôi",href:"#about"},{label:"Instagram",href:"https://instagram.com/nahn"}].map(({label,href}) => (
          <MagneticLink key={label} href={href} color={fg}>{label}</MagneticLink>
        ))}
      </nav>
    </header>
  );
}

// ─── HERO ────────────────────────────────────────────────────────────────────
function Hero({ scrollY, onImgHover, onImgLeave }: HP & { scrollY:number }) {
  const [mx, setMx] = useState(0); const [my, setMy] = useState(0);
  useEffect(() => { const h = (e: MouseEvent) => { setMx(((e.clientX/window.innerWidth)-.5)*-18); setMy(((e.clientY/window.innerHeight)-.5)*-12); }; window.addEventListener("mousemove", h); return () => window.removeEventListener("mousemove", h); }, []);
  return (
    <section className="relative h-screen overflow-hidden bg-[#0a0a0a]">
      <div className="absolute inset-[-4%]" style={{ transform:`translateX(${mx}px) translateY(calc(${scrollY*.28}px + ${my}px))`, transition:"transform 0.08s linear", willChange:"transform" }} onMouseEnter={onImgHover} onMouseLeave={onImgLeave}>
        <img src={I.hero} alt="Portrait by NAHN" className="w-full h-full object-cover" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/20" />
      <div className="absolute inset-0 flex flex-col justify-center overflow-visible pointer-events-none" style={{ paddingLeft:"5vw" }}>
        {(["NAHN","NHIẾP","ẢNH."] as const).map((word, idx) => (
          <ScrambleText key={word} text={word} className="font-display font-black leading-none pointer-events-auto"
            style={{ fontSize:"clamp(64px,18vw,290px)", letterSpacing:"-0.03em", lineHeight:0.92, marginTop:idx===0?0:"-0.04em", color:idx===2?"transparent":"#fff", WebkitTextStroke:idx===2?"1.5px rgba(255,255,255,0.5)":undefined }} />
        ))}
      </div>
      <div className="absolute bottom-28 right-10 text-right space-y-1 hidden md:block">
        <Lbl light>Hồ sơ Nhiếp ảnh</Lbl><Lbl light>2026</Lbl><Lbl light>Thành phố Hồ Chí Minh</Lbl>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <Lbl light>Cuộn xuống</Lbl>
        <div className="relative w-px h-12 overflow-hidden bg-white/20"><div className="absolute w-full bg-white/70" style={{ height:"40%", animation:"scrollDrop 1.8s ease-in-out infinite" }} /></div>
      </div>
      <style>{`@keyframes scrollDrop{0%{transform:translateY(-100%)}100%{transform:translateY(300%)}}`}</style>
    </section>
  );
}

// ─── SELECTED WORK ───────────────────────────────────────────────────────────
function SelectedWork({ onImgHover, onImgLeave }: HP) {
  return (
    <section id="work" className="bg-[#f5f0e8] pt-28 pb-0">
      <div className="px-8 md:px-14 overflow-hidden">
        <Reveal><ScrambleText text="TÁC PHẨM" className="font-display font-black leading-none" style={{ fontSize:"clamp(52px,11vw,170px)", letterSpacing:"-0.02em", lineHeight:0.9 }} /></Reveal>
        <Reveal delay={80}><ScrambleText text="CHỌN LỌC." className="font-display font-black leading-none" style={{ fontSize:"clamp(52px,11vw,170px)", letterSpacing:"-0.02em", lineHeight:0.9, marginLeft:"8vw", color:"transparent", WebkitTextStroke:"1.5px #0a0a0a" }} /></Reveal>
      </div>
      <div className="mt-24 px-8 md:px-14">
        <Reveal className="flex items-start gap-3 md:gap-6 mb-6"><Lbl>01</Lbl><div><Lbl>Nghiên cứu Chân dung</Lbl><Lbl>2026</Lbl></div></Reveal>
        <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 md:gap-6 items-start">
          <Reveal><Photo src={I.p1a} alt="Portrait study 01A" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={0} /></Reveal>
          <Reveal delay={160} className="md:mt-32"><Photo src={I.p1b} alt="Portrait study 01B" className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={1} /></Reveal>
        </div>
      </div>
      <div className="mt-24 bg-[#0a0a0a] py-20 px-8 md:px-14">
        <Reveal className="flex items-center gap-4 mb-8"><Lbl light>02</Lbl><div><Lbl light>Loạt ảnh Ngoại cảnh</Lbl><Lbl light>2025</Lbl></div></Reveal>
        <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-end">
          <Reveal className="w-full md:w-[68%]"><Photo src={I.p2a} alt="Location 02A" className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={2} /></Reveal>
          <Reveal delay={140} className="w-full md:w-[30%]"><Photo src={I.p2b} alt="Location 02B" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={3} /></Reveal>
        </div>
        <Reveal delay={200} className="mt-8"><ScrambleText text="NGOẠI CẢNH" className="font-display font-black leading-none" style={{ fontSize:"clamp(40px,8vw,130px)", letterSpacing:"-0.02em", color:"rgba(255,255,255,0.07)" }} /></Reveal>
      </div>
      <div className="mt-24 px-8 md:px-14">
        <Reveal className="flex items-center gap-4 mb-8"><Lbl>03</Lbl><div><Lbl>Thước phim tiếp xúc</Lbl><Lbl>2026</Lbl></div></Reveal>
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {[I.p3a,I.p3b,I.p3c].map((src,i) => <Reveal key={src} delay={i*100}><Photo src={src} alt={`Sheet 0${i+1}`} className="w-full" style={{ aspectRatio:"2/3.2" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={i} /></Reveal>)}
        </div>
      </div>
      <div className="mt-24">
        <Reveal>
          <div className="relative mx-4 md:mx-8">
            <Photo src={I.p4} alt="Veil" className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={4} />
            <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10"><Lbl light>04</Lbl><Lbl light>Nghiên cứu Màn che</Lbl><Lbl light>2026</Lbl></div>
          </div>
        </Reveal>
      </div>
      <div className="mt-24 px-8 md:px-14 pb-24">
        <Reveal className="flex items-center gap-4 mb-8"><Lbl>05</Lbl><div><Lbl>Mảnh ghép</Lbl><Lbl>2025–2026</Lbl></div></Reveal>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_0.6fr_0.5fr] gap-4 items-start">
          <Reveal><Photo src={I.p5a} alt="Fragments 05A" className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={0} /></Reveal>
          <Reveal delay={120} className="md:mt-16"><Photo src={I.p5b} alt="Fragments 05B" className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={2} /></Reveal>
          <Reveal delay={220} className="md:mt-40"><Photo src={I.p5c} alt="Fragments 05C" className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={4} /></Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── STATEMENT ───────────────────────────────────────────────────────────────
function StatementSection() {
  return (
    <section className="bg-white py-28 md:py-40 px-8 md:px-20">
      <Reveal>
        <div className="font-display font-black leading-none" style={{ fontSize:"clamp(42px,9vw,148px)", letterSpacing:"-0.025em", lineHeight:0.88 }}>
          {["TÔI CHỤP","CON NGƯỜI,","NƠI CHỐN,","ÁNH SÁNG,","VÀ","MỌI THỨ","Ở GIỮA."].map((line,i) => (
            <ScrambleText key={line} text={line} className="block" style={{ marginLeft:[0,"12vw",0,"6vw",0,"16vw",0][i]??0 }} />
          ))}
        </div>
      </Reveal>
      <Reveal delay={200} className="mt-16 max-w-sm md:ml-[20vw]">
        <p className="font-sans text-[13px] leading-relaxed text-[#555] font-light">Tôi quan tâm đến những khoảnh khắc giữa các tư thế — biểu cảm, ánh sáng, chuyển động và những chi tiết khiến một bức ảnh trở nên cá nhân.</p>
      </Reveal>
    </section>
  );
}

// ─── CORPORATE & EVENTS ──────────────────────────────────────────────────────
function CorporateSection({ onImgHover, onImgLeave }: HP) {
  return (
    <section id="business" className="bg-[#fafafa] pt-28 pb-24">
      {/* Heading */}
      <div className="px-8 md:px-14 mb-16">
        <Reveal>
          <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#aaa] mb-4">Dành cho Doanh nghiệp</div>
          <ScrambleText text="DOANH NGHIỆP" className="font-display font-black leading-none" style={{ fontSize:"clamp(40px,8.5vw,140px)", letterSpacing:"-0.025em", lineHeight:0.88 }} />
          <ScrambleText text="& SỰ KIỆN." className="font-display font-black leading-none" style={{ fontSize:"clamp(40px,8.5vw,140px)", letterSpacing:"-0.025em", lineHeight:0.88, marginLeft:"10vw", color:"transparent", WebkitTextStroke:"1.5px #0a0a0a" }} />
        </Reveal>
        <Reveal delay={120} className="mt-6 max-w-md md:ml-[14vw]">
          <p className="font-sans text-[13px] leading-relaxed text-[#777] font-light">Ảnh chân dung doanh nghiệp, sự kiện và nhân sự — được thực hiện với sự chỉn chu và nhất quán như mọi bộ ảnh editorial.</p>
        </Reveal>
      </div>

      {/* HEADSHOTS ─ lưới 3 cột */}
      <div className="px-8 md:px-14 mb-20">
        <Reveal className="flex items-center gap-4 mb-8">
          <div className="w-8 h-px bg-[#0a0a0a]" />
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#888]">Chân dung Cá nhân & Headshot</span>
        </Reveal>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 items-start">
          <Reveal><CorpPhoto src={I.h1} alt="Headshot 01" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} category="Headshot" client="Nguyen Van A" /></Reveal>
          <Reveal delay={80} className="md:mt-10"><CorpPhoto src={I.h2} alt="Headshot 02" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} category="Chân dung" client="Tran Thi B" /></Reveal>
          <Reveal delay={160}><CorpPhoto src={I.h3} alt="Headshot 03" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} category="Headshot" client="Le Thi C" /></Reveal>
          <Reveal delay={60} className="md:mt-6"><CorpPhoto src={I.h4} alt="Headshot 04" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} category="Lãnh đạo" client="Pham Thi D" /></Reveal>
          <Reveal delay={140}><CorpPhoto src={I.h5} alt="Headshot 05" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} category="Chân dung" client="Hoang Van E" /></Reveal>
          <Reveal delay={220} className="md:mt-10"><CorpPhoto src={I.h6} alt="Headshot 06" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} category="Lãnh đạo" client="Nguyen Thi F" /></Reveal>
        </div>
      </div>

      {/* EVENTS */}
      <div className="bg-[#0a0a0a] py-20 px-8 md:px-14 mb-0">
        <Reveal className="flex items-center gap-4 mb-10">
          <div className="w-8 h-px bg-white/20" />
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">Nhiếp ảnh Sự kiện & Hội nghị</span>
        </Reveal>
        {/* Large event + small portrait */}
        <div className="grid grid-cols-1 md:grid-cols-[1.8fr_1fr] gap-3 md:gap-4 mb-4 items-start">
          <Reveal><CorpPhoto src={I.e1} alt="Panel discussion" className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} category="Hội nghị" client="TechSummit Vietnam 2026" /></Reveal>
          <Reveal delay={120} className="md:mt-12"><CorpPhoto src={I.e3} alt="Award ceremony" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} category="Trao giải" client="Giải thưởng Xuất sắc" /></Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mt-4">
          <Reveal><CorpPhoto src={I.e2} alt="Event lights" className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} category="Gala" client="Gala Thường Niên 2026" /></Reveal>
          <Reveal delay={100}>
            <div className="grid grid-cols-2 gap-3 md:gap-4 h-full">
              <CorpPhoto src={I.e4} alt="Networking" className="w-full" style={{ aspectRatio:"1" }} onHover={onImgHover} onLeave={onImgLeave} category="Sự kiện" client="Đêm Kết Nối" />
              <CorpPhoto src={I.e5} alt="Award on stage" className="w-full" style={{ aspectRatio:"1" }} onHover={onImgHover} onLeave={onImgLeave} category="Trao giải" client="Giải thưởng Đổi mới" />
            </div>
          </Reveal>
        </div>
        <Reveal delay={160} className="mt-10">
          <ScrambleText text="SỰ KIỆN." className="font-display font-black leading-none" style={{ fontSize:"clamp(40px,8vw,130px)", letterSpacing:"-0.02em", color:"rgba(255,255,255,0.06)" }} />
        </Reveal>
      </div>

      {/* TEAM PHOTOS */}
      <div className="px-8 md:px-14 pt-20">
        <Reveal className="flex items-center gap-4 mb-10">
          <div className="w-8 h-px bg-[#0a0a0a]" />
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#888]">Nhiếp ảnh Nhân sự & Đội nhóm</span>
        </Reveal>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-4 mb-4">
          <Reveal><CorpPhoto src={I.t1} alt="Diverse team" className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} category="Nhân sự" client="Startup · Tp. Hồ Chí Minh" /></Reveal>
          <Reveal delay={100}><CorpPhoto src={I.t2} alt="Business team" className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} category="Nhân sự" client="Doanh nghiệp · Tp. Hồ Chí Minh" /></Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
          <Reveal><CorpPhoto src={I.t4} alt="Team outdoor" className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} category="Outing" client="Teambuilding Cuối Năm 2025" /></Reveal>
          <Reveal delay={120}><CorpPhoto src={I.t3} alt="Team overhead" className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} category="Ảnh trên cao" client="Creative Agency" /></Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── BEFORE/AFTER + STATS ────────────────────────────────────────────────────
function RetouchSection({ onImgHover, onImgLeave }: HP) {
  return (
    <section className="bg-[#0a0a0a] py-24 px-8 md:px-14">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-16 md:gap-20 items-center">
        {/* Before / After */}
        <Reveal>
          <div className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/30 mb-6">Chỉnh sửa Headshot</div>
          <BeforeAfter src={I.h1} alt="Corporate headshot before and after" />
        </Reveal>
        {/* Stats */}
        <div>
          <Reveal className="mb-12">
            <ScrambleText text="CON SỐ." className="font-display font-black leading-none text-white/10" style={{ fontSize:"clamp(36px,5vw,80px)", letterSpacing:"-0.025em" }} />
          </Reveal>
          <div className="grid grid-cols-2 gap-8 md:gap-12">
            <StatCounter target={120} suffix="+" label="Sự kiện đã chụp" />
            <StatCounter target={45}  suffix="+"  label="Doanh nghiệp đã phục vụ" />
            <StatCounter target={800} suffix="+"  label="Chân dung đã thực hiện" />
            <StatCounter target={6}   suffix=""   label="Năm kinh nghiệm" />
          </div>
          <Reveal delay={200} className="mt-12 border-t border-white/8 pt-8">
            <p className="font-sans text-[12px] leading-relaxed text-white/35 font-light">Từ startup đến tập đoàn lớn — mỗi dự án đều được thực hiện với sự chỉn chu và phong cách nhất quán.</p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── ROSIE ───────────────────────────────────────────────────────────────────
function RosieStory({ onImgHover, onImgLeave }: HP) {
  return (
    <section className="bg-[#f5f0e8] pt-24 pb-28">
      <div className="px-8 md:px-14 mb-14">
        <Reveal>
          <div className="flex items-end gap-8">
            <ScrambleText text="ROSIE" className="font-display font-black leading-none" style={{ fontSize:"clamp(60px,14vw,220px)", letterSpacing:"-0.03em", lineHeight:0.88 }} />
            <div className="mb-2 hidden md:block"><Lbl>Nghiên cứu Chân dung</Lbl><Lbl>Tp. Hồ Chí Minh</Lbl><Lbl>2026</Lbl></div>
          </div>
          <div className="font-mono text-[11px] tracking-[0.25em] uppercase text-[#888] mt-2">Nghiên cứu Chân dung</div>
        </Reveal>
      </div>
      <Reveal className="px-4 md:px-8 mb-6"><Photo src={I.r1} alt="Rosie full-width" className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={0} /></Reveal>
      <div className="px-8 md:px-14 my-16 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 items-start">
        <Reveal><Photo src={I.r2} alt="Rosie 02" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={1} /></Reveal>
        <Reveal delay={100} className="hidden md:flex items-end justify-end pb-6"><div className="text-right"><ScrambleText text="02" className="font-display font-black leading-none text-[#e8e3da]" style={{ fontSize:"clamp(40px,7vw,120px)", letterSpacing:"-0.02em" }} /><Lbl>Ánh sáng buổi trưa</Lbl></div></Reveal>
      </div>
      <div className="px-8 md:px-14 my-16 grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 items-start">
        <Reveal delay={80} className="hidden md:flex items-start pt-20"><div><ScrambleText text="03" className="font-display font-black leading-none text-[#e8e3da]" style={{ fontSize:"clamp(40px,7vw,120px)", letterSpacing:"-0.02em" }} /><Lbl>Buổi chiều</Lbl></div></Reveal>
        <Reveal><Photo src={I.r3} alt="Rosie 03" className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={2} /></Reveal>
      </div>
      <div className="px-8 md:px-14 my-6 grid grid-cols-2 gap-3 md:gap-6">{[I.r4a,I.r4b].map((src,i)=><Reveal key={src} delay={i*120}><Photo src={src} alt={`Rosie pair ${i+4}`} className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={i+3} /></Reveal>)}</div>
      <div className="px-8 md:px-20 my-16 grid grid-cols-3 gap-2 md:gap-5">{[I.r5a,I.r5b,I.r5c].map((src,i)=><Reveal key={src} delay={i*90}><Photo src={src} alt={`Rosie strip ${i+1}`} className="w-full" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={i} /></Reveal>)}</div>
      <Reveal className="px-4 md:px-8"><Photo src={I.r6} alt="Rosie cinematic" className="w-full" style={{ aspectRatio:"21/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={5} /></Reveal>
    </section>
  );
}

// ─── COLLAGE ─────────────────────────────────────────────────────────────────
function CollageSection({ onImgHover, onImgLeave }: HP) {
  return (
    <section className="bg-[#0a0a0a] py-24 px-4 md:px-8">
      <div className="relative">
        <Reveal><Photo src={I.cbg} alt="Collage bg" className="w-full" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={2} /></Reveal>
        <div className="absolute top-0 right-0 w-[22%] md:w-[18%]" style={{ transform:"translate(6%,-12%)" }}><Reveal delay={200}><Photo src={I.c1} alt="Overlay 01" className="w-full shadow-2xl" style={{ aspectRatio:"2/3" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={4} /></Reveal></div>
        <div className="absolute bottom-0 left-0 w-[20%] md:w-[16%]" style={{ transform:"translate(-4%,14%)" }}><Reveal delay={280}><Photo src={I.c2} alt="Overlay 02" className="w-full shadow-2xl" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={1} /></Reveal></div>
        <div className="absolute top-[30%] left-[4%] w-[28%] md:w-[22%]" style={{ transform:"rotate(-1.5deg)" }}><Reveal delay={160}><Photo src={I.c3} alt="Overlay 03" className="w-full shadow-xl" style={{ aspectRatio:"16/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={3} /></Reveal></div>
        <div className="absolute bottom-6 right-6 text-right"><Lbl light>Tháng 7, 2026</Lbl><Lbl light>Nghiên cứu Chân dung</Lbl></div>
      </div>
      <Reveal className="mt-16 px-4 md:px-6"><ScrambleText text="EDITORIAL" className="font-display font-black leading-none" style={{ fontSize:"clamp(50px,10vw,160px)", letterSpacing:"-0.02em", color:"rgba(255,255,255,0.07)" }} /></Reveal>
    </section>
  );
}

// ─── PERSONAL GALLERY ────────────────────────────────────────────────────────
function PersonalGallery({ onImgHover, onImgLeave }: HP) {
  return (
    <section className="bg-white pt-24 pb-28">
      <div className="px-8 md:px-14 mb-14">
        <Reveal><ScrambleText text="BỘ SƯU TẬP" className="font-display font-black leading-none" style={{ fontSize:"clamp(46px,10vw,160px)", letterSpacing:"-0.025em", lineHeight:0.88 }} /></Reveal>
        <Reveal delay={80}><ScrambleText text="CÁ NHÂN." className="font-display font-black leading-none" style={{ fontSize:"clamp(46px,10vw,160px)", letterSpacing:"-0.025em", lineHeight:0.88, marginLeft:"10vw", color:"transparent", WebkitTextStroke:"1.5px #0a0a0a" }} /></Reveal>
      </div>
      <div className="px-8 md:px-14">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr] gap-4 mb-4 items-end">
          <Reveal><div><Photo src={I.g1} alt="Hội An" className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={0} /><div className="mt-2"><Lbl>Hội An</Lbl><Lbl>2026</Lbl></div></div></Reveal>
          <Reveal delay={130}><div className="md:mt-16"><Photo src={I.g3} alt="Sa Pa" className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={3} /><div className="mt-2"><Lbl>Sa Pa</Lbl><Lbl>2025</Lbl></div></div></Reveal>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr_0.8fr] gap-4 mt-6 items-start">
          <Reveal><div><Photo src={I.g4} alt="Hạ Long" className="w-full" style={{ aspectRatio:"16/10" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={2} /><div className="mt-2"><Lbl>Vịnh Hạ Long</Lbl><Lbl>2025</Lbl></div></div></Reveal>
          <Reveal delay={100}><div className="md:mt-24"><Photo src={I.g2} alt="Biển đảo" className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={1} /><div className="mt-2"><Lbl>Phú Quốc</Lbl><Lbl>2026</Lbl></div></div></Reveal>
          <Reveal delay={180}><div className="md:mt-10"><Photo src={I.g5} alt="Phố ăn đêm" className="w-full" style={{ aspectRatio:"4/5" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={4} /><div className="mt-2"><Lbl>Tp. Hồ Chí Minh</Lbl><Lbl>2026</Lbl></div></div></Reveal>
        </div>
        <Reveal className="mt-6"><Photo src={I.g6} alt="Phố cổ Hội An" className="w-full" style={{ aspectRatio:"21/9" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={5} /><div className="mt-2"><Lbl>Phố cổ Hội An</Lbl><Lbl>2025</Lbl></div></Reveal>
      </div>
    </section>
  );
}

// ─── SERVICES LIST ────────────────────────────────────────────────────────────
function ServicesSection() {
  const services = [
    { num:"01", title:"Chân dung Doanh nghiệp", subtitle:"Chân dung cá nhân & lãnh đạo", previewSrc:I.h5 },
    { num:"02", title:"Sự kiện & Hội nghị",     subtitle:"Hội nghị, gala, lễ trao giải",  previewSrc:I.e1 },
    { num:"03", title:"Ảnh Nhân sự & Đội nhóm", subtitle:"Ảnh nhóm & nhân viên công ty",  previewSrc:I.t1 },
    { num:"04", title:"Gói Headshot",            subtitle:"Chụp nhanh cho doanh nghiệp",   previewSrc:I.h2 },
    { num:"05", title:"Chiến dịch Thương hiệu",  subtitle:"Ảnh thương hiệu & sản phẩm",    previewSrc:I.p2a },
    { num:"06", title:"Editorial & Thời trang",  subtitle:"Lookbook, tạp chí, nghệ thuật",  previewSrc:I.p1a },
  ];
  return (
    <section className="bg-[#f5f0e8] py-24 px-8 md:px-14">
      <Reveal className="mb-12">
        <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#aaa] mb-4">Dịch vụ cung cấp</div>
        <ScrambleText text="DỊCH VỤ." className="font-display font-black leading-none" style={{ fontSize:"clamp(48px,9vw,140px)", letterSpacing:"-0.025em", lineHeight:0.88 }} />
      </Reveal>
      <div className="border-t border-[#e0dbd4]">
        {services.map(s => <Reveal key={s.num}><ServiceItem {...s} /></Reveal>)}
      </div>
    </section>
  );
}

// ─── ABOUT ───────────────────────────────────────────────────────────────────
function AboutSection({ onImgHover, onImgLeave }: HP) {
  return (
    <section id="about" className="bg-white py-24 md:py-32 px-8 md:px-14">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-10 md:gap-16 items-start">
        <Reveal><Photo src={I.about} alt="NAHN portrait" className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={3} /></Reveal>
        <Reveal delay={150} className="flex flex-col justify-end md:pb-10">
          <ScrambleText text="XIN CHÀO," className="font-display font-black leading-none" style={{ fontSize:"clamp(44px,8vw,130px)", letterSpacing:"-0.025em", lineHeight:0.88 }} />
          <ScrambleText text="TÔI LÀ NAHN." className="font-display font-black leading-none mt-1" style={{ fontSize:"clamp(44px,8vw,130px)", letterSpacing:"-0.025em", lineHeight:0.88, color:"transparent", WebkitTextStroke:"1.5px #0a0a0a" }} />
          <div className="mt-10 space-y-4">
            <p className="font-sans text-sm leading-relaxed text-[#444] font-light">Nhiếp ảnh gia tại Thành phố Hồ Chí Minh.</p>
            <p className="font-sans text-sm leading-relaxed text-[#444] font-light">Tôi quan tâm đến con người, ánh sáng, du lịch và những khoảnh khắc thường ngày. Sẵn sàng nhận dự án editorial, thương mại và doanh nghiệp.</p>
          </div>
          <div className="mt-10 pt-8 border-t border-[#ddd] space-y-2">
            <Lbl>Instagram — @nahn</Lbl><Lbl>hello@nahn.photo</Lbl><Lbl>Thành phố Hồ Chí Minh, Việt Nam</Lbl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ─── CONTACT ─────────────────────────────────────────────────────────────────
function ContactSection({ onImgHover, onImgLeave }: HP) {
  return (
    <section className="bg-[#0a0a0a] py-24 md:py-32 px-8 md:px-14">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-10 md:gap-16 items-start">
        <Reveal className="flex flex-col justify-between h-full">
          <div>
            {(["HÃY","CÙNG","TẠO RA","ĐIỀU GÌ ĐÓ."] as const).map((w,i) => (
              <ScrambleText key={w} text={w} className="font-display font-black leading-none" style={{ fontSize:"clamp(58px,10vw,160px)", letterSpacing:"-0.025em", lineHeight:0.86, color:i<2?"#fff":"transparent", WebkitTextStroke:i>=2?"1.5px rgba(255,255,255,0.4)":undefined }} />
            ))}
          </div>
          <div className="mt-16 md:mt-20 space-y-5 border-t border-white/10 pt-8">
            {[{label:"Instagram",val:"@nahn",href:"https://instagram.com/nahn"},{label:"Email",val:"hello@nahn.photo",href:"mailto:hello@nahn.photo"}].map(({ label,val,href })=>(
              <div key={label}><Lbl light>{label}</Lbl><a href={href} className="font-sans text-sm text-white/60 hover:text-white transition-colors duration-300">{val}</a></div>
            ))}
            <div><Lbl light>Địa chỉ</Lbl><span className="font-sans text-sm text-white/60">Thành phố Hồ Chí Minh</span></div>
          </div>
        </Reveal>
        <Reveal delay={160}><Photo src={I.ctct} alt="Contact portrait" className="w-full" style={{ aspectRatio:"3/4" }} onHover={onImgHover} onLeave={onImgLeave} exifIdx={0} /></Reveal>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/8 px-8 md:px-14 py-10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="font-display font-black text-white text-sm tracking-widest">NAHN</div>
          <div className="font-mono text-[9px] tracking-[0.22em] uppercase text-white/30 mt-1">Nhiếp ảnh · Tp. Hồ Chí Minh</div>
        </div>
        <div className="flex items-center gap-8">
          <MagneticLink href="https://instagram.com/nahn" color="rgba(255,255,255,0.4)">Instagram</MagneticLink>
          <MagneticLink href="mailto:hello@nahn.photo" color="rgba(255,255,255,0.4)">Email</MagneticLink>
          <button onClick={() => window.scrollTo({ top:0, behavior:"smooth" })} className="font-mono text-[10px] tracking-[0.18em] uppercase text-white/40 hover:text-white/80 transition-colors duration-200">Về đầu trang ↑</button>
        </div>
        <div className="font-mono text-[9px] tracking-[0.18em] text-white/25">NAHN © 2026</div>
      </div>
    </footer>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
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
