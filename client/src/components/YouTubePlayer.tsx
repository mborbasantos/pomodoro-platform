/**
 * YouTubePlayer — Background music player for YouTube videos
 * Design: Retro-Futurist Dashboard
 * Features: Play/pause, volume control, playlist of popular focus videos
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Search, X, Music, Volume1 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface YouTubePlayerProps {
  url?: string;
  volume: number;
  onVolumeChange: (v: number) => void;
  onUrlChange: (url: string) => void;
  enabled: boolean;
}

// Popular focus music playlists
const POPULAR_VIDEOS = [
  { label: "Lo-fi Hip Hop", url: "https://www.youtube.com/embed/jfKfPfyJRdk" },
  { label: "Chill Beats", url: "https://www.youtube.com/embed/5qap5aO4i9A" },
  { label: "Deep Focus", url: "https://www.youtube.com/embed/lFcSrYw-ARY" },
  { label: "Study Music", url: "https://www.youtube.com/embed/MtSE4rglZbY" },
  { label: "Piano Focus", url: "https://www.youtube.com/embed/Xo_dYHrwYEQ" },
  { label: "Ambient", url: "https://www.youtube.com/embed/jfKfPfyJRdk" },
];

function extractYouTubeId(url: string): string | null {
  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getEmbedUrl(url: string, autoplay: boolean = false): string | null {
  const id = extractYouTubeId(url);
  if (!id) return null;
  // CRITICAL: enablejsapi=1 is required for postMessage commands to work
  // origin parameter helps with CORS and security
  const origin = encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '');
  return `https://www.youtube.com/embed/${id}?enablejsapi=1&origin=${origin}&autoplay=${autoplay ? 1 : 0}&controls=0&modestbranding=1&rel=0&fs=0&playsinline=1`;
}

export interface YouTubePlayerRef {
  triggerFade: (direction: "out" | "in") => void;
}

export default function YouTubePlayer({
  url,
  volume,
  onVolumeChange,
  onUrlChange,
  enabled,
}: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [fadeState, setFadeState] = useState<"idle" | "fade-out" | "fade-in">("idle");
  const [shouldAutoplay, setShouldAutoplay] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReadyRef = useRef(false);

  useEffect(() => {
    if (url) {
      const embed = getEmbedUrl(url, shouldAutoplay);
      setEmbedUrl(embed);
      setFadeState("idle");
    }
  }, [url, shouldAutoplay]);

  // Control volume via postMessage
  useEffect(() => {
    if (!iframeRef.current) return;
    try {
      console.log("[YouTubePlayer] Setting volume to", volume);
      // YouTube IFrame API expects JSON string format with enablejsapi=1
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "setVolume", args: [volume] }),
        "*"
      );
    } catch (e) {
      console.error("[YouTubePlayer] Volume control failed:", e);
    }
  }, [volume]);

  // Trigger fade animation
  const triggerFade = (direction: "out" | "in") => {
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    setFadeState(direction === "out" ? "fade-out" : "fade-in");
    fadeTimeoutRef.current = setTimeout(() => {
      setFadeState("idle");
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onUrlChange(searchInput.trim());
      setSearchInput("");
      setShowPlaylist(false);
      setIsPlaying(true);
      setShouldAutoplay(true);
    }
  };

  const handleSelectPreset = (presetUrl: string) => {
    onUrlChange(presetUrl);
    setShowPlaylist(false);
    setIsPlaying(true);
    setShouldAutoplay(true);
  };

  // Expose play/pause methods for external control - MEMOIZED to prevent stale closures
  const play = useCallback(() => {
    console.log("[YouTubePlayer] play() called, iframeRef.current:", iframeRef.current ? "exists" : "null", "isReady:", isReadyRef.current);
    if (iframeRef.current) {
      try {
        console.log("[YouTubePlayer] Sending playVideo command");
        // YouTube IFrame API expects JSON string format with enablejsapi=1
        // Add a small delay to ensure iframe is ready for postMessage
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "playVideo", args: [] }),
            "*"
          );
        }, 50);
        setIsPlaying(true);
      } catch (e) {
        console.error("[YouTubePlayer] Play failed:", e);
      }
    } else {
      console.warn("[YouTubePlayer] play() called but iframeRef.current is null");
    }
  }, []);

  const pause = useCallback(() => {
    console.log("[YouTubePlayer] pause() called, iframeRef.current:", iframeRef.current ? "exists" : "null", "isReady:", isReadyRef.current);
    if (iframeRef.current) {
      try {
        console.log("[YouTubePlayer] Sending pauseVideo command");
        // YouTube IFrame API expects JSON string format with enablejsapi=1
        // Add a small delay to ensure iframe is ready for postMessage
        setTimeout(() => {
          iframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
            "*"
          );
        }, 50);
        setIsPlaying(false);
      } catch (e) {
        console.error("[YouTubePlayer] Pause failed:", e);
      }
    } else {
      console.warn("[YouTubePlayer] pause() called but iframeRef.current is null");
    }
  }, []);

  // Expose methods via window for global access - stable reference
  useEffect(() => {
    (window as any).__youtubePlayer = { play, pause };
    console.log("[YouTubePlayer] Exported play/pause to window.__youtubePlayer");
  }, [play, pause]);

  if (!enabled) {
    return (
      <div className="card-neon rounded-xl p-4 text-center">
        <Music className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-xs text-white/30">Background music disabled</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Player display with fade wrapper */}
      {embedUrl ? (
        <div className={cn(
          "card-neon rounded-xl overflow-hidden transition-opacity duration-800",
          fadeState === "fade-out" ? "opacity-30" : fadeState === "fade-in" ? "opacity-100" : "opacity-100"
        )}>
          <div className="relative w-full bg-black" style={{ paddingBottom: "56.25%" }}>
            <iframe
              ref={iframeRef}
              className="absolute inset-0 w-full h-full"
              src={embedUrl}
              title="Background Music"
              allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; microphone"
              allowFullScreen
              sandbox="allow-same-origin allow-scripts allow-presentation"
              onLoad={() => {
                console.log("[YouTubePlayer] iframe onLoad fired, marking as ready");
                isReadyRef.current = true;
              }}
            />
          </div>
        </div>
      ) : (
        <div className="card-neon rounded-xl p-6 text-center">
          <Music className="w-8 h-8 text-white/20 mx-auto mb-2" />
          <p className="text-xs text-white/30">No video selected</p>
        </div>
      )}

      {/* Controls */}
      <div className="card-neon rounded-xl p-3 space-y-3">
        {/* URL input */}
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <Input
            placeholder="Paste YouTube URL or search..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 text-xs h-8"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!searchInput.trim()}
            className="btn-neon h-8 px-3 text-xs flex-shrink-0"
          >
            <Search className="w-3 h-3" />
          </Button>
        </form>

        {/* Volume control with fade indicator */}
        <div className="flex items-center gap-2">
          {fadeState === "fade-out" ? (
            <VolumeX className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
          ) : fadeState === "fade-in" ? (
            <Volume1 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 animate-pulse" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          )}
          <Slider
            value={[volume]}
            onValueChange={([v]) => onVolumeChange(v)}
            min={0}
            max={100}
            step={5}
            className="flex-1 [&_[role=slider]]:bg-cyan-400 [&_[role=slider]]:border-cyan-500"
          />
          <span className="text-xs text-white/30 w-6 text-right">{volume}%</span>
        </div>

        {/* Play/Pause button */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (iframeRef.current) {
                try {
                  iframeRef.current.contentWindow?.postMessage(
                    JSON.stringify({ event: "command", func: "playVideo", args: [] }),
                    "*"
                  );
                  setIsPlaying(true);
                } catch {}
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/60 hover:bg-cyan-500/30 text-xs text-cyan-300 hover:text-cyan-200 transition-all"
          >
            <Play className="w-3 h-3" />
            Play
          </button>
          <button
            onClick={() => {
              if (iframeRef.current) {
                try {
                  iframeRef.current.contentWindow?.postMessage(
                    JSON.stringify({ event: "command", func: "pauseVideo", args: [] }),
                    "*"
                  );
                  setIsPlaying(false);
                } catch {}
              }
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-all"
          >
            <Pause className="w-3 h-3" />
            Pause
          </button>
        </div>

        {/* Preset buttons */}
        <div className="relative">
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-cyan-500/30 hover:bg-cyan-500/10 text-xs text-white/60 hover:text-cyan-300 transition-all"
          >
            <Music className="w-3 h-3" />
            Popular Playlists
          </button>

          {showPlaylist && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg p-2 z-10 space-y-1">
              {POPULAR_VIDEOS.map((video, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectPreset(video.url)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  {video.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info with fade status */}
        <p className="text-xs text-white/20 text-center">
          {fadeState === "fade-out" ? "🔇 Fading out..." : fadeState === "fade-in" ? "🔊 Fading in..." : embedUrl ? "🎵 Ready (plays on focus)" : "Paste a YouTube URL to start"}
        </p>
      </div>
    </div>
  );
}
