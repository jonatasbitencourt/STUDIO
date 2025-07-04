export type EfdRecord = { [key: string]: string };

export interface ParsedEfdData {
  records: {
    [recordType: string]: EfdRecord[];
  };
  operationsSummary: {
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
  }[];
  taxSummary: {
    reg: string;
    atributo: string;
    valor: number;
  }[];
}
