export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const API_KEY = process.env.ANTHROPIC_API_KEY
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' })

  const { fri, sun, month, year } = req.body

  const prompt = `Today is ${new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}. Search the web for real publicly-listed events happening this weekend — ${fri} through ${sun} — in or within about a 1-hour drive of Clearwater, Florida. Search Tampa, St. Petersburg, Sarasota, Lakeland, Brandon, and greater Tampa Bay.

Find events matching:
- Dirt bike shows, motocross, off-road motorsport
- Monster truck shows or rallies
- Blues music concerts or festivals
- Food festivals, craft beer festivals, wine festivals
- Family-friendly outdoor festivals, county fairs, large community events

Requirements:
- 3 boys all under age 7 — must be family-friendly
- Bigger well-attended PUBLIC events only
- Must fall on ${fri}, the Saturday, or ${sun}
- Search Eventbrite, Facebook events, and local Tampa Bay calendars

Reply ONLY with a raw JSON object, no markdown, no fences, no explanation:
{
  "summary": "1-2 sentence overview",
  "events": [
    {
      "name": "Event name",
      "tag": "one of: Monster Trucks | Dirt Bikes | Blues Music | Food Festival | Beer Festival | Wine Festival | Family Fun | Outdoor | Motorsports | Fair/Festival",
      "date": "e.g. Sat Apr 19",
      "time": "e.g. 2:00 PM – 10:00 PM",
      "location": "Venue, City FL",
      "distance": "e.g. ~25 min from Clearwater",
      "description": "2-3 sentences why it is great for a dad with 3 young boys",
      "kidFriendly": true,
      "price": "e.g. Free | $15/person",
      "url": "official event URL"
    }
  ]
}

Find 4–8 real verified events. Do not invent events.`

  const messages = [{ role:'user', content:prompt }]
  const tools = [{ type:'web_search_20250305', name:'web_search' }]

  try {
    for (let round = 0; round < 10; round++) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key': API_KEY,
          'anthropic-version':'2023-06-01',
        },
        body: JSON.stringify({ model:'claude-sonnet-4-6', max_tokens:2048, tools, messages }),
      })

      if (!response.ok) {
        const err = await response.text()
        return res.status(500).json({ error:`Anthropic error ${response.status}: ${err.slice(0,200)}` })
      }

      const data = await response.json()
      const content = data.content ?? []

      if (data.stop_reason === 'end_turn') {
        const raw = content.filter(b=>b.type==='text').map(b=>b.text).join('\n')
        let parsed = null
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (fenced) { try { parsed = JSON.parse(fenced[1].trim()) } catch {} }
        if (!parsed) {
          const s = raw.indexOf('{'), e = raw.lastIndexOf('}')
          if (s!==-1 && e>s) { try { parsed = JSON.parse(raw.slice(s,e+1)) } catch {} }
        }
        if (!parsed || !Array.isArray(parsed.events))
          return res.status(500).json({ error:'Could not parse events from response' })
        return res.status(200).json(parsed)
      }

      if (data.stop_reason === 'tool_use') {
        messages.push({ role:'assistant', content })
        const toolResults = content
          .filter(b=>b.type==='tool_use')
          .map(b=>({
            type:'tool_result',
            tool_use_id:b.id,
            content: Array.isArray(b.content)?b.content:[{type:'text',text:b.content?String(b.content):'done'}],
          }))
        if (!toolResults.length) break
        messages.push({ role:'user', content:toolResults })
        continue
      }

      const fallback = content.filter(b=>b.type==='text').map(b=>b.text).join('')
      if (fallback) {
        const s = fallback.indexOf('{'), e = fallback.lastIndexOf('}')
        if (s!==-1 && e>s) {
          try {
            const p = JSON.parse(fallback.slice(s,e+1))
            if (Array.isArray(p.events)) return res.status(200).json(p)
          } catch {}
        }
      }
      return res.status(500).json({ error:`Unexpected stop_reason: ${data.stop_reason}` })
    }
    return res.status(500).json({ error:'Search timed out' })
  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}
