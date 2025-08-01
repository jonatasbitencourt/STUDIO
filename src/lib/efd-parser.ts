import type { EfdRecord, ParsedEfdData, TaxSummaryItem, OperationSummaryItem } from './types';
import { recordHierarchy } from './efd-structure';

// This file contains only type definitions and structures that are safe to be used on both server and client.
// All heavy processing logic has been moved to efd-client-parser.ts.
