/**
 * @fileoverview Defines the hierarchical structure of EFD Contribuições records.
 * This is used to build the nested navigation in the UI.
 * The key is the parent record, and the value is an array of its child records.
 */
export const recordHierarchy: Record<string, string[]> = {
  'A100': ['A170'],
  'C100': ['C170'],
  'C180': ['C181', 'C185'],
  'C190': ['C191', 'C195'],
  'C380': ['C381', 'C385'],
  'C400': ['C405'],
  'C405': ['C481', 'C485'],
  'C500': ['C501', 'C505'],
  'D100': ['D101'],
  'D200': ['D201', 'D205'],
  'D500': ['D501', 'D505'],
  'F120': ['F130'],
  'M200': ['M210'],
  'M600': ['M610'],
};
