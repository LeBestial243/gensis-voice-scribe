
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProjectObjective } from '@/types/projects';
import { Calendar, Loader2, Save } from 'lucide-react';

const objectiveFormSchema = z.object({
  title: z.string().min(3, { message: 'Le titre doit contenir au moins 3 caractères' }),
  description: z.string().optional(),
  status: z.string(),
  target_date: z.string(),
  notes: z.string().optional(),
});

type ObjectiveFormValues = z.infer<typeof objectiveFormSchema>;

interface ObjectiveFormProps {
  initialData?: Partial<ProjectObjective>;
  onSubmit: (data: Omit<ProjectObjective, 'id' | 'created_at' | 'updated_at'>) => void;
  projectId: string;
  isLoading?: boolean;
}

export function ObjectiveForm({ 
  initialData, 
  onSubmit, 
  projectId, 
  isLoading = false 
}: ObjectiveFormProps) {
  
  // Get today for default date
  const today = new Date();
  
  // Format date to YYYY-MM-DD
  const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];
  
  const form = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      status: initialData?.status || 'not_started',
      target_date: initialData?.target_date ? new Date(initialData.target_date).toISOString().split('T')[0] : formatDateForInput(today),
      notes: initialData?.notes || '',
    }
  });
  
  const handleSubmit = (values: ObjectiveFormValues) => {
    onSubmit({
      project_id: projectId,
      title: values.title,
      description: values.description,
      status: values.status || 'not_started',
      target_date: values.target_date,
      notes: values.notes,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre de l'objectif</FormLabel>
              <FormControl>
                <Input placeholder="Titre de l'objectif" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Description détaillée de l'objectif" 
                  className="min-h-[80px]" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Statut</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_started">Non commencé</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="target_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date cible</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="date" 
                      className="pl-9" 
                      {...field} 
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Notes additionnelles" 
                  className="min-h-[80px]" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormDescription>
                Informations supplémentaires ou remarques sur l'objectif.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
