
interface AudioPreviewProps {
  audioURL: string | null;
  hasError?: boolean;
}

export function AudioPreview({ audioURL, hasError = false }: AudioPreviewProps) {
  if (!audioURL) return null;

  return (
    <div className="space-y-2">
      <p className={`text-sm font-medium ${hasError ? 'text-red-600' : ''}`}>Écouter l'enregistrement</p>
      <audio controls src={audioURL} className={`w-full ${hasError ? 'border border-red-500 rounded-md' : ''}`} />
    </div>
  );
}
