export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const API_KEY = process.env.ANTHROPIC_API_KEY
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' })

  const { fri, sun, month, year, interests } = req.body

  const interestList = Array.isArray(interests) && interests.length > 0
    ? interests
    : ['Dirt Bikes', 'Monster Trucks', 'Blues Music', 'Food Festivals', 'Beer Festivals', 'Family Fun', 'Outdoor']

  const interestBullets = interestList.map(i => `- ${i}`).join('\n')

  const prompt = `Today is ${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}. Search the web for real, publicly-listed events happening the weekend of ${fri} through ${sun} in or within about a 1-hour drive of Clearwater, Florida. Search Tampa, St. Petersburg, Sarasota, Lakeland, Brandon, and the greater Tampa Bay area. Also check Eventbrite, Facebook events, and local Tampa Bay event calendars.

The user is specifically interested in these types of events:
${interestBullets}

Requirements:
- Family must be able to bring 3 boys all under age 7 — events must be genuinely family-friendly
- Bigger, well-attended PUBLIC events only — not tiny local open-mics or small markets
- Events must fall on ${fri}, the Saturday, or ${sun}

Reply ONLY with a raw JSON object — no markdown fences, no explanation, no text before or after. Use exactly this structure:
{
  "summary": "1-2 sentence overview of this weekend highlights",
  "events": [
    {
      "name": "Full event name",
      "tag": "one of: Monster Trucks | Dirt Bikes | Blues Music | Food Festival | Beer Festival | Wine Festival | Family Fun | Outdoor | Motorsports | Fair/Festival",
      "date": "e.g. Sat Apr 19",
      "time": "e.g. 2:00 PM - 10:00 PM",
      "location": "Venue name, City FL",
      "distance": "approx drive from Clearwater e.g. ~25 min",
      "description": "2-3 sentences on what it is and why it is great for a family with young boys",
      "kidFriendly": true,
      "price": "e.g. Free | $15/person | ~$40 family",
      "url": "official event or ticket URL"
    }
  ]
}

Find 4-8 real verified events. Do not invent events.`

  const messages = [{ role: 'user', content: prompt }]
  const tools = [{ type: 'web_search_20250305', name: 'web_search' }]

  try {
    for (let round = 0; round < 10; round++) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 8192, tools, messages }),
      })

      if (!response.ok) {
        const err = await response.text()
        return res.status(500).json({ error: `Anthropic error ${response.status}: ${err.slice(0, 200)}` })
      }

      const data = await response.json()
      const content = data.content ?? []

      if (data.stop_reason === 'end_turn') {
        const raw = content.filter(b => b.type === 'text').map(b => b.text).join('\n')
        let parsed = null
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (fenced) { try { parsed = JSON.parse(fenced[1].trim()) } catch {} }
        if (!parsed) {
          const s = raw.indexOf('{')
          const e = raw.lastIndexOf('}')
          if (s !== -1 && e > s) { try { parsed = JSON.parse(raw.slice(s, e + 1)) } catch {} }
        }
        if (!parsed || !Array.isArray(parsed.events))
          return res.status(500).json({ error: 'Could not parse events from response' })
        return res.status(200).json(parsed)
      }

      if (data.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content })
        const toolResults = content
          .filter(b => b.type === 'tool_use')
          .map(b => ({
            type: 'tool_result',
            tool_use_id: b.id,
            content: Array.isArray(b.content)
              ? b.content
              : [{ type: 'text', text: b.content ? String(b.content) : 'done' }],
          }))
        if (!toolResults.length) break
        messages.push({ role: 'user', content: toolResults })
        continue
      }

      const fallback = content.filter(b => b.type === 'text').map(b => b.text).join('')
      if (fallback) {
        const s = fallback.indexOf('{')
        const e = fallback.lastIndexOf('}')
        if (s !== -1 && e > s) {
          try {
            const p = JSON.parse(fallback.slice(s, e + 1))
            if (Array.isArray(p.events)) return res.status(200).json(p)
          } catch {}
        }
      }
      return res.status(500).json({ error: `Unexpected stop_reason: ${data.stop_reason}` })
    }
    return res.status(500).json({ error: 'Search timed out' })
  } catch (e) {
    return res.status(500).json({ error: e.message })
  }
}