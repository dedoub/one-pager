import { GoogleGenerativeAI } from '@google/generative-ai'

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not set')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.1,
    },
  })

  const result = await model.generateContent(prompt)
  return result.response.text()
}
