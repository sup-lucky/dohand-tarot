import { useState, useMemo } from 'react'
import spreads from '../data/spreads.json'
import allCards from '../data/cards.json'
import allHerbs from '../data/herbs.json'

const ELEMENT_INFO = {
  fire: { emoji: '🔥', name: '火', color: 'text-red-600', bg: 'bg-red-50', desc: '行动·热情·目的' },
  water: { emoji: '💧', name: '水', color: 'text-blue-600', bg: 'bg-blue-50', desc: '情感·直觉·潜意识' },
  air: { emoji: '💨', name: '风', color: 'text-sky-600', bg: 'bg-sky-50', desc: '思维·沟通·逻辑' },
  earth: { emoji: '🌿', name: '土', color: 'text-green-600', bg: 'bg-green-50', desc: '物质·金钱·工作' },
}

export default function ResultPage({ reading, onRestart, onBack }) {
  const [selectedHerb, setSelectedHerb] = useState(null)
  const [expandedCard, setExpandedCard] = useState(null)

  if (!reading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-stone-400">暂无解读数据</p>
        <button onClick={onRestart} className="btn-primary mt-4">返回首页</button>
      </div>
    )
  }

  const spread = spreads.find(s => s.id === reading.spreadId)
  if (!spread) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-5">
        <p className="text-stone-400">牌阵未找到</p>
        <button onClick={onRestart} className="btn-primary mt-4">返回首页</button>
      </div>
    )
  }

  const mode = reading.mode

  // Build enriched position data
  const positions = spread.positions.map(pos => {
    const cardData = reading.cards[pos.id]
    return {
      ...pos,
      card: cardData?.card || null,
      isReversed: cardData?.isReversed || false,
      meaning: cardData?.card
        ? (mode === 'improve'
            ? (cardData.isReversed ? cardData.card.meaning_improve.reversed : cardData.card.meaning_improve.upright)
            : (cardData.isReversed ? cardData.card.meaning_state.reversed : cardData.card.meaning_state.upright))
        : null,
    }
  })

  // Element analysis
  const elementCount = useMemo(() => {
    const count = { fire: 0, water: 0, air: 0, earth: 0 }
    positions.forEach(p => {
      if (p.card?.element && count[p.card.element] !== undefined) {
        count[p.card.element]++
      }
    })
    return count
  }, [positions])

  const dominantElement = useMemo(() => {
    const sorted = Object.entries(elementCount).sort((a, b) => b[1] - a[1])
    return sorted[0][1] > 0 ? sorted[0][0] : null
  }, [elementCount])

  // Herb recommendations with smart matching — prioritizes best_for_cards
  const herbRecommendations = useMemo(() => {
    const results = []
    const seenHerbs = new Set()

    positions.forEach(pos => {
      if (!pos.card) return

      const card = pos.card
      const scores = allHerbs.map(herb => {
        let score = 0

        // Top priority: herb's best_for_cards includes this card
        if (herb.best_for_cards && herb.best_for_cards.includes(card.name_zh)) {
          score += 30
        }

        // Primary: element match
        if (herb.element === card.element) score += 10

        // Secondary: keyword overlap
        const cardKw = card.keywords.map(k => k.toLowerCase())
        const herbKw = (herb.match_keywords || []).map(k => k.toLowerCase())
        const overlap = cardKw.filter(k => herbKw.some(hk => k.includes(hk) || hk.includes(k)))
        score += overlap.length * 3

        // Position element bonus
        if (pos.element && herb.element === pos.element) score += 5

        return { herb, score }
      })

      const topHerbs = scores
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)
        .filter(s => !seenHerbs.has(s.herb.id))

      topHerbs.forEach(h => {
        seenHerbs.add(h.herb.id)
        results.push({ ...h, forCard: card, forPosition: pos })
      })
    })

    return results
  }, [positions])

  const modeLabel = spread.modeLabels[mode] || mode

  return (
    <div className="flex flex-col min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 bg-stone-50/90 backdrop-blur-sm z-10 px-4 py-3 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-stone-500 text-sm">← 修改牌面</button>
          <div className="text-center">
            <div className="font-semibold text-stone-800 text-sm">{spread.name}</div>
            <div className="text-xs text-amber-600">{modeLabel}</div>
          </div>
          <button onClick={onRestart} className="text-stone-500 text-sm">重新开始</button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Element Overview */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4">
          <h3 className="font-semibold text-stone-700 mb-3">元素分布</h3>
          <div className="flex gap-2">
            {Object.entries(elementCount).map(([el, count]) => (
              <div
                key={el}
                className={`flex-1 rounded-xl p-2 text-center ${
                  el === dominantElement ? `${ELEMENT_INFO[el].bg} ring-2 ring-offset-1 ring-current` : 'bg-stone-50'
                } ${ELEMENT_INFO[el].color}`}
              >
                <div className="text-lg">{ELEMENT_INFO[el].emoji}</div>
                <div className="text-xs font-bold">{count} 张</div>
                <div className="text-[10px] opacity-70">{ELEMENT_INFO[el].name}</div>
              </div>
            ))}
          </div>
          {dominantElement && (
            <p className="text-xs text-stone-500 mt-3 text-center">
              主导元素为 <span className={`font-semibold ${ELEMENT_INFO[dominantElement].color}`}>{ELEMENT_INFO[dominantElement].name}元素</span>
              ，{ELEMENT_INFO[dominantElement].desc}方面的议题最为突出
            </p>
          )}
        </div>

        {/* Card Interpretations */}
        <div>
          <h3 className="font-semibold text-stone-700 mb-3">牌面解读</h3>
          <div className="space-y-3">
            {positions.map(pos => {
              const isExpanded = expandedCard === pos.id
              const empty = !pos.card

              return (
                <div
                  key={pos.id}
                  className={`bg-white rounded-2xl border transition-all ${
                    isExpanded ? 'border-amber-300 shadow-md' : 'border-stone-200'
                  }`}
                >
                  {/* Card Header */}
                  <button
                    onClick={() => setExpandedCard(isExpanded ? null : pos.id)}
                    className="w-full p-4 flex items-center gap-3 text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                      pos.element ? ELEMENT_INFO[pos.element].bg : 'bg-stone-100'
                    }`}>
                      {pos.element ? ELEMENT_INFO[pos.element].emoji : '✦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-800">
                          {empty ? '待抽牌' : pos.card.name_zh}
                        </span>
                        {pos.isReversed && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full">逆位</span>
                        )}
                        {!empty && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded-full">
                            {ELEMENT_INFO[pos.card.element]?.emoji} {ELEMENT_INFO[pos.card.element]?.name}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-400">
                        {pos.label}位 · {pos.desc}
                      </div>
                    </div>
                    {!empty && (
                      <svg className={`w-5 h-5 text-stone-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {/* Card Meaning */}
                  {isExpanded && pos.meaning && (
                    <div className="px-4 pb-4 border-t border-stone-100 pt-3">
                      <div className="flex gap-2 mb-2">
                        {pos.card.keywords.map((kw, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                            {kw}
                          </span>
                        ))}
                      </div>
                      <p className="text-sm text-stone-600 leading-relaxed">
                        {pos.meaning}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Herb Recommendations */}
        <div>
          <h3 className="font-semibold text-stone-700 mb-3">
            🌿 草药指引
            <span className="text-xs text-stone-400 font-normal ml-2">每张牌匹配专属草药</span>
          </h3>
          <div className="space-y-3">
            {positions.filter(p => p.card).map(pos => {
              const cardHerbs = herbRecommendations.filter(h => h.forCard?.id === pos.card.id)
              if (cardHerbs.length === 0) return null
              return (
                <div key={pos.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                  <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                    <span className="text-sm">{ELEMENT_INFO[pos.card.element]?.emoji}</span>
                    <span className="font-semibold text-stone-700 text-sm">{pos.card.name_zh}</span>
                    <span className="text-xs text-stone-400">· {pos.label}位</span>
                    {pos.isReversed && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full">逆位</span>}
                  </div>
                  <div className="p-3 space-y-2">
                    {cardHerbs.map(({ herb }) => (
                      <button
                        key={`${herb.id}-${pos.id}`}
                        onClick={() => setSelectedHerb(selectedHerb?.id === herb.id ? null : herb)}
                        className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                          selectedHerb?.id === herb.id
                            ? 'border-amber-400 bg-amber-50 shadow-md'
                            : 'border-stone-100 hover:border-amber-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{ELEMENT_INFO[herb.element]?.emoji}</span>
                          <span className="font-semibold text-stone-800">{herb.name_zh}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ELEMENT_INFO[herb.element]?.bg} ${ELEMENT_INFO[herb.element]?.color}`}>
                            {ELEMENT_INFO[herb.element]?.name}元素
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                          {herb.effects.split('\n\n')[0]}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {herb.properties.slice(0, 3).map((p, i) => (
                            <span key={i} className="text-[9px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded-full">{p}</span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Restart */}
        <button onClick={onRestart} className="btn-primary w-full text-center">
          重新解读
        </button>
      </div>

      {/* Herb Detail Modal */}
      {selectedHerb && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={() => setSelectedHerb(null)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[70vh] overflow-y-auto p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Close handle */}
            <div className="w-10 h-1 bg-stone-300 rounded-full mx-auto mb-4 sm:hidden" />

            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${ELEMENT_INFO[selectedHerb.element].bg}`}>
                {ELEMENT_INFO[selectedHerb.element].emoji}
              </div>
              <div>
                <h3 className="font-bold text-stone-800 text-lg">{selectedHerb.name_zh}</h3>
                <span className={`text-xs font-medium ${ELEMENT_INFO[selectedHerb.element].color}`}>
                  {ELEMENT_INFO[selectedHerb.element].name}元素草药
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Properties */}
              <div>
                <div className="text-xs text-stone-400 mb-1.5">功效属性</div>
                <div className="flex flex-wrap gap-1">
                  {selectedHerb.properties.map((p, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-full">{p}</span>
                  ))}
                </div>
              </div>

              {/* Effects */}
              <div>
                <div className="text-xs text-stone-400 mb-1.5">能量作用</div>
                <p className="text-sm text-stone-600 leading-relaxed">{selectedHerb.effects}</p>
              </div>

              {/* Usage */}
              <div>
                <div className="text-xs text-stone-400 mb-1.5">使用方式</div>
                <p className="text-sm text-stone-600">{selectedHerb.usage}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedHerb(null)}
              className="mt-4 w-full py-2.5 bg-stone-100 text-stone-600 rounded-xl font-medium text-sm"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
