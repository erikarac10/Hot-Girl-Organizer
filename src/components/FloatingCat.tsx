import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import "./FloatingCat.css";

/** Interactive empty-search mascot for the "When did I last...?" card. */
export default function FloatingCat() {
  const [isPetted, setIsPetted] = useState(false);
  const [petCount, setPetCount] = useState(0);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    };
  }, []);

  function petCat() {
    setIsPetted(true);
    setPetCount(count => count + 1);
    if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setIsPetted(false), 1300);
  }

  function followPointer(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
    const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));

    // Directly update CSS variables so pointer tracking doesn't rerender React.
    event.currentTarget.style.setProperty("--cat-eye-x", `${(x * 3.5).toFixed(1)}px`);
    event.currentTarget.style.setProperty("--cat-eye-y", `${(y * 2.5).toFixed(1)}px`);
    event.currentTarget.style.setProperty("--cat-tilt", `${(x * 3).toFixed(1)}deg`);
  }

  function resetPointer(event: ReactPointerEvent<HTMLButtonElement>) {
    event.currentTarget.style.setProperty("--cat-eye-x", "0px");
    event.currentTarget.style.setProperty("--cat-eye-y", "0px");
    event.currentTarget.style.setProperty("--cat-tilt", "0deg");
  }

  return (
    <div className="hgo-idle-cat">
      <div className={`hgo-idle-cat__scene ${isPetted ? "is-petted" : ""}`}>
        <div className="hgo-idle-cat__halo" aria-hidden="true" />
        <span className="hgo-idle-cat__spark hgo-idle-cat__spark--one" aria-hidden="true">✦</span>
        <span className="hgo-idle-cat__spark hgo-idle-cat__spark--two" aria-hidden="true">✧</span>
        <span className="hgo-idle-cat__spark hgo-idle-cat__spark--three" aria-hidden="true">✦</span>
        <span className="hgo-idle-cat__spark hgo-idle-cat__spark--four" aria-hidden="true">♡</span>
        <span className="hgo-idle-cat__bubble hgo-idle-cat__bubble--one" aria-hidden="true" />
        <span className="hgo-idle-cat__bubble hgo-idle-cat__bubble--two" aria-hidden="true" />

        <button
          className="hgo-idle-cat__petter"
          type="button"
          aria-label={isPetted ? "The cat is purring. Pet again!" : "Pet the floating archive cat"}
          onClick={petCat}
          onPointerMove={followPointer}
          onPointerLeave={resetPointer}
        >
          <div className="hgo-idle-cat__bob">
            <svg
              className="hgo-idle-cat__illustration"
              viewBox="0 0 250 240"
              xmlns="http://www.w3.org/2000/svg"
              focusable="false"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="hgoCatBody" x1=".1" x2=".87" y1="0" y2="1">
                  <stop offset="0" stopColor="#fffdfd" />
                  <stop offset=".55" stopColor="#fce5f0" />
                  <stop offset="1" stopColor="#deb5d3" />
                </linearGradient>
                <linearGradient id="hgoCatFace" x1=".13" x2=".9" y1="0" y2="1">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset=".58" stopColor="#fff1f9" />
                  <stop offset="1" stopColor="#f0cce2" />
                </linearGradient>
                <linearGradient id="hgoCatEar" x1="0" x2=".8" y1="0" y2="1">
                  <stop offset="0" stopColor="#e7aacb" />
                  <stop offset="1" stopColor="#ffdaeb" />
                </linearGradient>
                <linearGradient id="hgoCatBow" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0" stopColor="#ffe5f4" />
                  <stop offset="1" stopColor="#d78ebc" />
                </linearGradient>
                <radialGradient id="hgoCatCheek">
                  <stop offset="0" stopColor="#ed98bc" stopOpacity=".9" />
                  <stop offset="1" stopColor="#f2adca" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="hgoCatShine">
                  <stop offset="0" stopColor="#fff" stopOpacity=".98" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </radialGradient>
                <filter id="hgoCatBlur"><feGaussianBlur stdDeviation="5" /></filter>
              </defs>

              {/* A little pool of light underneath her paws. */}
              <ellipse cx="125" cy="223" rx="72" ry="9" fill="#ddb6d2" opacity=".25" filter="url(#hgoCatBlur)" />
              <ellipse cx="125" cy="222" rx="67" ry="6" fill="#e7cedf" opacity=".5" />

              {/* Tail goes behind the body and wags when she's petted. */}
              <g className="hgo-idle-cat__tail">
                <path d="M182 168 C224 145 242 181 221 201 C208 213 186 203 185 191" fill="none" stroke="#dab0cf" strokeWidth="23" strokeLinecap="round" />
                <path d="M184 168 C219 151 230 179 216 192" fill="none" stroke="#fff1f9" strokeWidth="12" strokeLinecap="round" opacity=".95" />
                <path d="M209 193 Q218 196 221 190" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".65" />
              </g>

              {/* Soft, rounded body and fluffy tummy. */}
              <ellipse cx="125" cy="166" rx="64" ry="61" fill="url(#hgoCatBody)" stroke="#dfbad3" strokeWidth="2.5" />
              <ellipse cx="125" cy="174" rx="40" ry="40" fill="#fffafd" opacity=".88" />
              <ellipse cx="94" cy="145" rx="30" ry="44" fill="url(#hgoCatShine)" opacity=".58" />
              <path d="M111 188 Q125 198 139 188" stroke="#e8bbd6" strokeWidth="2" fill="none" opacity=".7" />

              {/* Ears are separate groups so they can wiggle on hover. */}
              <g className="hgo-idle-cat__ear hgo-idle-cat__ear--left">
                <path d="M67 91 Q61 51 69 24 Q92 35 110 62" fill="url(#hgoCatFace)" stroke="#dfafca" strokeWidth="3" strokeLinejoin="round" />
                <path d="M77 73 L75 41 Q91 50 100 69" fill="url(#hgoCatEar)" />
              </g>
              <g className="hgo-idle-cat__ear hgo-idle-cat__ear--right">
                <path d="M179 91 Q192 51 181 24 Q156 36 143 64" fill="url(#hgoCatFace)" stroke="#dfafca" strokeWidth="3" strokeLinejoin="round" />
                <path d="M170 72 L176 41 Q157 50 150 69" fill="url(#hgoCatEar)" />
              </g>

              {/* Glossy face and fluffy forehead tuft. */}
              <ellipse cx="124" cy="110" rx="73" ry="63" fill="url(#hgoCatFace)" stroke="#e3bed5" strokeWidth="2.5" />
              <ellipse cx="91" cy="75" rx="39" ry="25" fill="url(#hgoCatShine)" opacity=".8" />
              <path d="M112 49 Q119 38 125 47 Q131 39 138 50" fill="#fff9fc" stroke="#e9c8dc" strokeWidth="1.7" />
              <path d="M73 93 Q86 82 102 84 M145 84 Q161 82 176 92" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".75" />

              {/* Extra blush on pet, like a happy little reaction. */}
              <ellipse className="hgo-idle-cat__blush" cx="77" cy="125" rx="26" ry="18" fill="url(#hgoCatCheek)" />
              <ellipse className="hgo-idle-cat__blush" cx="172" cy="125" rx="26" ry="18" fill="url(#hgoCatCheek)" />
              <g stroke="#e9a6c4" strokeLinecap="round" strokeWidth="2" opacity=".48">
                <path d="M68 130 l-3 4 M75 131 l-3 4 M169 131 l-3 4 M176 130 l-3 4" />
              </g>

              {!isPetted ? (
                <g className="hgo-idle-cat__eyes">
                  <ellipse cx="99" cy="109" rx="6" ry="9" fill="#755268" />
                  <ellipse cx="150" cy="109" rx="6" ry="9" fill="#755268" />
                  <g className="hgo-idle-cat__gaze">
                    <ellipse cx="97.5" cy="106" rx="2" ry="2.8" fill="#fff" />
                    <ellipse cx="148.5" cy="106" rx="2" ry="2.8" fill="#fff" />
                  </g>
                </g>
              ) : (
                <g className="hgo-idle-cat__happy-eyes" fill="none" stroke="#85576f" strokeWidth="3.5" strokeLinecap="round">
                  <path d="M89 110 Q99 97 109 110" />
                  <path d="M140 110 Q150 97 160 110" />
                </g>
              )}

              <path d="M119 126 Q124 122 129 126 Q124 133 119 126" fill="#d58bab" />
              <path d="M124 130 Q118 139 113 134 M124 130 Q131 139 136 134" fill="none" stroke="#956a83" strokeWidth="2.3" strokeLinecap="round" />
              {isPetted && <path d="M122 136 Q124 143 128 136 Z" fill="#ed8da9" />}

              {/* Whiskers. */}
              <g stroke="#cfa9c2" strokeWidth="1.7" strokeLinecap="round" opacity=".8">
                <path d="M78 132 L55 128 M78 138 L57 144" />
                <path d="M171 132 L194 128 M171 138 L193 144" />
              </g>

              {/* Left paw waves when hovered / petted. */}
              <g className="hgo-idle-cat__paw-wave">
                <ellipse cx="95" cy="210" rx="20" ry="12" fill="#fff2fa" stroke="#e3bad3" strokeWidth="2" />
                <path d="M88 207 L88 214 M101 207 L101 214" stroke="#dfb2ce" strokeWidth="1.8" strokeLinecap="round" />
              </g>
              <ellipse cx="154" cy="210" rx="20" ry="12" fill="#fff2fa" stroke="#e3bad3" strokeWidth="2" />
              <path d="M147 207 L147 214 M160 207 L160 214" stroke="#dfb2ce" strokeWidth="1.8" strokeLinecap="round" />

              {/* Ear bow and shiny centre. */}
              <g transform="translate(172 80) rotate(15)">
                <path d="M0 0 C-10 -13 -21 -9 -17 2 C-13 11 -3 7 0 2 C6 -9 20 -12 20 0 C19 12 6 10 0 2" fill="url(#hgoCatBow)" stroke="#d48bb4" strokeWidth="1.7" />
                <circle cx="1" cy="1" r="5.2" fill="#fff8fc" stroke="#d48bb4" strokeWidth="1.5" />
                <circle cx="-.7" cy="-.5" r="1.3" fill="#fff" />
              </g>
            </svg>
          </div>
        </button>

      </div>
    </div>
  );
}
