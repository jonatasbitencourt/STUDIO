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


interface RecordDataViewProps {
  recordType: string;
  records: EfdRecord[];
  onRecordsUpdate: (updatedRecords: EfdRecord[], recordType: string) => void;
  onRecordDelete: (record: EfdRecord) => void;
}

const RECORDS_PER_PAGE = 200;

const BATCH_ADD_CONFIG: Record<string, { headers: string[] }> = {
    'F700': {
        headers: ['IND_ORI_DED', 'IND_NAT_DED', 'VL_DED_PIS', 'VL_DED_COFINS', 'VL_BC_OPER', 'CNPJ', 'INFO_COMPL']
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
  onDelete: (recordId: string) => void;
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

  return (
    <TableRow ref={rowRef}>
      <TableCell className="sticky left-0 bg-background p-0 whitespace-nowrap">
        <Button
          variant="ghost"
          size="icon"
          className="h-auto w-auto p-0.5 text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(record._id!)}
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
  }, [recordType, records]); // Reset filters if recordType or base records change


  const handleRowCommit = useCallback((updatedRecord: EfdRecord) => {
      // Find the index of the record to update
      const recordIndex = records.findIndex(r => r._id === updatedRecord._id);
      if (recordIndex === -1) { // This is a new record
          onRecordsUpdate([updatedRecord, ...records], recordType);
          return;
      }

      // Create a new list with the updated record
      const updatedList = [...records];
      updatedList[recordIndex] = updatedRecord;

      // Pass the entire updated list to the parent
      onRecordsUpdate(updatedList, recordType);
  }, [records, onRecordsUpdate, recordType]);

  const handleDeleteRow = useCallback((recordId: string) => {
    const recordToDelete = records.find(r => r._id === recordId);
    if (recordToDelete) {
        onRecordDelete(recordToDelete);
    }
  }, [records, onRecordDelete]);

  const handleAddRow = useCallback(() => {
    const newRecord: EfdRecord = { REG: recordType, _id: `new_${Date.now()}` };
    const templateRecord = records.length > 0 ? records[0] : null;
    
    if (templateRecord) {
        Object.keys(templateRecord).forEach(header => {
            if (header !== 'REG' && header !== '_id' && header !== '_parentId' && header !== '_cnpj' && header !== '_order') {
                newRecord[header] = '';
            }
        });
    }

    const updatedRecords = [newRecord, ...records];
    onRecordsUpdate(updatedRecords, recordType);
  }, [records, onRecordsUpdate, recordType]);


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

    const updatedRecordList = [...newRecords, ...records];
    onRecordsUpdate(updatedRecordList, recordType);

    toast({ title: "Sucesso!", description: `${newRecords.length} registro(s) adicionado(s) com sucesso.` });
    setBatchAddText('');
    setIsBatchAddDialogOpen(false);
  }, [batchAddText, recordType, records, onRecordsUpdate, toast]);



  const headers = useMemo(() => (records.length > 0 ? Object.keys(records[0]).filter(h => h !== '_id' && h !== '_parentId' && h !== '_cnpj' && h !== '_order') : []), [records]);

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

  if (!recordType || records.length === 0 && paginatedRecords.length === 0) {
    const showAddButton = !recordType.startsWith('0') && !recordType.startsWith('A') && !recordType.startsWith('C') && !recordType.startsWith('D');
    return (
      <Card className="shadow-neumo border-none rounded-2xl h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground space-y-4">
            <Info className="mx-auto h-10 w-10"/>
            <div>
              <p className="font-semibold">Nenhum registro encontrado para {recordType}</p>
              <p className="text-sm">Carregue um arquivo para visualizar os dados.</p>
            </div>
             {showAddButton && (
                <Button onClick={handleAddRow} className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Primeiro Registro
                </Button>
             )}
        </div>
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
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
            <Table className="w-max">
              <TableHeader className="sticky top-0 bg-background/90 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-20 h-auto font-bold text-[8px] px-1 py-0.5 whitespace-nowrap">Ações</TableHead>
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
