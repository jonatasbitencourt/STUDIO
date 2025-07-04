"use client";

import { useState } from 'react';
import type { ParsedEfdData } from '@/lib/types';
import { parseEfdFile } from '@/lib/efd-parser';
import { useToast } from "@/hooks/use-toast";

import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarFooter } from '@/components/ui/sidebar';
import { AppLogo } from '@/components/efd-insights-logo';
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
  const [activeView, setActiveView] = useState<'entradas' | 'saidas' | 'apuracao_pis' | 'apuracao_cofins' | null>('entradas');
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
      setActiveView('entradas');
      setSelectedRecord(null);
    } catch (error)      {
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
    setActiveView('entradas');
  }

  const handleSelectView = (view: typeof activeView) => {
    setActiveView(view);
    setSelectedRecord(null);
  };

  const recordTypes = data ? Object.keys(data.records) : [];

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <AppLogo />
        </SidebarHeader>
        <SidebarContent>
          {data && (
            <>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleSelectView('entradas')}
                    isActive={activeView === 'entradas' && !selectedRecord}
                    className="w-full justify-start rounded-xl shadow-neumo active:shadow-neumo-inset data-[active=true]:shadow-neumo-inset data-[active=true]:bg-primary/20"
                    tooltip="Resumo das Entradas"
                  >
                    <span>Entradas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleSelectView('saidas')}
                    isActive={activeView === 'saidas' && !selectedRecord}
                    className="w-full justify-start rounded-xl shadow-neumo active:shadow-neumo-inset data-[active=true]:shadow-neumo-inset data-[active=true]:bg-primary/20"
                    tooltip="Resumo das Saídas"
                  >
                    <span>Saídas</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleSelectView('apuracao_pis')}
                    isActive={activeView === 'apuracao_pis' && !selectedRecord}
                    className="w-full justify-start rounded-xl shadow-neumo active:shadow-neumo-inset data-[active=true]:shadow-neumo-inset data-[active=true]:bg-primary/20"
                    tooltip="Apuração PIS"
                  >
                    <span>Apuração PIS</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => handleSelectView('apuracao_cofins')}
                    isActive={activeView === 'apuracao_cofins' && !selectedRecord}
                    className="w-full justify-start rounded-xl shadow-neumo active:shadow-neumo-inset data-[active=true]:shadow-neumo-inset data-[active=true]:bg-primary/20"
                    tooltip="Apuração COFINS"
                  >
                    <span>Apuração COFINS</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarSeparator className="my-2" />
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
            </>
          )}
        </SidebarContent>
        <SidebarFooter className="p-4 mt-auto">
          <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            Developed by Jonatas Bitencourt
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="p-4 sm:p-6 lg:p-8">
        {isProcessing && (
          <div className="flex flex-col gap-4 items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Processando arquivo...</p>
          </div>
        )}

        {!data && !isProcessing && (
          <div className="flex items-center justify-center h-full">
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
            
            {selectedRecord ? (
              <RecordDataView
                recordType={selectedRecord}
                records={data.records[selectedRecord] || []}
              />
            ) : (
              <>
                {activeView === 'entradas' && <OperationsSummary data={data.operationsSummaryEntradas} />}
                {activeView === 'saidas' && <OperationsSummary data={data.operationsSummarySaidas} />}
                {activeView === 'apuracao_pis' && <TaxSummary data={data.taxSummaryPis} title="Apuração PIS" description="Detalhamento da apuração de PIS (Registros do Bloco M)" />}
                {activeView === 'apuracao_cofins' && <TaxSummary data={data.taxSummaryCofins} title="Apuração COFINS" description="Detalhamento da apuração de COFINS (Registros do Bloco M)" />}
              </>
            )}
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
