export type EfdRecord = {
  _id?: string; // Unique ID for React keys and state management
  _parentId?: string; // ID of the parent record for hierarchical data
  _cnpj?: string; // Internal property to associate record with a CNPJ
  [key: string]: string;
};

export type OperationSummaryItem = {
  direcao: string;
  cfop: string;
  vlr_tot: number;
  vlr_icms: number;
  vlr_st: number;
  vlr_ipi: number;
  vlr_pis: number;
  vlr_cofins: number;
  vlr_bc_pis_cof: number;
  cst_pis_cof: string;
  aliq_pis: number;
  aliq_cof: number;
};

export type TaxSummaryItem = {
  atributo: string;
  valor: number;
};

export interface ParsedEfdData {
  records: {
    [recordType: string]: EfdRecord[];
  };
  operationsSummaryEntradas: OperationSummaryItem[];
  operationsSummarySaidas: OperationSummaryItem[];
  taxSummaryPis: TaxSummaryItem[];
  taxSummaryCofins: TaxSummaryItem[];
}
