import { useEffect } from "react";
import { Routes, Route } from "react-router";
import { SpotifyProvider } from "@/providers/SpotifyProvider";
import { initDatabase } from "@/services/database";
import { IdlePage } from "@/pages/IdlePage";
import { SelectPage } from "@/pages/SelectPage";
import { NowPlayingPage } from "@/pages/NowPlayingPage";
import { CallbackPage } from "@/pages/CallbackPage";

export function App() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <SpotifyProvider>
      <Routes>
        <Route path="/" element={<IdlePage />} />
        <Route path="/select/:barcode" element={<SelectPage />} />
        <Route path="/now-playing" element={<NowPlayingPage />} />
        <Route path="/callback" element={<CallbackPage />} />
      </Routes>
    </SpotifyProvider>
  );
}
