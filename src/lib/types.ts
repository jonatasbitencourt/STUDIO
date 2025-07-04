export type EfdRecord = { [key: string]: string };

export interface ParsedEfdData {
  records: {
    [recordType: string]: EfdRecord[];
  };
  operationsSummary: {
    direction: string;
    cfop: string;
    cst: string;
    total: number;
  }[];
  taxSummary: {
    tax: string;
    debit: number;
    credit: number;
    balance: number;
  }[];
}
