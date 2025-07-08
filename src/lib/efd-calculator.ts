'use server';

import type { EfdRecord } from './types';

const parseNumber = (str: string | undefined): number => {
  if (typeof str !== 'string' || !str) return 0;
  return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
};

const formatNumber = (num: number): string => {
  return num.toFixed(2).replace('.', ',');
};

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export async function calculateMBlock(records: { [key: string]: EfdRecord[] }): Promise<{ [key: string]: EfdRecord[] }> {
    const newRecords = { ...records };

    // Clear existing M block records
    Object.keys(newRecords).forEach(key => {
        if (key.startsWith('M')) {
            delete newRecords[key];
        }
    });

    const cnpjs = new Set<string>();
    if (newRecords['0140']) {
        newRecords['0140'].forEach(r => {
            if (r.CNPJ) cnpjs.add(r.CNPJ);
        });
    }

    if (cnpjs.size === 0) {
        const mainCnpj = newRecords['0000']?.[0]?.CNPJ;
        if(mainCnpj) cnpjs.add(mainCnpj);
    }
    
    if (cnpjs.size === 0) return newRecords;

    const allRecordsFlat = Object.values(newRecords).flat();
    
    const newMRecords: { [key: string]: EfdRecord[] } = {
        'M001': [], 'M100': [], 'M105': [], 'M200': [], 'M210': [],
        'M500': [], 'M505': [], 'M600': [], 'M610': []
    };

    let hasMovementM = false;

    for (const cnpj of cnpjs) {
        await yieldToMain();

        const cnpjRecords = allRecordsFlat.filter(r => !r._cnpj || r._cnpj === cnpj);
        
        // Sources (Simplified to C170 for now)
        const creditSources = cnpjRecords.filter(r => r.REG === 'C170' && r.CST_PIS && parseInt(r.CST_PIS, 10) >= 50 && parseInt(r.CST_PIS, 10) <= 66);
        const debitSources = cnpjRecords.filter(r => r.REG === 'C170' && r.CST_PIS && parseInt(r.CST_PIS, 10) >= 1 && parseInt(r.CST_PIS, 10) <= 9);

        // --- PIS CALCULATION ---
        const pisCreditsAgg: { [key: string]: { natBcCred: string; cstPis: string; vlBcPis: number; quantBcPis: number } } = {};
        creditSources.forEach(r => {
            const nat = r.NAT_BC_CRED || '01';
            const key = `${nat}-${r.CST_PIS}`;
            if (!pisCreditsAgg[key]) {
                pisCreditsAgg[key] = { natBcCred: nat, cstPis: r.CST_PIS!, vlBcPis: 0, quantBcPis: 0 };
            }
            pisCreditsAgg[key].vlBcPis += parseNumber(r.VL_BC_PIS);
            pisCreditsAgg[key].quantBcPis += parseNumber(r.QUANT_BC_PIS);
        });

        const m105s_cnpj: EfdRecord[] = Object.values(pisCreditsAgg).map(p => ({
            REG: 'M105', NAT_BC_CRED: p.natBcCred, CST_PIS: p.cstPis,
            VL_BC_PIS_TOT: formatNumber(p.vlBcPis), VL_BC_PIS_CUM: '0,00', VL_BC_PIS_NC: formatNumber(p.vlBcPis),
            QUANT_BC_PIS_TOT: formatNumber(p.quantBcPis), QUANT_BC_PIS: formatNumber(p.quantBcPis), DESC_CRED: '', _cnpj: cnpj
        }));
        if(m105s_cnpj.length > 0) newMRecords['M105'].push(...m105s_cnpj);
        
        const totalVlBcPis = m105s_cnpj.reduce((sum, r) => sum + parseNumber(r.VL_BC_PIS_NC), 0);
        const vlCredApurado = totalVlBcPis * 0.0165;
        const m100_cnpj: EfdRecord = {
            REG: 'M100', COD_CRED: '101', IND_CRED_ORI: '1', VL_BC_PIS: formatNumber(totalVlBcPis),
            ALIQ_PIS: '1,65', QUANT_BC_PIS: '0,00', ALIQ_PIS_QUANT: '0,00',
            VL_CRED: formatNumber(vlCredApurado), VL_AJUS_ACRES: '0,00', VL_AJUS_REDUC: '0,00',
            VL_CRED_DIF: '0,00', VL_CRED_DISP: formatNumber(vlCredApurado), IND_DESC_CRED: '1',
            VL_CRED_DESC: formatNumber(vlCredApurado), SLD_CRED: '0,00', _cnpj: cnpj
        };
        if(totalVlBcPis > 0) newMRecords['M100'].push(m100_cnpj);

        const pisDebitsAgg: { [key: string]: { vlRecBrt: number, vlBcCont: number, quantBc: number, aliq: number, aliqQuant: number } } = {};
        debitSources.forEach(r => {
            const codCont = '01'; // Simplified
            if (!pisDebitsAgg[codCont]) {
                pisDebitsAgg[codCont] = { vlRecBrt: 0, vlBcCont: 0, quantBc: 0, aliq: parseNumber(r.ALIQ_PIS), aliqQuant: parseNumber(r.ALIQ_PIS_QUANT) };
            }
            pisDebitsAgg[codCont].vlRecBrt += parseNumber(r.VL_ITEM);
            pisDebitsAgg[codCont].vlBcCont += parseNumber(r.VL_BC_PIS);
            pisDebitsAgg[codCont].quantBc += parseNumber(r.QUANT_BC_PIS);
        });

        const m210s_cnpj: EfdRecord[] = Object.keys(pisDebitsAgg).map(codCont => {
            const d = pisDebitsAgg[codCont];
            const vlContApur = (d.vlBcCont * d.aliq / 100) + (d.quantBc * d.aliqQuant);
            return {
                REG: 'M210', COD_CONT: codCont, VL_REC_BRT: formatNumber(d.vlRecBrt), VL_BC_CONT: formatNumber(d.vlBcCont),
                VL_AJUS_ACRES_BC_PIS: '0,00', VL_AJUS_REDUC_BC_PIS: '0,00', QUANT_BC_PIS: formatNumber(d.quantBc),
                ALIQ_PIS_QUANT: formatNumber(d.aliqQuant), VL_CONT_APUR: formatNumber(vlContApur), VL_AJUS_ACRES: '0,00',
                VL_AJUS_REDUC: '0,00', VL_CONT_DIFER: '0,00', VL_CONT_DIFER_ANT: '0,00', VL_CONT_PER: formatNumber(vlContApur),
                _cnpj: cnpj
            };
        });
        if(m210s_cnpj.length > 0) newMRecords['M210'].push(...m210s_cnpj);
        
        const vlTotContNcPer = m210s_cnpj.reduce((sum, r) => sum + parseNumber(r.VL_CONT_PER), 0);
        const vlTotCredDesc = parseNumber(m100_cnpj.VL_CRED_DESC);
        const vlContNcRec = Math.max(0, vlTotContNcPer - vlTotCredDesc);
        const m200_cnpj: EfdRecord = {
            REG: 'M200', VL_TOT_CONT_NC_PER: formatNumber(vlTotContNcPer), VL_TOT_CRED_DESC: formatNumber(vlTotCredDesc),
            VL_TOT_CRED_DESC_ANT: '0,00', VL_TOT_CONT_NC_DEV: '0,00', VL_RET_NC: '0,00', VL_OUT_DED_NC: '0,00',
            VL_CONT_NC_REC: formatNumber(vlContNcRec), VL_TOT_CONT_CUM_PER: '0,00', VL_RET_CUM: '0,00',
            VL_OUT_DED_CUM: '0,00', VL_CONT_CUM_REC: '0,00', VL_TOT_CONT_REC: formatNumber(vlContNcRec),
            _cnpj: cnpj
        };
        if(vlTotContNcPer > 0 || vlTotCredDesc > 0) newMRecords['M200'].push(m200_cnpj);

        // --- COFINS CALCULATION ---
        const cofinsCreditSources = cnpjRecords.filter(r => r.REG === 'C170' && r.CST_COFINS && parseInt(r.CST_COFINS, 10) >= 50 && parseInt(r.CST_COFINS, 10) <= 66);
        const cofinsDebitSources = cnpjRecords.filter(r => r.REG === 'C170' && r.CST_COFINS && parseInt(r.CST_COFINS, 10) >= 1 && parseInt(r.CST_COFINS, 10) <= 9);

        const cofinsCreditsAgg: { [key: string]: { natBcCred: string; cstCofins: string; vlBcCofins: number; quantBcCofins: number } } = {};
        cofinsCreditSources.forEach(r => {
            const nat = r.NAT_BC_CRED || '01';
            const key = `${nat}-${r.CST_COFINS}`;
            if (!cofinsCreditsAgg[key]) {
                cofinsCreditsAgg[key] = { natBcCred: nat, cstCofins: r.CST_COFINS!, vlBcCofins: 0, quantBcCofins: 0 };
            }
            cofinsCreditsAgg[key].vlBcCofins += parseNumber(r.VL_BC_COFINS);
            cofinsCreditsAgg[key].quantBcCofins += parseNumber(r.QUANT_BC_COFINS);
        });

        const m505s_cnpj: EfdRecord[] = Object.values(cofinsCreditsAgg).map(c => ({
            REG: 'M505', NAT_BC_CRED: c.natBcCred, CST_COFINS: c.cstCofins,
            VL_BC_COFINS_TOT: formatNumber(c.vlBcCofins), VL_BC_COFINS_CUM: '0,00', VL_BC_COFINS_NC: formatNumber(c.vlBcCofins),
            QUANT_BC_COFINS_TOT: formatNumber(c.quantBcCofins), QUANT_BC_COFINS: formatNumber(c.quantBcCofins), DESC_CRED: '', _cnpj: cnpj
        }));
        if (m505s_cnpj.length > 0) newMRecords['M505'].push(...m505s_cnpj);

        const totalVlBcCofins = m505s_cnpj.reduce((sum, r) => sum + parseNumber(r.VL_BC_COFINS_NC), 0);
        const vlCredApuradoCofins = totalVlBcCofins * 0.076;
        const m500_cnpj: EfdRecord = {
            REG: 'M500', COD_CRED: '101', IND_CRED_ORI: '1', VL_BC_COFINS: formatNumber(totalVlBcCofins),
            ALIQ_COFINS: '7,60', QUANT_BC_COFINS: '0,00', ALIQ_COFINS_QUANT: '0,00',
            VL_CRED_APU: formatNumber(vlCredApuradoCofins), VL_AJUS_ACRES: '0,00', VL_AJUS_REDUC: '0,00',
            VL_CRED_DIFER: '0,00', VL_CRED_COMP: formatNumber(vlCredApuradoCofins), VL_CRED_PER: formatNumber(vlCredApuradoCofins),
            VL_SALDO_CRED: '0,00', VL_CRED_EXT_REC: '0,00', COD_CTA: '', _cnpj: cnpj
        };
        if(totalVlBcCofins > 0) newMRecords['M500'].push(m500_cnpj);
        
        const cofinsDebitsAgg: { [key: string]: { vlRecBrt: number, vlBcCont: number, quantBc: number, aliq: number, aliqQuant: number } } = {};
        cofinsDebitSources.forEach(r => {
            const codCont = '01'; // Simplified
            if (!cofinsDebitsAgg[codCont]) {
                cofinsDebitsAgg[codCont] = { vlRecBrt: 0, vlBcCont: 0, quantBc: 0, aliq: parseNumber(r.ALIQ_COFINS), aliqQuant: parseNumber(r.ALIQ_COFINS_QUANT) };
            }
            cofinsDebitsAgg[codCont].vlRecBrt += parseNumber(r.VL_ITEM);
            cofinsDebitsAgg[codCont].vlBcCont += parseNumber(r.VL_BC_COFINS);
            cofinsDebitsAgg[codCont].quantBc += parseNumber(r.QUANT_BC_COFINS);
        });

        const m610s_cnpj: EfdRecord[] = Object.keys(cofinsDebitsAgg).map(codCont => {
            const d = cofinsDebitsAgg[codCont];
            const vlContApur = (d.vlBcCont * d.aliq / 100) + (d.quantBc * d.aliqQuant);
            return {
                REG: 'M610', COD_CONT: codCont, VL_REC_BRT: formatNumber(d.vlRecBrt), VL_BC_CONT: formatNumber(d.vlBcCont),
                VL_AJUS_ACRES_BC_COFINS: '0,00', VL_AJUS_REDUC_BC_COFINS: '0,00', QUANT_BC_COFINS: formatNumber(d.quantBc),
                ALIQ_COFINS_QUANT: formatNumber(d.aliqQuant), VL_CONT_APUR: formatNumber(vlContApur), VL_AJUS_ACRES: '0,00',
                VL_AJUS_REDUC: '0,00', VL_CONT_DIFER: '0,00', VL_CONT_DIFER_ANT: '0,00', VL_CONT_PER: formatNumber(vlContApur),
                _cnpj: cnpj
            };
        });
        if(m610s_cnpj.length > 0) newMRecords['M610'].push(...m610s_cnpj);
        
        const vlTotContNcPerCofins = m610s_cnpj.reduce((sum, r) => sum + parseNumber(r.VL_CONT_PER), 0);
        const vlTotCredDescCofins = parseNumber(m500_cnpj.VL_CRED_PER);
        const vlContNcRecCofins = Math.max(0, vlTotContNcPerCofins - vlTotCredDescCofins);
        const m600_cnpj: EfdRecord = {
            REG: 'M600', VL_TOT_CONT_NC_PER: formatNumber(vlTotContNcPerCofins), VL_TOT_CRED_DESC: formatNumber(vlTotCredDescCofins),
            VL_TOT_CRED_DESC_ANT: '0,00', VL_TOT_CONT_NC_DEV: '0,00', VL_RET_NC: '0,00', VL_OUT_DED_NC: '0,00',
            VL_CONT_NC_REC: formatNumber(vlContNcRecCofins), VL_TOT_CONT_CUM_PER: '0,00', VL_RET_CUM: '0,00',
            VL_OUT_DED_CUM: '0,00', VL_CONT_CUM_REC: '0,00', VL_TOT_CONT_REC: formatNumber(vlContNcRecCofins),
            _cnpj: cnpj
        };
        if(vlTotContNcPerCofins > 0 || vlTotCredDescCofins > 0) newMRecords['M600'].push(m600_cnpj);
        
        if (Object.values(newMRecords).some(arr => arr.length > 0)) {
            hasMovementM = true;
        }
    }
    
    if(hasMovementM){
        newMRecords['M001'].push({REG: 'M001', IND_MOV: '0'});
    } else {
        newMRecords['M001'].push({REG: 'M001', IND_MOV: '1'});
    }

    Object.assign(newRecords, newMRecords);
    
    return newRecords;
}
