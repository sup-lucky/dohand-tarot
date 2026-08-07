import { useState } from 'react'
import spreads from '../data/spreads.json'
import SpecularButton from '../components/SpecularButton'

export default function HomePage({ onStart }) {
  const [modePick, setModePick] = useState(null)

  const handleSpreadClick = (sp) => {
    if (sp.modes.length > 1) {
      setModePick(sp)
    } else {
      onStart(sp.id, sp.modes[0])
    }
  }

  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center px-6 py-16 relative z-10">

      {/* Brand pill */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-16
        border border-white/10 backdrop-blur-md"
        style={{ background: 'oklch(16% 0.01 90 / 0.35)' }}>
        <span className="w-1 h-1 rounded-full" style={{ background: 'oklch(82% 0.04 162)', opacity: 0.7 }}></span>
        <span className="text-[9px] tracking-[0.28em] font-medium" style={{ color: 'oklch(85% 0.01 90)' }}>
          TAROT · HERB · HEALING
        </span>
        <span className="w-1 h-1 rounded-full" style={{ background: 'oklch(82% 0.04 162)', opacity: 0.7 }}></span>
      </div>

      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-[4rem] leading-none tracking-tight text-white"
          style={{ fontFamily: `"Arial Black", "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", sans-serif`, fontWeight: 900 }}>
          DO!<span style={{ color: 'oklch(82% 0.04 162)' }}>Hand</span>
        </h1>
        <p className="mt-5 text-xs tracking-[0.22em]"
          style={{ color: 'oklch(95% 0.01 90 / 0.9)', textShadow: '0 1px 4px oklch(0% 0 0 / 0.4)' }}>
          塔罗四元素 · 植物草药指引
        </p>
        <span className="block w-px h-10 mx-auto mt-6"
          style={{ background: 'linear-gradient(to bottom, oklch(100% 0 0 / 0.25), transparent)' }}></span>
      </div>

      {/* Spread selection */}
      {!modePick ? (
        <div className="flex gap-5 flex-wrap justify-center max-w-[780px] w-full">
          {spreads.map(sp => (
            <div key={sp.id} className="flex-1 min-w-[190px] max-w-[255px]">
              <SpecularButton
                size="lg"
                radius={18}
                baseColor="#3a3a3a"
                lineColor="#e0e0e0"
                textColor="#f5f5f5"
                intensity={0.9}
                shineSize={10}
                shineFade={40}
                thickness={1}
                speed={0.35}
                followMouse
                proximity={250}
                onClick={() => handleSpreadClick(sp)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: '"PingFang SC","Hiragino Sans GB","Noto Sans SC",sans-serif', fontSize: '1.05rem', fontWeight: 600, letterSpacing: '0.04em' }}>
                    {sp.name}
                  </span>
                  <span style={{ fontFamily: 'inherit', fontSize: '0.7rem', fontWeight: 400, letterSpacing: '0.06em', opacity: 0.6 }}>
                    {sp.description}
                  </span>
                </div>
              </SpecularButton>
            </div>
          ))}
        </div>
      ) : (
        /* Mode selection for multi-mode spreads */
        <div className="flex flex-col items-center gap-4 w-[240px]">
          <p className="text-[11px] tracking-[0.15em] mb-2"
            style={{ color: 'oklch(90% 0.01 90 / 0.6)' }}>
            你想探索什么
          </p>
          {modePick.modes.map(m => (
            <SpecularButton
              key={m}
              size="md"
              radius={9999}
              baseColor="#3a3a3a"
              lineColor="#e0e0e0"
              textColor="#f5f5f5"
              intensity={0.8}
              shineSize={8}
              shineFade={35}
              thickness={1}
              speed={0.3}
              followMouse
              proximity={250}
              onClick={() => onStart(modePick.id, m)}
            >
              {modePick.modeLabels[m]}
            </SpecularButton>
          ))}
          <button
            onClick={() => setModePick(null)}
            className="text-[10px] mt-3 opacity-40 hover:opacity-70 transition-opacity text-white"
          >
            ← 返回
          </button>
        </div>
      )}

      {/* Footer branding */}
      <div className="fixed bottom-8 left-0 right-0 flex items-baseline justify-center gap-2 z-10">
        <span className="text-sm tracking-[0.04em]"
          style={{ fontFamily: `"Arial Black", "Helvetica Neue", Arial, sans-serif`, fontWeight: 900, color: 'oklch(90% 0.01 90)', opacity: 0.4 }}>
          DO!<span style={{ color: 'oklch(80% 0.01 90)' }}>Hand</span>
        </span>
        <span className="text-[10px] tracking-[0.14em]"
          style={{ fontFamily: '"PingFang SC","Hiragino Sans GB","Noto Sans SC",sans-serif', color: 'oklch(85% 0.01 90)', opacity: 0.35 }}>
          内部学员使用
        </span>
      </div>
    </div>
  )
}
