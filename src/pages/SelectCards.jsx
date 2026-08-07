import { useState, useMemo } from 'react'
import spreads from '../data/spreads.json'
import allCards from '../data/cards.json'

const COURT_KEYWORDS = ['侍从', '骑士', '皇后', '国王']
const isCourtCard = (card) => COURT_KEYWORDS.some(kw => card.name_zh.includes(kw))

const SUIT_NAMES = {
  wands: '权杖', cups: '圣杯', swords: '宝剑', pentacles: '星币',
}

const ELEMENT_BG = {
  fire: 'rgba(254,100,80,0.12)',
  water: 'rgba(80,140,240,0.12)',
  air: 'rgba(100,180,240,0.12)',
  earth: 'rgba(60,180,100,0.12)',
}
const ELEMENT_BORDER = {
  fire: 'rgba(254,100,80,0.35)',
  water: 'rgba(80,140,240,0.35)',
  air: 'rgba(100,180,240,0.35)',
  earth: 'rgba(60,180,100,0.35)',
}

const getPositions = (spread, mode) => {
  if (spread.id === 'four-elements') {
    return mode === 'phase1' ? spread.positions_phase1 : spread.positions_phase2
  }
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
    if (pos.pool === 'all_minor') {
      pool = allCards.filter(c => c.arcana === 'minor' && !isCourtCard(c))
    } else if (pos.pool === 'court') {
      pool = allCards.filter(c => c.arcana === 'minor' && isCourtCard(c))
    } else if (pos.pool && pos.pool !== 'all') {
      pool = allCards.filter(c => c.suit === pos.pool && c.arcana === 'minor' && !isCourtCard(c))
    }
    if (suitFilter) pool = pool.filter(c => c.suit === suitFilter)
    return pool
  }, [activePos, suitFilter, positions])

  // Guard: no reading data
  if (!reading || !spread) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5 text-white/60 text-sm">
        <p>{!reading ? '读取中…' : '牌阵未找到'}</p>
        {!reading ? null : <button onClick={onBack} className="glass-btn mt-4" style={{width:'auto',padding:'8px 20px'}}>返回首页</button>}
      </div>
    )
  }

  // ── Question input phase ──
  if (questionPhase) {
    return (
      <div className="flex flex-col min-h-screen">
        {/* Header */}
        <div className="px-4 py-3 flex items-center border-b border-white/5"
          style={{ background: 'oklch(16% 0.01 90 / 0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <button onClick={onBack} className="text-white/60 text-sm">← 返回</button>
          <div className="flex-1 text-center">
            <span className="font-semibold text-white text-sm">{spread.name}</span>
          </div>
          <div className="w-12" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-white mb-2">你想探索什么问题？</h2>
            <p className="text-xs text-white/50 leading-relaxed">
              请详细描述你此刻的困惑或想探索的方向<br />
              越具体，解读越能贴合你的真实情况
            </p>
          </div>
          <textarea
            value={questionInput}
            onChange={e => setQuestionInput(e.target.value)}
            placeholder="例如：我最近在工作上总是感到很焦虑，明明很努力却总觉得自己不够好…"
            className="w-full max-w-sm h-36 p-4 rounded-2xl text-sm text-white placeholder-white/25 resize-none focus:outline-none transition-all"
            style={{ background: 'oklch(100% 0 0 / 0.06)', border: '1px solid oklch(100% 0 0 / 0.15)', backdropFilter: 'blur(8px)' }}
            autoFocus
          />
          <button
            onClick={() => { if (questionInput.trim()) { setQuestion(questionInput.trim()); setQuestionPhase(false) } }}
            disabled={!questionInput.trim()}
            className={`mt-6 px-8 py-3 rounded-full text-sm font-medium transition-all ${
              questionInput.trim()
                ? 'glass-btn'
                : 'text-white/20'
            }`}
            style={questionInput.trim() ? {width:'auto'} : {width:'auto',background:'oklch(100% 0 0 / 0.04)',border:'1px solid oklch(100% 0 0 / 0.06)',borderRadius:'9999px'}}
          >
            开始抽牌
          </button>
          <button onClick={() => setQuestionPhase(false)} className="mt-3 text-xs text-white/30 active:text-white/50">
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
      <div className="sticky top-0 z-10 px-4 py-3 border-b border-white/5"
        style={{ background: 'oklch(16% 0.01 90 / 0.5)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-white/60 text-sm">← 返回</button>
          <div className="text-center">
            <div className="font-semibold text-white text-sm">{spread.name}</div>
            <div className="text-xs text-white/40">{filledCount}/{positions.length} 张</div>
          </div>
          <button
            onClick={onFinish}
            disabled={!allFilled}
            className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
              allFilled ? 'glass-btn' : ''
            }`}
            style={allFilled ? {width:'auto'} : {width:'auto',background:'oklch(100% 0 0 / 0.04)',border:'1px solid oklch(100% 0 0 / 0.06)',color:'oklch(100% 0 0 / 0.3)',borderRadius:'9999px'}}
          >
            查看解读
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-3">
          {positions.map(pos => (
            <div key={pos.id}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                reading.cards[pos.id]
                  ? ''
                  : pos.id === activePos
                    ? ''
                    : ''
              }`}
              style={{
                background: reading.cards[pos.id]
                  ? 'oklch(82% 0.04 162)'
                  : pos.id === activePos
                    ? 'oklch(82% 0.04 162 / 0.6)'
                    : 'oklch(100% 0 0 / 0.12)'
              }}
            />
          ))}
        </div>
      </div>

      {/* Spread Layout Mini */}
      <div className="px-4 py-4">
        <SpreadMini
          spread={spread} positions={positions} cards={reading.cards}
          activePos={activePos} onPosClick={(id) => { setActivePos(id); setReversed(false) }}
        />
      </div>

      {/* Active Position Info & Reversed Toggle */}
      {activePos && (
        <div className="px-4 mb-3">
          <div className="rounded-xl p-3 border border-white/10"
            style={{ background: 'oklch(100% 0 0 / 0.06)', backdropFilter: 'blur(8px)' }}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-semibold text-white">
                  {positions.find(p => p.id === activePos)?.label}位
                </span>
                <span className="text-white/50 text-sm ml-2">
                  {positions.find(p => p.id === activePos)?.desc}
                </span>
                {(() => {
                  const ap = positions.find(p => p.id === activePos)?.pool
                  if (ap === 'court') return <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{background:'rgba(168,85,247,0.15)',color:'oklch(75% 0.08 300)'}}>仅宫廷牌</span>
                  if (ap && ap !== 'all' && ap !== 'all_minor') return <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{background:'oklch(82% 0.04 162 / 0.15)',color:'oklch(78% 0.05 163)'}}>仅{SUIT_NAMES[ap]}数字牌</span>
                  if (ap === 'all_minor') return <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{background:'oklch(82% 0.04 162 / 0.15)',color:'oklch(78% 0.05 163)'}}>40张数字牌</span>
                  return null
                })()}
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setReversed(false)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={!reversed ? {background:'oklch(82% 0.04 162)',color:'#fff'} : {background:'oklch(100% 0 0 / 0.06)',color:'oklch(100% 0 0 / 0.35)'}}>
                  正位
                </button>
                <button onClick={() => setReversed(true)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={reversed ? {background:'rgba(168,85,247,0.5)',color:'#fff'} : {background:'oklch(100% 0 0 / 0.06)',color:'oklch(100% 0 0 / 0.35)'}}>
                  逆位
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suit Filter Tabs */}
      {activePos && positions.find(p => p.id === activePos)?.pool === 'all' && (
        <div className="px-4 mb-3">
          <div className="flex gap-2 overflow-x-auto">
            {[
              { key: null, label: '全部' },
              { key: 'wands', label: '权杖' },
              { key: 'cups', label: '圣杯' },
              { key: 'swords', label: '宝剑' },
              { key: 'pentacles', label: '星币' },
            ].map(f => (
              <button key={f.key || 'all'} onClick={() => setSuitFilter(f.key)}
                className="px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors"
                style={suitFilter === f.key
                  ? {background:'oklch(82% 0.04 162)',color:'#fff'}
                  : {background:'oklch(100% 0 0 / 0.06)',color:'oklch(100% 0 0 / 0.5)',border:'1px solid oklch(100% 0 0 / 0.1)'}}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card Grid */}
      <div className="px-4 flex-1">
        {!activePos ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <p className="text-lg mb-2">点击上方牌阵中的一个位置</p>
            <p className="text-sm">然后选择你抽到的牌</p>
          </div>
        ) : filteredCards.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            <p>没有匹配的牌</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {filteredCards.map(card => {
              const isSelected = reading.cards[activePos]?.card.id === card.id
              const pos = positions.find(p => p.id === activePos)
              const elKey = pos?.element || 'earth'

              return (
                <button key={card.id} onClick={() => handleCardSelect(card)}
                  className="relative p-2 rounded-xl border text-left transition-all active:scale-95"
                  style={{
                    background: isSelected ? ELEMENT_BG[elKey] : 'oklch(100% 0 0 / 0.05)',
                    borderColor: isSelected ? ELEMENT_BORDER[elKey] : 'oklch(100% 0 0 / 0.1)',
                    borderWidth: isSelected ? 2 : 1,
                  }}
                >
                  {card.element && (
                    <span className="absolute top-1 right-1 text-xs">
                      {card.element === 'fire' && '🔥'}
                      {card.element === 'water' && '💧'}
                      {card.element === 'air' && '💨'}
                      {card.element === 'earth' && '🌿'}
                    </span>
                  )}
                  <div className="text-xs font-bold text-white leading-tight mt-1">{card.name_zh}</div>
                  <div className="text-[10px] text-white/35 mt-0.5">{card.name_en}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {card.keywords.slice(0, 2).map((kw, i) => (
                      <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full"
                        style={{background:'oklch(100% 0 0 / 0.06)',color:'oklch(100% 0 0 / 0.4)'}}>{kw}</span>
                    ))}
                  </div>
                  {isSelected && (
                    <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{background:'oklch(82% 0.04 162)'}}>
                      <span className="text-white text-[10px]">✓</span>
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

// ── Mini spread visualization ──
function SpreadMini({ spread, cards, positions, activePos, onPosClick }) {
  const pos = (id) => positions.find(p => p.id === id)

  if (spread.id === 'four-elements') {
    const isPhase1 = positions.length === 5
    const wands = cards['wands']; const cups = cards['cups']
    const swords = cards['swords']; const pentacles = cards['pentacles']
    const emphasis = cards['emphasis']

    if (isPhase1) {
      return (
        <div className="flex flex-col items-center gap-1">
          <SlotButton pos={pos('swords')} card={swords} active={activePos === 'swords'} onClick={() => onPosClick('swords')} />
          <div className="flex items-center gap-2">
            <SlotButton pos={pos('wands')} card={wands} active={activePos === 'wands'} onClick={() => onPosClick('wands')} />
            <SlotButton pos={pos('emphasis')} card={emphasis} active={activePos === 'emphasis'} onClick={() => onPosClick('emphasis')} large highlight />
            <SlotButton pos={pos('cups')} card={cups} active={activePos === 'cups'} onClick={() => onPosClick('cups')} />
          </div>
          <SlotButton pos={pos('pentacles')} card={pentacles} active={activePos === 'pentacles'} onClick={() => onPosClick('pentacles')} />
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center gap-1">
        <SlotButton pos={pos('swords')} card={swords} active={activePos === 'swords'} onClick={() => onPosClick('swords')} />
        <div className="flex items-center gap-2">
          <SlotButton pos={pos('wands')} card={wands} active={activePos === 'wands'} onClick={() => onPosClick('wands')} />
          <SlotButton pos={pos('cups')} card={cups} active={activePos === 'cups'} onClick={() => onPosClick('cups')} />
        </div>
        <SlotButton pos={pos('pentacles')} card={pentacles} active={activePos === 'pentacles'} onClick={() => onPosClick('pentacles')} />
      </div>
    )
  }

  if (spread.id === 'interpersonal-mirror') {
    return (
      <div className="flex flex-col items-center gap-2">
        <SlotButton pos={pos('projection')} card={cards['projection']} active={activePos === 'projection'} onClick={() => onPosClick('projection')} large highlight />
        <div className="flex items-center gap-2">
          <SlotButton pos={pos('detail1')} card={cards['detail1']} active={activePos === 'detail1'} onClick={() => onPosClick('detail1')} />
          <SlotButton pos={pos('detail2')} card={cards['detail2']} active={activePos === 'detail2'} onClick={() => onPosClick('detail2')} />
          <SlotButton pos={pos('detail3')} card={cards['detail3']} active={activePos === 'detail3'} onClick={() => onPosClick('detail3')} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center gap-4">
      {positions.map(p => <SlotButton key={p.id} pos={p} card={cards[p.id]} active={activePos === p.id} onClick={() => onPosClick(p.id)} />)}
    </div>
  )
}

function SlotButton({ pos, card, active, onClick, large = false, highlight = false }) {
  if (!pos) return null
  const el = pos.element || 'earth'
  const filledBg = card ? ELEMENT_BG[el] : 'oklch(100% 0 0 / 0.04)'
  const filledBorder = card ? ELEMENT_BORDER[el] : 'oklch(100% 0 0 / 0.1)'

  return (
    <button onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-xl border transition-all ${large ? 'w-20 h-20' : 'w-16 h-16'}`}
      style={{
        background: card ? filledBg : active ? 'oklch(82% 0.04 162 / 0.08)' : highlight ? 'oklch(82% 0.04 162 / 0.05)' : 'oklch(100% 0 0 / 0.04)',
        borderColor: card ? filledBorder : active ? 'oklch(82% 0.04 162 / 0.5)' : highlight ? 'oklch(82% 0.04 162 / 0.25)' : 'oklch(100% 0 0 / 0.1)',
        borderStyle: card ? 'solid' : 'dashed',
        borderWidth: active ? 2 : 1,
      }}
    >
      {card ? (
        <>
          <span className="text-lg">{card.isReversed ? '🔄' : card.card.name_zh.slice(0, 2)}</span>
          {card.isReversed && <span className="text-[9px] mt-0.5" style={{color:'oklch(75% 0.08 300)'}}>逆位</span>}
          <span className="text-[10px] text-white/50 mt-0.5">{pos.label}</span>
        </>
      ) : (
        <>
          <span className="text-lg text-white/15">+</span>
          <span className="text-[10px] text-white/30 mt-0.5">{pos.label}</span>
        </>
      )}
    </button>
  )
}
