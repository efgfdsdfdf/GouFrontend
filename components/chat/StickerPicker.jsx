import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
const STICKERS = [
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Midnight",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Cuddles",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Bella",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Jack",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Trouble",
    "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Missy",
];
export const StickerPicker = ({ onSelect, onClose }) => {
    return (_jsxs("div", { className: "absolute bottom-16 left-2 z-50 w-64 bg-[#111114] border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-200", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("h3", { className: "text-sm font-bold text-white", children: "Stickers" }), _jsx("button", { onClick: onClose, className: "text-white/50 hover:text-white", children: "\u00D7" })] }), _jsx("div", { className: "grid grid-cols-4 gap-2 h-48 overflow-y-auto pr-1", children: STICKERS.map((sticker, idx) => (_jsx("button", { onClick: () => onSelect(sticker), className: "aspect-square bg-white/5 rounded-xl hover:bg-white/10 hover:scale-110 transition-all p-2", children: _jsx("img", { src: sticker, alt: "Sticker", className: "w-full h-full object-contain" }) }, idx))) })] }));
};
