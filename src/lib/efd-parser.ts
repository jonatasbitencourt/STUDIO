
import type { ParsedEfdData, EfdRecord, TaxSummaryItem, OperationSummaryItem } from './types';
import { recordHierarchy } from './efd-structure';

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

const parseNumber = (str: string | undefined): number => {
  if (!str) return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
};

const RECORD_DEFINITIONS: { [key: string]: string[] } = {
  '0000': ['REG', 'COD_VER', 'TIPO_ESCRIT', 'IND_SIT_ESP', 'NUM_REC_ANTERIOR', 'DT_INI', 'DT_FIN', 'NOME', 'CNPJ', 'UF', 'COD_MUN', 'SUFRAMA', 'IND_NAT_PJ', 'IND_ATIV'],
  '0001': ['REG', 'IND_MOV'],
  '0035': ['REG', 'COD_SCP', 'DESC_SCP', 'INF_COMP'],
  '0100': ['REG', 'NOME', 'CPF', 'CRC', 'CNPJ', 'CEP', 'END', 'NUM', 'COMPL', 'BAIRRO', 'FONE', 'FAX', 'EMAIL', 'COD_MUN'],
  '0110': ['REG', 'COD_TIPO_CONT', 'COD_INC_TRIB', 'IND_APRO_CRED', 'IND_REG_CUM'],
  '0111': ['REG', 'REC_BRU_NCUM_MI', 'REC_BRU_NCUM_EXP', 'REC_BRU_CUM', 'REC_BRU_TOTAL'],
  '0120': ['REG', 'MES_REFER', 'INF_COMP'],
  '0140': ['REG', 'COD_EST', 'NOME', 'CNPJ', 'UF', 'IE', 'COD_MUN', 'IM', 'SUFRAMA'],
  '0145': ['REG', 'COD_INC_TRIB', 'VL_REC_TOT', 'VL_REC_ATIV', 'VL_REC_DEMAIS_ATIV'],
  '0150': ['REG', 'COD_PART', 'NOME', 'COD_PAIS', 'CNPJ', 'CPF', 'IE', 'COD_MUN', 'SUFRAMA', 'END', 'NUM', 'COMPL', 'BAIRRO'],
  '0190': ['REG', 'UNID', 'DESCR'],
  '0200': ['REG', 'COD_ITEM', 'DESCR_ITEM', 'COD_BARRA', 'COD_ANT_ITEM', 'UNID_INV', 'TP_ITEM', 'NCM', 'EX_IPI', 'COD_NCM_ANT', 'CEST', 'ALIQ_ICMS'],
  '0205': ['REG', 'COD_ANT_ITEM', 'DT_INI_ALT', 'DT_FIM_ALT'],
  '0206': ['REG', 'COD_COMB'],
  '0208': ['REG', 'COD_TAB', 'COD_GRUPO'],
  '0400': ['REG', 'COD_NAT', 'DESCR_NAT'],
  '0450': ['REG', 'COD_INF', 'DESCR_INF'],
  '0500': ['REG', 'DT_ALT', 'COD_NAT_CC', 'IND_CTA', 'NÍVEL', 'COD_CTA', 'NOME_CTA', 'COD_CTA_REF', 'CNPJ_EST'],
  '0600': ['REG', 'DT_ALT', 'COD_CCUS', 'CCUS'],
  '0990': ['REG', 'QTD_LIN_0'],
  'A001': ['REG', 'IND_MOV'],
  'A010': ['REG', 'CNPJ'],
  'A100': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'SUB', 'NUM_DOC', 'DT_DOC', 'DT_EXE_SERV', 'VL_DOC', 'VL_DESC', 'VL_ABAT_NAO_TRIB', 'VL_PIS_CUM', 'VL_COFINS_CUM', 'VL_ICMS', 'CST_ICMS', 'ALIQ_ICMS', 'VL_OPR_PIS', 'VL_OPR_COFINS', 'VL_PIS_OPR', 'VL_COFINS_OPR', 'VL_RECPIS', 'VL_RECCOFINS', 'VL_PIS', 'VL_COFINS', 'VL_PIS_ST', 'VL_COFINS_ST', 'VL_RECPIS_ST', 'VL_RECCOFINS_ST', 'VL_IPI', 'CST_IPI', 'ALIQ_IPI', 'VL_IMPOSTO_IMPORT', 'VL_ICMS_ST', 'VL_ICMS_OPR', 'VL_OPR_REC', 'VL_OPR_CRED'],
  'A110': ['REG', 'COD_INF', 'TXT_COMPL'],
  'A111': ['REG', 'NUM_PROC', 'IND_PROC'],
  'A120': ['REG', 'VL_TOT_SERV', 'VL_BC_PIS', 'VL_PIS_IMP', 'DT_PAG_PIS', 'VL_BC_COFINS', 'VL_COFINS_IMP', 'DT_PAG_COFINS', 'LOC_EXEC_SERV', 'IND_ORIG_CRED'],
  'A170': ['REG', 'NUM_ITEM', 'COD_ITEM', 'DESCR_COMPL', 'QTD', 'UNID', 'VL_ITEM', 'VL_DESC', 'NAT_BC_CRED', 'IND_ORIG_CRED', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA', 'COD_CCUS'],
  'A990': ['REG', 'QTD_LIN_A'],
  'C001': ['REG', 'IND_MOV'],
  'C010': ['REG', 'CNPJ', 'IND_ESCRI'],
  'C100': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'NUM_DOC', 'CHV_NFE', 'DT_DOC', 'DT_E_SAI', 'VL_DOC', 'VL_DESC', 'VL_ABAT_NAO_TRIB', 'VL_FRT', 'VL_SEG', 'VL_OUT_DESP', 'VL_BC_ICMS', 'VL_ICMS', 'VL_BC_ICMS_ST', 'VL_ICMS_ST', 'VL_IPI', 'CST_IPI', 'ALIQ_IPI', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA', 'COD_CCUS'],
  'C110': ['REG', 'COD_INF', 'TXT_COMPL'],
  'C111': ['REG', 'NUM_PROC', 'IND_PROC'],
  'C120': ['REG', 'COD_DOC_IMP', 'NUM_DOC_IMP', 'CHV_DOC_IMP', 'DT_REG_IMP', 'NUM_ACDRAW'],
  'C170': ['REG', 'NUM_ITEM', 'COD_ITEM', 'DESCR_COMPL', 'QTD', 'UNID', 'VL_ITEM', 'VL_DESC', 'IND_MOV', 'CST_ICMS', 'CFOP', 'VL_BC_ICMS', 'ALIQ_ICMS', 'VL_ICMS', 'VL_BC_ICMS_ST', 'ALIQ_ICMS_ST', 'VL_ICMS_ST', 'IND_AJ_BC_ICMS', 'VL_IPI', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA', 'COD_CCUS'],
  'C175': ['REG', 'CFOP', 'VL_OPER', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA', 'INFO_COMPL'],
  'C180': ['REG', 'COD_MOD', 'DT_DOC_INI', 'DT_DOC_FIN', 'COD_ITEM', 'COD_NCM', 'EX_IPI', 'VL_TOT_ITEM'],
  'C181': ['REG', 'CST_PIS', 'CFOP', 'VL_ITEM', 'VL_DESC', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'COD_CTA'],
  'C185': ['REG', 'CST_COFINS', 'CFOP', 'VL_ITEM', 'VL_DESC', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA'],
  'C188': ['REG', 'NUM_PROC', 'IND_PROC'],
  'C190': ['REG', 'COD_MOD', 'DT_DOC_INI', 'DT_DOC_FIN', 'COD_ITEM', 'COD_NCM', 'EX_IPI', 'VL_TOT_ITEM'],
  'C191': ['REG', 'CNPJ_CPF_PART', 'CST_PIS', 'CFOP', 'VL_ITEM', 'VL_DESC', 'NAT_BC_CRED', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'COD_CTA'],
  'C195': ['REG', 'CNPJ_CPF_PART', 'CST_COFINS', 'CFOP', 'VL_ITEM', 'VL_DESC', 'NAT_BC_CRED', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA'],
  'C199': ['REG', 'COD_DOC_IMP', 'NUM_DOC_IMP', 'CHV_DOC_IMP', 'DT_REG_IMP', 'NUM_ACDRAW'],
  'C380': ['REG', 'COD_MOD', 'DT_DOC_INI', 'DT_DOC_FIN', 'NUM_DOC_INI', 'NUM_DOC_FIN', 'VL_DOC'],
  'C381': ['REG', 'CST_PIS', 'COD_ITEM', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'COD_CTA'],
  'C385': ['REG', 'CST_COFINS', 'COD_ITEM', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA'],
  'C395': ['REG', 'COD_MOD', 'COD_PART', 'SER', 'SUB_SER', 'NUM_DOC', 'DT_DOC', 'VL_DOC'],
  'C396': ['REG', 'COD_ITEM', 'VL_ITEM', 'VL_DESC', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA', 'COD_CCUS'],
  'C400': ['REG', 'COD_MOD', 'ECF_MOD', 'ECF_FAB', 'ECF_CX'],
  'C405': ['REG', 'DT_DOC', 'CRO', 'CRZ', 'NUM_COO', 'GT_FIN', 'VL_BRT'],
  'C481': ['REG', 'CST_PIS', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'COD_ITEM', 'COD_CTA'],
  'C485': ['REG', 'CST_COFINS', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_ITEM', 'COD_CTA'],
  'C489': ['REG', 'NUM_PROC', 'IND_PROC'],
  'C490': ['REG', 'DT_DOC_INI', 'DT_DOC_FIN', 'COD_MOD', 'VL_DOC', 'VL_DESC', 'VL_CANC', 'VL_BRT'],
  'C491': ['REG', 'COD_ITEM', 'CST_PIS', 'CFOP', 'VL_ITEM', 'VL_DESC', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'COD_CTA'],
  'C495': ['REG', 'COD_ITEM', 'CST_COFINS', 'CFOP', 'VL_ITEM', 'VL_DESC', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA'],
  'C499': ['REG', 'NUM_PROC', 'IND_PROC'],
  'C500': ['REG', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'SUB', 'NUM_DOC', 'DT_DOC', 'DT_E_SAI', 'VL_DOC', 'VL_DESC', 'VL_FORN', 'VL_SERV_NT', 'VL_TERC', 'VL_PIS_CUM', 'VL_COFINS_CUM', 'CHV_DOCe'],
  'C501': ['REG', 'CST_PIS', 'VL_ITEM', 'NAT_BC_CRED', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'C505': ['REG', 'CST_COFINS', 'VL_ITEM', 'NAT_BC_CRED', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'C509': ['REG', 'NUM_PROC', 'IND_PROC'],
  'C600': ['REG', 'COD_MOD', 'COD_MUN', 'SER', 'SUB', 'COD_CONS', 'QTD_CONS', 'DT_DOC', 'VL_DOC', 'VL_DESC', 'VL_FORN', 'VL_SERV_NT', 'VL_TERC', 'VL_PIS_CUM', 'VL_COFINS_CUM'],
  'C601': ['REG', 'CST_PIS', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'C605': ['REG', 'CST_COFINS', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'C609': ['REG', 'NUM_PROC', 'IND_PROC'],
  'C800': ['REG', 'COD_MOD', 'COD_SIT', 'NUM_CFE', 'DT_DOC', 'VL_CFE', 'VL_PIS', 'VL_COFINS', 'VL_PIS_ST', 'VL_COFINS_ST', 'VL_DESC', 'CHV_CFE'],
  'C810': ['REG', 'CFOP', 'VL_ITEM', 'COD_ITEM', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'C820': ['REG', 'CFOP', 'VL_ITEM', 'COD_ITEM', 'CST_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA'],
  'C830': ['REG', 'NUM_PROC', 'IND_PROC'],
  'C860': ['REG', 'COD_MOD', 'NR_SAT', 'DT_DOC', 'DOC_INI', 'DOC_FIM'],
  'C870': ['REG', 'COD_ITEM', 'CFOP', 'VL_ITEM', 'VL_DESC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'C880': ['REG', 'COD_ITEM', 'CFOP', 'VL_ITEM', 'VL_DESC', 'CST_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA'],
  'C890': ['REG', 'NUM_PROC', 'IND_PROC'],
  'C990': ['REG', 'QTD_LIN_C'],
  'D001': ['REG', 'IND_MOV'],
  'D010': ['REG', 'CNPJ'],
  'D100': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'SUB', 'NUM_DOC', 'CHV_CTE', 'DT_DOC', 'DT_AQU_SERV', 'TP_CT_E', 'CHV_CTE_REF', 'VL_DOC', 'VL_DESC', 'IND_FRT', 'VL_FRT', 'VL_SEG', 'VL_OUT_DESP', 'VL_BC_ICMS', 'VL_ICMS', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA', 'COD_CCUS'],
  'D101': ['REG', 'IND_NAT_FRT', 'VL_ITEM', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'D105': ['REG', 'IND_NAT_FRT', 'VL_ITEM', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D111': ['REG', 'NUM_PROC', 'IND_PROC'],
  'D200': ['REG', 'COD_MOD', 'SER', 'NUM_DOC_INI', 'NUM_DOC_FIN', 'DT_DOC', 'DT_EXE_SERV', 'VL_DOC', 'VL_DESC', 'VL_CANC', 'VL_CONT_PIS', 'VL_CONT_COFINS'],
  'D201': ['REG', 'CST_PIS', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'D205': ['REG', 'CST_COFINS', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D209': ['REG', 'NUM_PROC', 'IND_PROC'],
  'D300': ['REG', 'COD_MOD', 'SER', 'NUM_DOC_INI', 'NUM_DOC_FIN', 'CFOP', 'DT_DOC', 'VL_DOC', 'VL_DESC', 'VL_CANC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D309': ['REG', 'NUM_PROC', 'IND_PROC'],
  'D350': ['REG', 'COD_MOD', 'ECF_MOD', 'ECF_FAB', 'ECF_CX', 'DT_DOC', 'CRO', 'CRZ', 'NUM_COO_INI', 'NUM_COO_FIN', 'VL_BRT', 'VL_ISS', 'VL_PIS', 'VL_COFINS', 'VL_ISENTOS', 'VL_NAO_TRIB', 'VL_CANC', 'VL_DESC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS_APUR', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS_APUR', 'COD_CTA'],
  'D359': ['REG', 'NUM_PROC', 'IND_PROC'],
  'D500': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'SUB', 'NUM_DOC', 'DT_DOC', 'DT_AQU_SERV', 'VL_DOC', 'VL_DESC', 'VL_BC_ICMS', 'VL_ICMS', 'VL_PIS', 'VL_COFINS', 'COD_CTA', 'COD_CCUS'],
  'D501': ['REG', 'CST_PIS', 'VL_ITEM', 'NAT_BC_CRED', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'D505': ['REG', 'CST_COFINS', 'VL_ITEM', 'NAT_BC_CRED', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D509': ['REG', 'NUM_PROC', 'IND_PROC'],
  'D600': ['REG', 'COD_MOD', 'COD_MUN', 'SER', 'SUB', 'IND_REC', 'QTD_BILHETES', 'DT_DOC_INI', 'DT_DOC_FIN', 'VL_REC', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'VL_ISS', 'VL_ICMS', 'VL_OUT_DA', 'VL_COSEMS', 'VL_COFEMS'],
  'D601': ['REG', 'COD_CLASS', 'VL_ITEM', 'VL_DESC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'D605': ['REG', 'COD_CLASS', 'VL_ITEM', 'VL_DESC', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D609': ['REG', 'NUM_PROC', 'IND_PROC'],
  'D990': ['REG', 'QTD_LIN_D'],
  'F001': ['REG', 'IND_MOV'],
  'F010': ['REG', 'CNPJ'],
  'F100': ['REG', 'IND_OPER', 'COD_PART', 'COD_ITEM', 'DT_OPER', 'VL_OPER', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'IND_ORIG_CRED', 'COD_CTA', 'COD_CCUS', 'DESC_DOC_OPER'],
  'F111': ['REG', 'NUM_PROC', 'IND_PROC'],
  'F120': ['REG', 'NAT_BC_CRED', 'IDENT_BEM_IMOB', 'IND_ORIG_CRED', 'IND_UTIL_BEM_IMOB', 'VL_OPER_DEP', 'VL_EXC_BC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA', 'COD_CCUS', 'DESCR_BEM'],
  'F129': ['REG', 'NUM_PROC', 'IND_PROC'],
  'F130': ['REG', 'NAT_BC_CRED', 'IDENT_BEM_IMOB', 'IND_ORIG_CRED', 'IND_UTIL_BEM_IMOB', 'MES_AQUIS', 'VL_AQUIS_BEM', 'VL_EXC_BC', 'IND_NR_PARC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA', 'COD_CCUS', 'DESCR_BEM'],
  'F139': ['REG', 'NUM_PROC', 'IND_PROC'],
  'F150': ['REG', 'NAT_BC_CRED', 'VL_TOT_EST', 'VL_EXC_BC_EST', 'VL_BC_EST', 'VL_BC_EST_MES', 'CST_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'DESC_EST', 'COD_CTA'],
  'F200': ['REG', 'UNID_IMOB', 'TP_UNID_IMOB', 'IDENT_EMP', 'DESC_UNID_IMOB', 'NUM_CONT', 'CPF_CNPJ_ADQU', 'DT_OPER_COMP', 'VL_UNID_IMOB_AT', 'VL_TOT_REC', 'VL_REC_ACUM', 'VL_COMP_AJUS_UNID', 'COD_ITEM', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'IND_NAT_EMP', 'INF_COMP'],
  'F205': ['REG', 'COD_UNID_IMOB', 'VL_CUSTO_INC_MES', 'VL_CUSTO_INC_ACUM', 'VL_EXC_BC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'F210': ['REG', 'COD_UNID_IMOB', 'VL_CUSTO_ORC', 'VL_CUSTO_ORC_PER', 'VL_EXC_BC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'F211': ['REG', 'NUM_PROC', 'IND_PROC'],
  'F500': ['REG', 'VL_REC_CAIXA', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_MOD', 'CFOP', 'COD_CTA', 'INFO_COMPL'],
  'F509': ['REG', 'NUM_PROC', 'IND_PROC'],
  'F510': ['REG', 'VL_REC_CAIXA', 'CST_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_MOD', 'CFOP', 'COD_CTA', 'INFO_COMPL'],
  'F519': ['REG', 'NUM_PROC', 'IND_PROC'],
  'F525': ['REG', 'DT_REC', 'IND_REC_COMP', 'VL_REC_COMP', 'COD_CTA', 'INFO_COMPL'],
  'F550': ['REG', 'VL_REC_COMP', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_MOD', 'CFOP', 'COD_CTA', 'INFO_COMPL'],
  'F559': ['REG', 'NUM_PROC', 'IND_PROC'],
  'F560': ['REG', 'VL_REC_COMP', 'CST_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_MOD', 'CFOP', 'COD_CTA', 'INFO_COMPL'],
  'F569': ['REG', 'NUM_PROC', 'IND_PROC'],
  'F600': ['REG', 'IND_NAT_RET', 'DT_RET', 'VL_BC_RET', 'VL_RET', 'COD_REC', 'IND_NAT_REC', 'CNPJ', 'VL_RET_PIS', 'VL_RET_COFINS', 'IND_DEC'],
  'F700': ['REG', 'IND_ORI_DED', 'VL_DED_PIS', 'VL_DED_COFINS', 'CNPJ', 'INFO_COMPL'],
  'F800': ['REG', 'NAT_CRED_SUC', 'DT_SUCESS', 'CNPJ_SUCED', 'PER_APU_CRED_ORIG', 'VL_CRED_PIS', 'VL_CRED_COFINS', 'PERC_FUS_CIS_INCORP'],
  'F990': ['REG', 'QTD_LIN_F'],
  'I001': ['REG', 'IND_MOV'],
  'I010': ['REG', 'CNPJ', 'IND_ATIV', 'INF_COMP'],
  'I100': ['REG', 'VL_REC', 'CST_PIS_COFINS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'VL_EXC_BC', 'VL_AJUS_BC', 'INFO_COMPL'],
  'I199': ['REG', 'NUM_PROC', 'IND_PROC'],
  'I200': ['REG', 'NUM_CAMPO', 'COD_DET', 'DET_VALOR', 'COD_CTA', 'INFO_COMPL'],
  'I299': ['REG', 'NUM_PROC', 'IND_PROC'],
  'I300': ['REG', 'COD_COMP', 'DET_VALOR', 'COD_CTA', 'INFO_COMPL'],
  'I399': ['REG', 'NUM_PROC', 'IND_PROC'],
  'I990': ['REG', 'QTD_LIN_I'],
  'M001': ['REG', 'IND_MOV'],
  'M100': ['REG', 'COD_CRED', 'IND_CRED_ORI', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_CRED', 'VL_AJUS_ACRES', 'VL_AJUS_REDUC', 'VL_CRED_DIF', 'VL_CRED_DISP', 'IND_DESC_CRED', 'VL_CRED_DESC', 'SLD_CRED'],
  'M105': ['REG', 'NAT_BC_CRED', 'CST_PIS', 'VL_BC_PIS_TOT', 'VL_BC_PIS_CUM', 'VL_BC_PIS_NC', 'VL_BC_PIS', 'QUANT_BC_PIS_TOT', 'QUANT_BC_PIS', 'DESC_CRED'],
  'M110': ['REG', 'IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESCR_AJ', 'DT_REF'],
  'M115': ['REG', 'DET_VALOR_AJ', 'CST_PIS', 'DET_BC_CRED', 'DET_ALIQ', 'DT_OPER_AJ', 'DESC_AJ', 'COD_CTA', 'INFO_COMPL'],
  'M200': ['REG', 'VL_TOT_CONT_NC_PER', 'VL_TOT_CRED_DESC', 'VL_TOT_CRED_DESC_ANT', 'VL_TOT_CONT_NC_DEV', 'VL_RET_NC', 'VL_OUT_DED_NC', 'VL_CONT_NC_REC', 'VL_TOT_CONT_CUM_PER', 'VL_RET_CUM', 'VL_OUT_DED_CUM', 'VL_CONT_CUM_REC', 'VL_TOT_CONT_REC'],
  'M205': ['REG', 'NUM_CAMPO', 'COD_REC', 'VL_DEBITO'],
  'M210': ['REG', 'COD_CONT', 'VL_REC_BRT', 'VL_BC_CONT', 'VL_AJUS_ACRES_BC_PIS', 'VL_AJUS_REDUC_BC_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_CONT_APUR', 'VL_AJUS_ACRES', 'VL_AJUS_REDUC', 'VL_CONT_DIFER', 'VL_CONT_DIFER_ANT', 'VL_CONT_PER'],
  'M211': ['REG', 'IND_TIP_COOP', 'VL_BC_CONT_ANT_EXC_COOP', 'VL_EXC_COOP_GER', 'VL_EXC_ESP_COOP', 'VL_BC_CONT_COOP'],
  'M215': ['REG', 'IND_AJ_BC', 'VL_AJ_BC', 'COD_AJ_BC', 'NUM_DOC', 'DESCR_AJ_BC', 'DT_REF', 'COD_CTA', 'CNPJ', 'INFO_COMPL'],
  'M220': ['REG', 'IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESCR_AJ', 'DT_REF'],
  'M225': ['REG', 'DET_VALOR_AJ', 'CST_PIS', 'DET_BC_CRED', 'DET_ALIQ', 'DT_OPER_AJ', 'DESC_AJ', 'COD_CTA', 'INFO_COMPL'],
  'M230': ['REG', 'CNPJ', 'VL_VEND', 'VL_CONT_DIFER', 'VL_CRED_DIFER_PIS', 'PER_APUR', 'DT_RECEB'],
  'M350': ['REG', 'VL_TOT_FOL', 'VL_EXC_BC', 'VL_TOT_BC', 'ALIQ_PIS_FOL', 'VL_TOT_CONT_FOL'],
  'M400': ['REG', 'CST_PIS', 'VL_TOT_REC', 'COD_CTA', 'DESC_COMPL'],
  'M410': ['REG', 'NAT_REC', 'VL_REC', 'COD_CTA', 'DESC_COMPL'],
  'M500': ['REG', 'COD_CRED', 'IND_CRED_ORI', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_CRED_APU', 'VL_AJUS_ACRES', 'VL_AJUS_REDUC', 'VL_CRED_DIFER', 'VL_CRED_COMP', 'VL_CRED_PER', 'VL_SALDO_CRED', 'VL_CRED_EXT_REC', 'COD_CTA'],
  'M505': ['REG', 'NAT_BC_CRED', 'CST_COFINS', 'VL_BC_COFINS_TOT', 'VL_BC_COFINS_CUM', 'VL_BC_COFINS_NC', 'VL_BC_COFINS', 'QUANT_BC_COFINS_TOT', 'QUANT_BC_COFINS', 'DESC_CRED'],
  'M510': ['REG', 'IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESCR_AJ', 'DT_REF'],
  'M515': ['REG', 'DET_VALOR_AJ', 'CST_COFINS', 'DET_BC_CRED', 'DET_ALIQ', 'DT_OPER_AJ', 'DESC_AJ', 'COD_CTA', 'INFO_COMPL'],
  'M600': ['REG', 'VL_TOT_CONT_NC_PER', 'VL_TOT_CRED_DESC', 'VL_TOT_CRED_DESC_ANT', 'VL_TOT_CONT_NC_DEV', 'VL_RET_NC', 'VL_OUT_DED_NC', 'VL_CONT_NC_REC', 'VL_TOT_CONT_CUM_PER', 'VL_RET_CUM', 'VL_OUT_DED_CUM', 'VL_CONT_CUM_REC', 'VL_TOT_CONT_REC'],
  'M605': ['REG', 'NUM_CAMPO', 'COD_REC', 'VL_DEBITO'],
  'M610': ['REG', 'COD_CONT', 'VL_REC_BRT', 'VL_BC_CONT', 'VL_AJUS_ACRES_BC_COFINS', 'VL_AJUS_REDUC_BC_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_CONT_APUR', 'VL_AJUS_ACRES', 'VL_AJUS_REDUC', 'VL_CONT_DIFER', 'VL_CONT_DIFER_ANT', 'VL_CONT_PER'],
  'M611': ['REG', 'IND_TIP_COOP', 'VL_BC_CONT_ANT_EXC_COOP', 'VL_EXC_COOP_GER', 'VL_EXC_ESP_COOP', 'VL_BC_CONT'],
  'M615': ['REG', 'IND_AJ_BC', 'VL_AJ_BC', 'COD_AJ_BC', 'NUM_DOC', 'DESCR_AJ_BC', 'DT_REF', 'COD_CTA', 'CNPJ', 'INFO_COMPL'],
  'M620': ['REG', 'IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESCR_AJ', 'DT_REF'],
  'M625': ['REG', 'DET_VALOR_AJ', 'CST_COFINS', 'DET_BC_CRED', 'DET_ALIQ', 'DT_OPER_AJ', 'DESC_AJ', 'COD_CTA', 'INFO_COMPL'],
  'M630': ['REG', 'CNPJ', 'VL_VEND', 'VL_CONT_DIFER', 'VL_CRED_DIFER_COFINS', 'PER_APUR', 'DT_RECEB'],
  'M700': ['REG', 'COD_CONT', 'VL_CONT_APUR_DIFER', 'NAT_CRED_DESC', 'VL_CRED_DESC', 'PER_APUR', 'DT_RECEB'],
  'M800': ['REG', 'CST_COFINS', 'VL_TOT_REC', 'COD_CTA', 'DESC_COMPL'],
  'M810': ['REG', 'NAT_REC', 'VL_REC', 'COD_CTA', 'DESC_COMPL'],
  'M990': ['REG', 'QTD_LIN_M'],
  'P001': ['REG', 'IND_MOV'],
  'P010': ['REG', 'CNPJ'],
  'P100': ['REG', 'DT_INI', 'DT_FIN', 'VL_REC_BRT', 'COD_ATIV_ECON', 'ALIQ_CONT', 'VL_CONT_APUR', 'VL_AJ_ACRES', 'VL_AJ_REDUC', 'VL_CONT_DIF', 'VL_CONT_DIF_ANT', 'VL_CONT_RET', 'VL_COMP_PR', 'VL_CONT_OUT', 'VL_SLD_CONT', 'COD_CTA'],
  'P110': ['REG', 'NUM_CAMPO', 'COD_DET', 'DET_VALOR'],
  'P199': ['REG', 'NUM_PROC', 'IND_PROC'],
  'P200': ['REG', 'PER_REF', 'VL_TOT_CONT_APU', 'VL_AJ_ACRES', 'VL_AJ_REDUC', 'VL_DED_AJ_DIF', 'COD_REC'],
  'P210': ['REG', 'IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESCR_AJ', 'DT_REF'],
  'P990': ['REG', 'QTD_LIN_P'],
  '1001': ['REG', 'IND_MOV'],
  '1010': ['REG', 'NUM_PROC', 'ID_SEC_JUD', 'ID_VARA', 'IND_NAT_ACAO', 'DESC_DEC_JUD', 'DT_DEC_JUD'],
  '1011': ['REG', 'REG_REF', 'CHAVE_DOC', 'COD_PART', 'COD_ITEM', 'DT_OPER', 'VL_OPER', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA', 'COD_CCUS', 'DESC_DOC_OPER'],
  '1020': ['REG', 'NUM_PROC', 'IND_NAT_ACAO', 'DT_DEC_ADM'],
  '1050': ['REG', 'DT_REF', 'IND_AJ_BC', 'CNPJ', 'VL_AJ_TOT', 'VL_AJ_CST01', 'VL_AJ_CST02', 'VL_AJ_CST03', 'VL_AJ_CST04', 'VL_AJ_CST05', 'VL_AJ_CST06', 'VL_AJ_CST07', 'VL_AJ_CST08', 'VL_AJ_CST09', 'VL_AJ_CST49', 'VL_AJ_CST99', 'IND_CONT', 'NUM_REC', 'INFO_COMPL'],
  '1100': ['REG', 'PER_APU_CRED', 'ORIG_CRED', 'CNPJ_SUC', 'COD_CRED', 'VL_CRED_APU', 'VL_CRED_EXT_APU', 'VL_CRED_TOT', 'VL_CRED_DESC_ANT', 'VL_CRED_DESC_PER', 'VL_CRED_TRANSF', 'VL_CRED_OUT', 'SLD_CRED'],
  '1101': ['REG', 'COD_PART', 'COD_ITEM', 'COD_MOD', 'SER', 'SUB_SER', 'NUM_DOC', 'DT_OPER', 'CHV_NFE', 'VL_OPER', 'CFOP', 'NAT_BC_CRED', 'IND_ORIG_CRED', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA', 'COD_CCUS', 'DESC_COMPL', 'PER_ESCRIT', 'CNPJ'],
  '1102': ['REG', 'VL_CRED_PIS_TRIB_MI', 'VL_CRED_PIS_NT_MI', 'VL_CRED_PIS_EXP'],
  '1200': ['REG', 'PER_APUR_ANT', 'NAT_CONT_REC', 'DT_RECOL', 'VL_CONT_APUR', 'VL_CRED_PIS_DESC', 'VL_OUT_DED_PIS', 'VL_PIS_PAG', 'VL_CONT_EXT', 'VL_MUL', 'VL_JUR', 'DT_RECOL'],
  '1210': ['REG', 'CNPJ', 'CST_PIS', 'COD_PART', 'DT_OPER', 'VL_OPER', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA', 'DESC_COMPL'],
  '1220': ['REG', 'PER_APUR_CRED', 'ORIG_CRED', 'COD_CRED', 'VL_CRED_DESC'],
  '1300': ['REG', 'IND_NAT_RET', 'PR_REC_RET', 'VL_RET_BRT', 'VL_RET_APU', 'VL_RET_DED', 'VL_RET_PER', 'VL_RET_DCOMP', 'SLD_RET'],
  '1500': ['REG', 'PER_APU_CRED', 'ORIG_CRED', 'CNPJ_SUC', 'COD_CRED', 'VL_CRED_APU', 'VL_CRED_EXT_APU', 'VL_CRED_TOT', 'VL_CRED_DESC_ANT', 'VL_CRED_DESC_PER', 'VL_CRED_TRANSF', 'VL_CRED_OUT', 'SLD_CRED'],
  '1501': ['REG', 'COD_PART', 'COD_ITEM', 'COD_MOD', 'SER', 'SUB_SER', 'NUM_DOC', 'DT_OPER', 'CHV_NFE', 'VL_OPER', 'CFOP', 'NAT_BC_CRED', 'IND_ORIG_CRED', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA', 'COD_CCUS', 'DESC_COMPL', 'PER_ESCRIT', 'CNPJ'],
  '1502': ['REG', 'VL_CRED_COFINS_TRIB_MI', 'VL_CRED_COFINS_NT_MI', 'VL_CRED_COFINS_EXP'],
  '1600': ['REG', 'PER_APUR_ANT', 'NAT_CONT_REC', 'VL_CONT_APUR', 'VL_CRED_COFINS_DESC', 'VL_OUT_DED_COFINS', 'VL_COFINS_PAG', 'VL_CONT_EXT', 'VL_MUL', 'VL_JUR', 'DT_RECOL'],
  '1610': ['REG', 'CNPJ', 'CST_COFINS', 'COD_PART', 'DT_OPER', 'VL_OPER', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA', 'DESC_COMPL'],
  '1620': ['REG', 'PER_APU_CRED', 'ORIG_CRED', 'COD_CRED', 'VL_CRED_DESC'],
  '1700': ['REG', 'IND_NAT_RET', 'PR_REC_RET', 'VL_RET_BRT', 'VL_RET_APU', 'VL_RET_DED', 'VL_RET_PER', 'VL_RET_DCOMP', 'SLD_RET'],
  '1800': ['REG', 'INC_IMOB', 'REC_RECEB_RET', 'REC_FIN_RET', 'BC_RET', 'ALIQ_RET', 'VL_REC_UNI', 'DT_REC_UNI', 'COD_REC'],
  '1809': ['REG', 'NUM_PROC', 'IND_PROC'],
  '1900': ['REG', 'CNPJ', 'COD_MOD', 'SER', 'SUB', 'COD_SIT', 'VL_DOC', 'QTD_DOC', 'CST_PIS', 'CST_COFINS', 'CFOP', 'INFO_COMPL', 'COD_CTA'],
  '1990': ['REG', 'QTD_LIN_1'],
  '9001': ['REG', 'IND_MOV'],
  '9900': ['REG', 'REG_BLC', 'QTD_REG_BLC'],
  '9990': ['REG', 'QTD_LIN_9'],
  '9999': ['REG', 'QTD_LIN'],
};

function transformConsolidationRecordToTaxSummary(record: EfdRecord): TaxSummaryItem[] {
  const summary: TaxSummaryItem[] = [];
  const headers = RECORD_DEFINITIONS[record.REG] || Object.keys(record);

  for (const attribute of headers) {
    if (attribute === 'REG' || attribute === '_id' || attribute === '_cnpj' || attribute === '_parentId') continue;
    const valueStr = record[attribute];
    if (valueStr !== undefined) {
      summary.push({
        atributo: attribute,
        valor: parseNumber(valueStr),
      });
    }
  }
  return summary;
}

export async function recalculateSummaries(records: { [key: string]: EfdRecord[] }): Promise<Omit<ParsedEfdData, 'records'>> {
  const operationsSummaryMap = new Map<string, OperationSummaryItem>();
  const c170records = records['C170'] || [];
  
  const c100Map = new Map<string, EfdRecord>();
  (records['C100'] || []).forEach(c100 => {
    if (c100._id) c100Map.set(c100._id, c100);
  });

  let processedCount = 0;
  for (const c170 of c170records) {
    if (!c170._parentId) continue;
    const parentC100 = c100Map.get(c170._parentId);

    if (parentC100) {
      const cfop = c170.CFOP;
      const cstPis = c170.CST_PIS;
      const cstCofins = c170.CST_COFINS;
      const aliqPis = parseNumber(c170.ALIQ_PIS);
      const aliqCof = parseNumber(c170.ALIQ_COFINS);
      const indOper = parentC100.IND_OPER;

      const key = `${indOper}|${cfop}|${cstPis}|${aliqPis}|${cstCofins}|${aliqCof}`;

      if (!operationsSummaryMap.has(key)) {
        operationsSummaryMap.set(key, {
          direcao: indOper === '0' ? 'Entrada' : 'Saída',
          cfop: cfop,
          cst_pis_cof: `${cstPis}/${cstCofins}`,
          aliq_pis: aliqPis,
          aliq_cof: aliqCof,
          vlr_tot: 0, vlr_icms: 0, vlr_st: 0, vlr_ipi: 0, vlr_bc_pis_cof: 0, vlr_pis: 0, vlr_cofins: 0,
        });
      }

      const summary = operationsSummaryMap.get(key)!;
      summary.vlr_tot += parseNumber(c170.VL_ITEM);
      summary.vlr_icms += parseNumber(c170.VL_ICMS);
      summary.vlr_st += parseNumber(c170.VL_ICMS_ST);
      summary.vlr_ipi += parseNumber(c170.VL_IPI);
      summary.vlr_bc_pis_cof += parseNumber(c170.VL_BC_PIS);
      summary.vlr_pis += parseNumber(c170.VL_PIS);
      summary.vlr_cofins += parseNumber(c170.VL_COFINS);
    }
    
    processedCount++;
    if (processedCount % 5000 === 0) {
      await yieldToMain();
    }
  }

  const operationsSummaryEntradas = Array.from(operationsSummaryMap.values()).filter(s => s.direcao === 'Entrada');
  const operationsSummarySaidas = Array.from(operationsSummaryMap.values()).filter(s => s.direcao === 'Saída');
  operationsSummaryEntradas.sort((a, b) => a.cfop.localeCompare(b.cfop));
  operationsSummarySaidas.sort((a, b) => a.cfop.localeCompare(b.cfop));

  const taxSummaryPis = records['M200'] && records['M200'].length > 0 ? transformConsolidationRecordToTaxSummary(records['M200'][0]) : [];
  const taxSummaryCofins = records['M600'] && records['M600'].length > 0 ? transformConsolidationRecordToTaxSummary(records['M600'][0]) : [];

  return {
    operationsSummaryEntradas,
    operationsSummarySaidas,
    taxSummaryPis,
    taxSummaryCofins,
  };
}

export const parseEfdFile = async (fileContent: string): Promise<ParsedEfdData> => {
  if (!fileContent.trim()) throw new Error("File content is empty.");

  const lines = fileContent.split(/\r?\n/);
  const records: { [key: string]: EfdRecord[] } = {};
  let idCounter = 0;
  
  const parentStack: EfdRecord[] = [];
  let lastSeenCnpj: string | null = null;
  
  let lineCount = 0;
  for (const line of lines) {
    if (!line || !line.startsWith('|')) continue;

    const fields = line.substring(1, line.length - 1).split('|');
    const regType = fields[0];
    if (!regType) continue;

    const definition = RECORD_DEFINITIONS[regType];
    const headers = definition ? [...definition] : fields.map((_, i) => `CAMPO_${i}`);
    if (definition) headers[0] = 'REG'; else headers[0] = 'REG';

    const efdRecord: EfdRecord = { _id: `id_${idCounter++}` };
    headers.forEach((header, index) => {
      efdRecord[header] = fields[index] || '';
    });
    
    // Manage parent stack to establish parent-child relationships
    while (parentStack.length > 0) {
      const currentParent = parentStack[parentStack.length - 1];
      const parentChildren = recordHierarchy[currentParent.REG] || [];
      if (parentChildren.includes(regType)) {
        efdRecord._parentId = currentParent._id;
        break; 
      } else {
        parentStack.pop();
      }
    }
    // Check if the current record is a parent itself
    if (recordHierarchy[regType]) {
      parentStack.push(efdRecord);
    }
    
    if (regType.endsWith('010') && efdRecord.CNPJ) { 
      lastSeenCnpj = efdRecord.CNPJ;
    } else if (regType === '0000') {
      lastSeenCnpj = efdRecord.CNPJ || null;
    }

    const block = regType.charAt(0).toUpperCase();

    // Do not associate consolidation blocks (M, P) with a specific CNPJ
    if (['M', 'P'].includes(block)) {
        lastSeenCnpj = null;
    }
    
    if (regType === '0140') {
      efdRecord._cnpj = efdRecord.CNPJ;
    } else if (regType === '0500' && efdRecord.CNPJ_EST) {
      efdRecord._cnpj = efdRecord.CNPJ_EST;
    } else if (['A', 'C', 'D', 'F', 'I'].includes(block) && !regType.endsWith('001')) {
      if (lastSeenCnpj) {
        efdRecord._cnpj = lastSeenCnpj;
      }
    }

    if (!records[regType]) {
      records[regType] = [];
    }
    
    records[regType].push(efdRecord);
    
    lineCount++;
    if (lineCount % 5000 === 0) {
      await yieldToMain();
    }
  }

  const sortedRecords: { [recordType: string]: EfdRecord[] } = {};
  Object.keys(records).sort().forEach(key => {
    sortedRecords[key] = records[key];
  });
  
  const summaries = await recalculateSummaries(sortedRecords);

  return {
    records: sortedRecords,
    ...summaries
  };
};

export const exportRecordsToEfdText = (records: { [key: string]: EfdRecord[] }): string => {
    const blockOrder = ['0', 'A', 'C', 'D', 'F', 'M', 'P', 'I', '1', '9'];
    let text = '';

    const allRecordTypes = Object.keys(records);
    
    const sortedTypesByBlock = allRecordTypes.sort((a, b) => {
        const blockA = a.charAt(0);
        const blockB = b.charAt(0);
        const indexA = blockOrder.indexOf(blockA);
        const indexB = blockOrder.indexOf(blockB);

        if (indexA !== indexB) {
            return indexA - indexB;
        }
        return a.localeCompare(b);
    });

    for (const recordType of sortedTypesByBlock) {
        if (!records[recordType] || records[recordType].length === 0) continue;
        
        if (recordType.endsWith('001') && records[recordType][0]?.IND_MOV === '1') {
            const block = recordType.charAt(0);
            const hasDataInBlock = allRecordTypes.some(rt => rt.startsWith(block) && rt !== recordType);
            if (!hasDataInBlock) continue;
        }

        const definition = RECORD_DEFINITIONS[recordType];
        if (!definition) continue;
        
        for (const record of records[recordType]) {
            const fields = definition.map(header => record[header] || '');
            text += `|${fields.join('|')}|\n`;
        }
    }

    return text;
};
