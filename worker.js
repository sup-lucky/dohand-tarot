/**
 * DO!Hand 塔罗 AI 解读 Worker
 * 部署到 Cloudflare Workers，代理 DeepSeek API 请求
 *
 * 部署步骤：
 * 1. npm install -g wrangler
 * 2. wrangler login
 * 3. wrangler secret put DEEPSEEK_API_KEY  (输入你的 DeepSeek API Key)
 * 4. wrangler deploy
 *
 * 部署后会得到一个 URL，如 https://dohand-tarot.xxx.workers.dev
 * 将这个 URL 填入前端 .env 或直接写入代码中的 WORKER_URL
 */

export default {
  async fetch(request, env, ctx) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    try {
      const { question, cards, spreadName, mode, modeLabel } = await request.json()

      if (!question || !cards || cards.length === 0) {
        return new Response(JSON.stringify({ error: '缺少问题或牌面数据' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Build the prompt for DeepSeek
      const cardDescriptions = cards.map((c, i) =>
        `第${i + 1}张：【${c.position}】${c.name}（${c.isReversed ? '逆位' : '正位'}）——牌位含义：${c.positionDesc}`
      ).join('\n')

      const systemPrompt = `你是 DO!Hand 工作室的塔罗解读师。你的解读风格是温暖、有洞察力、以「自我觉察」和「信念显化」为核心。

核心理念：
- 我们不是算命，而是帮助客户看见自己当下的信念和认知模式
- 每一张牌都是客户内在状态的镜子——反映的是他们此刻持有什么样的想法、情绪、假设，才显化出了当前的生活境遇
- 解读的目的是帮助客户找到「核心信念」——那个一直在无意识中驱动他们行为、情绪和选择的底层设定
- 一旦看清了这个信念，客户就可以直接从信念入手去改变三维世界
- 语言要像朋友在聊天——真诚、有温度、不玄乎、不说教

${spreadName === '植物信念觉察法' ? `
当前牌阵：植物信念觉察法（${modeLabel}）
${mode === 'phase1' ? '这一阶段的核心问题是：「我现在持有什么样的信念/目前是什么样的状态，导致现在的情况发生？」请帮助客户从四元素方向看清自己的内在信念。' : '这一阶段的核心问题是：「每一种元素对应的问题的解决方法是什么？」请帮助客户找到每个方向的具体改变方式。'}
四元素解读方向：
- 权杖（火）：行动与热情中的真实状态和信念——我是一个什么样的行动者？
- 圣杯（水）：内心情感的真实底色——我的心里在渴望或逃避什么？
- 宝剑（风）：思维与沟通中的认知模式——什么念头或概念在反复影响我？
- 星币（土）：物质世界的呈现与自我价值假设——我是如何判定自己的价值的？
${mode === 'phase1' ? '如果包含强调牌——它指出当前最影响客户的核心元素方向，请在解读中突出这个方向。' : ''}
` : spreadName === '人际镜像阵' ? `
当前牌阵：人际镜像阵（${modeLabel}）
核心问题：「我对这段关系的深层内在看法是什么？」
- 投射牌（宫廷牌）：客户把对方投射成了什么样子——这反映了客户内心怎样的渴望或恐惧？
- 三张细节牌：从不同维度映照客户在这段关系中的内在信念——感受、思维、行动模式
` : `
当前牌阵：沙龙牌阵
帮助客户看清现状和需要改进的方向。
`}

输出格式：
请按照每张牌的顺序，为每张牌写一段解读。每段解读以牌名和牌位开头，然后深入展开。解读要：
1. 紧密结合客户的具体问题来展开——不要泛泛而谈
2. 从「你此刻的信念/认知/假设」的角度切入
3. 语言温暖真诚，像朋友聊天
4. 每张牌解读控制在150-250字

最后加一段「核心信念提示」：用2-3句话总结——从这几张牌来看，客户最需要觉察到的那个深层信念是什么。

请用换行分隔每张牌的解读，方便前端解析展示。`

      const userMessage = `我的问题是：${question}

我抽到的牌是：
${cardDescriptions}

请为我详细解读。`

      // Call DeepSeek API
      const deepseekResp = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        }),
      })

      if (!deepseekResp.ok) {
        const errText = await deepseekResp.text()
        console.error('DeepSeek API error:', deepseekResp.status, errText)
        return new Response(JSON.stringify({ error: `AI 服务暂时不可用（${deepseekResp.status}）` }), {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const data = await deepseekResp.json()
      const aiText = data.choices?.[0]?.message?.content || ''

      return new Response(JSON.stringify({ interpretation: aiText }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })

    } catch (err) {
      console.error('Worker error:', err)
      return new Response(JSON.stringify({ error: '解读服务出错，请稍后重试' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  },
}
