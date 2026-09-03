"use client";

import { useEffect, useRef, useState } from "react";

type WeddingFilmProps = {
  onAudioStateChange: (isUsingVideoAudio: boolean) => void;
};

export function WeddingFilm({
  onAudioStateChange,
}: WeddingFilmProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isInViewRef = useRef(false);
  const audioUnlockedRef = useRef(false);
  const [isInView, setIsInView] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasEnded, setHasEnded] = useState(false);

  const playWhenVisible = (video: HTMLVideoElement) => {
    if (video.ended) video.currentTime = 0;
    setHasEnded(false);

    const wantsSound = audioUnlockedRef.current;
    video.muted = !wantsSound;
    setIsMuted(video.muted);

    void video.play().catch(() => {
      if (!wantsSound) return;
      // Unmuted autoplay can still be rejected by device-level policy.
      // Keep autoplay working and retry sound on the next real gesture.
      video.muted = true;
      setIsMuted(true);
      void video.play().catch(() => undefined);
    });
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextIsInView =
          entry.isIntersecting && entry.intersectionRatio >= 0.4;
        isInViewRef.current = nextIsInView;
        setIsInView(nextIsInView);
        if (nextIsInView) playWhenVisible(video);
        else video.pause();
      },
      { threshold: [0, 0.2, 0.4, 0.6, 1] },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const removeGestureListeners = () => {
      window.removeEventListener("pointerdown", unlockWithGesture);
      window.removeEventListener("keydown", unlockWithGesture);
      window.removeEventListener("touchstart", unlockWithGesture);
    };

    const unlockWithGesture = () => {
      audioUnlockedRef.current = true;
      video.muted = false;
      setIsMuted(false);

      if (isInViewRef.current) {
        playWhenVisible(video);
      } else {
        // Bless this media element during a real user gesture without letting
        // its audio leak while the film is still outside the viewport.
        const previousVolume = video.volume;
        video.volume = 0;
        void video
          .play()
          .then(() => {
            if (!isInViewRef.current) {
              video.pause();
              video.currentTime = 0;
            }
            video.volume = previousVolume;
            video.muted = false;
            setIsMuted(false);
          })
          .catch(() => {
            video.volume = previousVolume;
          });
      }

      removeGestureListeners();
    };

    const requestSoundOnScroll = () => {
      audioUnlockedRef.current = true;
      if (isInViewRef.current) playWhenVisible(video);
    };

    window.addEventListener("pointerdown", unlockWithGesture);
    window.addEventListener("keydown", unlockWithGesture);
    window.addEventListener("touchstart", unlockWithGesture, { passive: true });
    window.addEventListener("wheel", requestSoundOnScroll, { passive: true });
    return () => {
      removeGestureListeners();
      window.removeEventListener("wheel", requestSoundOnScroll);
    };
  }, []);

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
      className="wedding-film"
      aria-label="Video Alvita dan Ade"
    >
      <div className="wedding-film-stage">
        <video
          ref={videoRef}
          className="wedding-film-video"
          autoPlay
          controls
          muted
          playsInline
          preload="auto"
          onCanPlay={(event) => {
            if (isInViewRef.current) playWhenVisible(event.currentTarget);
          }}
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
