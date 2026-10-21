import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { openSpotifyLogin } from "@/services/spotifyAuth";

const BARCODE_LENGTH = 14;
const SEGMENTS = [1, 4, 4, 4, 1] as const;

function getSegmentValues(digits: string): string[] {
  let offset = 0;
  return SEGMENTS.map((len) => {
    const seg = digits.slice(offset, offset + len);
    offset += len;
    return seg;
  });
}

function stripToDigits(text: string): string {
  return text.replace(/\D/g, "").slice(0, BARCODE_LENGTH);
}

export function IdlePage() {
  const navigate = useNavigate();
  const scannerRef = useRef<HTMLInputElement>(null);
  const manualRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const manualModeRef = useRef(false);
  const [error, setError] = useState("");
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const submitBarcode = useCallback(
    (barcode: string) => {
      navigate(`/select/${barcode}`);
    },
    [navigate],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = stripToDigits(e.target.value);
      isTypingRef.current = true;
      setValue(digits);
      if (error) setError("");
    },
    [error],
  );

  // Navigate after the final digit renders
  useEffect(() => {
    if (value.length === BARCODE_LENGTH && isTypingRef.current) {
      isTypingRef.current = false;
      const frame = requestAnimationFrame(() => submitBarcode(value));
      return () => cancelAnimationFrame(frame);
    }
  }, [value, submitBarcode]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (isTypingRef.current) return;
        const digits = stripToDigits(value);
        if (digits.length === BARCODE_LENGTH) {
          submitBarcode(digits);
        } else if (digits.length > 0) {
          setError(`Card number must be exactly ${BARCODE_LENGTH} digits`);
        } else {
          setError("Please enter your card number");
        }
      }
    },
    [value, submitBarcode],
  );

  const enterManualMode = useCallback(() => {
    manualModeRef.current = true;
    setManualMode(true);
    scannerRef.current?.blur();
    setTimeout(() => manualRef.current?.focus(), 50);
  }, []);

  const exitManualMode = useCallback(() => {
    manualModeRef.current = false;
    setManualMode(false);
    setTimeout(() => scannerRef.current?.focus(), 50);
  }, []);

  // Reset state when page mounts (navigating back)
  useEffect(() => {
    setValue("");
    setError("");
    setManualMode(false);
    manualModeRef.current = false;
    const timer = setTimeout(() => scannerRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Keep scanner input focused when manual mode is off
  useEffect(() => {
    if (manualMode) return;
    const handleFocusOut = () => {
      if (!manualModeRef.current) {
        setTimeout(() => scannerRef.current?.focus(), 50);
      }
    };
    const el = scannerRef.current;
    el?.addEventListener("blur", handleFocusOut);
    return () => el?.removeEventListener("blur", handleFocusOut);
  }, [manualMode]);

  const handleAdminPressIn = () => {
    longPressTimer.current = setTimeout(() => {
      openSpotifyLogin();
    }, 3000);
  };

  const handleAdminPressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* Top third — prompt */}
      <div
        className="flex-1 flex flex-col justify-center items-center p-6"
        onMouseDown={handleAdminPressIn}
        onMouseUp={handleAdminPressOut}
        onTouchStart={handleAdminPressIn}
        onTouchEnd={handleAdminPressOut}
      >
        <h1 className="text-4xl font-bold text-center text-[var(--color-text)] leading-tight">
          Scan Your<br />Library Card
        </h1>
        <p className="text-center pt-4 text-[var(--color-text-secondary)]">
          Hold your card up to the scanner to get started
        </p>
      </div>

      {/* Center — scanner image */}
      <div className="flex-1 flex justify-center items-center">
        <img
          src="/images/scanner.png"
          alt="Scanner"
          className="w-[180px] h-[180px] opacity-85 object-contain dark:invert"
          draggable={false}
        />
      </div>

      {/* Bottom third — manual entry */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Divider */}
        <div className="flex items-center w-[75%]">
          <div className="flex-1 h-px opacity-30 bg-[var(--color-text-secondary)]" />
          <span className="px-4 text-sm text-[var(--color-text-secondary)]">
            or enter manually
          </span>
          <div className="flex-1 h-px opacity-30 bg-[var(--color-text-secondary)]" />
        </div>

        {/* Barcode segment display */}
        <button
          type="button"
          className="pt-4"
          onClick={() => {
            if (manualMode) {
              manualRef.current?.focus();
            } else {
              enterManualMode();
            }
          }}
        >
          <div className="flex items-center">
            {getSegmentValues(value).map((seg, i) => (
              <div key={i} className="flex items-center">
                {i > 0 && (
                  <span className="text-xl px-1 text-[var(--color-text-secondary)]">
                    -
                  </span>
                )}
                <div
                  className="border rounded-lg p-2 flex items-center justify-center"
                  style={{
                    borderColor: error
                      ? "#e53935"
                      : manualMode
                        ? "#4A90D9"
                        : "var(--color-bg-selected)",
                    backgroundColor: "var(--color-bg-element)",
                    minWidth: SEGMENTS[i]! * 20 + 16,
                    boxShadow:
                      manualMode && !error
                        ? "0 0 8px rgba(74, 144, 217, 0.6)"
                        : "none",
                  }}
                >
                  <span
                    className="text-xl tracking-widest"
                    style={{
                      fontVariantNumeric: "tabular-nums",
                      color: seg
                        ? "var(--color-text)"
                        : "var(--color-text-secondary)",
                      opacity: seg ? 1 : 0.3,
                    }}
                  >
                    {seg || "0".repeat(SEGMENTS[i]!)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </button>

        {/* Hidden scanner input — always focused, no virtual keyboard */}
        <input
          ref={scannerRef}
          type="text"
          inputMode="none"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={BARCODE_LENGTH}
          autoComplete="off"
          autoCorrect="off"
          className="absolute opacity-0 w-px h-px"
          tabIndex={-1}
        />

        {/* Hidden manual input — shows virtual keyboard on tablet */}
        <input
          ref={manualRef}
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (manualModeRef.current) {
              exitManualMode();
            }
          }}
          maxLength={BARCODE_LENGTH}
          autoComplete="off"
          autoCorrect="off"
          className="absolute opacity-0 w-px h-px"
          tabIndex={-1}
        />

        {error && (
          <p className="text-[#e53935] text-[13px] pt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
