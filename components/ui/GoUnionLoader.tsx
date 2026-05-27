import React from "react";

type GoUnionLoaderProps = {
  fullscreen?: boolean;
  message?: string;
};

export const GoUnionLoader = ({
  fullscreen = true,
  message = "Loading GoUnion...",
}: GoUnionLoaderProps) => {
  const wrapperClasses = fullscreen
    ? "fixed inset-0 z-[120] bg-[#030303]/95 backdrop-blur-sm flex items-center justify-center px-6"
    : "w-full flex items-center justify-center px-6 py-10";

  return (
    <div className={wrapperClasses} role="status" aria-live="polite" aria-busy="true">
      <div className="glass-panel rounded-3xl px-8 py-10 text-center min-w-[280px] max-w-sm w-full">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center font-serif font-black text-3xl animate-pulse">
          G
        </div>
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[0.88rem] font-semibold tracking-[0.32em] text-white/95">
          {"GOUNION".split("").map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="inline-block animate-bounce"
              style={{ animationDelay: `${index * 70}ms`, animationDuration: "0.95s" }}
            >
              {letter}
            </span>
          ))}
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-400">{message}</p>
      </div>
    </div>
  );
};

