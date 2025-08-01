
"use client";

import { UploadCloud, FileText } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFileRead: (content: string) => Promise<void>;
  onProcessing: (isProcessing: boolean) => void;
}

export function FileUploader({ onFileRead, onProcessing }: FileUploaderProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;

    if(file.type !== 'text/plain') {
        toast({
        variant: "destructive",
        title: "Formato de arquivo inválido",
        description: "Por favor, selecione um arquivo .txt.",
      });
      return;
    }

    setFileName(file.name);
    
    // We don't set processing to true here. 
    // The parent component (`page.tsx`) will be responsible for that
    // *before* it starts the heavy lifting.

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      try {
          // Await the full processing from the parent.
          await onFileRead(text);
      } catch (error) {
          // The parent's `try/catch` will handle the toast notifications.
          // We just log it here for debugging.
          console.error("Error passed to FileUploader:", error);
      }
    };
    
    reader.onerror = () => {
      onProcessing(false); // Make sure to stop processing on a read error
      toast({
        variant: "destructive",
        title: "Erro de Leitura",
        description: "Não foi possível ler o arquivo selecionado.",
      });
      console.error("Failed to read file");
    }

    reader.readAsText(file, 'windows-1252');

  }, [onFileRead, onProcessing, toast]);

  const onDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      handleFile(event.dataTransfer.files[0]);
      event.dataTransfer.clearData();
    }
  }, [handleFile]);

  const onDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };
  
  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(event.target.files ? event.target.files[0] : null);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <label
        htmlFor="file-upload"
        className="relative block w-full rounded-2xl cursor-pointer bg-background p-8 text-center transition-all duration-300 shadow-neumo hover:shadow-neumo-inset active:shadow-neumo-inset"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow-neumo">
            <UploadCloud className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">
              Arraste e solte o arquivo .txt aqui
            </p>
            <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
          </div>
          {fileName && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-background p-2 px-4 shadow-neumo-inset text-sm text-foreground">
              <FileText className="h-4 w-4" />
              <span>{fileName}</span>
            </div>
          )}
        </div>
        <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".txt" onChange={onFileChange} />
      </label>
    </div>
  );
}
