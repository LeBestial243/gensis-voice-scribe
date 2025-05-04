
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useReportGeneration } from '@/hooks/useReportGeneration';
import { useActivityReport } from '@/hooks/useActivityReport';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Header } from '@/components/Header';
import { GenerateReportDialog } from '@/components/casf/reports/GenerateReportDialog';
import { FileText, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export default function ActivityReportsPage() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { generateReport, isGenerating } = useReportGeneration();
  const { createReport, isCreating } = useActivityReport();
  
  const handleCreateReport = async (data: any) => {
    if (!user) return;
    
    const reportData = {
      title: data.title || "Nouveau rapport d'activité",
      reportType: data.report_type || "monthly",
      periodStart: data.period_start || new Date().toISOString(),
      periodEnd: data.period_end || new Date().toISOString(),
      content: data.content,
      userId: user.id
    };
    
    return await generateReport(reportData);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1">
          <Header />
          <main className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Rapports d'activité</h1>
              <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouveau rapport
              </Button>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-center h-48 text-center">
                <div>
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Créez votre premier rapport d'activité</h2>
                  <p className="text-muted-foreground mb-4">
                    Les rapports d'activité vous permettent de suivre et documenter vos activités.
                  </p>
                  <Button onClick={() => setIsDialogOpen(true)}>
                    Commencer
                  </Button>
                </div>
              </div>
            </Card>

            <GenerateReportDialog
              open={isDialogOpen}
              onOpenChange={setIsDialogOpen}
              reportType="activity"
              onSubmit={handleCreateReport}
              isLoading={isGenerating || isCreating}
            />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
