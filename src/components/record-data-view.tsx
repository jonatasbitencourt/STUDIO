import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EfdRecord } from "@/lib/types";
import { Info, ChevronLeft, ChevronRight, PlusCircle, Trash2 } from "lucide-react";
import { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecordDataViewProps {
  recordType: string;
  records: EfdRecord[];
  onRecordsUpdate: (updatedRecords: EfdRecord[]) => void;
  onRecordDelete: (record: EfdRecord) => void;
}

const RECORDS_PER_PAGE = 200;

// Memoize the Row component to prevent unnecessary re-renders
const MemoizedRow = memo(function MemoizedRow({ record, headers, handleFieldChange, handleDeleteRow }: {
  record: EfdRecord;
  headers: string[];
  handleFieldChange: (recordId: string, field: string, value: string) => void;
  handleDeleteRow: (recordId: string) => void;
}) {
  return (
    <TableRow>
      <TableCell className="p-0 whitespace-nowrap">
        <Button
          variant="ghost"
          size="icon"
          className="h-auto w-auto p-0.5 text-destructive hover:bg-destructive/10"
          onClick={() => handleDeleteRow(record._id!)}
        >
          <Trash2 className="h-3 w-3" />
          <span className="sr-only">Excluir</span>
        </Button>
      </TableCell>
      {headers.map(header => (
        <TableCell key={`${record._id}-${header}`} className="p-0 whitespace-nowrap">
            <input
              type="text"
              value={record[header] || ''}
              onChange={(e) => handleFieldChange(record._id!, header, e.target.value)}
              size={Math.max(String(record[header] || '').length, header.length, 5)}
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

  const [internalRecords, setInternalRecords] = useState(records);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInternalRecords(records);
  }, [records]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilterValue(filterInputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [filterInputValue]);

  useEffect(() => {
    setCurrentPage(1);
    setFilterColumn('');
    setFilterInputValue('');
    setFilterValue('');
  }, [recordType]);

  // Use functional updates in useCallback to avoid dependency on `internalRecords`
  // This stabilizes the function reference and prevents re-renders of all rows.
  const handleFieldChange = useCallback((recordId: string, field: string, value: string) => {
    setInternalRecords(currentRecords => {
      const recordIndex = currentRecords.findIndex(r => r._id === recordId);
      if (recordIndex === -1) return currentRecords;

      const newRecords = [...currentRecords]; // Create a new array for immutability
      newRecords[recordIndex] = { ...newRecords[recordIndex], [field]: value };
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(() => {
        onRecordsUpdate(newRecords);
      }, 500);

      return newRecords;
    });
  }, [onRecordsUpdate]);

  const handleDeleteRow = useCallback((recordId: string) => {
    const recordToDelete = internalRecords.find(r => r._id === recordId);
    if (recordToDelete) {
        onRecordDelete(recordToDelete);
    }
  }, [internalRecords, onRecordDelete]);

  const handleAddRow = useCallback(() => {
    setInternalRecords(currentRecords => {
        const newRecord: EfdRecord = { REG: recordType, _id: `new_${Date.now()}` };
        const templateRecord = currentRecords.length > 0 ? currentRecords[0] : (records.length > 0 ? records[0] : null);
        if (templateRecord) {
            Object.keys(templateRecord).forEach(header => {
                if (header !== 'REG' && header !== '_id' && header !== '_parentId') {
                    newRecord[header] = '';
                }
            });
        }
        const updatedRecords = [newRecord, ...currentRecords];
        onRecordsUpdate(updatedRecords);
        return updatedRecords;
    });
  }, [onRecordsUpdate, recordType, records]);

  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const headers = useMemo(() => (records.length > 0 ? Object.keys(records[0]).filter(h => h !== '_id' && h !== '_parentId' && h !== '_cnpj') : []), [records]);

  const filteredRecords = useMemo(() => {
    if (!filterValue.trim()) {
      return internalRecords;
    }
    const lowercasedFilter = filterValue.toLowerCase().trim();

    return internalRecords.filter(record => {
      if (filterColumn && filterColumn !== 'all') {
        const cellValue = record[filterColumn] || '';
        return String(cellValue).toLowerCase().trim() === lowercasedFilter;
      } else {
        return Object.values(record).some(value =>
          String(value).toLowerCase().includes(lowercasedFilter)
        );
      }
    });
  }, [internalRecords, filterColumn, filterValue]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterColumn, filterValue]);

  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = useMemo(() => filteredRecords.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  ), [filteredRecords, currentPage]);

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (!recordType || records.length === 0) {
    return (
      <Card className="shadow-neumo border-none rounded-2xl h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground space-y-2">
            <Info className="mx-auto h-10 w-10"/>
            <p className="font-semibold">Nenhum registro encontrado para {recordType}</p>
            <p className="text-sm">Carregue um arquivo para visualizar os dados.</p>
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
                 <Button onClick={handleAddRow} className="shadow-neumo active:shadow-neumo-inset rounded-xl">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
            <Table className="w-max">
              <TableHeader className="sticky top-0 bg-background/90 backdrop-blur-sm z-10">
                <TableRow>
                  <TableHead className="h-auto font-bold text-[8px] px-1 py-0.5 whitespace-nowrap">Ações</TableHead>
                  {headers.map(header => (
                    <TableHead key={header} className="h-auto font-bold text-[8px] px-1 py-0.5 whitespace-nowrap">{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <MemoizedRow
                    key={record._id}
                    record={record}
                    headers={headers}
                    handleFieldChange={handleFieldChange}
                    handleDeleteRow={handleDeleteRow}
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
    </Card>
  );
}
