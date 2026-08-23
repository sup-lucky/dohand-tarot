import { useState, useMemo, useEffect, useRef } from 'react'
import spreads from '../data/spreads.json'
import allCards from '../data/cards.json'
import allHerbs from '../data/herbs.json'
import { deepseekProxy } from '../services/supabase'
import { getSession } from '../components/AuthGate'

const ELEMENT_INFO = {
  fire: { emoji: '🔥', name: '火', color: 'text-red-600', bg: 'bg-red-50', desc: '行动·热情·目的', belief: '行动信念' },
  water: { emoji: '💧', name: '水', color: 'text-blue-600', bg: 'bg-blue-50', desc: '情感·直觉·潜意识', belief: '情绪信念' },
  air: { emoji: '💨', name: '风', color: 'text-sky-600', bg: 'bg-sky-50', desc: '思维·沟通·逻辑', belief: '思维信念' },
  earth: { emoji: '🌿', name: '土', color: 'text-green-600', bg: 'bg-green-50', desc: '物质·金钱·工作', belief: '价值信念' },
}

// Get the right positions array based on spread and mode
const getPositions = (spread, mode) => {
  if (spread.id === 'four-elements') {
    return mode === 'phase1' ? spread.positions_phase1 : spread.positions_phase2
  }
  return spread.positions
}

export default function ResultPage({ reading, question, onRestart, onBack }) {
  const [selectedHerb, setSelectedHerb] = useState(null)
  const [aiInterpretation, setAiInterpretation] = useState(null) // null=idle, 'loading'|string|'error'
  const aiFetched = useRef(false)

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
  const positions = getPositions(spread, mode)

  // Determine the meaning field to use for each position
  const getMeaning = (cardData, pos) => {
    if (!cardData?.card) return null

    if (spread.id === 'four-elements') {
      if (mode === 'phase1') {
        return cardData.isReversed
          ? cardData.card.meaning_phase1?.reversed
          : cardData.card.meaning_phase1?.upright
      }
      if (mode === 'phase2') {
        return cardData.isReversed
          ? cardData.card.meaning_phase2?.reversed
          : cardData.card.meaning_phase2?.upright
      }
    }

    if (spread.id === 'interpersonal-mirror') {
      // Projection card uses meaning_mirror, detail cards use meaning_phase1
      if (pos.id === 'projection') {
        return cardData.isReversed
          ? cardData.card.meaning_mirror?.reversed
          : cardData.card.meaning_mirror?.upright
      }
      return cardData.isReversed
        ? cardData.card.meaning_phase1?.reversed
        : cardData.card.meaning_phase1?.upright
    }

    // Salon: keep original meaning_improve
    if (spread.id === 'salon') {
      return cardData.isReversed
        ? cardData.card.meaning_improve.reversed
        : cardData.card.meaning_improve.upright
    }

    return null
  }

  // Build enriched position data
  const enrichedPositions = positions.map(pos => {
    const cardData = reading.cards[pos.id]
    return {
      ...pos,
      card: cardData?.card || null,
      isReversed: cardData?.isReversed || false,
      meaning: getMeaning(cardData, pos),
    }
  })

  // AI interpretation fetch
  useEffect(() => {
    if (!question || aiFetched.current) return
    aiFetched.current = true
    setAiInterpretation('loading')

    const cardList = enrichedPositions
      .filter(p => p.card) // 强调牌也参与解读
      .map(p => ({
        position: p.label,
        positionDesc: p.desc,
        name: p.card.name_zh,
        isReversed: p.isReversed,
      }))

    if (cardList.length === 0) {
      setAiInterpretation(null)
      return
    }

    // Build prompt
    const cardDescriptions = cardList.map((c, i) =>
      `第${i + 1}张：【${c.position}】${c.name}（${c.isReversed ? '逆位' : '正位'}）——牌位含义：${c.positionDesc}`
    ).join('\n')

    const isPhase2 = spread.id === 'four-elements' && reading.mode === 'phase2'

    let systemPrompt
    if (isPhase2) {
      systemPrompt = `你是 DO!Hand 工作室的塔罗解读师。解读风格：温暖、有洞察力、务实落地。

核心理念：这是「植物信念觉察法」的第二阶段——解决方法。客户已经看清了自己的信念，现在要往前走。这一阶段抽到的每一张牌，都是一条「建议」——它告诉客户在这个方向上，最该采取的态度是什么。解读目的是帮客户看清「接下来在每个方向具体怎么做」，把觉察转化为行动。语言要像朋友给建议——真诚、有温度、可执行、不玄乎。

牌阵：植物信念觉察法（第二阶段 · 解决方法）
核心问题：「每一种元素对应的解决方法是什么？」帮助客户找到每个方向的具体改变方式。
四元素方向：权杖=在行动与热情上要做什么调整，圣杯=在情感与内心上要有怎样的转变，宝剑=在思维与沟通上如何改变认知模式，星币=在物质与现实层面如何落地行动。

解读规则（重要）——每张牌都是一条建议，要尊重牌自己的语言，不要套统一模板：
- 按牌本身的含义来给建议。例如圣杯四的建议是「静下来、向内看、别急着做决定」，而不是「主动一点」；权杖牌往往建议「行动、往前推进」，宝剑牌往往建议「想清楚、沟通表达」，星币牌往往建议「落地、务实、一步步来」。
- 正位 = 这条建议值得采纳，就往牌义指的方向走（比如圣杯四正位 = 建议你停一停、向内看）；
- 逆位 = 方向相反，往往是「你已经在这个状态里待太久了，需要走出来或松一松」（比如圣杯四逆位 = 你停滞太久了，该动起来、重新打开自己）。
- 切记：不要把「正位」一律写成「主动去做」——有些牌的正位恰恰是「安静、停下、观察」，这才是它给的建议。

请按每张牌的顺序解读，紧密结合客户的具体问题展开。每段150-250字，温暖真诚，先点出这张牌给出的建议是什么，再给 1-2 个具体可做的动作。最后加一段「解决之道」：2-3 句话把四个方向合成「接下来该怎么走」的行动指引。`
    } else if (spread.id === 'interpersonal-mirror') {
      systemPrompt = `你是 DO!Hand 工作室的塔罗解读师。解读风格：温暖、有洞察力、真诚不玄乎。

核心理念：这是一套「关系」牌阵，解读必须紧扣客户问的具体问题和关系类型（爱情/友情/亲情）展开，而不是泛泛地讲牌义。客户抽到的每一张牌都不是偶然——它们背后都映照着客户内心深处的「核心信念」：关于他自己（值不值得被爱、够不够好）、关于这段关系（会不会离开）、关于感情与爱本身（爱意味着什么）。这些核心信念在无意识中驱动着客户的感受与选择，显化出了他此刻正在经历的这段关系。语言要像朋友聊天，有温度、说到点子上。

牌阵：人际镜像阵（${spread.modeLabels[reading.mode]}）
解读方法——每一张牌都要从表面牌义往深挖，点出它所反映的核心信念：
- 投射牌（宫廷牌）= 客户把对方投射成了什么样的角色——在客户眼里，对方是什么性格、什么样的形象；并点出这个投射反映了他内心深处的什么核心信念；
- 三张细节牌（小牌）= 三面镜子，每张牌就按它本身的含义解读，同时在「这一张牌的解答里」点出它映照出的核心信念是什么——关于自己、关于这段关系、关于感情/爱。
注意：每张牌可能映照出不同的核心信念，请分别写出来，不要归并成一条。

请始终回扣客户的具体问题，落在当下这段关系里说。

请按每张牌的顺序解读，紧密结合客户的具体问题展开。每段150-250字，温暖真诚。每一张牌的解答都要挖到它反映的核心信念，不要只在最后总结一句。`
    } else if (spread.id === 'four-elements') {
      systemPrompt = `你是 DO!Hand 工作室的塔罗解读师。解读风格：温暖、有洞察力、真诚不玄乎。

核心理念：这是「植物信念觉察法」的第一阶段——觉察信念。客户抽到的每一张牌都不是偶然，它们从行动、情绪、思维、物质四个方向照进来，共同映照出客户此刻「秉持着什么核心信念」，才显化出了他当下的处境（比如工作不顺想离开又害怕、担心学员/家庭/事业）。解读目的不是讲牌义，而是帮客户看见那几条藏着的信念，看见它们曾经在保护他。语言要像朋友聊天，有温度、说到点子上。

牌阵：植物信念觉察法（第一阶段 · 觉察信念）
核心问题：「我现在持有什么样的信念，导致现在的情况发生？」

四元素方向（每个方向都要挖出一条信念）：
- 权杖 = 行动与热情：他在「做事、行动」上秉持什么信念
- 圣杯 = 情绪与内心：他在「感受、关系」上秉持什么信念
- 宝剑 = 思维与沟通：他在「想法、表达」上秉持什么信念
- 星币 = 物质与自我价值：他在「价值、现实」上秉持什么信念
- 强调牌 = 四个方向里，哪个方向的信念此刻最主导、最需要先被看见

解读方法——每一张牌都按「场景 → 信念 → 显化」三步走：
1. 场景（一句话带过）：用牌的画面，点出客户此刻在这个方向处于什么状态。例如权杖七——你现在像被多面夹击，处在竞争和压力里，硬撑着不后退。
2. 核心信念（重点，写成客户会脱口而出的第一人称原话）：这张牌底下真正藏着的那条信念。用「我必须…否则…」「只有…我才…」「…是不安全的」「如果我…就会…」这类句式写，不要写成心理诊断腔（别写「你缺乏安全感」这种标签）。
3. 显化：这条信念是怎么造成了客户当下的处境——把它和客户问的具体问题接起来。

正逆位规则：
- 正位 = 这条信念客户基本认同，正在明面上运作，他自己也知道；
- 逆位 = 这条信念被压着或反着走，客户自己可能没意识到，或者它正在松动。逆位不是「坏」或「受阻」，而是「藏得更深、更需要被看见」。

硬性要求：
- 四个方向必须挖出四条不同侧面的信念（做事/感受/想法/价值），措辞不能重复，不能四张牌都写成同一条。
- 每条信念之后，点一句「它当初是在保护你什么」——信念没有对错，它曾经有用。
- 强调牌单独解读，点出哪个方向的信念此刻最主导、要松先从这里松。

请始终回扣客户的具体问题，落在当下处境里说，不要泛泛讲牌义。

格式要求（纯文本，不要用 markdown 加粗符号）：
- 每张牌一段，段首标明牌位和牌名，例如「【权杖·权杖七】」；
- 每条核心信念单独一行，写成「核心信念：「…」」，方便学员直接念给客户听；
- 最后加一段「主信念」：点出四条信念里哪一条是根，另外三条其实在为它服务（2-3 句）。

每段 150-250 字，温暖真诚。`
    } else {
      systemPrompt = `你是 DO!Hand 工作室的塔罗解读师。解读风格：温暖、有洞察力，以「自我觉察」和「信念显化」为核心。

核心理念：帮助客户看见自己当下的信念和认知模式。每一张牌都是客户内在状态的镜子——反映的是他们此刻持有什么样的想法、情绪、假设，才显化出了当前的生活境遇。解读目的是帮助客户找到「核心信念」——那个一直在无意识中驱动他们行为、情绪和选择的底层设定。语言要像朋友聊天——真诚、有温度、不玄乎。

牌阵：沙龙牌阵。帮助客户看清现状和改进方向。

请按每张牌的顺序解读，紧密结合客户的具体问题展开。每段150-250字，温暖真诚。最后加一段「核心信念提示」：2-3句话总结客户最需要觉察到的深层信念。`
    }

    const userMessage = `我的问题是：${question}\n\n我抽到的牌：\n${cardDescriptions}\n\n请为我详细解读。`

    const phone = getSession()?.phone || ''
    deepseekProxy({ phone, system: systemPrompt, user: userMessage })
      .then(text => setAiInterpretation(text))
      .catch(err => {
        console.warn('AI 解读调用失败:', err.message)
        // 保存后端返回的中文错误（如限额提示），否则退回预写解读
        setAiInterpretation(err.message || 'error')
      })
  }, [])

  // Element analysis (for four-elements spread)
  const elementCount = useMemo(() => {
    const count = { fire: 0, water: 0, air: 0, earth: 0 }
    enrichedPositions.forEach(p => {
      if (p.card?.element && count[p.card.element] !== undefined) {
        count[p.card.element]++
      }
    })
    return count
  }, [enrichedPositions])

  const dominantElement = useMemo(() => {
    const sorted = Object.entries(elementCount).sort((a, b) => b[1] - a[1])
    return sorted[0][1] > 0 ? sorted[0][0] : null
  }, [elementCount])

  // Get emphasis card's element (Phase 1 only)
  const emphasisElement = useMemo(() => {
    if (spread.id === 'four-elements' && mode === 'phase1') {
      const empCard = reading.cards['emphasis']
      return empCard?.card?.element || null
    }
    return null
  }, [spread.id, mode, reading.cards])

  // Herb recommendations
  const herbRecommendations = useMemo(() => {
    const results = []
    const seenHerbs = new Set()

    enrichedPositions.forEach(pos => {
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

    // Phase 1: Sort so emphasis element herbs come first
    if (emphasisElement) {
      results.sort((a, b) => {
        const aMatch = a.herb.element === emphasisElement ? 0 : 1
        const bMatch = b.herb.element === emphasisElement ? 0 : 1
        return aMatch - bMatch
      })
    }

    return results
  }, [enrichedPositions, emphasisElement])

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
        {/* AI 个性化解读 */}
        {aiInterpretation === 'loading' && (
          <div className="bg-white rounded-2xl border border-amber-200 p-6 text-center">
            <div className="animate-pulse flex flex-col items-center gap-3">
              <span className="text-3xl">🔮</span>
              <p className="text-sm text-stone-600 font-medium">正在根据你的问题生成专属解读…</p>
              <p className="text-xs text-stone-400">结合牌面与你描述的具体困惑，DeepSeek 正在深度分析中</p>
              <div className="flex gap-1 mt-2">
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <div className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        )}

        {aiInterpretation && aiInterpretation !== 'loading' && aiInterpretation !== 'error' && !aiInterpretation.startsWith('今日解读次数') && (
          <div className="bg-white rounded-2xl border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🤖</span>
              <h3 className="font-semibold text-stone-700">AI 深度解读</h3>
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">基于你的问题</span>
            </div>
            {question && (
              <div className="mb-4 p-3 bg-amber-50 rounded-xl">
                <span className="text-[10px] text-amber-500 tracking-wider">你的问题</span>
                <p className="text-sm text-stone-600 mt-1">「{question}」</p>
              </div>
            )}
            <div className="text-sm text-stone-600 leading-relaxed space-y-3 whitespace-pre-line">
              {aiInterpretation}
            </div>
          </div>
        )}

        {aiInterpretation && aiInterpretation.startsWith('今日解读次数') && (
          <div className="bg-white rounded-2xl border border-amber-200 p-4 text-center">
            <p className="text-sm text-amber-600">{aiInterpretation}</p>
          </div>
        )}
        {aiInterpretation === 'error' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-4 text-center">
            <p className="text-xs text-stone-400">AI 解读暂时不可用，以下为通用解读</p>
          </div>
        )}

        {/* Element Overview (four-elements spread only) */}
        {spread.id === 'four-elements' && (
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
                ，{ELEMENT_INFO[dominantElement].desc}{mode === 'phase2' ? '方向的解法最关键' : '方面的议题最为突出'}
              </p>
            )}
            {emphasisElement && (
              <p className="text-xs text-amber-600 mt-2 text-center font-medium">
                ✦ 强调牌指向 <span className={`font-semibold ${ELEMENT_INFO[emphasisElement].color}`}>{ELEMENT_INFO[emphasisElement].name}元素</span>
                —— 这是当前最需要被看见的核心方向
              </p>
            )}
          </div>
        )}

        {/* Mirror spread: Projection card highlighted section */}
        {spread.id === 'interpersonal-mirror' && (() => {
          const projPos = enrichedPositions.find(p => p.id === 'projection')
          return (
            <div className="bg-white rounded-2xl border-2 border-purple-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🪞</span>
                <h3 className="font-semibold text-stone-700">投射牌 · 对方在我心中的形象</h3>
              </div>
              {projPos?.card ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-stone-800">{projPos.card.name_zh}</span>
                    {projPos.isReversed && <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full">逆位</span>}
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full">宫廷牌</span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    {projPos.card.keywords.map((kw, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full">{kw}</span>
                    ))}
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">{projPos.meaning || '解读暂无'}</p>
                </>
              ) : (
                <p className="text-sm text-stone-400">未抽牌</p>
              )}
            </div>
          )
        })()}

        {/* Herb Recommendations */}
        <div>
          <h3 className="font-semibold text-stone-700 mb-3">
            🌿 草药指引
            <span className="text-xs text-stone-400 font-normal ml-2">每株草药对应一个方向的信念</span>
          </h3>

          {emphasisElement && herbRecommendations.some(h => h.herb.element === emphasisElement) && (
            <p className="text-xs text-amber-600 mb-3 px-3 py-2 bg-amber-50 rounded-xl">
              ✦ 强调牌指向<strong>{ELEMENT_INFO[emphasisElement].name}元素 · {ELEMENT_INFO[emphasisElement].belief}</strong>——以下同方向草药已优先列出
            </p>
          )}

          <div className="space-y-3">
            {(() => {
              // Sort positions: emphasis-element herbs first
              const sorted = [...enrichedPositions].sort((a, b) => {
                const aHerbs = herbRecommendations.filter(h => h.forCard?.id === a.card?.id)
                const bHerbs = herbRecommendations.filter(h => h.forCard?.id === b.card?.id)
                if (!emphasisElement) return 0
                const aMatch = aHerbs.some(h => h.herb.element === emphasisElement) ? 0 : 1
                const bMatch = bHerbs.some(h => h.herb.element === emphasisElement) ? 0 : 1
                return aMatch - bMatch
              })
              return sorted.filter(p => p.card).map(pos => {
                const cardHerbs = herbRecommendations.filter(h => h.forCard?.id === pos.card.id)
                if (cardHerbs.length === 0) return null
              return (
                <div key={pos.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                  <div className="px-4 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                    <span className="text-sm">{pos.card.element ? ELEMENT_INFO[pos.card.element]?.emoji : '🪞'}</span>
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
                            {ELEMENT_INFO[herb.element]?.name}元素 · {ELEMENT_INFO[herb.element]?.belief}
                          </span>
                          {emphasisElement && herb.element === emphasisElement && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-600 rounded-full">✦ 强调</span>
                          )}
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
            })})()}
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
                  {ELEMENT_INFO[selectedHerb.element].name}元素草药 · 对应{ELEMENT_INFO[selectedHerb.element].belief}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {/* Belief tie-in */}
              <div className="p-3 bg-amber-50 rounded-xl">
                <p className="text-xs text-stone-600 leading-relaxed">
                  <span className="font-semibold text-amber-600">信念觉察：</span>
                  这株{ELEMENT_INFO[selectedHerb.element].name}元素草药，对应你「{ELEMENT_INFO[selectedHerb.element].belief}」——在使用它的过程中，陪伴你去觉察和松开这个方向的信念。
                </p>
              </div>

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

      {/* 底部品牌标识 */}
      <div className="flex flex-col items-center gap-2 py-6 mt-4">
        <span className="text-sm tracking-[0.05em] text-stone-400"
          style={{ fontFamily: `"Arial Black", "Helvetica Neue", Arial, sans-serif`, fontWeight: 900 }}>
          DO!<span style={{ color: '#b8a88a' }}>Hand</span>
        </span>
        <span className="text-[10px] tracking-[0.15em] text-stone-300">内部学员使用</span>
      </div>
    </div>
  )
}
