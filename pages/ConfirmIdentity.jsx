import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";
export const ConfirmIdentity = () => {
    return (_jsx("div", { className: "min-h-screen bg-[#030303] text-white flex items-center justify-center p-4", children: _jsxs("div", { className: "glass-panel p-8 md:p-12 rounded-[2.5rem] max-w-md w-full text-center border border-white/10 shadow-2xl", children: [_jsx("div", { className: "w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx(CheckCircle, { size: 40, className: "text-primary" }) }), _jsx("h1", { className: "text-3xl font-black mb-4 tracking-tighter", children: "Identity Confirmed!" }), _jsx("p", { className: "text-zinc-400 mb-8 leading-relaxed", children: "Your email has been successfully verified. You can now close this window and return to the GoUnion App to continue." }), _jsx(Link, { to: "/login", className: "block w-full py-4 bg-white text-black font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-white/90 transition-colors", children: "Return to Login" })] }) }));
};
