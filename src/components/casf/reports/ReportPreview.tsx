
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ActivityReport, ReportSection } from '@/types/reports';
import { AccessLevelBadge } from '../confidentiality/AccessLevelBadge';

interface ReportPreviewProps {
  report: ActivityReport;
}

export function ReportPreview({ report }: ReportPreviewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly': return 'Mensuel';
      case 'quarterly': return 'Trimestriel';
      case 'yearly': return 'Annuel';
      case 'custom': return 'Personnalisé';
      default: return type;
    }
  };

  const renderSectionContent = (section: ReportSection) => {
    switch (section.type) {
      case 'metrics':
        return (
          <div className="bg-muted/50 p-4 rounded-md">
            <p className="font-mono">{section.content}</p>
            {section.data && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {Object.entries(section.data as Record<string, React.ReactNode>).map(([key, value]) => (
                  <div key={key} className="bg-background p-3 rounded-md text-center">
                    <p className="text-2xl font-bold">{String(value)}</p>
                    <p className="text-sm text-muted-foreground">{key}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'table':
        return (
          <div className="overflow-x-auto">
            <p className="mb-2">{section.content}</p>
            {section.data && section.data.rows && (
              <div className="border rounded-md">
                <table className="w-full">
                  <thead>
                    <tr className="bg-muted">
                      {section.data.headers?.map((header: string, i: number) => (
                        <th key={i} className="p-2 text-left">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.data.rows.map((row: any, i: number) => (
                      <tr key={i} className="border-t">
                        {Array.isArray(row) ? row.map((cell, j) => (
                          <td key={j} className="p-2">{cell}</td>
                        )) : Object.values(row).map((cell: any, j) => (
                          <td key={j} className="p-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      
      case 'chart':
        // Placeholder for chart rendering
        return (
          <div>
            <p>{section.content}</p>
            <div className="h-[200px] bg-muted/50 rounded-md flex items-center justify-center mt-2">
              Aperçu du graphique
            </div>
          </div>
        );
      
      default:
        // Default text rendering
        return <div className="whitespace-pre-wrap">{section.content}</div>;
    }
  };

  // Parse content from JSON if needed
  const sections = report.content && typeof report.content === 'object' && 'sections' in report.content 
    ? report.content.sections as ReportSection[] 
    : [];
    
  // Get confidentiality level with type safety
  const confidentialityLevel = report.content && 
    typeof report.content === 'object' && 
    'confidentiality_level' in report.content ? 
    String(report.content.confidentiality_level) : 'public';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">{report.title}</CardTitle>
            <AccessLevelBadge level={confidentialityLevel} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground mt-2">
            <div>
              <span className="font-medium">Type:</span> {getReportTypeLabel(report.report_type)}
            </div>
            <div>
              <span className="font-medium">Période:</span> {formatDate(report.period_start)} - {formatDate(report.period_end)}
            </div>
            <div>
              <span className="font-medium">Créé le:</span> {formatDate(report.created_at)}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {sections.length > 0 ? (
            <div className="space-y-6">
              {sections.map((section, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                  {renderSectionContent(section)}
                  {index < sections.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Ce rapport ne contient aucune section.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
