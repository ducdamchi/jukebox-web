import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { handleAuthCallback } from "@/services/spotifyAuth";

export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const authError = params.get("error");

    if (authError) {
      setError(`Spotify denied access: ${authError}`);
      setTimeout(() => navigate("/", { replace: true }), 3000);
      return;
    }

    if (!code) {
      setError("No authorization code received");
      setTimeout(() => navigate("/", { replace: true }), 3000);
      return;
    }

    handleAuthCallback(code)
      .then(() => {
        navigate("/", { replace: true });
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Token exchange failed");
        setTimeout(() => navigate("/", { replace: true }), 3000);
      });
  }, [navigate]);

  return (
    <div className="flex h-full items-center justify-center bg-[var(--color-bg)]">
      {error ? (
        <p className="text-[#e53935] text-lg text-center px-8">{error}</p>
      ) : (
        <p className="text-[var(--color-text-secondary)] text-lg">
          Logging in to Spotify...
        </p>
      )}
    </div>
  );
}
