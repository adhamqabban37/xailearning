import fetch from "node-fetch";
const MODELS = ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"];

// Test runner for all supported models
if (require.main === module) {
  (async () => {
    const prompt =
      "Generate a short 3-line summary about AI learning platforms.";
    for (const model of MODELS) {
      try {
        console.log(`\n--- Testing model: ${model} ---`);
        const result = await generateContent(prompt, model);
        console.log(result);
      } catch (err) {
        if (err instanceof Error) {
          console.error(`Error for model ${model}:`, err.message);
        } else {
          console.error(`Error for model ${model}:`, err);
        }
      }
    }
  })();
}

export async function generateContent(
  prompt: string,
  model: string = "gemini-2.5-pro"
) {
  if (!MODELS.includes(model)) {
    throw new Error(`Unsupported model: ${model}`);
  }
  const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GOOGLE_API_KEY}`;
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      temperature: 0.7,
      candidateCount: 1,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data;
}
