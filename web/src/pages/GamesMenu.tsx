import { GlassGrid } from "../ui/GlassGrid";
import { GlassButton } from "../ui/GlassButton";
import type { Screen } from "./screen";

interface Props {
  onNavigate: (screen: Screen) => void;
}

export function GamesMenu({ onNavigate }: Props) {
  return (
    <div className="flex flex-col items-center gap-10">
      <h1 className="text-4xl font-semibold tracking-tight text-white">
        Games
      </h1>
      <GlassGrid columns={2}>
        <GlassButton
          onSelect={() => onNavigate("snake")}
          className="h-40 w-40 text-lg font-medium"
        >
          Snake
        </GlassButton>
        <GlassButton
          onSelect={() => onNavigate("wordle")}
          className="h-40 w-40 text-lg font-medium"
        >
          Wordle
        </GlassButton>
      </GlassGrid>
      <GlassButton
        onSelect={() => onNavigate("menu")}
        className="h-14 w-40 text-sm"
      >
        ← Back
      </GlassButton>
    </div>
  );
}
