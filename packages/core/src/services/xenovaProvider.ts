// On-device NLP analysis using @xenova/transformers.
// Models are downloaded once and cached — zero ongoing cost, fully offline after first run.
//
// Pipeline:
//   1. Zero-shot classification → primary + secondary mood
//   2. Zero-shot classification → themes
//   3. Sentiment pipeline → intensity (0–1)

import { pipeline, type ZeroShotClassificationPipeline, type TextClassificationPipeline } from '@xenova/transformers';
import type { AnalysisProvider } from './analysis';
import type { EntryAnalysis } from '../types';
import { MOODS, type Mood } from '../constants/moods';
import { PLANTS, type Theme } from '../constants/plants';

const MOOD_LABELS = MOODS.map((m) => m.mood);
const THEME_LABELS = PLANTS.map((p) => p.theme);

// Singletons — initialized once, reused across calls.
let _classifier: ZeroShotClassificationPipeline | null = null;
let _sentiment: TextClassificationPipeline | null = null;

async function getClassifier(): Promise<ZeroShotClassificationPipeline> {
  if (!_classifier) {
    _classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-small') as ZeroShotClassificationPipeline;
  }
  return _classifier;
}

async function getSentiment(): Promise<TextClassificationPipeline> {
  if (!_sentiment) {
    _sentiment = await pipeline('sentiment-analysis', 'Xenova/distilbert-base-uncased-finetuned-sst-2-english') as TextClassificationPipeline;
  }
  return _sentiment;
}

export const xenovaProvider: AnalysisProvider = {
  async analyze(text: string): Promise<EntryAnalysis> {
    const [classifier, sentimentPipeline] = await Promise.all([getClassifier(), getSentiment()]);

    // Run mood + theme classification in parallel
    const [moodResult, themeResult, sentimentResult] = await Promise.all([
      classifier(text, MOOD_LABELS, { multi_label: false }),
      classifier(text, THEME_LABELS, { multi_label: true }),
      sentimentPipeline(text),
    ]);

    // Top 2 moods
    const moodScores = (moodResult as { labels: string[]; scores: number[] });
    const moodPrimary = moodScores.labels[0] as Mood;
    const moodSecondary = moodScores.labels[1] as Mood ?? null;

    // Themes with score > 0.3 (up to 5)
    const themeScores = (themeResult as { labels: string[]; scores: number[] });
    const themes = themeScores.labels
      .map((label, i) => ({ label: label as Theme, score: themeScores.scores[i] }))
      .filter((t) => t.score > 0.3)
      .slice(0, 5)
      .map((t) => t.label);

    // Sentiment intensity: POSITIVE score = high intensity, NEGATIVE = lower
    const sentArr = Array.isArray(sentimentResult) ? sentimentResult : [sentimentResult];
    const sent = sentArr[0] as { label: string; score: number };
    const sentimentIntensity = sent.label === 'POSITIVE' ? sent.score : 1 - sent.score;

    return { moodPrimary, moodSecondary, themes, sentimentIntensity };
  },
};
