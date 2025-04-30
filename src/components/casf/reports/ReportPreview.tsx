
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StandardizedReport, ActivityReport } from '@/types/casf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FileText, Download, Edit } from 'lucide-react';

interface ReportPreviewProps {
  report: StandardizedReport | ActivityReport;
  onEdit?: () => void;
  onExport?: () => void;
}

export function ReportPreview({ report, onEdit, onExport }: ReportPreviewProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP', { locale: fr });
    } catch (e) {
      return dateString;
    }
  };
  
  const isActivityReport = (
    report: StandardizedReport | ActivityReport
  ): report is ActivityReport => {
    return 'period_start' in report && 'period_end' in report;
  };
  
  const getReportTypeName = () => {
    if (isActivityReport(report)) {
      switch (report.report_type) {
        case 'monthly':
          return 'Mensuel';
        case 'quarterly':
          return 'Trimestriel';
        case 'yearly':
          return 'Annuel';
        case 'custom':
          return 'Personnalisé';
        default:
          return report.report_type;
      }
    } else {
      switch (report.report_type) {
        case 'admission':
          return 'Admission';
        case 'evaluation':
          return 'Évaluation';
        case 'periodic':
          return 'Périodique';
        case 'incident':
          return 'Incident';
        case 'custom':
          return 'Personnalisé';
        default:
          return report.report_type;
      }
    }
  };
  
  const renderSections = () => {
    const sections = report.content && report.content.sections 
      ? report.content.sections 
      : [];
    
    if (!sections || sections.length === 0) {
      return <p className="text-muted-foreground">Aucune section dans ce rapport.</p>;
    }
    
    return sections.map((section, index) => (
      <div key={index} className="mb-6">
        <h3 className="text-lg font-medium mb-2">{section.title}</h3>
        <div className="whitespace-pre-wrap text-muted-foreground">
          {section.content || "Aucun contenu."}
        </div>
      </div>
    ));
  };
  
  const renderMetrics = () => {
    if (!isActivityReport(report) || 
        !report.content || 
        !report.content.metrics || 
        report.content.metrics.length === 0) {
      return null;
    }
    
    return (
      <div className="mt-6">
        <h3 className="text-lg font-medium mb-3">Métriques</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {report.content.metrics.map((metric, index) => (
            <Card key={index} className="bg-accent/10">
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {metric.value} {metric.unit}
                </div>
                <div className="text-sm text-muted-foreground">
                  {metric.name}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-accent/5">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle className="text-2xl">{report.title}</CardTitle>
            <div className="text-muted-foreground mt-1 flex items-center">
              <FileText className="h-4 w-4 mr-1" />
              <span>Rapport {getReportTypeName()}</span>
              
              {isActivityReport(report) && (
                <span className="ml-2">
                  • {formatDate(report.period_start)} - {formatDate(report.period_end)}
                </span>
              )}
              
              {'created_at' in report && (
                <span className="ml-2">
                  • Créé le {formatDate(report.created_at)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
            )}
            
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Exporter
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {/* Report Content */}
        {renderSections()}
        
        {/* Metrics for Activity Reports */}
        {renderMetrics()}
      </CardContent>
    </Card>
  );
}
