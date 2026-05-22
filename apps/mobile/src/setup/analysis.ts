// Register the on-device NLP provider at app startup.
// Models are lazy-loaded on first analyzeEntry() call.
import { registerAnalysisProvider, xenovaProvider } from '@tg/core';

registerAnalysisProvider(xenovaProvider);
