import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EfdRecord } from "@/lib/types";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface RecordDataViewProps {
  recordType: string;
  records: EfdRecord[];
}

const RECORDS_PER_PAGE = 200;

export function RecordDataView({ recordType, records }: RecordDataViewProps) {
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, [recordType]);

  if (!recordType || !records || records.length === 0) {
    return (
      <Card className="shadow-neumo border-none rounded-2xl h-[400px] flex items-center justify-center">
        <div className="text-center text-muted-foreground space-y-2">
            <Info className="mx-auto h-10 w-10"/>
            <p className="font-semibold">Selecione um Registro</p>
            <p className="text-sm">Clique em um registro na barra lateral para ver os detalhes.</p>
        </div>
      </Card>
    );
  }
  
  const headers = Object.keys(records[0] || {});

  const totalPages = Math.ceil(records.length / RECORDS_PER_PAGE);
  const paginatedRecords = records.slice(
    (currentPage - 1) * RECORDS_PER_PAGE,
    currentPage * RECORDS_PER_PAGE
  );

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };


  return (
    <Card className="shadow-neumo border-none rounded-2xl h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Dados do Registro: {recordType}</CardTitle>
        <CardDescription>
            Exibindo {paginatedRecords.length} de {records.length} registro(s) do tipo {recordType}.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-hidden">
        <ScrollArea className="h-full">
            <Table>
              <TableHeader className="sticky top-0 bg-background/80 backdrop-blur-sm z-10">
                <TableRow>
                  {headers.map(header => (
                    <TableHead key={header} className="font-bold text-xs px-2 py-1 whitespace-nowrap">{header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.map((record, index) => (
                  <TableRow key={index} className="h-8">
                    {headers.map(header => (
                      <TableCell key={`${header}-${index}`} className="text-[11px] px-2 py-1 whitespace-nowrap">{record[header]}</TableCell>
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
            <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="shadow-neumo active:shadow-neumo-inset rounded-xl"
            >
            <ChevronLeft className="h-4 w-4" />
            Anterior
            </Button>
            <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="shadow-neumo active:shadow-neumo-inset rounded-xl"
            >
            Próximo
            <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
