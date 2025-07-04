import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ParsedEfdData } from "@/lib/types";

interface OperationsSummaryProps {
  data: ParsedEfdData['operationsSummary'];
}

export function OperationsSummary({ data }: OperationsSummaryProps) {
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  return (
    <Card className="shadow-neumo border-none rounded-2xl">
      <CardHeader>
        <CardTitle>Resumo das Operações</CardTitle>
        <CardDescription>Análise detalhada por operação</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>DIRECAO</TableHead>
              <TableHead>CFOP</TableHead>
              <TableHead>CST_PIS_COF</TableHead>
              <TableHead className="text-right">ALIQ_PIS</TableHead>
              <TableHead className="text-right">ALIQ_COF</TableHead>
              <TableHead className="text-right">VLR_TOT</TableHead>
              <TableHead className="text-right">VLR_ICMS</TableHead>
              <TableHead className="text-right">VLR_ST</TableHead>
              <TableHead className="text-right">VLR_IPI</TableHead>
              <TableHead className="text-right">VLR_BC_PIS_COF</TableHead>
              <TableHead className="text-right">VLR_PIS</TableHead>
              <TableHead className="text-right">VLR_COFINS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.direcao}</TableCell>
                <TableCell>{item.cfop}</TableCell>
                <TableCell>{item.cst_pis_cof}</TableCell>
                <TableCell className="text-right">{formatPercent(item.aliq_pis)}</TableCell>
                <TableCell className="text-right">{formatPercent(item.aliq_cof)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.vlr_tot)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.vlr_icms)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.vlr_st)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.vlr_ipi)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.vlr_bc_pis_cof)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.vlr_pis)}</TableCell>
                <TableCell className="text-right">{formatCurrency(item.vlr_cofins)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
