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

const TAG_COLORS = {
  'Monster Trucks':'#e74c3c','Dirt Bikes':'#c0392b','Blues Music':'#2980b9',
  'Food Festival':'#27ae60','Beer Festival':'#f39c12','Wine Festival':'#8e44ad',
  'Family Fun':'#16a085','Outdoor':'#2ecc71','Motorsports':'#e74c3c','Fair/Festival':'#e67e22',
}
const TAG_ICONS = {
  'Monster Trucks':'🚛','Dirt Bikes':'🏍️','Blues Music':'🎸','Food Festival':'🌮',
  'Beer Festival':'🍺','Wine Festival':'🍷','Family Fun':'👨‍👩‍👦','Outdoor':'🌳',
  'Motorsports':'🏁','Fair/Festival':'🎡',
}

function Dots() {
  return (
    <div style={{textAlign:'center',padding:'52px 0'}}>
      <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:18}}>
        {[0,1,2].map(i=>(
          <div key={i} style={{width:13,height:13,borderRadius:'50%',background:'#F4A533',
            animation:`bop 1.3s ease-in-out ${i*0.22}s infinite`}}/>
        ))}
      </div>
      <p style={{color:'#888',fontSize:'0.85rem',margin:0}}>Searching the web for events…</p>
      <p style={{color:'#555',fontSize:'0.75rem',margin:'6px 0 0'}}>This takes about 15–20 seconds</p>
      <style>{`@keyframes bop{0%,80%,100%{transform:translateY(0) scale(1)}40%{transform:translateY(-14px) scale(1.1)}}`}</style>
    </div>
  )
}

function EventCard({ev,i}) {
  const color = TAG_COLORS[ev.tag]??'#F4A533'
  const icon = TAG_ICONS[ev.tag]??'🎪'
  return (
    <div style={{background:'rgba(255,255,255,0.035)',border:`1px solid ${color}33`,borderRadius:18,
      padding:'20px 20px 18px',marginBottom:14,position:'relative',overflow:'hidden',
      animation:`rise 0.4s ease ${i*0.07}s both`}}>
      <style>{`@keyframes rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{position:'absolute',left:0,top:0,bottom:0,width:4,background:color,borderRadius:'18px 0 0 18px'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:10,marginBottom:8}}>
        <h3 style={{margin:0,fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.08rem',color:'#fff',lineHeight:1.3,flex:1}}>{ev.name}</h3>
        {ev.tag&&<span style={{background:color,color:'#fff',fontSize:'0.65rem',fontWeight:700,letterSpacing:'0.08em',
          textTransform:'uppercase',padding:'4px 10px',borderRadius:20,whiteSpace:'nowrap',flexShrink:0}}>{icon} {ev.tag}</span>}
      </div>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',marginBottom:10}}>
        {ev.date&&<span style={{color:'#F4A533',fontSize:'0.8rem'}}>📅 {ev.date}{ev.time?` · ${ev.time}`:''}</span>}
        {ev.location&&<span style={{color:'#aaa',fontSize:'0.8rem'}}>📍 {ev.location}</span>}
        {ev.distance&&<span style={{color:'#aaa',fontSize:'0.8rem'}}>🚗 {ev.distance}</span>}
      </div>
      <p style={{margin:'0 0 12px',color:'#ccc',fontSize:'0.88rem',lineHeight:1.65}}>{ev.description}</p>
      <div style={{display:'flex',gap:14,flexWrap:'wrap',alignItems:'center'}}>
        {ev.price&&<span style={{fontSize:'0.8rem',color:'#2ecc71',fontWeight:700}}>💰 {ev.price}</span>}
        {ev.kidFriendly!==undefined&&<span style={{fontSize:'0.79rem',color:ev.kidFriendly?'#2ecc71':'#e74c3c'}}>
          {ev.kidFriendly?'✅ Kid-friendly':'⚠️ Check age limits'}</span>}
        {ev.url&&<a href={ev.url} target='_blank' rel='noopener noreferrer' style={{marginLeft:'auto',
          color:'#F4A533',fontSize:'0.8rem',textDecoration:'none',background:'rgba(244,165,51,0.12)',
          border:'1px solid rgba(244,165,51,0.3)',padding:'5px 12px',borderRadius:8}}>Tickets / Info →</a>}
      </div>
    </div>
  )
}

export default function App() {
  const wknd = getWeekend()
  const [events,setEvents] = useState([])
  const [summary,setSummary] = useState('')
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState('')
  const [stamp,setStamp] = useState('')

  useEffect(()=>{
    try {
      const cached = localStorage.getItem('weekend-scout-cache')
      if (cached) {
        const {data,savedAt,weekend} = JSON.parse(cached)
        if (weekend===wknd.label && data?.events?.length) {
          setEvents(data.events); setSummary(data.summary??'')
          setStamp(`${new Date(savedAt).toLocaleTimeString()} (cached)`)
        }
      }
    } catch {}
  },[])

  const go = async () => {
    setLoading(true); setError(''); setEvents([]); setSummary(''); setStamp('')
    try {
      const res = await fetch('/api/events', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({fri:wknd.fri,sun:wknd.sun,month:wknd.month,year:wknd.year}),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error??`Server error ${res.status}`)
      if (!Array.isArray(data.events)) throw new Error('Unexpected response from server')
      setEvents(data.events); setSummary(data.summary??'')
      const ts = new Date().toLocaleTimeString(); setStamp(ts)
      try { localStorage.setItem('weekend-scout-cache',JSON.stringify({data,savedAt:Date.now(),weekend:wknd.label})) } catch {}
    } catch(e) {
      setError(e.message??'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{minHeight:'100dvh',background:'#0f1117',fontFamily:"'Lato','Helvetica Neue',sans-serif",color:'#fff',paddingBottom:64}}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Lato:wght@300;400;700&display=swap" rel="stylesheet"/>
      <div style={{background:'linear-gradient(160deg,#1e1000,#2d1800,#1a1100)',borderBottom:'1px solid rgba(244,165,51,0.25)',
        padding:'max(env(safe-area-inset-top),28px) 22px 28px',textAlign:'center',position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-60,right:-60,width:200,height:200,borderRadius:'50%',border:'1px solid rgba(244,165,51,0.07)'}}/>
        <div style={{fontSize:'2.2rem',marginBottom:4}}>🎪</div>
        <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(1.8rem,6vw,2.6rem)',fontWeight:900,
          margin:'0 0 4px',color:'#F4A533',letterSpacing:'-0.02em',lineHeight:1.1}}>Weekend Scout</h1>
        <p style={{color:'#666',fontSize:'0.75rem',margin:'0 0 14px',letterSpacing:'0.07em',textTransform:'uppercase'}}>
          Clearwater FL · Family · Blues · Motorsports</p>
        <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'rgba(244,165,51,0.12)',
          border:'1px solid rgba(244,165,51,0.28)',borderRadius:20,padding:'7px 18px',color:'#F4A533',fontSize:'0.83rem',fontWeight:700}}>
          📅 {wknd.label}</div>
      </div>
      <div style={{maxWidth:640,margin:'0 auto',padding:'24px 16px 0'}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:22}}>
          {['🏍️ Dirt Bikes','🚛 Monster Trucks','🎸 Blues','🍺 Beer & Food','🌳 Outdoor','👦 Kid-Friendly'].map(b=>(
            <span key={b} style={{background:'rgba(244,165,51,0.07)',border:'1px solid rgba(244,165,51,0.18)',
              borderRadius:20,padding:'5px 12px',fontSize:'0.74rem',color:'#F4A533'}}>{b}</span>
          ))}
        </div>
        <button onClick={go} disabled={loading} style={{width:'100%',padding:'18px 28px',
          background:loading?'rgba(244,165,51,0.15)':'linear-gradient(135deg,#F4A533,#e8921a)',
          border:'none',borderRadius:16,color:loading?'rgba(255,255,255,0.3)':'#1c0f00',
          fontFamily:"'Playfair Display',Georgia,serif",fontSize:'1.12rem',fontWeight:900,
          cursor:loading?'not-allowed':'pointer',marginBottom:24,
          boxShadow:loading?'none':'0 6px 28px rgba(244,165,51,0.28)',transition:'all 0.2s'}}>
          {loading?'🔍  Searching the web…':'🔍  Find This Weekend\'s Events'}
        </button>
        {!loading&&!events.length&&!error&&(
          <div style={{background:'rgba(244,165,51,0.04)',border:'1px dashed rgba(244,165,51,0.15)',
            borderRadius:14,padding:'24px 22px',textAlign:'center',color:'#666',fontSize:'0.87rem',lineHeight:1.85}}>
            <div style={{fontSize:'1.6rem',marginBottom:10}}>🗓️</div>
            <strong style={{color:'#F4A533',display:'block',marginBottom:6,fontSize:'1rem'}}>Ready when you are</strong>
            Hit the button any time to get a live-searched list of events this weekend near Clearwater.
          </div>
        )}
        {loading&&<Dots/>}
        {error&&(
          <div style={{background:'rgba(231,76,60,0.07)',border:'1px solid rgba(231,76,60,0.25)',
            borderRadius:12,padding:'16px 20px',color:'#e99',fontSize:'0.85rem',lineHeight:1.65}}>
            <strong style={{display:'block',marginBottom:5,color:'#e74c3c'}}>⚠️ Error</strong>{error}
          </div>
        )}
        {summary&&(
          <div style={{background:'linear-gradient(135deg,rgba(244,165,51,0.13),rgba(244,165,51,0.04))',
            border:'1px solid rgba(244,165,51,0.25)',borderRadius:14,padding:'14px 18px',marginBottom:18,
            color:'#F4A533',fontFamily:"'Playfair Display',Georgia,serif",fontSize:'0.97rem',lineHeight:1.6}}>
            🎯 {summary}</div>
        )}
        {events.map((ev,i)=><EventCard key={i} ev={ev} i={i}/>)}
        {stamp&&events.length>0&&(
          <div style={{textAlign:'center',marginTop:20,display:'flex',justifyContent:'center',gap:14,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{color:'rgba(255,255,255,0.2)',fontSize:'0.72rem'}}>Updated {stamp}</span>
            <button onClick={go} disabled={loading} style={{background:'transparent',border:'1px solid rgba(244,165,51,0.25)',
              borderRadius:8,color:'#F4A533',padding:'8px 18px',cursor:'pointer',fontSize:'0.8rem'}}>🔄 Refresh</button>
          </div>
        )}
        <div style={{marginTop:28,background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',
          borderRadius:12,padding:'14px 18px',color:'#555',fontSize:'0.78rem',lineHeight:1.7,textAlign:'center'}}>
          📱 <strong style={{color:'#777'}}>Add to Home Screen</strong> — tap the share icon in your browser and select "Add to Home Screen"
        </div>
      </div>
    </div>
  )
}
