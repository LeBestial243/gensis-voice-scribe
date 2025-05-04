
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SaveNoteParams } from "@/types/note-generation";
import { useErrorHandler } from "@/utils/errorHandler";

export function useSaveNote(profileId: string, onSuccess?: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { handleError } = useErrorHandler();

  return useMutation({
    mutationFn: async ({ title, content, type, periodStart, periodEnd }: SaveNoteParams) => {
      try {
        const { data: note, error } = await supabase
          .from("notes")
          .insert({
            user_id: profileId,
            title,
            content,
            type,
            period_start: periodStart,
            period_end: periodEnd,
          })
          .select()
          .single();

        if (error) throw error;
        return note;
      } catch (error) {
        throw handleError(error, "Sauvegarde de la note", false).message;
      }
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
      handleError(error, "Sauvegarde de la note", true);
    }
  });
}
