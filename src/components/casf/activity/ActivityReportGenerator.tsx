
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ReportType, ActivityReport } from '@/types/reports';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileText, Download } from 'lucide-react';
import { StandardizedReportForm } from '../reports/StandardizedReportForm';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

interface GeneratorFormValues {
  title: string;
  reportType: ReportType;
  periodStart: string;
  periodEnd: string;
}

const formSchema = z.object({
  title: z.string().min(3, "Le titre doit comporter au moins 3 caractères"),
  reportType: z.enum(['monthly', 'quarterly', 'yearly', 'custom'] as const),
  periodStart: z.string().min(1, "Veuillez sélectionner une date de début"),
  periodEnd: z.string().min(1, "Veuillez sélectionner une date de fin")
});

export function ActivityReportGenerator() {
  const [generatingReport, setGeneratingReport] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get today's date and first day of current month
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: `Rapport d'activité ${today.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`,
      reportType: 'monthly',
      periodStart: firstDayOfMonth.toISOString().split('T')[0],
      periodEnd: today.toISOString().split('T')[0]
    }
  });

  const createReportMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      // Format report data
      const reportData = {
        title: data.title,
        report_type: data.reportType,
        period_start: data.periodStart,
        period_end: data.periodEnd,
        user_id: "system", // This would be replaced with the actual user ID in a real application
        content: {
          sections: [
            {
              title: "Vue d'ensemble",
              content: `Ce rapport couvre la période du ${new Date(data.periodStart).toLocaleDateString('fr-FR')} au ${new Date(data.periodEnd).toLocaleDateString('fr-FR')}.`,
              type: "text"
            }
          ],
          metadata: {
            generated: new Date().toISOString(),
            automated: true
          }
        }
      };
      
      return reportService.createReport(reportData);
    },
    onSuccess: () => {
      toast({
        title: "Rapport créé",
        description: "Le rapport d'activité a été généré avec succès."
      });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération du rapport.",
        variant: "destructive"
      });
      console.error("Report generation error:", error);
    }
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    createReportMutation.mutate(data);
  };

  // Set appropriate date ranges when report type changes
  const handleReportTypeChange = (type: ReportType) => {
    const now = new Date();
    let startDate: Date;
    
    switch (type) {
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    form.setValue('periodStart', startDate.toISOString().split('T')[0]);
    form.setValue('periodEnd', now.toISOString().split('T')[0]);
    
    // Generate default title based on type
    let title = '';
    switch (type) {
      case 'monthly':
        title = `Rapport mensuel - ${now.toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}`;
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3) + 1;
        title = `Rapport trimestriel - Q${quarter} ${now.getFullYear()}`;
        break;
      case 'yearly':
        title = `Rapport annuel ${now.getFullYear()}`;
        break;
      default:
        title = `Rapport personnalisé - ${now.toLocaleDateString('fr-FR')}`;
    }
    
    form.setValue('title', title);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Générer un rapport d'activité</CardTitle>
        <CardDescription>
          Créez un rapport d'activité basé sur une période spécifique
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre du rapport</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre du rapport" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reportType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type de rapport</FormLabel>
                  <Select 
                    onValueChange={(value: ReportType) => {
                      field.onChange(value);
                      handleReportTypeChange(value);
                    }}
                    value={field.value}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type de rapport" />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodStart"
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
                name="periodEnd"
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

            <Button 
              type="submit" 
              className="w-full" 
              disabled={createReportMutation.isPending}
            >
              {createReportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Générer le rapport
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
