import { useState, useMemo } from 'react'
import spreads from '../data/spreads.json'
import allCards from '../data/cards.json'

const COURT_KEYWORDS = ['侍从', '骑士', '皇后', '国王']
const isCourtCard = (card) => COURT_KEYWORDS.some(kw => card.name_zh.includes(kw))
const SUIT_NAMES = { wands: '权杖', cups: '圣杯', swords: '宝剑', pentacles: '星币' }

const getPositions = (spread, mode) => {
  if (spread.id === 'four-elements') return mode === 'phase1' ? spread.positions_phase1 : spread.positions_phase2
  return spread.positions
}

export default function SelectCards({ reading, question, setQuestion, onSelect, onFinish, onBack }) {
  const [questionInput, setQuestionInput] = useState(question || '')
  const [questionPhase, setQuestionPhase] = useState(!question)
  const [activePos, setActivePos] = useState(null)
  const [reversed, setReversed] = useState(false)
  const [suitFilter, setSuitFilter] = useState(null)

  const spread = reading ? spreads.find(s => s.id === reading.spreadId) : null
  const positions = spread ? getPositions(spread, reading.mode) : []
  const filledCount = reading ? Object.keys(reading.cards).length : 0
  const allFilled = filledCount === positions.length

  const filteredCards = useMemo(() => {
    if (!activePos) return allCards
    const pos = positions.find(p => p.id === activePos)
    if (!pos) return allCards
    let pool = allCards
    if (pos.pool === 'all_minor') pool = allCards.filter(c => c.arcana === 'minor' && !isCourtCard(c))
    else if (pos.pool === 'court') pool = allCards.filter(c => c.arcana === 'minor' && isCourtCard(c))
    else if (pos.pool && pos.pool !== 'all') pool = allCards.filter(c => c.suit === pos.pool && c.arcana === 'minor' && !isCourtCard(c))
    if (suitFilter) pool = pool.filter(c => c.suit === suitFilter)
    return pool
  }, [activePos, suitFilter, positions])

  if (!reading || !spread) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5 text-white/50 text-sm">
        <p>{!reading ? '读取中…' : '牌阵未找到'}</p>
        {!reading ? null : <button onClick={onBack} className="glass-btn mt-4" style={{width:'auto',padding:'8px 20px'}}>返回首页</button>}
      </div>
    )
  }

  if (questionPhase) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="px-4 py-3 flex items-center border-b border-white/5 bg-black/30">
          <button onClick={onBack} className="text-white/70 text-sm">← 返回</button>
          <div className="flex-1 text-center"><span className="font-semibold text-white text-sm">{spread.name}</span></div>
          <div className="w-12" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <h2 className="text-lg font-semibold text-white mb-2">你想探索什么问题？</h2>
          <p className="text-xs text-white/65 mb-6 text-center">越具体，解读越能贴合你的真实情况</p>
          <textarea value={questionInput} onChange={e => setQuestionInput(e.target.value)}
            placeholder="例如：我最近在工作上总是感到很焦虑…"
            className="w-full max-w-sm h-36 p-4 rounded-2xl text-sm text-white placeholder-white/25 resize-none glass-input"
            autoFocus />
          <button onClick={() => { if (questionInput.trim()) { setQuestion(questionInput.trim()); setQuestionPhase(false) } }}
            disabled={!questionInput.trim()}
            className={`mt-6 px-8 py-3 rounded-full text-sm font-medium ${
              questionInput.trim() ? 'glass-btn' : 'bg-white/8 border border-white/10 text-white/40'
            }`} style={{width:'auto'}}>
            开始抽牌
          </button>
          <button onClick={() => setQuestionPhase(false)} className="mt-3 text-xs text-white/50 active:text-white/70">
            跳过，使用通用解读
          </button>
        </div>
      </div>
    )
  }

  const handleCardSelect = (card) => {
    if (!activePos) return
    onSelect(activePos, card, reversed)
    setReversed(false)
    const nextPos = positions.find(p => !reading.cards[p.id] && p.id !== activePos)
    setActivePos(nextPos ? nextPos.id : null)
  }

  return (
    <div className="flex flex-col min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-white/5 bg-black/30">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-white/70 text-sm">← 返回</button>
          <div className="text-center">
            <div className="font-semibold text-white text-sm">{spread.name}</div>
            <div className="text-xs text-white/55">{filledCount}/{positions.length} 张</div>
          </div>
          <button onClick={onFinish} disabled={!allFilled}
            className={`text-sm font-medium px-4 py-1.5 rounded-full ${
              allFilled ? 'glass-btn' : 'bg-white/8 border border-white/8 text-white/40'
            }`} style={{width:'auto'}}>
            查看解读
          </button>
        </div>
        <div className="flex justify-center gap-2 mt-3">
          {positions.map(pos => {
            const filled = !!reading.cards[pos.id]
            const isActive = pos.id === activePos
            return <div key={pos.id} className="w-2.5 h-2.5 rounded-full transition-colors"
              style={{background: filled ? '#8abfa0' : isActive ? 'rgba(138,191,160,0.5)' : 'rgba(255,255,255,0.1)'}} />
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        <SpreadMini spread={spread} positions={positions} cards={reading.cards}
          activePos={activePos} onPosClick={(id) => { setActivePos(id); setReversed(false) }} />
      </div>

      {activePos && (
        <div className="px-4 mb-3">
          <div className="rounded-xl p-3 border border-white/10 bg-white/5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-semibold text-white">{positions.find(p => p.id === activePos)?.label}位</span>
                <span className="text-white/55 text-sm ml-2">{positions.find(p => p.id === activePos)?.desc}</span>
                {(() => {
                  const ap = positions.find(p => p.id === activePos)?.pool
                  if (ap === 'court') return <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-400/15 text-purple-300/80">仅宫廷牌</span>
                  if (ap && ap !== 'all' && ap !== 'all_minor') return <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(138,191,160,0.15)',color:'#8abfa0'}}>仅{SUIT_NAMES[ap]}数字牌</span>
                  if (ap === 'all_minor') return <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(138,191,160,0.15)',color:'#8abfa0'}}>40张数字牌</span>
                  return null
                })()}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setReversed(false)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={!reversed ? {background:'#8abfa0',color:'#fff'} : {background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.3)'}}>正位</button>
                <button onClick={() => setReversed(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={reversed ? {background:'rgba(168,85,247,0.45)',color:'#fff'} : {background:'rgba(255,255,255,0.05)',color:'rgba(255,255,255,0.3)'}}>逆位</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activePos && positions.find(p => p.id === activePos)?.pool === 'all' && (
        <div className="px-4 mb-3">
          <div className="flex gap-2 overflow-x-auto">
            {[{ key: null, label: '全部' }, { key: 'wands', label: '权杖' }, { key: 'cups', label: '圣杯' }, { key: 'swords', label: '宝剑' }, { key: 'pentacles', label: '星币' }].map(f => (
              <button key={f.key || 'all'} onClick={() => setSuitFilter(f.key)}
                className="px-3 py-1 rounded-full text-xs whitespace-nowrap"
                style={suitFilter === f.key ? {background:'#8abfa0',color:'#fff'} : {background:'rgba(255,255,255,0.04)',color:'rgba(255,255,255,0.45)',border:'1px solid rgba(255,255,255,0.08)'}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-4 flex-1">
        {!activePos ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/45">
            <p className="text-base mb-1">点击上方牌阵中的一个位置</p>
            <p className="text-sm">然后选择你抽到的牌</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12 text-white/45"><p>没有匹配的牌</p></div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredCards.map(card => {
              const isSelected = reading.cards[activePos]?.card.id === card.id
              const pos = positions.find(p => p.id === activePos)
              const el = pos?.element || 'earth'

              const elColors = {
                fire:  { bg: 'rgba(254,100,80,0.1)', border: 'rgba(254,100,80,0.3)' },
                water: { bg: 'rgba(80,140,240,0.1)', border: 'rgba(80,140,240,0.3)' },
                air:   { bg: 'rgba(100,180,240,0.1)', border: 'rgba(100,180,240,0.3)' },
                earth: { bg: 'rgba(60,180,100,0.1)', border: 'rgba(60,180,100,0.3)' },
              }
              const ec = elColors[el] || elColors.earth

              return (
                <button key={card.id} onClick={() => handleCardSelect(card)}
                  className="relative p-2 rounded-xl border text-left active:scale-95 transition-transform"
                  style={{
                    background: isSelected ? ec.bg : 'rgba(255,255,255,0.04)',
                    borderColor: isSelected ? ec.border : 'rgba(255,255,255,0.08)',
                    borderWidth: isSelected ? 2 : 1,
                  }}>
                  {card.element && (
                    <span className="absolute top-1 right-1 text-[10px]">
                      {card.element === 'fire' && '🔥'}{card.element === 'water' && '💧'}
                      {card.element === 'air' && '💨'}{card.element === 'earth' && '🌿'}
                    </span>
                  )}
                  <div className="text-xs font-bold text-white leading-tight mt-1">{card.name_zh}</div>
                  <div className="text-[10px] text-white/45 mt-0.5">{card.name_en}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {card.keywords.slice(0, 2).map((kw, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/8 text-white/50">{kw}</span>
                    ))}
                  </div>
                  {isSelected && (
                    <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{background:'#8abfa0'}}>
                      <span className="text-white text-[9px]">✓</span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function SpreadMini({ spread, cards, positions, activePos, onPosClick }) {
  const pos = (id) => positions.find(p => p.id === id)
  if (spread.id === 'four-elements') {
    const isPhase1 = positions.length === 5
    const w = cards['wands']; const c = cards['cups']; const s = cards['swords']
    const p = cards['pentacles']; const e = cards['emphasis']
    return isPhase1 ? (
      <div className="flex flex-col items-center gap-1">
        <Slot pos={pos('swords')} card={s} active={activePos==='swords'} onClick={()=>onPosClick('swords')} />
        <div className="flex items-center gap-2">
          <Slot pos={pos('wands')} card={w} active={activePos==='wands'} onClick={()=>onPosClick('wands')} />
          <Slot pos={pos('emphasis')} card={e} active={activePos==='emphasis'} onClick={()=>onPosClick('emphasis')} large highlight />
          <Slot pos={pos('cups')} card={c} active={activePos==='cups'} onClick={()=>onPosClick('cups')} />
        </div>
        <Slot pos={pos('pentacles')} card={p} active={activePos==='pentacles'} onClick={()=>onPosClick('pentacles')} />
      </div>
    ) : (
      <div className="flex flex-col items-center gap-1">
        <Slot pos={pos('swords')} card={s} active={activePos==='swords'} onClick={()=>onPosClick('swords')} />
        <div className="flex items-center gap-2">
          <Slot pos={pos('wands')} card={w} active={activePos==='wands'} onClick={()=>onPosClick('wands')} />
          <Slot pos={pos('cups')} card={c} active={activePos==='cups'} onClick={()=>onPosClick('cups')} />
        </div>
        <Slot pos={pos('pentacles')} card={p} active={activePos==='pentacles'} onClick={()=>onPosClick('pentacles')} />
      </div>
    )
  }
  if (spread.id === 'interpersonal-mirror') {
    return (
      <div className="flex flex-col items-center gap-2">
        <Slot pos={pos('projection')} card={cards['projection']} active={activePos==='projection'} onClick={()=>onPosClick('projection')} large highlight />
        <div className="flex items-center gap-2">
          <Slot pos={pos('detail1')} card={cards['detail1']} active={activePos==='detail1'} onClick={()=>onPosClick('detail1')} />
          <Slot pos={pos('detail2')} card={cards['detail2']} active={activePos==='detail2'} onClick={()=>onPosClick('detail2')} />
          <Slot pos={pos('detail3')} card={cards['detail3']} active={activePos==='detail3'} onClick={()=>onPosClick('detail3')} />
        </div>
      </div>
    )
  }
  return <div className="flex justify-center gap-4">{positions.map(p => <Slot key={p.id} pos={p} card={cards[p.id]} active={activePos===p.id} onClick={()=>onPosClick(p.id)} />)}</div>
}

function Slot({ pos, card, active, onClick, large, highlight }) {
  if (!pos) return null
  const el = pos.element || 'earth'
  const elBg = { fire:'rgba(254,100,80,0.08)', water:'rgba(80,140,240,0.08)', air:'rgba(100,180,240,0.08)', earth:'rgba(60,180,100,0.08)' }
  const elBd = { fire:'rgba(254,100,80,0.3)', water:'rgba(80,140,240,0.3)', air:'rgba(100,180,240,0.3)', earth:'rgba(60,180,100,0.3)' }

  let bg, border, borderW = 1
  if (card) { bg = elBg[el]; border = elBd[el] }
  else if (active) { bg = 'rgba(138,191,160,0.06)'; border = 'rgba(138,191,160,0.45)'; borderW = 2 }
  else if (highlight) { bg = 'rgba(138,191,160,0.04)'; border = 'rgba(138,191,160,0.2)' }
  else { bg = 'rgba(255,255,255,0.03)'; border = 'rgba(255,255,255,0.08)' }

  return (
    <button onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-xl transition-all ${large ? 'w-20 h-20' : 'w-16 h-16'}`}
      style={{ background: bg, borderColor: border, borderStyle: card ? 'solid' : 'dashed', borderWidth: borderW }}>
      {card ? (
        <>
          <span className="text-lg">{card.isReversed ? '🔄' : card.card.name_zh.slice(0, 2)}</span>
          {card.isReversed && <span className="text-[9px] text-purple-400/70 mt-0.5">逆位</span>}
          <span className="text-[10px] text-white/55 mt-0.5">{pos.label}</span>
        </>
      ) : (
        <>
          <span className="text-lg text-white/12">+</span>
          <span className="text-[10px] text-white/45 mt-0.5">{pos.label}</span>
        </>
      )}
    </button>
  )
}
