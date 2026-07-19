import { useState, useEffect, useRef, useCallback } from 'react'

const ORACLE_HERBS = [
  {
    name: '迷迭香', en: 'Rosemary', tag: '记忆·净化·保护',
    desc: '今天，迷迭香提醒你——清晰的头脑是你最好的工具。相信你的记忆和判断力。',
    draw: ({ color, darkColor }) => (
      <g>
        {/* Main stem */}
        <path d="M55 260 C53 220 57 180 55 140 C53 100 58 60 55 20" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {/* Side branches */}
        {[220,180,140,100,60,30].map((y, i) => {
          const flip = i % 2 === 0 ? 1 : -1
          const angle = flip * (20 + i * 3)
          const rad = angle * Math.PI / 180
          const len = 30 + i * 2
          const ex = 55 + len * Math.cos(rad)
          const ey = y - len * Math.sin(rad)
          return (
            <g key={i}>
              <line x1="55" y1={y} x2={ex} y2={ey} stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
              {[-0.2,0.2].map((off, j) => (
                <line key={j} x1={55 + (ex-55)*0.5} y1={y + (ey-y)*0.5 + off*12}
                  x2={55 + (ex-55)*0.8 + off*5} y2={y + (ey-y)*0.8} stroke={color} strokeWidth="0.8" strokeLinecap="round" opacity="0.7"/>
              ))}
            </g>
          )
        })}
        {/* Small blue flowers at tips */}
        {[200,160,120,80].map((y, i) => (
          <g key={`f${i}`}>
            <circle cx={35 + i*8} cy={y-5} r="3" fill="#7a8aaa" opacity="0.6"/>
            <circle cx={35 + i*8 + 3} cy={y-8} r="2" fill="#9aaaba" opacity="0.5"/>
          </g>
        ))}
      </g>
    )
  },
  {
    name: '薰衣草', en: 'Lavender', tag: '平静·安眠·疗愈',
    desc: '薰衣草的紫色光芒在今天为你而亮。放慢呼吸，让焦虑在花香中消散。',
    draw: ({ color, darkColor }) => (
      <g>
        <path d="M55 260 C53 240 58 200 55 160 C53 120 57 80 55 40" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
        {[240,220,200,180,160,140,120,100].map((y, i) => {
          const sx = y < 160 ? 7 - i * 0.8 : 3
          return (
            <g key={i}>
              <ellipse cx={55 - sx} cy={y} rx="4" ry="6" fill="#9a8aba" opacity="0.6"/>
              <ellipse cx={55 + sx} cy={y} rx="4" ry="6" fill="#8a7aaa" opacity="0.5"/>
              <ellipse cx="55" cy={y-3} rx="4" ry="6" fill="#aa9aca" opacity="0.55"/>
            </g>
          )
        })}
        <ellipse cx="55" cy="40" rx="4" ry="6" fill="#baaada" opacity="0.5"/>
      </g>
    )
  },
  {
    name: '鼠尾草', en: 'Sage', tag: '净化·智慧·清理',
    desc: '白鼠尾草召唤你——是时候清理那些不再服务于你的旧能量了。',
    draw: ({ color }) => (
      <g>
        <path d="M55 260 C54 230 56 200 55 170 C54 140 56 110 55 80 C54 50 55 20 55 0" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        {[250,230,210,190,170,150,130,110,90,70,50,30].map((y, i) => (
          <g key={i}>
            <ellipse cx="55" cy={y} rx="14" ry="7" fill="#b8c8a8" opacity="0.5"/>
            <ellipse cx="55" cy={y} rx="10" ry="5" fill="#c8d8b8" opacity="0.4"/>
            <line x1="40" y1={y-2} x2="70" y2={y-2} stroke="#a0b890" strokeWidth="0.6" opacity="0.4"/>
          </g>
        ))}
      </g>
    )
  },
  {
    name: '洋甘菊', en: 'Chamomile', tag: '安抚·阳光·温柔',
    desc: '像阳光下的洋甘菊一样，今天你不需要用力。温柔对待自己就是最大的力量。',
    draw: ({ color }) => (
      <g>
        <path d="M55 260 C56 230 54 200 55 170 C56 140 54 110 55 80" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        <path d="M30 240 C32 220 28 200 32 180" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
        <path d="M75 230 C73 210 77 190 73 170" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7"/>
        {[240,220,180,170].map((y, i) => {
          const cx = i < 2 ? 31 : 74
          return (
            <g key={i}>
              {[0,60,120,180,240,300].map(deg => {
                const rad = deg * Math.PI / 180
                const px = cx + 8 * Math.cos(rad)
                const py = y + 8 * Math.sin(rad)
                return <ellipse key={deg} cx={px} cy={py} rx="4" ry="2" fill="#f5f0d0" opacity="0.6" transform={`rotate(${deg} ${px} ${py})`}/>
              })}
              <circle cx={cx} cy={y} r="4" fill="#f0d860" opacity="0.6"/>
            </g>
          )
        })}
        <circle cx="55" cy="80" r="5" fill="#f0d860" opacity="0.5"/>
        {[0,60,120,180,240,300].map(deg => {
          const rad = deg * Math.PI / 180
          return <ellipse key={deg} cx={55+6*Math.cos(rad)} cy={80+6*Math.sin(rad)} rx="3" ry="1.5" fill="#f5f0d0" opacity="0.5"/>
        })}
      </g>
    )
  },
  {
    name: '薄荷', en: 'Peppermint', tag: '清醒·活力·觉醒',
    desc: '薄荷的凉意穿透迷雾。今天你需要一份清醒的刺激，唤醒沉睡的灵感。',
    draw: ({ color, darkColor }) => (
      <g>
        <path d="M55 260 C54 230 56 200 55 170 C54 140 56 110 55 80 C54 50 56 20 55 -10" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
        {[240,210,180,150,120,90,60,30].map((y, i) => (
          <g key={i}>
            <ellipse cx="55" cy={y} rx="16" ry="8" fill="#9abd8a" opacity="0.4"/>
            <ellipse cx="55" cy={y} rx="12" ry="5" fill="#aad09a" opacity="0.35"/>
            <line x1="39" y1={y} x2="71" y2={y} stroke="#8aad78" strokeWidth="0.8" opacity="0.5"/>
            <line x1="42" y1={y-4} x2="68" y2={y-4} stroke="#8aad78" strokeWidth="0.6" opacity="0.3"/>
          </g>
        ))}
        <ellipse cx="55" cy="10" rx="10" ry="5" fill="#aad09a" opacity="0.35"/>
      </g>
    )
  },
  {
    name: '茉莉', en: 'Jasmine', tag: '爱·直觉·心扉',
    desc: '茉莉花的香气在今天为你而来。打开心扉，让爱和直觉引领你的方向。',
    draw: ({ color }) => (
      <g>
        <path d="M55 260 C53 230 58 200 55 170 C52 140 57 110 55 80 C53 50 56 30 55 0" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M40 250 C42 230 38 210 40 190" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6"/>
        <path d="M68 240 C66 220 70 200 68 180" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.6"/>
        {[240,220,200,180,190].map((y, j) => {
          const cx = j < 2 ? 41 : (j === 4 ? 55 : 68)
          return (
            <g key={j}>
              {[0,72,144,216,288].map(deg => {
                const rad = deg * Math.PI / 180
                return <ellipse key={deg} cx={cx + 8*Math.cos(rad)} cy={y + 8*Math.sin(rad)} rx="5" ry="3" fill="#f8f4f0" opacity="0.7"/>
              })}
              <circle cx={cx} cy={y} r="3" fill="#f0e8d0" opacity="0.7"/>
            </g>
          )
        })}
        <circle cx="55" cy="10" r="4" fill="#f0e8d0" opacity="0.5"/>
        {[0,72,144,216,288].map(deg => {
          const rad = deg * Math.PI / 180
          return <ellipse key={deg} cx={55+7*Math.cos(rad)} cy={10+7*Math.sin(rad)} rx="4" ry="2.5" fill="#f8f4f0" opacity="0.6"/>
        })}
      </g>
    )
  },
  {
    name: '玫瑰', en: 'Rose', tag: '自爱·美丽·热情',
    desc: '玫瑰在今天为你绽放。你值得被爱——首先来自你自己。',
    draw: ({ color, darkColor }) => (
      <g>
        <path d="M55 260 C54 235 56 210 55 185 C54 160 56 135 55 110" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        {[230,205].map(y => (
          <g key={y}>
            <ellipse cx="48" cy={y} rx="12" ry="6" fill="#c08080" opacity="0.25" transform={`rotate(-30 48 ${y})`}/>
            <ellipse cx="62" cy={y-8} rx="10" ry="5" fill="#d09090" opacity="0.2" transform={`rotate(20 62 ${y-8})`}/>
          </g>
        ))}
        {/* Main rose */}
        {[0,45,90,135,180,225,270,315].map(deg => {
          const rad = deg * Math.PI / 180
          const r = 14
          return <ellipse key={deg} cx={55 + r*0.4*Math.cos(rad)} cy={110 - r*0.4*Math.sin(rad)}
            rx="8" ry="6" fill="#d89090" opacity="0.4"
            transform={`rotate(${deg} ${55 + r*0.4*Math.cos(rad)} ${110 - r*0.4*Math.sin(rad)})`}/>
        })}
        <circle cx="55" cy="108" r="7" fill="#e0a0a0" opacity="0.5"/>
        <circle cx="55" cy="106" r="4" fill="#eab8b8" opacity="0.4"/>
      </g>
    )
  },
]

// Generic botanical herb card for herbs without custom SVG
function GenericHerb({ color }) {
  return (
    <g>
      <path d="M55 260 C54 235 56 210 55 185 C54 160 56 135 55 110 C54 85 56 60 55 35" stroke={color} strokeWidth="2.2" fill="none" strokeLinecap="round"/>
      <path d="M35 245 C38 220 33 200 36 180" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      <path d="M72 240 C69 215 74 195 71 175" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6"/>
      {[235,210,185,160,135].map((y, i) => {
        const cx = i % 2 === 0 ? 35 : 72
        return (
          <g key={i}>
            <ellipse cx={cx} cy={y} rx="10" ry="5" fill={color} opacity="0.25"/>
            <ellipse cx={cx+3} cy={y-2} rx="7" ry="3.5" fill={color} opacity="0.18"/>
          </g>
        )
      })}
      <ellipse cx="55" cy="40" rx="8" ry="5" fill={color} opacity="0.3"/>
    </g>
  )
}

// Use custom SVG if available, otherwise generic
const ALL_HERBS = [
  '迷迭香','薰衣草','鼠尾草','洋甘菊','薄荷','茉莉','玫瑰',
  '金盏花','罗勒','艾草','百里香','广藿香','乳香','雪松','香茅'
]

export default function HerbOracle({ onClose }) {
  const [phase, setPhase] = useState('entering')
  const [herb] = useState(() => {
    const customDraws = { '迷迭香':0,'薰衣草':1,'鼠尾草':2,'洋甘菊':3,'薄荷':4,'茉莉':5,'玫瑰':6 }
    const name = ALL_HERBS[Math.floor(Math.random() * ALL_HERBS.length)]
    return { name, hasCustom: name in customDraws }
  })
  const [swipeX, setSwipeX] = useState(0)
  const touchStart = useRef(null)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('revealed'), 1200)
    return () => clearTimeout(t1)
  }, [])

  const handleSwipeStart = useCallback((clientX) => { touchStart.current = clientX }, [])
  const handleSwipeMove = useCallback((clientX) => {
    if (touchStart.current !== null) {
      const diff = clientX - touchStart.current
      if (diff > 0) setSwipeX(diff)
    }
  }, [])
  const handleSwipeEnd = useCallback(() => {
    if (swipeX > 80) { setPhase('exiting'); setTimeout(onClose, 400) }
    else setSwipeX(0)
    touchStart.current = null
  }, [swipeX, onClose])

  const herbData = ORACLE_HERBS.find(h => h.name === herb.name)
  const color = '#8aaf6a'
  const darkColor = '#2a3520'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm"
      onMouseDown={e => handleSwipeStart(e.clientX)}
      onMouseMove={e => handleSwipeMove(e.clientX)}
      onMouseUp={handleSwipeEnd}
      onTouchStart={e => handleSwipeStart(e.touches[0].clientX)}
      onTouchMove={e => handleSwipeMove(e.touches[0].clientX)}
      onTouchEnd={handleSwipeEnd}>

      <div
        className={`relative w-[290px] sm:w-[320px] rounded-2xl overflow-hidden transition-all duration-500 ${
          phase === 'entering' ? 'scale-0 rotate-180 opacity-0 translate-y-40' :
          phase === 'exiting' ? 'scale-90 rotate-12 opacity-0 translate-x-[200px]' : ''
        }`}
        style={{
          transform: phase === 'revealed' ? `translateX(${swipeX}px) rotate(${swipeX * 0.05}deg)` : undefined,
          opacity: phase === 'revealed' ? Math.max(0, 1 - swipeX / 300) : undefined,
          background: 'linear-gradient(180deg, #141018 0%, #0c0a10 40%, #14101a 100%)',
          border: '2px solid rgba(140,120,160,0.25)',
          boxShadow: '0 0 80px rgba(100,70,140,0.25), 0 0 160px rgba(80,50,120,0.1)',
        }}
        onClick={e => e.stopPropagation()}>

        {/* Inner border */}
        <div className="absolute inset-2 rounded-xl border border-white/5 pointer-events-none" />

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 flex justify-between px-5">
          <span className="text-[9px] text-purple-400/40 tracking-[0.3em] uppercase">Herb Oracle</span>
          <span className="text-[9px] text-purple-400/40">✦</span>
        </div>

        {/* Herb Illustration — 70% */}
        <div className="flex items-center justify-center h-[260px] sm:h-[290px] relative mt-2">
          <div className="absolute w-24 h-24 rounded-full bg-purple-600/8 blur-[50px]" />
          <div className="absolute w-16 h-16 rounded-full bg-amber-500/6 blur-[35px] top-1/3" />

          <svg viewBox="0 0 110 270" className="w-[150px] h-[240px] sm:w-[170px] sm:h-[260px]">
            {herbData?.draw ? herbData.draw({ color, darkColor }) : <GenericHerb color={color} />}
          </svg>
        </div>

        {/* Divider */}
        <div className="mx-6 h-[1px] bg-gradient-to-r from-transparent via-purple-400/20 to-transparent" />

        {/* Name section */}
        <div className="py-4 px-6 text-center relative">
          <h3 className="text-xl font-bold text-purple-200/90 tracking-[0.12em] mb-0.5"
            style={{ fontFamily: "'STSong', 'Songti SC', serif", textShadow: '0 0 18px rgba(160,130,200,0.3)' }}>
            {herbData?.name || herb.name}
          </h3>
          <p className="text-[10px] text-purple-400/50 tracking-[0.2em] uppercase mb-1.5">{herbData?.en}</p>
          <p className="text-[10px] text-amber-400/50 tracking-[0.15em]">{herbData?.tag}</p>

          {phase === 'revealed' && (
            <p className="mt-2.5 text-[11px] text-purple-300/50 leading-relaxed italic"
              style={{ animation: 'fadeIn 0.6s 0.3s forwards', opacity: 0 }}>
              "{herbData?.desc}"
            </p>
          )}
        </div>

        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <div className="w-10 h-[0.5px] bg-purple-400/15" />
        </div>
      </div>

      {/* Hint */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
        <span className={`text-[11px] text-white/30 tracking-[0.1em] transition-opacity duration-300 ${phase === 'revealed' && swipeX === 0 ? 'opacity-100' : 'opacity-0'}`}>
          {swipeX > 30 ? '松手关闭 ✦' : '← 右滑关闭 →'}
        </span>
      </div>

      <style>{`@keyframes fadeIn { to { opacity:1; } }`}</style>
    </div>
  )
}
