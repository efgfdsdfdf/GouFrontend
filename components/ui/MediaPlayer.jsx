import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Maximize2, Minimize2, X } from "lucide-react";
// ─── Helpers ──────────────────────────────────────────────
const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "mov", "mkv", "avi", "m4v"];
export function isVideoUrl(url) {
    if (!url)
        return false;
    const clean = url.split("?")[0].toLowerCase();
    const ext = clean.split(".").pop() ?? "";
    return VIDEO_EXTENSIONS.includes(ext);
}
function formatTime(s) {
    if (!isFinite(s) || isNaN(s))
        return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
}
export const ImageViewer = ({ src, alt = "Post image", onLoad }) => {
    const [lightbox, setLightbox] = useState(false);
    const [loaded, setLoaded] = useState(false);
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "relative overflow-hidden rounded-3xl cursor-zoom-in group/img", style: { background: "linear-gradient(135deg,#0d0d0f 0%,#111116 100%)" }, onClick: () => setLightbox(true), children: [!loaded && (_jsxs("div", { className: "w-full h-72 flex flex-col items-center justify-center gap-3", children: [_jsx("div", { className: "w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" }), _jsx("span", { className: "text-[11px] font-bold text-zinc-600 uppercase tracking-widest", children: "Loading" })] })), _jsx("img", { src: src, alt: alt, onLoad: () => {
                            setLoaded(true);
                            onLoad?.();
                        }, className: `w-full object-cover max-h-[540px] transition-all duration-700 ${loaded ? "opacity-100 scale-100" : "opacity-0 scale-105 absolute inset-0"} group-hover/img:scale-[1.02]` }), loaded && (_jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" })), loaded && (_jsx(motion.div, { initial: { opacity: 0, scale: 0.8 }, whileHover: { scale: 1.05 }, className: "absolute top-3 right-3 opacity-0 group-hover/img:opacity-100 transition-all duration-300", children: _jsxs("div", { className: "bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-1.5 flex items-center gap-1.5", children: [_jsx(Maximize2, { size: 12, className: "text-blue-400" }), _jsx("span", { className: "text-[10px] font-black text-white uppercase tracking-widest", children: "Expand" })] }) })), _jsx("div", { className: "absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl", style: { boxShadow: "inset 0 0 60px rgba(59,130,246,0.05)" } })] }), _jsx(AnimatePresence, { children: lightbox && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.25 }, className: "fixed inset-0 z-[9999] flex items-center justify-center p-4", style: { background: "rgba(0,0,0,0.96)", backdropFilter: "blur(24px)" }, onClick: () => setLightbox(false), children: [_jsx("div", { className: "absolute inset-0 pointer-events-none", style: { background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)" } }), _jsx(motion.img, { initial: { scale: 0.88, opacity: 0, y: 12 }, animate: { scale: 1, opacity: 1, y: 0 }, exit: { scale: 0.88, opacity: 0, y: 12 }, transition: { type: "spring", damping: 26, stiffness: 300 }, src: src, alt: alt, className: "max-w-full max-h-[90vh] object-contain rounded-3xl shadow-2xl", style: { boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(59,130,246,0.08)" }, onClick: (e) => e.stopPropagation() }), _jsx(motion.button, { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.1 }, onClick: () => setLightbox(false), className: "absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-2xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all backdrop-blur-xl", children: _jsx(X, { size: 18 }) })] })) })] }));
};
export const VideoPlayer = ({ src, onLoadedData, autoPlayOnVisible, objectCover, maxHeight }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const progressRef = useRef(null);
    const hideTimer = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false); // start unmuted for UX
    const [volume, setVolume] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [buffering, setBuffering] = useState(true);
    const [showControls, setShowControls] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [tapIcon, setTapIcon] = useState(null);
    const tapTimer = useRef(null);
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;
    // ── Play / Pause ─────────────────────────────────────────
    const togglePlay = useCallback(() => {
        const v = videoRef.current;
        if (!v)
            return;
        if (v.paused) {
            v.play().then(() => setPlaying(true)).catch(() => { });
        }
        else {
            v.pause();
            setPlaying(false);
        }
    }, []);
    // ── Mute ─────────────────────────────────────────────────
    const toggleMute = useCallback((e) => {
        e.stopPropagation();
        const v = videoRef.current;
        if (!v)
            return;
        v.muted = !v.muted;
        setMuted(v.muted);
    }, []);
    // ── Progress ─────────────────────────────────────────────
    const onPointerDown = (e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDragging(true);
        if (hideTimer.current)
            clearTimeout(hideTimer.current);
        const v = videoRef.current;
        const bar = progressRef.current;
        if (!v || !bar)
            return;
        const rect = bar.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        v.currentTime = ratio * v.duration;
        setCurrentTime(ratio * v.duration);
    };
    const onPointerMove = (e) => {
        if (!e.currentTarget.hasPointerCapture(e.pointerId))
            return;
        if (hideTimer.current)
            clearTimeout(hideTimer.current);
        const v = videoRef.current;
        const bar = progressRef.current;
        if (!v || !bar)
            return;
        const rect = bar.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        v.currentTime = ratio * v.duration;
        setCurrentTime(ratio * v.duration);
    };
    const onPointerUp = (e) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        setIsDragging(false);
    };
    // ── Volume ────────────────────────────────────────────────
    const onVolumeChange = (e) => {
        const v = videoRef.current;
        if (!v)
            return;
        const val = Number(e.target.value);
        v.volume = val;
        v.muted = val === 0;
        setVolume(val);
        setMuted(val === 0);
    };
    // ── Fullscreen ────────────────────────────────────────────
    const toggleFullscreen = (e) => {
        e.stopPropagation();
        const el = containerRef.current;
        if (!el)
            return;
        if (!document.fullscreenElement) {
            el.requestFullscreen();
            setFullscreen(true);
        }
        else {
            document.exitFullscreen();
            setFullscreen(false);
        }
    };
    useEffect(() => {
        const h = () => setFullscreen(!!document.fullscreenElement);
        document.addEventListener("fullscreenchange", h);
        return () => document.removeEventListener("fullscreenchange", h);
    }, []);
    // ── Autoplay on Visible ───────────────────────────────────
    useEffect(() => {
        if (!autoPlayOnVisible || !containerRef.current)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            const v = videoRef.current;
            if (!v)
                return;
            if (entry.isIntersecting) {
                v.play().then(() => setPlaying(true)).catch(() => { });
            }
            else {
                v.pause();
                setPlaying(false);
            }
        }, { threshold: 0.3 });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [autoPlayOnVisible]);
    // ── Auto-hide controls ────────────────────────────────────
    const resetHide = useCallback(() => {
        setShowControls(true);
        if (hideTimer.current)
            clearTimeout(hideTimer.current);
        if (playing && !isDragging) {
            hideTimer.current = setTimeout(() => setShowControls(false), 3000);
        }
    }, [playing, isDragging]);
    useEffect(() => () => { if (hideTimer.current)
        clearTimeout(hideTimer.current); }, []);
    useEffect(() => {
        if (!playing || isDragging) {
            setShowControls(true);
            if (hideTimer.current)
                clearTimeout(hideTimer.current);
        }
        else {
            resetHide();
        }
    }, [playing, isDragging, resetHide]);
    // ── Tap icon flash (TikTok style) ─────────────────────────
    const flashTapIcon = (icon) => {
        setTapIcon(icon);
        if (tapTimer.current)
            clearTimeout(tapTimer.current);
        tapTimer.current = setTimeout(() => setTapIcon(null), 600);
    };
    useEffect(() => () => { if (tapTimer.current)
        clearTimeout(tapTimer.current); }, []);
    return (_jsxs("div", { ref: containerRef, className: "relative overflow-hidden rounded-3xl select-none w-full", style: { background: "#000", maxHeight: maxHeight || undefined }, onClick: (e) => {
            const v = videoRef.current;
            if (!v)
                return;
            if (v.paused) {
                v.play().then(() => setPlaying(true)).catch(() => { });
                flashTapIcon('play');
                if (hideTimer.current)
                    clearTimeout(hideTimer.current);
            }
            else {
                v.pause();
                setPlaying(false);
                flashTapIcon('pause');
                resetHide();
            }
        }, children: [_jsx("video", { ref: videoRef, src: src, className: `w-full h-full ${objectCover !== false ? 'object-cover' : 'object-contain'}`, muted: muted, playsInline: true, preload: "metadata", onTimeUpdate: () => {
                    const v = videoRef.current;
                    if (!v)
                        return;
                    setCurrentTime(v.currentTime);
                    if (v.buffered.length)
                        setBuffered(v.buffered.end(v.buffered.length - 1));
                }, onLoadedData: onLoadedData, onLoadedMetadata: () => {
                    setDuration(videoRef.current?.duration ?? 0);
                    setBuffering(false);
                }, onWaiting: () => setBuffering(true), onCanPlay: () => { setBuffering(false); onLoadedData?.(); }, onEnded: () => { setPlaying(false); setShowControls(true); } }), _jsx("div", { className: "absolute inset-0 pointer-events-none rounded-3xl", style: { boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" } }), _jsx(AnimatePresence, { children: buffering && !playing && (_jsx(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: _jsx("div", { className: "w-14 h-14 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" }) })) }), _jsx(AnimatePresence, { children: tapIcon && (_jsx(motion.div, { initial: { scale: 1.2, opacity: 0.9 }, animate: { scale: 1, opacity: 0 }, exit: { opacity: 0 }, transition: { duration: 0.5, ease: "easeOut" }, className: "absolute inset-0 flex items-center justify-center pointer-events-none z-30", children: _jsx("div", { className: "w-16 h-16 rounded-full flex items-center justify-center", style: {
                            background: "rgba(0,0,0,0.5)",
                            backdropFilter: "blur(12px)",
                        }, children: tapIcon === 'pause'
                            ? _jsx(Pause, { size: 28, className: "text-white fill-white" })
                            : _jsx(Play, { size: 28, className: "text-white fill-white ml-1" }) }) }, tapIcon)) }), _jsx(AnimatePresence, { children: !playing && !buffering && !tapIcon && (_jsxs(motion.div, { initial: { scale: 0.6, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.6, opacity: 0 }, transition: { type: "spring", stiffness: 400, damping: 22 }, className: "absolute inset-0 flex items-center justify-center pointer-events-none", children: [_jsx("div", { className: "absolute w-20 h-20 rounded-full", style: { background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)" } }), _jsx("div", { className: "relative w-16 h-16 rounded-full flex items-center justify-center", style: {
                                background: "rgba(0,0,0,0.6)",
                                backdropFilter: "blur(16px)",
                                border: "1.5px solid rgba(255,255,255,0.15)",
                                boxShadow: "0 0 40px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
                            }, children: _jsx(Play, { size: 22, className: "text-white fill-white ml-1" }) })] })) }), _jsx(AnimatePresence, { children: showControls && (_jsxs(motion.div, { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0.18 }, className: "absolute bottom-0 left-0 right-0 px-3 pb-3 pt-10", style: {
                        background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)",
                    }, onClick: (e) => e.stopPropagation(), children: [_jsx("div", { className: "relative cursor-pointer py-4 -my-4", style: { touchAction: "none" }, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, children: _jsxs("div", { ref: progressRef, className: "relative h-[6px] rounded-full pointer-events-none", style: { background: "rgba(255,255,255,0.15)" }, children: [_jsx("div", { className: "absolute inset-y-0 left-0 rounded-full", style: { width: `${bufferedPct}%`, background: "rgba(255,255,255,0.2)" } }), _jsx("div", { className: "absolute inset-y-0 left-0 rounded-full", style: {
                                            width: `${progress}%`,
                                            background: "linear-gradient(90deg, #3b82f6, #60a5fa)"
                                        } }), _jsx("div", { className: "absolute top-1/2 -translate-y-1/2 -translate-x-1/2", style: { left: `${progress}%` }, children: _jsx("div", { className: "w-4 h-4 rounded-full bg-white", style: { boxShadow: "0 0 10px rgba(59,130,246,0.8), 0 2px 6px rgba(0,0,0,0.5)" } }) })] }) }), _jsxs("div", { className: "flex items-center gap-1 mt-2", children: [_jsx("div", { className: "flex-1 flex justify-center", children: _jsxs("div", { className: "flex items-center gap-1.5 opacity-40", children: [_jsx("div", { className: "w-1 h-1 rounded-full bg-blue-400" }), _jsx("span", { className: "text-[9px] font-black text-white uppercase tracking-[0.15em]", children: "GoUnion" }), _jsx("div", { className: "w-1 h-1 rounded-full bg-blue-400" })] }) }), _jsx("button", { onClick: toggleFullscreen, className: "w-8 h-8 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all", children: fullscreen ? _jsx(Minimize2, { size: 15 }) : _jsx(Maximize2, { size: 15 }) })] })] })) })] }));
};
export const MediaPlayer = ({ url, alt, onLoad, onLoadedData, autoPlayOnVisible, objectCover, maxHeight }) => isVideoUrl(url) ? _jsx(VideoPlayer, { src: url, onLoadedData: onLoadedData, autoPlayOnVisible: autoPlayOnVisible, objectCover: objectCover, maxHeight: maxHeight }) : _jsx(ImageViewer, { src: url, alt: alt, onLoad: onLoad });
