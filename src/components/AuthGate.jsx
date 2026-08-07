import { useState } from 'react'
import { verifyInviteCode } from '../services/supabase'

const SESSION_KEY = 'dohand_auth'

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

function saveSession(phone, expiresAt) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ phone, expiresAt, loginAt: Date.now() }))
}

export default function AuthGate({ onLogin }) {
  const [code, setCode] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedCode = code.trim()
    const trimmedPhone = phone.trim()
    if (!trimmedCode) {
      setError('请输入邀请码')
      return
    }
    if (!trimmedPhone) {
      setError('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(trimmedPhone)) {
      setError('请输入正确的手机号')
      return
    }

    setLoading(true)
    try {
      const result = await verifyInviteCode(trimmedCode, trimmedPhone)
      if (result.success) {
        saveSession(trimmedPhone, result.expiresAt)
        onLogin()
      } else {
        setError(result.error)
      }
    } catch {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full h-screen flex items-center justify-center px-6 relative z-10">
      <div className="w-full max-w-[340px] flex flex-col items-center">

        {/* Logo — Arial Black 黑体 */}
        <h1 className="text-[2.5rem] leading-none mb-2 text-white"
          style={{ fontFamily: `"Arial Black", "Helvetica Neue", Arial, "PingFang SC", "Hiragino Sans GB", sans-serif`, fontWeight: 900 }}>
          DO!<span style={{ color: 'oklch(82% 0.04 162)' }}>Hand</span>
        </h1>
        <p className="text-[10px] tracking-[0.22em] mb-12"
          style={{ color: 'oklch(95% 0.01 90 / 0.9)', textShadow: '0 1px 4px oklch(0% 0 0 / 0.4)' }}>
          塔罗四元素 · 植物草药指引
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-medium tracking-[0.06em] mb-1.5"
              style={{ color: 'oklch(90% 0.01 90 / 0.7)' }}>
              邀请码
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError('') }}
              placeholder="请输入你的专属邀请码"
              className={`glass-input ${error && !code.trim() ? 'error' : ''}`}
              autoComplete="off"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium tracking-[0.06em] mb-1.5"
              style={{ color: 'oklch(90% 0.01 90 / 0.7)' }}>
              手机号
            </label>
            <input
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setError('') }}
              placeholder="请输入手机号"
              className={`glass-input ${error && !/^1[3-9]\d{9}$/.test(phone.trim()) ? 'error' : ''}`}
              autoComplete="tel"
            />
          </div>

          {error && (
            <p className="text-[11px] text-center" style={{ color: 'oklch(65% 0.15 20)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="glass-btn mt-1"
          >
            {loading ? '验证中...' : '验证进入'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-[10px] mt-10 tracking-[0.06em] text-center"
          style={{ color: 'oklch(90% 0.01 90)', opacity: 0.35 }}>
          DO!Hand  内部学员使用
        </p>
      </div>
    </div>
  )
}
