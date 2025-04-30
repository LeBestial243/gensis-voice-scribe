
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResourceConfidentialitySelector } from '../confidentiality/ConfidentialityManager';
import { ConfidentialityLevel } from '@/types/confidentiality';
import { ReportSection, ReportType } from '@/types/reports';
import { PlusCircle, MinusCircle, Save, Loader2 } from 'lucide-react';

const reportFormSchema = z.object({
  title: z.string().min(3, { message: 'Le titre doit contenir au moins 3 caractères' }),
  report_type: z.string(),
  period_start: z.string(),
  period_end: z.string(),
  confidentiality_level: z.string(),
  sections: z.array(z.object({
    title: z.string().min(1, { message: 'Le titre est requis' }),
    content: z.string().min(1, { message: 'Le contenu est requis' }),
    type: z.string().optional()
  }))
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

interface StandardizedReportFormProps {
  initialData?: Partial<ReportFormValues>;
  onSubmit: (data: ReportFormValues) => void;
  isLoading?: boolean;
}

export function StandardizedReportForm({ initialData, onSubmit, isLoading = false }: StandardizedReportFormProps) {
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      report_type: initialData?.report_type || 'monthly',
      period_start: initialData?.period_start || new Date().toISOString().split('T')[0],
      period_end: initialData?.period_end || new Date().toISOString().split('T')[0],
      confidentiality_level: initialData?.confidentiality_level as ConfidentialityLevel || 'restricted',
      sections: initialData?.sections || [{ title: '', content: '', type: 'text' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'sections'
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titre du rapport</FormLabel>
                    <FormControl>
                      <Input placeholder="Entrez le titre du rapport" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="report_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type de rapport</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensuel</SelectItem>
                          <SelectItem value="quarterly">Trimestriel</SelectItem>
                          <SelectItem value="yearly">Annuel</SelectItem>
                          <SelectItem value="custom">Personnalisé</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confidentiality_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ResourceConfidentialitySelector 
                          value={field.value as ConfidentialityLevel} 
                          onChange={field.onChange}
                          showDescription={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="period_start"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de début</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="period_end"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de fin</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Sections du rapport</span>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => append({ title: '', content: '', type: 'text' })}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Ajouter une section
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {fields.map((field, index) => (
                  <div key={field.id} className="space-y-4 p-4 border rounded-md relative">
                    <div className="absolute right-2 top-2">
                      {fields.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => remove(index)}
                        >
                          <MinusCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`sections.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titre de la section</FormLabel>
                          <FormControl>
                            <Input placeholder="Titre" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`sections.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type de contenu</FormLabel>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texte</SelectItem>
                              <SelectItem value="metrics">Métriques</SelectItem>
                              <SelectItem value="chart">Graphique</SelectItem>
                              <SelectItem value="table">Tableau</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`sections.${index}.content`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contenu</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Contenu de la section" 
                              className="min-h-[100px]" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>
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
                    Enregistrer le rapport
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </Form>
  );
}
