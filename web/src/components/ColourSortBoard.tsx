import type { CSSProperties } from "react";
import type { ColourSortState } from "../game/colourSortState";
import { ballColour, SYMBOL_PATHS } from "../game/palette";

// Timing for the pour: the tube tilts, then each poured ball drops in.
const DROP_DELAY_MS = 180;
const DROP_STAGGER_MS = 80;

interface ColourSortBoardProps {
  state: ColourSortState;
  colourBlind: boolean;
  onTap: (index: number) => void;
}

export function ColourSortBoard({ state, colourBlind, onTap }: ColourSortBoardProps) {
  const { tubes, capacity, selected, pour } = state;

  return (
    <div className="cs-board" role="group" aria-label="Tubes">
      {tubes.map((tube, index) => {
        const top = tube[tube.length - 1];
        const isSorted = tube.length === capacity && tube.every((ball) => ball === tube[0]);
        const label =
          tube.length === 0
            ? `Tube ${index + 1}, empty`
            : `Tube ${index + 1}, ${tube.length} ball${tube.length === 1 ? "" : "s"}, top ${ballColour(top!).name}${isSorted ? ", sorted" : ""}`;

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
                            "--c": ballColour(ball).base,
                            "--c-light": ballColour(ball).light,
                            "--drop-delay": `${dropDelay}ms`,
                          } as CSSProperties
                        }
                      >
                        {colourBlind && (
                          <svg className="cs-glyph" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                            <path d={SYMBOL_PATHS[ballColour(ball).symbol]} fill={ballColour(ball).glyph} />
                          </svg>
                        )}
                      </div>
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
