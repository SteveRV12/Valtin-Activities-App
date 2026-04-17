import { useState, useEffect } from 'react'

function getWeekend() {
  const now = new Date()
  const day = now.getDay()
  const fri = new Date(now)
  if (day === 0) fri.setDate(now.getDate() - 2)
  else if (day === 6) fri.setDate(now.getDate() - 1)
  else fri.setDate(now.getDate() + (5 - day))
  const sat = new Date(fri); sat.setDate(fri.getDate() + 1)
  const sun = new Date(fri); sun.setDate(fri.getDate() + 2)
  const full = d => d.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  const short = d => d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
  return {
    fri: full(fri), sat: full(sat), sun: full(sun),
    label: `${short(fri)} – ${short(sun)}`,
    month: fri.toLocaleDateString('en-US', { month:'long' }),
    year: fri.getFullYear(),
  }
}

const TAG_META = {
  'Monster Trucks': { color:'#FF4D4D', bg:'rgba(255,77,77,0.1)',    icon:'🚛' },
  'Dirt Bikes':     { color:'#FF6B35', bg:'rgba(255,107,53,0.1)',   icon:'🏍️' },
  'Blues Music':    { color:'#4D9FFF', bg:'rgba(77,159,255,0.1)',   icon:'🎸' },
  'Food Festival':  { color:'#4DCC88', bg:'rgba(77,204,136,0.1)',   icon:'🌮' },
  'Beer Festival':  { color:'#FFB84D', bg:'rgba(255,184,77,0.1)',   icon:'🍺' },
  'Wine Festival':  { color:'#CC66FF', bg:'rgba(204,102,255,0.1)',  icon:'🍷' },
  'Family Fun':     { color:'#4DD9CC', bg:'rgba(77,217,204,0.1)',   icon:'👨‍👩‍👦' },
  'Outdoor':        { color:'#66CC44', bg:'rgba(102,204,68,0.1)',   icon:'🌳' },
  'Motorsports':    { color:'#FF4D4D', bg:'rgba(255,77,77,0.1)',    icon:'🏁' },
  'Fair/Festival':  { color:'#FF9944', bg:'rgba(255,153,68,0.1)',   icon:'🎡' },
}
const DM = { color:'#A78BFA', bg:'rgba(167,139,250,0.1)', icon:'🎪' }

function Loader() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'56px 0', gap:20 }}>
      <div style={{ position:'relative', width:56, height:56 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid rgba(167,139,250,0.15)' }}/>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid transparent',
          borderTopColor:'#A78BFA', animation:'spin 0.9s linear infinite' }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'#E2E8F0', fontSize:'0.92rem', margin:'0 0 4px', fontWeight:500 }}>Searching the web…</p>
        <p style={{ color:'#64748B', fontSize:'0.78rem', margin:0 }}>Finding events near Clearwater · ~20 sec</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function Tag({ label }) {
  const m = TAG_META[label] ?? DM
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5,
      background:m.bg, color:m.color, border:`1px solid ${m.color}33`,
      fontSize:'0.65rem', fontWeight:700, letterSpacing:'0.07em',
      textTransform:'uppercase', padding:'4px 10px', borderRadius:999,
      whiteSpace:'nowrap', flexShrink:0 }}>
      {m.icon} {label}
    </span>
  )
}

function EventCard({ ev, i }) {
  const m = TAG_META[ev.tag] ?? DM
  return (
    <div style={{ background:'#131929', border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:20, padding:'22px 24px 20px', marginBottom:12,
      position:'relative', overflow:'hidden',
      animation:`rise 0.5s cubic-bezier(0.22,1,0.36,1) ${i*0.06}s both` }}>
      <style>{`@keyframes rise{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3,
        background:`linear-gradient(180deg,${m.color},${m.color}44)`,
        borderRadius:'20px 0 0 20px' }}/>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, marginBottom:10 }}>
        <h3 style={{ margin:0, fontSize:'1rem', fontWeight:700, color:'#F1F5F9', lineHeight:1.35, letterSpacing:'-0.01em' }}>
          {ev.name}
        </h3>
        {ev.tag && <Tag label={ev.tag}/>}
      </div>

      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:12 }}>
        {ev.date && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5,
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:8, padding:'4px 10px', fontSize:'0.78rem', color:'#CBD5E1' }}>
            📅 {ev.date}{ev.time ? ` · ${ev.time}` : ''}
          </span>
        )}
        {ev.location && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5,
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:8, padding:'4px 10px', fontSize:'0.78rem', color:'#CBD5E1' }}>
            📍 {ev.location}
          </span>
        )}
        {ev.distance && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:5,
            background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:8, padding:'4px 10px', fontSize:'0.78rem', color:'#CBD5E1' }}>
            🚗 {ev.distance}
          </span>
        )}
      </div>

      <p style={{ margin:'0 0 14px', color:'#94A3B8', fontSize:'0.87rem', lineHeight:1.7 }}>{ev.description}</p>

      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        {ev.price && (
          <span style={{ fontSize:'0.8rem', color:'#4DCC88', fontWeight:600,
            background:'rgba(77,204,136,0.1)', border:'1px solid rgba(77,204,136,0.2)',
            borderRadius:8, padding:'3px 10px' }}>💰 {ev.price}</span>
        )}
        {ev.kidFriendly !== undefined && (
          <span style={{ fontSize:'0.78rem',
            color: ev.kidFriendly ? '#4DCC88' : '#FF6B6B',
            background: ev.kidFriendly ? 'rgba(77,204,136,0.08)' : 'rgba(255,107,107,0.08)',
            border: `1px solid ${ev.kidFriendly ? 'rgba(77,204,136,0.2)' : 'rgba(255,107,107,0.2)'}`,
            borderRadius:8, padding:'3px 10px' }}>
            {ev.kidFriendly ? '✅ Kid-friendly' : '⚠️ Check age limits'}
          </span>
        )}
        {ev.url && (
          <a href={ev.url} target='_blank' rel='noopener noreferrer' style={{
            marginLeft:'auto', color:'#A78BFA', fontSize:'0.8rem', fontWeight:600,
            textDecoration:'none', background:'rgba(167,139,250,0.1)',
            border:'1px solid rgba(167,139,250,0.2)', padding:'5px 14px', borderRadius:10 }}>
            Tickets / Info ↗
          </a>
        )}
      </div>
    </div>
  )
}

const INTERESTS = [
  { icon:'🏍️', label:'Dirt Bikes' },
  { icon:'🚛', label:'Monster Trucks' },
  { icon:'🎸', label:'Blues' },
  { icon:'🍺', label:'Food & Beer' },
  { icon:'🌳', label:'Outdoor' },
  { icon:'👦', label:'Kid-Friendly' },
]

export default function App() {
  const wknd = getWeekend()
  const [events,  setEvents]  = useState([])
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [stamp,   setStamp]   = useState('')

  useEffect(() => {
    try {
      const cached = localStorage.getItem('vfs-cache')
      if (cached) {
        const { data, savedAt, weekend } = JSON.parse(cached)
        if (weekend === wknd.label && data?.events?.length) {
          setEvents(data.events)
          setSummary(data.summary ?? '')
          setStamp(`${new Date(savedAt).toLocaleTimeString()} (cached)`)
        }
      }
    } catch {}
  }, [])

  const go = async () => {
    setLoading(true); setError(''); setEvents([]); setSummary(''); setStamp('')
    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fri:wknd.fri, sun:wknd.sun, month:wknd.month, year:wknd.year }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Server error')
      if (!Array.isArray(data.events)) throw new Error('Unexpected response')
      setEvents(data.events)
      setSummary(data.summary ?? '')
      const ts = new Date().toLocaleTimeString()
      setStamp(ts)
      try {
        localStorage.setItem('vfs-cache', JSON.stringify({ data, savedAt:Date.now(), weekend:wknd.label }))
      } catch {}
    } catch(e) {
      setError(e.message ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100dvh', background:'#0A0F1E', color:'#F1F5F9',
      fontFamily:"-apple-system,'Inter',sans-serif", paddingBottom:64 }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <div style={{ position:'relative', overflow:'hidden', paddingBottom:32 }}>
        <div style={{ position:'absolute', top:-120, left:-80, width:400, height:400, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(167,139,250,0.12),transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:-60, right:-100, width:350, height:350, borderRadius:'50%',
          background:'radial-gradient(circle,rgba(99,179,237,0.08),transparent 70%)', pointerEvents:'none' }}/>

        <div style={{ padding:'18px 24px 0', display:'flex', justifyContent:'flex-end' }}>
          <div style={{ background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
            borderRadius:20, padding:'5px 14px', fontSize:'0.74rem', color:'#64748B' }}>
            📍 Clearwater, FL
          </div>
        </div>

        <div style={{ textAlign:'center', padding:'28px 24px 0' }}>
          <div style={{ fontSize:'2.8rem', marginBottom:10,
            filter:'drop-shadow(0 0 20px rgba(167,139,250,0.4))' }}>🎪</div>

          <h1 style={{ margin:'0 0 8px', fontSize:'clamp(1.6rem,5.5vw,2.4rem)', fontWeight:800,
            letterSpacing:'-0.03em', lineHeight:1.1,
            background:'linear-gradient(135deg,#F1F5F9,#A78BFA 50%,#63B3ED)',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
            Valtin Family Fun Search
          </h1>

          <p style={{ color:'#475569', fontSize:'0.78rem', margin:'0 0 20px',
            letterSpacing:'0.06em', textTransform:'uppercase' }}>
            Clearwater FL · Family · Blues · Motorsports
          </p>

          <div style={{ display:'inline-flex', alignItems:'center', gap:8,
            background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.25)',
            borderRadius:999, padding:'8px 20px' }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:'#A78BFA',
              boxShadow:'0 0 8px #A78BFA', display:'inline-block',
              animation:'pulse 2s ease-in-out infinite' }}/>
            <span style={{ color:'#C4B5FD', fontSize:'0.84rem', fontWeight:600 }}>📅 {wknd.label}</span>
          </div>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>
      </div>

      {/* BODY */}
      <div style={{ maxWidth:640, margin:'0 auto', padding:'0 16px' }}>

        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24, justifyContent:'center' }}>
          {INTERESTS.map(({ icon, label }) => (
            <span key={label} style={{ display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:999, padding:'6px 14px', fontSize:'0.78rem', color:'#94A3B8', fontWeight:500 }}>
              {icon} {label}
            </span>
          ))}
        </div>

        <button onClick={go} disabled={loading} style={{
          width:'100%', padding:'17px 28px', marginBottom:24, borderRadius:16, border:'none',
          background: loading
            ? 'rgba(167,139,250,0.15)'
            : 'linear-gradient(135deg,#7C3AED,#A78BFA 50%,#63B3ED)',
          color: loading ? 'rgba(255,255,255,0.3)' : '#fff',
          fontSize:'1rem', fontWeight:700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 8px 32px rgba(124,58,237,0.35)',
          transition:'all 0.2s',
        }}>
          {loading ? '🔍  Searching the web for events…' : "🔍  Find This Weekend's Events"}
        </button>

        {!loading && !events.length && !error && (
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)',
            borderRadius:20, padding:'32px 24px', textAlign:'center' }}>
            <div style={{ fontSize:'2rem', marginBottom:12 }}>🗓️</div>
            <p style={{ color:'#E2E8F0', fontWeight:600, fontSize:'1rem', margin:'0 0 8px' }}>Ready when you are</p>
            <p style={{ color:'#475569', fontSize:'0.85rem', lineHeight:1.7, margin:0 }}>
              Tap the button to get a live-searched list of events this weekend near Clearwater — tailored to your family.
            </p>
          </div>
        )}

        {loading && <Loader/>}

        {error && (
          <div style={{ background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.2)',
            borderRadius:16, padding:'16px 20px', color:'#FCA5A5', fontSize:'0.85rem', lineHeight:1.65 }}>
            <strong style={{ display:'block', marginBottom:5, color:'#FF6B6B' }}>⚠️ Error</strong>{error}
          </div>
        )}

        {summary && (
          <div style={{ background:'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(99,179,237,0.08))',
            border:'1px solid rgba(167,139,250,0.2)', borderRadius:16, padding:'16px 20px', marginBottom:20,
            color:'#C4B5FD', fontSize:'0.92rem', lineHeight:1.65, fontWeight:500 }}>
            ✨ {summary}
          </div>
        )}

        {events.map((ev, i) => <EventCard key={i} ev={ev} i={i}/>)}

        {stamp && events.length > 0 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center',
            gap:12, marginTop:20, flexWrap:'wrap' }}>
            <span style={{ color:'#1E293B', fontSize:'0.72rem' }}>Updated {stamp}</span>
            <button onClick={go} disabled={loading} style={{ background:'rgba(255,255,255,0.04)',
              border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, color:'#94A3B8',
              padding:'8px 18px', cursor:'pointer', fontSize:'0.8rem', fontWeight:500 }}>
              🔄 Refresh
            </button>
          </div>
        )}

        <div style={{ marginTop:28, background:'rgba(255,255,255,0.02)',
          border:'1px solid rgba(255,255,255,0.05)', borderRadius:14,
          padding:'14px 18px', color:'#334155', fontSize:'0.78rem', lineHeight:1.7, textAlign:'center' }}>
          📱 <strong style={{ color:'#475569' }}>Add to Home Screen</strong> — share icon → "Add to Home Screen"
        </div>
      </div>
    </div>
  )
}
