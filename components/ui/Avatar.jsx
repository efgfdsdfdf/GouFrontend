import { jsx as _jsx } from "react/jsx-runtime";
import React from "react";
export const Avatar = ({ src, alt = "", label = "G", className = "" }) => {
    if (src) {
        return (_jsx("img", { src: src, alt: alt, className: className, referrerPolicy: "no-referrer" }));
    }
    return (_jsx("div", { className: `${className} flex items-center justify-center bg-white/5 text-white/35 font-black uppercase`, "aria-label": alt, title: alt, children: label.slice(0, 1) }));
};
