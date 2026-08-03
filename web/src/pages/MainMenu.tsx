import { GlassGrid } from "../ui/GlassGrid";
import { GlassButton } from "../ui/GlassButton";
import type { Screen } from "./screen";

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function MainMenu({ onNavigate }: Props) {
  return (
    <div className="flex flex-col items-center gap-10">
      <h1 className="text-4xl font-semibold tracking-tight text-white">
        Interactive Games
      </h1>
      <GlassGrid columns={3}>
        <GlassButton
          onSelect={() => onNavigate("games")}
          className="h-40 w-40 text-lg font-medium"
        >
          Games
        </GlassButton>
        <GlassButton
          onSelect={() => onNavigate("sandbox")}
          className="h-40 w-40 text-lg font-medium"
        >
          Sandbox
        </GlassButton>
        <GlassButton
          onSelect={() => onNavigate("login")}
          className="h-40 w-40 text-lg font-medium"
        >
          Login
        </GlassButton>
      </GlassGrid>
    </div>
  );
}
