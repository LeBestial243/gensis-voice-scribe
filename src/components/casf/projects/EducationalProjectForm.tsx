
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Loader2, Save } from 'lucide-react';
import { ProjectStatus } from '@/types/projects';

const projectFormSchema = z.object({
  title: z.string().min(3, { message: 'Le titre doit contenir au moins 3 caractères' }),
  objectives: z.string().optional(),
  status: z.string(),
  start_date: z.string(),
  end_date: z.string().refine(date => !!date, { 
    message: 'La date de fin est requise' 
  }),
  profile_id: z.string().uuid({ message: 'ID de profil invalide' })
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface EducationalProjectFormProps {
  initialData?: Partial<ProjectFormValues>;
  onSubmit: (data: ProjectFormValues) => void;
  profileId: string;
  isLoading?: boolean;
}

export function EducationalProjectForm({ 
  initialData, 
  onSubmit, 
  profileId, 
  isLoading = false 
}: EducationalProjectFormProps) {
  
  // Get today and 6 months from now for default dates
  const today = new Date();
  const sixMonthsFromNow = new Date();
  sixMonthsFromNow.setMonth(today.getMonth() + 6);
  
  // Format dates to YYYY-MM-DD
  const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];
  
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      objectives: initialData?.objectives || '',
      status: initialData?.status || 'planned',
      start_date: initialData?.start_date || formatDateForInput(today),
      end_date: initialData?.end_date || formatDateForInput(sixMonthsFromNow),
      profile_id: profileId
    }
  });
  
  const handleSubmit = (values: ProjectFormValues) => {
    onSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>
              {initialData?.title ? 'Modifier le projet' : 'Nouveau projet éducatif'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du projet</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre du projet éducatif" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="objectives"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objectifs généraux</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Objectifs généraux du projet" 
                      className="min-h-[100px]" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Décrivez les objectifs principaux de ce projet éducatif.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planifié</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Terminé</SelectItem>
                        <SelectItem value="cancelled">Annulé</SelectItem>
                        <SelectItem value="on_hold">En pause</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de début</FormLabel>
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
              
              <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de fin</FormLabel>
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
            
            {/* Hidden field for profile_id */}
            <input type="hidden" {...form.register('profile_id')} />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="ml-auto" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer le projet
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
