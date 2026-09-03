"use client";

import { useEffect, useRef, useState } from "react";

const videoId = "DjMu_4O_EYk";
const embedUrl =
  `https://www.youtube-nocookie.com/embed/${videoId}` +
  `?enablejsapi=1&autoplay=1&controls=0&loop=1&playlist=${videoId}` +
  "&playsinline=1&rel=0&modestbranding=1";

function sendPlayerCommand(frame: HTMLIFrameElement | null, command: string) {
  frame?.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func: command, args: [] }),
    "https://www.youtube-nocookie.com",
  );
}

export function BackgroundMusic({
  suspended = false,
}: {
  suspended?: boolean;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      sendPlayerCommand(
        frameRef.current,
        isPlaying && !suspended ? "playVideo" : "pauseVideo",
      );
    }, 240);
    return () => window.clearTimeout(timer);
  }, [isPlaying, suspended]);

  useEffect(() => {
    if (!isPlaying || suspended) return;

    const resumeWithSound = () => {
      sendPlayerCommand(frameRef.current, "unMute");
      sendPlayerCommand(frameRef.current, "playVideo");
      window.removeEventListener("pointerdown", resumeWithSound);
      window.removeEventListener("keydown", resumeWithSound);
    };

    window.addEventListener("pointerdown", resumeWithSound);
    window.addEventListener("keydown", resumeWithSound);
    return () => {
      window.removeEventListener("pointerdown", resumeWithSound);
      window.removeEventListener("keydown", resumeWithSound);
    };
  }, [isPlaying, suspended]);

  function toggleMusic() {
    const nextIsPlaying = !isPlaying;
    setIsPlaying(nextIsPlaying);
    sendPlayerCommand(
      frameRef.current,
      nextIsPlaying && !suspended ? "playVideo" : "pauseVideo",
    );
  }

  return (
    <div
      className="background-music"
      data-playing={isPlaying}
      data-suspended={suspended}
    >
      <iframe
        ref={frameRef}
        src={embedUrl}
        title="Musik latar undangan"
        allow="autoplay; encrypted-media"
        aria-hidden="true"
        tabIndex={-1}
        loading="eager"
        onLoad={() => {
          if (isPlaying && !suspended)
            sendPlayerCommand(frameRef.current, "playVideo");
        }}
      />
      <button
        type="button"
        className="background-music-toggle"
        aria-label={isPlaying ? "Matikan musik" : "Nyalakan musik"}
        aria-pressed={isPlaying}
        onClick={toggleMusic}
      >
        <span aria-hidden="true" className="background-music-icon">
          {isPlaying ? "♫" : "♪"}
        </span>
        <span className="background-music-status">
          {isPlaying ? "Musik menyala" : "Putar musik"}
        </span>
      </button>
    </div>
  );
}
