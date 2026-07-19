import { useState, useMemo } from 'react'
import spreads from '../data/spreads.json'
import allCards from '../data/cards.json'

const COURT_KEYWORDS = ['侍从', '骑士', '皇后', '国王']
const isCourtCard = (card) => COURT_KEYWORDS.some(kw => card.name_zh.includes(kw))

const ELEMENT_COLORS = {
  fire: 'from-red-100 to-orange-50 border-red-300',
  water: 'from-blue-100 to-indigo-50 border-blue-300',
  air: 'from-sky-100 to-cyan-50 border-sky-300',
  earth: 'from-green-100 to-emerald-50 border-green-300',
}

const ELEMENT_LABELS = {
  fire: '🔥 火',
  water: '💧 水',
  air: '💨 风',
  earth: '🌿 土',
}

const SUIT_NAMES = {
  wands: '权杖',
  cups: '圣杯',
  swords: '宝剑',
  pentacles: '星币',
}

// Get the right positions array based on spread and mode
const getPositions = (spread, mode) => {
  if (spread.id === 'four-elements') {
    return mode === 'phase1' ? spread.positions_phase1 : spread.positions_phase2
  }
  return spread.positions
}

export default function SelectCards({ reading, question, setQuestion, onSelect, onFinish, onBack }) {
  // ALL hooks at the top — never after conditional returns
  const [questionInput, setQuestionInput] = useState(question || '')
  const [questionPhase, setQuestionPhase] = useState(!question)
  const [activePos, setActivePos] = useState(null)
  const [reversed, setReversed] = useState(false)
  const [suitFilter, setSuitFilter] = useState(null)

  // Compute spread & positions (safe for null reading)
  const spread = reading ? spreads.find(s => s.id === reading.spreadId) : null
  const positions = spread ? getPositions(spread, reading.mode) : []
  const filledCount = reading ? Object.keys(reading.cards).length : 0
  const allFilled = filledCount === positions.length

  // Filter cards based on the active position's pool
  const filteredCards = useMemo(() => {
    if (!activePos) return allCards
    const pos = positions.find(p => p.id === activePos)
    if (!pos) return allCards

    let pool = allCards
    if (pos.pool === 'all_minor') {
      pool = allCards.filter(c => c.arcana === 'minor' && !isCourtCard(c))
    } else if (pos.pool === 'court') {
      pool = allCards.filter(c => c.arcana === 'minor' && isCourtCard(c))
    } else if (pos.pool === 'wands') {
      pool = allCards.filter(c => c.suit === 'wands' && c.arcana === 'minor' && !isCourtCard(c))
    } else if (pos.pool === 'cups') {
      pool = allCards.filter(c => c.suit === 'cups' && c.arcana === 'minor' && !isCourtCard(c))
    } else if (pos.pool === 'swords') {
      pool = allCards.filter(c => c.suit === 'swords' && c.arcana === 'minor' && !isCourtCard(c))
    } else if (pos.pool === 'pentacles') {
      pool = allCards.filter(c => c.suit === 'pentacles' && c.arcana === 'minor' && !isCourtCard(c))
    }
    if (suitFilter) pool = pool.filter(c => c.suit === suitFilter)
    return pool
  }, [activePos, suitFilter, positions])

  // Guard: no reading data
  if (!reading || !spread) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5"
        style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #fdf6e3 20%, #eaf4f0 50%, #f0f4f8 75%, #fdf6e3 100%)' }}>
        <p className="text-stone-400 text-sm">{!reading ? '读取中…' : '牌阵未找到'}</p>
        {!reading ? null : <button onClick={onBack} className="btn-secondary mt-4">返回首页</button>}
      </div>
    )
  }

  // Question input phase — rendered inside main JSX, not as early return
  if (questionPhase) {
    return (
      <div className="flex flex-col min-h-screen"
        style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #fdf6e3 20%, #eaf4f0 50%, #f0f4f8 75%, #fdf6e3 100%)' }}>
        <div className="px-4 py-3 border-b border-stone-200 flex items-center">
          <button onClick={onBack} className="text-stone-500 text-sm">← 返回</button>
          <div className="flex-1 text-center">
            <span className="font-semibold text-stone-800 text-sm">{spread.name}</span>
          </div>
          <div className="w-12" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center mb-8">
            <span className="text-3xl mb-4 block">💭</span>
            <h2 className="text-lg font-semibold text-stone-700 mb-2">你想探索什么问题？</h2>
            <p className="text-xs text-stone-400 leading-relaxed">
              请详细描述你此刻的困惑或想探索的方向<br />
              越具体，解读越能贴合你的真实情况
            </p>
          </div>
          <textarea
            value={questionInput}
            onChange={e => setQuestionInput(e.target.value)}
            placeholder="例如：我最近在工作上总是感到很焦虑，明明很努力却总觉得自己不够好，我想知道是什么样的信念在影响我…"
            className="w-full max-w-sm h-36 p-4 rounded-2xl border border-stone-200 bg-white/70 text-sm text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:border-amber-300 focus:ring-2 focus:ring-amber-100 transition-all"
            autoFocus
          />
          <button
            onClick={() => {
              if (questionInput.trim()) {
                setQuestion(questionInput.trim())
                setQuestionPhase(false)
              }
            }}
            disabled={!questionInput.trim()}
            className={`mt-6 px-8 py-3 rounded-full text-sm font-medium transition-all ${
              questionInput.trim()
                ? 'bg-amber-500 text-white active:scale-95 shadow-lg shadow-amber-200'
                : 'bg-stone-200 text-stone-400'
            }`}
          >
            开始抽牌 ✦
          </button>
          <button
            onClick={() => setQuestionPhase(false)}
            className="mt-3 text-xs text-stone-300 active:text-stone-500"
          >
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
    // Auto-advance to next unfilled position
    const nextPos = positions.find(p => !reading.cards[p.id] && p.id !== activePos)
    setActivePos(nextPos ? nextPos.id : null)
  }

  const handlePosClick = (posId) => {
    if (reading.cards[posId]) {
      // Already filled — re-select
    }
    setActivePos(posId)
    setReversed(false)
  }

  return (
    <div className="flex flex-col min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-stone-50/90 backdrop-blur-sm z-10 px-4 py-3 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-stone-500 text-sm">← 返回</button>
          <div className="text-center">
            <div className="font-semibold text-stone-800 text-sm">{spread.name}</div>
            <div className="text-xs text-stone-400">{filledCount}/{positions.length} 张</div>
          </div>
          <button
            onClick={onFinish}
            disabled={!allFilled}
            className={`text-sm font-medium px-4 py-1.5 rounded-full ${
              allFilled
                ? 'bg-amber-500 text-white'
                : 'bg-stone-200 text-stone-400'
            }`}
          >
            查看解读
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-3">
          {positions.map(pos => (
            <div
              key={pos.id}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                reading.cards[pos.id]
                  ? 'bg-amber-400'
                  : pos.id === activePos
                    ? 'bg-amber-200 ring-2 ring-amber-300'
                    : 'bg-stone-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Spread Layout Mini */}
      <div className="px-4 py-4">
        <SpreadMini
          spread={spread}
          positions={positions}
          cards={reading.cards}
          activePos={activePos}
          onPosClick={handlePosClick}
        />
      </div>

      {/* Active Position Info & Reversed Toggle */}
      {activePos && (
        <div className="px-4 mb-3">
          <div className="bg-white rounded-xl border border-stone-200 p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-stone-800">
                  {positions.find(p => p.id === activePos)?.label}位
                </span>
                <span className="text-stone-400 text-sm ml-2">
                  {positions.find(p => p.id === activePos)?.desc}
                </span>
                {(() => {
                  const activePool = positions.find(p => p.id === activePos)?.pool
                  if (activePool === 'court') {
                    return <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">仅宫廷牌</span>
                  }
                  if (activePool && activePool !== 'all' && activePool !== 'all_minor') {
                    return <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">仅{SUIT_NAMES[activePool]}数字牌</span>
                  }
                  if (activePool === 'all_minor') {
                    return <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">40张数字牌</span>
                  }
                  return null
                })()}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setReversed(false)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    !reversed
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  正位
                </button>
                <button
                  onClick={() => setReversed(true)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    reversed
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
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
              <button
                key={f.key || 'all'}
                onClick={() => setSuitFilter(f.key)}
                className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                  suitFilter === f.key
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-stone-500 border border-stone-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Card Grid */}
      <div className="px-4 flex-1">
        {!activePos ? (
          <div className="flex flex-col items-center justify-center py-12 text-stone-400">
            <div className="text-4xl mb-3">👆</div>
            <p>点击上方牌阵中的一个位置</p>
            <p className="text-sm">然后选择你抽到的牌</p>
          </div>
        ) : (
          <>
            {filteredCards.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <p>没有匹配的牌</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredCards.map(card => {
                  const isSelected = reading.cards[activePos]?.card.id === card.id
                  const pos = positions.find(p => p.id === activePos)
                  const elColor = pos?.element ? ELEMENT_COLORS[pos.element] : 'from-white to-stone-50 border-stone-200'

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardSelect(card)}
                      className={`relative p-2 rounded-xl border-2 text-left transition-all active:scale-95 ${
                        isSelected
                          ? `bg-gradient-to-br ${elColor} shadow-md ring-2 ring-amber-300`
                          : 'bg-white border-stone-200 hover:border-amber-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Element badge */}
                      {card.element && (
                        <span className="absolute top-1 right-1 text-xs">
                          {card.element === 'fire' && '🔥'}
                          {card.element === 'water' && '💧'}
                          {card.element === 'air' && '💨'}
                          {card.element === 'earth' && '🌿'}
                        </span>
                      )}
                      <div className="text-xs font-bold text-stone-800 leading-tight mt-1">
                        {card.name_zh}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {card.name_en}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {card.keywords.slice(0, 2).map((kw, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded-full">
                            {kw}
                          </span>
                        ))}
                      </div>
                      {isSelected && (
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-[10px]">✓</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Mini spread visualization
function SpreadMini({ spread, cards, positions, activePos, onPosClick }) {
  const pos = (id) => positions.find(p => p.id === id)

  // Four-elements spread: cross layout
  if (spread.id === 'four-elements') {
    const isPhase1 = positions.length === 5
    const wands = cards['wands']
    const cups = cards['cups']
    const swords = cards['swords']
    const pentacles = cards['pentacles']
    const emphasis = cards['emphasis']

    if (isPhase1) {
      // Phase 1: 5 cards cross + emphasis center
      return (
        <div className="flex flex-col items-center gap-1">
          {/* Swords (Air) - top */}
          <SlotButton pos={pos('swords')} card={swords} active={activePos === 'swords'} onClick={() => onPosClick('swords')} />
          {/* Middle row: Wands (Fire) - Emphasis - Cups (Water) */}
          <div className="flex items-center gap-2">
            <SlotButton pos={pos('wands')} card={wands} active={activePos === 'wands'} onClick={() => onPosClick('wands')} />
            <SlotButton pos={pos('emphasis')} card={emphasis} active={activePos === 'emphasis'} onClick={() => onPosClick('emphasis')} large highlight />
            <SlotButton pos={pos('cups')} card={cups} active={activePos === 'cups'} onClick={() => onPosClick('cups')} />
          </div>
          {/* Pentacles (Earth) - bottom */}
          <SlotButton pos={pos('pentacles')} card={pentacles} active={activePos === 'pentacles'} onClick={() => onPosClick('pentacles')} />
        </div>
      )
    }

    // Phase 2: 4 cards cross without emphasis
    return (
      <div className="flex flex-col items-center gap-1">
        {/* Swords (Air) - top */}
        <SlotButton pos={pos('swords')} card={swords} active={activePos === 'swords'} onClick={() => onPosClick('swords')} />
        {/* Middle row: Wands (Fire) - Cups (Water) */}
        <div className="flex items-center gap-2">
          <SlotButton pos={pos('wands')} card={wands} active={activePos === 'wands'} onClick={() => onPosClick('wands')} />
          <SlotButton pos={pos('cups')} card={cups} active={activePos === 'cups'} onClick={() => onPosClick('cups')} />
        </div>
        {/* Pentacles (Earth) - bottom */}
        <SlotButton pos={pos('pentacles')} card={pentacles} active={activePos === 'pentacles'} onClick={() => onPosClick('pentacles')} />
      </div>
    )
  }

  // Interpersonal mirror spread: 上1下3 layout
  if (spread.id === 'interpersonal-mirror') {
    const projection = cards['projection']
    const detail1 = cards['detail1']
    const detail2 = cards['detail2']
    const detail3 = cards['detail3']

    return (
      <div className="flex flex-col items-center gap-2">
        {/* Projection card - top center, larger */}
        <SlotButton pos={pos('projection')} card={projection} active={activePos === 'projection'} onClick={() => onPosClick('projection')} large highlight />
        {/* Detail cards - bottom row */}
        <div className="flex items-center gap-2">
          <SlotButton pos={pos('detail1')} card={detail1} active={activePos === 'detail1'} onClick={() => onPosClick('detail1')} />
          <SlotButton pos={pos('detail2')} card={detail2} active={activePos === 'detail2'} onClick={() => onPosClick('detail2')} />
          <SlotButton pos={pos('detail3')} card={detail3} active={activePos === 'detail3'} onClick={() => onPosClick('detail3')} />
        </div>
      </div>
    )
  }

  // Salon spread — horizontal layout (default)
  return (
    <div className="flex justify-center gap-4">
      {positions.map(p => (
        <SlotButton
          key={p.id}
          pos={p}
          card={cards[p.id]}
          active={activePos === p.id}
          onClick={() => onPosClick(p.id)}
        />
      ))}
    </div>
  )
}

function SlotButton({ pos, card, active, onClick, large = false, highlight = false }) {
  if (!pos) return null

  const elBorder = {
    fire: 'border-red-300',
    water: 'border-blue-300',
    air: 'border-sky-300',
    earth: 'border-green-300',
  }

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center rounded-xl border-2 transition-all
        ${large ? 'w-20 h-20' : 'w-16 h-16'}
        ${card
          ? `bg-gradient-to-br ${ELEMENT_COLORS[pos.element || 'earth']} border-solid shadow-sm`
          : active
            ? `border-amber-400 bg-amber-50 border-dashed ring-2 ring-amber-200`
            : highlight
              ? `border-dashed border-amber-300 bg-amber-50/50`
              : `border-dashed ${pos.element ? elBorder[pos.element] : 'border-stone-300'} bg-white`
        }
      `}
    >
      {card ? (
        <>
          <span className="text-lg">{card.isReversed ? '🔄' : card.card.name_zh.slice(0, 2)}</span>
          {card.isReversed && <span className="text-[9px] text-purple-500 mt-0.5">逆位</span>}
          <span className="text-[10px] text-stone-500 mt-0.5">{pos.label}</span>
        </>
      ) : (
        <>
          <span className="text-lg text-stone-300">+</span>
          <span className="text-[10px] text-stone-400 mt-0.5">{pos.label}</span>
        </>
      )}
    </button>
  )
}
