"use client";

import { useState } from 'react';
import type { ParsedEfdData } from '@/lib/types';
import { parseEfdFile } from '@/lib/efd-parser';
import { useToast } from "@/hooks/use-toast";

import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { EfdInsightsLogo } from '@/components/efd-insights-logo';
import { FileUploader } from '@/components/file-uploader';
import { OperationsSummary } from '@/components/operations-summary';
import { TaxSummary } from '@/components/tax-summary';
import { RecordDataView } from '@/components/record-data-view';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';


export default function Home() {
  const [data, setData] = useState<ParsedEfdData | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'operations' | 'tax'>('operations');
  const { toast } = useToast();

  const handleFileRead = (content: string) => {
    try {
      if(!content) {
        toast({
          variant: "destructive",
          title: "Erro ao ler arquivo",
          description: "O arquivo parece estar vazio.",
        });
        return;
      }
      const parsedData = parseEfdFile(content);
      setData(parsedData);
      setActiveView('operations');
      const firstRecordType = Object.keys(parsedData.records)[0];
      if (firstRecordType) {
        setSelectedRecord(firstRecordType);
      }
    } catch (error) {
      console.error("Parsing error:", error);
      toast({
        variant: "destructive",
        title: "Erro de Análise",
        description: "Não foi possível analisar o arquivo. Verifique se o formato está correto.",
      });
    }
  };
  
  const handleReset = () => {
    setData(null);
    setSelectedRecord(null);
    setIsProcessing(false);
    setActiveView('operations');
  }

  const recordTypes = data ? Object.keys(data.records) : [];

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar collapsible="icon">
          <SidebarHeader className="p-4">
            <EfdInsightsLogo />
          </SidebarHeader>
          <SidebarContent>
            {data && (
              <SidebarMenu>
                {recordTypes.map(recordType => (
                  <SidebarMenuItem key={recordType}>
                    <SidebarMenuButton
                      onClick={() => setSelectedRecord(recordType)}
                      isActive={selectedRecord === recordType}
                      className="w-full justify-start rounded-xl shadow-neumo active:shadow-neumo-inset data-[active=true]:shadow-neumo-inset data-[active=true]:bg-primary/20"
                      tooltip={`Registro ${recordType}`}
                    >
                      <span className="truncate">{`Registro ${recordType}`}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          <main className="p-4 sm:p-6 lg:p-8 flex-1">
            {isProcessing && (
              <div className="flex flex-col gap-4 items-center justify-center h-full min-h-[calc(100vh-4rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Processando arquivo...</p>
              </div>
            )}

            {!data && !isProcessing && (
              <div className="flex items-center justify-center h-full min-h-[calc(100vh-4rem)]">
                <FileUploader onFileRead={handleFileRead} onProcessing={setIsProcessing} />
              </div>
            )}
            
            {data && !isProcessing && (
              <div className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                  <Button onClick={handleReset} variant="ghost" className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Carregar Outro Arquivo
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={() => setActiveView('operations')} 
                    variant={activeView === 'operations' ? 'default' : 'outline'}
                    className="shadow-neumo active:shadow-neumo-inset rounded-xl"
                  >
                    Resumo das Operações
                  </Button>
                  <Button 
                    onClick={() => setActiveView('tax')} 
                    variant={activeView === 'tax' ? 'default' : 'outline'}
                    className="shadow-neumo active:shadow-neumo-inset rounded-xl"
                  >
                    Resumo da Apuração
                  </Button>
                </div>

                {activeView === 'operations' && <OperationsSummary data={data.operationsSummary} />}
                {activeView === 'tax' && <TaxSummary data={data.taxSummary} />}
                
                <RecordDataView
                  recordType={selectedRecord || ''}
                  records={selectedRecord ? data.records[selectedRecord] : []}
                />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
