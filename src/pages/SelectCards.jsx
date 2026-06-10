import { useState, useMemo } from 'react'
import spreads from '../data/spreads.json'
import allCards from '../data/cards.json'

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

export default function SelectCards({ reading, onSelect, onFinish, onBack }) {
  if (!reading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5"
        style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #fdf6e3 20%, #eaf4f0 50%, #f0f4f8 75%, #fdf6e3 100%)' }}>
        <p className="text-stone-400 text-sm">读取中…</p>
      </div>
    )
  }

  const spread = spreads.find(s => s.id === reading.spreadId)
  if (!spread) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-stone-400">牌阵未找到</p>
        <button onClick={onBack} className="btn-secondary mt-4">返回首页</button>
      </div>
    )
  }

  const [activePos, setActivePos] = useState(null)
  const [reversed, setReversed] = useState(false)
  const [suitFilter, setSuitFilter] = useState(null)

  const filledCount = Object.keys(reading.cards).length
  const allFilled = filledCount === spread.positions.length

  // Filter cards based on the active position's pool
  const filteredCards = useMemo(() => {
    if (!activePos) {
      // Show all when no position is active (browse mode)
      if (suitFilter) return allCards.filter(c => c.suit === suitFilter)
      return allCards
    }

    const pos = spread.positions.find(p => p.id === activePos)
    if (!pos) return allCards

    let pool = allCards
    if (pos.pool === 'wands') pool = allCards.filter(c => c.suit === 'wands')
    else if (pos.pool === 'cups') pool = allCards.filter(c => c.suit === 'cups')
    else if (pos.pool === 'swords') pool = allCards.filter(c => c.suit === 'swords')
    else if (pos.pool === 'pentacles') pool = allCards.filter(c => c.suit === 'pentacles')

    if (suitFilter) pool = pool.filter(c => c.suit === suitFilter)
    return pool
  }, [activePos, suitFilter])

  const handleCardSelect = (card) => {
    if (!activePos) return
    onSelect(activePos, card, reversed)
    setReversed(false)
    // Auto-advance to next unfilled position
    const nextPos = spread.positions.find(p => !reading.cards[p.id] && p.id !== activePos)
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
            <div className="text-xs text-stone-400">{filledCount}/{spread.positions.length} 张</div>
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
          {spread.positions.map(pos => (
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
                  {spread.positions.find(p => p.id === activePos)?.label}位
                </span>
                <span className="text-stone-400 text-sm ml-2">
                  {spread.positions.find(p => p.id === activePos)?.desc}
                </span>
                {spread.positions.find(p => p.id === activePos)?.pool !== 'all' && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">
                    仅{SUIT_NAMES[spread.positions.find(p => p.id === activePos)?.pool]}牌组
                  </span>
                )}
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className={`text-xs font-medium ${reversed ? 'text-purple-600' : 'text-stone-400'}`}>
                  正位
                </span>
                <button
                  onClick={() => setReversed(!reversed)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    reversed ? 'bg-purple-400' : 'bg-stone-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      reversed ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${reversed ? 'text-stone-400' : 'text-purple-600'}`}>
                  逆位
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Suit Filter Tabs */}
      {activePos && spread.positions.find(p => p.id === activePos)?.pool === 'all' && (
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
                  const pos = spread.positions.find(p => p.id === activePos)
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
function SpreadMini({ spread, cards, activePos, onPosClick }) {
  // For four-element spread, use cross layout
  const isFourElements = spread.id === 'four-elements'

  if (isFourElements) {
    const pos = (id) => spread.positions.find(p => p.id === id)
    const core = cards['core']
    const fire = cards['fire']
    const air = cards['air']
    const water = cards['water']
    const earth = cards['earth']

    return (
      <div className="flex flex-col items-center gap-1">
        {/* Air - top */}
        <SlotButton pos={pos('air')} card={air} active={activePos === 'air'} onClick={() => onPosClick('air')} />
        {/* Middle row: Fire - Core - Water */}
        <div className="flex items-center gap-2">
          <SlotButton pos={pos('fire')} card={fire} active={activePos === 'fire'} onClick={() => onPosClick('fire')} />
          <SlotButton pos={pos('core')} card={core} active={activePos === 'core'} onClick={() => onPosClick('core')} large />
          <SlotButton pos={pos('water')} card={water} active={activePos === 'water'} onClick={() => onPosClick('water')} />
        </div>
        {/* Earth - bottom */}
        <SlotButton pos={pos('earth')} card={earth} active={activePos === 'earth'} onClick={() => onPosClick('earth')} />
      </div>
    )
  }

  // Salon spread — horizontal layout
  return (
    <div className="flex justify-center gap-4">
      {spread.positions.map(pos => (
        <SlotButton
          key={pos.id}
          pos={pos}
          card={cards[pos.id]}
          active={activePos === pos.id}
          onClick={() => onPosClick(pos.id)}
        />
      ))}
    </div>
  )
}

function SlotButton({ pos, card, active, onClick, large = false }) {
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
