"use client";

import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import type { ParsedEfdData, EfdRecord } from '@/lib/types';
import { parseEfdFile, recalculateSummaries, exportRecordsToEfdText } from '@/lib/efd-parser';
import { useToast } from "@/hooks/use-toast";

import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarFooter } from '@/components/ui/sidebar';
import { AppLogo } from '@/components/efd-insights-logo';
import { FileUploader } from '@/components/file-uploader';
import { OperationsSummary } from '@/components/operations-summary';
import { TaxSummary } from '@/components/tax-summary';
import { RecordDataView } from '@/components/record-data-view';
import { Loader2, RefreshCw, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { recordHierarchy } from '@/lib/efd-structure';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function Home() {
  const [allData, setAllData] = useState<ParsedEfdData | null>(null);
  const [data, setData] = useState<ParsedEfdData | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'entradas' | 'saidas' | 'apuracao_pis' | 'apuracao_cofins' | 'estabelecimentos' | null>('entradas');
  const [selectedCnpj, setSelectedCnpj] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    if (!allData) return;

    if (selectedCnpj === 'all') {
        setData(allData);
        return;
    }

    const newRecords: { [key: string]: EfdRecord[] } = {};

    // Filter the records based on the selected CNPJ
    for (const type in allData.records) {
        const block = type.charAt(0);
        if (['0', '1', '9'].includes(block) || type === '0140') { // Keep global/structural blocks and establishments list
            newRecords[type] = allData.records[type];
        } else {
            const kept = allData.records[type].filter(r => r._cnpj === selectedCnpj);
            if (kept.length > 0) {
                newRecords[type] = kept;
            }
        }
    }

    // Adjust IND_MOV flag in block openers (e.g., C001) based on filtered data
    ['A', 'C', 'D', 'F', 'I', 'M', 'P'].forEach(block => {
        const openerType = `${block}001`;
        if (allData.records[openerType]) {
            const hasData = Object.keys(newRecords).some(type => type.startsWith(block) && type !== openerType);
            newRecords[openerType] = [{ ...allData.records[openerType][0], IND_MOV: hasData ? '0' : '1' }];
        }
    });

    const newSummaries = recalculateSummaries(newRecords);

    setData({
        records: newRecords,
        ...newSummaries,
    });

    // Reset view if the current selection is not available in the filtered data
    if (selectedRecord && !newRecords[selectedRecord]) {
      setSelectedRecord(null);
      setActiveView('entradas');
    }
     if (!selectedRecord) {
      // Keep current activeView unless it's a record that disappeared
    }


}, [selectedCnpj, allData]);

  const handleFileRead = (content: string) => {
    try {
      if (!content) {
        toast({
          variant: "destructive",
          title: "Erro ao ler arquivo",
          description: "O arquivo parece estar vazio.",
        });
        return;
      }
      const parsedData = parseEfdFile(content);
      setAllData(parsedData);
      setData(parsedData);
      setActiveView('entradas');
      setSelectedRecord(null);
      setSelectedCnpj('all');
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
    setAllData(null);
    setData(null);
    setSelectedRecord(null);
    setIsProcessing(false);
    setActiveView('entradas');
    setSelectedCnpj('all');
  };

  const handleSelectView = (view: typeof activeView) => {
    setActiveView(view);
    setSelectedRecord(null);
  };
  
  const handleRecordsUpdate = (updatedRecordList: EfdRecord[], recordType: string) => {
      if (!data || !allData) return;

      const updateSourceData = (source: ParsedEfdData) => {
        const updatedRecords = {
            ...source.records,
            [recordType]: updatedRecordList,
        };
        const newSummaries = recalculateSummaries(updatedRecords);
        return {
            records: updatedRecords,
            ...newSummaries,
        };
      };
      
      const newAllData = updateSourceData(allData);
      setAllData(newAllData);

      // If a filter is active, update the displayed data as well
      if (selectedCnpj !== 'all') {
         const newDisplayData = updateSourceData(data);
         setData(newDisplayData);
      } else {
         setData(newAllData);
      }
  };

  const handleExport = () => {
    if (!data) {
        toast({
            variant: "destructive",
            title: "Sem dados para exportar",
            description: "Carregue um arquivo primeiro.",
        });
        return;
    }
    try {
        const fileContent = exportRecordsToEfdText(data.records);
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        const cnpjSuffix = selectedCnpj === 'all' ? 'TODOS' : selectedCnpj;
        link.download = `EFD_CONTRIBUICOES_${cnpjSuffix}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
            title: "Exportação Concluída",
            description: "Seu arquivo foi gerado com sucesso.",
        });
    } catch (error) {
        console.error("Export error:", error);
        toast({
            variant: "destructive",
            title: "Erro na Exportação",
            description: "Não foi possível gerar o arquivo.",
        });
    }
  };

  const allRecordTypes = data ? Object.keys(data.records) : [];
  const childRecords = new Set(Object.values(recordHierarchy).flat());
  const parentRecords = allRecordTypes
      .filter(recordType => !childRecords.has(recordType) && recordType !== '0140') // Exclude 0140 from the list
      .sort((a, b) => { // Sorting logic
          const blockA = a.charAt(0);
          const blockB = b.charAt(0);
          const blockOrder = ['0', 'A', 'C', 'D', 'F', 'I', 'M', 'P', '1', '9'];
          const indexA = blockOrder.indexOf(blockA);
          const indexB = blockOrder.indexOf(blockB);

          if (indexA !== indexB) {
              return indexA - indexB;
          }
          return a.localeCompare(b);
      });
      
  const establishmentRecords = useMemo(() => allData?.records['0140'] || [], [allData]);

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
                    onClick={() => handleSelectView('estabelecimentos')}
                    isActive={activeView === 'estabelecimentos' && !selectedRecord}
                    className="w-full justify-start rounded-xl shadow-neumo active:shadow-neumo-inset data-[active=true]:shadow-neumo-inset data-[active=true]:bg-primary/20"
                    tooltip="Ver Estabelecimentos"
                  >
                    <span>Estabelecimentos</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
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
                {parentRecords.map(recordType => {
                  const children = recordHierarchy[recordType]?.filter(child => allRecordTypes.includes(child));
                  const hasChildren = children && children.length > 0;

                  if (hasChildren) {
                    return (
                      <Collapsible key={recordType} className="w-full">
                        <SidebarMenuItem className="flex items-center gap-0.5">
                          <SidebarMenuButton
                            onClick={() => setSelectedRecord(recordType)}
                            isActive={selectedRecord === recordType}
                            className="flex-grow justify-start rounded-r-none shadow-neumo active:shadow-neumo-inset data-[active=true]:shadow-neumo-inset data-[active=true]:bg-primary/20"
                            tooltip={`Registro ${recordType}`}
                          >
                            <span className="truncate">{`Registro ${recordType}`}</span>
                          </SidebarMenuButton>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-full rounded-l-none shadow-neumo active:shadow-neumo-inset data-[state=open]:bg-primary/10">
                              <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
                            </Button>
                          </CollapsibleTrigger>
                        </SidebarMenuItem>
                        <CollapsibleContent>
                          <div className="pl-4 my-1 space-y-1">
                            {children.map(childType => (
                              <SidebarMenuItem key={childType}>
                                <SidebarMenuButton
                                  onClick={() => setSelectedRecord(childType)}
                                  isActive={selectedRecord === childType}
                                  className="w-full justify-start rounded-xl shadow-neumo active:shadow-neumo-inset data-[active=true]:shadow-neumo-inset data-[active=true]:bg-primary/20"
                                  tooltip={`Registro ${childType}`}
                                >
                                  <span className="truncate text-xs font-normal pl-4">{`Registro ${childType}`}</span>
                                </SidebarMenuButton>
                              </SidebarMenuItem>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  }

                  return (
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
                  );
                })}
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
               <div className="flex flex-col">
                 <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                 {establishmentRecords.length > 1 && (
                    <p className="text-sm text-muted-foreground">
                        {selectedCnpj === 'all' ? 'Exibindo todos os estabelecimentos' : `Exibindo dados para: ${selectedCnpj}`}
                    </p>
                 )}
               </div>
               <div className="flex items-center gap-2">
                 {establishmentRecords.length > 1 && (
                    <Select value={selectedCnpj} onValueChange={setSelectedCnpj}>
                      <SelectTrigger className="w-[280px] shadow-neumo active:shadow-neumo-inset rounded-xl">
                        <SelectValue placeholder="Filtrar por Estabelecimento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Estabelecimentos</SelectItem>
                        {establishmentRecords.map((est) => (
                          <SelectItem key={est.CNPJ} value={est.CNPJ!}>
                            {`${est.NOME} (${est.CNPJ})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                <Button onClick={handleExport} variant="outline" className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Arquivo
                </Button>
                <Button onClick={handleReset} variant="ghost" className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Carregar Outro
                </Button>
              </div>
            </div>
            
            {selectedRecord ? (
              <RecordDataView
                key={`${selectedCnpj}-${selectedRecord}`}
                recordType={selectedRecord}
                records={data.records[selectedRecord] || []}
                onUpdate={(updatedRecords) => handleRecordsUpdate(updatedRecords, selectedRecord)}
              />
            ) : (
              <>
                {activeView === 'estabelecimentos' && allData && (
                   <RecordDataView
                      key={`all-data-0140-${selectedCnpj}`}
                      recordType="0140"
                      records={allData.records['0140'] || []}
                      onUpdate={(updatedRecords) => handleRecordsUpdate(updatedRecords, '0140')}
                   />
                )}
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
