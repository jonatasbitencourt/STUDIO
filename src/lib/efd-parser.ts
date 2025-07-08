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
  '0100': ['REG', 'NOME', 'CPF', 'CRC', 'CNPJ', 'CEP', 'END', 'NUM', 'COMPL', 'BAIRRO', 'FONE', 'FAX', 'EMAIL', 'COD_MUN'],
  '0110': ['REG', 'COD_INC_TRIB', 'IND_APROD', 'COD_TIPO_CONT', 'IND_REG_CUM'],
  '0111': ['REG', 'REC_BRU_NC_TRIB_MI', 'REC_BRU_NC_NT_MI', 'REC_BRU_NC_EXP', 'REC_BRU_CUM', 'REC_BRU_TOTAL'],
  '0140': ['REG', 'COD_EST', 'NOME', 'CNPJ', 'UF', 'IE', 'COD_MUN', 'IM', 'INC_IM'],
  '0150': ['REG', 'COD_PART', 'NOME', 'COD_PAIS', 'CNPJ', 'CPF', 'IE', 'COD_MUN', 'SUFRAMA', 'END', 'NUM', 'COMPL', 'BAIRRO'],
  '0190': ['REG', 'UNID', 'DESCR'],
  '0200': ['REG', 'COD_ITEM', 'DESCR_ITEM', 'COD_BARRA', 'COD_ANT_ITEM', 'UNID_INV', 'TIPO_ITEM', 'COD_NCM', 'EX_IPI', 'COD_GEN', 'COD_LST', 'ALIQ_ICMS'],
  '0205': ['REG', 'DESCR_ANT_ITEM', 'DT_INI', 'DT_FIM', 'COD_ANT_ITEM'],
  '0206': ['REG', 'COD_PROD_ANP'],
  '0400': ['REG', 'COD_NAT', 'DESCR_NAT'],
  '0450': ['REG', 'COD_INF', 'TXT'],
  '0500': ['REG', 'DT_ALT', 'COD_NAT_CC', 'IND_CTA', 'NIVEL', 'COD_CTA', 'NOME_CTA', 'COD_CTA_REF', 'CNPJ_EST'],
  '0600': ['REG', 'DT_ALT', 'COD_CCUS', 'CCUS'],
  '0990': ['REG', 'QTD_LIN_0'],
  'A001': ['REG', 'IND_MOV'],
  'A010': ['REG', 'CNPJ'],
  'A100': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_SIT', 'SER', 'SUB', 'NUM_DOC', 'CHV_NFSE', 'DT_DOC', 'DT_EXE_SERV', 'VL_DOC', 'IND_PGTO', 'VL_DESC', 'VL_BC_PIS', 'VL_PIS', 'VL_BC_COFINS', 'VL_COFINS', 'VL_PIS_RET', 'VL_COFINS_RET', 'VL_ISS'],
  'A170': ['REG', 'NUM_ITEM', 'COD_ITEM', 'DESCR_COMPL', 'VL_ITEM', 'VL_DESC', 'NAT_BC_CRED', 'IND_ORIG_CRED', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA', 'COD_CCUS'],
  'A990': ['REG', 'QTD_LIN_A'],
  'C001': ['REG', 'IND_MOV'],
  'C010': ['REG', 'CNPJ', 'IND_ESCRI'],
  'C100': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'NUM_DOC', 'CHV_NFE', 'DT_DOC', 'DT_E_S', 'VL_DOC', 'IND_PGTO', 'VL_DESC', 'VL_ABAT_NT', 'VL_MERC', 'IND_FRT', 'VL_FRT', 'VL_SEG', 'VL_OUT_DA', 'VL_BC_ICMS', 'VL_ICMS', 'VL_BC_ICMS_ST', 'VL_ICMS_ST', 'VL_IPI', 'VL_PIS', 'VL_COFINS', 'VL_PIS_ST', 'VL_COFINS_ST'],
  'C110': ['REG', 'COD_INF', 'TXT_COMPL'],
  'C111': ['REG', 'NUM_PROC', 'IND_PROC'],
  'C120': ['REG', 'COD_DOC_IMP', 'NUM_ACDRAW', 'VL_PIS_IMP', 'VL_COFINS_IMP', 'NUM_AC'],
  'C170': ['REG', 'NUM_ITEM', 'COD_ITEM', 'DESCR_COMPL', 'QTD', 'UNID', 'VL_ITEM', 'VL_DESC', 'IND_MOV', 'CST_ICMS', 'CFOP', 'COD_NAT', 'VL_BC_ICMS', 'ALIQ_ICMS', 'VL_ICMS', 'VL_BC_ICMS_ST', 'ALIQ_ST', 'VL_ICMS_ST', 'IND_APUR', 'CST_IPI', 'COD_ENQ', 'VL_BC_IPI', 'ALIQ_IPI', 'VL_IPI', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA'],
  'C175': ['REG', 'CFOP', 'VL_OPER', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'C180': ['REG', 'COD_MOD', 'DT_DOC_INI', 'DT_DOC_FIN', 'COD_ITEM', 'COD_NCM', 'EX_IPI', 'VL_TOT_ITEM'],
  'C181': ['REG', 'CST_PIS', 'CFOP', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'COD_CTA'],
  'C185': ['REG', 'CST_COFINS', 'CFOP', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_CTA'],
  'C190': ['REG', 'COD_MOD', 'DT_REF_INI', 'DT_REF_FIN', 'COD_ITEM', 'COD_NCM', 'EX_IPI', 'VL_TOT_ITEM'],
  'C191': ['REG', 'CNPJ_CPF_PART', 'CST_PIS', 'CFOP', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS_P', 'QUANT_BC_PIS', 'ALIQ_PIS_R', 'VL_PIS', 'COD_CTA'],
  'C195': ['REG', 'CNPJ_CPF_PART', 'CST_COFINS', 'CFOP', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS_P', 'QUANT_BC_COFINS', 'ALIQ_COFINS_R', 'VL_COFINS', 'COD_CTA'],
  'C198': ['REG', 'COD_ITEM', 'COD_NCM', 'EX_IPI', 'VL_TOT_ITEM'],
  'C199': ['REG', 'CST_PIS', 'CFOP', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'C380': ['REG', 'COD_MOD', 'DT_DOC_INI', 'DT_DOC_FIN', 'NUM_DOC_INI', 'NUM_DOC_FIN', 'VL_TOT_DOC'],
  'C381': ['REG', 'CST_PIS', 'COD_ITEM', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS'],
  'C385': ['REG', 'CST_COFINS', 'COD_ITEM', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS'],
  'C395': ['REG', 'COD_MOD', 'COD_PART', 'SER', 'SUB_SER', 'NUM_DOC', 'DT_DOC', 'VL_DOC'],
  'C396': ['REG', 'NUM_ITEM', 'COD_ITEM', 'DESCR_COMPL', 'QTD', 'UNID', 'VL_ITEM', 'VL_DESC', 'NAT_BC_CRED', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'C400': ['REG', 'COD_MOD', 'ECF_MOD', 'ECF_FAB', 'ECF_CX'],
  'C405': ['REG', 'DT_DOC', 'CRO', 'CRZ', 'NUM_COO_FIN', 'GT_FIN', 'VL_BRT'],
  'C481': ['REG', 'CST_PIS', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'COD_ITEM', 'COD_CTA'],
  'C485': ['REG', 'CST_COFINS', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_ITEM', 'COD_CTA'],
  'C490': ['REG', 'DT_DOC_INI', 'DT_DOC_FIN', 'COD_MOD'],
  'C491': ['REG', 'CST_PIS', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'COD_ITEM', 'COD_CTA'],
  'C495': ['REG', 'CST_COFINS', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'COD_ITEM', 'COD_CTA'],
  'C500': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'SUB', 'COD_CONS', 'NUM_DOC', 'DT_DOC', 'DT_E_S', 'VL_DOC', 'VL_DESC', 'VL_FORN', 'VL_SERV_NT', 'VL_TERC', 'VL_DA', 'VL_BC_ICMS', 'VL_ICMS', 'VL_BC_ICMS_ST', 'VL_ICMS_ST', 'COD_INF', 'VL_PIS', 'VL_COFINS'],
  'C501': ['REG', 'CST_PIS', 'VL_ITEM', 'NAT_BC_CRED', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'C505': ['REG', 'CST_COFINS', 'VL_ITEM', 'NAT_BC_CRED', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'C600': ['REG', 'COD_MOD', 'COD_MUN', 'SER', 'SUB', 'COD_CONS', 'QTD_CONS', 'QTD_CANC', 'DT_DOC', 'VL_DOC', 'VL_DESC', 'CONS', 'VL_FORN', 'VL_SERV_NT', 'VL_TERC', 'VL_DA', 'VL_BC_ICMS', 'VL_ICMS', 'VL_BC_ICMS_ST', 'VL_ICMS_ST', 'VL_PIS', 'VL_COFINS'],
  'C601': ['REG', 'CST_PIS', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'C605': ['REG', 'CST_COFINS', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'C860': ['REG', 'COD_MOD', 'NR_SAT', 'DT_DOC', 'DOC_INI', 'DOC_FIM'],
  'C870': ['REG', 'CST_PIS', 'CFOP', 'ALIQ_PIS', 'VL_ITEM', 'VL_BC_PIS', 'VL_PIS'],
  'C880': ['REG', 'CST_COFINS', 'CFOP', 'ALIQ_COFINS', 'VL_ITEM', 'VL_BC_COFINS', 'VL_COFINS'],
  'C890': ['REG', 'CST_PIS', 'CFOP', 'ALIQ_PIS', 'VL_ITEM', 'VL_BC_PIS', 'VL_PIS', 'CST_COFINS', 'ALIQ_COFINS', 'VL_BC_COFINS', 'VL_COFINS', 'COD_CTA'],
  'C990': ['REG', 'QTD_LIN_C'],
  'D001': ['REG', 'IND_MOV'],
  'D010': ['REG', 'CNPJ'],
  'D100': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'SUB', 'NUM_DOC', 'CHV_CTE', 'DT_DOC', 'DT_A_P', 'TP_CT-E', 'CHV_CTE_REF', 'VL_DOC', 'VL_DESC', 'IND_FRT', 'VL_SERV', 'VL_BC_ICMS', 'VL_ICMS', 'VL_NT', 'COD_INF', 'COD_CTA'],
  'D101': ['REG', 'IND_NAT_FRT', 'VL_ITEM', 'CST_PIS', 'NAT_BC_CRED', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D105': ['REG', 'IND_NAT_FRT', 'VL_ITEM', 'CST_COFINS', 'NAT_BC_CRED', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D200': ['REG', 'COD_MOD', 'COD_SIT', 'SER', 'SUB', 'NUM_DOC_INI', 'NUM_DOC_FIN', 'CFOP', 'VL_DOC', 'VL_DESC', 'VL_SERV', 'VL_BC_ICMS', 'VL_ICMS'],
  'D201': ['REG', 'CST_PIS', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'D205': ['REG', 'CST_COFINS', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D300': ['REG', 'COD_MOD', 'SER', 'SUB', 'NUM_DOC_INI', 'NUM_DOC_FIN', 'CST_PIS', 'CST_COFINS', 'CFOP', 'ALIQ_PIS', 'ALIQ_COFINS', 'VL_DOC', 'VL_DESC', 'VL_SERV', 'VL_BC_PIS', 'VL_PIS', 'VL_BC_COFINS', 'VL_COFINS', 'VL_PIS_RET', 'VL_COFINS_RET', 'VL_ISS', 'COD_CTA'],
  'D301': ['REG', 'NUM_DOC_CANC'],
  'D350': ['REG', 'COD_MOD', 'ECF_MOD', 'ECF_FAB', 'ECF_CX', 'DT_DOC_INI', 'DT_DOC_FIN', 'CST_PIS', 'CST_COFINS', 'CFOP', 'ALIQ_PIS', 'ALIQ_COFINS', 'VL_DOC', 'VL_DESC', 'VL_SERV', 'VL_BC_PIS', 'VL_PIS', 'VL_BC_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D500': ['REG', 'IND_OPER', 'IND_EMIT', 'COD_PART', 'COD_MOD', 'COD_SIT', 'SER', 'SUB', 'NUM_DOC', 'DT_DOC', 'DT_A_P', 'VL_DOC', 'VL_DESC', 'VL_SERV', 'VL_SERV_NT', 'VL_TERC', 'VL_DA', 'VL_BC_ICMS', 'VL_ICMS', 'COD_INF', 'VL_PIS', 'VL_COFINS'],
  'D501': ['REG', 'CST_PIS', 'VL_ITEM', 'NAT_BC_CRED', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA', 'COD_CCUS'],
  'D505': ['REG', 'CST_COFINS', 'VL_ITEM', 'NAT_BC_CRED', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA', 'COD_CCUS'],
  'D600': ['REG', 'COD_MOD', 'COD_MUN', 'SER', 'SUB', 'IND_REC', 'QTD_CONS', 'DT_DOC_INI', 'DT_DOC_FIN', 'VL_DOC', 'VL_DESC', 'VL_SERV', 'VL_SERV_NT', 'VL_TERC', 'VL_DA', 'VL_BC_ICMS', 'VL_ICMS', 'VL_PIS', 'VL_COFINS'],
  'D601': ['REG', 'COD_CLASS', 'VL_ITEM', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'COD_CTA'],
  'D605': ['REG', 'COD_CLASS', 'VL_ITEM', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_CTA'],
  'D990': ['REG', 'QTD_LIN_D'],
  'F001': ['REG', 'IND_MOV'],
  'F010': ['REG', 'CNPJ'],
  'F100': ['REG', 'IND_OPER', 'COD_PART', 'COD_ITEM', 'DT_OPER', 'VL_OPER', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'NAT_BC_CRED', 'IND_ORIG_CRED', 'COD_CTA', 'COD_CCUS', 'DESC_DOC_OPER'],
  'F120': ['REG', 'NAT_BC_CRED', 'IDENT_BEM_IMOB', 'IND_ORIG_CRED', 'IND_UTIL_BEM_IMOB', 'VL_OPER_AQUIS', 'PARC_OPER_NAO_BC_CRED', 'VL_BC_CRED', 'IND_APROP_CRED', 'NUM_PARC', 'VL_CRED_PIS_APROP', 'VL_CRED_COFINS_APROP'],
  'F130': ['REG', 'NAT_BC_CRED', 'IDENT_BEM_IMOB', 'IND_APROP_CRED', 'VL_IMOB_APROP', 'NUM_PARC', 'VL_CRED_PIS_APROP', 'VL_CRED_COFINS_APROP'],
  'F150': ['REG', 'NAT_BC_CRED', 'VL_TOT_EST', 'EST_IMP', 'VL_CRED_PIS_EST', 'VL_CRED_COFINS_EST', 'DESC_EST', 'COD_CTA'],
  'F200': ['REG', 'IND_OPER', 'UNID_IMOB', 'IDENT_EMP', 'DESC_UNID', 'NUM_CONT', 'CPF_CNPJ_ADQU', 'DT_OPER', 'VL_TOT_VEND', 'VL_REC_ACUM', 'VL_TOT_REC_PER', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'PERC_REC_RECEB', 'IND_NAT_EMP', 'INF_COMP'],
  'F205': ['REG', 'VL_CUS_INC_ACUM_ANT', 'VL_CUS_INC_PER_ESC', 'VL_CUS_INC_ACUM', 'VL_EXC_BC_CUS_INC_ACUM', 'VL_BC_CUS_INC', 'CST_PIS', 'ALIQ_PIS', 'VL_CRED_PIS_ACUM', 'VL_CRED_PIS_DESC_ANT', 'VL_CRED_PIS_DESC', 'VL_CRED_PIS_EXT_ANT', 'VL_CRED_PIS_EXT', 'VL_CRED_PIS_DCOMP_ANT', 'VL_CRED_PIS_DCOMP', 'VL_CRED_PIS_TRANS', 'SD_CRED_PIS_FIM', 'CST_COFINS', 'ALIQ_COFINS', 'VL_CRED_COFINS_ACUM', 'VL_CRED_COFINS_DESC_ANT', 'VL_CRED_COFINS_DESC', 'VL_CRED_COFINS_EXT_ANT', 'VL_CRED_COFINS_EXT', 'VL_CRED_COFINS_DCOMP_ANT', 'VL_CRED_COFINS_DCOMP', 'VL_CRED_COFINS_TRANS', 'SD_CRED_COFINS_FIM'],
  'F210': ['REG', 'VL_CUS_ORC', 'VL_EXC', 'VL_CUS_ORC_AJU', 'PER_CUS_ORC'],
  'F500': ['REG', 'VL_REC_CAIXA', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'COD_MOD', 'CFOP', 'COD_CTA', 'INFO_COMPL'],
  'F510': ['REG', 'VL_REC_CAIXA', 'CST_PIS', 'ALIQ_PIS', 'VL_BC_PIS', 'VL_PIS', 'CST_COFINS', 'ALIQ_COFINS', 'VL_BC_COFINS', 'VL_COFINS', 'COD_MOD', 'CFOP', 'COD_CTA', 'INFO_COMPL'],
  'F525': ['REG', 'VL_REC', 'IND_REC', 'CNPJ_CPF', 'INFO_COMPL'],
  'F550': ['REG', 'VL_REC_COMP', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'CFOP', 'COD_CTA', 'INFO_COMPL'],
  'F560': ['REG', 'VL_REC_COMP', 'CST_PIS', 'ALIQ_PIS', 'VL_BC_PIS', 'VL_PIS', 'CST_COFINS', 'ALIQ_COFINS', 'VL_BC_COFINS', 'VL_COFINS', 'COD_MOD', 'CFOP', 'COD_CTA', 'INFO_COMPL'],
  'F600': ['REG', 'IND_NAT_RET', 'DT_RET', 'VL_BC_RET', 'VL_RET', 'COD_REC', 'IND_NAT_REC', 'CNPJ', 'VL_RET_PIS', 'VL_RET_COFINS', 'IND_DEC'],
  'F700': ['REG', 'IND_ORI_DED', 'IND_NAT_DED', 'VL_DED_PIS', 'VL_DED_COFINS', 'VL_BC_OPER', 'CNPJ', 'INF_COMP'],
  'F800': ['REG', 'IND_NAT_EVEN', 'DT_EVEN', 'CNPJ_SUCED', 'PA_CONT_CRED', 'COD_CRED', 'VL_CRED_PIS', 'VL_CRED_COFINS', 'PER_CRED_APROP', 'IND_ORIG_CRED'],
  'F990': ['REG', 'QTD_LIN_F'],
  'I001': ['REG', 'IND_MOV'],
  'I010': ['REG', 'CNPJ', 'IND_ATIV'],
  'I100': ['REG', 'DT_INI', 'DT_FIN', 'VL_REC', 'CST_PIS', 'VL_BC_PIS', 'ALIQ_PIS', 'VL_PIS', 'CST_COFINS', 'VL_BC_COFINS', 'ALIQ_COFINS', 'VL_COFINS', 'IND_REG_CUM', 'VL_DED_PIS', 'VL_DED_COFINS', 'VL_BC_PIS_CUM', 'ALIQ_PIS_CUM', 'VL_PIS_CUM', 'VL_BC_COFINS_CUM', 'ALIQ_COFINS_CUM', 'VL_COFINS_CUM', 'VL_PIS_RET', 'VL_COFINS_RET', 'INFO_COMPL'],
  'I200': ['REG', 'NUM_CAMPO', 'COD_DET', 'DET_VALOR', 'COD_CTA', 'INFO_COMPL'],
  'I300': ['REG', 'COD_COMP', 'DET_VALOR', 'COD_CTA', 'INFO_COMPL'],
  'I990': ['REG', 'QTD_LIN_I'],
  'M001': ['REG', 'IND_MOV'],
  'M100': ['REG', 'COD_CRED', 'IND_CRED_ORI', 'VL_BC_PIS', 'ALIQ_PIS', 'QUANT_BC_PIS', 'ALIQ_PIS_QUANT', 'VL_PIS', 'VL_AJUS_ACRES', 'VL_AJUS_REDUC', 'VL_PIS_DIFER', 'VL_PIS_CRED'],
  'M105': ['REG', 'NAT_BC_CRED', 'CST_PIS', 'VL_BC_PIS_TOT', 'VL_BC_PIS_CUM', 'VL_BC_PIS_NC', 'VL_BC_PIS', 'QUANT_BC_PIS_TOT', 'QUANT_BC_PIS', 'DESC_CRED'],
  'M110': ['REG', 'IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESC_AJ', 'DT_REF'],
  'M115': ['REG', 'DET_VAL_AJ', 'CST_PIS', 'DET_BC_CRED', 'DET_ALIQ', 'DT_OPER_AJ', 'DESC_AJ', 'COD_CTA', 'INFO_COMPL'],
  'M200': ['REG', 'VL_TOT_CONT_NC_PER', 'VL_TOT_CRED_DESC_ANT', 'VL_TOT_CRED_PER', 'VL_TOT_CRED_EXT_PER', 'VL_TOT_CONT_NC_DEV', 'VL_RET_NC', 'VL_OUT_DED_NC', 'VL_CONT_NC_REC', 'VL_TOT_CONT_CUM_PER', 'VL_TOT_CRED_CUM_ANT', 'VL_TOT_CRED_CUM_PER', 'VL_TOT_CRED_CUM_EXT_PER', 'VL_TOT_CONT_CUM_DEV', 'VL_RET_CUM', 'VL_OUT_DED_CUM', 'VL_CONT_CUM_REC', 'VL_TOT_CONT_REC'],
  'M205': ['REG', 'NUM_CAMPO', 'COD_REC', 'VL_DEBITO'],
  'M210': ['REG', 'COD_CONT', 'VL_REC_BRU', 'VL_BC_CONT', 'VL_AJUS_ACRES_BC', 'VL_AJUS_REDUC_BC', 'VL_CONT_APUR', 'VL_CRED_DESC', 'VL_CONT_DEVIDO', 'VL_DED_ANT', 'VL_DED_PER', 'VL_DED_EXT', 'VL_CONT_EXT', 'VL_CONT_DEV', 'VL_RET', 'VL_OUT_DED', 'VL_CONT_REC', 'VL_CONT_PAG', 'VL_CONT_DCOMP', 'VL_CRED_TRANSF'],
  'M300': ['REG', 'COD_CONT', 'VL_CONT_APUR_DIFER', 'NAT_CRED_DESC', 'VL_CRED_DESC_DIFER', 'VL_CONT_DIFER_ANT', 'PER_APUR', 'DT_RECEB'],
  'M350': ['REG', 'VL_TOT_FOL', 'VL_EXC_FOL', 'VL_BC_CONT', 'ALIQ_PIS_FOL', 'VL_PIS_FOL'],
  'M400': ['REG', 'CST_PIS', 'VL_TOT_REC', 'COD_CTA', 'DESC_COMPL'],
  'M410': ['REG', 'NAT_REC', 'VL_REC', 'COD_CTA', 'DESC_COMPL'],
  'M500': ['REG', 'COD_CRED', 'IND_CRED_ORI', 'VL_BC_COFINS', 'ALIQ_COFINS', 'QUANT_BC_COFINS', 'ALIQ_COFINS_QUANT', 'VL_COFINS', 'VL_AJUS_ACRES', 'VL_AJUS_REDUC', 'VL_COFINS_DIFER', 'VL_COFINS_CRED'],
  'M505': ['REG', 'NAT_BC_CRED', 'CST_COFINS', 'VL_BC_COFINS_TOT', 'VL_BC_COFINS_CUM', 'VL_BC_COFINS_NC', 'VL_BC_COFINS', 'QUANT_BC_COFINS_TOT', 'QUANT_BC_COFINS', 'DESC_CRED'],
  'M510': ['REG', 'IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESC_AJ', 'DT_REF'],
  'M515': ['REG', 'DET_VAL_AJ', 'CST_COFINS', 'DET_BC_CRED', 'DET_ALIQ', 'DT_OPER_AJ', 'DESC_AJ', 'COD_CTA', 'INFO_COMPL'],
  'M600': ['REG', 'VL_TOT_CONT_NC_PER', 'VL_TOT_CRED_DESC_ANT', 'VL_TOT_CRED_PER', 'VL_TOT_CRED_EXT_PER', 'VL_TOT_CONT_NC_DEV', 'VL_RET_NC', 'VL_OUT_DED_NC', 'VL_CONT_NC_REC', 'VL_TOT_CONT_CUM_PER', 'VL_TOT_CRED_CUM_ANT', 'VL_TOT_CRED_CUM_PER', 'VL_TOT_CRED_CUM_EXT_PER', 'VL_TOT_CONT_CUM_DEV', 'VL_RET_CUM', 'VL_OUT_DED_CUM', 'VL_CONT_CUM_REC', 'VL_TOT_CONT_REC'],
  'M605': ['REG', 'NUM_CAMPO', 'COD_REC', 'VL_DEBITO'],
  'M610': ['REG', 'COD_CONT', 'VL_REC_BRU', 'VL_BC_CONT', 'VL_AJUS_ACRES_BC', 'VL_AJUS_REDUC_BC', 'VL_CONT_APUR', 'VL_CRED_DESC', 'VL_CONT_DEVIDO', 'VL_DED_ANT', 'VL_DED_PER', 'VL_DED_EXT', 'VL_CONT_EXT', 'VL_CONT_DEV', 'VL_RET', 'VL_OUT_DED', 'VL_CONT_REC', 'VL_CONT_PAG', 'VL_CONT_DCOMP', 'VL_CRED_TRANSF'],
  'M700': ['REG', 'COD_CONT', 'VL_CONT_APUR_DIFER', 'NAT_CRED_DESC', 'VL_CRED_DESC_DIFER', 'VL_CONT_DIFER_ANT', 'PER_APUR', 'DT_RECEB'],
  'M800': ['REG', 'CST_COFINS', 'VL_TOT_REC', 'COD_CTA', 'DESC_COMPL'],
  'M810': ['REG', 'NAT_REC', 'VL_REC', 'COD_CTA', 'DESC_COMPL'],
  'M990': ['REG', 'QTD_LIN_M'],
  'P001': ['REG', 'IND_MOV'],
  'P010': ['REG', 'CNPJ'],
  'P100': ['REG', 'DT_INI', 'DT_FIN', 'VL_REC_TOT_EST', 'COD_ATIV_ECON', 'VL_REC_ATIV', 'VL_EXC', 'VL_BC_CONT', 'ALIQ_CONT', 'VL_CONT_APU', 'COD_CTA', 'INFO_COMPL'],
  'P200': ['REG', 'PER_REF', 'VL_TOT_CONT_APU', 'VL_TOT_AJ_REDUC', 'VL_TOT_AJ_ACRES', 'VL_CONT_DEVIDO', 'COD_REC'],
  'P210': ['REG', 'IND_AJ', 'VL_AJ', 'COD_AJ', 'NUM_DOC', 'DESCR_AJ', 'DT_REF'],
  'P990': ['REG', 'QTD_LIN_P'],
  '1001': ['REG', 'IND_MOV'],
  '1010': ['REG', 'NUM_PROC', 'ID_SEC_JUD', 'ID_VARA', 'IND_NAT_ACAO', 'DESC_DEC_JUD', 'DT_SENT_JUD'],
  '1020': ['REG', 'NUM_PROC', 'IND_NAT_ACAO', 'DT_DEC_ADM'],
  '1100': ['REG', 'PER_APU_CRED', 'ORIG_CRED', 'CNPJ_SUC', 'COD_CRED', 'VL_CRED_APU', 'VL_CRED_EXT_APU', 'VL_TOT_CRED_APU', 'VL_CRED_DESC_PA_ANT', 'VL_CRED_PER_PA_ANT', 'VL_CRED_DCOMP_PA_ANT', 'SD_CRED_DISP_PA_ANT', 'VL_CRED_DESC_PA', 'VL_CRED_PER_PA', 'VL_CRED_DCOMP_PA', 'VL_CRED_TRANS', 'VL_CRED_OUT_PA', 'SLD_CRED_FIM_PA'],
  '1300': ['REG', 'PER_APU_CRED', 'ORIG_CRED', 'CNPJ_SUC', 'COD_CRED', 'VL_CRED_APU', 'VL_CRED_EXT_APU', 'VL_TOT_CRED_APU', 'VL_CRED_DESC_PA_ANT', 'VL_CRED_PER_PA_ANT', 'VL_CRED_DCOMP_PA_ANT', 'SD_CRED_DISP_PA_ANT', 'VL_CRED_DESC_PA', 'VL_CRED_PER_PA', 'VL_CRED_DCOMP_PA', 'VL_CRED_TRANS', 'VL_CRED_OUT_PA', 'SLD_CRED_FIM_PA'],
  '1500': ['REG', 'PER_APU_CRED', 'ORIG_CRED', 'CNPJ_SUC', 'COD_CRED', 'VL_CRED_APU', 'VL_CRED_EXT_APU', 'VL_TOT_CRED_APU', 'VL_CRED_DESC_PA_ANT', 'VL_CRED_PER_PA_ANT', 'VL_CRED_DCOMP_PA_ANT', 'SD_CRED_DISP_PA_ANT', 'VL_CRED_DESC_PA', 'VL_CRED_PER_PA', 'VL_CRED_DCOMP_PA', 'VL_CRED_TRANS', 'VL_CRED_OUT_PA', 'SLD_CRED_FIM_PA'],
  '1700': ['REG', 'IND_NAT_CRED', 'IND_ORIG_CRED', 'VL_CRED_APU', 'VL_CRED_DESC', 'VL_CRED_EXT', 'VL_CRED_DCOMP', 'VL_CRED_TRANS', 'VL_CRED_OUT', 'SLD_CRED_FIM'],
  '1800': ['REG', 'INC_IMOB', 'REC_RECEB_INC', 'REC_FIN_INC', 'BC_CRED', 'CST_PIS', 'ALIQ_PIS', 'VL_CRED_PIS', 'CST_COFINS', 'ALIQ_COFINS', 'VL_CRED_COFINS'],
  '1900': ['REG', 'IND_APUR_CR', 'VL_TOT_REC', 'QUANT_DOC', 'INF_COMPL'],
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
