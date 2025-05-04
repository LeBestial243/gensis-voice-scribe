
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { GenerateReportDialog } from './GenerateReportDialog';
import { ReportTemplate, ActivityReport, StandardizedReport } from '@/types/casf';

interface GenerateReportButtonProps {
  reportType: 'activity' | 'standardized';
  profileId?: string;
  onReportGenerated: (report: ActivityReport | StandardizedReport) => void;
  templates?: ReportTemplate[];
  initialData?: Partial<ActivityReport | StandardizedReport>;
}

export function GenerateReportButton({
  reportType,
  profileId,
  onReportGenerated,
  templates = [],
  initialData
}: GenerateReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: any): Promise<any> => {
    setIsLoading(true);
    try {
      // En production, vous pourriez appeler une API ici
      // Pour cet exemple, on simule une réponse
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simuler un ID généré et une date de création
      const generatedReport = {
        ...data,
        id: `gen-${Date.now()}`,
        created_at: new Date().toISOString()
      };
      
      onReportGenerated(generatedReport);
      return generatedReport;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        className="bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center gap-2"
        onClick={() => setOpen(true)}
      >
        <Sparkles className="h-4 w-4" />
        Générer avec IA
      </Button>

      <GenerateReportDialog
        open={open}
        onOpenChange={setOpen}
        profileId={profileId}
        reportType={reportType}
        onSubmit={handleSubmit}
        initialData={initialData}
        isLoading={isLoading}
        templates={templates}
      />
    </>
  );
}
