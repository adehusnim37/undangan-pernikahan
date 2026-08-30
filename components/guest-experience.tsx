"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import type { Invitation } from "@/lib/invitations";
import { useThumbmark } from "@thumbmarkjs/react";
import { toast } from "react-toastify";
import { getApiErrorMessage } from "@/lib/client-api";
import { rsvpFormSchema, validateWithToast } from "@/lib/client-validation";
import {
  heroMediaSlots,
  invitationMediaBySlot,
  preweddingMediaSlots,
  type InvitationMediaSlot,
} from "@/lib/invitation-media";
import { couple, coupleCaps } from "@/lib/couple";

type AccessState = "checking" | "allowed" | "denied";
type Rsvp = {
  attendance: string;
  guest_count: number;
  message: string | null;
  updated_at: string;
  current_editable_rsvps: number;
  max_editable_rsvps: number;
};

export function GuestExperience({ invitation }: { invitation: Invitation }) {
  const invitationRef = useRef<HTMLElement>(null);
  const rsvpFormRef = useRef<HTMLFormElement>(null);
  const {
    thumbmark,
    isLoading: isLoadingThumbmark,
    error: thumbmarkError,
  } = useThumbmark();
  const [access, setAccess] = useState<AccessState>("checking");
  const [deviceHash, setDeviceHash] = useState("");
  const [notice, setNotice] = useState("Memverifikasi undangan pribadimu…");
  const [attendance, setAttendance] = useState("attending");
  const [guestCount, setGuestCount] = useState(1);
  const [message, setMessage] = useState("");
  const [rsvpState, setRsvpState] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");
  const [existingRsvp, setExistingRsvp] = useState<Rsvp | null>(null);
  const [activePreweddingPhoto, setActivePreweddingPhoto] = useState<
    number | null
  >(null);
  const photo = (slot: InvitationMediaSlot) =>
    invitation.media?.[slot]?.url ?? invitationMediaBySlot[slot].defaultUrl;
  const photoStyle = (slot: InvitationMediaSlot) => {
    const display = invitation.media?.[slot];
    return display
      ? {
          objectFit: display.fit,
          objectPosition: `${display.positionX}% ${display.positionY}%`,
          transform: `scale(${display.scale})`,
          transformOrigin: `${display.positionX}% ${display.positionY}%`,
        }
      : undefined;
  };

  useEffect(() => {
    if (access !== "allowed") return;
    const root = invitationRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;

    gsap.registerPlugin(ScrollTrigger, Flip);
    const responsiveMotion = gsap.matchMedia();
    const refreshScrollTriggers = () => ScrollTrigger.refresh();
    const invitationImages = root.querySelectorAll<HTMLImageElement>("img");
    invitationImages.forEach((image) =>
      image.addEventListener("load", refreshScrollTriggers),
    );
    const refreshTimer = window.setTimeout(refreshScrollTriggers, 150);
    const context = gsap.context(() => {
      const hero = root.querySelector<HTMLElement>(".folio-hero");
      const focusPhoto = root.querySelector<HTMLElement>(".folio-photo--focus");
      const title = root.querySelector<HTMLElement>(".folio-title");
      const kicker = root.querySelector<HTMLElement>(".folio-kicker");
      const accent = root.querySelector<HTMLElement>(".folio-title em");
      const guest = root.querySelector<HTMLElement>(".folio-guest");
      const bar = root.querySelector<HTMLElement>(".folio-bar");
      const cue = root.querySelector<HTMLElement>(".folio-scroll");
      const storySection = root.querySelector<HTMLElement>(".folio-story");
      const storyIntro = root.querySelector<HTMLElement>(".couple-intro");
      const storyWord = root.querySelector<HTMLElement>(".couple-word");
      const storyMeta = root.querySelector<HTMLElement>(".folio-story-meta");
      const storyProfiles =
        root.querySelectorAll<HTMLElement>(".couple-profile");
      const storyAmpersand =
        root.querySelector<HTMLElement>(".couple-ampersand");
      const journey = root.querySelector<HTMLElement>(".journey-section");
      const journeyTrack = root.querySelector<HTMLElement>(".journey-track");
      const journeyPanels =
        journey?.querySelectorAll<HTMLElement>(".journey-panel") ?? [];
      const journeyProgress = root.querySelector<HTMLElement>(
        ".journey-progress span",
      );
      const routePath = root.querySelector<SVGPathElement>(
        ".journey-route-path",
      );
      const overscrollPanels =
        root.querySelectorAll<HTMLElement>(".overscroll-panel");
      const prewedding = root.querySelector<HTMLElement>(".prewedding-section");
      const footer = root.querySelector<HTMLElement>(".folio-footer");
      const footerName = root.querySelector<HTMLElement>(".folio-footer-name");
      const footerCurtainLeft = root.querySelector<HTMLElement>(
        ".folio-footer-curtain--left",
      );
      const footerCurtainRight = root.querySelector<HTMLElement>(
        ".folio-footer-curtain--right",
      );
      const footerRule = root.querySelector<HTMLElement>(".folio-footer-rule");
      const footerCopy = root.querySelectorAll<HTMLElement>(
        ".folio-footer-kicker, .folio-footer-note, .folio-footer-date",
      );

      if (
        hero &&
        focusPhoto &&
        title &&
        kicker &&
        accent &&
        guest &&
        bar &&
        cue
      ) {
        const createHeroTimeline = (mobileHero: boolean) => {
          const focusPhotoTarget = mobileHero
            ? {
                left: "0%",
                top: "0%",
                width: "100%",
                height: "100%",
                xPercent: 0,
                yPercent: 0,
              }
            : {
                left: "50%",
                top: "58%",
                width: () => Math.min(window.innerWidth * 0.3, 420),
                height: () => Math.min(window.innerHeight * 0.72, 540),
                xPercent: -50,
                yPercent: -50,
              };
          const timeline = gsap.timeline({
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: "+=180%",
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          timeline
            .to(bar, { opacity: 0, y: -18, duration: 0.18 }, 0)
            .to(cue, { opacity: 0, y: 16, duration: 0.18 }, 0.08)
            .to(
              ".folio-photo:not(.folio-photo--focus)",
              {
                x: (index) => `${index % 2 === 0 ? -1 : 1}${8 + index * 1.6}vw`,
                y: (index) => `${index % 2 === 0 ? 9 : -9}vh`,
                opacity: 0,
                scale: 0.72,
                rotate: (index) => (index % 2 === 0 ? -8 : 8),
                stagger: 0.035,
                duration: 0.48,
              },
              0.18,
            )
            .to(
              focusPhoto,
              {
                ...focusPhotoTarget,
                borderRadius: 0,
                rotation: 0,
                scale: 1.08,
                duration: 0.7,
                ease: "power2.inOut",
              },
              0.35,
            )
            .to(
              title,
              { color: "#fff9ed", scale: 1.04, yPercent: 8, duration: 0.38 },
              0.72,
            )
            .to(kicker, { color: "#d7b77a", duration: 0.28 }, 0.72)
            .to(accent, { color: "#d7b77a", duration: 0.28 }, 0.72)
            .to(guest, { color: "#fff9ed", scale: 1.08, duration: 0.28 }, 0.72);
        };

        responsiveMotion.add("(min-width: 701px)", () =>
          createHeroTimeline(false),
        );
        responsiveMotion.add("(max-width: 700px)", () =>
          createHeroTimeline(true),
        );
      }

      if (storySection && storyIntro && storyMeta && storyProfiles.length) {
        const storyIsMobile = window.matchMedia("(max-width: 700px)").matches;
        gsap
          .timeline({
            scrollTrigger: {
              trigger: storySection,
              start: "top 84%",
              end: "top 28%",
              scrub: 0.8,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            storyMeta,
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.28, ease: "none" },
            0,
          )
          .fromTo(
            storyIntro,
            { y: 56, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.68, ease: "none" },
            0.08,
          )
          .fromTo(
            storyWord,
            { xPercent: 12, opacity: 0 },
            { xPercent: 0, opacity: 1, duration: 0.72, ease: "none" },
            0.12,
          );

        storyProfiles.forEach((profile, index) => {
          const portrait =
            profile.querySelector<HTMLElement>(".couple-portrait");
          const portraitImage = profile.querySelector<HTMLElement>(
            ".couple-portrait-media",
          );
          const copy = profile.querySelector<HTMLElement>(
            ".couple-profile-copy",
          );
          const copyItems = profile.querySelectorAll<HTMLElement>(
            ".couple-index, .couple-role, .couple-parents > *",
          );
          if (!portrait || !portraitImage || !copy) return;

          const profileTimeline = gsap
            .timeline({ paused: true })
            .fromTo(
              portrait,
              {
                clipPath: storyIsMobile
                  ? "inset(100% 0% 0% 0%)"
                  : index === 0
                    ? "inset(0% 100% 0% 0%)"
                    : "inset(0% 0% 0% 100%)",
              },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: 0.82,
                ease: "power3.inOut",
              },
              0,
            )
            .fromTo(
              portraitImage,
              { scale: 1.18 },
              { scale: 1, duration: 1.05, ease: "power2.out" },
              0,
            )
            .fromTo(
              copy,
              {
                x: storyIsMobile ? 0 : index === 0 ? 54 : -54,
                y: storyIsMobile ? 38 : 0,
                opacity: 0,
              },
              { x: 0, y: 0, opacity: 1, duration: 0.68, ease: "power3.out" },
              0.16,
            )
            .fromTo(
              copyItems,
              { y: 18, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                stagger: 0.055,
                duration: 0.42,
                ease: "power2.out",
              },
              0.34,
            );

          ScrollTrigger.create({
            trigger: profile,
            start: "top 84%",
            end: "bottom 16%",
            invalidateOnRefresh: true,
            onEnter: () => profileTimeline.play(),
            onEnterBack: () => profileTimeline.play(),
            onLeaveBack: () => profileTimeline.reverse(),
          });
        });

        if (storyAmpersand) {
          gsap.fromTo(
            storyAmpersand,
            { scale: 0.72, rotate: -12, opacity: 0 },
            {
              scale: 1,
              rotate: 0,
              opacity: 1,
              ease: "none",
              scrollTrigger: {
                trigger: storyAmpersand,
                start: "top 82%",
                end: "center 55%",
                scrub: 0.7,
              },
            },
          );
        }
      }

      if (journey && journeyTrack && journeyPanels.length && journeyProgress) {
        responsiveMotion.add("(min-width: 701px)", () => {
          const horizontalJourney = gsap.to(journeyTrack, {
            x: () => -(journeyTrack.scrollWidth - window.innerWidth),
            ease: "none",
            scrollTrigger: {
              trigger: journey,
              start: "top top",
              end: () => `+=${window.innerWidth * (journeyPanels.length - 1)}`,
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          gsap.fromTo(
            journeyProgress,
            { scaleX: 0 },
            {
              scaleX: 1,
              ease: "none",
              scrollTrigger: {
                trigger: journey,
                start: "top top",
                end: () =>
                  `+=${window.innerWidth * (journeyPanels.length - 1)}`,
                scrub: 1,
              },
            },
          );

          journeyPanels.forEach((panel) => {
            const photos =
              panel.querySelectorAll<HTMLElement>(".journey-photo");
            if (!photos.length) return;
            gsap.fromTo(
              photos,
              {
                yPercent: (index) => (index % 2 === 0 ? 18 : -14),
                scale: 0.82,
              },
              {
                yPercent: (index) => (index % 2 === 0 ? -12 : 10),
                scale: 1,
                ease: "none",
                stagger: 0.04,
                scrollTrigger: {
                  trigger: panel,
                  containerAnimation: horizontalJourney,
                  start: "left 92%",
                  end: "right 8%",
                  scrub: 1,
                },
              },
            );
          });

          if (routePath) {
            const pathLength = routePath.getTotalLength();
            gsap.set(routePath, {
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength,
            });
            gsap.to(routePath, {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: {
                trigger: ".journey-panel--distance",
                containerAnimation: horizontalJourney,
                start: "left 80%",
                end: "right 35%",
                scrub: 1,
              },
            });
          }
        });

        responsiveMotion.add("(max-width: 700px)", () => {
          journeyPanels.forEach((panel) => {
            gsap.fromTo(
              panel.querySelector(".journey-copy"),
              { y: 48, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: panel,
                  start: "top 86%",
                  end: "top 45%",
                  scrub: 0.75,
                },
              },
            );
            gsap.fromTo(
              panel.querySelectorAll(".journey-photo"),
              { y: 54, scale: 0.9 },
              {
                y: -18,
                scale: 1,
                stagger: 0.08,
                ease: "none",
                scrollTrigger: {
                  trigger: panel,
                  start: "top 92%",
                  end: "bottom 40%",
                  scrub: 0.8,
                },
              },
            );
          });

          if (routePath) {
            const pathLength = routePath.getTotalLength();
            gsap.set(routePath, {
              strokeDasharray: pathLength,
              strokeDashoffset: pathLength,
            });
            gsap.to(routePath, {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: {
                trigger: ".journey-route",
                start: "top 82%",
                end: "bottom 42%",
                scrub: 1,
              },
            });
          }
        });

        responsiveMotion.add(
          "(min-width: 701px) and (hover: hover) and (pointer: fine)",
          () => {
            const schoolBento = journey.querySelector<HTMLElement>(
              ".journey-bento--school",
            );
            const schoolPhotos = schoolBento?.querySelectorAll<HTMLElement>(
              ":scope > figure",
            );
            if (!schoolBento || !schoolPhotos?.length) return;

            gsap.set(schoolBento, {
              perspective: 900,
              transformStyle: "preserve-3d",
            });
            gsap.set(schoolPhotos, {
              z: (index) => [18, 42, 30][index] ?? 22,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            });

            const tiltX = gsap.quickTo(schoolBento, "rotationX", {
              duration: 0.55,
              ease: "power3.out",
            });
            const tiltY = gsap.quickTo(schoolBento, "rotationY", {
              duration: 0.55,
              ease: "power3.out",
            });
            const photoX = Array.from(schoolPhotos, (photo) =>
              gsap.quickTo(photo, "x", {
                duration: 0.65,
                ease: "power3.out",
              }),
            );
            const photoY = Array.from(schoolPhotos, (photo) =>
              gsap.quickTo(photo, "y", {
                duration: 0.65,
                ease: "power3.out",
              }),
            );
            const photoDepth = [14, 24, 19];

            const resetSchoolTilt = () => {
              tiltX(0);
              tiltY(0);
              photoX.forEach((move) => move(0));
              photoY.forEach((move) => move(0));
            };
            const moveSchoolTilt = (event: PointerEvent) => {
              const bounds = schoolBento.getBoundingClientRect();
              const xProgress = gsap.utils.clamp(
                0,
                1,
                (event.clientX - bounds.left) / bounds.width,
              );
              const yProgress = gsap.utils.clamp(
                0,
                1,
                (event.clientY - bounds.top) / bounds.height,
              );

              tiltX(gsap.utils.interpolate(7, -7, yProgress));
              tiltY(gsap.utils.interpolate(-9, 9, xProgress));
              photoDepth.forEach((depth, index) => {
                photoX[index]?.(
                  gsap.utils.interpolate(-depth, depth, xProgress),
                );
                photoY[index]?.(
                  gsap.utils.interpolate(-depth * 0.7, depth * 0.7, yProgress),
                );
              });
            };

            schoolBento.addEventListener("pointermove", moveSchoolTilt);
            schoolBento.addEventListener("pointerleave", resetSchoolTilt);
            window.addEventListener("blur", resetSchoolTilt);

            return () => {
              schoolBento.removeEventListener("pointermove", moveSchoolTilt);
              schoolBento.removeEventListener("pointerleave", resetSchoolTilt);
              window.removeEventListener("blur", resetSchoolTilt);
            };
          },
        );

        responsiveMotion.add(
          "(max-width: 700px) and (pointer: coarse)",
          () => {
            const schoolBento = journey.querySelector<HTMLElement>(
              ".journey-bento--school",
            );
            const schoolPhotos = schoolBento?.querySelectorAll<HTMLElement>(
              ":scope > figure",
            );
            if (!schoolBento || !schoolPhotos?.length) return;

            gsap.set(schoolBento, {
              perspective: 760,
              transformStyle: "preserve-3d",
            });
            gsap.set(schoolPhotos, {
              z: (index) => [10, 26, 18][index] ?? 14,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            });

            const tiltX = gsap.quickTo(schoolBento, "rotationX", {
              duration: 0.38,
              ease: "power3.out",
            });
            const tiltY = gsap.quickTo(schoolBento, "rotationY", {
              duration: 0.38,
              ease: "power3.out",
            });
            const photoX = Array.from(schoolPhotos, (photo) =>
              gsap.quickTo(photo, "x", {
                duration: 0.45,
                ease: "power3.out",
              }),
            );
            const photoDepth = [8, 14, 11];

            const resetSchoolTouch = () => {
              tiltX(0);
              tiltY(0);
              photoX.forEach((move) => move(0));
            };
            const moveSchoolTouch = (event: TouchEvent) => {
              const touch = event.touches[0];
              if (!touch) return;
              const bounds = schoolBento.getBoundingClientRect();
              const xProgress = gsap.utils.clamp(
                0,
                1,
                (touch.clientX - bounds.left) / bounds.width,
              );
              const yProgress = gsap.utils.clamp(
                0,
                1,
                (touch.clientY - bounds.top) / bounds.height,
              );

              tiltX(gsap.utils.interpolate(5, -5, yProgress));
              tiltY(gsap.utils.interpolate(-6, 6, xProgress));
              photoDepth.forEach((depth, index) => {
                photoX[index]?.(
                  gsap.utils.interpolate(-depth, depth, xProgress),
                );
              });
            };
            const passiveTouchOptions: AddEventListenerOptions = {
              passive: true,
            };

            schoolBento.addEventListener(
              "touchstart",
              moveSchoolTouch,
              passiveTouchOptions,
            );
            schoolBento.addEventListener(
              "touchmove",
              moveSchoolTouch,
              passiveTouchOptions,
            );
            schoolBento.addEventListener("touchend", resetSchoolTouch);
            schoolBento.addEventListener("touchcancel", resetSchoolTouch);
            window.addEventListener("blur", resetSchoolTouch);

            return () => {
              schoolBento.removeEventListener("touchstart", moveSchoolTouch);
              schoolBento.removeEventListener("touchmove", moveSchoolTouch);
              schoolBento.removeEventListener("touchend", resetSchoolTouch);
              schoolBento.removeEventListener(
                "touchcancel",
                resetSchoolTouch,
              );
              window.removeEventListener("blur", resetSchoolTouch);
            };
          },
        );
      }

      if (overscrollPanels.length > 1) {
        const createOverscrollSequence = (mobileOverscroll: boolean) => {
          const pinnedPanels = Array.from(overscrollPanels).slice(0, -1);
          const resizeObservers: ResizeObserver[] = [];
          const mutationObservers: MutationObserver[] = [];

          pinnedPanels.forEach((panel) => {
            const innerPanel = panel.querySelector<HTMLElement>(
              ".overscroll-panel-inner",
            );
            if (!innerPanel) return;

            const panelState = { progress: 0 };
            const targetScale = mobileOverscroll ? 0.84 : 0.9;
            const getMetrics = () => {
              const innerHeight = innerPanel.scrollHeight;
              const contentOverflow = Math.max(
                0,
                innerHeight - window.innerHeight,
              );
              return {
                innerHeight,
                contentOverflow,
                fakeScrollRatio: contentOverflow / innerHeight,
              };
            };
            const renderPanel = () => {
              const { contentOverflow, fakeScrollRatio } = getMetrics();
              if (
                fakeScrollRatio > 0 &&
                panelState.progress < fakeScrollRatio
              ) {
                gsap.set(innerPanel, {
                  y: -contentOverflow * (panelState.progress / fakeScrollRatio),
                });
                gsap.set(panel, { scale: 1, opacity: 1 });
                return;
              }

              const exitProgress =
                fakeScrollRatio < 1
                  ? Math.max(
                      0,
                      Math.min(
                        1,
                        (panelState.progress - fakeScrollRatio) /
                          (1 - fakeScrollRatio),
                      ),
                    )
                  : 0;
              const scaleProgress = Math.min(1, exitProgress / 0.9);
              const fadeProgress =
                exitProgress <= 0.9
                  ? 0
                  : Math.min(1, (exitProgress - 0.9) / 0.1);
              const opacity =
                exitProgress <= 0.9
                  ? 1 - 0.52 * scaleProgress
                  : 0.48 * (1 - fadeProgress);

              gsap.set(innerPanel, { y: -contentOverflow });
              gsap.set(panel, {
                scale: 1 - (1 - targetScale) * scaleProgress,
                opacity,
              });
            };
            const syncPanelMetrics = () => {
              const { contentOverflow } = getMetrics();
              panel.style.marginBottom = `${contentOverflow}px`;
              if (panel.parentElement?.classList.contains("pin-spacer")) {
                panel.parentElement.style.marginBottom = `${contentOverflow}px`;
              }
              renderPanel();
            };

            syncPanelMetrics();
            gsap.to(panelState, {
              progress: 1,
              ease: "none",
              onUpdate: renderPanel,
              scrollTrigger: {
                trigger: panel,
                // Safari's dynamic toolbar can make 100svh shorter than the
                // viewport ScrollTrigger uses, so bottom-to-bottom leaves a gap.
                start: "top top",
                end: () => `+=${innerPanel.scrollHeight}`,
                pin: true,
                pinSpacing: false,
                scrub: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
                onRefreshInit: syncPanelMetrics,
              },
            });

            const resizeObserver = new ResizeObserver(() => {
              ScrollTrigger.refresh();
              window.requestAnimationFrame(syncPanelMetrics);
            });
            resizeObserver.observe(innerPanel);
            resizeObservers.push(resizeObserver);

            const mutationObserver = new MutationObserver(() => {
              window.requestAnimationFrame(() => {
                ScrollTrigger.refresh();
                window.requestAnimationFrame(syncPanelMetrics);
              });
            });
            mutationObserver.observe(innerPanel, {
              childList: true,
              subtree: true,
            });
            mutationObservers.push(mutationObserver);
          });

          return () => {
            resizeObservers.forEach((observer) => observer.disconnect());
            mutationObservers.forEach((observer) => observer.disconnect());
            pinnedPanels.forEach((panel) =>
              panel.style.removeProperty("margin-bottom"),
            );
          };
        };

        responsiveMotion.add("(max-width: 700px)", () =>
          createOverscrollSequence(true),
        );
        responsiveMotion.add("(min-width: 701px)", () =>
          createOverscrollSequence(false),
        );
      }
      if (prewedding) {
        const heading = prewedding.querySelectorAll<HTMLElement>(
          ".prewedding-heading > *",
        );
        const photos =
          prewedding.querySelectorAll<HTMLElement>(".prewedding-photo");
        gsap.fromTo(
          heading,
          { y: 34, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.08,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: { trigger: prewedding, start: "top 78%" },
          },
        );
        gsap.fromTo(
          photos,
          { y: 70, opacity: 0, scale: 0.94 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            stagger: 0.09,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: ".prewedding-grid", start: "top 82%" },
          },
        );
      }
      if (
        footer &&
        footerName &&
        footerCurtainLeft &&
        footerCurtainRight &&
        footerRule
      ) {
        const createClosingTimeline = (mobileClosing: boolean) => {
          const closingTimeline = gsap.timeline({
            scrollTrigger: {
              trigger: footer,
              start: "top bottom",
              end: "top top",
              scrub: 0.85,
            },
          });

          closingTimeline
            .fromTo(
              footerCurtainLeft,
              mobileClosing ? { yPercent: -105 } : { xPercent: -105 },
              mobileClosing
                ? { yPercent: 0, duration: 0.6, ease: "power2.inOut" }
                : { xPercent: 0, duration: 0.6, ease: "power2.inOut" },
              0,
            )
            .fromTo(
              footerCurtainRight,
              mobileClosing ? { yPercent: 105 } : { xPercent: 105 },
              mobileClosing
                ? { yPercent: 0, duration: 0.6, ease: "power2.inOut" }
                : { xPercent: 0, duration: 0.6, ease: "power2.inOut" },
              0,
            )
            .fromTo(
              footerRule,
              { scaleX: 0 },
              { scaleX: 1, duration: 0.24, ease: "power2.out" },
              0.48,
            )
            .fromTo(
              footerName,
              { yPercent: 68, scale: 0.9, opacity: 0 },
              {
                yPercent: 0,
                scale: 1,
                opacity: 1,
                duration: 0.42,
                ease: "power3.out",
              },
              0.53,
            )
            .fromTo(
              footerCopy,
              { y: 18, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                stagger: 0.035,
                duration: 0.28,
                ease: "power2.out",
              },
              0.68,
            );
        };

        responsiveMotion.add("(min-width: 701px)", () =>
          createClosingTimeline(false),
        );
        responsiveMotion.add("(max-width: 700px)", () =>
          createClosingTimeline(true),
        );
      }
    }, root);
    return () => {
      responsiveMotion.revert();
      context.revert();
      window.clearTimeout(refreshTimer);
      invitationImages.forEach((image) =>
        image.removeEventListener("load", refreshScrollTriggers),
      );
    };
  }, [access]);

  useEffect(() => {
    if (
      rsvpState !== "done" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const success =
      invitationRef.current?.querySelector<HTMLElement>(".rsvp-success");
    if (!success) return;
    const animation = gsap.fromTo(
      success.children,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.65, stagger: 0.07, ease: "power3.out" },
    );
    return () => {
      animation.revert();
    };
  }, [rsvpState]);

  useEffect(() => {
    if (activePreweddingPhoto === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePreweddingPhoto(null);
      if (event.key === "ArrowLeft") {
        setActivePreweddingPhoto((current) =>
          current === null
            ? null
            : (current - 1 + preweddingMediaSlots.length) %
              preweddingMediaSlots.length,
        );
      }
      if (event.key === "ArrowRight") {
        setActivePreweddingPhoto((current) =>
          current === null ? null : (current + 1) % preweddingMediaSlots.length,
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePreweddingPhoto]);

  useEffect(() => {
    if (isLoadingThumbmark) return;
    if (thumbmarkError) {
      setAccess("denied");
      setNotice("Perangkat ini tidak dapat diverifikasi.");
      toast.error("Perangkat tidak dapat diverifikasi.");
      return;
    }
    if (!thumbmark) return;

    (async () => {
      const hash = thumbmark;
      const response = await fetch(
        `/api/public/invite/${invitation.token}/access`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ hash, metadata: { source: "thumbmarkjs" } }),
        },
      );
      if (!response.ok)
        throw new Error(
          await getApiErrorMessage(
            response,
            "Akses undangan tidak dapat diverifikasi.",
          ),
        );
      const result = await response.json();
      setAccess(result.allowed ? "allowed" : "denied");
      setDeviceHash(hash ?? "");
      setNotice(result.message);
      if (!result.allowed) toast.error(result.message);
      if (result.rsvp) {
        setExistingRsvp(result.rsvp);
        setAttendance(result.rsvp.attendance);
        setGuestCount(result.rsvp.guest_count);
        setMessage(result.rsvp.message ?? "");
        setRsvpState("done");
      }
    })().catch((error: unknown) => {
      setAccess("denied");
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Perangkat ini tidak dapat diverifikasi.";
      setNotice(errorMessage);
      toast.error(errorMessage);
    });
  }, [invitation.token, isLoadingThumbmark, thumbmark, thumbmarkError]);

  function chooseAttendance(nextAttendance: "attending" | "declined") {
    if (nextAttendance === attendance) return;
    const form = rsvpFormRef.current;
    const indicator = form?.querySelector<HTMLElement>(
      ".rsvp-choice-indicator",
    );
    const flipState = indicator ? Flip.getState(indicator) : null;

    flushSync(() => setAttendance(nextAttendance));

    if (flipState) {
      Flip.from(flipState, {
        duration: 0.62,
        ease: "power3.inOut",
        absolute: true,
        nested: true,
      });
    }

    if (nextAttendance === "attending") {
      const guestField = form?.querySelector<HTMLElement>(".rsvp-guest-field");
      if (guestField) {
        gsap.fromTo(
          guestField,
          { height: 0, opacity: 0, y: 14 },
          {
            height: "auto",
            opacity: 1,
            y: 0,
            duration: 0.48,
            ease: "power3.out",
            clearProps: "height",
          },
        );
      }
    }
  }

  async function submitRsvp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = validateWithToast(rsvpFormSchema, {
      attendance,
      guestCount,
      message,
      hash: deviceHash,
    });
    if (!payload) return;
    setRsvpState("sending");
    try {
      const response = await fetch(
        `/api/public/invite/${invitation.token}/rsvp`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok)
        throw new Error(
          await getApiErrorMessage(response, "Konfirmasi belum tersimpan."),
        );
      setRsvpState("done");
      setExistingRsvp((previous) => ({
        attendance: payload.attendance,
        guest_count: payload.guestCount,
        message: payload.message || null,
        updated_at: new Date().toISOString(),
        current_editable_rsvps: (previous?.current_editable_rsvps ?? 0) + 1,
        max_editable_rsvps: previous?.max_editable_rsvps ?? 2,
      }));
      toast.success("Konfirmasi kehadiran tersimpan.");
    } catch (error) {
      setRsvpState("error");
      toast.error(
        error instanceof Error ? error.message : "Konfirmasi belum tersimpan.",
      );
    }
  }

  if (access === "checking")
    return (
      <main className="access-screen">
        <span className="access-mark">A / A</span>
        <div className="gate-spinner" />
        <p>{notice}</p>
      </main>
    );
  if (access === "denied")
    return (
      <main className="access-screen access-screen-denied">
        <p className="eyebrow">PRIVATE ACCESS</p>
        <h1>Undangan ini terikat pada perangkat lain.</h1>
        <p>{notice}</p>
        <small>Hubungi mempelai agar akses dapat diatur ulang.</small>
      </main>
    );

  return (
    <main ref={invitationRef} className="invitation-shell">
      <header className="folio-hero">
        <div className="folio-bar">
          <span>{coupleCaps.plus}</span>
          <span>JKT · 17.09.26</span>
        </div>
        <div className="folio-gallery" aria-hidden="true">
          {heroMediaSlots.map((item, index) => (
            <figure
              className={`folio-photo folio-photo-${index + 1} ${index === 2 ? "folio-photo--focus" : ""}`}
              key={item.slot}
            >
              <img
                src={photo(item.slot)}
                style={photoStyle(item.slot)}
                alt=""
              />
              <figcaption></figcaption>
            </figure>
          ))}
        </div>
        <div className="folio-title">
          <p className="folio-kicker">You’re invited to the wedding of</p>
          <h1>
            <span className="folio-name">{couple.bride}</span>
            <em>&amp;</em>
            <span className="folio-name">{couple.groom}</span>
          </h1>
          <p className="folio-guest">
            <span>Undangan khusus untuk</span>
            <strong>{invitation.guest_name}</strong>
          </p>
        </div>
        <div className="folio-scroll">
          <span>SCROLL TO ENTER</span>
          <i>↓</i>
        </div>
      </header>

      <section className="folio-story" aria-labelledby="couple-title">
        <div className="couple-word" aria-hidden="true">
          restu
        </div>
        <div className="folio-story-meta">
          <span>Two Family · One Sacred Knot</span>
          <span>{coupleCaps.plus} / 2026</span>
        </div>
        <header className="couple-intro">
          <p className="eyebrow">DENGAN RESTU DAN SUKACITA</p>
          <h2 id="couple-title">
            <span>{couple.bride}</span>
            <i>&amp;</i>
            <span>{couple.groom}</span>
          </h2>
          <p>
            Dengan restu dua keluarga, mereka mengiringi kami menuju ikatan suci
            dengan sukacita{" "}
          </p>
        </header>

        <div className="couple-list">
          <article className="couple-profile couple-profile--bride">
            <figure className="couple-portrait">
              <div className="couple-portrait-media">
                <img
                  src={photo("couple_bride_portrait")}
                  style={photoStyle("couple_bride_portrait")}
                  alt={`Potret ${couple.bride}`}
                />
              </div>
              <figcaption>{coupleCaps.bride} · PUTRI</figcaption>
            </figure>
            <div className="couple-profile-copy">
              <span className="couple-index">Alvita</span>
              <h3>apt. Alvita Raniah Aisyah Putri, M.Pharm.</h3>
              <p className="couple-role">Putri Pertama dari</p>
              <div className="couple-parents">
                <strong>Bapak Andi Subyantoro, S.T.</strong>
                <i>&amp;</i>
                <strong>Ibu drg. Rully Kusumawardhany, M.M.</strong>
              </div>
            </div>
          </article>

          <div className="couple-ampersand" aria-hidden="true">
            <span>&amp;</span>
            <i />
          </div>

          <article className="couple-profile couple-profile--groom">
            <figure className="couple-portrait">
              <div className="couple-portrait-media">
                <img
                  src={photo("couple_groom_portrait")}
                  style={photoStyle("couple_groom_portrait")}
                  alt={`Potret ${couple.groom}`}
                />
              </div>
              <figcaption>{coupleCaps.groom} · PUTRA</figcaption>
            </figure>
            <div className="couple-profile-copy">
              <span className="couple-index">Ade </span>
              <h3>{couple.groom} Husni Mubarrok, S.Kom.</h3>
              <p className="couple-role">Putra Kedua dari</p>
              <div className="couple-parents">
                <strong>Bapak Lukman Hakim, S.Pd.</strong>
                <i>&amp;</i>
                <strong>Ibu Dra. Djuwariah</strong>
              </div>
            </div>
          </article>
        </div>

        <div className="folio-story-bottom" aria-hidden="true">
          <span>Mari Melangkah Menyusuri Cerita Kami</span>
          <span>↓</span>
        </div>
      </section>

      <section className="journey-section" aria-labelledby="journey-title">
        <div className="journey-progress" aria-hidden="true">
          <span />
        </div>
        <div className="journey-track">
          <article className="journey-panel journey-panel--school">
            <div className="journey-copy">
              <p className="journey-year">2016</p>
              <p className="eyebrow">PERTEMUAN PERTAMA</p>
              <h2 id="journey-title">
                Satu kelas,
                <br />
                memulai cerita.
              </h2>
              <p className="journey-body">
                Pertemuan kami bermula di SMAN 19 Surabaya. Takdir membawa kami
                berada di kelas XI yang sama—XI MIPA 4.
              </p>
            </div>
            <div className="journey-bento journey-bento--school">
              <figure className="journey-photo journey-photo--portrait">
                <img
                  src={photo("journey_school_portrait")}
                  style={photoStyle("journey_school_portrait")}
                  alt={`Foto ${couple.bride} dan ${couple.groom} semasa sekolah`}
                />
              </figure>
              <figure className="journey-photo journey-school-mark">
                <img
                  src={photo("journey_school_mark")}
                  style={photoStyle("journey_school_mark")}
                  alt={`Foto tambahan ${couple.bride} dan ${couple.groom} semasa sekolah`}
                />
                <figcaption>Kelulusan SMA</figcaption>
              </figure>
              <figure className="journey-photo journey-photo--detail">
                <img
                  src={photo("journey_school_detail")}
                  style={photoStyle("journey_school_detail")}
                  alt="Suasana sekolah"
                />
                <figcaption>Foto Bersama XI MIPA 4</figcaption>
              </figure>
            </div>
          </article>

          <article className="journey-panel journey-panel--campus">
            <div className="journey-copy">
              <p className="journey-year">2018-2023</p>
              <p className="eyebrow">BERTUMBUH BERSAMA</p>
              <h2>
                Dua jalan,
                <br />
                satu kota.
              </h2>
              <p className="journey-body">
                Kisah cinta SMA kami berlanjut sampai kuliah S1 dan profesi.
                Kami belajar, bertumbuh, lalu lulus—masih bersama di Surabaya.
              </p>
              <div className="journey-study">
                <p>
                  <span>{coupleCaps.bride}</span>UNAIR · Farmasi hingga Apoteker
                </p>
                <p>
                  <span>{coupleCaps.groom}</span>UPN “Veteran” Jatim · Ilmu
                  Komputer
                </p>
              </div>
            </div>
            <div className="journey-bento journey-bento--campus">
              <figure className="journey-photo journey-photo--wide">
                <img
                  src={photo("journey_campus_wide")}
                  style={photoStyle("journey_campus_wide")}
                  alt={`Masa kuliah ${couple.bride} dan ${couple.groom} di Surabaya`}
                />
                <figcaption>Sumpah Profesi Apoteker Alvita</figcaption>
              </figure>
              <figure className="journey-photo journey-photo--small-a">
                <img
                  src={photo("journey_campus_small_a")}
                  style={photoStyle("journey_campus_small_a")}
                  alt="Kelulusan kuliah"
                />
                <figcaption>Sidang Akhir S1 Ade</figcaption>
              </figure>
              <figure className="journey-photo journey-photo--small-b">
                <img
                  src={photo("journey_campus_small_b")}
                  style={photoStyle("journey_campus_small_b")}
                  alt="Perjalanan selama kuliah"
                />
                <figcaption>Sidang Akhir S1 Alvita</figcaption>
              </figure>
            </div>
          </article>

          <article className="journey-panel journey-panel--distance">
            <div className="journey-copy">
              <p className="journey-year">2024-2026</p>
              <p className="eyebrow">DUA KOTA</p>
              <h2>
                Jauh di peta,
                <br />
                dekat di hati.
              </h2>
              <p className="journey-body">
                Selama dua tahun, {couple.groom} bekerja di Jakarta sementara{" "}
                {couple.bride} melanjutkan studi S2 di Yogyakarta hingga lulus.
              </p>
            </div>
            <div className="journey-route">
              <span className="journey-city journey-city--west">
                JAKARTA<small>{coupleCaps.groom} · WORK</small>
              </span>
              <svg
                viewBox="0 0 640 180"
                role="img"
                aria-label="Jalur hubungan jarak jauh Jakarta dan Yogyakarta"
              >
                <path
                  className="journey-route-guide"
                  d="M52 92 C180 18 418 166 588 82"
                />
                <path
                  className="journey-route-path"
                  d="M52 92 C180 18 418 166 588 82"
                />
              </svg>
              <span className="journey-city journey-city--east">
                YOGYAKARTA<small>{coupleCaps.bride} · S2</small>
              </span>
            </div>
            <div className="journey-bento journey-bento--distance">
              <figure className="journey-photo journey-photo--city">
                <img
                  src={photo("journey_distance_city")}
                  style={photoStyle("journey_distance_city")}
                  alt={`${couple.groom} bekerja di Jakarta`}
                />
                <figcaption>Jakarta</figcaption>
              </figure>
              <figure className="journey-photo journey-photo--graduate">
                <img
                  src={photo("journey_distance_graduate")}
                  style={photoStyle("journey_distance_graduate")}
                  alt={`${couple.bride} menyelesaikan studi S2 di Yogyakarta`}
                />
                <figcaption>Yogyakarta</figcaption>
              </figure>
            </div>
          </article>

          <article className="journey-panel journey-panel--engagement">
            <div className="journey-copy">
              <p className="journey-year">MEI 2026</p>
              <p className="eyebrow">SATU KEPUTUSAN</p>
              <h2>
                Pulang untuk
                <br />
                menetap.
              </h2>
              <p className="journey-body">
                Setelah {couple.bride} menyelesaikan studi S2, kami memutuskan
                melangkah ke jenjang yang lebih serius. Lamaran kami berlangsung
                pada 30 Mei 2026.
              </p>
            </div>
            <div className="journey-bento journey-bento--engagement">
              <figure className="journey-photo journey-photo--engagement-main">
                <img
                  src={photo("journey_engagement_main")}
                  style={photoStyle("journey_engagement_main")}
                  alt={`Lamaran ${couple.bride} dan ${couple.groom}`}
                />
                <figcaption>WE ARE ENGAGED</figcaption>
              </figure>
              <figure className="journey-photo journey-photo--ring">
                <img
                  src={photo("journey_engagement_ring")}
                  style={photoStyle("journey_engagement_ring")}
                  alt="Cincin lamaran"
                />
              </figure>
            </div>
          </article>
        </div>
      </section>

      <div className="overscroll-sequence">
        <article className="journey-panel journey-panel--wedding overscroll-panel">
          <div className="overscroll-panel-inner">
            <div className="journey-wedding-photo journey-photo">
              <img
                src={photo("journey_wedding")}
                style={photoStyle("journey_wedding")}
                alt={`Hari pernikahan ${couple.bride} dan ${couple.groom}`}
              />
              <figcaption>{coupleCaps.plus} · JAKARTA</figcaption>
            </div>
            <div className="journey-wedding-card journey-copy">
              <div className="journey-wedding-meta">
                <span>SEPULUH TAHUN KEMUDIAN</span>
                <span>17 · 09 · 2026</span>
              </div>
              <div className="journey-wedding-heading">
                <h2>
                  Insya Allah,
                  <br />
                  <em>kami akan menikah.</em>
                </h2>
              </div>
              <p>
                Kami akan meresmikan Kisah yang tumbuh sejak SMA—satu janji suci
                di hadapan Allah SWT, untuk selamanya.
              </p>
              <dl className="journey-wedding-details">
                <div>
                  <dt>Hari & tanggal</dt>
                  <dd>Kamis, 17 September 2026</dd>
                </div>
                <div>
                  <dt>Resepsi</dt>
                  <dd>11.00-13.00 WIB</dd>
                </div>
                <div className="journey-wedding-place">
                  <dt>Lokasi</dt>
                  <dd>Masjid Istiqlal — Jakarta Pusat</dd>
                </div>
              </dl>
              <a
                className="journey-location"
                href="https://maps.google.com/?q=Masjid+Istiqlal+Jakarta"
                target="_blank"
                rel="noreferrer"
              >
                <span>Lihat lokasi di peta</span>
                <b aria-hidden="true">↗</b>
              </a>
            </div>
          </div>
        </article>

        <section id="rsvp" className="rsvp-section overscroll-panel">
          <div className="overscroll-panel-inner">
            <div className="rsvp-heading">
              <p className="eyebrow">BALAS UNDANGAN</p>
              <h2>Kami ingin merayakannya bersamamu.</h2>
              <p>Mohon mengirim kabar kehadiran sebelum hari acara.</p>
              <span className="rsvp-personal-note">
                KHUSUS UNTUK · {invitation.guest_name}
              </span>
            </div>

            {rsvpState === "done" ? (
              <div className="rsvp-success">
                <span className="rsvp-success-index">BALASAN TERSIMPAN</span>
                <b>
                  Terima kasih,
                  <br />
                  {invitation.guest_name}.
                </b>
                <p>Doa baikmu sudah sampai kepada kami.</p>
                {existingRsvp && (
                  <dl className="rsvp-summary">
                    <dt>Kehadiran</dt>
                    <dd>
                      {existingRsvp.attendance === "attending"
                        ? `Hadir · ${existingRsvp.guest_count} orang`
                        : "Belum dapat hadir"}
                    </dd>
                    {existingRsvp.message && (
                      <>
                        <dt>Pesan</dt>
                        <dd>{existingRsvp.message}</dd>
                      </>
                    )}
                  </dl>
                )}
                <button
                  className="text-button"
                  onClick={() => setRsvpState("idle")}
                  disabled={
                    !!existingRsvp &&
                    existingRsvp.current_editable_rsvps >=
                      existingRsvp.max_editable_rsvps
                  }
                >
                  {existingRsvp &&
                  existingRsvp.current_editable_rsvps >=
                    existingRsvp.max_editable_rsvps
                    ? "Konfirmasi tidak dapat diubah lagi"
                    : "Ubah konfirmasi"}
                </button>
              </div>
            ) : (
              <form
                ref={rsvpFormRef}
                className="rsvp-form"
                onSubmit={submitRsvp}
              >
                <fieldset className="rsvp-attendance">
                  <legend>Apakah kamu bisa hadir?</legend>
                  <div className="rsvp-choices">
                    <button
                      type="button"
                      className={`rsvp-choice ${attendance === "attending" ? "is-active" : ""}`}
                      aria-pressed={attendance === "attending"}
                      onClick={() => chooseAttendance("attending")}
                    >
                      {attendance === "attending" && (
                        <span
                          className="rsvp-choice-indicator"
                          data-flip-id="rsvp-attendance-indicator"
                        />
                      )}
                      <span className="rsvp-choice-symbol">+</span>
                      <span>
                        <b>Hadir</b>
                        <small>Dengan senang hati datang</small>
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`rsvp-choice ${attendance === "declined" ? "is-active" : ""}`}
                      aria-pressed={attendance === "declined"}
                      onClick={() => chooseAttendance("declined")}
                    >
                      {attendance === "declined" && (
                        <span
                          className="rsvp-choice-indicator"
                          data-flip-id="rsvp-attendance-indicator"
                        />
                      )}
                      <span className="rsvp-choice-symbol">−</span>
                      <span>
                        <b>Belum bisa</b>
                        <small>Mengirim doa dari jauh</small>
                      </span>
                    </button>
                  </div>
                </fieldset>

                {attendance === "attending" && (
                  <div className="rsvp-guest-field">
                    <div>
                      <span className="rsvp-field-label">Jumlah tamu</span>
                      <small>Maksimal {invitation.max_guests} orang</small>
                    </div>
                    <div className="rsvp-stepper" aria-label="Jumlah tamu">
                      <button
                        type="button"
                        onClick={() =>
                          setGuestCount((count) => Math.max(1, count - 1))
                        }
                        disabled={guestCount <= 1}
                        aria-label="Kurangi jumlah tamu"
                      >
                        −
                      </button>
                      <output aria-live="polite">{guestCount}</output>
                      <button
                        type="button"
                        onClick={() =>
                          setGuestCount((count) =>
                            Math.min(invitation.max_guests, count + 1),
                          )
                        }
                        disabled={guestCount >= invitation.max_guests}
                        aria-label="Tambah jumlah tamu"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                <label className="rsvp-message-field">
                  <span className="rsvp-field-label">Ucapan atau doa</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    maxLength={500}
                    placeholder={`Tuliskan sesuatu untuk ${couple.bride} dan ${couple.groom}…`}
                  />
                  <small>{message.length} / 500</small>
                </label>

                <div className="rsvp-submit-row">
                  <span>
                    Balasan ini dapat diubah kembali sesuai batas yang tersedia.
                  </span>
                  <button
                    className="rsvp-submit"
                    disabled={rsvpState === "sending"}
                  >
                    <span>
                      {rsvpState === "sending" ? "Menyimpan…" : "Kirim balasan"}
                    </span>
                    <i aria-hidden="true">↗</i>
                  </button>
                </div>
                {rsvpState === "error" && (
                  <p className="form-error">
                    Konfirmasi belum tersimpan. Coba ulangi.
                  </p>
                )}
              </form>
            )}
          </div>
        </section>

        <section
          className="prewedding-section overscroll-panel overscroll-panel--final"
          aria-labelledby="prewedding-title"
        >
          <div className="overscroll-panel-inner">
            <header className="prewedding-heading">
              <div className="prewedding-heading-meta">
                <span>GALERI</span>
                <span>{coupleCaps.plus} · 2026</span>
              </div>
              <p className="eyebrow">SEBELUM HARI BAHAGIA</p>
              <h2 id="prewedding-title">
                Satu cerita,
                <br />
                <em>dalam bingkai.</em>
              </h2>
              <p>
                Sepenggal momen yang kami simpan sebelum melangkah menuju
                selamanya.
              </p>
            </header>

            <div className="prewedding-grid">
              {preweddingMediaSlots.map((item, index) => (
                <button
                  type="button"
                  className={`prewedding-photo prewedding-photo--${index + 1}`}
                  key={item.slot}
                  onClick={() => setActivePreweddingPhoto(index)}
                  aria-label={`Buka foto prewedding ${index + 1}: ${item.caption}`}
                >
                  <span className="prewedding-photo-media">
                    <img
                      src={photo(item.slot)}
                      style={photoStyle(item.slot)}
                      alt={`Foto prewedding ${couple.bride} dan ${couple.groom} ${index + 1}`}
                      loading="lazy"
                    />
                  </span>
                  <span className="prewedding-photo-caption">
                    <b>{String(index + 1).padStart(2, "0")}</b>
                    <span>{item.caption}</span>
                    <i aria-hidden="true">↗</i>
                  </span>
                </button>
              ))}
            </div>

            <div className="prewedding-endnote" aria-hidden="true">
              <span>ONE LOVE · ONE STORY</span>
              <i />
            </div>
          </div>
        </section>
      </div>

      {activePreweddingPhoto !== null &&
        (() => {
          const activeItem = preweddingMediaSlots[activePreweddingPhoto];
          return (
            <div
              className="prewedding-lightbox"
              role="dialog"
              aria-modal="true"
              aria-label={`Foto prewedding ${activePreweddingPhoto + 1}`}
            >
              <button
                className="prewedding-lightbox-backdrop"
                type="button"
                aria-label="Tutup galeri"
                onClick={() => setActivePreweddingPhoto(null)}
              />
              <div className="prewedding-lightbox-toolbar">
                <span>
                  {String(activePreweddingPhoto + 1).padStart(2, "0")} /{" "}
                  {String(preweddingMediaSlots.length).padStart(2, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setActivePreweddingPhoto(null)}
                  aria-label="Tutup galeri"
                  autoFocus
                >
                  TUTUP <i aria-hidden="true">×</i>
                </button>
              </div>
              <figure className="prewedding-lightbox-figure">
                <img
                  src={photo(activeItem.slot)}
                  style={photoStyle(activeItem.slot)}
                  alt={`Foto prewedding ${couple.bride} dan ${couple.groom} ${activePreweddingPhoto + 1}`}
                />
                <figcaption>{activeItem.caption}</figcaption>
              </figure>
              <div className="prewedding-lightbox-navigation">
                <button
                  type="button"
                  aria-label="Foto sebelumnya"
                  onClick={() =>
                    setActivePreweddingPhoto(
                      (activePreweddingPhoto -
                        1 +
                        preweddingMediaSlots.length) %
                        preweddingMediaSlots.length,
                    )
                  }
                >
                  ←
                </button>
                <button
                  type="button"
                  aria-label="Foto berikutnya"
                  onClick={() =>
                    setActivePreweddingPhoto(
                      (activePreweddingPhoto + 1) % preweddingMediaSlots.length,
                    )
                  }
                >
                  →
                </button>
              </div>
            </div>
          );
        })()}

      <footer className="folio-footer">
        <div className="folio-footer-curtains" aria-hidden="true">
          <span className="folio-footer-curtain folio-footer-curtain--left" />
          <span className="folio-footer-curtain folio-footer-curtain--right" />
        </div>
        <div className="folio-footer-closing">
          <div className="folio-footer-opening">
            <p className="folio-footer-kicker">
              SAMPAI BERTEMU DI HARI BAHAGIA KAMI
            </p>
            <div className="folio-footer-rule" aria-hidden="true" />
          </div>
          <div className="folio-footer-name">
            <span>{couple.bride}</span> <em>&amp;</em>{" "}
            <span>{couple.groom}</span>
          </div>
          <div className="folio-footer-signoff">
            <p className="folio-footer-note">
              Dengan cinta, kami menantikan kehadiran dan doa baikmu.
            </p>
            <time className="folio-footer-date" dateTime="2026-09-17">
              17 · 09 · 2026
            </time>
          </div>
        </div>
      </footer>
    </main>
  );
}
