import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
export const GoUnionLoader = ({ fullscreen = true, message = "Loading GoUnion...", }) => {
    const wrapperClasses = fullscreen
        ? "fixed inset-0 z-[120] bg-[#030303]/95 backdrop-blur-sm flex items-center justify-center px-6"
        : "w-full flex items-center justify-center px-6 py-10";
    return (_jsx("div", { className: wrapperClasses, role: "status", "aria-live": "polite", "aria-busy": "true", children: _jsxs("div", { className: "glass-panel rounded-3xl px-8 py-10 text-center min-w-[280px] max-w-sm w-full", children: [_jsx("div", { className: "mx-auto w-16 h-16 rounded-2xl bg-white text-black flex items-center justify-center font-serif font-black text-3xl animate-pulse", children: "G" }), _jsx("div", { className: "mt-6 flex items-center justify-center gap-1.5 text-[0.88rem] font-semibold tracking-[0.32em] text-white/95", children: "GOUNION".split("").map((letter, index) => (_jsx("span", { className: "inline-block animate-bounce", style: { animationDelay: `${index * 70}ms`, animationDuration: "0.95s" }, children: letter }, `${letter}-${index}`))) }), _jsx("p", { className: "mt-4 text-xs uppercase tracking-[0.2em] text-zinc-400", children: message })] }) }));
};
