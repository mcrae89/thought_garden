// Stub — real implementation uses @xenova/transformers (on-device).
// Abstracted here so the provider can be swapped (OpenAI, Ollama) without
// changing call sites.

import type { EntryAnalysis } from '../types';

export interface AnalysisProvider {
  analyze(text: string): Promise<EntryAnalysis>;
}

let _provider: AnalysisProvider | null = null;

export function registerAnalysisProvider(provider: AnalysisProvider): void {
  _provider = provider;
}

export async function analyzeEntry(text: string): Promise<EntryAnalysis> {
  if (!_provider) throw new Error('No analysis provider registered');
  return _provider.analyze(text);
}
