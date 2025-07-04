import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ParsedEfdData } from "@/lib/types";

interface OperationsSummaryProps {
  data: ParsedEfdData['operationsSummary'];
}

export function OperationsSummary({ data }: OperationsSummaryProps) {
  return (
    <Card className="shadow-neumo border-none rounded-2xl">
      <CardHeader>
        <CardTitle>Resumo das Operações</CardTitle>
        <CardDescription>Por direção, CFOP e CST</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Direção</TableHead>
              <TableHead>CFOP</TableHead>
              <TableHead>CST</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.direction}</TableCell>
                <TableCell>{item.cfop}</TableCell>
                <TableCell>{item.cst}</TableCell>
                <TableCell className="text-right">{item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
