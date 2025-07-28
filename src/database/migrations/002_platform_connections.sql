-- Create platform_connections table
CREATE TABLE IF NOT EXISTS platform_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    platform_name VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint: one connection per user per platform
    UNIQUE KEY unique_user_platform (user_id, platform_name),
    
    -- Index for faster queries
    INDEX idx_user_platform (user_id, platform_name),
    INDEX idx_platform_active (platform_name, is_active),
    INDEX idx_expires_at (expires_at)
);

-- Create oauth_states table for temporary OAuth state storage
CREATE TABLE IF NOT EXISTS oauth_states (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    state VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to users table
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Unique constraint for state
    UNIQUE KEY unique_state (state),
    
    -- Index for faster lookups
    INDEX idx_platform_state (platform, state),
    INDEX idx_expires_at (expires_at)
);

-- Create platform_users table for storing mentioned users (for Threads)
CREATE TABLE IF NOT EXISTS platform_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(50) NOT NULL,
    username VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NULL,
    last_mentioned TIMESTAMP NULL,
    mention_count INT DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Unique constraint: one record per platform user
    UNIQUE KEY unique_platform_user (platform, username),
    
    -- Indexes for faster queries
    INDEX idx_platform (platform),
    INDEX idx_last_mentioned (last_mentioned),
    INDEX idx_engagement_score (engagement_score DESC)
);

-- Create threads_mentions table for tracking user mentions
CREATE TABLE IF NOT EXISTS threads_mentions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    mentioned_user VARCHAR(255) NOT NULL,
    mention_date TIMESTAMP NOT NULL,
    response_received BOOLEAN DEFAULT FALSE,
    response_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to campaigns table (will be created in Phase 3)
    -- FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Indexes for faster queries
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_mentioned_user (mentioned_user),
    INDEX idx_mention_date (mention_date),
    INDEX idx_response_received (response_received)
);

-- Create campaign_posts table for tracking posted content
CREATE TABLE IF NOT EXISTS campaign_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    campaign_id INT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    posted_at TIMESTAMP NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT NULL,
    engagement_data JSON NULL,
    post_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key to campaigns table (will be created in Phase 3)
    -- FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    
    -- Indexes for faster queries
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_platform (platform),
    INDEX idx_posted_at (posted_at),
    INDEX idx_success (success),
    INDEX idx_post_id (post_id)
);

-- Insert some initial data for testing
INSERT IGNORE INTO platform_users (platform, username, user_id, engagement_score) VALUES
('threads', 'sample_user1', '12345', 5.50),
('threads', 'sample_user2', '12346', 7.25),
('threads', 'sample_user3', '12347', 3.75),
('facebook', 'sample_page1', 'page123', 8.00),
('twitter', 'sample_account1', 'twitter123', 6.50);

-- Add comments to tables for documentation
ALTER TABLE platform_connections COMMENT = 'Stores OAuth tokens and connection status for each social media platform';
ALTER TABLE oauth_states COMMENT = 'Temporary storage for OAuth state parameters during authentication flow';
ALTER TABLE platform_users COMMENT = 'Stores information about users on different platforms for mentioning features';
ALTER TABLE threads_mentions COMMENT = 'Tracks user mentions made through the Threads platform';
ALTER TABLE campaign_posts COMMENT = 'Logs all posts made through campaigns with success/failure status';

-- Create a view for active platform connections
CREATE OR REPLACE VIEW active_platform_connections AS
SELECT 
    pc.id,
    pc.user_id,
    pc.platform_name,
    pc.expires_at,
    pc.is_active,
    pc.created_at,
    pc.updated_at,
    CASE 
        WHEN pc.expires_at > NOW() AND pc.is_active = TRUE THEN 'active'
        WHEN pc.expires_at <= NOW() THEN 'expired'
        ELSE 'inactive'
    END as connection_status
FROM platform_connections pc
WHERE pc.is_active = TRUE;

-- Create a view for platform connection summary
CREATE OR REPLACE VIEW platform_connection_summary AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(pc.id) as total_connections,
    SUM(CASE WHEN pc.is_active = TRUE AND pc.expires_at > NOW() THEN 1 ELSE 0 END) as active_connections,
    SUM(CASE WHEN pc.expires_at <= NOW() THEN 1 ELSE 0 END) as expired_connections,
    GROUP_CONCAT(
        CASE WHEN pc.is_active = TRUE AND pc.expires_at > NOW() 
        THEN pc.platform_name 
        END
    ) as connected_platforms
FROM users u
LEFT JOIN platform_connections pc ON u.id = pc.user_id
GROUP BY u.id, u.email;