import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { EfdRecord } from "@/lib/types";
import { Info } from "lucide-react";

interface RecordDataViewProps {
  recordType: string;
  records: EfdRecord[];
}

export function RecordDataView({ recordType, records }: RecordDataViewProps) {
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

  return (
    <Card className="shadow-neumo border-none rounded-2xl h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle>Dados do Registro: {recordType}</CardTitle>
        <CardDescription>Detalhes para os {records.length} registro(s) do tipo {recordType} encontrados no arquivo.</CardDescription>
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
                {records.map((record, index) => (
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
    </Card>
  );
}
