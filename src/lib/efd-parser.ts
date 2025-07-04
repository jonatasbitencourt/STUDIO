import type { ParsedEfdData, EfdRecord } from './types';

// Helper to parse Brazilian-style numbers (e.g., "1.234,56" -> 1234.56)
const parseNumber = (str: string | undefined): number => {
  if (!str) return 0;
  // Handles numbers like "1.234,56"
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
};

// Definitions for common EFD Contribuições records
const RECORD_DEFINITIONS: { [key: string]: string[] } = {
  '0000': ['REG', 'COD_VER', 'TIPO_ESCRIT', 'IND_SIT_ESP', 'NUM_REC_ANTERIOR', 'DT_INI', 'DT_FIN', 'NOME', 'CNPJ', 'UF', 'COD_MUN', 'SUFRAMA', 'IND_NAT_PJ', 'IND_ATIV'],
  '0001': ['REG', 'IND_MOV'],
  '0110': ['REG', 'COD_INC_TRIB', 'IND_APROD', 'COD_TIPO_CONT', 'IND_REG_CUM'],
  '0500': ['REG', 'DT_ALT', 'COD_NAT_CC', 'IND_CTA', 'NIVEL', 'COD_CTA', 'NOME_CTA'],
  'C100': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'NUM_DOC', 'CHV_NFE', 'DT_DOC', 'DT_E_S', 'VL_DOC', 'IND_PGTO', 'VL_DESC', 'VL_ABAT_NT', 'VL_MERC', 'IND_FRT', 'VL_FRT', 'VL_SEG', 'VL_OUT_DA', 'VL_BC_ICMS', 'VL_ICMS', 'VL_BC_ICMS_ST', 'VL_ICMS_ST', 'VL_IPI', 'VL_PIS', 'VL_COFINS', 'VL_PIS_ST', 'VL_COFINS_ST'],
  'C170': ['REG', 'NUM_ITEM', 'COD_ITEM', 'DESCR_COMPL', 'QTD', 'UNID', 'VL_ITEM', 'VL_DESC', 'IND_MOV', 'CST_ICMS', 'CFOP', 'COD_NAT', 'VL_BC_ICMS', 'ALIQ_ICMS', 'VL_ICMS', 'VL_BC_ICMS_ST', 'ALIQ_ST', 'VL_ICMS_ST', 'IND_APUR', 'CST_IPI', 'COD_ENQ', 'VL_BC_IPI', 'ALIQ_IPI', 'VL_IPI', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA'],
  'M200': ['REG', 'VL_TOT_CONT_NC_PER', 'VL_TOT_CRED_DESC_PER', 'VL_TOT_CRED_DESC_EXT_PER', 'VL_TOT_CONT_NC_DEV', 'VL_TOT_CRED_EST', 'VL_TOT_CONT_NC_RET', 'VL_TOT_CONT_CUM_PER', 'VL_TOT_CRED_CUM_PER', 'VL_TOT_CRED_CUM_EXT_PER', 'VL_TOT_CONT_CUM_DEV', 'VL_TOT_CRED_CUM_EST', 'VL_TOT_CONT_CUM_RET', 'VL_TOT_CONT_REC', 'VL_TOT_CONT_REC_ANT', 'VL_TOT_PER_FISCAL', 'VL_TOT_AJ_RED', 'VL_TOT_AJ_ACRES', 'VL_TOT_CONT_PAG_DCOMP', 'VL_TOT_CONT_PAG_PER', 'VL_TOT_CONT_PAG_OUT', 'VL_TOT_CONT_PAG', 'VL_TOT_CONT_DEV_PIS', 'VL_TOT_CONT_DEV_COFINS'],
  'M210': ['REG', 'COD_CONT', 'VL_REC_BRU_NC_PER', 'VL_BC_CONT', 'VL_AJUS_ACRES_BC', 'VL_AJUS_REDUC_BC', 'VL_CONT_APUR', 'VL_CRED_DESC', 'VL_CRED_DESC_ANT', 'VL_TOT_CONT_DEVIDO', 'VL_RET_NC_PER', 'VL_OUT_DED_NC', 'VL_CONT_NC_RECOLHER', 'VL_REC_BRU_CUM_PER', 'VL_BC_CONT_CUM', 'VL_AJUS_ACRES_BC_CUM', 'VL_AJUS_REDUC_BC_CUM', 'VL_CONT_APUR_CUM', 'VL_CRED_DESC_CUM', 'VL_CRED_DESC_ANT_CUM', 'VL_TOT_CONT_DEVIDO_CUM', 'VL_RET_CUM_PER', 'VL_OUT_DED_CUM', 'VL_CONT_CUM_RECOLHER', 'VL_TOT_CONT_RECOLHER'],
  'M610': ['REG', 'COD_CONT', 'VL_REC_BRU_NC_PER', 'VL_BC_CONT', 'VL_AJUS_ACRES_BC', 'VL_AJUS_REDUC_BC', 'VL_CONT_APUR', 'VL_CRED_DESC', 'VL_CRED_DESC_ANT', 'VL_TOT_CONT_DEVIDO', 'VL_RET_NC_PER', 'VL_OUT_DED_NC', 'VL_CONT_NC_RECOLHER', 'VL_REC_BRU_CUM_PER', 'VL_BC_CONT_CUM', 'VL_AJUS_ACRES_BC_CUM', 'VL_AJUS_REDUC_BC_CUM', 'VL_CONT_APUR_CUM', 'VL_CRED_DESC_CUM', 'VL_CRED_DESC_ANT_CUM', 'VL_TOT_CONT_DEVIDO_CUM', 'VL_RET_CUM_PER', 'VL_OUT_DED_CUM', 'VL_CONT_CUM_RECOLHER', 'VL_TOT_CONT_RECOLHER'],
  'F100': ['REG', 'IND_OPER', 'COD_PART', 'COD_ITEM', 'DT_OPER', 'VL_OPER', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'NAT_BC_CRED', 'IND_ORIG_CRED', 'COD_CTA', 'COD_CCUS', 'DESC_DOC_OPER'],
  '9900': ['REG', 'REG_BLC', 'QTD_REG_BLC'],
  '9999': ['REG', 'QTD_LIN'],
};

function transformMBlockToTaxSummary(reg: 'PIS' | 'COFINS', mRecord: EfdRecord): ParsedEfdData['taxSummary'] {
  const taxSummary: ParsedEfdData['taxSummary'] = [];
  const mapping: { [key: string]: string | undefined } = {
    'VL_TOT_CONT': mRecord.VL_CONT_APUR,
    'VL_TOT_CRED_DESC': mRecord.VL_CRED_DESC,
    'VL_TOT_CRED_DESC_ANT': mRecord.VL_CRED_DESC_ANT,
    'VL_TOT_CONT_DEVIDO': mRecord.VL_TOT_CONT_DEVIDO,
    'VL_RET_FONTE': mRecord.VL_RET_NC_PER,
    'VL_OUT_DED': mRecord.VL_OUT_DED_NC,
    'VL_CONT_NC_RECOLHER': mRecord.VL_CONT_NC_RECOLHER,
    'VL_TOT_CONT_CUM': mRecord.VL_CONT_APUR_CUM,
    'VL_RET_FONTE_CUM': mRecord.VL_RET_CUM_PER,
    'VL_OUT_DED_CUM': mRecord.VL_OUT_DED_CUM,
    'VL_CONT_CUM_RECOLHER': mRecord.VL_CONT_CUM_RECOLHER,
    'VL_TOT_CONT_RECOLHER': mRecord.VL_TOT_CONT_RECOLHER,
  };

  for (const [atributo, valorStr] of Object.entries(mapping)) {
    if (valorStr !== undefined) {
      taxSummary.push({
        reg,
        atributo,
        valor: parseNumber(valorStr),
      });
    }
  }
  return taxSummary;
}


export const parseEfdFile = (fileContent: string): ParsedEfdData => {
  if (!fileContent.trim()) {
    throw new Error("File content is empty.");
  }

  const lines = fileContent.split(/\r?\n/);

  const parsedData: ParsedEfdData = {
    records: {},
    operationsSummary: [],
    taxSummary: [],
  };

  const operationsSummaryMap = new Map<string, any>();
  let currentC100: EfdRecord | null = null;

  for (const line of lines) {
    if (!line || !line.startsWith('|')) continue;

    const fields = line.substring(1, line.length - 1).split('|');
    const regType = fields[0];
    if (!regType) continue;

    const headers = RECORD_DEFINITIONS[regType] || fields.map((_, i) => `CAMPO_${i + 1}`);
    const efdRecord: EfdRecord = {};
    headers.forEach((header, index) => {
      efdRecord[header] = fields[index] || '';
    });

    if (!parsedData.records[regType]) {
      parsedData.records[regType] = [];
    }
    parsedData.records[regType].push(efdRecord);

    if (regType === 'C100') {
      currentC100 = efdRecord;
    } else if (regType === 'C170' && currentC100) {
      const c170 = efdRecord;
      
      const cfop = c170.CFOP;
      const cstPis = c170.CST_PIS;
      const cstCofins = c170.CST_COFINS;
      const aliqPis = parseNumber(c170.ALIQ_PIS);
      const aliqCof = parseNumber(c170.ALIQ_COFINS);
      const indOper = currentC100.IND_OPER;

      const key = `${cfop}|${cstPis}|${cstCofins}|${aliqPis}|${aliqCof}|${indOper}`;

      if (!operationsSummaryMap.has(key)) {
        operationsSummaryMap.set(key, {
          direcao: indOper === '0' ? 'Entrada' : 'Saída',
          cfop: cfop,
          vlr_tot: 0,
          vlr_icms: 0,
          vlr_st: 0,
          vlr_ipi: 0,
          vlr_bc_pis_cof: 0,
          vlr_pis: 0,
          vlr_cofins: 0,
          cst_pis_cof: `${cstPis}/${cstCofins}`,
          aliq_pis: aliqPis,
          aliq_cof: aliqCof,
        });
      }

      const summary = operationsSummaryMap.get(key);
      summary.vlr_tot += parseNumber(c170.VL_ITEM);
      summary.vlr_icms += parseNumber(c170.VL_ICMS);
      summary.vlr_st += parseNumber(c170.VL_ICMS_ST);
      summary.vlr_ipi += parseNumber(c170.VL_IPI);
      summary.vlr_bc_pis_cof += parseNumber(c170.VL_BC_PIS); // Assuming same base for PIS/COFINS
      summary.vlr_pis += parseNumber(c170.VL_PIS);
      summary.vlr_cofins += parseNumber(c170.VL_COFINS);
    } else if (regType === 'M210') {
      const pisSummary = transformMBlockToTaxSummary('PIS', efdRecord);
      parsedData.taxSummary.push(...pisSummary);
    } else if (regType === 'M610') {
      const cofinsSummary = transformMBlockToTaxSummary('COFINS', efdRecord);
      parsedData.taxSummary.push(...cofinsSummary);
    }
  }

  parsedData.operationsSummary = Array.from(operationsSummaryMap.values());
  
  // Sort records for consistent display
  const sortedRecords: { [recordType: string]: EfdRecord[] } = {};
  Object.keys(parsedData.records).sort().forEach(key => {
    sortedRecords[key] = parsedData.records[key];
  });
  parsedData.records = sortedRecords;


  return parsedData;
};
