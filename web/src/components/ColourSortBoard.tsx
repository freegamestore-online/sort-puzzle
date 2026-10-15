import type { CSSProperties } from "react";
import type { ColourSortState } from "../game/colourSortState";

// Each colour has a base and a lighter top edge. Named for screen readers.
export const BALL_COLOURS = [
  { name: "red", base: "#e11d48", light: "#fb7185" },
  { name: "blue", base: "#2563eb", light: "#60a5fa" },
  { name: "green", base: "#16a34a", light: "#4ade80" },
  { name: "yellow", base: "#ca8a04", light: "#facc15" },
  { name: "purple", base: "#9333ea", light: "#c084fc" },
  { name: "orange", base: "#ea580c", light: "#fb923c" },
  { name: "cyan", base: "#0891b2", light: "#22d3ee" },
  { name: "pink", base: "#db2777", light: "#f472b6" },
  { name: "indigo", base: "#4f46e5", light: "#818cf8" },
] as const;

const colourOf = (ball: number) => BALL_COLOURS[ball % BALL_COLOURS.length]!;

// Timing for the pour: the tube tilts, then each poured ball drops in.
const DROP_DELAY_MS = 180;
const DROP_STAGGER_MS = 80;

interface ColourSortBoardProps {
  state: ColourSortState;
  onTap: (index: number) => void;
}

export function ColourSortBoard({ state, onTap }: ColourSortBoardProps) {
  const { tubes, capacity, selected, pour } = state;

  return (
    <div className="cs-board" role="group" aria-label="Tubes">
      {tubes.map((tube, index) => {
        const top = tube[tube.length - 1];
        const isSorted = tube.length === capacity && tube.every((ball) => ball === tube[0]);
        const label =
          tube.length === 0
            ? `Tube ${index + 1}, empty`
            : `Tube ${index + 1}, ${tube.length} ball${tube.length === 1 ? "" : "s"}, top ${colourOf(top!).name}${isSorted ? ", sorted" : ""}`;

        const isPouringFrom = pour?.from === index;
        const tiltDirection = pour && pour.to > pour.from ? 1 : -1;
        const tubeStyle = isPouringFrom
          ? ({
              "--tilt": `${24 * tiltDirection}deg`,
              transformOrigin: tiltDirection > 0 ? "top right" : "top left",
            } as CSSProperties)
          : undefined;

        return (
          <button
            key={index}
            type="button"
            className="cs-tube-button"
            aria-label={label}
            aria-pressed={selected === index}
            onClick={() => onTap(index)}
          >
            <div
              className="cs-tube"
              data-selected={selected === index ? "" : undefined}
              data-solved={isSorted && !isPouringFrom ? "" : undefined}
              data-pouring={isPouringFrom ? "" : undefined}
              style={tubeStyle}
            >
              {Array.from({ length: capacity }, (_, slot) => {
                // Slot 0 is the bottom. Render top-down so the column reads naturally.
                const ballIndex = capacity - 1 - slot;
                const ball = tube[ballIndex];
                const newOffset = pour && pour.to === index ? ballIndex - pour.destPrevLen : -1;
                const isNew = pour !== null && newOffset >= 0 && newOffset < pour.count;
                const dropDelay = DROP_DELAY_MS + newOffset * DROP_STAGGER_MS;

                return (
                  <div key={slot} className="cs-slot">
                    {ball !== undefined && (
                      <div
                        className="cs-ball"
                        data-enter={isNew ? "" : undefined}
                        style={
                          {
                            "--c": colourOf(ball).base,
                            "--c-light": colourOf(ball).light,
                            "--drop-delay": `${dropDelay}ms`,
                          } as CSSProperties
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
