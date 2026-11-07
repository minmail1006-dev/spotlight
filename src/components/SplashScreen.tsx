
import { useEffect, useRef, useState } from "react";

interface SplashScreenProps {
  onDone: () => void;
}

const SEARCH_MS = 2800;
const REVEAL_MS = 900;
const HOLD_MS = 600;
const FADE_MS = 600;

const TOTAL_MS = SEARCH_MS + REVEAL_MS + HOLD_MS + FADE_MS;

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [visual, setVisual] = useState({
    x: 50,
    y: 50,
    radius: 90,
    opacity: 1,
  });

  const completed = useRef(false);
  const startTime = useRef<number | null>(null);
  const frameId = useRef<number | null>(null);
  const finishTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = () => {
    if (completed.current) return;

    completed.current = true;

    if (frameId.current !== null) {
      cancelAnimationFrame(frameId.current);
    }

    if (finishTimer.current) {
      clearTimeout(finishTimer.current);
    }

    setVisual((current) => ({
      ...current,
      opacity: 0,
    }));

    finishTimer.current = setTimeout(() => {
      onDone();
    }, FADE_MS);
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      setVisual({
        x: 50,
        y: 50,
        radius: 350,
        opacity: 1,
      });

      finishTimer.current = setTimeout(finish, 900);

      return () => {
        if (finishTimer.current) {
          clearTimeout(finishTimer.current);
        }
      };
    }

    const animate = (timestamp: number) => {
      if (completed.current) return;

      if (startTime.current === null) {
        startTime.current = timestamp;
      }

      const elapsed = timestamp - startTime.current;

      if (elapsed >= TOTAL_MS) {
        finish();
        return;
      }

      let x = 50;
      let y = 50;
      let radius = 90;
      let opacity = 1;

      if (elapsed < SEARCH_MS) {
        // Flashlight searches around the screen.
        const progress = elapsed / SEARCH_MS;

        x = 50 + Math.sin(progress * Math.PI * 4) * 28;
        y = 50 + Math.cos(progress * Math.PI * 3) * 22;

        radius = 85 + Math.sin(progress * Math.PI * 8) * 12;
      } else if (elapsed < SEARCH_MS + REVEAL_MS) {
        // The flashlight finds the logo and reveals it.
        const progress =
          (elapsed - SEARCH_MS) / REVEAL_MS;

        const eased = 1 - Math.pow(1 - progress, 3);

        x = 50;
        y = 50;
        radius = 90 + eased * 260;
      } else if (elapsed < SEARCH_MS + REVEAL_MS + HOLD_MS) {
        // Hold the revealed logo briefly.
        x = 50;
        y = 50;
        radius = 350;
      } else {
        // Fade out to reveal the homepage.
        x = 50;
        y = 50;
        radius = 350;

        const fadeProgress =
          (elapsed - SEARCH_MS - REVEAL_MS - HOLD_MS) /
          FADE_MS;

        opacity = 1 - fadeProgress;
      }

      setVisual({ x, y, radius, opacity });

      frameId.current = requestAnimationFrame(animate);
    };

    frameId.current = requestAnimationFrame(animate);

    return () => {
      if (frameId.current !== null) {
        cancelAnimationFrame(frameId.current);
      }

      if (finishTimer.current) {
        clearTimeout(finishTimer.current);
      }
    };
  }, []);

  return (
    <div
      className="spotlight-intro"
      onClick={finish}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          finish();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Spotlight intro. Press Enter or click to skip."
      style={{ opacity: visual.opacity }}
    >
      <div className="spotlight-vignette" />

      <div
        className="spotlight-beam"
        style={{
          left: `${visual.x}%`,
          top: `${visual.y}%`,
        }}
      />

      <div
        className="spotlight-logo"
        style={{
          maskImage: `radial-gradient(
            circle ${visual.radius}px at ${visual.x}% ${visual.y}%,
            black 0%,
            black 45%,
            transparent 100%
          )`,
          WebkitMaskImage: `radial-gradient(
            circle ${visual.radius}px at ${visual.x}% ${visual.y}%,
            black 0%,
            black 45%,
            transparent 100%
          )`,
        }}
      >
        <span>Spotlight</span>
      </div>

      <div className="spotlight-skip">
        Click anywhere to skip
      </div>

      <style>{`
        .spotlight-intro {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          cursor: pointer;
          transition: opacity 0.6s ease;
          outline: none;
        }

        .spotlight-vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(
            ellipse at center,
            transparent 0%,
            rgba(0, 0, 0, 0.35) 65%,
            #000 100%
          );
        }

        .spotlight-beam {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
          background: radial-gradient(
            circle,
            rgba(255, 249, 225, 0.16) 0%,
            rgba(255, 249, 225, 0.08) 25%,
            rgba(255, 249, 225, 0.025) 48%,
            transparent 72%
          );
          filter: blur(8px);
        }

        .spotlight-logo {
          position: relative;
          z-index: 2;
          text-align: center;
          color: white;
          -webkit-mask-repeat: no-repeat;
          mask-repeat: no-repeat;
          pointer-events: none;
        }

        .spotlight-logo span {
          display: block;
          font-family: Arial, Helvetica, sans-serif;
          font-size: clamp(3rem, 10vw, 7rem);
          font-weight: 800;
          letter-spacing: -0.065em;
          line-height: 1;
          text-shadow: 0 0 35px rgba(255, 255, 255, 0.22);
        }

        .spotlight-skip {
          position: absolute;
          bottom: 35px;
          left: 0;
          right: 0;
          text-align: center;
          color: rgba(255, 255, 255, 0.35);
          font-family: Arial, sans-serif;
          font-size: 12px;
          letter-spacing: 1px;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .spotlight-intro {
            transition-duration: 0.2s;
          }
        }
      `}</style>
    </div>
  );
}
