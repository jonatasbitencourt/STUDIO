
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ParsedEfdData, EfdRecord } from '@/lib/types';
import { parseEfdFile, recalculateSummaries, exportRecordsToEfdText, RECORD_DEFINITIONS } from '@/lib/efd-client-parser';
import { useToast } from "@/hooks/use-toast";

import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarFooter } from '@/components/ui/sidebar';
import { AppLogo } from '@/components/efd-insights-logo';
import { FileUploader } from '@/components/file-uploader';
import { OperationsSummary } from '@/components/operations-summary';
import { TaxSummary } from '@/components/tax-summary';
import { RecordDataView } from '@/components/record-data-view';
import { Loader2, RefreshCw, Download, ChevronRight, PlusCircle, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { recordHierarchy } from '@/lib/efd-structure';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


export default function Home() {
  const [allData, setAllData] = useState<ParsedEfdData | null>(null);
  const [data, setData] = useState<ParsedEfdData | null>(null);
  const [draftData, setDraftData] = useState<ParsedEfdData['records'] | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeView, setActiveView] = useState<'entradas' | 'saidas' | 'apuracao_pis' | 'apuracao_cofins' | 'estabelecimentos' | null>('entradas');
  const [selectedCnpj, setSelectedCnpj] = useState<string>('all');
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleFileRead = useCallback((file: File) => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "Nenhum arquivo selecionado",
        description: "Por favor, selecione um arquivo para continuar.",
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            const content = e.target?.result as string;

            if (!content) {
                toast({
                    variant: "destructive",
                    title: "Erro ao ler arquivo",
                    description: "O arquivo parece estar vazio ou não pôde ser lido.",
                });
                setIsProcessing(false);
                return;
            }

            try {
                const parsedRecords = await parseEfdFile(content);
                if (Object.keys(parsedRecords).length === 0) {
                  throw new Error("Nenhum registro válido encontrado no arquivo.");
                }

                const summaries = await recalculateSummaries(parsedRecords);

                const finalData = {
                    records: parsedRecords,
                    ...summaries
                };

                setAllData(finalData);
                setData(finalData);
                setDraftData(finalData.records);
                setActiveView('entradas');
                setSelectedRecord(null);
                setSelectedCnpj('all');

            } catch (err) {
                console.error(err);
                const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
                toast({
                    variant: "destructive",
                    title: "Erro de Análise",
                    description: `Não foi possível analisar o arquivo. Verifique o formato e tente novamente. Detalhes: ${errorMessage}`,
                });
            } finally {
                setIsProcessing(false);
            }
        };

        reader.onerror = () => {
            toast({
                variant: "destructive",
                title: "Erro de Leitura",
                description: "Não foi possível ler o arquivo selecionado. Verifique as permissões do arquivo.",
            });
            setIsProcessing(false);
        };

        reader.readAsText(file, 'windows-1252');
    }, 0);
  }, [toast]);
  
  const canRecordTypeBeFiltered = useCallback((recordType: string | null, isForCheck = false) => {
    if (!allData) return false;
    const view = isForCheck ? activeView : null;
    if (!recordType) {
      if (view === 'apuracao_pis' || view === 'apuracao_cofins') {
        return false;
      }
      return true;
    }
    
    if (!allData.records[recordType]) return false;

    if (recordType === '0150' || recordType === '0200' || recordType === '0140') return true;

    return allData.records[recordType].some(r => r.hasOwnProperty('_cnpj'));
  }, [allData, activeView]);

  const handleProcessChanges = useCallback(async () => {
      if (!draftData || !allData) return;
  
      setIsProcessing(true);
      await new Promise(res => setTimeout(res, 0)); // Yield to main thread to show loader
  
      try {
          // 1. Update allData with draftData
          const newAllData = { ...allData, records: draftData };
          setAllData(newAllData);
  
          // 2. Recalculate summaries based on the new allData
          const newSummaries = await recalculateSummaries(draftData);
  
          // 3. Filter the new data based on the current CNPJ selection
          if (selectedCnpj === 'all') {
              setData({ records: draftData, ...newSummaries });
          } else {
              const relevantItemCodes = new Set<string>();
              const relevantParticipantCodes = new Set<string>();
  
              for (const type in draftData) {
                  const recordsOfType = draftData[type];
                  if (!recordsOfType) continue;
  
                  recordsOfType.forEach(r => {
                      if (r._cnpj === selectedCnpj) {
                          if (r.COD_ITEM) relevantItemCodes.add(String(r.COD_ITEM));
                          if (r.COD_PART) relevantParticipantCodes.add(String(r.COD_PART));
                      }
                  });
              }
  
              const newRecords: { [key: string]: EfdRecord[] } = {};
  
              for (const type in draftData) {
                  const recordsOfType = draftData[type];
                  if (!recordsOfType || recordsOfType.length === 0) continue;
  
                  let kept: EfdRecord[];
  
                  if (type === '0150') {
                      kept = recordsOfType.filter(r => relevantParticipantCodes.has(String(r.COD_PART!)));
                  } else if (type === '0200') {
                      kept = recordsOfType.filter(r => relevantItemCodes.has(String(r.COD_ITEM!)));
                  } else {
                      kept = recordsOfType.filter(r => !r.hasOwnProperty('_cnpj') || r._cnpj === selectedCnpj);
                  }
  
                  if (kept.length > 0) {
                      newRecords[type] = kept;
                  }
              }
  
              ['A', 'C', 'D', 'F', 'I', 'M', 'P'].forEach(block => {
                  const openerType = `${block}001`;
                  if (allData.records[openerType]) {
                      const hasData = Object.keys(newRecords).some(type => type.startsWith(block) && type !== openerType);
                      const openerRecord = newRecords[openerType]?.[0] || allData.records[openerType][0];
                      newRecords[openerType] = [{ ...openerRecord, IND_MOV: hasData ? '0' : '1' }];
                  }
              });
  
              const filteredSummaries = await recalculateSummaries(newRecords);
              setData({ records: newRecords, ...filteredSummaries });
          }
  
          toast({
              title: "Alterações Processadas",
              description: "Todas as suas alterações foram aplicadas com sucesso.",
          });
  
      } catch (err) {
          console.error("Error processing changes:", err);
          toast({
              variant: "destructive",
              title: "Erro ao Processar",
              description: "Ocorreu um erro ao aplicar as alterações.",
          });
      } finally {
          setIsProcessing(false);
      }
  
  }, [draftData, allData, selectedCnpj, toast]);
  
  const handleFilterChange = (cnpj: string) => {
    // Before changing the filter, ask the user to process changes
    handleProcessChanges().then(() => {
        setSelectedCnpj(cnpj);
    });
  };

  const handleReset = useCallback(() => {
    setAllData(null);
    setData(null);
    setDraftData(null);
    setSelectedRecord(null);
    setIsProcessing(false);
    setActiveView('entradas');
    setSelectedCnpj('all');
  }, []);

  const handleSelectView = useCallback((view: typeof activeView) => {
    setActiveView(view);
    setSelectedRecord(null);
  }, []);
  
  const handleRecordsUpdate = useCallback((updatedRecordList: EfdRecord[], recordType: string) => {
    setDraftData(prevDraftData => {
        if (!prevDraftData) return null;

        const updatedRecordsMap = new Map(updatedRecordList.map(r => [r._id, r]));
        const originalRecordList = prevDraftData[recordType] || [];

        const mergedList = originalRecordList.map(
            originalRecord => updatedRecordsMap.get(originalRecord._id) ?? originalRecord
        );

        const addedRecords = updatedRecordList.filter(
            updatedRecord => !originalRecordList.some(originalRecord => originalRecord._id === updatedRecord._id)
        );

        const finalUpdatedList = [...mergedList, ...addedRecords];

        return {
            ...prevDraftData,
            [recordType]: finalUpdatedList,
        };
    });
  }, []);

  const handleRecordDelete = useCallback((recordToDelete: EfdRecord) => {
    if (!recordToDelete._id) return;
    
    setDraftData(prevDraftData => {
        if (!prevDraftData) return null;

        const idsToDelete = new Set<string>([recordToDelete._id!]);
        const queue: string[] = [recordToDelete._id!];
        const allRecordsFlat = Object.values(prevDraftData).flat();

        while (queue.length > 0) {
            const currentParentId = queue.shift()!;
            const children = allRecordsFlat.filter(r => r._parentId === currentParentId);
            for (const child of children) {
                if(child._id) {
                  idsToDelete.add(child._id);
                  if (recordHierarchy[String(child.REG)]) {
                      queue.push(child._id);
                  }
                }
            }
        }

        const newDraftRecords: { [key: string]: EfdRecord[] } = {};
        for (const type in prevDraftData) {
            const keptRecords = prevDraftData[type].filter(r => r._id && !idsToDelete.has(r._id));
            if (keptRecords.length > 0) {
                newDraftRecords[type] = keptRecords;
            }
        }
        
        return newDraftRecords;
    });
  }, []);
  
  const handleCreateRecordType = useCallback((recordType: string) => {
    if (!RECORD_DEFINITIONS[recordType] || draftData?.[recordType]) {
      toast({
        variant: "destructive",
        title: "Registro já existe",
        description: `O registro ${recordType} já existe no rascunho.`,
      });
      return;
    }

    setDraftData(prevDraftData => {
      if (!prevDraftData) return null;
      return {
        ...prevDraftData,
        [recordType]: [],
      };
    });

    setSelectedRecord(recordType);
    setActiveView(null);
    toast({
      title: "Registro criado no rascunho",
      description: `O registro ${recordType} foi criado. Adicione dados e depois clique em 'Processar Alterações'.`,
    });
  }, [draftData, toast]);

  const handleExport = useCallback(() => {
    if (!data) {
        toast({
            variant: "destructive",
            title: "Sem dados para exportar",
            description: "Carregue um arquivo primeiro.",
        });
        return;
    }
    try {
        exportRecordsToEfdText(data.records);
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
  }, [data, toast]);

  const establishmentRecords = useMemo(() => allData?.records['0140'] || [], [allData]);
  
  const showCnpjFilter = useMemo(() => {
    if (!data || establishmentRecords.length <= 1) return false;
    
    if(selectedRecord) {
        return canRecordTypeBeFiltered(selectedRecord);
    }

    if(activeView) {
        switch(activeView){
            case 'estabelecimentos': return true;
            case 'entradas': return true;
            case 'saidas': return true;
            case 'apuracao_pis': return false;
            case 'apuracao_cofins': return false;
            default: return false;
        }
    }
    return false;
  }, [data, establishmentRecords.length, selectedRecord, activeView, canRecordTypeBeFiltered]);
  
  const sidebarContent = useMemo(() => {
    if (!isMounted || !draftData) {
      return null;
    }

    const allRecordTypes = Object.keys(draftData);
    const childRecords = new Set(Object.values(recordHierarchy).flat());
    const blockOrder = ['0', 'A', 'C', 'D', 'F', 'I', 'M', 'P', '1', '9'];

    const parentRecords = allRecordTypes
      .filter(recordType => !childRecords.has(recordType) && recordType !== '0140')
      .sort((a, b) => {
        const blockA = a.charAt(0);
        const blockB = b.charAt(0);
        const indexA = blockOrder.indexOf(blockA);
        const indexB = blockOrder.indexOf(blockB);
        if (indexA !== indexB) return indexA - indexB;
        return a.localeCompare(b);
      });

    return (
      <SidebarContent>
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
                  <SidebarMenuItem className="flex items-center">
                    <SidebarMenuButton
                      onClick={() => { setSelectedRecord(recordType); setActiveView(null);}}
                      isActive={selectedRecord === recordType}
                      className="flex-grow justify-start rounded-r-none shadow-neumo active:shadow-neumo-inset data-[active=true]:shadow-neumo-inset data-[active=true]:bg-primary/20"
                      tooltip={`Registro ${recordType}`}
                    >
                      <span className="truncate">{`Registro ${recordType}`}</span>
                    </SidebarMenuButton>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 shrink-0 flex items-center justify-center p-0 rounded-l-none shadow-neumo active:shadow-neumo-inset data-[state=open]:bg-primary/10">
                        <ChevronRight className="h-4 w-4 transition-transform data-[state=open]:rotate-90" />
                      </Button>
                    </CollapsibleTrigger>
                  </SidebarMenuItem>
                  <CollapsibleContent>
                    <div className="pl-4 my-1 space-y-1">
                      {children.map(childType => (
                        <SidebarMenuItem key={childType}>
                          <SidebarMenuButton
                            onClick={() => { setSelectedRecord(childType); setActiveView(null);}}
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
                  onClick={() => { setSelectedRecord(recordType); setActiveView(null);}}
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
      </SidebarContent>
    );
  }, [isMounted, draftData, activeView, selectedRecord, handleSelectView]);


  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <AppLogo />
        </SidebarHeader>
        {sidebarContent}
        <SidebarFooter className="p-4 mt-auto">
          <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            Developed by Jonatas Bitencourt
          </p>
        </SidebarFooter>
      </Sidebar>
      <div className="p-4 sm:p-6 lg:p-8">
        {isProcessing && (
          <div className="flex flex-col gap-4 items-center justify-center h-full">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Processando...</p>
          </div>
        )}

        {!data && !isProcessing && (
          <div className="flex items-center justify-center h-full">
            <FileUploader onFileRead={handleFileRead} />
          </div>
        )}
        
        {isMounted && data && !isProcessing && (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
               <div className="flex flex-col">
                 <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                 {showCnpjFilter && (
                    <p className="text-sm text-muted-foreground">
                        {selectedCnpj === 'all' ? 'Exibindo todos os estabelecimentos' : `Exibindo dados para: ${establishmentRecords.find(e => String(e.CNPJ) === selectedCnpj)?.NOME || selectedCnpj}`}
                    </p>
                 )}
               </div>
               <div className="flex items-center gap-2">
                 {showCnpjFilter && (
                    <Select value={selectedCnpj} onValueChange={handleFilterChange}>
                      <SelectTrigger className="w-[280px] shadow-neumo active:shadow-neumo-inset rounded-xl">
                        <SelectValue placeholder="Filtrar por Estabelecimento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Estabelecimentos</SelectItem>
                        {establishmentRecords.map((est) => (
                          <SelectItem key={String(est.CNPJ)} value={String(est.CNPJ!)}>
                            {`${est.NOME} (${est.CNPJ})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                 {activeView === 'estabelecimentos' && (
                  <>
                    <Button onClick={handleProcessChanges} variant="default" className="shadow-neumo active:shadow-neumo-inset rounded-xl bg-green-500 hover:bg-green-600">
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Processar Alterações
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Adicionar Registro
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onSelect={() => handleCreateRecordType('0500')}>Registro 0500</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleCreateRecordType('F010')}>Registro F010</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleCreateRecordType('F100')}>Registro F100</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleCreateRecordType('F120')}>Registro F120</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleCreateRecordType('F600')}>Registro F600</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleCreateRecordType('F700')}>Registro F700</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleCreateRecordType('1300')}>Registro 1300</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleCreateRecordType('1700')}>Registro 1700</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                 )}

                <Button onClick={handleExport} variant="outline" className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                  <Download className="mr-2 h-4 w-4" />
                  Exportar Arquivo
                </Button>
                <Button onClick={handleReset} variant="ghost" className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Carregar arquivo
                </Button>
              </div>
            </div>
            
            {selectedRecord ? (
              <RecordDataView
                key={`${selectedCnpj}-${selectedRecord}`}
                recordType={selectedRecord}
                records={draftData?.[selectedRecord] || []}
                onRecordsUpdate={handleRecordsUpdate}
                onRecordDelete={handleRecordDelete}
              />
            ) : (
              <>
                {activeView === 'estabelecimentos' && allData && (
                   <RecordDataView
                      key={`all-data-0140-${selectedCnpj}`}
                      recordType="0140"
                      records={draftData?.['0140'] || []}
                      onRecordsUpdate={(updatedRecords) => handleRecordsUpdate(updatedRecords, '0140')}
                      onRecordDelete={(record) => handleRecordDelete(record)}
                   />
                )}
                {activeView === 'entradas' && <OperationsSummary data={data.operationsSummaryEntradas} title="Resumo das Entradas" description="Análise detalhada por CFOP, CST e Alíquotas"/>}
                {activeView === 'saidas' && <OperationsSummary data={data.operationsSummarySaidas} title="Resumo das Saídas" description="Análise detalhada por CFOP, CST e Alíquotas"/>}
                {activeView === 'apuracao_pis' && <TaxSummary data={data.taxSummaryPis} title="Apuração PIS" description="Detalhamento da apuração de PIS (Registro M200)" />}
                {activeView === 'apuracao_cofins' && <TaxSummary data={data.taxSummaryCofins} title="Apuração COFINS" description="Detalhamento da apuração de COFINS (Registro M600)" />}
              </>
            )}
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
