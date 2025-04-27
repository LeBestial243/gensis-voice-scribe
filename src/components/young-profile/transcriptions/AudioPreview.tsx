
interface AudioPreviewProps {
  audioURL: string | null;
}

export function AudioPreview({ audioURL }: AudioPreviewProps) {
  if (!audioURL) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Écouter l'enregistrement</p>
      <audio controls src={audioURL} className="w-full" />
    </div>
  );
}
