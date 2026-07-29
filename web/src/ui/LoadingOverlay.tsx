interface LoadingOverlayProps {
  message: string;
}

export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-md">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      <p className="text-sm tracking-wide text-white/90">{message}</p>
    </div>
  );
}
