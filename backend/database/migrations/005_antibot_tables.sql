
CREATE TABLE IF NOT EXISTS trust_scores (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    account_age_days INTEGER DEFAULT 0,
    email_verified BOOLEAN DEFAULT FALSE,
    profile_completeness DECIMAL(3, 2) DEFAULT 0,
    behavior_score DECIMAL(3, 2) DEFAULT 0.5,
    content_quality_score DECIMAL(3, 2) DEFAULT 0.5,
    followers_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    captcha_success_rate DECIMAL(3, 2) DEFAULT 1,
    score DECIMAL(5, 2) DEFAULT 50,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ip_reputation_cache (
    ip VARCHAR(45) PRIMARY KEY,
    score INTEGER DEFAULT 100,
    is_proxy BOOLEAN DEFAULT FALSE,
    is_vpn BOOLEAN DEFAULT FALSE,
    is_tor BOOLEAN DEFAULT FALSE,
    is_datacenter BOOLEAN DEFAULT FALSE,
    country VARCHAR(2),
    abuse_reports INTEGER DEFAULT 0,
    last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ip_reputation_score ON ip_reputation_cache(score);
CREATE INDEX IF NOT EXISTS idx_ip_reputation_last_checked ON ip_reputation_cache(last_checked);

CREATE TABLE IF NOT EXISTS rate_limit_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    ip VARCHAR(45),
    operation VARCHAR(50) NOT NULL,
    limit_exceeded INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_user_id ON rate_limit_violations(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON rate_limit_violations(ip);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON rate_limit_violations(created_at);

CREATE TABLE IF NOT EXISTS spam_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    target_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    target_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    reason VARCHAR(255) NOT NULL,
    spam_score DECIMAL(3, 2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_spam_reports_target_user ON spam_reports(target_user_id);
CREATE INDEX IF NOT EXISTS idx_spam_reports_status ON spam_reports(status);
