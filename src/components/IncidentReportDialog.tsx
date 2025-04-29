
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VoiceRecorder } from "@/components/VoiceRecorder";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Download, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

// Step type for the incident reporting workflow
type Step = "recording" | "transcription" | "profiles" | "complete";

// Profile selection type with folder selection
type ProfileSelection = {
  profileId: string;
  selected: boolean;
  folderId: string | null;
};

export function IncidentReportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // State for the multi-step form
  const [step, setStep] = useState<Step>("recording");
  const [transcript, setTranscript] = useState<string>("");
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [title, setTitle] = useState<string>("");
  const [profileSelections, setProfileSelections] = useState<ProfileSelection[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const currentDate = format(new Date(), "PPP 'à' HH:mm", { locale: fr });

  // Query to get all profiles
  const { data: profiles = [] } = useQuery({
    queryKey: ["young_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("young_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open && step === "profiles",
  });

  // Initialize profile selections when profiles are loaded
  useEffect(() => {
    if (profiles.length > 0 && profileSelections.length === 0) {
      setProfileSelections(
        profiles.map((profile) => ({
          profileId: profile.id,
          selected: false,
          folderId: null,
        }))
      );
    }
  }, [profiles, profileSelections.length]);

  // Query to get folders for each profile
  const { data: allFolders = [] } = useQuery({
    queryKey: ["all_folders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open && step === "profiles",
  });

  // Handle transcription completion
  const handleTranscriptionComplete = (text: string, audioUrl: string | null, hasError?: boolean, errorMessage?: string | null, inconsistencies?: string[]) => {
    setTranscript(text);
    setAudioURL(audioUrl);
    setStep("transcription");
  };

  // Toggle profile selection
  const toggleProfileSelection = (profileId: string) => {
    setProfileSelections(
      profileSelections.map((selection) =>
        selection.profileId === profileId
          ? { ...selection, selected: !selection.selected }
          : selection
      )
    );
  };

  // Set folder for a profile
  const setFolderForProfile = (profileId: string, folderId: string) => {
    setProfileSelections(
      profileSelections.map((selection) =>
        selection.profileId === profileId
          ? { ...selection, folderId }
          : selection
      )
    );
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Get selected profiles with folders
      const selectedProfiles = profileSelections.filter(
        (selection) => selection.selected && selection.folderId
      );

      if (selectedProfiles.length === 0) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner au moins un profil et un dossier pour chaque profil sélectionné.",
          variant: "destructive",
        });
        return;
      }

      // Create file entries for each selected profile
      const filePromises = selectedProfiles.map(async (selection) => {
        const fileData = {
          folder_id: selection.folderId as string,
          name: title || `Incident du ${format(new Date(), "dd-MM-yyyy-HH-mm")}`,
          type: "text/plain",
          size: new Blob([transcript]).size,
          path: `incidents/${selection.folderId}/${Date.now()}.txt`,
          content: transcript, // Store content directly in database
        };

        const { data, error } = await supabase
          .from("files")
          .insert(fileData)
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      await Promise.all(filePromises);

      toast({
        title: "Incident signalé",
        description: `Rapport ajouté à ${selectedProfiles.length} profil(s)`,
      });

      setStep("complete");
      setTimeout(() => {
        onOpenChange(false);
        resetForm();
      }, 2000);
    } catch (error) {
      console.error("Error saving incident report:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'enregistrement du rapport.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setStep("recording");
    setTranscript("");
    setAudioURL(null);
    setTitle("");
    setProfileSelections([]);
  };

  // Get folders for a specific profile
  const getFoldersForProfile = (profileId: string) => {
    return allFolders.filter((folder) => folder.profile_id === profileId);
  };

  // Handle download transcript
  const handleDownloadTranscript = () => {
    const element = document.createElement("a");
    const file = new Blob([transcript], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${title || "incident"}_${format(new Date(), "yyyyMMdd-HHmm")}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle download audio
  const handleDownloadAudio = () => {
    if (!audioURL) return;
    
    const element = document.createElement("a");
    element.href = audioURL;
    element.download = `${title || "incident"}_${format(new Date(), "yyyyMMdd-HHmm")}.wav`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Dialog content based on current step
  const renderContent = () => {
    switch (step) {
      case "recording":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-center">Signaler un incident</h3>
            <p className="text-sm text-muted-foreground text-center">
              Enregistrez votre signalement d'incident
            </p>
            <VoiceRecorder
              onTranscriptionComplete={handleTranscriptionComplete}
              onTranscriptionStart={() => {}}
            />
          </div>
        );

      case "transcription":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Détails de l'incident</h3>
            <p className="text-sm text-muted-foreground">{currentDate}</p>

            <div>
              <label className="text-sm font-medium mb-2 block">Titre de l'incident</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Conflit pendant la récréation"
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Transcription</label>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadTranscript}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Texte
                  </Button>
                  {audioURL && (
                    <Button
                      onClick={handleDownloadAudio}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Audio
                    </Button>
                  )}
                </div>
              </div>
              
              <Textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                className="min-h-[150px]"
                placeholder="Transcription de l'incident..."
              />
            </div>

            {audioURL && (
              <div>
                <label className="text-sm font-medium mb-2 block">Audio enregistré</label>
                <audio controls src={audioURL} className="w-full" />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("recording")}
              >
                Retour
              </Button>
              <Button
                onClick={() => setStep("profiles")}
                disabled={!transcript.trim()}
              >
                Continuer
              </Button>
            </div>
          </div>
        );

      case "profiles":
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold">Associer aux profils</h3>
            <p className="text-sm text-muted-foreground">
              Sélectionnez les profils concernés par cet incident et le dossier où classer le rapport.
            </p>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {profiles.map((profile) => {
                const selection = profileSelections.find(
                  (s) => s.profileId === profile.id
                );
                const isSelected = selection?.selected || false;
                const folders = getFoldersForProfile(profile.id);

                return (
                  <div
                    key={profile.id}
                    className={`p-4 border rounded-lg ${
                      isSelected ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`profile-${profile.id}`}
                          checked={isSelected}
                          onCheckedChange={() => toggleProfileSelection(profile.id)}
                        />
                        <label
                          htmlFor={`profile-${profile.id}`}
                          className="font-medium cursor-pointer"
                        >
                          {profile.first_name} {profile.last_name}
                        </label>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="ml-6 mt-2">
                        <label className="text-sm text-muted-foreground block mb-1">
                          Choisir un dossier
                        </label>
                        <Select
                          value={selection?.folderId || ""}
                          onValueChange={(value) =>
                            setFolderForProfile(profile.id, value)
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Sélectionner un dossier" />
                          </SelectTrigger>
                          <SelectContent>
                            {folders.length > 0 ? (
                              folders.map((folder) => (
                                <SelectItem key={folder.id} value={folder.id}>
                                  {folder.title}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-folders" disabled>
                                Aucun dossier disponible
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep("transcription")}>
                Retour
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Envoi en cours..." : "Enregistrer"}
              </Button>
            </div>
          </div>
        );

      case "complete":
        return (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-3 mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-300" />
            </div>
            <h3 className="text-xl font-bold mb-2">Incident signalé</h3>
            <p className="text-center text-muted-foreground">
              Votre rapport a été classé dans les dossiers sélectionnés.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  // Custom styles for the backdrop of the dialog
  const backdropStyle = step === "recording" ? "bg-black/40" : "bg-black/60";

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen || step === "complete") {
        resetForm();
      }
      onOpenChange(newOpen);
    }}>
      <DialogContent
        className="sm:max-w-md md:max-w-lg max-h-[90vh] overflow-auto"
        overlayClassName={backdropStyle}
      >
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
