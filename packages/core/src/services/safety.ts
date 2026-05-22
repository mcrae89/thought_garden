// Crisis language detection — runs before any seed/streak logic.
// If triggered, suppress rewards and surface crisis resources.

const CRISIS_PATTERNS = [
  /\b(suicid|kill myself|end my life|want to die|self.?harm|cut myself|hurt myself)\b/i,
];

export function detectCrisisLanguage(text: string): boolean {
  return CRISIS_PATTERNS.some((re) => re.test(text));
}
