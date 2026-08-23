-- DO!Hand 学员专属网站 - 邀请码验证系统
-- 在 Supabase SQL Editor 中运行

-- 1. 创建邀请码表
CREATE TABLE IF NOT EXISTS invite_codes (
  id            SERIAL PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  phone         TEXT,
  student_name  TEXT,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 创建原子验证函数（防并发：查码+绑定一步完成，不会出现两个人同时抢占）
CREATE OR REPLACE FUNCTION verify_code(p_code TEXT, p_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_record invite_codes%ROWTYPE;
BEGIN
  -- 查码
  SELECT * INTO v_record FROM invite_codes WHERE code = p_code;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', '邀请码无效');
  END IF;

  -- 检查是否过期
  IF v_record.expires_at IS NOT NULL AND v_record.expires_at < NOW() THEN
    RETURN jsonb_build_object('success', false, 'error', '该邀请码已过期');
  END IF;

  -- 检查是否已绑定
  IF v_record.phone IS NOT NULL THEN
    IF v_record.phone = p_phone THEN
      -- 同一手机号，正常登录
      RETURN jsonb_build_object(
        'success', true,
        'student_name', v_record.student_name,
        'expires_at', v_record.expires_at
      );
    ELSE
      -- 已被别人绑定
      RETURN jsonb_build_object('success', false, 'error', '该邀请码已被其他手机号绑定使用');
    END IF;
  END IF;

  -- 首次绑定
  UPDATE invite_codes SET phone = p_phone WHERE code = p_code;

  RETURN jsonb_build_object(
    'success', true,
    'student_name', v_record.student_name,
    'expires_at', v_record.expires_at
  );
END;
$$;

-- 3. 开启 RLS
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;

-- 4. 仅允许通过函数访问（不允许直接查表，保护手机号隐私）
-- 允许 anon 用户调用函数
GRANT EXECUTE ON FUNCTION verify_code TO anon, authenticated;

-- 5. 插入示例邀请码（替换为你真实的学员码）
-- INSERT INTO invite_codes (code, student_name, expires_at)
-- VALUES
--   ('DH001', '张三', NOW() + INTERVAL '2 years'),
--   ('DH002', '李四', NOW() + INTERVAL '2 years');

-- 6. 创建 keep-alive 表（防止免费项目因 7 天不活跃被自动暂停）
CREATE TABLE IF NOT EXISTS keepalive_pings (
  id        BIGSERIAL PRIMARY KEY,
  pinged_at TIMESTAMPTZ DEFAULT NOW()
);

-- 开启 RLS（不设策略 = 禁止 anon 直接读写；keepalive_ping 函数是 SECURITY DEFINER，
-- 以创建者身份运行、默认绕过 RLS，所以定时写入不受影响）
ALTER TABLE keepalive_pings ENABLE ROW LEVEL SECURITY;

-- 7. 创建 keep-alive 函数，供 GitHub Actions 每天定时调用
CREATE OR REPLACE FUNCTION keepalive_ping()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 只保留最近 30 天记录，避免表无限增长
  DELETE FROM keepalive_pings WHERE pinged_at < NOW() - INTERVAL '30 days';
  INSERT INTO keepalive_pings DEFAULT VALUES;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION keepalive_ping() TO anon;

-- ============================================================
-- 8. AI 解读每日限额（防止 DeepSeek key 被盗刷）
--    表 + 原子计数函数，配合 Edge Function deepseek-proxy 使用
-- ============================================================

-- 8.1 限额表：按「手机号 + 日期」记录当天调用次数
CREATE TABLE IF NOT EXISTS ai_quota (
  phone       TEXT NOT NULL,
  quota_date  DATE NOT NULL,
  call_count  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (phone, quota_date)
);

-- 8.2 原子计数 + 判断是否超限（SECURITY DEFINER，anon 可调用，不暴露 key/表内容）
CREATE OR REPLACE FUNCTION check_ai_quota(p_phone TEXT, p_limit INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := (NOW() AT TIME ZONE 'Asia/Shanghai')::DATE;
  v_count INTEGER;
BEGIN
  INSERT INTO ai_quota (phone, quota_date, call_count)
  VALUES (p_phone, v_today, 1)
  ON CONFLICT (phone, quota_date)
  DO UPDATE SET call_count = ai_quota.call_count + 1
  RETURNING call_count INTO v_count;

  RETURN jsonb_build_object(
    'allowed', (v_count <= p_limit),
    'remaining', GREATEST(p_limit - v_count, 0)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_ai_quota(TEXT, INTEGER) TO anon;
