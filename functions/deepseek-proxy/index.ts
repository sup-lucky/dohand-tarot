// DO!Hand — DeepSeek 中转代理（Supabase Edge Function）
// 作用：把 DeepSeek key 藏在服务端 secrets 里，前端永远看不到；
//       并加一道门禁 + 每日限额，防止 key 被盗刷。
//
// 部署方式：Supabase Dashboard → Edge Functions → 新建函数 deepseek-proxy
//   把本文件内容贴进去，secrets 加一个 DEEPSEEK_API_KEY = sk-xxx，然后 Deploy。

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')!

// 每手机号每天最多调用的次数（正式学员一天够用，脚本刷不动）
const DAILY_LIMIT = 30

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }
  if (req.method !== 'POST') {
    return json({ error: '仅支持 POST' }, 405)
  }

  const body = await req.json().catch(() => null)
  const phone = body?.phone
  const system = body?.system
  const user = body?.user
  const temperature = body?.temperature ?? 0.7
  const maxTokens = body?.max_tokens ?? 4096

  // 门禁：必须是已登录学员（有手机号），格式校验一下
  if (!phone || !/^1[3-9]\d{9}$/.test(String(phone))) {
    return json({ error: '未授权：请先验证邀请码' }, 401)
  }
  if (!system || !user) {
    return json({ error: '缺少参数' }, 400)
  }

  // 每日限额：同一天同一手机号最多 DAILY_LIMIT 次
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data: quota } = await supabase.rpc('check_ai_quota', {
    p_phone: String(phone),
    p_limit: DAILY_LIMIT,
  })
  if (!quota?.allowed) {
    return json(
      { error: '今日解读次数已用完，请明天再来（这是对学员账号的保护）' },
      429,
    )
  }

  // 转发给 DeepSeek（key 只在服务端出现）
  const upstream = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => '')
    return json(
      { error: `AI 服务暂时不可用（${upstream.status}）` },
      upstream.status,
    )
  }

  const data = await upstream.json()
  const text = data?.choices?.[0]?.message?.content || ''
  if (!text) {
    return json({ error: 'AI 返回为空，请稍后重试' }, 502)
  }
  return json({ text })
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  })
}
