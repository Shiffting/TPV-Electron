import "../styles/pin-modal.css";
import { useEffect, useState } from "react";

type Props = {
  title?: string;

  onSubmit: (pin: string) => Promise<void>;

  onClose?: () => void;
};

export default function PinModal({
  title = "PIN requerido",
  onSubmit,
  onClose,
}: Props) {
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  function addDigit(digit: string) {
    if (loading) return;

    if (pin.length >= 4) return;

    setPin(pin + digit);
  }

  function removeDigit() {
    if (loading) return;

    setPin(pin.slice(0, -1));
  }

  async function confirm() {
    if (pin.length < 4) return;

    try {
      setLoading(true);

      setError("");

      await onSubmit(pin);

      setPin("");
    } catch (e: any) {
      setError(e?.message || "PIN incorrecto");

      setPin("");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="pin-overlay">
      <div className="pin-modal">
        <div className="pin-title">{title}</div>

        <div className="pin-subtitle">Introduce tu PIN</div>
        {onClose && (
          <div className="pin-actions">
            <button className="pin-back" onClick={onClose}>
              ← Volver
            </button>
          </div>
        )}

        {/* DOTS */}

        <div className="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`pin-dot ${i < pin.length ? "active" : ""}`}
            />
          ))}
        </div>

        {/* KEYPAD */}

        <div className="pin-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              className="pin-key"
              onClick={() => addDigit(String(n))}
            >
              {n}
            </button>
          ))}

          <button className="pin-key" onClick={removeDigit}>
            ⌫
          </button>

          <button className="pin-key" onClick={() => addDigit("0")}>
            0
          </button>

          <button className="pin-key confirm" onClick={confirm}>
            ✓
          </button>
        </div>

        {/* ERROR */}

        {error && <div className="pin-error">{error}</div>}
      </div>
    </div>
  );
}
