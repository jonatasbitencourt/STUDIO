import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EfdRecord } from "@/lib/types";
import { Info, ChevronLeft, ChevronRight, PlusCircle } from "lucide-react";
import { useState, useEffect, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecordDataViewProps {
  recordType: string;
  records: EfdRecord[];
  onUpdate: (updatedRecords: EfdRecord[]) => void;
}

const RECORDS_PER_PAGE = 200;

export function RecordDataView({ recordType, records, onUpdate }: RecordDataViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');

  useEffect(() => {
    setCurrentPage(1);
    setFilterColumn('');
    setFilterValue('');
  }, [recordType]);

  const handleFieldChange = (recordId: string, field: string, value: string) => {
    const updatedRecords = records.map(r => {
      if (r._id === recordId) {
        return { ...r, [field]: value };
      }
      return r;
    });
    onUpdate(updatedRecords);
  };

  const handleAddRow = () => {
    const newRecord: EfdRecord = { REG: recordType, _id: `new_${Date.now()}` };
    if (records.length > 0) {
      Object.keys(records[0]).forEach(header => {
        if (header !== 'REG' && header !== '_id') {
          newRecord[header] = '';
        }
      });
    }
    onUpdate([...records, newRecord]);
  };

  const headers = records.length > 0 ? Object.keys(records[0]).filter(h => h !== '_id') : [];

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
        return Object.values(record).some(value =>
          String(value).toLowerCase().includes(lowercasedFilter)
        );
      }
    });
  }, [records, filterColumn, filterValue]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterColumn, filterValue]);

  const totalPages = Math.ceil(filteredRecords.length / RECORDS_PER_PAGE);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  );

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (!recordType || records.length === 0) {
    return (
      <Card className="shadow-neumo border-none rounded-2xl h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground space-y-2">
            <Info className="mx-auto h-10 w-10"/>
            <p className="font-semibold">Nenhum registro encontrado para {recordType}</p>
            <p className="text-sm">Você pode adicionar um novo registro abaixo.</p>
            <Button onClick={handleAddRow} className="mt-4 shadow-neumo active:shadow-neumo-inset rounded-xl">
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Linha
            </Button>
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
                <Select value={filterColumn} onValueChange={(value) => setFilterColumn(value)}>
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
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
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
            <Table className="w-auto">
              <TableHeader className="sticky top-0 bg-background/90 backdrop-blur-sm z-10">
                <TableRow>
                  {headers.map(header => (
                    <TableHead key={header} className="h-auto font-bold text-[8px] px-1 py-0.5 whitespace-nowrap">{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record) => (
                  <TableRow key={record._id}>
                    {headers.map(header => (
                      <TableCell key={`${record._id}-${header}`} className="p-0 whitespace-nowrap">
                         <Input
                            type="text"
                            value={record[header] || ''}
                            onChange={(e) => handleFieldChange(record._id!, header, e.target.value)}
                            className="h-5 w-full text-[8px] border-none rounded-none focus-visible:ring-1 focus-visible:ring-ring bg-transparent px-1"
                            disabled={header === 'REG'}
                         />
                      </TableCell>
                    ))}
                  </TableRow>
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
