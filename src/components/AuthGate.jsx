import { useState } from 'react'
import { verifyInviteCode } from '../services/supabase'

const SESSION_KEY = 'dohand_auth'

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    // 检查是否过期
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

    // 基本校验
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
    <div className="w-full h-screen flex items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #fef9e7 0%, #fdf6e3 20%, #eaf4f0 50%, #f0f4f8 75%, #fdf6e3 100%)' }}>
      <div className="w-full max-w-[340px] flex flex-col items-center">

        {/* Logo */}
        <h1 className="text-[2.4rem] leading-none mb-2"
          style={{ fontFamily: `"Arial Black", "Helvetica Neue", Arial, sans-serif`, fontWeight: 900, color: '#4a3a2a' }}>
          DO!<span style={{ color: '#7a6a50' }}>Hand</span>
        </h1>
        <p className="text-[11px] tracking-[0.2em] text-stone-400 mb-12">内部学员 · 专属网站</p>

        {/* 表单卡片 */}
        <div className="w-full bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-stone-200/50">

          {/* 邀请码 */}
          <div className="mb-5">
            <label className="block text-xs tracking-[0.1em] text-stone-500 mb-2">邀请码</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入你的专属邀请码"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white/80 text-sm text-stone-700
                placeholder:text-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100
                transition-all"
            />
          </div>

          {/* 手机号 */}
          <div className="mb-6">
            <label className="block text-xs tracking-[0.1em] text-stone-500 mb-2">手机号</label>
            <input
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="绑定手机号，一码一机"
              className="w-full px-4 py-3 rounded-xl border border-stone-200 bg-white/80 text-sm text-stone-700
                placeholder:text-stone-300 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100
                transition-all"
            />
            <p className="text-[10px] text-stone-300 mt-1.5">每个邀请码仅可绑定一部手机</p>
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-xs text-red-400 mb-4 text-center">{error}</p>
          )}

          {/* 提交按钮 */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#4a3a2a] text-white text-sm font-medium tracking-[0.1em]
              active:bg-[#3a2a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '验证中...' : '进入网站'}
          </button>
        </div>

        {/* 底部提示 */}
        <p className="text-[10px] text-stone-300 mt-8 text-center leading-relaxed">
          本网站为 DO!Hand 内部学员专属<br />
          未经授权不得分享或转让他人使用
        </p>
      </div>
    </div>
  )
}
