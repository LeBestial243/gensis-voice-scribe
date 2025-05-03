
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, File, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WordTemplateUploadProps {
  templateId: string | null;
  existingFileUrl: string | null;
  existingFileName: string | null;
  onFileUploaded: (fileUrl: string, fileName: string) => void;
  onFileRemoved: () => void;
}

export function WordTemplateUpload({
  templateId,
  existingFileUrl,
  existingFileName,
  onFileUploaded,
  onFileRemoved
}: WordTemplateUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Set initial fileName from props
  useEffect(() => {
    if (existingFileName) {
      setFileName(existingFileName);
    } else if (existingFileUrl) {
      const nameFromUrl = existingFileUrl.split('/').pop() || "template-file.docx";
      setFileName(nameFromUrl);
    }
  }, [existingFileUrl, existingFileName]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const isWordFile = 
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || // .docx
      file.type === "application/msword"; // .doc
    
    if (!isWordFile) {
      toast({
        title: "Format de fichier non supporté",
        description: "Veuillez sélectionner un fichier Word (.doc ou .docx)",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    setFileName(file.name);

    try {
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${templateId || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `templates/${uniqueFileName}`;
      
      const { data, error } = await supabase.storage
        .from('templates-files')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('templates-files')
        .getPublicUrl(filePath);
      
      onFileUploaded(urlData.publicUrl, file.name);
      
      toast({
        title: "Fichier ajouté",
        description: "Le fichier a été téléchargé avec succès"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Erreur de téléchargement",
        description: "Impossible de télécharger le fichier",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFileName(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onFileRemoved();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={triggerFileUpload}
          disabled={isUploading}
        >
          <Upload className="h-4 w-4 mr-2" />
          {fileName ? "Changer le fichier" : "Importer un template Word"}
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        />
      </div>

      {fileName && (
        <div className="flex items-center gap-2 p-2 border rounded bg-secondary/30">
          <File className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium flex-1 truncate">
            {fileName}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRemoveFile}
            className="h-6 w-6 p-0 rounded-full"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Supprimer</span>
          </Button>
        </div>
      )}

      {existingFileUrl && (
        <div className="mt-2">
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto"
            asChild
          >
            <a href={existingFileUrl} target="_blank" rel="noopener noreferrer">
              Télécharger le template
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}
