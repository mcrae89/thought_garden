// On-device NLP via @xenova/transformers.
// NOTE: Not available in the Metro/React Native bundle due to import.meta usage.
// This provider is intended for a future native module or Node.js environment.
// In the mobile app, analyzeEntry() catches the error and falls back to manual mood selection.

import type { AnalysisProvider } from './analysis';
import type { EntryAnalysis } from '../types';
import type { Mood } from '../constants/moods';
import type { Theme } from '../constants/plants';

export const xenovaProvider: AnalysisProvider = {
  async analyze(_text: string): Promise<EntryAnalysis> {
    // Dynamically import to avoid bundler issues — will throw in RN, caught by caller
    const { pipeline } = await import('@xenova/transformers' as string as never as '@xenova/transformers');

    const MOOD_LABELS: Mood[] = [
      'joy','love','gratitude','peace','calm','acceptance',
      'grief','loneliness','sadness','anxiety','overwhelm',
      'resilience','courage','creativity','wonder',
    ];
    const THEME_LABELS: Theme[] = [
      'gratitude','joy','love','hope','peace','reflection','growth','resilience',
      'anxiety','grief','anger','loneliness','confusion','nostalgia','creativity',
      'exhaustion','curiosity','courage','acceptance','self_compassion',
      'excitement','sadness','overwhelm','contentment','healing',
    ];

    const [classifier, sentimentPipeline] = await Promise.all([
      pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-small'),
      pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english'),
    ]);

    const [moodResult, themeResult, sentimentResult] = await Promise.all([
      (classifier as CallableFunction)(_text, MOOD_LABELS, { multi_label: false }),
      (classifier as CallableFunction)(_text, THEME_LABELS, { multi_label: true }),
      (sentimentPipeline as CallableFunction)(_text),
    ]);

    const moodScores = moodResult as { labels: string[]; scores: number[] };
    const moodPrimary = moodScores.labels[0] as Mood;
    const moodSecondary = (moodScores.labels[1] as Mood) ?? null;

    const themeScores = themeResult as { labels: string[]; scores: number[] };
    const themes = themeScores.labels
      .map((label, i) => ({ label: label as Theme, score: themeScores.scores[i] }))
      .filter((t) => t.score > 0.3)
      .slice(0, 5)
      .map((t) => t.label);

    const sentArr = Array.isArray(sentimentResult) ? sentimentResult : [sentimentResult];
    const sent = sentArr[0] as { label: string; score: number };
    const sentimentIntensity = sent.label === 'POSITIVE' ? sent.score : 1 - sent.score;

    return { moodPrimary, moodSecondary, themes, sentimentIntensity };
  },
};
