import React from 'react';

export default function BackgroundAura({ darkMode }) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top Left Misty White / Soft Ash Orb */}
      <div
        className={`absolute -top-32 -left-20 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-50 smoke-orb-1 ${
          darkMode ? 'bg-slate-700/20' : 'bg-slate-300/40'
        }`}
      />

      {/* Top Right Smoky Charcoal / Ash Orb */}
      <div
        className={`absolute -top-20 -right-20 w-[28rem] h-[28rem] rounded-full blur-3xl opacity-40 smoke-orb-2 ${
          darkMode ? 'bg-zinc-800/40' : 'bg-slate-200/60'
        }`}
      />

      {/* Center Subtle Liquid Pulse behind Ring */}
      <div
        className={`absolute top-48 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full blur-3xl liquid-pulse-glow ${
          darkMode ? 'bg-slate-600/10' : 'bg-white/80'
        }`}
      />

      {/* Bottom Floating Ash Veil */}
      <div
        className={`absolute -bottom-32 left-1/4 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-35 smoke-orb-1 ${
          darkMode ? 'bg-zinc-800/30' : 'bg-slate-300/30'
        }`}
      />

      {/* Subtle Dot Grid */}
      <div className="absolute inset-0 dot-grid" />
    </div>
  );
}
