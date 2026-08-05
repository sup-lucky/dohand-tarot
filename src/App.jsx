import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useCallback, useEffect } from 'react'
import HomePage from './pages/HomePage'
import SelectCards from './pages/SelectCards'
import ResultPage from './pages/ResultPage'
import AuthGate, { getSession } from './components/AuthGate'

export default function App() {
  const [reading, setReading] = useState(null)
  const [question, setQuestion] = useState('')
  const [authed, setAuthed] = useState(false)
  const [checking, setChecking] = useState(true)
  const navigate = useNavigate()

  // 检查是否有有效登录态
  useEffect(() => {
    const session = getSession()
    if (session) {
      setAuthed(true)
    }
    setChecking(false)
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
    <Routes>
      <Route path="/" element={<HomePage onStart={startReading} />} />
      <Route path="/select" element={<SelectCards reading={reading} question={question} setQuestion={setQuestion} onSelect={selectCard} onFinish={finishReading} onBack={() => navigate('/')} />} />
      <Route path="/result" element={<ResultPage reading={reading} question={question} onRestart={resetReading} onBack={() => navigate('/select')} />} />
    </Routes>
  )
}
