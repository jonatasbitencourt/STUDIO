import type { ParsedEfdData, EfdRecord } from './types';

// This is a mock parser. It returns static data for UI development.
export const parseEfdFile = (fileContent: string): ParsedEfdData => {
  // In a real app, this function would parse the fileContent string.
  // For now, we return mock data regardless of the file content, as long as it's not empty.
  if (!fileContent.trim()) {
    throw new Error("File content is empty.");
  }

  const records: { [recordType: string]: EfdRecord[] } = {
    '0000': [
      { REG: '0000', COD_VER: '005', TIPO_ESCRIT: '0', IND_SIT_ESP: '', NUM_REC_ANTERIOR: '', DT_INI: '01012023', DT_FIN: '31012023', NOME: 'EMPRESA EXEMPLO LTDA', CNPJ: '12.345.678/0001-95', UF: 'SP', COD_MUN: '3550308', SUFRAMA: '', IND_NAT_PJ: '00', IND_ATIV: '1' }
    ],
    'C100': [
      { REG: 'C100', IND_OPER: '0', IND_EMIT: '0', COD_PART: 'PART01', COD_MOD: '55', COD_SIT: '00', SER: '1', NUM_DOC: '12345', CHV_NFE: '...', DT_DOC: '15/01/2023', VL_DOC: '1000.00' },
      { REG: 'C100', IND_OPER: '1', IND_EMIT: '1', COD_PART: 'PART02', COD_MOD: '55', COD_SIT: '00', SER: '1', NUM_DOC: '54321', CHV_NFE: '...', DT_DOC: '16/01/2023', VL_DOC: '2500.50' }
    ],
    'C170': [
      { REG: 'C170', NUM_ITEM: '1', COD_ITEM: 'PROD01', DESCR_COMPL: 'PRODUTO DE TESTE 1', QTD: '10', UNID: 'UN', VL_ITEM: '100.00', CST_PIS: '01', VL_BC_PIS: '1000.00', ALIQ_PIS: '1.65', VL_PIS: '16.50', CST_COFINS: '01', VL_BC_COFINS: '1000.00', ALIQ_COFINS: '7.60', VL_COFINS: '76.00' },
      { REG: 'C170', NUM_ITEM: '2', COD_ITEM: 'PROD02', DESCR_COMPL: 'PRODUTO DE TESTE 2', QTD: '5', UNID: 'CX', VL_ITEM: '500.10', CST_PIS: '01', VL_BC_PIS: '2500.50', ALIQ_PIS: '1.65', VL_PIS: '41.26', CST_COFINS: '01', VL_BC_COFINS: '2500.50', ALIQ_COFINS: '7.60', VL_COFINS: '190.04' }
    ],
    'M210': [
      { REG: 'M210', COD_CONT: '1', VL_REC_BRU_NC_PER: '50000.00', VL_BC_CONT: '35000.00', VL_AJUS_ACRES_BC: '0.00', VL_AJUS_REDUC_BC: '0.00', VL_CONT_APUR: '577.50', VL_CRED_DESC: '100.00', VL_CONT_DEVIDO: '477.50' }
    ],
    'M610': [
       { REG: 'M610', COD_CONT: '1', VL_REC_BRU_NC_PER: '50000.00', VL_BC_CONT: '35000.00', VL_AJUS_ACRES_BC: '0.00', VL_AJUS_REDUC_BC: '0.00', VL_CONT_APUR: '2660.00', VL_CRED_DESC: '500.00', VL_CONT_DEVIDO: '2160.00' }
    ]
  };

  const operationsSummary = [
    { direcao: 'Entrada', cfop: '1.101', cst_pis_cof: '50', aliq_pis: 1.65, aliq_cof: 7.60, vlr_tot: 15000.75, vlr_icms: 1800.09, vlr_st: 0, vlr_ipi: 0, vlr_bc_pis_cof: 15000.75, vlr_pis: 247.51, vlr_cofins: 1140.06 },
    { direcao: 'Saída', cfop: '5.102', cst_pis_cof: '01', aliq_pis: 1.65, aliq_cof: 7.60, vlr_tot: 35000.25, vlr_icms: 4200.03, vlr_st: 0, vlr_ipi: 3500.00, vlr_bc_pis_cof: 35000.25, vlr_pis: 577.50, vlr_cofins: 2660.02 },
    { direcao: 'Entrada', cfop: '2.101', cst_pis_cof: '50', aliq_pis: 1.65, aliq_cof: 7.60, vlr_tot: 8000.00, vlr_icms: 960.00, vlr_st: 0, vlr_ipi: 0, vlr_bc_pis_cof: 8000.00, vlr_pis: 132.00, vlr_cofins: 608.00 },
  ];

  const taxSummary = [
    { tax: 'PIS', debit: 577.50, credit: 100.00, balance: 477.50 },
    { tax: 'COFINS', debit: 2660.00, credit: 500.00, balance: 2160.00 },
  ];

  return { records, operationsSummary, taxSummary };
};
