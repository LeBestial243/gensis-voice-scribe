
import { StandardizedReportType } from "@/types/reports";

export function getReportTypeLabel(reportType: StandardizedReportType): string {
  switch (reportType) {
    case "activity":
      return "d'activité";
    case "standardized":
      return "standardisé";
    case "evaluation":
      return "d'évaluation";
    case "note":
    default:
      return "de synthèse";
  }
}

export function createDownloadableFile(content: string, filename: string): void {
  const element = document.createElement("a");
  const file = new Blob([content], {type: 'text/plain'});
  element.href = URL.createObjectURL(file);
  element.download = `${filename || "rapport"}.txt`;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
