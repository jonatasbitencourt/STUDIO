import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import type { OperationSummaryItem } from "@/lib/types";
import { useCallback } from 'react';

interface OperationsSummaryProps {
  data: OperationSummaryItem[];
  title: string;
  description: string;
}

export function OperationsSummary({ data, title, description }: OperationsSummaryProps) {
  const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const handleExport = useCallback(() => {
    if (!data || data.length === 0) return;

    const headers = [
      'direcao', 'cfop', 'cst_pis_cof', 'aliq_pis', 'aliq_cof', 
      'vlr_tot', 'vlr_icms', 'vlr_st', 'vlr_ipi', 'vlr_bc_pis_cof', 
      'vlr_pis', 'vlr_cofins'
    ];
    
    const csvRows = [
      headers.join(';'), 
      ...data.map(row => 
        headers.map(header => {
          const value = row[header as keyof OperationSummaryItem];
          const formattedValue = typeof value === 'number' ? String(value).replace('.', ',') : value;
          return `"${String(formattedValue).replace(/"/g, '""')}"`;
        }).join(';')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${title.toLowerCase().replace(/ /g, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [data, title]);


  return (
    <Card className="shadow-neumo border-none rounded-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button onClick={handleExport} variant="outline" size="sm" className="shadow-neumo active:shadow-neumo-inset rounded-xl">
          <FileDown className="mr-2 h-4 w-4" />
          Exp_Excel
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">DIRECAO</TableHead>
              <TableHead className="text-xs">CFOP</TableHead>
              <TableHead className="text-xs">CST_PIS_COF</TableHead>
              <TableHead className="text-right text-xs">ALIQ_PIS</TableHead>
              <TableHead className="text-right text-xs">ALIQ_COF</TableHead>
              <TableHead className="text-right text-xs">VLR_TOT</TableHead>
              <TableHead className="text-right text-xs">VLR_ICMS</TableHead>
              <TableHead className="text-right text-xs">VLR_ST</TableHead>
              <TableHead className="text-right text-xs">VLR_IPI</TableHead>
              <TableHead className="text-right text-xs">VLR_BC_PIS_COF</TableHead>
              <TableHead className="text-right text-xs">VLR_PIS</TableHead>
              <TableHead className="text-right text-xs">VLR_COFINS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium text-xs">{item.direcao}</TableCell>
                <TableCell className="text-xs">{item.cfop}</TableCell>
                <TableCell className="text-xs">{item.cst_pis_cof}</TableCell>
                <TableCell className="text-right text-xs">{formatPercent(item.aliq_pis)}</TableCell>
                <TableCell className="text-right text-xs">{formatPercent(item.aliq_cof)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(item.vlr_tot)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(item.vlr_icms)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(item.vlr_st)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(item.vlr_ipi)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(item.vlr_bc_pis_cof)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(item.vlr_pis)}</TableCell>
                <TableCell className="text-right text-xs">{formatCurrency(item.vlr_cofins)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
