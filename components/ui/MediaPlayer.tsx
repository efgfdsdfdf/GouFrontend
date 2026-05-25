import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Volume2, VolumeX, Maximize2, Minimize2, X } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────
const VIDEO_EXTENSIONS = ["mp4", "webm", "ogg", "mov", "mkv", "avi", "m4v"];

export function isVideoUrl(url: string): boolean {
  if (!url) return false;
  const clean = url.split("?")[0].toLowerCase();
  const ext = clean.split(".").pop() ?? "";
  return VIDEO_EXTENSIONS.includes(ext);
}

function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Image Lightbox ─────────────────────────────────────────
interface ImageViewerProps {
  src: string;
  alt?: string;
  onLoad?: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt = "Post image", onLoad }) => {
  const [lightbox, setLightbox] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {/* Thumbnail */}
      <div
        className="relative overflow-hidden rounded-3xl cursor-zoom-in group/img"
        style={{ background: "linear-gradient(135deg,#0d0d0f 0%,#111116 100%)" }}
        onClick={() => setLightbox(true)}
      >
        {!loaded && (
          <div className="w-full h-72 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-widest">Loading</span>
          </div>
        )}

        <img
          src={src}
          alt={alt}
          onLoad={() => {
            setLoaded(true);
            onLoad?.();
          }}
          className={`w-full object-cover max-h-[540px] transition-all duration-700 ${
            loaded ? "opacity-100 scale-100" : "opacity-0 scale-105 absolute inset-0"
          } group-hover/img:scale-[1.02]`}
        />

        {/* Overlay gradient */}
        {loaded && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        )}

        {/* Zoom badge */}
        {loaded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            className="absolute top-3 right-3 opacity-0 group-hover/img:opacity-100 transition-all duration-300"
          >
            <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-3 py-1.5 flex items-center gap-1.5">
              <Maximize2 size={12} className="text-blue-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">Expand</span>
            </div>
          </motion.div>
        )}

        {/* Blue glow on hover */}
        <div className="absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"
          style={{ boxShadow: "inset 0 0 60px rgba(59,130,246,0.05)" }} />
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.96)", backdropFilter: "blur(24px)" }}
            onClick={() => setLightbox(false)}
          >
            {/* Glow background */}
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.06) 0%, transparent 70%)" }} />

            <motion.img
              initial={{ scale: 0.88, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 12 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              src={src}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain rounded-3xl shadow-2xl"
              style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.8), 0 0 60px rgba(59,130,246,0.08)" }}
              onClick={(e) => e.stopPropagation()}
            />

            {/* Close button */}
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              onClick={() => setLightbox(false)}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-2xl border border-white/10 text-white/70 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all backdrop-blur-xl"
            >
              <X size={18} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Video Player ──────────────────────────────────────────
interface VideoPlayerProps {
  src: string;
  onLoadedData?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, onLoadedData }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true); // start muted for autoplay UX
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  // ── Play / Pause ─────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }, []);

  // ── Mute ─────────────────────────────────────────────────
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  // ── Progress ─────────────────────────────────────────────
  const seekTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    v.currentTime = ratio * v.duration;
  };

  // ── Volume ────────────────────────────────────────────────
  const onVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const val = Number(e.target.value);
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  // ── Fullscreen ────────────────────────────────────────────
  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) { el.requestFullscreen(); setFullscreen(true); }
    else { document.exitFullscreen(); setFullscreen(false); }
  };

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  // ── Auto-hide controls ────────────────────────────────────
  const resetHide = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowControls(false), 2500);
  }, []);

  useEffect(() => () => { if (hideTimer.current) clearTimeout(hideTimer.current); }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl select-none"
      style={{ background: "#000", aspectRatio: "16/9", maxHeight: 540 }}
      onMouseMove={resetHide}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => { if (playing) setShowControls(false); }}
      onClick={togglePlay}
    >
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        muted={muted}
        playsInline
        preload="metadata"
        onTimeUpdate={() => {
          const v = videoRef.current;
          if (!v) return;
          setCurrentTime(v.currentTime);
          if (v.buffered.length) setBuffered(v.buffered.end(v.buffered.length - 1));
        }}
        onLoadedData={onLoadedData}
        onLoadedMetadata={() => {
          setDuration(videoRef.current?.duration ?? 0);
          setBuffering(false);
        }}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => { setBuffering(false); onLoadedData?.(); }}
        onEnded={() => { setPlaying(false); setShowControls(true); }}
      />

      {/* BluBG subtle glow */}
      <div className="absolute inset-0 pointer-events-none rounded-3xl"
        style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)" }} />

      {/* Buffering ring */}
      <AnimatePresence>
        {buffering && !playing && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-14 h-14 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centre play/pause pulse */}
      <AnimatePresence>
        {!playing && !buffering && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Outer ring glow */}
            <div className="absolute w-20 h-20 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)" }} />
            <div className="relative w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(16px)",
                border: "1.5px solid rgba(255,255,255,0.15)",
                boxShadow: "0 0 40px rgba(59,130,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)"
              }}
            >
              <Play size={22} className="text-white fill-white ml-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls overlay */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-0 left-0 right-0"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)",
              padding: "40px 16px 14px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Progress track */}
            <div
              ref={progressRef}
              className="relative h-[3px] rounded-full mb-3 cursor-pointer group/prog"
              style={{ background: "rgba(255,255,255,0.15)" }}
              onClick={seekTo}
            >
              {/* Buffered */}
              <div className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${bufferedPct}%`, background: "rgba(255,255,255,0.2)" }} />
              {/* Played */}
              <div className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, #3b82f6, #60a5fa)"
                }} />
              {/* Scrubber dot */}
              <motion.div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover/prog:opacity-100 transition-opacity"
                style={{ left: `${progress}%` }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white"
                  style={{ boxShadow: "0 0 10px rgba(59,130,246,0.8), 0 2px 6px rgba(0,0,0,0.5)" }} />
              </motion.div>
            </div>

            {/* Button row */}
            <div className="flex items-center gap-1">
              {/* Play/Pause */}
              <button
                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                {playing
                  ? <Pause size={16} />
                  : <Play size={16} className="fill-current ml-0.5" />}
              </button>

              {/* Volume cluster */}
              <div
                className="flex items-center gap-1"
                onMouseEnter={() => setShowVolume(true)}
                onMouseLeave={() => setShowVolume(false)}
              >
                <button
                  onClick={toggleMute}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
                >
                  {muted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
                <AnimatePresence>
                  {showVolume && (
                    <motion.div
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 68, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="overflow-hidden flex items-center"
                    >
                      <input
                        type="range"
                        min={0} max={1} step={0.05}
                        value={muted ? 0 : volume}
                        onChange={onVolumeChange}
                        className="w-[68px] h-[3px] cursor-pointer"
                        style={{ accentColor: "#3b82f6" }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Time */}
              <span className="text-[11px] font-bold text-white/50 ml-1 tabular-nums">
                {formatTime(currentTime)}
                <span className="text-white/25 mx-1">/</span>
                {formatTime(duration)}
              </span>

              {/* GoUnion label */}
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-1.5 opacity-40">
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.15em]">GoUnion</span>
                  <div className="w-1 h-1 rounded-full bg-blue-400" />
                </div>
              </div>

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
              >
                {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Muted badge (tap to unmute) */}
      <AnimatePresence>
        {muted && playing && (
          <motion.button
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            onClick={toggleMute}
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
            style={{
              background: "rgba(0,0,0,0.65)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)"
            }}
          >
            <VolumeX size={12} className="text-white/60" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Tap to unmute</span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Auto-detect ───────────────────────────────────────────
interface MediaPlayerProps {
  url: string;
  alt?: string;
  onLoad?: () => void;
  onLoadedData?: () => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ url, alt, onLoad, onLoadedData }) =>
  isVideoUrl(url) ? <VideoPlayer src={url} onLoadedData={onLoadedData} /> : <ImageViewer src={url} alt={alt} onLoad={onLoad} />;
