"use client";

import { useEffect, useRef, useState } from "react";

type WeddingFilmProps = {
  audioUnlocked: boolean;
  onAudioStateChange: (isUsingVideoAudio: boolean) => void;
};

export function WeddingFilm({
  audioUnlocked,
  onAudioStateChange,
}: WeddingFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting && entry.intersectionRatio >= 0.4);
      },
      { threshold: [0, 0.2, 0.4, 0.6, 1] },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!isInView) {
      video.pause();
      return;
    }

    if (video.ended) video.currentTime = 0;
    setHasEnded(false);

    video.muted = !audioUnlocked;
    setIsMuted(video.muted);

    void video.play().catch(() => {
      // Browsers always permit muted inline autoplay. If sound is rejected,
      // keep the film moving and let the guest enable it explicitly.
      video.muted = true;
      setIsMuted(true);
      void video.play();
    });
  }, [audioUnlocked, isInView]);

  useEffect(() => {
    onAudioStateChange(isInView && isPlaying && !isMuted && !hasEnded);
  }, [hasEnded, isInView, isMuted, isPlaying, onAudioStateChange]);

  useEffect(
    () => () => {
      onAudioStateChange(false);
    },
    [onAudioStateChange],
  );

  return (
    <section
      className="wedding-film scroll-chapter"
      aria-label="Video Alvita dan Ade"
    >
      <div className="wedding-film-stage">
        <video
          ref={videoRef}
          className="wedding-film-video"
          controls
          muted
          playsInline
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setHasEnded(true);
          }}
          onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
        >
          <source src="/videos/alvita-ade-film.mp4" type="video/mp4" />
          Browser Anda belum mendukung pemutaran video.
        </video>

        <div className="wedding-film-meta wedding-film-meta--identity">
          <span>02</span>
          <strong>OUR FILM</strong>
        </div>
        <div className="wedding-film-meta wedding-film-meta--date">
          <span>17.09.26</span>
          <strong>ALVITA + ADE</strong>
        </div>
        <p className="wedding-film-scroll">SCROLL TO CONTINUE ↓</p>

        <div
          className="wedding-film-curtain wedding-film-curtain--left"
          aria-hidden="true"
        />
        <div
          className="wedding-film-curtain wedding-film-curtain--right"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}
