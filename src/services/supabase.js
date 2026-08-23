// DO!Hand 学员验证 — Supabase RPC 封装（无需额外依赖，纯 fetch）
const SUPABASE_URL = 'https://caehelsbmkkmxychzpvj.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_TwmueiiKcfOby5SNjWWvpQ_WmWgAjfB'
const DEEPSEEK_PROXY_URL = `${SUPABASE_URL}/functions/v1/deepseek-proxy`

const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
}

/**
 * 验证邀请码 + 绑定手机号（调用数据库函数，原子操作，安全）
 * @param {string} code 邀请码
 * @param {string} phone 手机号
 * @returns {Promise<{ success: boolean, studentName?: string, expiresAt?: string, error?: string }>}
 */
export async function verifyInviteCode(code, phone) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_code`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ p_code: code, p_phone: phone }),
    })
    if (!res.ok) {
      return { success: false, error: '系统错误，请稍后重试' }
    }
    const data = await res.json()
    return data
  } catch {
    return { success: false, error: '网络错误，请稍后重试' }
  }
}

/**
 * AI 解读（经 Supabase Edge Function 中转，key 不暴露在前端）
 * @param {object} params
 * @param {string} params.phone 已登录手机号（门禁用）
 * @param {string} params.system system prompt
 * @param {string} params.user user prompt
 * @returns {Promise<string>} 解读文本，失败时抛 Error（含中文错误信息）
 */
export async function deepseekProxy({ phone, system, user }) {
  const res = await fetch(DEEPSEEK_PROXY_URL, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({
      phone,
      system,
      user,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.error || `AI 服务暂时不可用（${res.status}）`)
  }
  if (!data?.text) {
    throw new Error('AI 返回为空，请稍后重试')
  }
  return data.text
}
