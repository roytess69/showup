/* ═══════════════════════════════════════════════════════════════════
   SHOWUP — LAUNCH BUILD (v2, ground-up rebuild)
   ─────────────────────────────────────────────
   A social-first activity app in a RETRO PIXEL visual language.
   Not BeReal-dark, not Duolingo-nagging: a warm pixel zine where
   friends' days are the content and the machinery stays backstage.

   ARCHITECTURE (single file, sectioned):
   1.  PIXEL ENGINE        sprite renderer + sprite library
   2.  DESIGN SYSTEM       tokens + primitives (buttons, cards, inputs)
   3.  SECURE CORE         hashing, sessions, OTP service, rate limits,
                           validators, audit ledger  (delivery simulated;
                           Dev Mode exposes the outbox + provider keys)
   4.  GUARDIAN            layered protection engine (normalizer, hashed
                           blocklist, harassment lexicon, strikes)
   5.  CATALOG             full activity/badge catalog (Tiers 1–4) +
                           streak milestones
   6.  ART                 pixel badges, banner art, avatar frames,
                           pixel photo scenes
   7.  AUTH                Instagram-grade passwordless flow
   8.  CAMERA              live camera + 8-BIT filter pipeline
   9.  APP SURFACES        feed, composer, friends, shop, profile,
                           journeys, memories, notifications, settings,
                           developer mode
   ═══════════════════════════════════════════════════════════════════ */

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Home, Users, Plus, User, Bell, X, Camera, ChevronLeft, ChevronRight,
  Check, Heart, MessageCircle, Send, Share2, Settings, Sparkles, Zap,
  ShoppingBag, Shield, ShieldCheck, Eye, EyeOff, RefreshCw, AtSign, CalendarDays, ThumbsUp, MapPin,
  SwitchCamera, Upload, Search, Lock, Flame, Trophy, TrendingUp,
  MoreHorizontal, ScrollText, LogOut, Terminal, Mail, Smartphone,
  UserPlus, Star, Gift, Wand2, CircleDot,
} from "lucide-react";

/* ═══════════════ 1. PIXEL ENGINE ═══════════════
   Sprites are strings; each char maps to a palette key, "." = clear.
   Rendered as crisp SVG rects — real pixel art, infinitely scalable. */

function Sprite({ grid, pal, px = 3, className, style }) {
  const h = grid.length, w = grid[0].length;
  return (
    <svg width={w * px} height={h * px} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" className={className} style={style} aria-hidden="true">
      {grid.map((row, y) =>
        row.split("").map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={pal[c] || "#000"} />))
      )}
    </svg>
  );
}

/* ── the sprite library — one 12×12 icon per activity family ── */
const SPR = {
  runner: ["............",".....kk.....",".....kk.....","....kkk.....","...k.kk.k...","..k..kk..k..",".....kkk....","....kk.k....","...kk...k...","..kk.....k..",".kk.......k.","............"],
  dumbbell: ["............","............",".gg......gg.",".gg......gg.",".ggkkkkkkgg.",".ggkkkkkkgg.",".ggkkkkkkgg.",".gg......gg.",".gg......gg.","............","............","............"],
  ball: ["............","...kkkkkk...","..k.wwww.k..",".k.wwkkww.k.",".kwwk..kwwk.",".kwwk..kwwk.",".k.wwkkww.k.","..k.wwww.k..","...kkkkkk...","............","............","............"],
  racket: ["............","....kkkk....","...k.ww.k...","..k.wwww.k..","..k.wwww.k..","...k.ww.k...","....kkkk....","......kk....","......kk....","......kk....","......kk....","............"],
  wave: ["............","............","............","..bb....bb..",".b..b..b..b.","b....bb....b","............","..bb....bb..",".b..b..b..b.","b....bb....b","............","............"],
  mountain: ["............","............","......k.....",".....kwk....","....kkwkk...","...kkkkkkk..","..kk..k..kk.",".kk...k...kk","kk....k....k","............","............","............"],
  leaf: ["............","......gg....","....ggGGg...","...gGGGGGg..","..gGGgGGGg..","..gGGgGGg...","...gGgGg....","....ggg.....","....g.......","...g........","............","............"],
  brain: ["............","...pp.pp....","..pwppwpp...",".ppppppppp..",".pwpppwppp..",".ppppppppp..","..ppp.ppp...","...pp.pp....","............","............","............","............"],
  book: ["............","..kkkkkkkk..","..kwwwwkwk..","..kwkkwkwk..","..kwwwwkwk..","..kwkkwkwk..","..kwwwwkwk..","..kwwwwkwk..","..kkkkkkkk..","............","............","............"],
  note: ["............","......kk....","......kwk...","......k.k...","......k.....","......k.....","....kkk.....","...kkkk.....","...kkkk.....","....kk......","............","............"],
  wheel: ["............","...kkkkkk...","..k..kk..k..",".k...kk...k.",".kkkkkkkkkk.",".k...kk...k.","..k..kk..k..","...kkkkkk...","............","............","............","............"],
  glove: ["............","....rrrr....","...rrrrrr...","..rrrrrrrr..","..rrrrrrrr..","..rrwwrrrr..","...rrrrrr...","....rrrr....",".....rr.....","............","............","............"],
  target: ["............","...kkkkkk...","..k......k..",".k..kkkk..k.",".k.k....k.k.",".k.k.rr.k.k.",".k.k....k.k.",".k..kkkk..k.","..k......k..","...kkkkkk...","............","............"],
  snow: ["............",".....k......","..k..k..k...","...k.k.k....","....kkk.....",".kkkkkkkkk..","....kkk.....","...k.k.k....","..k..k..k...",".....k......","............","............"],
  paddle: ["............","....rrrr....","...rrrrrr...","...rrrrrr...","...rrrrrr...","....rrrr....","......kk....","......kk....","......kk....","............","............","............"],
  fish: ["............","............","............","..bb........",".b..bbbbb...","b..b.....bk.",".b..bbbbb.k.","..bb.....k..","............","............","............","............"],
  chess: ["............","....kkk.....","...kkkkk....","....kkk.....","...kkkkk....","....kkk.....","....kkk.....","...kkkkk....","..kkkkkkk...","............","............","............"],
  camera: ["............","............","..kkkkkkkk..","..kwwkkkwk..","..kwkwkkwk..","..kwwkkkwk..","..kkkkkkkk..","............","............","............","............","............"],
  pot: ["............","............","..k......k..","..kkkkkkkk..",".kwwwwwwwwk.",".kwwwwwwwwk.",".kwwwwwwwwk.","..kkkkkkkk..","............","............","............","............"],
  bolt: ["............","......yy....",".....yy.....","....yy......","...yyyyyy...","......yy....",".....yy.....","....yy......","...yy.......","............","............","............"],
  star: ["............","......y.....",".....yyy....","..yyyyyyyy..","...yyyyyy...","....yyyy....","...yy..yy...","..y......y..","............","............","............","............"],
  flame: ["............","......r.....",".....rr.....","....rrr.....","...rrrrr....","..rrorror...","..rroyorr...","..rryyyrr...","...ryyyr....","....rrr.....","............","............"],
  heart: ["............","..rr...rr...",".rrrr.rrrr..",".rrrrrrrrr..",".rrrrrrrrr..","..rrrrrrr...","...rrrrr....","....rrr.....",".....r......","............","............","............"],
  shield: ["............","..kkkkkkk...",".k.......k..",".k.ggggg.k..",".k.g.g.g.k..",".k.ggggg.k..","..k.....k...","...k...k....","....k.k.....",".....k......","............","............"],
  trophy: ["............",".yyyyyyyyy..",".y.yyyyy.y..",".y.yyyyy.y..","..y.yyy.y...","...yyyyy....","....yyy.....","....yyy.....","...yyyyy....","..yyyyyyy...","............","............"],
  coin: ["............","...yyyyyy...","..yYYYYYYy..",".yYYkkkkYYy.",".yYYkYYkYYy.",".yYYkYYkYYy.",".yYYkkkkYYy.","..yYYYYYYy..","...yyyyyy...","............","............","............"],
  duck: ["............","....yyy.....","...yyyyy....","...yykyy....","..oyyyyy....","....yyyyyy..","..yyyyyyyy..",".yyyyyyyyy..","..yyyyyyy...","...........","............","............"],
  crown: ["............","............",".y...y...y..",".yy.yyy.yy..",".yyyyyyyyy..",".yyyyyyyyy..",".yyyyyyyyy..","............","............","............","............","............"],
  toast: ["............","...tttttt...","..tttttttt..","..tTTTTTTt..","..tTTTTTTt..","..tTTkTkTt..","..tTTTTTTt..","..tTTTTTTt..","..tttttttt..","............","............","............"],
  laurel: ["............","..g......g..",".g.g....g.g.",".g..g..g..g.","..g..gg..g..","..g.g..g.g..","...g....g...","...g.gg.g...","....g..g....","............","............","............"],
  sun: ["............","..y..y..y...","...yyyyy....","..yyOOOyy...",".y.yOOOy.y..","..yyOOOyy...","...yyyyy....","..y..y..y...","............","............","............","............"],
  tree: ["............","....ggg.....","...ggggg....","..ggggggg...","...ggggg....","..ggggggg...",".ggggggggg..","....kkk.....","....kkk.....","............","............","............"],
  flagspr: ["............","...k........","...krrrr....","...krrrr....","...krr......","...k........","...k........","...k........","...k........","...k........","............","............"],
  chLift: ["............",".rrkkkkkkrr.",".rr......rr.","....k..k....","....kkkk....",".....kk.....",".....kk.....","....kkkk....","....k..k....","...k....k...","............","............"],
  chYoga: ["............","............",".....kk.....",".....kk.....","....kkkk....","....kkkk....","...k.kk.k...","..k..kk..k..","...kkkkkk...","..kk....kk..","............","............"],
  chSwim: ["............","............","....kk......","....kk..k...",".......k....","bbbbbbbbbbbb",".b.b.b.b.b.b","bbbbbbbbbbbb","............","............","............","............"],
  chBox: ["............",".....kk.....",".....kk.....","..rr.kk.....","..rrkkkk.rr.","....kkkk.rr.",".....kk.....","....k..k....","....k..k....","...k....k...","............","............"],
  chDance: ["............","..k......k..","...k....k...","....k..k....",".....kk.....",".....kk.....","....kkkk....",".....kk.....","....k..k....","...k....k...","..k......k..","............"],
  chDog: ["............","..........k.","..kk......k.","..kkk...kk..","...ktttttt..","..kttttttt..","...t.tt.t...","...t.tt.t...","............","............","............","............"],
  ghost: ["............","...wwwww....","..wwwwwww...","..wkwwwkw...","..wwwwwww...","..wwwwwww...","..wwwwwww...","..w.w.w.w...","............","............","............","............"],
};

/* activity → sprite id (families cover the whole catalog) */
const SPRITE_OF = (a) => {
  const m = {
    Running: "runner", Walking: "runner", Hiking: "mountain", "Trail Running": "mountain", "Track & Field": "runner", "Stair Climbing": "runner", Parkour: "runner", Snowshoeing: "snow", "Dog Walking": "runner",
    Lifting: "dumbbell", CrossFit: "dumbbell", Calisthenics: "dumbbell", "Recovery / PT": "heart", "Stretching / Mobility": "heart", Wrestling: "glove", Gymnastics: "star", Cheerleading: "star", Trampoline: "star",
    Soccer: "ball", Basketball: "ball", Volleyball: "ball", Rugby: "ball", "American Football": "ball", Handball: "ball", Netball: "ball", Dodgeball: "ball", Kickball: "ball", Bowling: "ball", "Water Polo": "ball",
    Tennis: "racket", Pickleball: "paddle", Badminton: "racket", "Table Tennis": "paddle", Squash: "racket", Racquetball: "racket", Padel: "paddle", Lacrosse: "racket", "Field Hockey": "racket", Cricket: "racket", "Baseball / Softball": "racket", Hockey: "racket", Curling: "target", Golf: "flagspr", "Disc Golf": "target", "Ultimate Frisbee": "target", "Spikeball / Roundnet": "ball", Archery: "target", Fencing: "bolt",
    Swimming: "wave", Surfing: "wave", Rowing: "wave", "Kayaking / Canoeing": "wave", Paddleboarding: "wave", Sailing: "wave", Fishing: "fish", "Aqua Aerobics": "wave",
    Cycling: "wheel", "Mountain Biking": "wheel", "Spin / Indoor Cycling": "wheel", Skating: "wheel", Rollerblading: "wheel", "Ice Skating": "snow", Triathlon: "bolt", "Skiing / Snowboarding": "snow", "Cross-Country Skiing": "snow",
    Yoga: "leaf", Pilates: "leaf", "Tai Chi": "leaf", Barre: "note", Dancing: "note", Zumba: "note", HIIT: "bolt", Boxing: "glove", "Martial Arts": "glove", "Jump Rope": "bolt", "Horseback Riding": "mountain", Gardening: "leaf", "Nature Walk": "tree", Birdwatching: "tree",
    Meditation: "brain", Breathwork: "brain", Journaling: "book", Reading: "book", Gratitude: "heart", "Digital Detox": "shield", "Cold Plunge": "snow", Sauna: "flame", "Spiritual Practice": "star", Therapy: "heart", Volunteering: "heart",
    Chess: "chess", Puzzles: "chess", "Learning / Studying": "book", "Language Learning": "book", Cooking: "pot", "Meal Prep": "pot", "Drawing / Art": "book", "Music Practice": "note", "Knitting / Crafts": "heart", "Creative Writing": "book", Singing: "note", Photography: "camera",
  };
  return m[a] || "star";
};

/* ── the ShowUp mark — Roy's logo, embedded ── */
const LOGO = "data:image/png;base64,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";

/* ═══════════════ 2. DESIGN SYSTEM ═══════════════
   Modern, clean social-app chrome — soft cards, rounded controls,
   system sans. The PIXEL craft is reserved for exactly three
   places: badge art, banner art, and the journey maps.            */

const C = {
  paper: "#FAF7F1", card: "#FFFFFF", ink: "#201A12", mute: "#6E6455", faint: "#A39781",
  line: "#E8E1D4", teal: "#1E9E86", tealDark: "#0E6B5A", coral: "#E8563F", gold: "#E8A93B",
  violet: "#7C5CD9", blue: "#3E7BC4", green: "#4C9E4C", pink: "#E86FA0", night: "#17130E",
  field: "#F1EDE2",
};
const RARITY = {
  common:    { name: "Common",    color: "#7A8A7A", chip: "#E8F0E8" },
  rare:      { name: "Rare",      color: "#3E7BC4", chip: "#E2EDF8" },
  epic:      { name: "Epic",      color: "#7C5CD9", chip: "#ECE5FA" },
  legendary: { name: "Legendary", color: "#B8860B", chip: "#FAF0D2" },
};
const TYPE = { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif" };
const BORDER = `1px solid ${C.line}`;
const SHADOW = () => "0 2px 10px -4px rgba(32,26,18,0.12)";

const px = {
  card: { background: C.card, border: BORDER, boxShadow: "0 2px 10px -4px rgba(32,26,18,0.12)", borderRadius: 18 },
  flat: { background: C.card, border: BORDER, borderRadius: 16 },
  chip: { background: C.field, border: "1px solid transparent", borderRadius: 999 },
};

function PxButton({ children, onClick, kind = "primary", disabled, full, small, style, ariaLabel }) {
  const bg = disabled ? C.field : kind === "primary" ? C.teal : kind === "danger" ? C.coral : kind === "gold" ? C.ink : C.field;
  const color = disabled ? C.faint : kind === "ghost" ? C.ink : "#FFF";
  return (
    <button
      onClick={disabled ? undefined : onClick}
      aria-label={ariaLabel}
      className={`${full ? "w-full" : ""} font-semibold active:scale-95 transition-transform select-none`}
      style={{ ...TYPE, background: bg, color, borderRadius: 999, padding: small ? "10px 16px" : "14px 18px", fontSize: small ? 13 : 15, minHeight: small ? 38 : 48, letterSpacing: -0.1, boxShadow: disabled || kind === "ghost" ? "none" : "0 6px 16px -8px rgba(32,26,18,0.35)", ...style }}
    >
      {children}
    </button>
  );
}

function PxInput({ value, onChange, placeholder, type = "text", maxLength, autoFocus, onKeyDown, style, inputMode, right }) {
  return (
    <div className="relative w-full">
      <input
        value={value} onChange={onChange} placeholder={placeholder} type={type} maxLength={maxLength}
        autoFocus={autoFocus} onKeyDown={onKeyDown} inputMode={inputMode} spellCheck={false}
        className="w-full outline-none"
        style={{ ...TYPE, background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "13px 15px", fontSize: 16, color: C.ink, ...style }}
        onFocus={(e) => (e.target.style.borderColor = C.teal)}
        onBlur={(e) => (e.target.style.borderColor = C.line)}
      />
      {right && <div className="absolute right-3.5 top-1/2" style={{ transform: "translateY(-50%)" }}>{right}</div>}
    </div>
  );
}

function PxTag({ children, color = C.field, ink = C.ink, style }) {
  return <span className="inline-flex items-center gap-1 font-bold uppercase" style={{ ...TYPE, fontSize: 9.5, letterSpacing: 0.6, background: color, color: ink, borderRadius: 999, padding: "3.5px 9px", ...style }}>{children}</span>;
}

function Dither() { return null; }
function Scanlines() { return null; }

/* modern avatar — gradient/photo circle; pixel frames stay as playful accents */
const AV_GRADS = [["#F2B93B", "#D98324"], ["#E8563F", "#B23A28"], ["#4C9E4C", "#2E7A3E"], ["#1E9E86", "#0E6B5A"], ["#3E7BC4", "#2A5A96"], ["#7C5CD9", "#5638AC"], ["#E86FA0", "#C2497C"], ["#5EAABF", "#3A7E93"]];
function PxAvatar({ user, size = 40, frame }) {
  const seed = (user?.avatarSeed ?? 3) % 8;
  const g = AV_GRADS[seed];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div className="rounded-full overflow-hidden flex items-center justify-center" style={{ width: size, height: size, background: `linear-gradient(145deg, ${g[0]}, ${g[1]})`, boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.25)" }}>
        {user?.photo ? (
          <img src={user.photo} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-white select-none" style={{ ...TYPE, fontSize: size * 0.42 }}>{(user?.name || "?")[0]}</span>
        )}
      </div>
      {frame && <FrameArt id={frame} size={size} />}
    </div>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="fixed left-4 right-4 flex justify-center pointer-events-none" style={{ bottom: "calc(96px + env(safe-area-inset-bottom))", zIndex: 90 }}>
      <div className="px-4 py-2.5 text-sm font-semibold text-center rounded-full" style={{ ...TYPE, background: C.ink, color: C.paper, boxShadow: "0 10px 24px -8px rgba(32,26,18,0.5)", animation: "toastUp 0.25s ease both" }}>
        {toast}
      </div>
    </div>
  );
}

/* ═══════════════ 3. SECURE CORE ═══════════════
   Real mechanics, simulated delivery. Every security decision here
   maps 1:1 onto a production backend; Dev Mode exposes the seams.  */

/* FNV-1a 32-bit — used for salted credential hashing + blocklist */
const fnv = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, "0"); };
const saltedHash = (v, salt) => fnv(`${salt}::${v}::showup`);
const rngToken = () => Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 8)).join("-");

const now = () => Date.now();
const MIN = 60_000;

/* ── OTP service: 6-digit codes, 5-min expiry, 5 attempts, 30s resend
      cooldown, 5 sends/hour per identity. Delivery goes to OUTBOX. ── */
function makeOtpService(pushOutbox, log) {
  const store = {}; // identity -> {codeHash, salt, expires, attempts, sends:[]}
  return {
    request(identity, channel) {
      const rec = store[identity] || { sends: [] };
      const recent = rec.sends.filter((t) => now() - t < 60 * MIN);
      if (recent.length >= 5) return { ok: false, error: "Too many codes requested. Try again in a bit." };
      if (rec.sends.length && now() - rec.sends[rec.sends.length - 1] < 30_000) return { ok: false, error: "Just sent one — give it 30 seconds." };
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const salt = rngToken();
      store[identity] = { codeHash: saltedHash(code, salt), salt, expires: now() + 5 * MIN, attempts: 0, sends: [...recent, now()] };
      pushOutbox({ to: identity, channel, body: `Your ShowUp code is ${code}. It expires in 5 minutes. Never share it.`, at: now() });
      log("OTP_SENT", `${channel} → ${identity.replace(/(.{3}).*(.{2})/, "$1•••$2")}`);
      return { ok: true };
    },
    verify(identity, code) {
      const rec = store[identity];
      if (!rec) return { ok: false, error: "Request a code first." };
      if (now() > rec.expires) { delete store[identity]; return { ok: false, error: "That code expired — send a new one." }; }
      if (rec.attempts >= 5) { delete store[identity]; return { ok: false, error: "Too many tries. Send a new code." }; }
      rec.attempts++;
      if (saltedHash(code, rec.salt) !== rec.codeHash) return { ok: false, error: `Not quite — ${5 - rec.attempts} tries left.` };
      delete store[identity];
      log("OTP_VERIFIED", identity.replace(/(.{3}).*(.{2})/, "$1•••$2"));
      return { ok: true };
    },
  };
}

/* ── rate limiter: sliding window per action key ── */
function makeLimiter() {
  const hits = {};
  return (key, max, windowMs) => {
    const arr = (hits[key] = (hits[key] || []).filter((t) => now() - t < windowMs));
    if (arr.length >= max) return false;
    arr.push(now());
    return true;
  };
}

/* ── validators + sanitizer ── */
const V = {
  phone: (v) => /^\+?[\d\s()-]{7,16}$/.test(v.trim()),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  username: (v) => /^[a-z0-9_]{3,15}$/.test(v),
  clean: (v) => v.replace(/[\u0000-\u001F\u007F]/g, "").replace(/\s{3,}/g, "  ").slice(0, 240),
};

/* ═══════════════ 4. GUARDIAN ═══════════════
   Layered, deterministic, genuinely functional:
   L1 normalize   — lowercase, leet map, strip repeats/spacing/punct
   L2 blocklist   — HASHED slur list (ships empty; add terms in Dev
                    Mode — they're salted-hashed, never stored as text)
   L3 lexicon     — harassment/negativity patterns → warm rewrite
   L4 crisis      — self-harm phrases → firm block + care message
   L5 strikes     — 3 hard blocks = 24h comment cooldown (simulated)  */

const LEET = { 0: "o", 1: "i", 3: "e", 4: "a", 5: "s", 7: "t", "@": "a", $: "s", "!": "i", "+": "t", "€": "e", "£": "l" };
const gNormalize = (t) => {
  let s = (t || "").toLowerCase();
  s = s.replace(/[013457@$!+€£]/g, (c) => LEET[c] || c);
  const squashed = s.replace(/[^a-z]/g, "");           // catches "u g l y"
  const dedup = squashed.replace(/(.)\1{2,}/g, "$1$1"); // catches "looooser"
  return { words: s.replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean), squashed, dedup };
};

const GUARDIAN_SALT = "gsalt-v1";
const HARASS = ["ugly", "loser", "pathetic", "stupid", "idiot", "dumb", "trash", "garbage", "worthless", "fat", "fatty", "gross", "disgusting", "hate you", "nobody likes", "no one likes", "worst", "embarrassing", "lame", "weak", "quitter", "failure", "cringe", "shut up", "give up"];
const CRISIS = ["kys", "kill yourself", "killyourself", "go die", "godie", "hurt yourself", "end it"];


function makeGuardian(getBlockHashes, log) {
  const strikes = { count: 0, lockedUntil: 0 };
  return {
    strikes,
    check(text, ctx = "comment") {
      if (now() < strikes.lockedUntil) return { verdict: "locked", message: "Comments are cooling down for a bit. Back soon." };
      const { words, squashed, dedup } = gNormalize(text);
      const hashes = getBlockHashes();
      /* L2: hashed blocklist — test every word + squashed n-grams */
      const candidates = new Set([...words, squashed, dedup]);
      words.forEach((w, i) => { if (words[i + 1]) candidates.add(w + words[i + 1]); });
      for (const c of candidates) {
        if (c.length >= 3 && hashes.has(saltedHash(c, GUARDIAN_SALT))) {
          strikes.count++;
          if (strikes.count >= 3) { strikes.lockedUntil = now() + 24 * 60 * MIN; log("GUARDIAN_LOCK", "3 hard blocks → 24h cooldown"); }
          log("GUARDIAN_BLOCK", `${ctx} · blocklist match`);
          return { verdict: "block", message: "That won't post here." };
        }
      }
      /* L4: crisis phrases */
      const joined = words.join(" ");
      if (CRISIS.some((p) => joined.includes(p) || squashed.includes(p.replace(/\s/g, "")))) {
        strikes.count++;
        log("GUARDIAN_BLOCK", `${ctx} · crisis phrase`);
        return { verdict: "block", message: "We don't say that here — ever. If you or someone needs support, reach out to someone you trust." };
      }
      /* L3: harassment lexicon → warm rewrite */
      const hit = HARASS.find((p) => (p.includes(" ") ? joined.includes(p) : words.includes(p) || dedup.includes(p.replace(/\s/g, ""))));
      if (hit) {
        log("GUARDIAN_NUDGE", `${ctx} · negativity`);
        return { verdict: "nudge", message: "This reads a little harsh — give it another pass." };
      }
      return { verdict: "pass" };
    },
  };
}

/* ═══════════════ 5. THE CATALOG ═══════════════
   Every activity, every tier name — verbatim from the locked list.
   Thresholds: days 5 · 30 · 75 · 150 · 300 · 500 per activity.      */

const TIER_DAYS = [5, 30, 75, 150, 300, 500];
const STREAK_MILESTONES = [
  { days: 7, name: "Out the Gate" }, { days: 30, name: "Finding a Groove" }, { days: 75, name: "On Fire" },
  { days: 150, name: "Frequent Flyer" }, { days: 250, name: "Kind of a Big Deal" }, { days: 365, name: "Round the Sun" }, { days: 500, name: "One in a Million" },
];

const CATALOG = {
  /* ✅ Tier 1 — locked */
  "Running": ["First Mile", "Just Jogging", "Road Runner", "Mile Muncher", "Cardio Maniac", "Forrest Gump"],
  "Lifting": ["First Rep", "Gym Rat", "Iron Addict", "Pump Chaser", "Permanently Sore", "Hugs Are Dangerous"],
  "Walking": ["First Steps", "Just Strolling", "Step Counter", "Pavement Pounder", "Where Are We Going", "Marathon Mall-Walker"],
  "Soccer": ["First Touch", "Playmaker", "Soccer Star", "Nutmeg King", "Hat-Trick Hero", "Golden Boot"],
  "Basketball": ["First Bucket", "Floor General", "Sharpshooter", "Ankle Breaker", "Hoop Dreams", "All-Star"],
  "Cycling": ["First Ride", "Training Wheels Off", "Road Cruiser", "Hill Hater", "Spandex Warrior", "Tour de Farce"],
  "Yoga": ["Just Breathe", "Wobbly Warrior", "Knot Undoer", "Bendy Boss", "Pretzel Pro", "Made of Rubber"],
  "Swimming": ["Fish in Training", "Splash Maker", "Just Keep Swimming", "Fin Master", "Pool Boss", "Part Fish"],
  "Tennis": ["First Serve", "New Balls Please", "Grunt Heard Round the Court", "Cross-Court Menace", "Aced It", "Game Set Match"],
  "Hiking": ["First Trail", "Where's the Trail", "Uphill Both Ways", "Snack Hauler", "Always One More Peak", "Mountain Goat"],
  "Pilates": ["First Reformer", "Hundreds Survivor", "Shaky but Trying", "Smiling Through the Pain", "Stronger Than I Look", "Abs of Steel"],
  "HIIT": ["First Burpee", "Why Did I Sign Up", "Can't Feel My Legs", "Beast Mode… ish", "Sweating in Places…", "No Legs No Problem"],
  "Dancing": ["First Steps", "Two Left Feet", "Caught in the Groove", "No Wallflower Here", "Main Character Energy", "Happy Feet"],
  "Boxing": ["First Jab", "Came to Bang", "Bobs and Weaves", "Saved by the Bell", "There Is No Tomorrow", "Float Like a Butterfly"],
  "Golf": ["First Swing", "Caught the Bug", "Driving Range Regular", "Owns Too Many Clubs", "Eagle Eye", "Par-tee Animal"],
  "Pickleball": ["First Dink", "Stuck in the Kitchen", "Dill With It", "Can't Stop Won't Stop", "Kind of a Big Dill", "Pickleball's Finest"],
  "Volleyball": ["First Volley", "Got Some Hops", "Eyes on the Ball", "It's Always My Set", "Spike It Like It Owes You", "Bow Down to the Setter"],
  "Climbing": ["First Climb", "Stuck on the Wall", "No Wall Too Tall", "Hanging On for Dear Life", "Sticks the Crux", "Honnold Wants His Crown Back"],
  "Skating": ["First Ollie", "Still Has Both Knees", "Ollie or Nothing", "No Bail This Time", "Tony Hawk Wannabe", "Gold Medal or the ER"],
  "Martial Arts": ["White Belt Energy", "Wax On Wax Off", "Brown Belt Bound", "Dojo Regular", "The Last Dragon", "Mr. Miyagi Mode"],
  "Skiing / Snowboarding": ["Pizza Not French Fry", "Off the Bunny Slope", "Halfpipe Hero", "Black Diamond Bound", "First Chair, Last Call", "Shaun White Wishes"],
  "Surfing": ["First Wipeout", "Hangs Loose", "Catching the Gnarly Ones", "Soul Surfer", "Cowabunga Status", "The Big Kahuna"],
  "Rowing": ["First Stroke", "Hands Full of Blisters", "Stroke of Genius", "Pulls Like It's Personal", "Living on the Erg", "Eight as One"],
  "Cricket": ["First Over", "Padded Up", "Lives for the Sixes", "Survived the Yorker", "Master of the Pitch", "Still Talking About That Century"],
  "Badminton": ["First Rally", "Chasing the Birdie", "Lives for the Smash", "Drops It on a Dime", "Owns the Backcourt", "Smashed It Into Next Week"],
  "Table Tennis": ["First Ping", "Basement Legend in Training", "Puts Spin on Everything", "Diving for Every Point", "Never Loses at the Office", "Forrest Gump Approved"],
  "Baseball / Softball": ["First Pitch", "Rally Cap Believer", "Swings for the Fences", "Sunflower Seed Machine", "There's No Crying in Baseball", "Hit It Outta the Park"],
  "Hockey": ["First Shift", "Still Has All My Teeth", "Up for 5AM Ice Time", "Bar Down Beauty", "Celly Like It's Game Seven", "Drinks From the Cup"],
  "Rugby": ["First Try", "Ears Still Intact", "No Pads, No Problem", "Mud Never Washes Off", "Does the Haka Alone", "Carried Off on Shoulders"],
  "American Football": ["First Down", "Put Me In, Coach", "Survived Two-a-Days", "Friday Night Lights", "Practices the Touchdown Dance", "Left It All on the Field"],
  /* Tier 2 — mental */
  "Meditation": ["First Sit", "Fell Asleep, Still Counts", "Survived the Itch", "Sits Longer Than the Timer", "Mind Like Water", "Enlightenment Pending"],
  "Journaling": ["Dear Diary", "A New Notebook Will Fix Me", "Never Misses Morning Pages", "Goes Through Pens Weekly", "Reread the Cringe, Kept Writing", "Memoir in Progress"],
  "Breathwork": ["First Breath", "In Through the Nose, Out Through the Mouth", "Box Breathing Believer", "Fingers Went Tingly", "Holds It Past Comfortable", "Wim Hof Would Gasp"],
  "Reading": ["First Page", "Just One More Chapter", "TBR Pile Taller Than Me", "The Book Was Better, Obviously", "Reads Past Sunrise", "The Library Knows Me by Name"],
  "Gratitude": ["First Thanks", "Counts Blessings, Literally", "Grateful for the Little Things", "Thanks the Barista by Name", "Writes Thank-You Notes for Fun", "Thankful for Mondays"],
  "Nature Walk": ["Touched Grass", "Stops to Smell the Roses", "Takes Pictures of Mushrooms", "Knows the Birds by Name", "Forest Bathing Believer", "Practically Photosynthesizing"],
  /* Tier 3 — physical */
  "Jump Rope": ["First Skip", "Finding the Rhythm", "Double Under Dreams", "Sounds Like a Helicopter", "Feet Barely Touch Ground", "Full Rocky Montage"],
  "Stair Climbing": ["First Flight", "Takes the Stairs, Always", "Two Steps at a Time", "Elevator? Never Met Her", "Calves of Granite", "Climbed the Empire State, Basically"],
  "Gardening": ["First Sprout", "Talks to the Plants", "Dirt Under the Nails, Proud of It", "Knows Every Plant by Name", "Neighbors Ask for Advice", "Could Grow Tomatoes on the Moon"],
  "Rollerblading": ["First Roll", "Still Has All My Skin", "Brakes Are for Quitters", "Skates Backwards to Show Off", "Glides Like It's 1995", "Rollerblading Never Died"],
  "Ice Skating": ["First Glide", "Let Go of the Wall", "Skates Backwards Now", "Attempted Something Spinny", "Triple Axel Energy", "The Zamboni Waits for Me"],
  "Lacrosse": ["First Cradle", "Wall Ball for Hours", "Growing the Flow", "Rips Top Cheese", "Dodges Everything", "The Fastest Game Chose Me"],
  "Squash": ["First Bounce", "Warmed Up the Ball", "Owns the T", "Hits the Nick on Purpose", "Ghosting Is Cardio", "Squashed the Competition"],
  "Ultimate Frisbee": ["First Toss", "It's Called a Disc", "Hucks It Deep", "Lays Out for Anything", "Spirit of the Game", "Catches Like a Frisbee Dog"],
  "Disc Golf": ["First Throw", "Blames the Trees", "Carries a Bag of 30 Discs", "Hears Chains in My Sleep", "Threads Every Forest", "Chains From Distance"],
  "Bowling": ["First Frame", "Graduated From Bumpers", "Owns My Own Ball", "Turkey Season", "League Night Regular", "The Pins Fear Me"],
  "Kayaking / Canoeing": ["First Paddle", "Zigzagged the Whole Lake", "Survived the Portage", "Reads the River", "Rolls Like It's Nothing", "Part Otter"],
  "Paddleboarding": ["First Stand", "Still Mostly Standing", "Dry Hair, Don't Care", "Does Yoga on It Now", "Paddles Past the Buoys", "Walks on Water, Basically"],
  "Horseback Riding": ["First Trot", "Smells Like the Barn", "The Horse Likes Me Best", "One With the Saddle", "Cleared the Big Jump", "The Horse Whisperer"],
  "Archery": ["First Arrow", "Hit the Hay Bale", "The Thwack Is Addictive", "Bullseye Regular", "Split an Arrow Once", "Robin Hood Energy"],
  "Fencing": ["First Lunge", "En Garde, Always", "Parry, Riposte, Repeat", "Touché After Touché", "The Beep Belongs to Me", "Basically a Musketeer"],
  "Gymnastics": ["First Cartwheel", "Chalk on Everything", "Casually Flips Now", "Beam Confidence", "Sticks Every Landing", "Gravity Is a Suggestion"],
  "Cheerleading": ["First Chant", "Louder Than the Crowd", "Full Out or Nothing", "Top of the Pyramid", "Hits Zero Every Time", "Brought It On"],
  "Track & Field": ["First Lap", "Chasing a New PR", "Friends With Lactic Acid", "Never Drops the Baton", "Lives at the Track", "Outran the Stopwatch"],
  "CrossFit": ["First WOD", "Yes, I Talk About It", "Survived Fran", "Everything Is Rx", "The Box Is My Second Home", "Games Athlete (Self-Declared)"],
  "Calisthenics": ["First Pull-Up", "The Park Is My Gym", "Muscle-Up Unlocked", "Human Flag in Progress", "Bodyweight Is Enough", "One-Arm Everything"],
  "Stretching / Mobility": ["First Stretch", "Finally Touched My Toes", "Frenemies With the Foam Roller", "Hips Don't Lie Anymore", "Splits Incoming", "Bends, Never Breaks"],
  "Wrestling": ["First Takedown", "Singlet Confidence", "Sprawls in My Sleep", "Escape Artist", "Pins Everything", "Nobody Takes Me Down"],
  "Water Polo": ["First Tread", "Eggbeater for Days", "What Happens Underwater Stays Underwater", "Never Touches the Bottom", "Cannon for an Arm", "Half Human, Half Buoy"],
  "Field Hockey": ["First Push", "Permanently Crouched", "Turf Burns, Badge of Honor", "Short Corner Specialist", "Reverse Stick Wizard", "The Turf Knows My Name"],
  "Parkour": ["First Vault", "Rolls Out of Everything", "Sees Rails Differently", "Wall Runs on Sight", "Hardcore Parkour", "The City Is My Playground"],
  "Trampoline": ["First Jump", "Higher Every Time", "Backflip Unlocked", "Checked the Ceiling", "Never Lands the Same Way Twice", "Basically in Orbit"],
  "Snowshoeing": ["First Trek", "Floats on Powder", "Breaks the Trail", "Winter Can't Stop Me", "Miles From Anywhere", "Part Polar Bear"],
  "Sailing": ["First Sail", "Ducked the Boom", "Knows the Knots", "Reads the Wind", "Tacks Like a Captain", "The Sea Calls Me Captain"],
  "Fishing": ["First Cast", "The One That Got Away", "Up at 5AM, Happily", "Patience Level: Legendary", "Talks to the Fish Now", "The Fish Tell Stories About Me"],
  "Tai Chi": ["First Form", "Slow Is the Point", "Park at Dawn Regular", "Moves Like Water", "Balance of a Crane", "Master of Slow Motion"],
  "Dodgeball": ["First Dodge", "Duck, Dip, Dive", "The Sting Means Nothing", "Catches Change Everything", "Last One Standing", "Can Dodge a Wrench"],
  "Kickball": ["First Kick", "Recess Never Ended", "Kicks It Over the Fence", "Rounds the Bases Grinning", "Team Captain Material", "Playground Legend Forever"],
  "Recovery / PT": ["First Session", "Doing the Boring Exercises", "Actually Does the Homework", "Stronger Than Before", "The Comeback Is Real", "Back and Better Than Ever"],
  "Padel": ["First Rally in the Cage", "The Glass Is My Teammate", "Bandeja in the Bag", "Recruiting Everyone I Know", "Smashed It Over the Fence", "The Fourth Everyone Calls"],
  "Netball": ["First Pass", "Earned My Bib", "Here If You Need!", "Footwork the Umpire Respects", "Intercepts Out of Nowhere", "Never Misses From the Circle"],
  "Handball": ["First Three Steps", "Resin on Everything I Own", "Fakes Them Out of Their Boots", "Flies From the Nine-Meter", "Kempa Trick Approved", "The Keeper Flinches First"],
  "Spin / Indoor Cycling": ["First Clip-In", "Saddle Sore but Loyal", "Cries at the Motivational Speech", "Chasing the Leaderboard", "Front Row, Every Class", "Legend of the 6AM Class"],
  "Zumba": ["First Shimmy", "Wrong Steps, Full Confidence", "Sweating and Smiling", "Never Misses a Beat Drop", "Knows Every Routine Cold", "The Class Follows Me Now"],
  "Barre": ["First Plié", "The Tiny Pulses Lied to Me", "Shaking Means It's Working", "Lives at the Barre", "Pulses Through the Pain", "Barre None the Best"],
  "Trail Running": ["First Trail Run", "Tripped, Rolled, Kept Running", "Chasing Vert", "Pockets Full of Gels", "Downhills at Full Send", "Sees a Mountain, Starts Running"],
  "Mountain Biking": ["First Descent", "Survived My First Crash", "Brraaap Is a Lifestyle", "The Bike Costs More Than the Car", "Clears the Gap Jump", "Gravity's Favorite Rider"],
  "Triathlon": ["First Brick", "Gear for Three Sports, Space for None", "Wetsuit Wrestling Champion", "Transitions Like a Pit Crew", "Trains Before Sunrise, Twice", "Kona Is Calling"],
  "Cross-Country Skiing": ["First Kick and Glide", "Herringbone Up Every Hill", "Lungs Like Bellows", "Fluent in Skate and Classic", "Overtakes Snowmobiles", "Built for the Birkebeiner"],
  "Curling": ["First Stone", "Learned to Yell Hurry Hard", "Sweeps Like the Ice Owes Rent", "Calls the Line Perfectly", "Draws to the Button on Demand", "Skip of the Century"],
  "Spikeball / Roundnet": ["First Bounce off the Net", "Harder Than It Looks, Confirmed", "Dives Without a Second Thought", "Grass Stains Are Permanent Now", "Full-Extension Everything", "Backyard World Champion"],
  "Racquetball": ["First Ricochet", "Goggles On, Fear Off", "Plays Angles That Shouldn't Exist", "Kill Shot Collector", "Splat Shot Specialist", "The Walls Play for My Team"],
  "Dog Walking": ["First Walkies", "The Dog Sets the Pace", "Knows Every Hydrant on the Route", "Rain or Shine, the Dog Insists", "Two Walks a Day, Minimum", "The Dog's Favorite Human"],
  "Aqua Aerobics": ["First Splash", "The Pool Noodle Is Equipment", "Resistance Is the Point", "Leads the Shallow End", "Makes Waves on Purpose", "Undefeated in the Deep End"],
  /* Tier 4 — mental */
  "Chess": ["First Move", "Learned En Passant", "Sees the Fork Coming", "Thinks Five Moves Ahead", "Elo Only Goes Up", "Magnus Is Nervous"],
  "Puzzles": ["First Piece", "Edges First, Obviously", "1000 Pieces, No Fear", "The Table Is Occupied Indefinitely", "Doesn't Even Look at the Box", "Found the Missing Piece"],
  "Learning / Studying": ["First Lesson", "Down the Rabbit Hole", "Flashcards Everywhere", "Pomodoro Powered", "Learns for the Fun of It", "Walking Wikipedia"],
  "Language Learning": ["First Word", "Ordered Food in It", "Rolling My R's", "Subtitles Off, No Fear", "Dreams in Two Languages", "Basically a Local"],
  "Cooking": ["First Dish", "Followed the Recipe, Mostly", "Knife Skills Sharpening", "No Recipe Needed", "Dinner Party Headliner", "Even Ramsay Would Smile"],
  "Meal Prep": ["First Prep", "Sunday Is for Containers", "Tupperware Tetris Champion", "Labeled and Loaded", "Five Days, Zero Panic", "The Fridge Is a Gallery"],
  "Drawing / Art": ["First Sketch", "Draws on Every Napkin", "Charcoal-Covered Hands", "Sees Everything in Shapes", "Sketchbook Is Full Again", "Happy Little Trees Energy"],
  "Music Practice": ["First Note", "The Neighbors Know This Song", "Calluses of Honor", "Eyes Closed, Still Perfect", "Always Says Yes to a Jam", "Encore, Encore"],
  "Knitting / Crafts": ["First Stitch", "The Yarn Stash Grows", "Frogged It, Kept Going", "Everyone Gets a Scarf", "Needs No Pattern", "Grandma Level Unlocked"],
  "Digital Detox": ["First Unplug", "Phone in the Other Room", "Airplane Mode Appreciator", "Forgot Where My Phone Was", "Boredom Is Beautiful Again", "Off the Grid Legend"],
  "Cold Plunge": ["First Plunge", "Gasped, Went Deeper", "Stopped Counting the Seconds", "Smiles While Shivering", "Ice Bath Before Breakfast", "Part Penguin"],
  "Sauna": ["First Steam", "Straight to the Top Bench", "Outlasts the Whole Room", "Sauna Then Snow", "Sweat Now, Glow Later", "Honorary Finn"],
  "Spiritual Practice": ["First Devotion", "Shows Up in Silence", "Same Time, Every Day", "Peace on Purpose", "Unshakeable Calm", "A Practice Becomes a Pillar"],
  "Volunteering": ["First Good Deed", "Saturday Mornings Spoken For", "Knows Everyone by Name", "Shows Up Rain or Shine", "The Community's Favorite", "Local Hero, No Cape"],
  "Therapy": ["First Session", "Actually Did the Homework", "Named the Feeling", "Boundaries: Installed", "Growth in Progress", "My Therapist Is Proud of Me"],
  "Creative Writing": ["First Draft", "Plot Holes and Coffee", "Kills My Darlings", "50,000 Words of Chaos", "Rewrites Until It Sings", "Bestseller in the Drawer"],
  "Singing": ["First Verse", "Shower Acoustics Certified", "Belts in the Car at Red Lights", "Harmonizes With the Radio", "Hits the High Note, Usually", "Could Front the Band"],
  "Photography": ["First Shot", "Golden Hour Chaser", "4,000 Photos of One Sunset", "Sees the Frame Everywhere", "Caught Lightning in a Frame", "Straight to the Gallery Wall"],
  "Birdwatching": ["First Sighting", "Binoculars Live in the Car", "Knows the Calls by Heart", "The Life List Grows", "Up Before the Birds", "The Rare One Found Me"],
};
const ACTIVITY_GROUPS = {
  "Move": ["Running", "Lifting", "Walking", "Soccer", "Basketball", "Cycling", "Yoga", "Swimming", "Tennis", "Hiking", "Pilates", "HIIT", "Dancing", "Boxing", "Golf", "Pickleball", "Volleyball", "Climbing", "Skating", "Martial Arts", "Skiing / Snowboarding", "Surfing", "Rowing", "Cricket", "Badminton", "Table Tennis", "Baseball / Softball", "Hockey", "Rugby", "American Football"],
  "Mind": ["Meditation", "Journaling", "Breathwork", "Reading", "Gratitude", "Nature Walk", "Chess", "Puzzles", "Learning / Studying", "Language Learning", "Cooking", "Meal Prep", "Drawing / Art", "Music Practice", "Knitting / Crafts", "Digital Detox", "Cold Plunge", "Sauna", "Spiritual Practice", "Volunteering", "Therapy", "Creative Writing", "Singing", "Photography", "Birdwatching"],
  "More Move": ["Jump Rope", "Stair Climbing", "Gardening", "Rollerblading", "Ice Skating", "Lacrosse", "Squash", "Ultimate Frisbee", "Disc Golf", "Bowling", "Kayaking / Canoeing", "Paddleboarding", "Horseback Riding", "Archery", "Fencing", "Gymnastics", "Cheerleading", "Track & Field", "CrossFit", "Calisthenics", "Stretching / Mobility", "Wrestling", "Water Polo", "Field Hockey", "Parkour", "Trampoline", "Snowshoeing", "Sailing", "Fishing", "Tai Chi", "Dodgeball", "Kickball", "Recovery / PT", "Padel", "Netball", "Handball", "Spin / Indoor Cycling", "Zumba", "Barre", "Trail Running", "Mountain Biking", "Triathlon", "Cross-Country Skiing", "Curling", "Spikeball / Roundnet", "Racquetball", "Dog Walking", "Aqua Aerobics"],
};
const ACT_COLOR = (a) => {
  const g = ACTIVITY_GROUPS.Mind.includes(a) ? "mind" : "move";
  const palette = g === "mind" ? [C.violet, C.blue, C.pink, C.teal] : [C.teal, C.coral, C.gold, C.green, C.blue];
  return palette[Math.abs([...a].reduce((s, ch) => s + ch.charCodeAt(0), 0)) % palette.length];
};

/* ═══════════════ 6. ART — badges, banners, frames, scenes ═══════════════ */

/* tier frames escalate: wood → stone → silver → gold → gem → prismatic */
/* each Featured category mints its own badge art */
const FEATURED_META = {
  "Most Artsy":      { spr: "note",   f: { o: "#8A3E9E", i: "#C878E8", bg: "#F0DCFA" } },
  "Most Beautiful":  { spr: "heart",  f: { o: "#C2497C", i: "#E886A0", bg: "#FAE0EA" } },
  "Golden Hour":     { spr: "sun",    f: { o: "#A8781E", i: "#F2C14B", bg: "#FBEBC0" } },
  "Best Vibe":       { spr: "leaf",   f: { o: "#3E8A78", i: "#5ECCB0", bg: "#D8F4EA" } },
  "The Grit Award":  { spr: "flame",  f: { o: "#B23A28", i: "#E8563F", bg: "#FADFD8" } },
  "Squad Energy":    { spr: "laurel", f: { o: "#2A5A96", i: "#6FA0D8", bg: "#DCEAF8" } },
  "Funniest Frame":  { spr: "ghost",  f: { o: "#5E6670", i: "#9AA2AC", bg: "#EEF3F8" } },
  "Wildcard":        { spr: "star",   f: { o: "#C8901A", i: "#F2B93B", bg: "#FBEBC0" } },
};

const TIER_FRAME = [
  { o: "#8A5A38", i: "#B08050", bg: "#E8D8B8" }, { o: "#5E6670", i: "#9AA2AC", bg: "#DDE2E8" },
  { o: "#7E8A96", i: "#C8D2DC", bg: "#EEF3F8" }, { o: "#A8781E", i: "#F2C14B", bg: "#FBEBC0" },
  { o: "#3E8A78", i: "#5ECCB0", bg: "#D8F4EA" }, { o: "#7C3EB8", i: "#C878E8", bg: "#F0DCFA" },
];
function PixelBadge({ activity, tier = 1, size = 56, streak, featuredCat }) {
  const fm = featuredCat ? FEATURED_META[featuredCat] || FEATURED_META["Wildcard"] : null;
  const f = fm ? fm.f : TIER_FRAME[Math.min(5, tier - 1)];
  const s = size / 16;
  const icon = fm ? fm.spr : streak ? "flame" : SPRITE_OF(activity);
  const iconPal = { k: C.ink, w: "#FFF", g: "#3E8A4E", G: "#5EAA6E", r: C.coral, o: "#F28C3B", y: C.gold, Y: "#F8D878", b: C.blue, p: C.violet, t: "#C89858", T: "#F2D8A8" };
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
        <rect x="1" y="0" width="14" height="16" fill={f.o} /><rect x="0" y="1" width="16" height="14" fill={f.o} />
        <rect x="2" y="1" width="12" height="14" fill={f.i} /><rect x="1" y="2" width="14" height="12" fill={f.i} />
        <rect x="3" y="2" width="10" height="12" fill={f.bg} /><rect x="2" y="3" width="12" height="10" fill={f.bg} />
        <rect x="2" y="2" width="2" height="1" fill="#FFF" opacity="0.7" /><rect x="2" y="2" width="1" height="2" fill="#FFF" opacity="0.7" />
        {tier === 6 && [[3, 1], [12, 1], [1, 12], [14, 12]].map(([x, y], i) => <rect key={i} x={x} y={y} width="1" height="1" fill="#FFF" />)}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Sprite grid={SPR[icon]} pal={iconPal} px={Math.max(2, Math.floor((size - 14) / 12))} />
      </div>
      <div className="absolute left-0 right-0 flex justify-center gap-0.5" style={{ bottom: Math.max(2, s) }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} style={{ width: Math.max(2, s * 0.8), height: Math.max(2, s * 0.8), background: i < tier ? f.o : "rgba(32,24,15,0.18)" }} />
        ))}
      </div>
    </div>
  );
}

/* ── Clash-style banner art: layered pixel scene + frame + emblem ──
   Each banner is a parametric composition; the SHOP sells these.   */
function BannerScene({ id, h = 150 }) {
  /* h may be a number or "100%" — SVG accepts both */
  const W = 96, H = 40; // pixel canvas, scaled to fit
  const scenes = {
    "field-day": () => (
      <g>
        <rect width={W} height={H} fill="#8FD0E8" />
        <rect y="26" width={W} height={14} fill="#5EAA5E" />
        <rect y="26" width={W} height="2" fill="#7EC87E" />
        <Cloud x={10} y={6} /><Cloud x={60} y={10} />
        <PxSun x={76} y={4} />
        {[8, 30, 52, 82].map((x, i) => <PxTree key={i} x={x} y={18} />)}
      </g>
    ),
    "morning-toast": () => (
      <g>
        <rect width={W} height={H} fill="#F8D8A0" />
        <rect y="28" width={W} height={12} fill="#E8A35C" />
        <PxSun x={40} y={6} big />
        {[6, 78].map((x, i) => <g key={i} transform={`translate(${x} 20)`}><Sprite grid={SPR.toast} pal={{ t: "#B8783E", T: "#F2D8A8", k: C.ink }} px={1} /></g>)}
        <Cloud x={16} y={4} /><Cloud x={64} y={8} />
      </g>
    ),
    "neon-grid": () => (
      <g>
        <rect width={W} height={H} fill="#1A1030" />
        <rect y="24" width={W} height={16} fill="#2A1A50" />
        {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={i * 12} y="24" width="1" height="16" fill="#E86FD8" opacity="0.8" />)}
        {[28, 33, 38].map((y, i) => <rect key={i} y={y} width={W} height="1" fill="#E86FD8" opacity="0.7" />)}
        <PxSun x={40} y={4} big neon />
        {Array.from({ length: 14 }).map((_, i) => <rect key={`s${i}`} x={(i * 29 + 7) % W} y={(i * 13) % 20} width="1" height="1" fill="#FFF" opacity="0.9" />)}
      </g>
    ),
    "deep-end": () => (
      <g>
        <rect width={W} height={H} fill="#1E5A9E" />
        <rect y="30" width={W} height="10" fill="#143E70" />
        {Array.from({ length: 8 }).map((_, i) => <path key={i} d={`M ${i * 13 + 2} ${8 + (i % 3) * 9} h 5`} stroke="#8FD0E8" strokeWidth="1" />)}
        <g transform="translate(14 14)"><Sprite grid={SPR.fish} pal={{ b: "#F2B93B", k: C.ink }} px={1} /></g>
        <g transform="translate(58 22)"><Sprite grid={SPR.fish} pal={{ b: "#E86FA0", k: C.ink }} px={1} /></g>
        {[20, 46, 74].map((x, i) => <g key={i}><rect x={x} y={34 - i} width="1" height="1" fill="#8FD0E8" /><rect x={x + 1} y={30 - i * 2} width="1" height="1" fill="#8FD0E8" /></g>)}
      </g>
    ),
    "cherry-dojo": () => (
      <g>
        <rect width={W} height={H} fill="#F8E0E8" />
        <rect y="30" width={W} height="10" fill="#C89858" />
        <rect x="20" y="12" width="56" height="4" fill="#B84A3A" />
        <rect x="24" y="16" width="4" height="14" fill="#8A3A2E" /><rect x="68" y="16" width="4" height="14" fill="#8A3A2E" />
        <rect x="16" y="10" width="64" height="2" fill="#B84A3A" />
        {Array.from({ length: 12 }).map((_, i) => <rect key={i} x={(i * 23 + 5) % W} y={(i * 7 + 4) % 26} width="2" height="2" fill="#E886A0" />)}
        {[6, 86].map((x, i) => <PxTree key={i} x={x} y={22} pink />)}
      </g>
    ),
    "aurora-basecamp": () => (
      <g>
        <rect width={W} height={H} fill="#141A3E" />
        <path d={`M 0 10 Q 24 2 48 9 T 96 6 L 96 14 Q 70 10 48 15 T 0 18 Z`} fill="#5EDCA8" opacity="0.55" />
        <path d={`M 0 16 Q 30 10 58 15 T 96 12 L 96 19 Q 60 16 30 20 T 0 23 Z`} fill="#8F7BE8" opacity="0.5" />
        {Array.from({ length: 16 }).map((_, i) => <rect key={i} x={(i * 31 + 3) % W} y={(i * 11) % 24} width="1" height="1" fill="#FFF" />)}
        <path d="M 8 40 L 26 22 L 44 40 Z" fill="#2A3258" /><path d="M 26 22 L 32 28 L 26 34 L 20 28 Z" fill="#EEF3F8" />
        <path d="M 50 40 L 70 18 L 90 40 Z" fill="#222A4E" /><path d="M 70 18 L 77 26 L 70 33 L 63 26 Z" fill="#EEF3F8" />
        <rect x="14" y="33" width="8" height="5" fill="#E8A35C" /><path d="M 12 33 L 18 28 L 24 33 Z" fill="#C96B4F" />
      </g>
    ),
    "arcade-champ": () => (
      <g>
        <rect width={W} height={H} fill="#241A3E" />
        {Array.from({ length: 24 }).map((_, i) => <rect key={i} x={(i * 17 + 4) % W} y={(i * 9 + 2) % 36} width="1" height="1" fill={["#E86FD8", "#5EDCA8", "#F2B93B"][i % 3]} />)}
        <g transform="translate(10 8)"><Sprite grid={SPR.ghost} pal={{ w: "#E86FA0", k: C.ink }} px={1} /></g>
        <g transform="translate(70 20)"><Sprite grid={SPR.ghost} pal={{ w: "#8FD0E8", k: C.ink }} px={1} /></g>
        <g transform="translate(40 12)"><Sprite grid={SPR.trophy} pal={{ y: C.gold }} px={1.4} /></g>
      </g>
    ),
    "hall-of-legends": () => (
      <g>
        <rect width={W} height={H} fill="#2A2010" />
        <rect y="32" width={W} height="8" fill="#4A3A18" />
        {[8, 28, 48, 68, 86].map((x, i) => <g key={i}><rect x={x} y="8" width="5" height="24" fill="#C8A03A" /><rect x={x - 1} y="6" width="7" height="3" fill="#E8C860" /><rect x={x - 1} y="30" width="7" height="3" fill="#E8C860" /></g>)}
        <g transform="translate(38 14)"><Sprite grid={SPR.trophy} pal={{ y: "#F8D878" }} px={1.6} /></g>
        {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={(i * 37 + 9) % W} y={(i * 5 + 2) % 10} width="1" height="1" fill="#F8D878" />)}
      </g>
    ),
    "pixel-pitch": () => (
      <g>
        <rect width={W} height={H} fill="#4E9E5E" />
        {Array.from({ length: 6 }).map((_, i) => <rect key={i} y={i * 7} width={W} height="3.5" fill="#5EAE6E" />)}
        <rect x="2" y="2" width={W - 4} height={H - 4} fill="none" stroke="#EEF3F8" strokeWidth="1" />
        <circle cx={W / 2} cy={H / 2} r="7" fill="none" stroke="#EEF3F8" strokeWidth="1" />
        <g transform="translate(24 10)"><Sprite grid={SPR.ball} pal={{ k: C.ink, w: "#FFF" }} px={1} /></g>
      </g>
    ),
    "summit-flag": () => (
      <g>
        <rect width={W} height={H} fill="#A8D8F0" />
        <path d={`M -4 40 L 30 8 L 64 40 Z`} fill="#7E8A96" /><path d="M 30 8 L 40 18 L 30 27 L 21 18 Z" fill="#EEF3F8" />
        <path d={`M 40 40 L 76 14 L 108 40 Z`} fill="#5E6670" />
        <rect x="29" y="1" width="1" height="8" fill={C.ink} /><path d="M 30 1 h 7 l -2 2 l 2 2 h -7 Z" fill={C.coral} />
        <Cloud x={58} y={4} /><PxSun x={82} y={3} />
      </g>
    ),
  };
  const S = scenes[id] || scenes["field-day"];
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" shapeRendering="crispEdges" style={{ display: "block", imageRendering: "pixelated" }}>
      {S()}
    </svg>
  );
}
const Cloud = ({ x, y }) => (<g transform={`translate(${x} ${y})`} fill="#FFF"><rect x="1" y="2" width="12" height="3" /><rect x="3" y="0" width="5" height="2" /><rect x="8" y="1" width="4" height="1" /></g>);
const PxSun = ({ x, y, big, neon }) => (<g transform={`translate(${x} ${y})`}><rect width={big ? 10 : 6} height={big ? 10 : 6} fill={neon ? "#E86FD8" : "#F8D040"} /><rect x={big ? 2 : 1} y={big ? 2 : 1} width={big ? 6 : 4} height={big ? 6 : 4} fill={neon ? "#F8A8F0" : "#F8E878"} />{neon && <rect y={big ? 5 : 3} width={big ? 10 : 6} height="1" fill="#1A1030" />}</g>);
const PxTree = ({ x, y, pink }) => (<g transform={`translate(${x} ${y})`}><rect x="2" y="6" width="2" height="4" fill="#7A4A22" /><rect x="0" y="2" width="6" height="4" fill={pink ? "#E886A0" : "#3E8A4E"} /><rect x="1" y="0" width="4" height="2" fill={pink ? "#F2A8B8" : "#5EAA6E"} /></g>);

/* ── avatar frames (shop cosmetics) ── */
function FrameArt({ id, size }) {
  const s = size + 10;
  const wrap = (children) => <svg className="absolute" width={s} height={s} viewBox="0 0 24 24" shapeRendering="crispEdges" style={{ left: -5, top: -5, pointerEvents: "none" }}>{children}</svg>;
  if (id === "sweatband") return wrap(<g><rect x="2" y="1" width="20" height="3" fill={C.coral} /><rect x="2" y="1" width="20" height="1" fill="#F28C7A" /></g>);
  if (id === "duck") return wrap(<g transform="translate(13 -1) scale(0.9)"><Sprite grid={SPR.duck} pal={{ y: C.gold, k: C.ink, o: "#F28C3B" }} px={1} /></g>);
  if (id === "bolt") return wrap(<g><g transform="translate(-2 -2)"><Sprite grid={SPR.bolt} pal={{ y: C.gold }} px={1} /></g><g transform="translate(14 14)"><Sprite grid={SPR.bolt} pal={{ y: C.gold }} px={1} /></g></g>);
  if (id === "flameF") return wrap(<g><g transform="translate(-2 12)"><Sprite grid={SPR.flame} pal={{ r: C.coral, o: "#F28C3B", y: C.gold }} px={1} /></g><g transform="translate(14 -2)"><Sprite grid={SPR.flame} pal={{ r: C.coral, o: "#F28C3B", y: C.gold }} px={1} /></g></g>);
  if (id === "starcrown") return wrap(<g>{[[1, 1], [18, 0], [10, -2]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y}) scale(0.55)`}><Sprite grid={SPR.star} pal={{ y: C.gold }} px={1} /></g>)}</g>);
  if (id === "halo8") return wrap(<g><rect x="4" y="-1" width="16" height="2" fill="#5EDCA8" /><rect x="3" y="0" width="1" height="1" fill="#5EDCA8" /><rect x="20" y="0" width="1" height="1" fill="#5EDCA8" /></g>);
  if (id === "laurelF") return wrap(<g transform="translate(0 6) scale(2)"><Sprite grid={SPR.laurel} pal={{ g: "#C8A03A" }} px={1} /></g>);
  if (id === "crownF") return wrap(<g transform="translate(5 -4) scale(1.1)"><Sprite grid={SPR.crown} pal={{ y: C.gold }} px={1} /></g>);
  return null;
}

/* ── seeded pixel photo scenes (stand-ins for real photos) ── */
const PHOTO_G = [["#F2A65E", "#7A3B2E"], ["#5E9E7F", "#1F4D3A"], ["#7FA8D9", "#2E4A78"], ["#D98CA6", "#7A3352"], ["#8E7CC3", "#3F3273"], ["#E8C15A", "#8A5A1E"], ["#6FB8B0", "#265B55"], ["#C87A5A", "#6E3A24"]];
function PixelScene({ seed = 0, className, style }) {
  const g = PHOTO_G[seed % PHOTO_G.length];
  return (
    <div className={className} style={{ position: "absolute", inset: 0, background: `linear-gradient(160deg, ${g[0]}, ${g[1]})`, ...style }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 20% 10%, rgba(255,255,255,0.22), transparent 55%)" }} />
    </div>
  );
}
const jRngL = (seed) => { let a = seed | 0 || 7; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

/* ── the shop catalog ── */
const SHOP = {
  banners: [
    { id: "morning-toast", name: "Morning Toast", rarity: "common", price: 30, desc: "Breakfast is a personality." },
    { id: "pixel-pitch", name: "Pixel Pitch", rarity: "common", price: 30, desc: "Grass. Lines. Glory." },
    { id: "summit-flag", name: "Summit Flag", rarity: "rare", price: 60, desc: "You planted it. Obviously." },
    { id: "deep-end", name: "The Deep End", rarity: "rare", price: 60, desc: "Where the confident swim." },
    { id: "cherry-dojo", name: "Cherry Dojo", rarity: "rare", price: 60, desc: "Petals fall. You don't." },
    { id: "neon-grid", name: "Neon Grid", rarity: "epic", price: 120, desc: "Cardio, but synthwave." },
    { id: "aurora-basecamp", name: "Aurora Basecamp", rarity: "epic", price: 120, desc: "Tent optional. Wonder mandatory." },
    { id: "arcade-champ", name: "Arcade Champion", rarity: "epic", price: 120, desc: "High score: showing up." },
    { id: "hall-of-legends", name: "Hall of Legends", rarity: "legendary", price: 250, desc: "Reserved for the ridiculous." },
  ],
  companions: [
    { id: "co-run", name: "Morning Jogger", spr: "runner", rarity: "common", price: 25, desc: "Laps your banner daily." },
    { id: "co-dog", name: "Good Boy", spr: "chDog", rarity: "common", price: 25, desc: "Rain or shine, he insists." },
    { id: "co-yoga", name: "Zen Buddy", spr: "chYoga", rarity: "rare", price: 50, desc: "Inner peace, outer pixels." },
    { id: "co-swim", name: "Lane Legend", spr: "chSwim", rarity: "rare", price: 50, desc: "Permanent backstroke." },
    { id: "co-lift", name: "Tiny Lifter", spr: "chLift", rarity: "epic", price: 100, desc: "Spots you emotionally." },
    { id: "co-box", name: "Shadow Boxer", spr: "chBox", rarity: "epic", price: 100, desc: "Undefeated against air." },
    { id: "co-dance", name: "Disco Dot", spr: "chDance", rarity: "legendary", price: 200, desc: "Your banner is a dance floor." },
    { id: "co-duck", name: "Emotional Support Duck", spr: "duck", rarity: "legendary", price: 200, desc: "He believes in you." },
  ],
};
const COIN_PACKS = [
  { id: "pk-100", name: "Handful of Coins", coins: 100, usd: 0.99 },
  { id: "pk-300", name: "Pouch of Coins", coins: 300, usd: 2.49, tag: "Popular" },
  { id: "pk-800", name: "Chest of Coins", coins: 800, usd: 4.99, tag: "Best value" },
  { id: "pk-2000", name: "Vault of Coins", coins: 2000, usd: 9.99 },
];
const COMPANION_PAL = { k: "#20180F", r: "#E8563F", b: "#8FD0E8", t: "#C89858", y: "#F2B93B" };
function Companion({ id, px: scale = 3 }) {
  const item = SHOP.companions.find((c) => c.id === id);
  if (!item) return null;
  return <Sprite grid={SPR[item.spr]} pal={COMPANION_PAL} px={scale} />;
}

/* ═══════════════ SEED DATA ═══════════════ */
const SEED_FRIENDS = [
  { id: "sofia", name: "Sofia", avatarSeed: 2, shirt: "#4C9E4C", days: 5, cheers: 21, since: "January" },
  { id: "maya", name: "Maya", avatarSeed: 1, shirt: "#E8563F", days: 5, cheers: 14, since: "February" },
  { id: "lena", name: "Lena", avatarSeed: 5, shirt: "#3E7BC4", days: 4, cheers: 11, since: "March" },
  { id: "dev", name: "Dev", avatarSeed: 6, shirt: "#7C5CD9", days: 4, cheers: 9, since: "April" },
  { id: "jake", name: "Jake", avatarSeed: 0, shirt: "#F2B93B", days: 3, cheers: 7, since: "June" },
  { id: "omar", name: "Omar", avatarSeed: 3, shirt: "#E86FA0", days: 2, cheers: 4, since: "June" },
];
const SEED_PAIRS = { sofia: 12, maya: 9, lena: 3, dev: 2 };
const PAIR_MS = [10, 25, 50, 100];
const SEED_POSTS = [
  { id: "p1", author: "jake", time: "26m", place: "Home gym", activity: "Lifting", caption: "leg day. walking is optional now", scene: 4, photo: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=800&h=1000&q=70", likes: 9, likedBy: "sofia", liked: false, reactions: { "💪": 4 }, praised: false },
  { id: "ms1", type: "milestone", author: "maya", time: "2h", text: "Maya unlocked Just Jogging", sub: "30 days of running, all-time", activity: "Running", tier: 2, hype: 7 },
  { id: "p2", author: "sofia", time: "3h", place: "Ann Morrison Park", activity: "Soccer", caption: "five-a-side friday", scene: 1, photo: "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=800&h=1000&q=70", likes: 23, likedBy: "maya", liked: false, reactions: { "🔥": 6, "👏": 2 }, praised: false },
  { id: "mem1", type: "memory", text: "You and Sofia showed up together — Soccer at the park", sub: "From your June 2025", scene: 7, photo: "https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=800&h=1000&q=70" },
  { id: "p3", author: "lena", time: "4h", place: "YMCA pool", activity: "Swimming", caption: "legs said no, pool said yes", scene: 2, photo: "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=800&h=1000&q=70", likes: 11, likedBy: "maya", liked: false, reactions: { "🙌": 2 }, praised: false },
  { id: "ms2", type: "milestone", author: "sofia", time: "5h", text: "Sofia hit a 230-day streak", sub: "Two hundred and thirty. Days.", streak: true, hype: 12 },
  { id: "p4", author: "dev", time: "6h", place: "Backyard", activity: "Meditation", caption: "10 minutes, zero thoughts (two thoughts)", scene: 5, photo: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?auto=format&fit=crop&w=800&h=1000&q=70", likes: 7, likedBy: "maya", liked: false, reactions: { "✨": 2 }, praised: false },
  { id: "p5", author: "maya", time: "8h", place: "Greenbelt", activity: "Running", caption: "before the heat", scene: 0, photo: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?auto=format&fit=crop&w=800&h=1000&q=70", likes: 15, likedBy: "sofia", liked: false, reactions: { "🔥": 4 }, praised: false },
  { id: "p6", author: "omar", time: "9h", place: "Foothills", activity: "Walking", caption: "golden hour delivered", scene: 6, photo: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=800&h=1000&q=70", likes: 13, likedBy: "lena", liked: false, reactions: { "✨": 3 }, praised: false },
];
const SEED_COMMENTS = {
  p1: [{ id: 1, author: "sofia", text: "barely still counts 💪", likes: 4, liked: false }, { id: 2, author: "dev", text: "up we go", likes: 1, liked: false }],
  p2: [{ id: 3, author: "maya", text: "@lena five-a-side fridays >>>", likes: 6, liked: false }, { id: 4, author: "jake", text: "ball knowledge", likes: 2, liked: false }, { id: 5, author: "dev", text: "W", likes: 0, liked: false }],
  p3: [{ id: 6, author: "maya", text: "pool > legs, correct", likes: 3, liked: false }],
  p4: [{ id: 7, author: "maya", text: "zen king", likes: 2, liked: false }],
  p5: [{ id: 8, author: "sofia", text: "5am?? respect", likes: 5, liked: false }, { id: 9, author: "lena", text: "the consistency!!", likes: 1, liked: false }],
};
const SEED_PROGRESS = { Golf: 500, Running: 34, Lifting: 12, Yoga: 7, Soccer: 6, Meditation: 4, Walking: 3, Swimming: 1 };
const SEED_SUGGESTED = [
  { id: "ava", name: "Ava", avatarSeed: 7, shirt: "#1E9E86", mutual: 4 },
  { id: "noah", name: "Noah", avatarSeed: 4, shirt: "#3E7BC4", mutual: 2 },
  { id: "liam", name: "Liam", avatarSeed: 3, shirt: "#C8901A", mutual: 1 },
];
const SEED_REQUESTS = [{ id: "zoe", name: "Zoe", avatarSeed: 5, shirt: "#E86FA0", mutual: 3 }, { id: "marcus", name: "Marcus", avatarSeed: 6, shirt: "#4C9E4C", mutual: 1 }];
const EMOJI = ["🔥", "👏", "💪", "🙌", "✨", "😤", "🫡", "🏆"];

/* ── FEATURED: the community wall. Friends nominate one post a week;
     the ShowUp team hand-picks winners per category every Sunday.
     Getting featured mints a flex-worthy badge.                     ── */
const FEATURED_WEEK = {
  label: "June 22 – 28",
  categories: [
    { id: "artsy", emoji: "🎨", title: "Most Artsy", postId: "p3", blurb: "Light on water, zero edits." },
    { id: "beauty", emoji: "🌄", title: "Most Beautiful", postId: "p5", blurb: "Greenbelt gold before 6 a.m." },
    { id: "golden", emoji: "🌅", title: "Golden Hour", post: { author: { name: "Marcus V.", avatarSeed: 6, shirt: "#C8901A" }, community: true, photo: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=800&h=1000&q=70", scene: 3, caption: "chased it, caught it", likes: 214 }, blurb: "All the way from Lisbon." },
    { id: "vibe", emoji: "😌", title: "Best Vibe", postId: "p4", blurb: "Two thoughts. Still counts." },
    { id: "grit", emoji: "🥵", title: "The Grit Award", post: { author: { name: "Priya", avatarSeed: 4, shirt: "#3E7BC4" }, community: true, photo: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&h=1000&q=70", scene: 4, caption: "the bar doesn't care how you feel", likes: 391 }, blurb: "Community pick — no notes." },
    { id: "squad", emoji: "🫶", title: "Squad Energy", postId: "p2", blurb: "Five-a-side, one heartbeat." },
  ],
};
/* categories you can enter your own post into — pick at your discretion */
const NOMINATE_CATS = ["Most Artsy", "Most Beautiful", "Golden Hour", "Best Vibe", "The Grit Award", "Squad Energy", "Funniest Frame", "Wildcard"];
/* your private month-by-month photo history (only you can open this) */
const buildDemoHistory = () => {
  const acts = ["Golf", "Running", "Lifting", "Yoga", "Soccer", "Meditation", "Walking", "Swimming"];
  const skip = new Set([3, 7, 12, 19, 22, 28]);
  const june = {};
  for (let d = 1; d <= 30; d++) if (!skip.has(d)) june[d] = { activity: acts[(d * 5) % acts.length], scene: (d * 13) % 8 };
  return { 6: june, 7: {} };
};
const MONTH_NAMES = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_META = { 6: { days: 30, firstDow: 1 }, 7: { days: 31, firstDow: 3 } }; // June 2026 starts Mon, July Wed

function EventsSheet({ st, act, initialView, onClose }) {
  const [view, setView] = useState(initialView || "list"); // list | new | event id
  const [fAct, setFAct] = useState(null);
  const [fPlace, setFPlace] = useState("");
  const [fWhen, setFWhen] = useState(null);
  const [fCustom, setFCustom] = useState("");
  const [fNote, setFNote] = useState("");
  const now = Date.now();
  const upcoming = st.events.filter((e) => e.at > now).sort((a, b) => a.at - b.at);
  const P = (g) => evPerson(g, st.me, st.people);
  const QUICK = ["Basketball", "Soccer", "Running", "Golf", "Lifting", "Yoga", "Walking", "Swimming"];
  const whenChips = () => {
    const d = new Date(); const H = 3600e3;
    const tonight = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 19, 0).getTime();
    const tmrw = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 8, 0).getTime();
    const sat = (() => { const x = new Date(d); x.setDate(x.getDate() + ((6 - x.getDay() + 7) % 7 || 7)); return new Date(x.getFullYear(), x.getMonth(), x.getDate(), 10, 0).getTime(); })();
    return [["Tonight 7 PM", tonight > now ? tonight : tonight + 24 * H], ["Tomorrow 8 AM", tmrw], ["Saturday 10 AM", sat]];
  };
  const canCreate = fAct && fPlace.trim() && (fWhen || fCustom);
  const submit = () => {
    const at = fCustom ? new Date(fCustom).getTime() : fWhen;
    if (!at || isNaN(at) || at < now) return;
    act.createEvent({ activity: fAct, place: V.clean(fPlace).slice(0, 40), at, note: V.clean(fNote).slice(0, 80) });
    setView("list"); setFAct(null); setFPlace(""); setFWhen(null); setFCustom(""); setFNote("");
  };
  const going = (e) => evGoing(e);
  const detail = typeof view === "string" && view.startsWith("e") && view !== "new" ? upcoming.find((e) => e.id === view) : null;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 49, paddingTop: "env(safe-area-inset-top)", ...TYPE, background: C.paper, animation: "sheetUp 0.28s ease both" }} {...swipeBack(view === "list" ? onClose : () => setView("list"))}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ borderBottom: BORDER }}>
        <button onClick={view === "list" ? onClose : () => setView("list")} className="p-2 active:scale-90 transition-transform"><ChevronLeft size={20} color={C.ink} /></button>
        <div className="flex-1 text-center text-sm font-bold" style={{ color: C.ink }}>{view === "new" ? "New event" : detail ? detail.activity : "Events"}</div>
        {view === "list" ? (
          <button onClick={() => setView("new")} className="px-3 py-1.5 mr-1 text-xs font-bold rounded-full active:scale-95 transition-transform" style={{ background: C.teal, color: "#FFF" }}>+ New</button>
        ) : <span style={{ width: 36 }} />}
      </div>

      {view === "list" && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-3 pb-10">
          {upcoming.length === 0 && (
            <div className="text-center pt-16 px-8">
              <CalendarDays size={30} color={C.faint} className="mx-auto" />
              <div className="text-sm font-bold mt-3" style={{ color: C.ink }}>Nothing planned yet</div>
              <div className="text-xs mt-1" style={{ color: C.faint }}>Post one — your friends see it in their feed.</div>
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {upcoming.map((e) => {
              const host = P(e.host); const going = evGoing(e);
              return (
                <button key={e.id} onClick={() => setView(e.id)} className="w-full text-left p-3 active:scale-[0.99] transition-transform" style={px.card}>
                  <div className="flex items-center gap-2">
                    <PxTag color={ACT_COLOR(e.activity)} ink="#FFF">{e.activity}</PxTag>
                    <span className="text-xs font-bold" style={{ color: C.teal }}>{fmtWhen(e.at)}</span>
                    <span className="flex-1" />
                    <span onClick={(ev) => { ev.stopPropagation(); act.rsvp(e.id); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-full active:scale-90 transition-transform" style={{ background: going ? C.teal : C.field }}>
                      <ThumbsUp size={13} color={going ? "#FFF" : C.ink} fill={going ? "#FFF" : "none"} />
                      <span className="text-xs font-bold tabular-nums" style={{ color: going ? "#FFF" : C.ink }}>{e.going.length}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2"><MapPin size={13} color={C.mute} /><span className="text-sm font-semibold" style={{ color: C.ink }}>{e.place}</span></div>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    <PxAvatar user={host} size={20} />
                    <span className="text-xs" style={{ color: C.faint }}>{e.host === "you" ? "You're hosting" : `${host?.name} is hosting`}</span>
                    {host?.community && <PxTag color="#E2EDF8" ink="#3E7BC4">Community</PxTag>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {detail && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-10">
          <div className="p-4" style={px.card}>
            <div className="flex items-center gap-2">
              <PxTag color={ACT_COLOR(detail.activity)} ink="#FFF">{detail.activity}</PxTag>
              {detail.host === "you" && <PxTag color={C.gold}>Your event</PxTag>}
            </div>
            <div className="text-xl font-bold pt-2.5" style={{ color: C.ink }}>{fmtWhen(detail.at)}</div>
            <div className="flex items-center gap-1.5 pt-1.5"><MapPin size={14} color={C.mute} /><span className="text-sm font-semibold" style={{ color: C.ink }}>{detail.place}</span></div>
            {detail.note && <div className="text-sm pt-2" style={{ color: C.mute }}>{detail.note}</div>}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest pt-5 pb-2" style={{ color: C.faint }}>Going · {detail.going.length}</div>
          <div className="flex flex-col">
            {detail.going.map((g, i) => {
              const p = P(g);
              return p ? (
                <div key={(p.name || "g") + i} className="flex items-center gap-2.5 py-2" style={{ borderBottom: "1.5px solid rgba(32,24,15,0.08)" }}>
                  <PxAvatar user={p} size={30} />
                  <span className="text-sm font-semibold" style={{ color: C.ink }}>{p.name}</span>
                  {p.community && <PxTag color="#E2EDF8" ink="#3E7BC4">Community</PxTag>}
                  {g === detail.host && <span className="text-xs" style={{ color: C.faint }}>host</span>}
                </div>
              ) : null;
            })}
          </div>
          <div className="pt-5">
            <PxButton full kind={evGoing(detail) ? "ghost" : "primary"} onClick={() => act.rsvp(detail.id)}>
              <span className="inline-flex items-center gap-2"><ThumbsUp size={14} /> {evGoing(detail) ? "You're going — tap to opt out" : "I'm in"}</span>
            </PxButton>
            {evGoing(detail) && <div className="text-xs text-center pt-2.5" style={{ color: C.faint }}>You'll get a reminder before it starts.</div>}
          </div>
        </div>
      )}

      {view === "new" && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-4 pb-10">
          <div className="text-xs font-bold uppercase tracking-widest pb-2" style={{ color: C.faint }}>What</div>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((a) => (
              <button key={a} onClick={() => setFAct(a)} className="px-3 py-2 text-sm font-bold active:scale-95 transition-transform" style={{ ...px.chip, background: fAct === a ? C.teal : C.field, color: fAct === a ? "#FFF" : C.ink }}>{a}</button>
            ))}
          </div>
          <div className="text-xs font-bold uppercase tracking-widest pt-5 pb-2" style={{ color: C.faint }}>Where</div>
          <PxInput value={fPlace} onChange={(e) => setFPlace(e.target.value)} placeholder="Court, park, gym, trail…" maxLength={40} right={<MapPin size={14} color={C.faint} />} />
          <div className="text-xs font-bold uppercase tracking-widest pt-5 pb-2" style={{ color: C.faint }}>When</div>
          <div className="flex flex-wrap gap-2">
            {whenChips().map(([label, ts]) => (
              <button key={label} onClick={() => { setFWhen(ts); setFCustom(""); }} className="px-3 py-2 text-sm font-bold active:scale-95 transition-transform" style={{ ...px.chip, background: fWhen === ts && !fCustom ? C.teal : C.field, color: fWhen === ts && !fCustom ? "#FFF" : C.ink }}>{label}</button>
            ))}
          </div>
          <input type="datetime-local" value={fCustom} onChange={(e) => { setFCustom(e.target.value); setFWhen(null); }} className="w-full mt-2 outline-none" style={{ ...TYPE, background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "12px 14px", fontSize: 16, color: fCustom ? C.ink : C.faint }} />
          <div className="text-xs font-bold uppercase tracking-widest pt-5 pb-2" style={{ color: C.faint }}>Note <span style={{ textTransform: "none", letterSpacing: 0 }}>(optional)</span></div>
          <PxInput value={fNote} onChange={(e) => setFNote(e.target.value)} placeholder="Skill level, what to bring…" maxLength={80} />
          <div className="pt-6"><PxButton full disabled={!canCreate} onClick={submit}>Post event</PxButton></div>
          <div className="text-xs text-center pt-2.5" style={{ color: C.faint }}>Visible to everyone near Boise. It disappears after it happens.</div>
        </div>
      )}
    </div>
  );
}

function HistorySheet({ st, onClose }) {
  const [month, setMonth] = useState(6);
  const [light, setLight] = useState(null);
  const meta = MONTH_META[month];
  const entries = st.history[month] || {};
  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 48, paddingTop: "env(safe-area-inset-top)", ...TYPE, background: C.paper, animation: "sheetUp 0.28s ease both" }} {...swipeBack(onClose)}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ borderBottom: BORDER }}>
        <button onClick={onClose} className="p-2 active:scale-90 transition-transform"><ChevronLeft size={20} color={C.ink} /></button>
        <div className="flex-1 text-center">
          <div className="text-sm font-bold" style={{ color: C.ink }}>Your days</div>
          <div className="leading-tight" style={{ fontSize: 10.5, color: C.faint }}>Only you see this</div>
        </div>
        <span style={{ width: 36 }} />
      </div>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => setMonth(6)} className="p-2 active:scale-90 transition-transform" style={{ opacity: month === 6 ? 0.25 : 1 }} aria-label="Previous month"><ChevronLeft size={18} color={C.ink} /></button>
        <span className="text-base font-bold" style={{ color: C.ink }}>{MONTH_NAMES[month]} 2026</span>
        <button onClick={() => setMonth(7)} className="p-2 active:scale-90 transition-transform" style={{ opacity: month === 7 ? 0.25 : 1 }} aria-label="Next month"><ChevronRight size={18} color={C.ink} /></button>
      </div>
      <div className="grid grid-cols-7 px-3 pb-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} className="text-center text-xs font-bold py-1" style={{ color: C.faint }}>{d}</div>)}
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 pb-8">
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: meta.firstDow }).map((_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: meta.days }).map((_, i) => {
            const d = i + 1;
            const e = entries[d];
            return (
              <button key={d} onClick={e ? () => setLight({ d, e }) : undefined} className="relative overflow-hidden active:scale-95 transition-transform" style={{ aspectRatio: "1", borderRadius: 10, background: e ? C.card : "transparent", border: e ? BORDER : `1px dashed ${C.line}` }}>
                {e && (e.photo ? <img src={e.photo} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <PixelScene seed={e.scene} />)}
                <span className="absolute top-0.5 left-1 font-bold" style={{ fontSize: 9.5, color: e ? "#FFF" : C.faint, textShadow: e ? "0 1px 2px rgba(23,19,14,0.7)" : "none" }}>{d}</span>
              </button>
            );
          })}
        </div>
      </div>
      {light && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-7" style={{ zIndex: 5, background: "rgba(23,19,14,0.82)", animation: "fadeIn 0.18s ease both" }} onClick={() => setLight(null)}>
          <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 5", borderRadius: 18, maxWidth: 330 }}>
            {light.e.photo ? <img src={light.e.photo} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <PixelScene seed={light.e.scene} />}
          </div>
          <div className="flex items-center gap-2 pt-3">
            <PxTag color={ACT_COLOR(light.e.activity)} ink="#FFF">{light.e.activity}</PxTag>
            <span className="text-sm font-semibold text-white">{MONTH_NAMES[month]} {light.d}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── EVENTS — plans to show up together; they expire on their own ── */
const fmtWhen = (ts) => {
  const d = new Date(ts), now = new Date();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dd = Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - day0) / 86400000);
  const label = dd === 0 ? "Today" : dd === 1 ? "Tomorrow" : d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  return `${label} · ${time}`;
};
const CM = (name, avatarSeed, shirt) => ({ name, avatarSeed, shirt, community: true });
const buildSeedEvents = () => {
  const now = Date.now(), H = 3600e3, D = 24 * H;
  return [
    { id: "e1", host: CM("Tyler R.", 6, "#C8901A"), activity: "Basketball", place: "YMCA outdoor court", at: now + 3 * H, note: "5v5 if enough show — all levels welcome", going: [CM("Tyler R.", 6, "#C8901A"), CM("Priya", 4, "#3E7BC4"), "jake"] },
    { id: "e2", host: "sofia", activity: "Soccer", place: "Ann Morrison Park", at: now + 2 * D + 2 * H, note: "Five-a-side. Bring water.", going: ["sofia", "maya", "lena", CM("Marcus V.", 2, "#7C5CD9")] },
    { id: "e3", host: CM("Nina S.", 1, "#3E8A78"), activity: "Yoga", place: "Julia Davis Park lawn", at: now + 3 * D + 9 * H, note: "Bring a mat, all levels", going: [CM("Nina S.", 1, "#3E8A78")] },
    { id: "e4", host: "maya", activity: "Running", place: "Greenbelt trailhead", at: now + 4 * D + 8 * H, note: "Easy 5k, coffee after", going: ["maya"] },
    { id: "e5", host: "you", activity: "Golf", place: "Warm Springs, 9 holes", at: now + 1 * D + 10 * H, note: "Walking pace, relaxed round", going: ["you", "lena", "dev"] },
  ];
};
const evPerson = (g, me, people) => (typeof g === "object" ? g : g === "you" ? { ...me, name: "You" } : people[g]);
const evGoing = (e) => e.going.some((g) => g === "you");

const SEED_MY_FEATURED = [
  { id: "fw24", kind: "featured", activity: "Featured", tier: 5, name: "Golden Hour — Wk 24", cat: "Most Beautiful" },
];

/* earned badge computation from the catalog */
const badgesFor = (progress) => {
  const out = [];
  Object.entries(progress).forEach(([act, days]) => {
    TIER_DAYS.forEach((t, i) => { if (days >= t) out.push({ id: `${act}-${i + 1}`, activity: act, tier: i + 1, name: CATALOG[act]?.[i] || `Tier ${i + 1}` }); });
  });
  return out.sort((a, b) => b.tier - a.tier);
};
const groupTrophies = (badges) => {
  const best = {};
  badges.forEach((b) => { if (!best[b.activity] || b.tier > best[b.activity].tier) best[b.activity] = b; });
  return Object.values(best).sort((a, b) => b.tier - a.tier);
};

/* ═══════════════ 7. AUTH — full account creation, the real way ═══════════════
   Sign up: contact → verification code → password → name/username/photo.
   Log in: identifier + password (or a one-time code; forgot-password resets
   via code). Credentials are salted-hashed; delivery lands in the outbox.  */

/* auth helpers live at module scope — defining them inside AuthFlow
   made React remount the subtree on every keystroke (focus loss).   */
function AuthShell({ children, onBack, progress }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", ...TYPE, background: C.paper }}>
      <div className="flex items-center h-12 px-2 shrink-0">
        {onBack && <button onClick={onBack} className="p-2 active:scale-90 transition-transform"><ChevronLeft size={22} color={C.ink} /></button>}
        {progress != null && (
          <div className="flex-1 flex justify-center gap-1.5">
            {[0, 1, 2, 3].map((i) => <span key={i} className="rounded-full" style={{ width: 26, height: 4, background: i <= progress ? C.teal : C.line }} />)}
          </div>
        )}
        {onBack && <span style={{ width: 38 }} />}
      </div>
      <div className="relative flex-1 flex flex-col px-6 pb-8 overflow-y-auto no-scrollbar">{children}</div>
    </div>
  );
}
const AuthH = ({ t, s }) => (<><div className="font-bold tracking-tight" style={{ fontSize: 26, color: C.ink, letterSpacing: -0.6 }}>{t}</div>{s && <div className="text-sm mt-1.5 leading-relaxed" style={{ color: C.mute }}>{s}</div>}</>);
const AuthErr = ({ err }) => (err ? <div className="text-xs font-semibold mt-2.5" style={{ color: C.coral }}>{err}</div> : null);
function OtpBoxes({ code, boxesRef, onType }) {
  return (
    <div className="flex gap-2 mt-6 justify-center">
      {code.map((c, i) => (
        <input key={i} ref={(el) => (boxesRef.current[i] = el)} value={c} inputMode="numeric" maxLength={i === 0 ? 6 : 1}
          onChange={(e) => onType(i, e.target.value)}
          onKeyDown={(e) => { if (e.key === "Backspace" && !c && i > 0) boxesRef.current[i - 1]?.focus(); }}
          className="text-center font-bold outline-none"
          style={{ ...TYPE, width: 44, height: 54, fontSize: 21, background: C.card, border: `1.5px solid ${c ? C.teal : C.line}`, borderRadius: 14, color: C.ink }}
        />
      ))}
    </div>
  );
}

function AuthFlow({ core, onDone }) {
  const [mode, setMode] = useState("welcome"); // welcome | su-contact | su-code | su-password | su-username | li | forgot-code | forgot-new
  const [channel, setChannel] = useState("email");
  const [identity, setIdentity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [cooldown, setCooldown] = useState(0);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [liPw, setLiPw] = useState("");
  const [uname, setUname] = useState("");
  const [dname, setDname] = useState("");
  const [photo, setPhoto] = useState(null);
  const boxes = useRef([]);
  const fileRef = useRef(null);

  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  const idOk = channel === "phone" ? V.phone(identity.trim()) : V.email(identity.trim());
  const emailOk = V.email(email.trim());
  const phoneOk = V.phone(phone.trim());
  const detailsOk = dname.trim().length > 0 && (emailOk || phoneOk);
  const pwOk = pw.length >= 8 && /\d/.test(pw);
  const unameFree = V.username(uname) && !core.db.usernames.has(uname);
  const unameHint = `${(dname.trim().split(" ")[0] || "showup").toLowerCase().replace(/[^a-z0-9_]/g, "")}${Math.floor((uname.length + dname.length) * 7 % 90) + 10}`;
  const startVerify = () => {
    if (!detailsOk) { setErr(!dname.trim() ? "Add your name." : "Add a valid email or phone number."); return; }
    const primary = emailOk ? email.trim() : phone.trim();
    setChannel(emailOk ? "email" : "phone");
    setIdentity(primary);
    const r = core.otp.request(primary, emailOk ? "EMAIL" : "SMS");
    if (!r.ok) { setErr(r.error); return; }
    setErr(""); setCooldown(30); setCode(["", "", "", "", "", ""]); setMode("su-code");
    setTimeout(() => boxes.current[0]?.focus(), 80);
  };

  const sendCode = (nextMode) => {
    if (!idOk) { setErr(channel === "phone" ? "That number doesn't look right." : "That email doesn't look right."); return; }
    const r = core.otp.request(identity.trim(), channel === "phone" ? "SMS" : "EMAIL");
    if (!r.ok) { setErr(r.error); return; }
    setErr(""); setCooldown(30); setCode(["", "", "", "", "", ""]); setMode(nextMode);
    setTimeout(() => boxes.current[0]?.focus(), 80);
  };
  const typeCode = (i, v) => {
    const d = v.replace(/\D/g, "");
    if (d.length > 1) { const arr = d.slice(0, 6).split(""); setCode((c) => c.map((x, j) => arr[j] || x)); boxes.current[Math.min(5, d.length - 1)]?.focus(); return; }
    setCode((c) => { const n = [...c]; n[i] = d; return n; });
    if (d && i < 5) boxes.current[i + 1]?.focus();
  };
  const verifyCode = (nextMode) => {
    const r = core.otp.verify(identity.trim(), code.join(""));
    if (!r.ok) { setErr(r.error); return; }
    setErr(""); setMode(nextMode);
  };
  useEffect(() => {
    if ((mode === "su-code" || mode === "forgot-code") && code.every((c) => c !== "")) verifyCode(mode === "su-code" ? "su-password" : "forgot-new");
  }, [code]); // eslint-disable-line

  const finishSignup = () => {
    if (!V.username(uname)) { setErr("Username: 3–15 characters — letters, numbers, underscores."); return; }
    if (core.db.usernames.has(uname)) { setErr(`@${uname} is taken — tap the suggestion below.`); return; }
    const ids = [emailOk ? email.trim() : null, phoneOk ? phone.trim() : null].filter(Boolean);
    core.registerCredentials(ids.length ? ids : [identity.trim()], pw, uname);
    onDone({ identity: identity.trim(), channel, username: uname, name: V.clean(dname).slice(0, 30), photo });
  };
  const doLogin = () => {
    const r = core.login(identity.trim(), liPw);
    if (!r.ok) { setErr(r.error); return; }
    onDone({ identity: identity.trim(), channel, username: r.username, name: r.username, photo: null, returning: true });
  };
  const onFile = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setPhoto(r.result); r.readAsDataURL(f); };


  if (mode === "welcome") return (
    <AuthShell>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <img src={LOGO} alt="ShowUp" style={{ width: 96, height: 96, animation: "bob 2.6s ease-in-out infinite" }} />
        <div className="font-bold tracking-tight mt-4" style={{ fontSize: 36, color: C.ink, letterSpacing: -1.2 }}>ShowUp</div>
        <div className="text-sm mt-2 leading-relaxed" style={{ color: C.mute, maxWidth: 260 }}>The place your friends show up, every day. No pressure — just presence.</div>
      </div>
      <div className="flex flex-col gap-2.5">
        <PxButton full onClick={() => { setMode("su-contact"); }}>Create account</PxButton>
        <PxButton full kind="ghost" onClick={() => { setMode("li"); }}>Log in</PxButton>
        <button onClick={() => onDone({ demo: true })} className="text-center text-xs font-semibold pt-2" style={{ ...TYPE, color: C.teal }}>Continue as demo Roy →</button>
        <div className="text-center pt-1.5" style={{ fontSize: 10.5, color: C.faint }}>v3.2 · event activity</div>
      </div>
    </AuthShell>
  );

  if (mode === "su-contact") return (
    <AuthShell onBack={() => { setErr(""); setMode("welcome"); }} progress={0}>
      <AuthH t="Let's get you in" s="Your name, plus at least one way to reach you." />
      <div className="mt-5 flex flex-col gap-3">
        <PxInput autoFocus value={dname} onChange={(e) => { setDname(e.target.value); setErr(""); }} placeholder="Full name" maxLength={30} />
        <PxInput value={email} inputMode="email" onChange={(e) => { setEmail(e.target.value); setErr(""); }} placeholder="Email"
          right={email.trim().length > 3 && (emailOk ? <Check size={16} color={C.green} /> : <X size={16} color={C.coral} />)} />
        <PxInput value={phone} inputMode="tel" onChange={(e) => { setPhone(e.target.value); setErr(""); }} placeholder="Phone (optional if email given)"
          right={phone.trim().length > 3 && (phoneOk ? <Check size={16} color={C.green} /> : <X size={16} color={C.coral} />)} />
      </div>
      <AuthErr err={err} />
      <div className="mt-5"><PxButton full disabled={!detailsOk} onClick={startVerify}>Send verification code</PxButton></div>
      <div className="text-xs mt-3 leading-relaxed" style={{ color: C.faint }}>{emailOk ? "We'll email your code." : phoneOk ? "We'll text your code." : "The code goes to your email — or your phone if that's all you give us."}</div>
    </AuthShell>
  );

  if (mode === "su-code" || mode === "forgot-code") return (
    <AuthShell onBack={() => { setErr(""); setMode(mode === "su-code" ? "su-contact" : "li"); }} progress={mode === "su-code" ? 1 : null}>
      <AuthH t="Enter the code" s={<>Sent to <b style={{ color: C.ink }}>{identity}</b> · expires in 5 minutes</>} />
      <OtpBoxes code={code} boxesRef={boxes} onType={typeCode} />
      <AuthErr err={err} />
      <div className="mt-6"><PxButton full onClick={() => verifyCode(mode === "su-code" ? "su-password" : "forgot-new")}>Verify</PxButton></div>
      <button onClick={cooldown ? undefined : () => { if (mode === "su-code") { startVerify(); } else { sendCode(mode); } }} className="text-xs font-semibold mt-4 text-center w-full" style={{ ...TYPE, color: cooldown ? C.faint : C.teal }}>
        {cooldown ? `Resend in ${cooldown}s` : "Resend code"}
      </button>
      <button onClick={() => setErr(core.peekLastCode(identity.trim()))} className="text-xs mt-5 text-center w-full" style={{ ...TYPE, color: C.faint }}>Testing? Peek the outbox →</button>
    </AuthShell>
  );

  if (mode === "su-password") return (
    <AuthShell onBack={() => { setErr(""); setMode("su-contact"); }} progress={2}>
      <AuthH t="Create a password" s="You'll use this to log in — codes are just for verifying." />
      <div className="mt-5 flex flex-col gap-3">
        <PxInput autoFocus type={showPw ? "text" : "password"} value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} placeholder="Password"
          right={<button onClick={() => setShowPw((s) => !s)} className="p-1">{showPw ? <EyeOff size={16} color={C.faint} /> : <Eye size={16} color={C.faint} />}</button>} />
        <PxInput type={showPw ? "text" : "password"} value={pw2} onChange={(e) => { setPw2(e.target.value); setErr(""); }} placeholder="Confirm password" />
      </div>
      <div className="flex flex-col gap-1.5 mt-3">
        {[["8+ characters", pw.length >= 8], ["contains a number", /\d/.test(pw)], ["passwords match", pw.length > 0 && pw === pw2]].map(([label, ok]) => (
          <div key={label} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: ok ? C.green : C.faint }}>
            <Check size={13} color={ok ? C.green : C.line} /> {label}
          </div>
        ))}
      </div>
      <AuthErr err={err} />
      <div className="mt-5"><PxButton full disabled={!pwOk || pw !== pw2} onClick={() => setMode("su-username")}>Continue</PxButton></div>
    </AuthShell>
  );

  if (mode === "su-username") return (
    <AuthShell onBack={() => { setErr(""); setMode("su-password"); }} progress={3}>
      <AuthH t="Claim your @" s="This is how friends find you." />
      <div className="flex justify-center mt-5">
        <button onClick={() => fileRef.current?.click()} className="relative active:scale-95 transition-transform" aria-label="Add photo">
          <PxAvatar user={{ name: dname || "?", photo, avatarSeed: (uname.length + dname.length) % 8 }} size={84} />
          <span className="absolute -bottom-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 28, height: 28, background: C.teal, border: `2.5px solid ${C.paper}` }}><Camera size={13} color="#FFF" /></span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
      <div className="text-xs text-center mt-2" style={{ color: C.faint }}>{dname.trim() || "Add a photo (optional)"}</div>
      <div className="mt-5 relative">
        <span className="absolute font-bold" style={{ left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: uname ? C.ink : C.faint, ...TYPE }}>@</span>
        <input autoFocus value={uname} onChange={(e) => { setUname(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")); setErr(""); }} placeholder="username" maxLength={15} spellCheck={false} autoCapitalize="none"
          className="w-full outline-none" style={{ ...TYPE, background: C.card, border: `1.5px solid ${uname.length >= 3 ? (unameFree ? C.green : C.coral) : C.line}`, borderRadius: 14, padding: "13px 40px 13px 32px", fontSize: 16, color: C.ink }} />
        <span className="absolute" style={{ right: 14, top: "50%", transform: "translateY(-50%)" }}>{uname.length >= 3 && (unameFree ? <Check size={17} color={C.green} /> : <X size={17} color={C.coral} />)}</span>
      </div>
      {uname.length >= 3 && !unameFree && (
        <button onClick={() => { setUname(unameHint); setErr(""); }} className="flex items-center gap-1.5 mt-2.5 px-3 py-2 active:scale-95 transition-transform" style={px.chip}>
          <Sparkles size={12} color={C.teal} /><span className="text-sm font-semibold" style={{ color: C.ink }}>@{unameHint} is free — take it</span>
        </button>
      )}
      {uname.length >= 3 && unameFree && <div className="text-xs mt-2" style={{ color: C.green }}>@{uname} is available.</div>}
      <AuthErr err={err} />
      <div className="mt-5"><PxButton full disabled={!unameFree} onClick={finishSignup}>Create my account</PxButton></div>
    </AuthShell>
  );

  if (mode === "forgot-new") return (
    <AuthShell onBack={() => { setErr(""); setMode("li"); }}>
      <AuthH t="New password" s="Verified. Set a fresh one and you're back in." />
      <div className="mt-5"><PxInput autoFocus type="password" value={pw} onChange={(e) => { setPw(e.target.value); setErr(""); }} placeholder="New password (8+, a number)" /></div>
      <AuthErr err={err} />
      <div className="mt-5"><PxButton full disabled={!pwOk} onClick={() => { const r = core.resetPassword(identity.trim(), pw); if (!r.ok) { setErr(r.error); return; } setLiPw(pw); setMode("li"); setErr("Password updated — log in below."); }}>Save & log in</PxButton></div>
    </AuthShell>
  );

  /* log in */
  return (
    <AuthShell onBack={() => { setErr(""); setMode("welcome"); }}>
      <AuthH t="Welcome back" s="Log in with your email or phone and password." />
      <div className="mt-5 flex flex-col gap-3">
        <PxInput autoFocus value={identity} onChange={(e) => { setIdentity(e.target.value); setErr(""); }} placeholder="Email or phone" />
        <PxInput type={showPw ? "text" : "password"} value={liPw} onChange={(e) => { setLiPw(e.target.value); setErr(""); }} placeholder="Password" onKeyDown={(e) => e.key === "Enter" && doLogin()}
          right={<button onClick={() => setShowPw((s) => !s)} className="p-1">{showPw ? <EyeOff size={16} color={C.faint} /> : <Eye size={16} color={C.faint} />}</button>} />
      </div>
      <AuthErr err={err} />
      <div className="mt-5"><PxButton full onClick={doLogin}>Log in</PxButton></div>
      <button onClick={() => { if (!idOk) { setErr("Enter your email or phone first."); return; } sendCode("forgot-code"); }} className="text-xs font-semibold mt-4 text-center w-full" style={{ ...TYPE, color: C.teal }}>Forgot password?</button>
      <div className="text-xs mt-6 text-center" style={{ color: C.faint }}>New here? <button onClick={() => { setErr(""); setMode("su-contact"); }} className="font-semibold" style={{ color: C.ink }}>Create an account</button></div>
    </AuthShell>
  );
}

/* ═══════════════ 8. CAMERA — live capture + the 8-BIT filter ═══════════════
   Real getUserMedia. The signature move: every photo can be crunched to
   chunky pixels — the whole feed gets a look no other social app has.  */

function CameraSheet({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState("user");
  const [err, setErr] = useState("");
  const [shot, setShot] = useState(null);      // raw dataURL
  const captureRef = useRef(null);              // native camera (mobile)

  const start = useCallback(async (mode) => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false });
      streamRef.current = s;
      if (videoRef.current) { videoRef.current.srcObject = s; await videoRef.current.play(); }
      setErr("");
    } catch (e) { setErr("blocked"); }
  }, []);
  useEffect(() => { start(facing); return () => streamRef.current?.getTracks().forEach((t) => t.stop()); }, [facing, start]);

  const grab = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const cv = document.createElement("canvas");
    const side = Math.min(v.videoWidth, v.videoHeight);
    cv.width = 480; cv.height = 600;
    const ctx = cv.getContext("2d");
    if (facing === "user") { ctx.translate(480, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, (v.videoWidth - side) / 2, (v.videoHeight - side * 1.25 < 0 ? 0 : (v.videoHeight - side * 1.25) / 2), side, side * 1.25, 0, 0, 480, 600);
    setShot(cv.toDataURL("image/jpeg", 0.9));
  };
  const use = () => onCapture(shot);
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setShot(r.result);
    r.readAsDataURL(f);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", ...TYPE, background: C.night }}>
      <div className="flex items-center h-12 px-2 shrink-0">
        <button onClick={onClose} className="p-2"><X size={20} color={C.paper} /></button>
        <div className="flex-1 text-center text-sm font-bold uppercase tracking-widest" style={{ color: C.paper }}>Proof of showing up</div>
        <span style={{ width: 36 }} />
      </div>
      <div className="flex-1 relative mx-4 overflow-hidden" style={{ border: `3px solid ${C.paper}`, borderRadius: 8 }}>
        {!shot ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" style={{ transform: facing === "user" ? "scaleX(-1)" : "none" }} />
            {err && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center" style={{ background: C.night }}>
                <Camera size={30} color={C.paper} />
                <div className="text-sm font-semibold" style={{ color: C.paper }}>The in-app preview is blocked here</div>
                <div className="text-xs -mt-1 leading-relaxed" style={{ color: "rgba(250,247,241,0.65)" }}>No problem — this button opens your phone's real camera.</div>
                <PxButton onClick={() => captureRef.current?.click()}><span className="inline-flex items-center gap-2"><Camera size={14} /> Take a photo</span></PxButton>
              </div>
            )}
            <Scanlines opacity={0.08} />
          </>
        ) : (
          <img src={shot} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
      </div>
      <input ref={captureRef} type="file" accept="image/*" capture="user" className="hidden" onChange={onFile} />
      <div className="px-5 pt-3 shrink-0" style={{ paddingBottom: "calc(24px + env(safe-area-inset-bottom))" }}>
        {!shot ? (
          <div className="flex items-center justify-between">
            <span style={{ width: 46 }} />
            <button onClick={grab} className="active:scale-90 transition-transform" aria-label="Capture" style={{ width: 70, height: 70, borderRadius: 999, background: "#FFF", boxShadow: `0 0 0 4px rgba(255,255,255,0.35)` }} />
            <button onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))} className="p-3" aria-label="Flip camera"><SwitchCamera size={20} color={C.paper} /></button>
          </div>
        ) : (
          <div className="flex gap-2.5">
            <PxButton full kind="ghost" onClick={() => setShot(null)} style={{ background: "rgba(250,247,241,0.14)", color: C.paper }}>Retake</PxButton>
            <PxButton full onClick={use}>Use it</PxButton>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════ 9. SURFACES ═══════════════ */

/* ── FEED ── */
function PostPhoto({ post, className }) {
  const [err, setErr] = useState(false);
  if (!post.photo || err) return <PixelScene seed={post.scene ?? 0} />;
  return <img src={post.photo} alt="" loading="lazy" onError={() => setErr(true)} className={className || "absolute inset-0 w-full h-full object-cover"} />;
}

function PostCard({ post, person, isYou, people, comments, onLike, onReact, onComment, onOpenPerson, onMenu }) {
  const [pop, setPop] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const lastTap = useRef(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const top = (comments[post.id] || [])[0];
  const count = (comments[post.id] || []).length;
  const likedByP = post.likedBy ? people[post.likedBy] : null;
  return (
    <div className="px-3 pt-3">
      <div className="relative" style={px.card}>
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <button onClick={() => onOpenPerson(post.author)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left active:scale-95 transition-transform">
            <PxAvatar user={person} size={34} />
            <div className="min-w-0">
              <div className="text-sm font-bold truncate" style={{ color: C.ink }}>{isYou ? "You" : person.name}</div>
              <div className="text-xs" style={{ color: C.faint }}>{post.time} · {post.place}</div>
            </div>
          </button>
          <PxTag color={ACT_COLOR(post.activity)} ink="#FFF">{post.activity}</PxTag>
          <div className="relative">
            <button onClick={() => setMenuOpen((o) => !o)} className="p-1.5 active:scale-90 transition-transform" aria-label="More"><MoreHorizontal size={17} color={C.mute} /></button>
            {menuOpen && (
              <div className="absolute right-0 flex flex-col overflow-hidden" style={{ top: "calc(100% + 4px)", minWidth: 172, background: C.card, border: BORDER, borderRadius: 14, boxShadow: "0 10px 26px -10px rgba(23,19,14,0.35)", zIndex: 6, animation: "spotIn 0.16s ease both" }}>
                {isYou ? (
                  <button onClick={() => { setMenuOpen(false); onMenu("nominate", post); }} className="px-3.5 py-2.5 text-sm font-semibold text-left" style={{ color: C.ink }}>🏅 Enter into Featured</button>
                ) : (
                  <>
                    <button onClick={() => { setMenuOpen(false); onMenu("share", post); }} className="px-3.5 py-2.5 text-sm font-semibold text-left" style={{ color: C.ink, borderBottom: `1px solid ${C.line}` }}>Share post</button>
                    <button onClick={() => { setMenuOpen(false); onMenu("report", post); }} className="px-3.5 py-2.5 text-sm font-semibold text-left" style={{ color: C.coral }}>Report</button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div
          className="relative mx-2 overflow-hidden select-none"
          style={{ aspectRatio: "4 / 5", border: BORDER, borderRadius: 12, touchAction: "manipulation" }}
          onPointerUp={() => {
            const t = Date.now();
            if (t - (lastTap.current || 0) < 320) { if (!post.liked) onLike(post.id); setPop((p) => p + 1); }
            lastTap.current = t;
          }}
        >
          <PostPhoto post={post} />
          <Scanlines opacity={0.04} />
          {pop > 0 && <div key={pop} className="absolute inset-0 flex items-center justify-center pointer-events-none"><div style={{ animation: "heartPop 0.7s ease both" }}><Sprite grid={SPR.heart} pal={{ r: C.coral }} px={6} /></div></div>}
        </div>
        <div className="flex items-center gap-3 px-3 pt-2.5">
          <button onClick={() => onLike(post.id)} className="flex items-center gap-1.5 active:scale-90 transition-transform" aria-label="Like">
            <Heart size={20} color={post.liked ? C.coral : C.ink} fill={post.liked ? C.coral : "none"} strokeWidth={2.4} />
            {post.likes > 0 && <span className="text-xs font-bold tabular-nums" style={{ color: post.liked ? C.coral : C.mute }}>{post.likes}</span>}
          </button>
          <button onClick={() => onComment(post.id)} className="flex items-center gap-1.5 active:scale-90 transition-transform" aria-label="Comment">
            <MessageCircle size={19} color={C.ink} strokeWidth={2.4} />
            {(comments[post.id] || []).length > 0 && <span className="text-xs font-bold tabular-nums" style={{ color: C.mute }}>{(comments[post.id] || []).length}</span>}
          </button>
          <div className="flex gap-1 ml-auto">
            {Object.entries(post.reactions).map(([e, n]) => (
              <button key={e} onClick={() => onReact(post.id, e)} className="px-1.5 py-0.5 text-xs font-bold active:scale-90 transition-transform" style={{ ...px.chip, borderWidth: 1.5 }}>{e} {n}</button>
            ))}
            <div className="relative">
              <button onClick={() => setPickerOpen((o) => !o)} className="px-1.5 py-0.5 active:scale-90 transition-transform" style={px.chip}><Plus size={11} color={C.ink} /></button>
              {pickerOpen && (
                <div className="absolute right-0 flex gap-1 px-2 py-1.5" style={{ bottom: "calc(100% + 6px)", background: C.card, border: BORDER, borderRadius: 999, boxShadow: "0 8px 20px -8px rgba(23,19,14,0.3)", zIndex: 5, animation: "spotIn 0.18s ease both" }}>
                  {EMOJI.map((e) => (
                    <button key={e} onClick={() => { onReact(post.id, e); setPickerOpen(false); }} className="text-base active:scale-125 transition-transform" style={{ lineHeight: 1 }}>{e}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {post.likes > 0 && (likedByP || post.liked) && (
          <div className="px-3 pt-1.5 text-xs" style={{ color: C.mute }}>
            Liked by <b style={{ color: C.ink }}>{post.liked ? "you" : likedByP.name}</b>{post.likes > 1 && ` and ${post.likes - 1} other${post.likes - 1 === 1 ? "" : "s"}`}
          </div>
        )}
        {post.caption && <div className="px-3 pt-1 text-sm" style={{ color: C.ink }}><b>{isYou ? "you" : person.name.toLowerCase()}</b> {post.caption}</div>}
        {top && people[top.author] && <div className="px-3 pt-0.5 text-sm" style={{ color: C.ink }}><b>{people[top.author].name.toLowerCase()}</b> <span style={{ color: C.mute }}><MentionText text={top.text} people={people} onOpen={onOpenPerson} /></span></div>}
        {count > 1 && <button onClick={() => onComment(post.id)} className="px-3 pt-1 text-sm text-left" style={{ color: C.faint }}>View all {count} comments</button>}
        <div className="pb-2.5" />
      </div>
    </div>
  );
}

function MilestoneCard({ post, isYou, onOpenPerson, onHype }) {
  const [hyped, setHyped] = useState(false);
  return (
    <div className="px-3 pt-3">
      <div className="relative overflow-hidden" style={{ borderRadius: 18, background: "linear-gradient(140deg, #3A2E68, #221A48)", boxShadow: "0 6px 18px -8px rgba(34,26,72,0.55)" }}>
        <Dither opacity={0.12} />
        <div className="relative flex items-center gap-3 px-3 py-3">
          <button onClick={() => onOpenPerson(post.author)} className="shrink-0 active:scale-95 transition-transform" aria-label="Open profile">
            {post.streak ? (
              <div className="flex items-center justify-center" style={{ width: 52, height: 52, background: C.coral, borderRadius: 12 }}>
                <Sprite grid={SPR.flame} pal={{ r: "#FFF", o: "#F8D878", y: "#F8F0C0" }} px={3} />
              </div>
            ) : (
              <PixelBadge activity={post.activity} tier={post.tier} size={52} />
            )}
          </button>
          <button onClick={() => onOpenPerson(post.author)} className="flex-1 min-w-0 text-left active:scale-95 transition-transform">
            <PxTag color={C.gold}>Milestone</PxTag>
            <div className="text-sm font-bold text-white mt-1 leading-snug">{post.text} 🎉</div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{post.sub}</div>
          </button>
          <button
            onClick={() => { if (!hyped && !isYou) { setHyped(true); onHype(post); } }}
            className="shrink-0 flex flex-col items-center px-2.5 py-1.5 active:scale-90 transition-transform"
            style={{ background: hyped ? "#FFF" : "rgba(255,255,255,0.14)", borderRadius: 12 }}
          >
            <span className="text-sm leading-none">👏</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: hyped ? C.ink : "#FFF" }}>{post.hype + (hyped ? 1 : 0)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MemoryStory({ post, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 5200); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed inset-0 flex flex-col select-none" style={{ zIndex: 59, ...TYPE, background: C.night }} onClick={onClose} {...swipeDown(onClose)}>
      <div className="absolute inset-0"><PostPhoto post={post} /></div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(23,19,14,0.6), rgba(23,19,14,0.05) 30%, rgba(23,19,14,0.05) 65%, rgba(23,19,14,0.7))" }} />
      <div className="absolute left-4 right-4 rounded-full overflow-hidden" style={{ top: "calc(12px + env(safe-area-inset-top))", height: 3.5, background: "rgba(255,255,255,0.3)", zIndex: 3 }}>
        <div className="h-full rounded-full" style={{ background: "#FFF", animation: "storyFill 5s linear both" }} />
      </div>
      <div className="absolute left-4 flex items-center gap-2" style={{ top: "calc(26px + env(safe-area-inset-top))", zIndex: 3 }}>
        <Sparkles size={14} color="#FFF" />
        <span className="text-sm font-bold text-white" style={{ textShadow: "0 1px 3px rgba(23,19,14,0.6)" }}>One year ago</span>
        <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>· June 2025</span>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute right-3 p-2.5" style={{ top: "calc(20px + env(safe-area-inset-top))", zIndex: 3 }}><X size={20} color="#FFF" /></button>
      <div className="absolute inset-x-0 bottom-0 px-6 text-center" style={{ paddingBottom: "calc(44px + env(safe-area-inset-bottom))", zIndex: 3 }}>
        <div className="text-base font-bold text-white leading-snug" style={{ textShadow: "0 2px 6px rgba(23,19,14,0.7)" }}>{post.text}</div>
        <div className="text-xs font-semibold mt-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>{post.sub}</div>
      </div>
    </div>
  );
}

function MemoryCard({ post, onOpen }) {
  return (
    <div className="px-3 pt-3">
      <button onClick={() => onOpen(post)} className="w-full flex items-center gap-3 p-3 text-left active:scale-[0.98] transition-transform" style={px.flat}>
        <div className="relative overflow-hidden shrink-0" style={{ width: 50, height: 62, borderRadius: 10 }}><PostPhoto post={post} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5"><Sparkles size={11} color={C.teal} /><span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.faint }}>One year ago</span></div>
          <div className="text-sm mt-1 leading-snug" style={{ color: C.ink }}>{post.text}</div>
          <div className="text-xs mt-0.5" style={{ color: C.faint }}>{post.sub}</div>
        </div>
        <ChevronRight size={16} color={C.faint} />
      </button>
    </div>
  );
}

function EventFeedCard({ e, st, act }) {
  return (
    <div className="px-3 pt-3">
      <button onClick={act.openEvents} className="w-full text-left p-3 active:scale-[0.99] transition-transform" style={{ ...px.card, borderColor: C.teal }}>
        <div className="flex items-center gap-2">
          <CalendarDays size={15} color={C.teal} />
          <span className="text-sm font-semibold flex-1" style={{ color: C.ink }}>
            <b>{e.host === "you" ? "You're hosting" : "You're going"}</b> — {e.activity}
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full" style={{ background: C.teal }}>
            <ThumbsUp size={13} color="#FFF" fill="#FFF" />
            <span className="text-xs font-bold tabular-nums" style={{ color: "#FFF" }}>{e.going.length}</span>
          </span>
        </div>
        <div className="text-xs pt-1.5 pl-6" style={{ color: C.mute }}>{e.place} · <b style={{ color: C.teal }}>{fmtWhen(e.at)}</b></div>
      </button>
    </div>
  );
}

function FeedScreen({ st, act }) {
  const showedUp = useMemo(() => [...new Set(st.posts.filter((p) => !p.type && p.author !== "you").map((p) => p.author))].map((id) => st.people[id]).filter(Boolean), [st.posts, st.people]);
  const pairs = useMemo(() => Object.entries(st.pairs).filter(([id, n]) => n > 0 && st.people[id]).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ id, n, ...st.people[id] })), [st.pairs, st.people]);
  const topPair = pairs[0];
  return (
    <div className="pb-4">
      <div className="sticky top-0 relative flex items-center justify-center gap-2 h-12" style={{ borderBottom: BORDER, background: C.paper, zIndex: 10 }}>
        <img src={LOGO} alt="" style={{ width: 26, height: 26 }} />
        <span className="font-bold tracking-tight" style={{ ...TYPE, fontSize: 17, color: C.ink, letterSpacing: -0.4 }}>ShowUp</span>
        <button onClick={act.openNotifs} className="absolute right-1.5 p-2 active:scale-90 transition-transform" aria-label="Activity">
          <Bell size={19} color={C.ink} strokeWidth={2.3} />
          {st.notifDot && <span className="absolute rounded-full" style={{ top: 8, right: 9, width: 8, height: 8, background: C.coral, border: `1.5px solid ${C.paper}` }} />}
        </button>
      </div>
      {showedUp.length > 0 && !st.postedToday && (
        <button onClick={() => act.openComposer()} className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left active:opacity-90 transition-opacity" style={{ background: C.ink }}>
          <div className="flex shrink-0">
            {showedUp.slice(0, 4).map((p, i) => (
              <div key={p.id} style={{ marginLeft: i ? -8 : 0, zIndex: 4 - i }}><PxAvatar user={p} size={24} /></div>
            ))}
          </div>
          <span className="text-xs flex-1 leading-snug" style={{ color: C.paper }}>
            <b>{showedUp.length} friends have shown up today</b>
            <span className="block mt-0.5" style={{ opacity: 0.65 }}>
              {topPair ? `You + ${topPair.name} are on a ${topPair.n}-day run — keep it going together.` : "Join them — still time today."}
            </span>
          </span>
          <ChevronRight size={15} color={C.paper} style={{ opacity: 0.7 }} />
        </button>
      )}
      {pairs.length > 0 && (
        <div className="hscroll flex gap-2 overflow-x-auto no-scrollbar px-3 py-2" style={{ borderBottom: BORDER }}>
          {pairs.map((p) => (
            <button key={p.id} onClick={() => act.openPerson(p.id)} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 shrink-0 active:scale-95 transition-transform" style={px.chip}>
              <div className="flex"><div style={{ zIndex: 1 }}><PxAvatar user={st.me} size={20} /></div><div style={{ marginLeft: -7 }}><PxAvatar user={p} size={20} /></div></div>
              <span className="text-xs font-bold whitespace-nowrap" style={{ color: C.ink }}>You+{p.name}</span>
              <span className="flex items-center text-xs font-bold tabular-nums" style={{ color: C.coral }}>🔥{p.n}</span>
            </button>
          ))}
        </div>
      )}
      {(() => { const up = st.events.filter((e) => e.at > Date.now() && e.going.some((g) => g === "you")).sort((a, b) => a.at - b.at); return up.length ? <EventFeedCard e={up[0]} st={st} act={act} /> : null; })()}
      {st.posts.map((post) => {
        if (post.type === "memory") return <MemoryCard key={post.id} post={post} onOpen={act.openMemory} />;
        const isYou = post.author === "you";
        const person = isYou ? st.me : st.people[post.author];
        if (!person) return null;
        if (post.type === "milestone") return <MilestoneCard key={post.id} post={post} isYou={isYou} onOpenPerson={act.openPerson} onHype={act.hype} />;
        return <PostCard key={post.id} post={post} person={person} isYou={isYou} people={st.people} comments={st.comments} onLike={act.like} onReact={act.react} onComment={act.openComments} onOpenPerson={act.openPerson} onMenu={act.postMenu} />;
      })}
      <div className="text-center text-xs py-6" style={{ color: C.faint }}>You're all caught up</div>
    </div>
  );
}

/* ── COMPOSER: activity → camera → caption/tags ── */
function ComposerSheet({ st, core, onPost, onClose }) {
  const [step, setStep] = useState("pick");
  const [q, setQ] = useState("");
  const [activity, setActivity] = useState(null);
  const [photo, setPhoto] = useState(undefined); // undefined = not chosen; null = pixel scene
  const [caption, setCaption] = useState("");
  const [withIds, setWithIds] = useState([]);
  const [gErr, setGErr] = useState(null);
  const results = useMemo(() => {
    const all = Object.keys(CATALOG).sort((a, b) => a.localeCompare(b));
    const t = q.trim().toLowerCase();
    return t ? all.filter((a) => a.toLowerCase().includes(t)) : all;
  }, [q]);
  const nextTier = activity ? TIER_DAYS.findIndex((t) => t > (st.progress[activity] || 0)) : -1;
  const toGo = nextTier >= 0 ? TIER_DAYS[nextTier] - (st.progress[activity] || 0) - 1 : -1;

  if (step === "camera") return <CameraSheet onCapture={(p) => { setPhoto(p); setStep("finish"); }} onClose={() => setStep("pick")} />;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", ...TYPE, background: C.paper }} {...swipeBack(step === "pick" ? onClose : () => setStep("pick"))}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ borderBottom: BORDER }}>
        <button onClick={step === "pick" ? onClose : () => setStep("pick")} className="p-2">{step === "pick" ? <X size={20} color={C.ink} /> : <ChevronLeft size={20} color={C.ink} />}</button>
        <div className="flex-1 text-center text-sm font-bold uppercase tracking-widest" style={{ color: C.ink }}>{step === "pick" ? "Show up" : "Almost there"}</div>
        <span style={{ width: 36 }} />
      </div>

      {step === "pick" && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6">
          <div className="pt-3 sticky top-0 pb-2" style={{ background: C.paper }}>
            <PxInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search 100+ activities…" right={<Search size={15} color={C.faint} />} />
          </div>
          <div className="text-xs pt-3 pb-1.5" style={{ color: C.faint }}>{results.length} activities · Every one counts the same</div>
          <div className="grid grid-cols-2 gap-2">
            {results.map((a) => (
              <button key={a} onClick={() => { setActivity(a); setStep("camera"); }} className="flex items-center gap-2 px-2.5 py-2 text-left active:scale-95 transition-transform" style={px.flat}>
                <div className="shrink-0 flex items-center justify-center" style={{ width: 28, height: 28, background: ACT_COLOR(a), borderRadius: 9 }}>
                  <Sprite grid={SPR[SPRITE_OF(a)]} pal={{ k: "#FFF", w: "#FFF", g: "#FFF", G: "#DFF", r: "#FFF", o: "#FFE", y: "#FFF", Y: "#FFE", b: "#FFF", p: "#FFF", t: "#FFF", T: "#FFE" }} px={1.6} />
                </div>
                <span className="text-xs font-bold leading-tight" style={{ color: C.ink }}>{a}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "finish" && (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-6 flex flex-col">
          <div className="flex items-center gap-2 pt-3">
            <PxTag color={ACT_COLOR(activity)} ink="#FFF">{activity}</PxTag>
            {toGo >= 0 && toGo <= 10 && <PxTag color={C.gold}>{toGo === 0 ? `Unlocks ${CATALOG[activity][nextTier]} today!` : `${CATALOG[activity][nextTier]} in ${toGo + 1}`}</PxTag>}
          </div>
          <div className="relative mt-3 overflow-hidden" style={{ aspectRatio: "4/5", border: BORDER, borderRadius: 6, boxShadow: SHADOW(3) }}>
            <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <button onClick={() => setStep("camera")} className="absolute bottom-2 right-2 px-2.5 py-1.5 text-xs font-bold uppercase" style={{ ...TYPE, background: C.paper, border: BORDER, borderRadius: 5 }}>Retake</button>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest pt-4 pb-1.5" style={{ color: C.faint }}>With anyone?</div>
          <div className="hscroll flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {st.friends.map((f) => {
              const on = withIds.includes(f.id);
              return (
                <button key={f.id} onClick={() => setWithIds((w) => (on ? w.filter((x) => x !== f.id) : [...w, f.id]))} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 shrink-0 active:scale-95 transition-transform" style={{ ...px.chip, background: on ? C.teal : C.field }}>
                  <PxAvatar user={f} size={20} />
                  <span className="text-xs font-bold" style={{ color: on ? "#FFF" : C.ink }}>{f.name}</span>
                </button>
              );
            })}
          </div>
          <div className="pt-3">
            <PxInput value={caption} onChange={(e) => { setCaption(e.target.value); setGErr(null); }} placeholder="Add a caption…" maxLength={80} />
            {gErr && <div className="mt-2 p-2.5 text-xs font-bold" style={{ ...px.flat, borderColor: C.coral, color: C.coral }}>{gErr}</div>}
          </div>
          <div className="flex-1" />
          <div className="text-xs text-center pb-2.5" style={{ color: C.faint }}>
            This adds to your June{withIds.length ? ` — with ${withIds.map((id) => st.people[id]?.name).filter(Boolean).join(", ")}` : ""}.
          </div>
          <PxButton full onClick={() => {
            const g = core.guardian.check(caption, "caption");
            if (g.verdict === "block" || g.verdict === "locked") { setGErr(g.message); return; }
            onPost({ activity, photo, caption: V.clean(caption).slice(0, 80), withIds });
          }}>Post it</PxButton>
        </div>
      )}
    </div>
  );
}

/* ── FEATURED — the community wall ── */
function FeaturedScreen({ st, act }) {
  const nominated = st.nominatedId ? st.posts.find((p) => p.id === st.nominatedId) : null;
  return (
    <div className="pb-6">
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(115deg, #F2B93B, #E8563F 58%, #7C5CD9)" }}>
        <div className="absolute -right-3 -top-4 opacity-25" style={{ transform: "rotate(14deg)" }}><Sprite grid={SPR.trophy} pal={{ y: "#FFF3C4" }} px={7} /></div>
        <div className="relative flex items-end justify-between px-4 pt-6 pb-4">
          <div>
            <div className="font-bold text-white tracking-tight leading-none" style={{ fontSize: 28, textShadow: "0 2px 5px rgba(23,19,14,0.35)" }}>Featured</div>
            <div className="text-xs font-semibold mt-1.5" style={{ color: "rgba(255,255,255,0.94)", textShadow: "0 1px 3px rgba(23,19,14,0.3)" }}>The best of the week, from everyone. New winners Sunday.</div>
          </div>
          <span className="shrink-0 text-xs font-bold text-white px-2.5 py-1 rounded-full" style={{ background: "rgba(23,19,14,0.38)" }}>{FEATURED_WEEK.label}</span>
        </div>
      </div>

      {/* your one nomination per week */}
      <div className="px-4 pt-3">
        {nominated ? (
          <div className="flex items-center gap-3 p-3.5" style={px.flat}>
            <div className="relative overflow-hidden shrink-0 rounded-xl" style={{ width: 44, height: 55 }}><PostPhoto post={nominated} /></div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: C.ink }}>Your post is in for <b>{st.nominatedCat}</b> ✓</div>
              <div className="text-xs mt-0.5" style={{ color: C.faint }}>Winners are picked Sunday. One entry a week — resets Monday.</div>
            </div>
          </div>
        ) : (
          <button onClick={act.openNominate} className="w-full relative overflow-hidden text-left active:scale-95 transition-transform" style={{ ...px.card, background: `linear-gradient(135deg, ${C.teal}, ${C.tealDark})` }}>
            <div className="flex items-center gap-3 px-3.5 py-3.5">
              <div className="rounded-full flex items-center justify-center shrink-0" style={{ width: 40, height: 40, background: "rgba(255,255,255,0.2)" }}><Star size={18} color="#FFF" fill="#FFF" /></div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">Enter this week's Featured</div>
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>Submit one of your posts to a category of your choice.</div>
              </div>
              <ChevronRight size={16} color="rgba(255,255,255,0.9)" />
            </div>
          </button>
        )}
      </div>

      {/* this week's winners */}
      {FEATURED_WEEK.categories.map((cat) => {
        const post = cat.post || st.posts.find((p) => p.id === cat.postId);
        if (!post) return null;
        const isCommunity = !!post.community;
        const person = isCommunity ? post.author : st.people[post.author];
        const open = isCommunity ? undefined : () => act.openPerson(post.author);
        return (
          <div key={cat.id} className="px-4 pt-4">
            <div className="relative overflow-hidden" style={px.card}>
              <div className="flex items-center justify-between px-3.5 pt-2 pb-1.5">
                <span className="text-sm font-bold" style={{ color: C.ink }}>{cat.emoji} {cat.title}</span>
                <PixelBadge featuredCat={cat.title} tier={5} size={38} />
              </div>
              <button onClick={open} className="relative block w-full overflow-hidden active:opacity-90 transition-opacity" style={{ aspectRatio: "4 / 3" }}>
                <PostPhoto post={post} />
                <div className="absolute inset-x-0 bottom-0 px-3 py-2" style={{ background: "linear-gradient(transparent, rgba(23,19,14,0.65))" }}>
                  <div className="text-xs font-semibold text-white">"{post.caption}"</div>
                </div>
              </button>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                <button onClick={open} className="flex items-center gap-2 flex-1 min-w-0 text-left active:scale-95 transition-transform">
                  <PxAvatar user={person} size={28} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5"><span className="text-sm font-semibold truncate" style={{ color: C.ink }}>{person?.name}</span>{isCommunity && <PxTag color="#E2EDF8" ink="#3E7BC4">Community</PxTag>}</div>
                    <div className="text-xs" style={{ color: C.faint }}>{cat.blurb}</div>
                  </div>
                </button>
                <span className="text-xs font-semibold" style={{ color: C.mute }}>❤️ {post.likes}</span>
              </div>
            </div>
          </div>
        );
      })}
<div className="pt-2" />
    </div>
  );
}

function NominateSheet({ st, initialPost, onPick, onClose }) {
  const mine = st.posts.filter((p) => !p.type && p.author === "you");
  const [picked, setPicked] = useState(initialPost || null);
  return (
    <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: 58, ...TYPE }}>
      <div className="absolute inset-0" style={{ background: "rgba(23,19,14,0.5)", animation: "fadeIn 0.2s ease both" }} onClick={onClose} />
      <div className="relative flex flex-col" style={{ background: C.paper, borderRadius: "22px 22px 0 0", maxHeight: "80%", animation: "sheetUp 0.28s ease both" }} {...swipeDown(onClose)}>
        <div className="pt-3 pb-2 text-center shrink-0">
          <div className="mx-auto rounded-full mb-3" style={{ width: 40, height: 4.5, background: C.line }} />
          <div className="text-base font-bold" style={{ color: C.ink }}>{picked ? "Pick a category" : "Enter one of your posts"}</div>
          <div className="text-xs mt-0.5" style={{ color: C.mute }}>{picked ? "Where does this one belong? Your call." : "One entry a week — the team picks winners Sunday."}</div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-4" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))" }}>
          {!picked && mine.length === 0 && (
            <div className="text-sm text-center py-8 px-6 leading-relaxed" style={{ color: C.faint }}>Nothing to enter yet — post today, then submit it here.</div>
          )}
          {!picked && mine.map((p) => (
            <button key={p.id} onClick={() => setPicked(p)} className="w-full flex items-center gap-3 py-2.5 text-left active:scale-95 transition-transform" style={{ borderBottom: `1px solid ${C.line}` }}>
              <div className="relative overflow-hidden shrink-0 rounded-xl" style={{ width: 46, height: 58 }}><PostPhoto post={p} /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: C.ink }}>{p.activity} · {p.time}</div>
                <div className="text-xs truncate mt-0.5" style={{ color: C.mute }}>"{p.caption || "no caption"}"</div>
              </div>
              <ChevronRight size={15} color={C.faint} />
            </button>
          ))}
          {picked && (
            <div className="flex flex-col gap-2 pt-1">
              {NOMINATE_CATS.map((cat) => (
                <button key={cat} onClick={() => onPick(picked, cat)} className="w-full flex items-center justify-between px-3.5 py-3 text-left active:scale-95 transition-transform" style={px.flat}>
                  <span className="text-sm font-semibold" style={{ color: C.ink }}>{cat}</span>
                  <Star size={15} color={C.gold} />
                </button>
              ))}
              <button onClick={() => setPicked(null)} className="text-xs font-semibold text-center pt-2" style={{ color: C.mute }}>← Choose a different post</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── SHOP ── */
function ShopSheet({ st, act, onClose }) {
  const [tab, setTab] = useState("banners");
  const items = tab === "coins" ? COIN_PACKS : SHOP[tab];
  return (
    <div className="fixed inset-0 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", zIndex: 46, ...TYPE, background: C.paper, animation: "sheetUp 0.28s ease both" }} {...swipeBack(onClose)}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ borderBottom: BORDER }}>
        <button onClick={onClose} className="p-2 active:scale-90 transition-transform"><ChevronLeft size={20} color={C.ink} /></button>
        <div className="flex-1 text-center text-sm font-bold" style={{ color: C.ink }}>Style shop</div>
        <div className="flex items-center gap-1 pr-2 pl-2.5 py-1 rounded-full shrink-0" style={{ background: C.field }}>
          <Sprite grid={SPR.coin} pal={{ y: "#C8901A", Y: C.gold, k: C.ink }} px={1.2} />
          <span className="text-xs font-bold tabular-nums" style={{ color: C.ink }}>{st.wallet}</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
      <div className="px-4 pt-4 pb-3">
        <div className="font-bold tracking-tight" style={{ fontSize: 22, color: C.ink }}>The Shop</div>
        <div className="text-xs mt-0.5" style={{ color: C.mute }}>Earn coins by showing up, then spend them on banner art and tiny companions.</div>
      </div>
      <div className="flex gap-2 px-4 pb-3">
        {[["banners", "Banners"], ["companions", "Companions"], ["coins", "Coins"]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wide active:scale-95 transition-transform" style={{ ...px.chip, background: tab === t ? C.ink : C.field, color: tab === t ? C.paper : C.ink }}>{label}</button>
        ))}
      </div>
      {tab === "coins" && (
        <div className="flex flex-col gap-3 px-4">
          {COIN_PACKS.map((pk) => (
            <div key={pk.id} className="flex items-center gap-3 px-3.5 py-3" style={px.card}>
              <Sprite grid={SPR.coin} pal={{ y: "#C8901A", Y: C.gold, k: C.ink }} px={2.6} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><span className="text-sm font-bold" style={{ color: C.ink }}>{pk.name}</span>{pk.tag && <PxTag color="#FAF0D2" ink="#B8860B">{pk.tag}</PxTag>}</div>
                <div className="text-xs mt-0.5" style={{ color: C.mute }}>{pk.coins.toLocaleString()} coins</div>
              </div>
              <PxButton small kind="gold" onClick={() => act.buy("coins", pk)}>${pk.usd.toFixed(2)}</PxButton>
            </div>
          ))}

        </div>
      )}
      {tab !== "coins" && <div className="flex flex-col gap-3 px-4">
        {items.map((it) => {
          const owned = st.inventory.includes(it.id);
          const equipped = tab === "banners" ? st.me.banner === it.id : st.me.companion === it.id;
          const r = RARITY[it.rarity];
          return (
            <div key={it.id} className="relative overflow-hidden" style={px.card}>
              {tab === "banners" ? (
                <div style={{ borderBottom: BORDER }}><BannerScene id={it.id} h={92} /></div>
              ) : (
                <div className="relative flex items-end justify-center pt-3 pb-2 overflow-hidden" style={{ borderBottom: BORDER }}>
                  <div className="absolute inset-0"><BannerScene id={st.me.banner || "field-day"} h={70} /></div>
                  <div className="relative" style={{ animation: "bob 2.4s ease-in-out infinite", filter: "drop-shadow(0 2px 3px rgba(23,19,14,0.5))" }}><Companion id={it.id} px={3.4} /></div>
                </div>
              )}
              <div className="flex items-center gap-2.5 px-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: C.ink }}>{it.name}</span>
                    <PxTag color={r.chip} ink={r.color} style={{ borderColor: r.color }}>{r.name}</PxTag>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: C.mute }}>{it.desc}</div>
                </div>
                {equipped ? (
                  <PxTag color={C.teal} ink="#FFF">Equipped</PxTag>
                ) : owned ? (
                  <PxButton small kind="ghost" onClick={() => act.equip(tab, it.id)}>Equip</PxButton>
                ) : (
                  <PxButton small kind="gold" onClick={() => act.buy(tab, it)}>
                    <span className="inline-flex items-center gap-1.5"><Sprite grid={SPR.coin} pal={{ y: "#8A6A0B", Y: "#F8E0A0", k: "#5A4608" }} px={1.1} /> {it.price}</span>
                  </PxButton>
                )}
              </div>
            </div>
          );
        })}
      </div>}

      </div>
    </div>
  );
}

/* ── FRIENDS ── */
function FriendsScreen({ st, act }) {
  const sorted = useMemo(() => [...st.friends].sort((a, b) => (st.pairs[b.id] || 0) - (st.pairs[a.id] || 0) || b.days - a.days), [st.friends, st.pairs]);
  return (
    <div className="pb-6">
      <div className="px-4 pt-5 pb-3">
        <div className="font-bold tracking-tight" style={{ fontSize: 22, color: C.ink }}>Friends</div>
        <div className="text-xs mt-0.5" style={{ color: C.mute }}>{st.friends.length} people show up with you.</div>
      </div>
      <div className="px-4 pb-3">
        <button onClick={act.openEvents} className="w-full relative overflow-hidden text-left active:scale-[0.98] transition-transform" style={{ borderRadius: 16, background: `linear-gradient(120deg, ${C.teal}, #2A5A96)`, boxShadow: "0 6px 16px -8px rgba(30,158,134,0.55)" }}>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <CalendarDays size={20} color="#FFF" />
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Events near Boise</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.88)" }}>
                {(() => { const up = st.events.filter((e) => e.at > Date.now()); return up.length ? `${up.length} happening — anyone nearby can post` : "Post something — anyone nearby can join"; })()}
              </div>
            </div>
            <ChevronRight size={16} color="rgba(255,255,255,0.9)" />
          </div>
        </button>
      </div>
      {st.requests.length > 0 && (
        <div className="px-4 pb-2">
          <div className="text-xs font-bold uppercase tracking-widest pb-1.5" style={{ color: C.faint }}>Requests</div>
          {st.requests.map((r) => (
            <div key={r.id} className="flex items-center gap-2.5 py-2">
              <PxAvatar user={r} size={38} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: C.ink }}>{r.name}</div>
                <div className="text-xs" style={{ color: C.faint }}>{r.mutual} mutual friends</div>
              </div>
              <PxButton small onClick={() => act.accept(r)}>Accept</PxButton>
              <PxButton small kind="ghost" onClick={() => act.decline(r)}>Not now</PxButton>
            </div>
          ))}
        </div>
      )}
      <div className="px-4 py-2">
        <button onClick={act.invite} className="w-full relative overflow-hidden text-left active:scale-95 transition-transform" style={{ ...px.card, background: C.teal }}>
          <Dither opacity={0.12} />
          <div className="relative flex items-center gap-2.5 px-3 py-3">
            <UserPlus size={18} color="#FFF" />
            <div className="flex-1">
              <div className="text-sm font-bold text-white">Invite a friend</div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.85)" }}>Code {st.me.username?.slice(0, 3).toUpperCase() || "SHW"}-4QK7 · We'll text them the link</div>
            </div>
            <Share2 size={15} color="#FFF" />
          </div>
        </button>
      </div>
      <div className="px-4 pt-2 pb-1 text-xs font-bold uppercase tracking-widest" style={{ color: C.faint }}>People you might know</div>
      <div className="px-4">
        {st.suggested.map((s) => {
          const sent = st.sent.includes(s.id);
          return (
            <div key={s.id} className="flex items-center gap-2.5 py-2">
              <PxAvatar user={s} size={38} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: C.ink }}>{s.name}</div>
                <div className="text-xs" style={{ color: C.faint }}>{s.mutual} mutual friends</div>
              </div>
              <PxButton small kind={sent ? "ghost" : "primary"} disabled={sent} onClick={() => act.addFriend(s)}>{sent ? "Sent ✓" : "Add"}</PxButton>
            </div>
          );
        })}
      </div>
      <div className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-widest" style={{ color: C.faint }}>Your friends</div>
      {sorted.map((f) => {
        const pair = st.pairs[f.id] || 0;
        return (
          <button key={f.id} onClick={() => act.openPerson(f.id)} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left active:scale-95 transition-transform" style={{ borderBottom: `1.5px solid rgba(32,24,15,0.15)` }}>
            <PxAvatar user={f} size={40} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold" style={{ color: C.ink }}>{f.name}</div>
              <div className="text-xs" style={{ color: C.faint }}>{pair > 0 ? `🔥 ${pair}-day run with you` : `${f.days} days this week · 👏 ${f.cheers}`}</div>
            </div>
            <ChevronRight size={14} color={C.faint} />
          </button>
        );
      })}
    </div>
  );
}

/* ── PROFILE + friend profile ── */
function BannerBlock({ user, pinBadges = [], editable, onEdit, tall }) {
  return (
    <div className="mx-4 relative overflow-hidden" style={px.card}>
      <BannerScene id={user.banner || "field-day"} h={tall ? 150 : 132} />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(32,24,15,0.45))" }} />
      {pinBadges.length > 0 && (
        <div className="absolute top-2.5 left-2.5 flex gap-1.5">
          {pinBadges.slice(0, 3).map((b) => (
            <div key={b.id} style={{ filter: "drop-shadow(0 2px 4px rgba(23,19,14,0.45))" }}>
              <PixelBadge activity={b.activity} tier={b.tier} size={34} featuredCat={b.kind === "featured" ? b.cat : undefined} />
            </div>
          ))}
        </div>
      )}
      {user.companion && (
        <div className="absolute" style={{ right: 12, bottom: 34, animation: "bob 2.4s ease-in-out infinite", filter: "drop-shadow(0 2px 3px rgba(23,19,14,0.5))" }}>
          <Companion id={user.companion} px={2.6} />
        </div>
      )}
      <div className="absolute left-3 bottom-3 flex items-end gap-2.5">
        <PxAvatar user={user} size={56} />
        <div className="pb-0.5">
          <div className="text-base font-bold text-white leading-tight" style={{ textShadow: "0 1px 3px rgba(32,24,15,0.7)" }}>{user.name}</div>
          <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 3px rgba(32,24,15,0.7)" }}>@{user.username} · since {user.since}</div>
        </div>
      </div>
      {editable && (
        <button onClick={onEdit} className="absolute top-2.5 right-2.5 px-2.5 py-1.5 text-xs font-semibold rounded-full active:scale-95 transition-transform" style={{ ...TYPE, background: "rgba(255,255,255,0.92)", color: C.ink, boxShadow: "0 3px 10px rgba(23,19,14,0.25)" }}>
          <span className="inline-flex items-center gap-1"><Wand2 size={11} /> Edit banner</span>
        </button>
      )}
    </div>
  );
}

/* ── BANNER EDITOR — style it from your inventory; shop is for getting more ── */
function BannerEditor({ st, act, onClose }) {
  const ownedBanners = SHOP.banners.filter((b) => st.inventory.includes(b.id));
  const ownedComps = SHOP.companions.filter((c) => st.inventory.includes(c.id));
  const pinnable = [...st.myFeatured, ...groupTrophies(st.badges)];
  const pins = st.me.pins || [];
  return (
    <div className="fixed inset-0 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", zIndex: 47, ...TYPE, background: C.paper, animation: "sheetUp 0.28s ease both" }} {...swipeBack(onClose)}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ borderBottom: BORDER }}>
        <button onClick={onClose} className="p-2 active:scale-90 transition-transform"><ChevronLeft size={20} color={C.ink} /></button>
        <div className="flex-1 text-center text-sm font-bold" style={{ color: C.ink }}>Edit banner</div>
        <span style={{ width: 36 }} />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10 pt-4">
        <BannerBlock user={st.me} pinBadges={st.pinBadges} />
        <div className="px-4 pt-5 pb-2 text-sm font-bold" style={{ color: C.ink }}>Background</div>
        <div className="px-4 grid grid-cols-2 gap-2.5">
          {ownedBanners.map((b) => {
            const on = st.me.banner === b.id;
            return (
              <button key={b.id} onClick={() => act.setBanner(b.id)} className="relative overflow-hidden text-left active:scale-95 transition-transform" style={{ borderRadius: 14, border: `2px solid ${on ? C.teal : C.line}` }}>
                <BannerScene id={b.id} h={62} />
                <div className="px-2 py-1.5 text-xs font-semibold" style={{ color: C.ink, background: C.card }}>{b.name}</div>
                {on && <span className="absolute top-1.5 right-1.5 rounded-full flex items-center justify-center" style={{ width: 20, height: 20, background: C.teal }}><Check size={12} color="#FFF" /></span>}
              </button>
            );
          })}
        </div>
        <div className="px-4 pt-5 pb-2 flex items-baseline justify-between"><span className="text-sm font-bold" style={{ color: C.ink }}>Companion</span><span className="text-xs" style={{ color: C.faint }}>A tiny friend who lives on your banner</span></div>
        <div className="px-4 flex gap-2 flex-wrap">
          <button onClick={() => act.setCompanion(null)} className="flex items-center justify-center rounded-2xl active:scale-95 transition-transform" style={{ width: 62, height: 62, background: C.field, border: `2px solid ${!st.me.companion ? C.teal : "transparent"}` }}>
            <span className="text-xs font-semibold" style={{ color: C.mute }}>None</span>
          </button>
          {ownedComps.map((c) => {
            const on = st.me.companion === c.id;
            return (
              <button key={c.id} onClick={() => act.setCompanion(c.id)} className="flex items-center justify-center rounded-2xl active:scale-95 transition-transform" style={{ width: 62, height: 62, background: C.field, border: `2px solid ${on ? C.teal : "transparent"}` }}>
                <Companion id={c.id} px={3} />
              </button>
            );
          })}
        </div>
        <div className="px-4 pt-5 pb-2 flex items-baseline justify-between"><span className="text-sm font-bold" style={{ color: C.ink }}>Pinned badges</span><span className="text-xs" style={{ color: C.faint }}>{pins.length}/3 on display</span></div>
        <div className="px-4 grid grid-cols-4 gap-x-2 gap-y-3 justify-items-center">
          {pinnable.map((b) => {
            const on = pins.includes(b.id);
            return (
              <button key={b.id} onClick={() => act.togglePin(b.id)} className="relative active:scale-90 transition-transform" style={{ opacity: on || pins.length < 3 ? 1 : 0.4 }}>
                <PixelBadge activity={b.activity} tier={b.tier} size={52} featuredCat={b.kind === "featured" ? b.cat : undefined} />
                {on && <span className="absolute -top-1 -right-1 rounded-full flex items-center justify-center" style={{ width: 18, height: 18, background: C.teal, border: `2px solid ${C.paper}` }}><Check size={10} color="#FFF" /></span>}
              </button>
            );
          })}
        </div>
        {pinnable.length === 0 && <div className="text-xs text-center px-8 py-3" style={{ color: C.faint }}>Earn badges and they'll be pinnable here.</div>}
        <div className="px-4 pt-6">
          <PxButton full kind="ghost" onClick={() => { onClose(); act.openShop(); }}><span className="inline-flex items-center gap-2"><ShoppingBag size={14} /> Get more in the Style shop →</span></PxButton>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ st, act }) {
  const trophies = [...st.myFeatured, ...groupTrophies(st.badges)];
  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div className="font-bold tracking-tight" style={{ fontSize: 22, color: C.ink }}>Profile</div>
        <PxButton small kind="ghost" onClick={act.openSettings} ariaLabel="Settings"><Settings size={15} /></PxButton>
      </div>
      <BannerBlock user={st.me} pinBadges={st.pinBadges} editable onEdit={act.openBannerEdit} />
      <div className="px-4 pt-3 grid grid-cols-3 gap-2">
        <button onClick={act.openHistory} className="text-center py-2.5 active:scale-95 transition-transform" style={{ ...px.flat, borderColor: C.teal }}>
          <div className="text-base font-bold tabular-nums" style={{ color: C.ink }}>{st.me.weeks}</div>
          <div className="text-xs mt-0.5 font-semibold" style={{ color: C.teal }}>Weeks here ›</div>
        </button>
        {[{ v: st.me.daysWeek, l: "Days this week" }, { v: st.badges.length, l: "Badges earned" }].map((s) => (
          <div key={s.l} className="text-center py-2.5" style={px.flat}>
            <div className="text-base font-bold tabular-nums" style={{ color: C.ink }}>{s.v}</div>
            <div className="text-xs mt-0.5" style={{ color: C.faint }}>{s.l}</div>
          </div>
        ))}
      </div>
      <div className="px-4 pt-3 flex flex-col gap-2">
        <button onClick={act.openWrapped} className="w-full flex items-center gap-2.5 px-3 py-3 text-left active:scale-95 transition-transform" style={{ ...px.flat, background: "linear-gradient(135deg, #FFF6E4, #FFFFFF)" }}>
          <Sparkles size={15} color={C.gold} />
          <span className="text-sm font-bold flex-1" style={{ color: C.ink }}>June, wrapped</span>
          <span className="text-xs" style={{ color: C.faint }}>Your month, on your banner</span>
          <ChevronRight size={14} color={C.faint} />
        </button>
        <button onClick={act.openProgress} className="w-full flex items-center gap-2.5 px-3 py-3 text-left active:scale-95 transition-transform" style={px.flat}>
          <TrendingUp size={15} color={C.teal} />
          <span className="text-sm font-bold flex-1" style={{ color: C.ink }}>Progress & journeys</span>
          <ChevronRight size={14} color={C.faint} />
        </button>
        <button onClick={act.openShop} className="w-full flex items-center gap-2.5 px-3 py-3 text-left active:scale-95 transition-transform" style={px.flat}>
          <ShoppingBag size={15} color={C.violet} />
          <span className="text-sm font-bold flex-1" style={{ color: C.ink }}>Style shop</span>
          <span className="text-xs" style={{ color: C.faint }}>Banners & companions</span>
          <ChevronRight size={14} color={C.faint} />
        </button>
      </div>
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <span className="text-sm font-bold" style={{ color: C.ink }}>Trophy Case</span>
        <span className="text-xs" style={{ color: C.faint }}>Highest tier per sport</span>
      </div>
      <div className="px-4 grid grid-cols-4 gap-x-2 gap-y-3 justify-items-center">
        {trophies.map((b) => (
          <button key={b.id} onClick={() => act.spotlight(b)} className="flex flex-col items-center gap-1 active:scale-90 transition-transform">
            <PixelBadge activity={b.activity} tier={b.tier} size={58} featuredCat={b.kind === "featured" ? b.cat : undefined} />
            <span className="text-xs font-bold text-center leading-tight" style={{ color: C.mute, fontSize: 9, maxWidth: 70 }}>{b.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FriendSheet({ person, pairs, onClose }) {
  const fp = { name: person.name, username: person.name.toLowerCase(), since: person.since || "recently", banner: person.bannerArt || "field-day", companion: person.companion || null, avatarSeed: person.avatarSeed, shirt: person.shirt, photo: person.photo };
  const theirBadges = useMemo(() => groupTrophies(badgesFor(person.progress || { Running: 34, Soccer: 8 })).slice(0, 8), [person]);
  const pair = pairs[person.id] || 0;
  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", ...TYPE, background: C.paper, animation: "sheetUp 0.28s ease both" }} {...swipeBack(onClose)}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ borderBottom: BORDER }}>
        <button onClick={onClose} className="p-2"><ChevronLeft size={20} color={C.ink} /></button>
        <div className="flex-1 text-center text-sm font-bold uppercase tracking-widest" style={{ color: C.ink }}>{person.name}</div>
        <span style={{ width: 36 }} />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8 pt-4">
        <BannerBlock user={fp} />
        {pair > 0 && (
          <div className="mx-4 mt-3 flex items-center gap-2.5 px-3 py-2.5" style={px.flat}>
            <span className="text-base">🔥</span>
            <div className="flex-1 text-sm" style={{ color: C.ink }}><b>Pair run — you & {person.name}</b><div className="text-xs" style={{ color: C.faint }}>Days you've both shown up</div></div>
            <span className="text-lg font-bold tabular-nums" style={{ color: C.ink }}>{pair}</span>
          </div>
        )}
        <div className="px-4 pt-3 grid grid-cols-2 gap-2">
          {[{ v: person.days, l: "Days this week" }, { v: person.cheers, l: "Cheers this week" }].map((s) => (
            <div key={s.l} className="text-center py-2.5" style={px.flat}>
              <div className="text-base font-bold tabular-nums" style={{ color: C.ink }}>{s.v ?? 0}</div>
              <div className="text-xs mt-0.5" style={{ color: C.faint }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div className="px-4 pt-5 pb-2 text-sm font-bold" style={{ color: C.ink }}>Trophy Case</div>
        <div className="px-4 grid grid-cols-4 gap-x-2 gap-y-3 justify-items-center">
          {theirBadges.map((b) => (
            <div key={b.id} className="flex flex-col items-center gap-1">
              <PixelBadge activity={b.activity} tier={b.tier} size={54} />
              <span className="text-center leading-tight font-bold" style={{ color: C.mute, fontSize: 9, maxWidth: 66 }}>{b.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* mention rendering: @names glow and open profiles */
function MentionText({ text, people, onOpen }) {
  const parts = String(text).split(/(@[a-z0-9_]+)/gi);
  return (
    <>
      {parts.map((p, i) => {
        if (/^@[a-z0-9_]+$/i.test(p)) {
          const id = p.slice(1).toLowerCase();
          const known = people && people[id];
          return (
            <b key={i} style={{ color: C.teal }} onClick={known && onOpen ? (e) => { e.stopPropagation(); onOpen(id); } : undefined}>
              {p}
            </b>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

/* ── COMMENTS — mentions, quiet Guardian, kind by default ── */
function CommentsSheet({ postId, st, core, onAdd, onClose, onOpenPerson, onLikeComment }) {
  const [text, setText] = useState("");
  const [g, setG] = useState(null);
  const inputRef = useRef(null);
  const list = st.comments[postId] || [];
  const mq = text.match(/@([a-z0-9_]*)$/i);
  const suggestions = mq ? st.friends.filter((f) => f.name.toLowerCase().startsWith(mq[1].toLowerCase())).slice(0, 4) : [];
  const insertMention = (f) => {
    setText((t) => t.replace(/@[a-z0-9_]*$/i, `@${f.name.toLowerCase()} `));
    inputRef.current?.focus();
  };
  const tapAt = () => {
    setText((t) => (t.length === 0 || t.endsWith(" ") ? t + "@" : t + " @"));
    inputRef.current?.focus();
  };
  const send = (t) => {
    const verdict = core.guardian.check(t, "comment");
    if (verdict.verdict === "block" || verdict.verdict === "locked") { setG(verdict); return; }
    if (verdict.verdict === "nudge") { setG(verdict); return; }
    onAdd(postId, V.clean(t).slice(0, 120));
    setText(""); setG(null);
  };
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" style={TYPE}>
      <div className="absolute inset-0" style={{ background: "rgba(32,24,15,0.5)" }} onClick={onClose} />
      <div className="relative flex flex-col" style={{ background: C.paper, borderTop: BORDER, maxHeight: "72%", animation: "sheetUp 0.25s ease both" }} {...swipeDown(onClose)}>
        <div className="flex items-center h-11 px-2 shrink-0" style={{ borderBottom: BORDER }}>
          <span style={{ width: 36 }} />
          <div className="flex-1 text-center text-xs font-bold uppercase tracking-widest" style={{ color: C.ink }}>Comments</div>
          <button onClick={onClose} className="p-2"><X size={18} color={C.ink} /></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-3">
          {list.length === 0 && <div className="text-xs text-center py-6" style={{ color: C.faint }}>No comments yet.</div>}
          {list.map((c) => {
            const p = c.author === "you" ? st.me : st.people[c.author];
            return (
              <div key={c.id} className="flex items-start gap-2.5 py-2">
                <PxAvatar user={p || {}} size={28} />
                <div className="flex-1 min-w-0 text-sm leading-snug" style={{ color: C.ink }}><b>{c.author === "you" ? "you" : p?.name.toLowerCase()}</b> <MentionText text={c.text} people={st.people} onOpen={onOpenPerson} /></div>
                <button onClick={() => onLikeComment(postId, c.id)} className="shrink-0 flex flex-col items-center pt-0.5 active:scale-90 transition-transform" style={{ minWidth: 26 }} aria-label="Like comment">
                  <Heart size={14} color={c.liked ? C.coral : C.faint} fill={c.liked ? C.coral : "none"} />
                  {(c.likes || 0) > 0 && <span className="font-semibold tabular-nums" style={{ fontSize: 10.5, color: C.faint }}>{c.likes}</span>}
                </button>
              </div>
            );
          })}
        </div>
        <div className="px-3 pt-2 shrink-0" style={{ borderTop: `1.5px solid rgba(32,24,15,0.15)`, paddingBottom: "calc(16px + env(safe-area-inset-bottom))" }}>
          {g && (
            <div className="mb-2 p-2.5" style={{ ...px.flat, borderColor: g.verdict === "nudge" ? C.gold : C.coral }}>
              <div className="flex items-center gap-1.5">
                <Shield size={13} color={g.verdict === "nudge" ? "#B8860B" : C.coral} />
                <span className="text-xs font-bold" style={{ color: g.verdict === "nudge" ? "#8A6A0B" : C.coral }}>{g.message}</span>
              </div>

            </div>
          )}
          {suggestions.length > 0 && (
            <div className="hscroll flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {suggestions.map((f) => (
                <button key={f.id} onClick={() => insertMention(f)} className="flex items-center gap-1.5 pl-1 pr-2.5 py-1 shrink-0 active:scale-95 transition-transform" style={px.chip}>
                  <PxAvatar user={f} size={22} />
                  <span className="text-sm font-semibold" style={{ color: C.ink }}>@{f.name.toLowerCase()}</span>
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <button onClick={tapAt} className="shrink-0 flex items-center justify-center active:scale-90 transition-transform" style={{ width: 40, height: 44, borderRadius: 12, background: C.field }} aria-label="Mention a friend"><AtSign size={17} color={C.ink} /></button>
            <div className="flex-1 relative">
              <input ref={inputRef} value={text} onChange={(e) => { setText(e.target.value); setG(null); }} placeholder="Add a comment…" maxLength={120}
                onKeyDown={(e) => e.key === "Enter" && text.trim() && send(text.trim())} spellCheck={false}
                className="w-full outline-none" style={{ ...TYPE, background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 14, padding: "11px 14px", fontSize: 16, color: C.ink }} />
            </div>
            <PxButton small onClick={() => text.trim() && send(text.trim())} ariaLabel="Send"><Send size={14} /></PxButton>
          </div>

        </div>
      </div>
    </div>
  );
}

/* ── NOTIFICATIONS ── */
function NotifSheet({ st, act, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", ...TYPE, background: C.paper, animation: "sheetUp 0.25s ease both" }} {...swipeBack(onClose)}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ borderBottom: BORDER }}>
        <button onClick={onClose} className="p-2"><ChevronLeft size={20} color={C.ink} /></button>
        <div className="flex-1 text-center text-sm font-bold uppercase tracking-widest" style={{ color: C.ink }}>Activity</div>
        <span style={{ width: 36 }} />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
        {(() => {
          const mine = st.events.filter((e) => e.at > Date.now() && (e.host === "you" || e.going.some((g) => g === "you"))).sort((a, b) => a.at - b.at);
          if (!mine.length) return null;
          return (
            <div className="px-4 pt-3">
              <div className="text-xs font-bold uppercase tracking-widest pb-1.5" style={{ color: C.faint }}>Your events</div>
              <div className="flex flex-col gap-2">
                {mine.map((e) => (
                  <button key={e.id} onClick={() => act.openEventDetail(e.id)} className="w-full text-left p-3 active:scale-[0.99] transition-transform" style={{ ...px.flat, borderColor: e.host === "you" ? C.teal : undefined }}>
                    <div className="flex items-center gap-2">
                      <CalendarDays size={14} color={C.teal} />
                      <span className="text-sm font-bold flex-1" style={{ color: C.ink }}>{e.activity}</span>
                      {e.host === "you" && <PxTag color={C.gold}>Hosting</PxTag>}
                      <span className="text-xs font-bold" style={{ color: C.teal }}>{fmtWhen(e.at)}</span>
                    </div>
                    <div className="flex items-center gap-2 pt-1.5 pl-6">
                      <div className="flex">
                        {e.going.slice(0, 4).map((g, i) => {
                          const p = evPerson(g, st.me, st.people);
                          return p ? <div key={i} style={{ marginLeft: i ? -7 : 0, zIndex: 4 - i }}><PxAvatar user={p} size={20} /></div> : null;
                        })}
                      </div>
                      <span className="text-xs" style={{ color: C.faint }}>{e.going.length} going · {e.place}</span>
                      <span className="flex-1" />
                      <ChevronRight size={14} color={C.faint} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
        {st.requests.length > 0 && (
          <div className="px-4 pt-3">
            <div className="text-xs font-bold uppercase tracking-widest pb-1" style={{ color: C.faint }}>Requests</div>
            {st.requests.map((r) => (
              <div key={r.id} className="flex items-center gap-2.5 py-2">
                <PxAvatar user={r} size={36} />
                <div className="flex-1 text-sm font-bold" style={{ color: C.ink }}>{r.name}<div className="text-xs font-normal" style={{ color: C.faint }}>{r.mutual} mutual friends</div></div>
                <PxButton small onClick={() => act.accept(r)}>Accept</PxButton>
                <PxButton small kind="ghost" onClick={() => act.decline(r)}>Not now</PxButton>
              </div>
            ))}
          </div>
        )}
        <div className="px-4 pt-3">
          {st.notifs.map((n) => (
            <button key={n.id} onClick={n.badge ? () => { act.spotlight(n.badge); onClose(); } : n.eventId ? () => act.openEventDetail(n.eventId) : undefined} className="w-full flex items-center gap-2.5 py-2.5 text-left" style={{ borderBottom: "1.5px solid rgba(32,24,15,0.12)" }}>
              <div className="shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, background: n.badge ? "#FAF0D2" : C.field, borderRadius: 12 }}>
                {n.badge ? <Trophy size={15} color={C.ink} /> : n.kind === "event" ? <CalendarDays size={15} color={C.teal} /> : n.kind === "likes" ? <Heart size={15} color={C.coral} fill={C.coral} /> : <UserPlus size={15} color={C.ink} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-snug" style={{ color: C.ink }}>{n.text}</div>
                <div className="text-xs" style={{ color: C.faint }}>{n.sub}</div>
              </div>
              {n.badge && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: C.coral }} />}
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

/* ── SPOTLIGHT + PAIR CELEBRATION ── */
function Spotlight({ badge, count, onClose }) {
  const locked = badge.locked;
  const featured = badge.kind === "featured";
  const days = TIER_DAYS[badge.tier - 1];
  return (
    <div className="fixed inset-0 flex items-center justify-center px-8" style={{ zIndex: 60, ...TYPE }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(32,24,15,0.6)", animation: "fadeIn 0.2s ease both" }} />
      <div className="relative flex flex-col items-center text-center p-6" style={{ ...px.card, boxShadow: SHADOW(5), animation: "spotIn 0.4s cubic-bezier(0.2,1.3,0.4,1) both", maxWidth: 300 }}>
        <div style={{ filter: locked ? "grayscale(1) opacity(0.55)" : "none", animation: locked ? "none" : "bob 2.4s ease-in-out infinite" }}>
          <PixelBadge activity={badge.activity} tier={badge.tier} size={92} streak={badge.streak} featuredCat={badge.kind === "featured" ? badge.cat : undefined} />
        </div>
        <div className="font-bold tracking-tight mt-4" style={{ fontSize: 19, color: C.ink }}>{badge.name}</div>
        <div className="text-xs font-bold uppercase tracking-widest mt-1" style={{ color: C.faint }}>{featured ? `Featured · ${badge.cat}` : `${badge.activity || "Streak"} · Tier ${badge.tier} of 6`}</div>
        <div className="text-sm mt-3 leading-relaxed" style={{ color: C.mute }}>
          {featured
            ? "Hand-picked by the ShowUp team for the community wall. Certified flex."
            : locked ? `${days - count} more ${badge.activity.toLowerCase()} days to earn it. It's waiting.` : `${days} days of ${(badge.activity || "showing up").toLowerCase()}, all-time. Earned, not given.`}
        </div>
        <div className="mt-5 w-full"><PxButton full small onClick={onClose}>{locked ? "On my way" : "Love it"}</PxButton></div>
      </div>
    </div>
  );
}

function PairCele({ cele, me, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center px-8" style={{ zIndex: 60, ...TYPE }} onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(32,24,15,0.6)", animation: "fadeIn 0.2s ease both" }} />
      <div className="relative flex flex-col items-center text-center p-6" style={{ ...px.card, boxShadow: SHADOW(5), animation: "spotIn 0.4s cubic-bezier(0.2,1.3,0.4,1) both", maxWidth: 300 }}>
        <div className="flex items-center" style={{ animation: "bob 2.6s ease-in-out infinite" }}>
          <div style={{ zIndex: 1 }}><PxAvatar user={me} size={56} /></div>
          <div style={{ marginLeft: -12 }}><PxAvatar user={cele.friend} size={56} /></div>
        </div>
        <div className="flex items-center gap-1.5 mt-4">
          <Sprite grid={SPR.flame} pal={{ r: C.coral, o: "#F28C3B", y: C.gold }} px={2.5} />
          <span className="font-bold tabular-nums tracking-tight" style={{ fontSize: 30, color: C.ink }}>{cele.n}</span>
        </div>
        <div className="font-bold tracking-tight mt-0.5" style={{ fontSize: 18, color: C.ink }}>days together</div>
        <div className="text-sm mt-2.5 leading-relaxed" style={{ color: C.mute }}>You and {cele.friend.name} keep showing up for it. This one belongs to both of you.</div>
        <div className="mt-5 w-full"><PxButton full small onClick={onClose}>Keep it rolling</PxButton></div>
      </div>
    </div>
  );
}

/* ── PROGRESS + PIXEL JOURNEYS ── */
const JPAL = { k: "rgba(32,24,15,0.8)", w: "#FFF", g: "#2E6A3E", G: "#4E8A5E", r: "#E8563F", o: "#F28C3B", y: "#F2B93B", Y: "#F8E878", b: "#8FD0E8", p: "#7C5CD9", t: "#B8783E", T: "#F2D8A8" };
function SpriteRaw({ id, px: scale = 1 }) {
  const grid = SPR[id]; if (!grid) return null;
  return (
    <g transform={`scale(${scale})`}>
      {grid.map((row, y) => row.split("").map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1.05" height="1.05" fill={JPAL[c] || "#20180F"} />)))}
    </g>
  );
}
/* hero compositions — hand-built pixel set pieces, one per chapter */
const HEROES = {
  green: () => (<g><ellipse cx="30" cy="14" rx="26" ry="11" fill="#7EC87E" /><ellipse cx="30" cy="14" rx="26" ry="11" fill="none" stroke="rgba(32,24,15,0.25)" strokeWidth="1" /><circle cx="34" cy="15" r="1.6" fill="#20180F" /><g transform="translate(30 1)"><SpriteRaw id="flagspr" px={1.3} /></g></g>),
  sand: () => (<g><ellipse cx="26" cy="12" rx="22" ry="9" fill="#F0E0B0" /><ellipse cx="26" cy="12" rx="22" ry="9" fill="none" stroke="rgba(32,24,15,0.2)" strokeWidth="1" />{[8, 18, 28, 38].map((x, i) => <rect key={i} x={x} y={10 + (i % 2) * 3} width="6" height="1" fill="#D8C890" />)}</g>),
  water: () => (<g><ellipse cx="30" cy="13" rx="27" ry="10" fill="#5EA8D8" /><ellipse cx="30" cy="13" rx="27" ry="10" fill="none" stroke="rgba(32,24,15,0.25)" strokeWidth="1" />{[12, 26, 40].map((x, i) => <path key={i} d={`M ${x} ${11 + (i % 2) * 3} h 6`} stroke="#B8E0F8" strokeWidth="1.4" />)}<g transform="translate(38 4)"><SpriteRaw id="duck" px={1.1} /></g></g>),
  trees: () => (<g>{[0, 18, 36].map((x, i) => <g key={i} transform={`translate(${x} ${i === 1 ? 0 : 4})`}><SpriteRaw id="tree" px={1.7} /></g>)}</g>),
  stand: () => (<g><rect x="0" y="4" width="58" height="16" fill="#C8A03A" /><rect x="0" y="4" width="58" height="4" fill="#E8C860" />{[6, 18, 30, 42].map((x, i) => <rect key={i} x={x} y="10" width="8" height="6" fill="#8A6A1E" />)}<rect x="0" y="20" width="58" height="2" fill="rgba(32,24,15,0.3)" /><g transform="translate(22 -10)"><SpriteRaw id="trophy" px={1.4} /></g></g>),
  finish: () => (<g>{Array.from({ length: 12 }).map((_, i) => <rect key={i} x={i * 5} y={(i % 2) * 5} width="5" height="5" fill={i % 2 ? "#20180F" : "#FFF"} />)}{Array.from({ length: 12 }).map((_, i) => <rect key={`b${i}`} x={i * 5} y={5 - (i % 2) * 5} width="5" height="5" fill={i % 2 ? "#FFF" : "#20180F"} />)}<rect x="0" y="0" width="60" height="10" fill="none" stroke="rgba(32,24,15,0.4)" strokeWidth="1" /></g>),
  goal: () => (<g><rect x="0" y="0" width="3" height="22" fill="#FFF" /><rect x="45" y="0" width="3" height="22" fill="#FFF" /><rect x="0" y="0" width="48" height="3" fill="#FFF" />{[8, 16, 24, 32, 40].map((x, i) => <rect key={i} x={x} y="3" width="1" height="17" fill="rgba(255,255,255,0.55)" />)}<g transform="translate(18 24)"><SpriteRaw id="ball" px={1} /></g></g>),
  lanes: () => (<g><rect x="0" y="0" width="60" height="20" fill="#4E9AD8" />{[5, 10, 15].map((y, i) => <g key={i}>{Array.from({ length: 10 }).map((_, j) => <rect key={j} x={j * 6} y={y} width="3" height="1.5" fill={i === 1 ? "#F2B93B" : "#FFF"} />)}</g>)}<rect x="0" y="0" width="60" height="20" fill="none" stroke="rgba(32,24,15,0.3)" strokeWidth="1" /></g>),
  rack: () => (<g><rect x="2" y="0" width="4" height="20" fill="#5A5A64" /><rect x="40" y="0" width="4" height="20" fill="#5A5A64" /><rect x="0" y="4" width="46" height="3" fill="#3E3E48" /><rect x="0" y="12" width="46" height="3" fill="#3E3E48" /><g transform="translate(6 -6)"><SpriteRaw id="dumbbell" px={1.2} /></g></g>),
  torii: () => (<g><rect x="2" y="6" width="4" height="20" fill="#B84A3A" /><rect x="34" y="6" width="4" height="20" fill="#B84A3A" /><rect x="-2" y="2" width="44" height="4" fill="#B84A3A" /><rect x="0" y="8" width="40" height="2.5" fill="#8A3A2E" /><rect x="-4" y="0" width="48" height="2.5" fill="#20180F" /></g>),
  moon: () => (<g><circle cx="14" cy="12" r="11" fill="#F2ECC8" /><circle cx="18" cy="9" r="9" fill="#141A3E" opacity="0.35" /><circle cx="9" cy="14" r="1.6" fill="#D8D0A0" /><circle cx="16" cy="17" r="1.1" fill="#D8D0A0" />{[[30, 4], [40, 14], [34, 24]].map(([x, y], i) => <rect key={i} x={x} y={y} width="1.6" height="1.6" fill="#FFF" />)}</g>),
  orchard: () => (<g>{[0, 16, 32].map((x, i) => <g key={i} transform={`translate(${x} ${(i % 2) * 4})`}><rect x="3" y="9" width="3" height="6" fill="#7A4A22" /><rect x="0" y="3" width="9" height="6" fill="#E886A0" /><rect x="1.5" y="0" width="6" height="3" fill="#F2A8B8" /></g>)}</g>),
};
/* per-sport chapter worlds: [ground, texture, accent, heroKey] × 5 */
const JTHEME = {
  Golf:      { ch: [["#5EAA5E", "#4E9A4E", "#7EC87E", "green"], ["#C8B878", "#B8A868", "#E8D8A0", "sand"], ["#4E8AA8", "#3E7A98", "#8FD0E8", "water"], ["#B8863E", "#A8762E", "#E8A35C", "trees"], ["#3E8A4E", "#2E7A3E", "#F2D060", "stand"]], props: ["tree", "flagspr", "sun"] },
  Running:   { ch: [["#7A7A84", "#6A6A74", "#9A9AA4", "finish"], ["#4E8A58", "#3E7A48", "#7EC87E", "trees"], ["#2E5A3E", "#244E34", "#4E8A5E", "trees"], ["#8A6A42", "#7A5A32", "#C8A878", "sand"], ["#C8A878", "#B89868", "#F2D8A8", "finish"]], props: ["bolt", "tree", "runner"] },
  Soccer:    { ch: [["#4E9E5E", "#448E54", "#6EBE7E", "goal"], ["#3E8A4E", "#347A44", "#5EAA6E", "goal"], ["#2E7A46", "#246A3C", "#4E9A66", "trees"], ["#1E5A38", "#144A2E", "#3E7A58", "goal"], ["#123E2E", "#0A3224", "#2E6A4E", "stand"]], props: ["ball", "flagspr", "star"] },
  Swimming:  { ch: [["#3E8AC8", "#2E7AB8", "#8FD0E8", "lanes"], ["#2E6AA8", "#245A98", "#5EA8D8", "water"], ["#1E5A9E", "#144A8E", "#4E8AC8", "water"], ["#164E8A", "#0E3E7A", "#3E7AB8", "lanes"], ["#0E3E78", "#082E68", "#2E6AA8", "stand"]], props: ["fish", "wave", "duck"] },
  Lifting:   { ch: [["#6A6A74", "#5A5A64", "#8A8A94", "rack"], ["#5A5A64", "#4A4A54", "#7A7A84", "rack"], ["#3E5A48", "#2E4A38", "#5E7A68", "rack"], ["#54503E", "#443E2E", "#746E5E", "rack"], ["#2C2C34", "#1C1C24", "#4C4C54", "stand"]], props: ["dumbbell", "bolt", "trophy"] },
  Yoga:      { ch: [["#B89A7E", "#A88A6E", "#D8BA9E", "torii"], ["#8A7EC8", "#7A6EB8", "#AA9EE8", "orchard"], ["#7A9E8A", "#6A8E7A", "#9ABEAA", "trees"], ["#6A5EA8", "#5A4E98", "#8A7EC8", "torii"], ["#5A4E98", "#4A3E88", "#7A6EB8", "moon"]], props: ["leaf", "sun", "star"] },
  Meditation:{ ch: [["#3E4478", "#2E3468", "#5E6498", "moon"], ["#2E3468", "#242A58", "#4E5488", "torii"], ["#1E2458", "#141A48", "#3E4478", "moon"], ["#2E3468", "#242A58", "#4E5488", "torii"], ["#4E5488", "#3E4478", "#6E74A8", "moon"]], props: ["star", "brain", "sun"] },
  Walking:   { ch: [["#5EAA6E", "#4E9A5E", "#7ECA8E", "trees"], ["#4E9A5E", "#3E8A4E", "#6EBA7E", "orchard"], ["#3E7A4E", "#2E6A3E", "#5E9A6E", "trees"], ["#6E8A5E", "#5E7A4E", "#8EAA7E", "sand"], ["#7EAA6E", "#6E9A5E", "#9ECA8E", "green"]], props: ["tree", "sun", "heart"] },
  default:   { ch: [["#5E7A94", "#4E6A84", "#7E9AB4", "trees"], ["#4E6A84", "#3E5A74", "#6E8AA4", "water"], ["#3E5A74", "#2E4A64", "#5E7A94", "trees"], ["#4E6A84", "#3E5A74", "#6E8AA4", "sand"], ["#5E7A94", "#4E6A84", "#7E9AB4", "stand"]], props: ["flagspr", "star", "sun"] },
};
const CH_H = 320;

/* one chapter's full art: base, seeded pixel texture, accent bands, props, hero */
function ChapterArt({ theme, ci, seedKey }) {
  const [g, g2, acc, heroKey] = theme.ch[Math.min(ci, 4)];
  const art = useMemo(() => {
    const R = jRngL(seedKey * 131 + ci * 977 + 5);
    return {
      blocks: Array.from({ length: 46 }).map(() => ({ x: R() * 100, y: 8 + R() * (CH_H - 20), w: 5 + R() * 9, h: 5 + R() * 9, o: 0.14 + R() * 0.2 })),
      specks: Array.from({ length: 16 }).map(() => ({ x: R() * 100, y: 8 + R() * (CH_H - 16), s: 1 + R() * 1.4 })),
      props: Array.from({ length: 8 }).map((_, i) => ({
        spr: theme.props[Math.floor(R() * theme.props.length)],
        x: R() < 0.5 ? 3 + R() * 19 : 74 + R() * 19,
        y: 54 + R() * (CH_H - 140), s: 1.3 + R() * 1.5, i,
      })),
    };
  }, [seedKey, ci]);
  const heroLeft = ci % 2 === 0;
  const Hero = HEROES[heroKey];
  return (
    <>
      <div className="absolute inset-0" style={{ background: g }} />
      <svg className="absolute inset-0" width="100%" height={CH_H} preserveAspectRatio="none" viewBox={`0 0 100 ${CH_H}`} shapeRendering="crispEdges">
        {art.blocks.map((b, i) => <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={g2} opacity={b.o} />)}
        {art.specks.map((s, i) => <rect key={`s${i}`} x={s.x} y={s.y} width={s.s} height={s.s} fill={acc} opacity="0.5" />)}
        <rect x="0" y={CH_H * 0.34} width="100" height="7" fill={g2} opacity="0.35" />
        <rect x="0" y={CH_H * 0.72} width="100" height="5" fill={acc} opacity="0.18" />
      </svg>
      {art.props.map((d) => (
        <div key={d.i} className="absolute" style={{ left: `${d.x}%`, top: d.y, opacity: 0.92 }}>
          <Sprite grid={SPR[d.spr]} pal={JPAL} px={d.s} />
        </div>
      ))}
      {Hero && (
        <svg className="absolute" style={{ [heroLeft ? "left" : "right"]: "6%", top: CH_H * 0.42, overflow: "visible" }} width="70" height="40" viewBox="0 0 70 40" shapeRendering="crispEdges">
          <Hero />
        </svg>
      )}
      <div className="absolute left-0 right-0 top-0" style={{ height: 5, background: "rgba(32,24,15,0.22)" }} />
    </>
  );
}

function JourneyScreen({ activity, count, onSpotlight, onClose }) {
  const T = JTHEME[activity] || JTHEME.default;
  const names = CATALOG[activity] || [];
  const seedKey = activity.length * 997 + activity.charCodeAt(0);
  const chapters = TIER_DAYS.map((t, i) => ({ tier: i + 1, days: t, name: names[i] || `Tier ${i + 1}`, earned: count >= t })).reverse();
  const curIdx = TIER_DAYS.findIndex((t) => t > count); // -1 = maxed
  const scroller = useRef(null);
  useEffect(() => {
    if (!scroller.current) return;
    const chFromTop = curIdx === -1 ? 0 : TIER_DAYS.length - 1 - curIdx;
    scroller.current.scrollTop = Math.max(0, chFromTop * CH_H - 120);
  }, []);
  return (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 45, paddingTop: "env(safe-area-inset-top)", ...TYPE, background: T.ch[4][0], animation: "sheetUp 0.28s ease both" }} {...swipeBack(onClose)}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ background: "rgba(23,19,14,0.88)" }}>
        <button onClick={onClose} className="p-2 active:scale-90 transition-transform"><ChevronLeft size={20} color={C.paper} /></button>
        <div className="flex-1 text-center">
          <div className="text-sm font-bold text-white leading-tight">{activity}</div>
          <div className="text-xs leading-tight" style={{ color: "rgba(255,255,255,0.72)" }}>
            {count} {count === 1 ? "day" : "days"}{curIdx === -1 ? " · every tier earned" : ` · ${TIER_DAYS[curIdx] - count} to ${names[curIdx]}`}
          </div>
        </div>
        <span style={{ width: 36 }} />
      </div>
      <div ref={scroller} className="flex-1 overflow-y-auto no-scrollbar">
        {curIdx === -1 && (
          <div className="relative flex flex-col items-center pt-7 pb-3 overflow-hidden">
            <div className="absolute inset-0" style={{ background: T.ch[4][0] }} />
            <div className="relative" style={{ filter: "drop-shadow(0 3px 4px rgba(23,19,14,0.5))", animation: "bob 2.4s ease-in-out infinite" }}><Sprite grid={SPR.trophy} pal={{ y: C.gold }} px={4} /></div>
            <div className="relative text-xs font-bold uppercase tracking-widest text-white mt-2" style={{ textShadow: "0 1px 3px rgba(23,19,14,0.6)" }}>Course complete</div>
          </div>
        )}
        {chapters.map((ch, ci) => {
          const prevDays = ch.tier === 1 ? 0 : TIER_DAYS[ch.tier - 2];
          const inChapter = count >= prevDays && count < ch.days;
          const frac = inChapter ? (count - prevDays) / (ch.days - prevDays) : 0;
          const youStep = Math.floor((1 - frac) * 8);
          const youY = 70 + (1 - frac) * (CH_H - 155);
          return (
            <div key={ch.tier} className="relative overflow-hidden" style={{ height: CH_H }}>
              <ChapterArt theme={T} ci={ch.tier - 1} seedKey={seedKey} />
              {Array.from({ length: 9 }).map((_, i) => (
                <span key={i} className="absolute rounded-sm" style={{ left: `${50 + Math.sin((ci * 9 + i) * 0.9) * 16}%`, top: 40 + i * ((CH_H - 70) / 9), width: 9, height: 9, background: count >= ch.days - ((ch.days - prevDays) * (i + 1)) / 9 ? C.paper : "rgba(250,247,241,0.4)", boxShadow: "0 1px 2px rgba(32,24,15,0.4)", zIndex: 1 }} />
              ))}
              <div className="absolute left-1/2 top-5 flex flex-col items-center" style={{ transform: "translateX(-50%)", zIndex: 2 }}>
                <button onClick={() => onSpotlight({ activity, tier: ch.tier, name: ch.name, locked: !ch.earned })} className="active:scale-90 transition-transform" style={{ filter: ch.earned ? "drop-shadow(0 3px 4px rgba(23,19,14,0.45))" : "grayscale(0.9) opacity(0.8)" }}>
                  <PixelBadge activity={activity} tier={ch.tier} size={62} />
                </button>
                <div className="mt-1.5 px-2.5 py-1 rounded-lg text-center" style={{ background: "rgba(23,19,14,0.82)" }}>
                  <div className="text-xs font-bold text-white leading-tight whitespace-nowrap">{ch.name}</div>
                  <div className="leading-tight whitespace-nowrap" style={{ fontSize: 9.5, color: ch.earned ? "rgba(255,255,255,0.75)" : "#F2D060" }}>
                    {ch.earned ? `Day ${ch.days} · earned` : `In ${ch.days - count} days`}
                  </div>
                </div>
              </div>
              {inChapter && (
                <div className="absolute flex flex-col items-center" style={{ left: `${50 + Math.sin((ci * 9 + youStep) * 0.9) * 16}%`, top: youY, transform: "translateX(-50%)", zIndex: 3, animation: "bob 2.2s ease-in-out infinite" }}>
                  <PxAvatar user={{ name: "Y", avatarSeed: 3 }} size={34} />
                  <span className="text-white font-bold mt-0.5 px-1.5 rounded" style={{ fontSize: 9.5, background: "rgba(23,19,14,0.7)" }}>YOU · {count}</span>
                </div>
              )}
              <div className="absolute left-2.5 bottom-2 font-bold uppercase px-1.5 py-0.5 rounded" style={{ fontSize: 9, color: "rgba(255,255,255,0.85)", background: "rgba(23,19,14,0.35)", letterSpacing: 1 }}>{prevDays === 0 ? "Day one" : `Day ${prevDays}`} →</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProgressScreen({ st, act, onClose }) {
  const rows = Object.entries(st.progress).sort((a, b) => b[1] - a[1]);
  return (
    <div className="fixed inset-0 z-40 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", ...TYPE, background: C.paper, animation: "sheetUp 0.28s ease both" }} {...swipeBack(onClose)}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ borderBottom: BORDER }}>
        <button onClick={onClose} className="p-2"><ChevronLeft size={20} color={C.ink} /></button>
        <div className="flex-1 text-center text-sm font-bold uppercase tracking-widest" style={{ color: C.ink }}>Progress</div>
        <span style={{ width: 36 }} />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-8">
<div className="pt-1" />
        {rows.length === 0 && <div className="text-xs text-center py-8 px-10" style={{ color: C.faint }}>Post your first day and a journey appears here.</div>}
        {rows.map(([actName, days]) => {
          const ni = TIER_DAYS.findIndex((t) => t > days);
          const tier = ni === -1 ? 6 : ni;
          return (
            <button key={actName} onClick={() => act.openJourney(actName)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left active:scale-95 transition-transform" style={{ borderBottom: "1.5px solid rgba(32,24,15,0.12)" }}>
              <PixelBadge activity={actName} tier={Math.max(1, tier)} size={46} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: C.ink }}>{actName}</div>
                <div className="text-xs" style={{ color: C.faint }}>
                  {days} {days === 1 ? "day" : "days"} · {ni === -1 ? "every tier earned 🏆" : `${TIER_DAYS[ni] - days} to ${CATALOG[actName]?.[ni]}`}
                </div>
              </div>
              <ChevronRight size={14} color={C.faint} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── WRAPPED — every slide lives on YOUR banner; the finale is a
     share card built from it, ready for any other social app.     ── */
function BannerBackdrop({ id, top = 0.25, bottom = 0.7 }) {
  return (
    <>
      <div className="absolute inset-0"><BannerScene id={id || "field-day"} h="100%" /></div>
      <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(23,19,14,${top}), rgba(23,19,14,0.15) 35%, rgba(23,19,14,${bottom}))` }} />
    </>
  );
}
function WrapStat({ v, l }) {
  return (
    <div className="flex items-baseline justify-between px-3.5 py-2.5 rounded-xl" style={{ background: "rgba(23,19,14,0.55)", backdropFilter: "blur(2px)" }}>
      <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{l}</span>
      <span className="text-lg font-bold text-white tabular-nums">{v}</span>
    </div>
  );
}
/* the exportable card — banner art, badges, companion, stats, watermark */
function ShareCard({ st, days, top, pairTop, pairFriend }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: "4 / 5.4", borderRadius: 22, boxShadow: "0 18px 44px -14px rgba(0,0,0,0.65)" }}>
      <div className="absolute inset-0"><BannerScene id={st.me.banner || "field-day"} h="100%" /></div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(23,19,14,0.35), rgba(23,19,14,0.1) 30%, rgba(23,19,14,0.68) 78%)" }} />
      {st.me.companion && (
        <div className="absolute" style={{ right: 14, top: "34%", animation: "bob 2.4s ease-in-out infinite", filter: "drop-shadow(0 3px 5px rgba(23,19,14,0.6))" }}>
          <Companion id={st.me.companion} px={3.4} />
        </div>
      )}
      <div className="absolute inset-0 flex flex-col px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <img src={LOGO} alt="" style={{ width: 20, height: 20, filter: "drop-shadow(0 1px 2px rgba(23,19,14,0.5))" }} />
            <span className="text-xs font-bold text-white" style={{ textShadow: "0 1px 3px rgba(23,19,14,0.6)" }}>ShowUp</span>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-white px-2 py-1 rounded-full" style={{ background: "rgba(23,19,14,0.5)" }}>June 2026</span>
        </div>
        <div className="flex items-center gap-2.5 pt-3">
          <PxAvatar user={st.me} size={46} />
          <div>
            <div className="text-base font-bold text-white leading-tight" style={{ textShadow: "0 1px 4px rgba(23,19,14,0.65)" }}>{st.me.name}'s June</div>
            <div className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 3px rgba(23,19,14,0.65)" }}>@{st.me.username} · wrapped</div>
          </div>
        </div>
        {st.pinBadges.length > 0 && (
          <div className="flex gap-1.5 pt-2.5">
            {st.pinBadges.map((b) => <div key={b.id} style={{ filter: "drop-shadow(0 2px 4px rgba(23,19,14,0.55))" }}><PixelBadge activity={b.activity} tier={b.tier} size={36} featuredCat={b.kind === "featured" ? b.cat : undefined} /></div>)}
          </div>
        )}
        <div className="flex-1" />
        <div className="flex flex-col gap-1.5">
          <WrapStat v={days} l="Days showed up" />
          {top && <WrapStat v={top[1]} l={`${top[0]} days, all-time`} />}
          <WrapStat v={pairFriend ? pairTop[1] : "—"} l={pairFriend ? `Days with ${pairFriend.name}` : "Pair runs await"} />
          <WrapStat v={st.badges.length + st.myFeatured.length} l="Badges in the case" />
        </div>
        <div className="text-center pt-2.5" style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", textShadow: "0 1px 2px rgba(23,19,14,0.6)" }}>showup.app · No pressure. Just presence.</div>
      </div>
    </div>
  );
}

function WrappedSheet({ st, onClose, onShare }) {
  const [i, setI] = useState(0);
  const days = 24, ofDays = 30;
  const top = Object.entries(st.progress).sort((a, b) => b[1] - a[1])[0];
  const pairTop = Object.entries(st.pairs).sort((a, b) => b[1] - a[1])[0];
  const pairFriend = pairTop ? st.people[pairTop[0]] : null;
  const slides = 4;
  const next = () => (i >= slides - 1 ? onClose() : setI(i + 1));
  const back = () => setI((x) => Math.max(0, x - 1));
  const wt = useRef({ x: 0, y: 0 });
  const wrapSwipe = {
    onTouchStart: (e) => { wt.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; },
    onTouchEnd: (e) => {
      const t = e.changedTouches[0];
      const dx = t.clientX - wt.current.x, dy = t.clientY - wt.current.y;
      if (dy > 90 && Math.abs(dx) < 70) { onClose(); return; }
      if (Math.abs(dx) > 70 && Math.abs(dy) < 60) { dx < 0 ? next() : back(); }
    },
  };
  const banner = st.me.banner || "field-day";
  return (
    <div className="fixed inset-0 flex flex-col select-none" style={{ zIndex: 59, ...TYPE, background: C.night }} onClick={next} {...wrapSwipe}>
      <div className="absolute left-4 right-4 flex gap-1.5" style={{ top: "calc(12px + env(safe-area-inset-top))", zIndex: 4 }}>
        {Array.from({ length: slides }).map((_, k) => <span key={k} className="flex-1 rounded-full" style={{ height: 3.5, background: k <= i ? "#FFF" : "rgba(255,255,255,0.3)" }} />)}
      </div>
      <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute right-3 p-2.5" style={{ top: "calc(22px + env(safe-area-inset-top))", zIndex: 4 }}><X size={20} color="#FFF" /></button>

      {i === 0 && (
        <div className="relative flex-1">
          <BannerBackdrop id={banner} />
          {st.me.companion && <div className="absolute" style={{ right: 26, bottom: 190, animation: "bob 2.4s ease-in-out infinite", filter: "drop-shadow(0 3px 5px rgba(23,19,14,0.6))" }}><Companion id={st.me.companion} px={4.5} /></div>}
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-8 text-center" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}>
            {st.pinBadges.length > 0 && (
              <div className="flex gap-2 mb-3">{st.pinBadges.map((b) => <div key={b.id} style={{ filter: "drop-shadow(0 3px 5px rgba(23,19,14,0.55))" }}><PixelBadge activity={b.activity} tier={b.tier} size={44} featuredCat={b.kind === "featured" ? b.cat : undefined} /></div>)}</div>
            )}
            <PxAvatar user={st.me} size={76} />
            <div className="text-2xl font-bold text-white mt-3 tracking-tight" style={{ textShadow: "0 2px 6px rgba(23,19,14,0.6)" }}>{st.me.name}'s June</div>
            <div className="text-sm font-semibold mt-1" style={{ color: "rgba(255,255,255,0.92)", textShadow: "0 1px 4px rgba(23,19,14,0.6)" }}>June, wrapped</div>
            <div className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.7)" }}>Tap to continue</div>
          </div>
        </div>
      )}
      {i === 1 && (
        <div className="relative flex-1">
          <BannerBackdrop id={banner} top={0.5} bottom={0.55} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
            <div className="font-bold text-white tabular-nums" style={{ fontSize: 92, lineHeight: 1, textShadow: "0 4px 14px rgba(23,19,14,0.6)" }}>{days}</div>
            <div className="text-lg font-bold text-white mt-2" style={{ textShadow: "0 2px 6px rgba(23,19,14,0.6)" }}>days you showed up</div>
            <div className="text-sm mt-1.5 font-semibold px-3 py-1 rounded-full" style={{ color: "#FFF", background: "rgba(23,19,14,0.5)" }}>of {ofDays} days</div>
          </div>
        </div>
      )}
      {i === 2 && (
        <div className="relative flex-1">
          <BannerBackdrop id={banner} top={0.5} bottom={0.55} />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-10">
            {top && <div style={{ animation: "bob 2.6s ease-in-out infinite", filter: "drop-shadow(0 4px 8px rgba(23,19,14,0.55))" }}><PixelBadge activity={top[0]} tier={Math.max(1, TIER_DAYS.findIndex((t) => t > top[1]) === -1 ? 6 : TIER_DAYS.findIndex((t) => t > top[1]))} size={88} /></div>}
            <div className="text-lg font-bold text-white mt-4" style={{ textShadow: "0 2px 6px rgba(23,19,14,0.6)" }}>{top ? top[0] : "Showing up"} carried the month</div>
            <div className="text-sm mt-1.5 font-semibold px-3 py-1 rounded-full" style={{ color: "#FFF", background: "rgba(23,19,14,0.5)" }}>{top ? `${top[1]} days all-time` : "July is wide open"}</div>
          </div>
        </div>
      )}
      {i === 3 && (
        <div className="relative flex-1">
          <BannerBackdrop id={banner} top={0.6} bottom={0.75} />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-8" onClick={(e) => e.stopPropagation()}>
            <div className="w-full" style={{ maxWidth: 300, animation: "spotIn 0.4s cubic-bezier(0.2,1.3,0.4,1) both" }}>
              <ShareCard st={st} days={days} top={top} pairTop={pairTop} pairFriend={pairFriend} />
            </div>
            <div className="w-full pt-4" style={{ maxWidth: 300 }}>
              <PxButton full style={{ background: "#FFF", color: C.ink }} onClick={onShare}><span className="inline-flex items-center gap-2"><Share2 size={14} /> Share your June</span></PxButton>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── PURCHASE CONFIRMATION — App Store-style, sandbox mode ── */
function PurchaseSheet({ purchase, me, onConfirm, onClose }) {
  const { item, kind } = purchase;
  const r = kind === "coins" ? null : RARITY[item.rarity];
  return (
    <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: 58, ...TYPE }}>
      <div className="absolute inset-0" style={{ background: "rgba(23,19,14,0.5)", animation: "fadeIn 0.2s ease both" }} onClick={onClose} />
      <div className="relative px-5 pt-5" style={{ paddingBottom: "calc(32px + env(safe-area-inset-bottom))", background: C.card, borderRadius: "22px 22px 0 0", boxShadow: "0 -8px 30px rgba(23,19,14,0.25)", animation: "sheetUp 0.28s ease both" }} {...swipeDown(onClose)}>
        <div className="mx-auto rounded-full" style={{ width: 40, height: 4.5, background: C.line }} />
        <div className="flex items-center gap-3.5 pt-4">
          <div className="overflow-hidden shrink-0 flex items-center justify-center" style={{ width: 76, height: 56, borderRadius: 12, border: BORDER, background: C.field }}>
            <Sprite grid={SPR.coin} pal={{ y: "#C8901A", Y: C.gold, k: C.ink }} px={3.2} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold" style={{ color: C.ink }}>{item.name}</div>
            <div className="text-xs mt-0.5" style={{ color: C.mute }}>{item.coins.toLocaleString()} coins, straight to your balance</div>
          </div>
          <div className="text-lg font-bold tabular-nums" style={{ color: C.ink }}>${item.usd.toFixed(2)}</div>
        </div>
        <div className="mt-5"><PxButton full onClick={() => onConfirm(purchase)}>Confirm purchase</PxButton></div>
        <div className="text-xs text-center mt-3" style={{ color: C.faint }}>Sandbox — no real charge. StoreKit / Play Billing wires in here at launch.</div>
      </div>
    </div>
  );
}

/* ═══════════════ SETTINGS + DEVELOPER MODE ═══════════════
   Dev Mode is the seam between simulation and production: the
   outbox shows every "sent" SMS/email (with live codes), provider
   key fields mark where Twilio/SendGrid plug in, the ledger shows
   every audited event, and the Guardian playground proves L1–L5. */

function SettingsSheet({ st, core, act, onClose }) {
  const [dev, setDev] = useState(false);
  const [gTest, setGTest] = useState("");
  const [gOut, setGOut] = useState(null);
  const [term, setTerm] = useState("");
  const [smsKey, setSmsKey] = useState(core.db.providerKeys.sms);
  const [emailKey, setEmailKey] = useState(core.db.providerKeys.email);
  const [, force] = useState(0);
  const Row = ({ label, children }) => (
    <div className="flex items-center justify-between px-3 py-2.5" style={{ borderBottom: "1.5px solid rgba(32,24,15,0.12)" }}>
      <span className="text-sm font-bold" style={{ color: C.ink }}>{label}</span>{children}
    </div>
  );
  return (
    <div className="fixed inset-0 flex flex-col" style={{ paddingTop: "env(safe-area-inset-top)", zIndex: 55, ...TYPE, background: C.paper, animation: "sheetUp 0.25s ease both" }} {...swipeBack(onClose)}>
      <div className="flex items-center h-12 px-2 shrink-0" style={{ borderBottom: BORDER }}>
        <button onClick={onClose} className="p-2"><ChevronLeft size={20} color={C.ink} /></button>
        <div className="flex-1 text-center text-sm font-bold uppercase tracking-widest" style={{ color: C.ink }}>Settings</div>
        <span style={{ width: 36 }} />
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="px-4 pt-4">
          <div style={px.flat}>
            <Row label="Signed in as"><span className="text-xs font-bold" style={{ color: C.mute }}>@{st.me.username}</span></Row>
            <Row label="Session"><span className="text-xs" style={{ color: C.faint }}>expires in {Math.max(0, Math.round((st.session.expires - Date.now()) / 3600000))}h</span></Row>
            <Row label="Rest days"><span className="text-xs font-bold" style={{ color: C.mute }}>2 / week</span></Row>
          </div>
        </div>

        <div className="px-4 pt-4 flex flex-col gap-2">
          <PxButton full kind="ghost" onClick={() => setDev((d) => !d)}><span className="inline-flex items-center gap-2"><Terminal size={14} /> Developer Mode {dev ? "▾" : "▸"}</span></PxButton>
          {dev && (
            <div className="flex flex-col gap-3 p-3" style={{ ...px.flat, background: C.night }}>
              <div className="text-xs font-bold uppercase tracking-widest" style={{ color: "#5EDCA8" }}>▓ Viewport diagnostics</div>
              <div className="text-xs" style={{ color: "#B8C8B8" }}>
                innerH {typeof window !== "undefined" ? window.innerHeight : 0} · vvH {typeof window !== "undefined" && window.visualViewport ? Math.round(window.visualViewport.height) : 0} · docH {typeof document !== "undefined" ? document.documentElement.clientHeight : 0} · rootH {typeof document !== "undefined" ? Math.round(document.querySelector(".app-root")?.getBoundingClientRect().height || 0) : 0} · screenH {typeof window !== "undefined" ? window.screen.height : 0}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest pt-1" style={{ color: "#5EDCA8" }}>▓ Outbox — simulated delivery</div>
              <div className="flex flex-col gap-1.5" style={{ maxHeight: 150, overflowY: "auto" }}>
                {core.db.outbox.length === 0 && <div className="text-xs" style={{ color: "#8A9A8A" }}>Nothing sent yet.</div>}
                {[...core.db.outbox].reverse().map((m, i) => (
                  <div key={i} className="text-xs p-2" style={{ background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(94,220,168,0.3)", borderRadius: 5, color: "#D8E8D8" }}>
                    <b style={{ color: "#5EDCA8" }}>[{m.channel}]</b> → {m.to}<br />{m.body}
                  </div>
                ))}
              </div>
              <div className="text-xs font-bold uppercase tracking-widest pt-1" style={{ color: "#5EDCA8" }}>▓ Delivery providers</div>
              <div className="text-xs leading-relaxed" style={{ color: "#8A9A8A" }}>Codes land in the outbox above until real provider keys are wired in server-side. Paste them here to mark the integration point:</div>
              <PxInput value={smsKey} onChange={(e) => { setSmsKey(e.target.value); core.db.providerKeys.sms = e.target.value; }} placeholder="Twilio Account SID (SMS)" style={{ background: "#0E0C08", color: "#D8E8D8", borderColor: "#5EDCA8" }} />
              <PxInput value={emailKey} onChange={(e) => { setEmailKey(e.target.value); core.db.providerKeys.email = e.target.value; }} placeholder="SendGrid API key (email)" style={{ background: "#0E0C08", color: "#D8E8D8", borderColor: "#5EDCA8" }} />
              <div className="text-xs font-bold uppercase tracking-widest pt-1" style={{ color: "#5EDCA8" }}>▓ Guardian playground</div>
              <div className="flex gap-2">
                <PxInput value={gTest} onChange={(e) => setGTest(e.target.value)} placeholder="Type anything to test the shield" style={{ background: "#0E0C08", color: "#D8E8D8", borderColor: "#5EDCA8" }} />
                <PxButton small onClick={() => setGOut(core.guardian.check(gTest, "dev"))}>Run</PxButton>
              </div>
              {gOut && <div className="text-xs p-2" style={{ background: "rgba(255,255,255,0.06)", borderRadius: 5, color: gOut.verdict === "pass" ? "#5EDCA8" : gOut.verdict === "nudge" ? C.gold : "#F28C7A" }}>verdict: <b>{gOut.verdict.toUpperCase()}</b>{gOut.message ? ` — ${gOut.message}` : ""}</div>}
              <div className="flex gap-2">
                <PxInput value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Add blocked term (stored as hash)" style={{ background: "#0E0C08", color: "#D8E8D8", borderColor: "#5EDCA8" }} />
                <PxButton small kind="danger" onClick={() => { const t = gNormalize(term).squashed; if (t.length >= 3) { core.db.blockHashes.add(saltedHash(t, GUARDIAN_SALT)); core.log("BLOCKLIST_ADD", `+1 term (hashed) · total ${core.db.blockHashes.size}`); setTerm(""); force((x) => x + 1); } }}>Hash+Add</PxButton>
              </div>
              <div className="text-xs" style={{ color: "#8A9A8A" }}>Blocklist ships empty by design — no slur exists in this source code. Terms you add live only as salted FNV hashes ({core.db.blockHashes.size} loaded).</div>
              <div className="text-xs font-bold uppercase tracking-widest pt-1" style={{ color: "#5EDCA8" }}>▓ Event ledger (append-only)</div>
              <div className="flex flex-col gap-1" style={{ maxHeight: 140, overflowY: "auto" }}>
                {[...core.db.events].reverse().slice(0, 40).map((e, i) => (
                  <div key={i} className="text-xs" style={{ color: "#B8C8B8" }}><b style={{ color: "#5EDCA8" }}>{e.type}</b> {e.detail} <span style={{ color: "#5A6A5A" }}>· {new Date(e.t).toLocaleTimeString()}</span></div>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <PxButton small kind="gold" onClick={act.unlockAll}>Unlock cosmetics</PxButton>
                <PxButton small kind="ghost" onClick={() => { core.log("SESSION_TOKEN", st.session.token); force((x) => x + 1); }}>Log token</PxButton>
              </div>
            </div>
          )}
        </div>
        <div className="px-4 pt-4 flex flex-col gap-2">
          <PxButton full kind="danger" onClick={act.logout}><span className="inline-flex items-center gap-2"><LogOut size={14} /> Log out</span></PxButton>
        </div>
        <div className="text-xs text-center pt-5 px-10 leading-relaxed" style={{ color: C.faint }}>ShowUp v3.2</div>
      </div>
    </div>
  );
}

/* ═══════════════ THE APP — everything, wired ═══════════════ */

/* ── gesture helpers: swipe-right to go back, swipe-down to dismiss sheets ── */
const swipeBack = (onClose) => {
  let x0 = 0, y0 = 0;
  return {
    onTouchStart: (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; },
    onTouchEnd: (e) => { const t = e.changedTouches[0]; if (t.clientX - x0 > 80 && Math.abs(t.clientY - y0) < 70) onClose(); },
  };
};
const swipeDown = (onClose) => {
  let x0 = 0, y0 = 0;
  return {
    onTouchStart: (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; },
    onTouchEnd: (e) => { const t = e.changedTouches[0]; if (t.clientY - y0 > 80 && Math.abs(t.clientX - x0) < 70) onClose(); },
  };
};
const TAB_ORDER = ["feed", "friends", "featured", "profile"];

function BottomNav({ tab, setTab, onCompose }) {
  const Item = ({ id, icon: Icon }) => (
    <button onClick={() => setTab(id)} className="flex-1 flex justify-center items-center active:scale-90 transition-transform" aria-label={id} style={{ minHeight: 52 }}>
      <Icon size={23} color={tab === id ? C.ink : C.faint} strokeWidth={tab === id ? 2.6 : 2} />
    </button>
  );
  return (
    <div className="fixed inset-x-0 flex justify-center" style={{ bottom: "calc(-1 * var(--vv-gap, 0px))", zIndex: 30, pointerEvents: "none" }}>
      <div className="w-full flex items-center px-1" style={{ maxWidth: 520, background: C.paper, borderTop: BORDER, paddingBottom: "env(safe-area-inset-bottom)", pointerEvents: "auto" }}>
      <Item id="feed" icon={Home} />
      <Item id="friends" icon={Users} />
      <div className="flex-1 flex justify-center py-2">
        <button onClick={onCompose} className="active:scale-90 transition-transform" aria-label="Show up" style={{ width: 48, height: 48, background: C.teal, borderRadius: 999, boxShadow: "0 8px 20px -8px rgba(30,158,134,0.65)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Plus size={22} color="#FFF" strokeWidth={3} />
        </button>
      </div>
      <Item id="featured" icon={Star} />
      <Item id="profile" icon={User} />
      </div>
    </div>
  );
}

function useViewportLock(rootRef, onStale) {
  useEffect(() => {
    let warned = false;
    const fix = () => {
      const vv = window.visualViewport;
      const vvH = vv ? vv.height : 0;
      const h = Math.max(window.innerHeight || 0, vvH, document.documentElement.clientHeight || 0);
      if (!h) return;
      document.documentElement.style.setProperty("--app-height", h + "px");
      // stale layout viewport: fixed elements anchor short — push chrome down by the gap
      const gap = Math.max(0, Math.round(vvH - (window.innerHeight || vvH)));
      document.documentElement.style.setProperty("--vv-gap", gap + "px");
      if (rootRef.current) rootRef.current.style.setProperty("height", h + "px", "important");
    };
    fix();
    const timers = [80, 300, 800, 2000].map((ms) => setTimeout(fix, ms));
    timers.push(setTimeout(() => {
      const vv = window.visualViewport ? window.visualViewport.height : 0;
      if (!warned && vv && window.innerHeight && vv - window.innerHeight > 60) { warned = true; onStale && onStale(); }
    }, 1500));
    window.addEventListener("resize", fix);
    window.addEventListener("pageshow", fix);
    document.addEventListener("visibilitychange", fix);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", fix);
    return () => { timers.forEach(clearTimeout); window.removeEventListener("resize", fix); window.removeEventListener("pageshow", fix); document.removeEventListener("visibilitychange", fix); if (window.visualViewport) window.visualViewport.removeEventListener("resize", fix); };
  }, []);
}

class CrashGuard extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { try { console.error("ShowUp crash:", err, info); } catch (_) {} }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center px-8 text-center" style={{ background: "#FAF7F1", zIndex: 999, fontFamily: "system-ui" }}>
        <div style={{ fontSize: 40 }}>🛠️</div>
        <div className="text-base font-bold mt-3" style={{ color: "#20180F" }}>Something broke on this screen</div>
        <div className="text-xs mt-3 px-3 py-2 rounded-lg text-left w-full overflow-auto" style={{ background: "#EFE9DD", color: "#8A2F1F", maxHeight: 130, fontFamily: "monospace" }}>
          {String(this.state.err && this.state.err.message || this.state.err)}
        </div>
        <button onClick={() => window.location.reload()} className="mt-5 px-6 py-3 rounded-2xl text-sm font-bold" style={{ background: "#1E9E86", color: "#FFF", border: "none" }}>Reload ShowUp</button>
        <div className="text-xs mt-3" style={{ color: "#8B8070" }}>Screenshot this and send it to Claude.</div>
      </div>
    );
  }
}

function AppInner() {
  const rootRef = useRef(null);
  useViewportLock(rootRef, () => showToast("iOS cached an old screen size — remove the icon and re-add it once."));
  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      const now = Date.now();
      setEvents((evs) => {
        evs.forEach((e) => {
          if (e.going.some((g) => g === "you") && e.at > now && e.at - now < 60 * 60e3 && !remindedRef.current.has(e.id)) {
            remindedRef.current.add(e.id);
            setNotifs((ns) => [{ id: "ev-" + e.id, kind: "event", text: `Starting soon — ${e.activity} at ${e.place}`, sub: fmtWhen(e.at) }, ...ns]);
            setNotifSeen(false);
            showToast(`${e.activity} starts soon — ${e.place}`);
          }
        });
        return evs;
      });
    }, 30000);
    return () => clearInterval(iv);
  }, []);
  /* ── the core: one instance, survives rerenders ── */
  const coreRef = useRef(null);
  if (!coreRef.current) {
    const db = {
      usernames: new Set(["sofia", "maya", "lena", "dev", "jake", "omar", "zoe", "marcus"]),
      credentials: {}, outbox: [], events: [], blockHashes: new Set(), providerKeys: { sms: "", email: "" },
    };
    const log = (type, detail = "") => { db.events.push({ t: Date.now(), type, detail }); if (db.events.length > 200) db.events.shift(); };
    coreRef.current = {
      db, log,
      otp: makeOtpService((m) => db.outbox.push(m), log),
      limit: makeLimiter(),
      guardian: makeGuardian(() => db.blockHashes, log),
      registerCredentials(identities, pw, username) {
        const salt = rngToken();
        const rec = { salt, hash: saltedHash(pw, salt), username };
        (Array.isArray(identities) ? identities : [identities]).forEach((id) => { db.credentials[id] = rec; });
        db.usernames.add(username);
        log("CREDENTIALS_SET", `@${username} · pw salted-hashed · ${Array.isArray(identities) ? identities.length : 1} login identity(ies)`);
      },
      login(identity, pw) {
        const rec = db.credentials[identity];
        if (!rec) return { ok: false, error: "No account with that contact — create one below." };
        if (saltedHash(pw, rec.salt) !== rec.hash) { log("LOGIN_FAIL", identity.replace(/(.{3}).*(.{2})/, "$1•••$2")); return { ok: false, error: "Wrong password. Try again or reset it." }; }
        log("LOGIN", `@${rec.username}`);
        return { ok: true, username: rec.username };
      },
      resetPassword(identity, pw) {
        const rec = db.credentials[identity];
        if (!rec) return { ok: false, error: "No account with that contact." };
        rec.salt = rngToken(); rec.hash = saltedHash(pw, rec.salt);
        log("PASSWORD_RESET", `@${rec.username}`);
        return { ok: true };
      },
      peekLastCode(identity) {
        for (let i = db.outbox.length - 1; i >= 0; i--) {
          if (db.outbox[i].to === identity) { const m = db.outbox[i].body.match(/code is (\d{6})/); if (m) return `📬 Delivered code: ${m[1]}`; }
        }
        return "Nothing in the outbox for that address yet — send a code first.";
      },
    };
  }
  const core = coreRef.current;

  /* ── session + per-user state ── */
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [friends, setFriends] = useState(SEED_FRIENDS);
  const [posts, setPosts] = useState(SEED_POSTS);
  const [comments, setComments] = useState(SEED_COMMENTS);
  const [pairs, setPairs] = useState(SEED_PAIRS);
  const [progress, setProgress] = useState({});
  const [inventory, setInventory] = useState(["field-day"]);
  const [wallet, setWallet] = useState(0);
  const [purchase, setPurchase] = useState(null); // USD coin pack awaiting confirm
  const [shopOpen, setShopOpen] = useState(false);
  const [bannerEditOpen, setBannerEditOpen] = useState(false);
  const [wrappedOpen, setWrappedOpen] = useState(false);
  const [nominateOpen, setNominateOpen] = useState(false);
  const [nominateSeed, setNominateSeed] = useState(null);
  const [nominatedId, setNominatedId] = useState(null);
  const [nominatedCat, setNominatedCat] = useState(null);
  const [myFeatured, setMyFeatured] = useState([]);
  const [history, setHistory] = useState({ 6: {}, 7: {} });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [memoryView, setMemoryView] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [eventsView, setEventsView] = useState("list");
  const joinTimersRef = useRef([]);
  const [tick, setTick] = useState(0);
  const remindedRef = useRef(new Set());
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [sent, setSent] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [notifSeen, setNotifSeen] = useState(false);

  const [tab, setTabRaw] = useState("feed");
  const [slideDir, setSlideDir] = useState(null);
  const setTab = (next) => {
    const from = TAB_ORDER.indexOf(tab), to = TAB_ORDER.indexOf(next);
    setSlideDir(from === -1 || to === -1 || from === to ? null : to > from ? "L" : "R");
    setTabRaw(next);
  };
  const tabTouch = useRef({ x: 0, y: 0 });
  const tabSwipe = {
    onTouchStart: (e) => { tabTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, skip: !!e.target.closest(".hscroll") }; },
    onTouchEnd: (e) => {
      if (tabTouch.current.skip) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - tabTouch.current.x, dy = t.clientY - tabTouch.current.y;
      if (Math.abs(dx) < 70 || Math.abs(dy) > 60) return;
      const i = TAB_ORDER.indexOf(tab);
      const next = TAB_ORDER[i + (dx < 0 ? 1 : -1)];
      if (next) setTab(next);
    },
  };
  const [composerOpen, setComposerOpen] = useState(false);
  const [commentsFor, setCommentsFor] = useState(null);
  const [friendView, setFriendView] = useState(null);
  const [progressOpen, setProgressOpen] = useState(false);
  const [journeyFor, setJourneyFor] = useState(null);
  const [spot, setSpot] = useState(null);
  const [cele, setCele] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastT = useRef(null);
  const showToast = (m) => { setToast(m); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToast(null), 2600); };

  const onAuth = (data) => {
    const demo = !!data.demo;
    const user = demo
      ? { name: "Roy", username: "roy", avatarSeed: 3, shirt: "#1E9E86", photo: null, banner: "summit-flag", companion: "co-duck", pins: ["Golf-6", "fw24", "Running-2"], since: "April 12", weeks: 11, daysWeek: 4 }
      : { name: data.name, username: data.username, avatarSeed: (data.username || "u").length % 8, shirt: "#1E9E86", photo: data.photo || null, banner: "field-day", companion: null, pins: [], since: data.returning ? "a while back" : "today", weeks: 0, daysWeek: 0 };
    setMe(user);
    setProgress(demo ? { ...SEED_PROGRESS } : {});
    setInventory(demo ? ["field-day", "summit-flag", "co-duck", "co-run"] : ["field-day"]);
    setWallet(demo ? 85 : 0);
    setMyFeatured(demo ? SEED_MY_FEATURED : []);
    setHistory(demo ? buildDemoHistory() : { 6: {}, 7: {} });
    setHistoryOpen(false);
    setEvents(demo ? buildSeedEvents() : []);
    setEventsOpen(false); setEventsView("list"); remindedRef.current = new Set();
    joinTimersRef.current.forEach(clearTimeout); joinTimersRef.current = [];
    setNominatedId(null); setNominatedCat(null);
    setShopOpen(false); setNominateOpen(false); setBannerEditOpen(false); setWrappedOpen(false);
    setFriends(SEED_FRIENDS); setPosts(SEED_POSTS); setComments(SEED_COMMENTS); setPairs(SEED_PAIRS);
    setRequests(SEED_REQUESTS); setSent([]); setNotifSeen(false);
    setNotifs(demo
      ? [
          { id: "n1", kind: "likes", text: "Maya and 12 others liked your post", sub: "2h" },
          { id: "n2", badge: { activity: "Running", tier: 2, name: "Just Jogging" }, text: "New badge earned — Just Jogging", sub: "Tap to admire" },
          { id: "evjoin-e5", kind: "event", eventId: "e5", text: "Lena + 1 other joined your Golf", sub: "1h" },
          { id: "n3", kind: "follow", text: "Sofia started showing up with you", sub: "3d" },
        ]
      : [{ id: "n0", kind: "follow", text: "Welcome to ShowUp — invite your first friend 🎉", sub: "now" }]);
    setSession({ token: rngToken(), expires: Date.now() + 24 * 60 * MIN });
    core.log(demo ? "LOGIN_DEMO" : "SIGNUP", `@${user.username} · session issued`);
    setTab("feed");
  };

  const people = useMemo(() => Object.fromEntries(friends.map((f) => [f.id, f])), [friends]);
  const badges = useMemo(() => badgesFor(progress), [progress]);
  const pinBadges = useMemo(() => {
    const pool = [...myFeatured, ...badges];
    return (me?.pins || []).map((id) => pool.find((b) => b.id === id)).filter(Boolean);
  }, [me, badges, myFeatured]);
  const postedToday = useMemo(() => posts.some((p) => p.author === "you" && !p.type), [posts]);

  const st = {
    me, session, friends, posts, comments, pairs, progress, badges, people, inventory,
    requests, sent, notifs, postedToday, nominatedId, nominatedCat, myFeatured, wallet, pinBadges, history, events, tick,
    suggested: SEED_SUGGESTED.filter((s) => !friends.some((f) => f.id === s.id)),
    notifDot: !notifSeen || requests.length > 0 || notifs.some((n) => n.badge),
    postSeed: posts.length,
  };

  const act = {
    setTab,
    openComposer: () => setComposerOpen(true),
    openComments: (id) => setCommentsFor(id),
    openPerson: (id) => { const p = people[id]; if (p) setFriendView(p); },
    openProgress: () => setProgressOpen(true),
    openJourney: (a) => setJourneyFor(a),
    openSettings: () => setSettingsOpen(true),
    openHistory: () => setHistoryOpen(true),
    openMemory: (post) => { setMemoryView(post); core.log("MEMORY_VIEW", post.id); },
    openEvents: () => { setEventsView("list"); setEventsOpen(true); },
    openEventDetail: (id) => { setEventsView(id); setNotifOpen(false); setEventsOpen(true); },
    rsvp: (id) => {
      setEvents((evs) => evs.map((e) => {
        if (e.id !== id) return e;
        const isIn = e.going.some((g) => g === "you");
        const going = isIn ? e.going.filter((g) => g !== "you") : [...e.going, "you"];
        if (!isIn) { showToast(`You're in. Reminder set for ${fmtWhen(e.at)}.`); core.log("EVENT_RSVP", e.id); }
        else { showToast("Opted out."); remindedRef.current.delete(e.id); }
        return { ...e, going };
      }));
    },
    createEvent: (data) => {
      const ev = { id: "e" + Date.now(), host: "you", going: ["you"], ...data };
      setEvents((evs) => [...evs, ev]);
      core.log("EVENT_CREATE", `${data.activity} · ${data.place}`);
      showToast("Event posted to everyone nearby.");
      // people discover it and opt in over the next couple of minutes
      const joiners = [...SEED_FRIENDS].sort(() => Math.random() - 0.5).slice(0, 3);
      [20000, 48000, 85000].forEach((ms, i) => {
        if (!joiners[i]) return;
        joinTimersRef.current.push(setTimeout(() => {
          const f = joiners[i];
          setEvents((evs) => evs.map((e) => (e.id === ev.id && !e.going.includes(f.id) ? { ...e, going: [...e.going, f.id] } : e)));
          setNotifs((ns) => {
            const others = i; // joiners before this one
            const text = others === 0 ? `${f.name} joined your ${ev.activity}` : `${f.name} + ${others} other${others > 1 ? "s" : ""} joined your ${ev.activity}`;
            const rest = ns.filter((n) => n.id !== "evjoin-" + ev.id);
            return [{ id: "evjoin-" + ev.id, kind: "event", eventId: ev.id, text, sub: "just now" }, ...rest];
          });
          setNotifSeen(false);
          if (i === 0) showToast(`${f.name} joined your ${ev.activity} 👍`);
          core.log("EVENT_JOIN", `${f.id} → ${ev.id}`);
        }, ms));
      });
    },
    openShop: () => setShopOpen(true),
    openBannerEdit: () => setBannerEditOpen(true),
    openWrapped: () => setWrappedOpen(true),
    setBanner: (id) => { setMe((m) => ({ ...m, banner: id })); core.log("EQUIP", `banner:${id}`); },
    setCompanion: (id) => { setMe((m) => ({ ...m, companion: id })); core.log("EQUIP", `companion:${id || "none"}`); },
    togglePin: (id) => setMe((m) => {
      const pins = m.pins || [];
      if (pins.includes(id)) return { ...m, pins: pins.filter((p) => p !== id) };
      if (pins.length >= 3) { showToast("Three pins max — unpin one first."); return m; }
      core.log("PIN", id);
      return { ...m, pins: [...pins, id] };
    }),
    openNominate: () => setNominateOpen(true),
    postMenu: (kind, post) => {
      if (kind === "share") {
        const person = people[post.author];
        if (navigator.share) {
          navigator.share({ title: "ShowUp", text: `${person?.name || "A friend"} showed up — ${post.activity}${post.caption ? ` · "${post.caption}"` : ""}`, url: window.location.href }).catch(() => {});
        } else { showToast("Sharing works on your phone."); }
        core.log("SHARE", post.id);
      }
      if (kind === "report") { core.log("GUARDIAN_REPORT", post.id); showToast("Report received."); }
      if (kind === "nominate") {
        if (nominatedId) { showToast("This week's entry is used — resets Monday."); return; }
        setNominateSeed(post); setNominateOpen(true);
      }
    },
    nominate: (post, cat) => {
      setNominatedId(post.id); setNominatedCat(cat);
      setNominateOpen(false);
      core.log("NOMINATION", `your ${post.id} → ${cat}`);
      showToast(`Entered for ${cat} — winners Sunday. 🏅`);
    },
    openNotifs: () => { setNotifOpen(true); setNotifSeen(true); },
    spotlight: (b) => setSpot(b),
    unlockAll: () => { setInventory([...SHOP.banners, ...SHOP.companions].map((i) => i.id)); core.log("DEV_UNLOCK", "all cosmetics"); showToast("All cosmetics unlocked (dev)"); },
    logout: () => { core.log("LOGOUT", `@${me?.username}`); setSession(null); setMe(null); setSettingsOpen(false); setTab("feed"); },
    like: (id) => setPosts((ps) => ps.map((p) => {
      if (p.id !== id) return p;
      const liked = !p.liked;
      if (liked) core.log("LIKE", `you → ${p.author}`);
      return { ...p, liked, likes: p.likes + (liked ? 1 : -1) };
    })),
    react: (id, e) => { setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, reactions: { ...p.reactions, [e]: (p.reactions[e] || 0) + 1 } } : p))); core.log("REACT", e); },
    hype: (post) => core.log("HYPE", `you → ${post.author}`),
    addComment: (postId, text) => { setComments((c) => ({ ...c, [postId]: [...(c[postId] || []), { id: Date.now(), author: "you", text, likes: 0, liked: false }] })); core.log("COMMENT", `on ${postId}`); },
    likeComment: (postId, cid) => setComments((cs) => ({ ...cs, [postId]: (cs[postId] || []).map((c) => (c.id === cid ? { ...c, liked: !c.liked, likes: Math.max(0, (c.likes || 0) + (c.liked ? -1 : 1)) } : c)) })),
    accept: (r) => {
      setFriends((f) => [...f, { ...r, days: 0, cheers: 0, since: "today" }]);
      setRequests((q) => q.filter((x) => x.id !== r.id));
      setNotifs((n) => [{ id: `nf-${r.id}`, kind: "follow", text: `You and ${r.name} are now friends`, sub: "just now" }, ...n]);
      core.log("FRIEND_ACCEPT", r.name); showToast(`You and ${r.name} are connected ✓`);
    },
    decline: (r) => { setRequests((q) => q.filter((x) => x.id !== r.id)); core.log("FRIEND_DECLINE", r.name); },
    addFriend: (s) => { setSent((x) => [...x, s.id]); core.log("FRIEND_REQUEST_SENT", s.name); showToast(`Request sent to ${s.name}.`); },
    invite: () => {
      core.db.outbox.push({ to: "+1 (208) 555-0199", channel: "SMS", body: `${me.name} invited you to ShowUp! Code ${me.username.slice(0, 3).toUpperCase()}-4QK7 → showup.app/j/4QK7`, at: Date.now() });
      core.log("INVITE_SENT", "SMS queued");
      showToast("Invite queued — it's in the Dev outbox 📬");
    },
    buy: (kind, item) => {
      if (kind === "coins") { setPurchase({ kind, item }); return; }
      if (wallet < item.price) { showToast("Not enough coins — grab a pack in the Coins tab."); return; }
      setWallet((w) => w - item.price);
      setInventory((inv) => [...inv, item.id]);
      core.log("PURCHASE", `${item.name} · ${item.price} coins · ${item.rarity}`);
      showToast(`${item.name} is yours — tap Equip.`);
    },
    confirmPurchase: ({ item }) => {
      setWallet((w) => w + item.coins);
      core.log("PURCHASE_USD", `${item.name} · $${item.usd.toFixed(2)} → +${item.coins} coins · sandbox`);
      setPurchase(null);
      showToast(`+${item.coins.toLocaleString()} coins added.`);
    },
    equip: (kind, id) => {
      setMe((m) => (kind === "banners" ? { ...m, banner: id } : { ...m, companion: id }));
      core.log("EQUIP", `${kind}:${id}`); showToast("Equipped ✓");
    },
    post: ({ activity, photo, caption, withIds }) => {
      const first = !postedToday;
      const newPost = { id: `you-${Date.now()}`, author: "you", time: "Just now", place: "Right here", activity, caption, photo, likes: 0, liked: false, likedBy: null, reactions: {} };
      setPosts((ps) => [newPost, ...ps]);
      core.log("POST_CREATED", activity);
      setComposerOpen(false); setTab("feed");
      if (!first) { showToast("Posted! Today was already counted."); return; }
      setWallet((w) => w + 10); core.log("COINS", "+10 · showed up today");
      setHistory((h) => ({ ...h, 7: { ...h[7], 1: { activity, photo } } }));
      setMe((m) => ({ ...m, daysWeek: Math.min(7, m.daysWeek + 1) }));
      /* pairwise ticks + shared milestones */
      const pplNow = Object.fromEntries(friends.map((f) => [f.id, f]));
      const together = new Set(posts.filter((p) => !p.type && p.author !== "you").map((p) => p.author));
      withIds.forEach((id) => together.add(id));
      let hit = null;
      setPairs((pp) => {
        const n = { ...pp };
        together.forEach((id) => { n[id] = (n[id] || 0) + 1; if (!hit && PAIR_MS.includes(n[id]) && pplNow[id]) hit = { friend: pplNow[id], n: n[id] }; });
        return n;
      });
      core.log("PAIR_TICK", [...together].join(", "));
      /* progress → unlock detection against the full catalog */
      const after = (progress[activity] || 0) + 1;
      setProgress((pr) => ({ ...pr, [activity]: after }));
      const ti = TIER_DAYS.indexOf(after);
      let unlocked = null;
      if (ti >= 0) {
        unlocked = { activity, tier: ti + 1, name: CATALOG[activity]?.[ti] || `Tier ${ti + 1}` };
        setWallet((w) => w + 15); core.log("COINS", "+15 · badge unlocked");
        core.log("BADGE_UNLOCKED", `${unlocked.name} · ${activity} T${ti + 1}`);
        setPosts((ps) => [ps[0], { id: `msyou-${Date.now()}`, type: "milestone", author: "you", time: "now", text: `You unlocked ${unlocked.name}`, sub: `${after} days of ${activity.toLowerCase()}, all-time — shared with friends`, activity, tier: ti + 1, hype: 0 }, ...ps.slice(1)]);
        core.log("MILESTONE_BROADCAST", unlocked.name);
        setTimeout(() => setSpot({ ...unlocked, locked: false }), 700);
      } else {
        const ni = TIER_DAYS.findIndex((t) => t > after);
        if (ni >= 0 && TIER_DAYS[ni] - after === 1) setTimeout(() => showToast(`One more ${activity.toLowerCase()} day and you unlock ${CATALOG[activity][ni]}.`), 2400);
      }
      if (hit) {
        core.log("PAIR_MILESTONE", `you + ${hit.friend.name.toLowerCase()} · ${hit.n} days`);
        setTimeout(() => setCele(hit), unlocked ? 3200 : 1100);
      }
      if (withIds.length) core.log("TAGGED", withIds.join(", "));
      showToast("Counted — you showed up. ✓");
    },
  };

  /* ── shell ── */
  return (
    <div ref={rootRef} className="app-root relative w-full flex justify-center overflow-hidden" style={{ height: "var(--app-height, 100vh)", background: C.paper }}>
      <style>{`
        @keyframes bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes heartPop { 0% { transform: scale(0.4); opacity: 0; } 30% { transform: scale(1.15); opacity: 1; } 70% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.3); opacity: 0; } }
        @keyframes sheetUp { from { transform: translateY(26px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes toastUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes spotIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes slideL { from { transform: translateX(26px); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
        @keyframes storyFill { from { width: 0%; } to { width: 100%; } }
        @keyframes slideR { from { transform: translateX(-26px); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
        @keyframes cardIn { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @supports (height: 100dvh) { .app-root { height: 100dvh !important; } }
        .no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; }
        button, input, a { touch-action: manipulation; } body { -webkit-text-size-adjust: 100%; }
      `}</style>
      <div className="relative w-full h-full overflow-hidden flex flex-col" style={{ maxWidth: 520, background: C.paper, paddingTop: "env(safe-area-inset-top)", ...TYPE }}>
        {!session || !me ? (
          <AuthFlow core={core} onDone={onAuth} />
        ) : (
          <>
            <div key={tab} className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: "calc(78px + env(safe-area-inset-bottom))", animation: slideDir ? `slide${slideDir} 0.22s ease both` : undefined }} {...tabSwipe}>
              {tab === "feed" && <FeedScreen st={st} act={act} />}
              {tab === "friends" && <FriendsScreen st={st} act={act} />}
              {tab === "featured" && <FeaturedScreen st={st} act={act} />}
              {tab === "profile" && <ProfileScreen st={st} act={act} />}
            </div>
            <BottomNav tab={tab} setTab={setTab} onCompose={() => setComposerOpen(true)} />

            {friendView && <FriendSheet person={friendView} pairs={pairs} onClose={() => setFriendView(null)} />}
            {historyOpen && <HistorySheet st={st} onClose={() => setHistoryOpen(false)} />}
            {eventsOpen && <EventsSheet st={st} act={act} initialView={eventsView} onClose={() => { setEventsOpen(false); setEventsView("list"); }} />}
            {memoryView && <MemoryStory post={memoryView} onClose={() => setMemoryView(null)} />}
            {shopOpen && <ShopSheet st={st} act={act} onClose={() => setShopOpen(false)} />}
            {bannerEditOpen && <BannerEditor st={st} act={act} onClose={() => setBannerEditOpen(false)} />}
            {wrappedOpen && <WrappedSheet st={st} onClose={() => setWrappedOpen(false)} onShare={() => { core.log("WRAP_SHARED", "June share card"); setWrappedOpen(false); showToast("Share card saved."); }} />}
            {nominateOpen && <NominateSheet st={st} initialPost={nominateSeed} onPick={act.nominate} onClose={() => { setNominateOpen(false); setNominateSeed(null); }} />}
            {progressOpen && <ProgressScreen st={st} act={{ ...act, openJourney: (a) => setJourneyFor(a) }} onClose={() => setProgressOpen(false)} />}
            {journeyFor && <JourneyScreen activity={journeyFor} count={progress[journeyFor] || 0} onSpotlight={(b) => setSpot(b)} onClose={() => setJourneyFor(null)} />}
            {notifOpen && <NotifSheet st={st} act={{ ...act, accept: (r) => { act.accept(r); }, spotlight: (b) => { setSpot({ ...b, locked: false }); } }} onClose={() => setNotifOpen(false)} />}
            {composerOpen && <ComposerSheet st={st} core={core} onPost={act.post} onClose={() => setComposerOpen(false)} />}
            {commentsFor && <CommentsSheet postId={commentsFor} st={st} core={core} onAdd={act.addComment} onLikeComment={act.likeComment} onClose={() => setCommentsFor(null)} onOpenPerson={(id) => { setCommentsFor(null); act.openPerson(id); }} />}
            {settingsOpen && <SettingsSheet st={st} core={core} act={act} onClose={() => setSettingsOpen(false)} />}
            {purchase && <PurchaseSheet purchase={purchase} me={me} onConfirm={act.confirmPurchase} onClose={() => setPurchase(null)} />}
            {spot && <Spotlight badge={spot} count={progress[spot.activity] || 0} onClose={() => setSpot(null)} />}
            {cele && me && <PairCele cele={cele} me={me} onClose={() => setCele(null)} />}
          </>
        )}
        <Toast toast={toast} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <CrashGuard>
      <AppInner />
    </CrashGuard>
  );
}
