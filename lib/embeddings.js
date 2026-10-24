// Sentence embeddings computed locally (no API key): all-MiniLM-L6-v2, 384 dims.
// The model (~23 MB) is downloaded once and cached in ./.cache/models.
let extractorPromise = null;

async function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const { pipeline, env } = await import('@huggingface/transformers');
      env.cacheDir = './.cache/models';
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8' });
    })().catch((err) => {
      extractorPromise = null;
      throw err;
    });
  }
  return extractorPromise;
}

export function itemText(item) {
  return [item.title, item.brand, item.color, item.description].filter(Boolean).join('. ');
}

// Returns a plain number[] (normalised), or null if the model is unavailable.
export async function embed(text) {
  try {
    const extractor = await getExtractor();
    const output = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.warn('Embedding unavailable:', err.message);
    return null;
  }
}
