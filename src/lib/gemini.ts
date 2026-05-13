import { env } from './env'

const MODEL = 'gemini-1.5-flash'

export async function generateHouseDescription(input: {
  property_type: string
  bedrooms: number | null
  bathrooms: number | null
  county: string
  town: string
  area_label: string | null
  price: number
  price_type: string
  amenities: string[]
}): Promise<string> {
  if (!env.geminiKey) {
    return 'Add VITE_GEMINI_API_KEY to enable AI descriptions.'
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${env.geminiKey}`

  const prompt = `You are a professional Kenyan real estate copywriter.
Write an attractive 3-paragraph listing for a property with these facts (no exact street or gate details):
Type: ${input.property_type}
Bedrooms: ${input.bedrooms ?? 'n/a'}
Bathrooms: ${input.bathrooms ?? 'n/a'}
Broad area: ${input.town}, ${input.county}${input.area_label ? ` (${input.area_label})` : ''}
Price: KSh ${input.price.toLocaleString()} (${input.price_type})
Amenities: ${input.amenities.join(', ') || 'standard finishes'}

Tone: warm, professional, Kenya-specific context. No invented landmarks unless very well known for that town.`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini error: ${err}`)
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty Gemini response')
  return text.trim()
}
