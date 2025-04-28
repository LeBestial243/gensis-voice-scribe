
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SaveNoteParams } from "@/types/note-generation";

export function useSaveNote(profileId: string, onSuccess?: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, content }: SaveNoteParams) => {
      const { data: note, error } = await supabase
        .from("notes")
        .insert({
          user_id: profileId,
          title,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving note:', error);
        throw new Error(`Erreur lors de la sauvegarde: ${error.message}`);
      }
      return note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      toast({
        title: "Note sauvegardée",
        description: "La note IA a été sauvegardée avec succès"
      });
      onSuccess?.();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue";
      toast({
        title: "Erreur de sauvegarde",
        description: "Impossible de sauvegarder la note: " + errorMessage,
        variant: "destructive"
      });
    }
  });
}
