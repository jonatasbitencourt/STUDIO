/**
 * @fileoverview Defines the hierarchical structure of EFD Contribuições records.
 * This is used to build the nested navigation in the UI.
 * The key is the parent record, and the value is an array of its child records.
 */
export const recordHierarchy: Record<string, string[]> = {
  '0200': ['0205', '0206'],
  'A100': ['A170'],
  'C100': ['C110', 'C111', 'C120', 'C170', 'C175'],
  'C180': ['C181', 'C185'],
  'C190': ['C191', 'C195', 'C198', 'C199'],
  'C380': ['C381', 'C385'],
  'C395': ['C396'],
  'C400': ['C405'],
  'C405': ['C481', 'C485'],
  'C490': ['C491', 'C495'],
  'C500': ['C501', 'C505'],
  'C600': ['C601', 'C605'],
  'C860': ['C870', 'C880'],
  'D100': ['D101', 'D105'],
  'D200': ['D201', 'D205'],
  'D300': ['D301'],
  'D500': ['D501', 'D505'],
  'D600': ['D601', 'D605'],
  'F120': ['F130'],
  'F200': ['F205', 'F210'],
  'I100': ['I200', 'I300'],
  'M100': ['M105', 'M110', 'M115'],
  'M200': ['M205', 'M210'],
  'M400': ['M410'],
  'M500': ['M505', 'M510', 'M515'],
  'M600': ['M605', 'M610'],
  'M800': ['M810'],
  'P200': ['P210'],
};
