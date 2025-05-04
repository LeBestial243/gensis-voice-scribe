
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ReportPreviewProps {
  report: Record<string, any>;
}

export function ReportPreview({ report }: ReportPreviewProps) {
  if (!report) return null;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Helper to render section content based on type
  const renderSectionContent = (section: any) => {
    if (!section.content) return null;
    
    if (typeof section.content === 'string') {
      return <p className="whitespace-pre-line">{section.content}</p>;
    }
    
    if (Array.isArray(section.content)) {
      return (
        <ul className="list-disc pl-5 space-y-1">
          {section.content.map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );
    }
    
    if (section.content.headers && section.content.rows) {
      return (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                {section.content.headers.map((header: string, i: number) => (
                  <th key={i} className="border px-4 py-2 text-left text-sm">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {section.content.rows.map((row: string[], i: number) => (
                <tr key={i} className="even:bg-muted/50">
                  {row.map((cell, j) => (
                    <td key={j} className="border px-4 py-2 text-sm">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    
    if (section.content.positive || section.content.negative) {
      return (
        <div className="space-y-4">
          {section.content.positive && (
            <div>
              <h5 className="font-medium text-green-600 dark:text-green-400 mb-2">Points positifs :</h5>
              <ul className="list-disc pl-5 space-y-1">
                {section.content.positive.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {section.content.negative && (
            <div>
              <h5 className="font-medium text-red-600 dark:text-red-400 mb-2">Points à améliorer :</h5>
              <ul className="list-disc pl-5 space-y-1">
                {section.content.negative.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          
          {section.content.recommendations && (
            <div>
              <h5 className="font-medium text-blue-600 dark:text-blue-400 mb-2">Recommandations :</h5>
              <ul className="list-disc pl-5 space-y-1">
                {section.content.recommendations.map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    return <pre className="text-xs overflow-auto p-2 bg-muted rounded">{JSON.stringify(section.content, null, 2)}</pre>;
  };
  
  return (
    <div className="space-y-8 print:p-8">
      {/* Header */}
      <div className="space-y-2 print:space-y-4 border-b pb-4 print:border-black">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl print:text-3xl font-bold">{report.title}</h1>
          <Badge className="print:hidden">{report.institution}</Badge>
        </div>
        
        <div className="flex gap-x-4 gap-y-2 flex-wrap text-sm print:text-base text-muted-foreground print:text-black">
          <div>
            <strong>Nom :</strong> {report.metadata?.profile?.fullName}
          </div>
          <div>
            <strong>Date de naissance :</strong> {formatDate(report.metadata?.profile?.birthDate)}
          </div>
          <div>
            <strong>Âge :</strong> {report.metadata?.profile?.age} ans
          </div>
          <div>
            <strong>Période :</strong>{" "}
            {formatDate(report.metadata?.periodStart)} au {formatDate(report.metadata?.periodEnd)}
          </div>
        </div>
      </div>
      
      {/* Report sections */}
      <div className="space-y-6 print:space-y-8">
        {report.sections?.map((section: any, index: number) => (
          <section key={index} className="space-y-3">
            <h2 className="text-xl print:text-2xl font-semibold">{section.title}</h2>
            <div className="print:text-base">
              {renderSectionContent(section)}
            </div>
          </section>
        ))}
      </div>
      
      {/* Footer */}
      <div className="text-sm text-muted-foreground border-t pt-4 print:border-black print:pt-6 print:text-black">
        <p>Rapport généré le {formatDate(report.metadata?.generatedAt)}</p>
      </div>
    </div>
  );
}
