import { GameModal } from "@freegamestore/games";
import type { Settings, ThemePref } from "../game/settings";

interface OptionsModalProps {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

const THEMES: Array<{ value: ThemePref; label: string }> = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export function OptionsModal({ open, onClose, settings, onChange }: OptionsModalProps) {
  return (
    <GameModal open={open} onClose={onClose} title="Options">
      <div className="cs-options">
        <label className="cs-option">
          <input
            type="checkbox"
            checked={settings.colourBlind}
            onChange={(e) => onChange({ colourBlind: e.target.checked })}
          />
          <span>
            <strong>Colour-blind symbols</strong>
            <small>Shows a shape on every ball.</small>
          </span>
        </label>

        <label className="cs-option">
          <input
            type="checkbox"
            checked={settings.largeTouch}
            onChange={(e) => onChange({ largeTouch: e.target.checked })}
          />
          <span>
            <strong>Large touch targets</strong>
            <small>Bigger tubes, easier to tap.</small>
          </span>
        </label>

        <label className="cs-option">
          <input
            type="checkbox"
            checked={settings.reduceMotion}
            onChange={(e) => onChange({ reduceMotion: e.target.checked })}
          />
          <span>
            <strong>Reduce motion</strong>
            <small>No tilts or drops. Your system setting also applies.</small>
          </span>
        </label>

        <fieldset className="cs-theme">
          <legend>Theme</legend>
          <div className="cs-theme-choices">
            {THEMES.map((theme) => (
              <label key={theme.value} className="cs-theme-choice">
                <input
                  type="radio"
                  name="cs-theme"
                  value={theme.value}
                  checked={settings.theme === theme.value}
                  onChange={() => onChange({ theme: theme.value })}
                />
                {theme.label}
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </GameModal>
  );
}
