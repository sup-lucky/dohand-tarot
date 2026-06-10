import { useState } from 'react'
import spreads from '../data/spreads.json'

export default function HomePage({ onStart }) {
  const [hovered, setHovered] = useState(null)
  const [modePick, setModePick] = useState(null) // spread needing mode selection

  const handleSpreadClick = (sp) => {
    if (sp.modes.length > 1) {
      setModePick(sp)
    } else {
      onStart(sp.id, sp.modes[0])
    }
  }

  return (
    <div className="w-full h-screen overflow-hidden relative"
      style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #fdf6e3 20%, #eaf4f0 50%, #f0f4f8 75%, #fdf6e3 100%)' }}>


      {/* 主内容 */}
      <div className="relative z-10 w-full h-full flex items-center justify-center px-6">
        <div className="flex flex-col items-center text-center">

          <span className="inline-block px-3 py-1 rounded-full bg-white/40 backdrop-blur-sm border border-white/30 text-[10px] tracking-[0.25em] text-stone-400 mb-8">
            TAROT · HERB · HEALING
          </span>

          <h1 className="text-[3.2rem] font-bold leading-none tracking-tight text-[#4a3a2a] mb-3"
            style={{ fontFamily: "'STSong', 'Songti SC', 'SimSun', serif" }}>
            DO!<span className="text-[#7a6a50]">Hand</span>
          </h1>

          <p className="text-xs tracking-[0.25em] text-stone-400 mb-10">塔罗四元素 · 植物草药指引</p>

          {!modePick ? (
            /* 牌阵列表 */
            <div className="flex flex-col gap-3 w-[180px]">
              {spreads.map(sp => (
                <button
                  key={sp.id}
                  onClick={() => handleSpreadClick(sp)}
                  onMouseEnter={() => setHovered(sp.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`px-6 py-3.5 rounded-full border transition-all duration-200 active:scale-95 ${
                    hovered === sp.id
                      ? 'border-amber-300 bg-white/80 shadow-xl shadow-amber-100/40'
                      : 'border-stone-200/30 bg-white/30 active:border-amber-300 active:bg-white/70 active:shadow-lg'
                  }`}
                >
                  <span className={`text-sm tracking-[0.1em] transition-colors duration-200 ${
                    hovered === sp.id ? 'text-[#4a3a2a]' : 'text-stone-500'
                  }`} style={{ fontFamily: "'STSong', 'Songti SC', serif" }}>
                    {sp.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            /* 模式选择（仅多模式牌阵） */
            <div className="flex flex-col items-center gap-4 w-[200px]">
              <p className="text-xs tracking-[0.15em] text-stone-400">— 你想探索什么 —</p>
              {modePick.modes.map(m => (
                <button
                  key={m}
                  onClick={() => onStart(modePick.id, m)}
                  className="w-full px-6 py-3 rounded-full border border-stone-200/30 bg-white/30
                    active:scale-95 active:border-amber-300 active:bg-white/70 active:shadow-lg
                    transition-all duration-200"
                >
                  <span className="text-sm tracking-[0.05em] text-stone-600"
                    style={{ fontFamily: "'STSong', 'Songti SC', serif" }}>
                    {modePick.modeLabels[m]}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setModePick(null)}
                className="text-[10px] text-stone-300 mt-2 active:text-stone-500"
              >
                ← 返回
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
