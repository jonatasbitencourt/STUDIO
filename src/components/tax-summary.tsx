import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ParsedEfdData } from "@/lib/types";

interface TaxSummaryProps {
  data: ParsedEfdData['taxSummary'];
}

export function TaxSummary({ data }: TaxSummaryProps) {
  const formatValue = (value: number) => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Card className="shadow-neumo border-none rounded-2xl">
      <CardHeader>
        <CardTitle>Resumo da Apuração</CardTitle>
        <CardDescription>Detalhamento da apuração de PIS e COFINS.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>REG</TableHead>
              <TableHead>Atributo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.reg}</TableCell>
                <TableCell>{item.atributo}</TableCell>
                <TableCell className="text-right">{formatValue(item.valor)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
