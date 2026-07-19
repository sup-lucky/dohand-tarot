import { Routes, Route, useNavigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import HomePage from './pages/HomePage'
import SelectCards from './pages/SelectCards'
import ResultPage from './pages/ResultPage'

export default function App() {
  const [reading, setReading] = useState(null)
  const [question, setQuestion] = useState('')
  const navigate = useNavigate()

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

  return (
    <Routes>
      <Route path="/" element={<HomePage onStart={startReading} />} />
      <Route path="/select" element={<SelectCards reading={reading} question={question} setQuestion={setQuestion} onSelect={selectCard} onFinish={finishReading} onBack={() => navigate('/')} />} />
      <Route path="/result" element={<ResultPage reading={reading} question={question} onRestart={resetReading} onBack={() => navigate('/select')} />} />
    </Routes>
  )
}
