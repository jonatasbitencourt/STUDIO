
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EfdRecord } from "@/lib/types";
import { Info, ChevronLeft, ChevronRight, PlusCircle, Trash2, ClipboardPaste } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { RECORD_DEFINITIONS } from "@/lib/efd-client-parser";


interface RecordDataViewProps {
  recordType: string;
  records: EfdRecord[];
  onRecordsUpdate: (updatedRecords: EfdRecord[], recordType: string) => void;
  onRecordDelete: (record: EfdRecord) => void;
}

const RECORDS_PER_PAGE = 200;

const BATCH_ADD_CONFIG: Record<string, { headers: string[] }> = {
    '0500': {
        headers: ['DT_ALT', 'COD_NAT_CC', 'IND_CTA', 'NIVEL', 'COD_CTA', 'NOME_CTA', 'COD_CTA_REF', 'CNPJ_EST']
    },
    'F010': {
        headers: ['CNPJ']
    },
    'F100': {
        headers: ['IND_OPER', 'COD_PART', 'COD_ITEM', 'DT_OPER', 'VL_OPER', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'NAT_BC_CRED', 'IND_ORIG_CRED', 'COD_CTA', 'COD_CCUS', 'DESC_DOC_OPER', 'CNPJ']
    },
    'F120': {
        headers: ['NAT_BC_CRED', 'IDENT_BEM_IMOB', 'IND_ORIG_CRED', 'IND_UTIL_BEM_IMOB', 'VL_OPER_DEP', 'VL_EXC_BC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA', 'COD_CCUS', 'DESCR_BEM', 'CNPJ']
    },
    'F200': {
        headers: ['UNID_IMOB', 'TP_UNID_IMOB', 'IDENT_EMP', 'DESC_UNID_IMOB', 'NUM_CONT', 'CPF_CNPJ_ADQU', 'DT_OPER_COMP', 'VL_UNID_IMOB_AT', 'VL_TOT_REC', 'VL_REC_ACUM', 'VL_COMP_AJUS_UNID', 'COD_ITEM', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'IND_NAT_EMP', 'INF_COMPL']
    },
    'F600': {
        headers: ['IND_NAT_RET', 'DT_RET', 'VL_BC_RET', 'VL_RET', 'COD_REC', 'IND_NAT_REC', 'CNPJ', 'VL_RET_PIS', 'VL_RET_COFINS', 'IND_DEC', 'CNPJ_F010']
    },
    'F700': {
        headers: ['IND_ORI_DED', 'IND_NAT_DED', 'VL_DED_PIS', 'VL_DED_COFINS', 'VL_BC_OPER', 'CNPJ', 'INF_COMPL']
    },
    '1300': {
      headers: ['IND_NAT_RET', 'PR_REC_RET', 'VL_RET_APU', 'VL_RET_DED', 'VL_RET_PER', 'VL_RET_DCOMP', 'SLD_RET']
    },
    '1700': {
      headers: ['IND_NAT_RET', 'PR_REC_RET', 'VL_RET_APU', 'VL_RET_DED', 'VL_RET_PER', 'VL_RET_DCOMP', 'SLD_RET']
    },
    'M110': {
        headers: ['IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESCR_AJ', 'DT_REF']
    },
    'M115': {
        headers: ['DET_VALOR_AJ', 'CST_PIS', 'DET_BC_CRED', 'DET_ALIQ', 'DT_OPER_AJ', 'DESC_AJ', 'COD_CTA', 'INFO_COMPL']
    },
    'M510': {
        headers: ['IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESCR_AJ', 'DT_REF']
    },
    'M515': {
        headers: ['DET_VALOR_AJ', 'CST_COFINS', 'DET_BC_CRED', 'DET_ALIQ', 'DT_OPER_AJ', 'DESC_AJ', 'COD_CTA', 'INFO_COMPL']
    }
};

// This component manages its own state for editing, preventing re-renders of the entire table on each keystroke.
const EditableRow = memo(function EditableRow({
  record,
  headers,
  onCommit,
  onDelete
}: {
  record: EfdRecord;
  headers: string[];
  onCommit: (updatedRecord: EfdRecord) => void;
  onDelete: (record: EfdRecord) => void;
}) {
  const [editedRecord, setEditedRecord] = useState(record);
  const rowRef = useRef<HTMLTableRowElement>(null);

  // Sync with parent prop changes (e.g., after filtering/sorting)
  useEffect(() => {
    setEditedRecord(record);
  }, [record]);

  const handleInputChange = (field: string, value: string) => {
    setEditedRecord(prev => ({ ...prev, [field]: value }));
  };

  const handleBlur = () => {
    // Check if the new focused element is still within the same row.
    // If it is, we don't commit yet, allowing the user to tab between fields.
    setTimeout(() => {
      if (rowRef.current && !rowRef.current.contains(document.activeElement)) {
        onCommit(editedRecord);
      }
    }, 0);
  };
  
  const handleDeleteClick = useCallback(() => {
    onDelete(record);
  }, [record, onDelete]);


  return (
    <TableRow ref={rowRef}>
      <TableCell className="sticky left-0 bg-background p-0 whitespace-nowrap z-20">
        <Button
          variant="ghost"
          size="icon"
          className="h-auto w-auto p-0.5 text-destructive hover:bg-destructive/10"
          onClick={handleDeleteClick}
        >
          <Trash2 className="h-3 w-3" />
          <span className="sr-only">Excluir</span>
        </Button>
      </TableCell>
      {headers.map(header => (
        <TableCell key={`${record._id}-${header}`} className="p-0 whitespace-nowrap">
          <input
            type="text"
            value={editedRecord[header] || ''}
            onChange={(e) => handleInputChange(header, e.target.value)}
            onBlur={handleBlur}
            style={{ width: `${Math.max(String(record[header] || '').length, header.length, 10) * 8 + 15}px` }}
            className="h-auto bg-transparent px-1 py-0.5 text-[8px] border-none rounded-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={header === 'REG'}
          />
        </TableCell>
      ))}
    </TableRow>
  );
});


export function RecordDataView({ recordType, records, onRecordsUpdate, onRecordDelete }: RecordDataViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterColumn, setFilterColumn] = useState<string>('');
  
  const [filterInputValue, setFilterInputValue] = useState('');
  const [filterValue, setFilterValue] = useState('');

  const [isBatchAddDialogOpen, setIsBatchAddDialogOpen] = useState(false);
  const [batchAddText, setBatchAddText] = useState('');
  const { toast } = useToast();
  
  const canBatchAdd = BATCH_ADD_CONFIG.hasOwnProperty(recordType);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterValue(filterInputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterInputValue]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterColumn, filterValue]);
  
  useEffect(() => {
    setCurrentPage(1);
    setFilterColumn('');
    setFilterInputValue('');
    setFilterValue('');
  }, [recordType]);


  const handleRowCommit = useCallback((updatedRecord: EfdRecord) => {
      onRecordsUpdate([updatedRecord], recordType);
      toast({
          title: "Alteração em Rascunho",
          description: "A linha foi atualizada. Clique em 'Processar Alterações' para salvar.",
          duration: 3000
      });
  }, [onRecordsUpdate, recordType, toast]);

  const handleDeleteRow = useCallback((recordToDelete: EfdRecord) => {
     onRecordDelete(recordToDelete);
     toast({
        title: "Exclusão em Rascunho",
        description: "A linha foi marcada para exclusão. Clique em 'Processar Alterações' para salvar.",
        duration: 3000
    });
  }, [onRecordDelete, toast]);

  const handleAddRow = useCallback(() => {
    const newRecord: EfdRecord = { REG: recordType, _id: `new_${Date.now()}` };
    const headers = RECORD_DEFINITIONS[recordType] || [];
    
    headers.forEach(header => {
        if (header !== 'REG') {
            newRecord[header] = '';
        }
    });

    onRecordsUpdate([newRecord], recordType);
    toast({
        title: "Adição em Rascunho",
        description: "Uma nova linha foi adicionada. Clique em 'Processar Alterações' para salvar.",
        duration: 3000
    });
  }, [onRecordsUpdate, recordType, toast]);


   const handleBatchAdd = useCallback(() => {
    const config = BATCH_ADD_CONFIG[recordType];
    if (!config) return;

    const { headers: headersToParse } = config;
    const lines = batchAddText.trim().split('\n').filter(line => line.trim() !== '');

    if (lines.length === 0) {
        toast({ variant: "destructive", title: "Nenhum dado para adicionar." });
        return;
    }

    const newRecords: EfdRecord[] = lines.map((line, idx) => {
        const fields = line.split('\t');
        const newRecord: EfdRecord = {
            REG: recordType,
            _id: `new_${Date.now()}_${idx}`
        };
        headersToParse.forEach((header, index) => {
            newRecord[header] = fields[index] || '';
        });
        return newRecord;
    });

    onRecordsUpdate(newRecords, recordType);

    toast({ title: "Adição em Rascunho", description: `${newRecords.length} registro(s) adicionado(s) ao rascunho. Clique em 'Processar Alterações' para salvar.` });
    setBatchAddText('');
    setIsBatchAddDialogOpen(false);
  }, [batchAddText, recordType, onRecordsUpdate, toast]);



  const headers = useMemo(() => {
    if (records.length > 0) {
      // Get headers from the first record but filter out internal ones
      return Object.keys(records[0]).filter(h => h !== '_id' && h !== '_parentId' && h !== '_cnpj' && h !== '_order');
    }
    // If no records, get headers from definition and include REG
    const definitionHeaders = RECORD_DEFINITIONS[recordType] || [];
    const displayHeaders = [...definitionHeaders];
    if (['F100', 'F120', 'F600'].includes(recordType) && !displayHeaders.includes('CNPJ')) {
        displayHeaders.push('CNPJ');
    }
    return ['REG', ...displayHeaders.filter(h => h !== 'REG')];
  }, [records, recordType]);

  const filteredRecords = useMemo(() => {
    if (!filterValue.trim()) {
      return records;
    }
    const lowercasedFilter = filterValue.toLowerCase();

    return records.filter(record => {
      if (filterColumn && filterColumn !== 'all') {
        const cellValue = record[filterColumn] || '';
        return String(cellValue).toLowerCase().includes(lowercasedFilter);
      } else {
        for (const key in record) {
            if (key === '_id' || key === '_parentId' || key === '_cnpj') continue;
            const value = record[key];
            if (value && String(value).toLowerCase().includes(lowercasedFilter)) {
                return true;
            }
        }
        return false;
      }
    });
  }, [records, filterColumn, filterValue]);

  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = useMemo(() => filteredRecords.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  ), [filteredRecords, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (!recordType) {
    return (
      <Card className="shadow-neumo border-none rounded-2xl h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground space-y-4">
            <Info className="mx-auto h-10 w-10"/>
            <p className="font-semibold">Selecione um registro para visualizar</p>
        </div>
      </Card>
    );
  }

  // New logic for empty state: Show table headers and add buttons
  if (records.length === 0 && paginatedRecords.length === 0) {
      return (
          <Card className="shadow-neumo border-none rounded-2xl h-[calc(100vh-10rem)] flex flex-col">
              <CardHeader>
                  <CardTitle>Dados do Registro: {recordType}</CardTitle>
                  <CardDescription>
                      Nenhum registro encontrado para {recordType}. Adicione um novo registro ou cole do Excel.
                  </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                  <ScrollArea className="h-full">
                      <Table className="w-max">
                          <TableHeader className="sticky top-0 bg-background/90 backdrop-blur-sm z-40">
                              <TableRow>
                                  <TableHead className="sticky left-0 bg-background z-30 h-auto font-bold text-[8px] px-1 py-0.5 whitespace-nowrap">Ações</TableHead>
                                  {headers.map(header => (
                                      <TableHead key={header} className="h-auto font-bold text-[8px] px-1 py-0.5 whitespace-nowrap">{header}</TableHead>
                                  ))}
                              </TableRow>
                          </TableHeader>
                          <TableBody>
                              <TableRow>
                                  <TableCell colSpan={headers.length + 1} className="h-24 text-center">
                                      Nenhum registro.
                                  </TableCell>
                              </TableRow>
                          </TableBody>
                      </Table>
                  </ScrollArea>
              </CardContent>
              <CardFooter className="border-t pt-4 justify-end items-center">
                  <div className="flex items-center space-x-2">
                      {canBatchAdd && (
                          <Button onClick={() => setIsBatchAddDialogOpen(true)} className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                              <ClipboardPaste className="mr-2 h-4 w-4" />
                              Colar do Excel
                          </Button>
                      )}
                      {!recordType.startsWith('0') && !recordType.startsWith('A') && !recordType.startsWith('C') && !recordType.startsWith('D') && (
                          <Button onClick={handleAddRow} className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                              <PlusCircle className="mr-2 h-4 w-4" />
                              Adicionar
                          </Button>
                      )}
                  </div>
              </CardFooter>
              <Dialog open={isBatchAddDialogOpen} onOpenChange={setIsBatchAddDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                    <DialogTitle>Adicionar Registros {recordType} em Lote</DialogTitle>
                    <DialogDescription>
                        Copie as colunas do Excel e cole abaixo. As colunas devem estar na ordem: {BATCH_ADD_CONFIG[recordType]?.headers.join(', ')}.
                    </DialogDescription>
                    </DialogHeader>
                    <Textarea
                    value={batchAddText}
                    onChange={(e) => setBatchAddText(e.target.value)}
                    placeholder="Cole os dados aqui..."
                    className="min-h-[200px]"
                    />
                    <DialogFooter>
                    <Button onClick={() => setIsBatchAddDialogOpen(false)} variant="outline">Cancelar</Button>
                    <Button onClick={handleBatchAdd}>Adicionar Registros</Button>
                    </DialogFooter>
                </DialogContent>
              </Dialog>
          </Card>
      );
  }

  return (
    <Card className="shadow-neumo border-none rounded-2xl h-[calc(100vh-10rem)] flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
            <div>
                <CardTitle>Dados do Registro: {recordType}</CardTitle>
                <CardDescription>
                    Exibindo {paginatedRecords.length} de {filteredRecords.length} registro(s).
                </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
                <Select value={filterColumn} onValueChange={(value) => setFilterColumn(value || '')}>
                    <SelectTrigger className="w-[200px] shadow-neumo-inset">
                        <SelectValue placeholder="Filtrar por coluna" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as Colunas</SelectItem>
                        {headers.map(header => (
                            <SelectItem key={header} value={header}>{header}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    placeholder="Pesquisar valor..."
                    value={filterInputValue}
                    onChange={(e) => setFilterInputValue(e.target.value)}
                    className="max-w-sm shadow-neumo-inset"
                />
                 {canBatchAdd && (
                    <Button onClick={() => setIsBatchAddDialogOpen(true)} className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                        <ClipboardPaste className="mr-2 h-4 w-4" />
                        Colar do Excel
                    </Button>
                 )}
                 {!recordType.startsWith('0') && !recordType.startsWith('A') && !recordType.startsWith('C') && !recordType.startsWith('D') && (
                    <Button onClick={handleAddRow} className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar
                    </Button>
                 )}
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-full">
            <Table className="w-max">
              <TableHeader className="sticky top-0 bg-background/90 backdrop-blur-sm z-40">
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-30 h-auto font-bold text-[8px] px-1 py-0.5 whitespace-nowrap">Ações</TableHead>
                  {headers.map(header => (
                    <TableHead key={header} className="h-auto font-bold text-[8px] px-1 py-0.5 whitespace-nowrap">{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <EditableRow
                    key={record._id}
                    record={record}
                    headers={headers}
                    onCommit={handleRowCommit}
                    onDelete={handleDeleteRow}
                  />
                ))}
              </TableBody>
            </Table>
        </ScrollArea>
      </CardContent>
       <CardFooter className="border-t pt-4 justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Página {currentPage} de {totalPages}
        </p>
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1} className="shadow-neumo active:shadow-neumo-inset rounded-xl">
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages} className="shadow-neumo active:shadow-neumo-inset rounded-xl">
              Próximo <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </CardFooter>
      <Dialog open={isBatchAddDialogOpen} onOpenChange={setIsBatchAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
            <DialogTitle>Adicionar Registros {recordType} em Lote</DialogTitle>
            <DialogDescription>
                Copie as colunas do Excel e cole abaixo. As colunas devem estar na ordem: {BATCH_ADD_CONFIG[recordType]?.headers.join(', ')}.
            </DialogDescription>
            </DialogHeader>
            <Textarea
            value={batchAddText}
            onChange={(e) => setBatchAddText(e.target.value)}
            placeholder="Cole os dados aqui..."
            className="min-h-[200px]"
            />
            <DialogFooter>
            <Button onClick={() => setIsBatchAddDialogOpen(false)} variant="outline">Cancelar</Button>
            <Button onClick={handleBatchAdd}>Adicionar Registros</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
    

    

    

    