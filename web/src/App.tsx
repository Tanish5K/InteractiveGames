import { useEffect, useState } from "react";
import { useGestureTracking } from "./gesture-engine/vision/useGestureTracking";
import { attachMouseInput } from "./input/mouseInputAdapter";
import { HandCursors } from "./ui/HandCursors";
import { MainMenu } from "./pages/MainMenu";
import { GamesMenu } from "./pages/GamesMenu";
import { Sandbox } from "./pages/Sandbox";
import { SnakeGame } from "./pages/SnakeGame";
import { PlaceholderScreen } from "./pages/PlaceholderScreen";
import type { Screen } from "./pages/screen";

function App() {
  const { videoRef, status, errorMessage } = useGestureTracking();
  const [screen, setScreen] = useState<Screen>("menu");

  useEffect(() => attachMouseInput(), []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-neutral-950">
      {status === "error" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-6">
          <p className="text-center text-sm text-red-300">{errorMessage}</p>
        </div>
      )}

      <video
        ref={videoRef}
        className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover transition-opacity duration-500 ${
          status === "ready" ? "opacity-40" : "opacity-0"
        }`}
        muted
        playsInline
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

      <HandCursors />

      <div className="relative z-10 flex h-full w-full items-center justify-center p-8">
        {screen === "menu" && <MainMenu onNavigate={setScreen} />}
        {screen === "games" && <GamesMenu onNavigate={setScreen} />}
        {screen === "sandbox" && <Sandbox onBack={() => setScreen("menu")} />}
        {screen === "login" && (
          <PlaceholderScreen title="Login" onBack={() => setScreen("menu")} />
        )}
        {screen === "snake" && (
          <SnakeGame onBack={() => setScreen("games")} />
        )}
        {screen === "wordle" && (
          <PlaceholderScreen
            title="Wordle"
            subtitle="Coming in Phase 7"
            onBack={() => setScreen("games")}
          />
        )}
      </div>
    </div>
  );
}

export default App;
