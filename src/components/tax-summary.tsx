import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ParsedEfdData } from "@/lib/types";

interface TaxSummaryProps {
  data: ParsedEfdData['taxSummary'];
}

export function TaxSummary({ data }: TaxSummaryProps) {
  return (
    <Card className="shadow-neumo border-none rounded-2xl">
      <CardHeader>
        <CardTitle>Resumo da Apuração</CardTitle>
        <CardDescription>Apuração de PIS e COFINS</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tributo</TableHead>
              <TableHead className="text-right">Débito</TableHead>
              <TableHead className="text-right">Crédito</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.tax}>
                <TableCell className="font-medium">{item.tax}</TableCell>
                <TableCell className="text-right">{item.debit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                <TableCell className="text-right">{item.credit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                <TableCell className="text-right font-semibold">{item.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
