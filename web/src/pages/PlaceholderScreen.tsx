import { GlassPanel } from "../ui/GlassPanel";
import { GlassButton } from "../ui/GlassButton";

interface Props {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

export function PlaceholderScreen({ title, subtitle, onBack }: Props) {
  return (
    <div className="flex flex-col items-center gap-8">
      <GlassPanel className="px-10 py-8 text-center">
        <h1 className="text-3xl font-semibold text-white">{title}</h1>
        <p className="mt-2 text-white/60">
          {subtitle ?? "Not built yet — coming in a later phase."}
        </p>
      </GlassPanel>
      <GlassButton onSelect={onBack} className="h-14 w-40 text-sm">
        ← Back
      </GlassButton>
    </div>
  );
}
