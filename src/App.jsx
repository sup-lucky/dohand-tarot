import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import HomePage from './pages/HomePage'
import AuthGate, { getSession } from './components/AuthGate'

// 选牌页/结果页按需加载，卡牌+草药数据（约 270KB）不再阻塞首屏
const SelectCards = lazy(() => import('./pages/SelectCards'))
const ResultPage = lazy(() => import('./pages/ResultPage'))

// 背景图 — import 确保 dev 和 production 路径都正确
import bgImage from '/IMG_8608.jpeg'

export default function App() {
  const [reading, setReading] = useState(null)
  const [question, setQuestion] = useState('')
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  // 设置全局背景图
  useEffect(() => {
    document.documentElement.style.setProperty('--bg-image', `url(${bgImage})`)
  }, [])

  // 检查是否有有效登录态
  useEffect(() => {
    const session = getSession()
    if (session) {
      setAuthed(true)
    }
    setChecking(false)
  }, [])

  // 首屏渲染后后台静默预取选牌/结果页（含卡牌+草药数据），点牌阵时无需等待
  useEffect(() => {
    const timer = setTimeout(() => {
      import('./pages/SelectCards').catch(() => {})
      import('./pages/ResultPage').catch(() => {})
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const startReading = useCallback((spreadId, mode) => {
    setReading({ spreadId, mode, cards: {} })
    setQuestion('')
    navigate('/select')
  }, [navigate])

  const selectCard = useCallback((positionId, card, isReversed) => {
    setReading(prev => ({ ...prev, cards: { ...prev.cards, [positionId]: { card, isReversed } } }))
  }, [])

  const finishReading = useCallback(() => navigate('/result'), [navigate])
  const resetReading = useCallback(() => { setReading(null); setQuestion(''); navigate('/') }, [navigate])

  // 检查中显示空白（瞬间完成，基本看不到）
  if (checking) return null

  // 未登录 → 显示邀请码验证页
  if (!authed) {
    return <AuthGate onLogin={() => setAuthed(true)} />
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white/50 text-sm">加载中…</div>}>
      <Routes>
        <Route path="/" element={<HomePage onStart={startReading} />} />
        <Route path="/select" element={<SelectCards reading={reading} question={question} setQuestion={setQuestion} onSelect={selectCard} onFinish={finishReading} onBack={() => navigate('/')} />} />
        <Route path="/result" element={<ResultPage reading={reading} question={question} onRestart={resetReading} onBack={() => navigate('/select')} />} />
      </Routes>
    </Suspense>
  )
}
