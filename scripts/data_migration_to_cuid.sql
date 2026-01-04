-- ============================================================
-- DATA MIGRATION: Convert Integer IDs to CUIDs
-- ============================================================
-- VERIFIED against schema.prisma on 2026-01-04
-- 
-- Tables with ID columns to migrate:
-- 1. User (id, referredById, accessGrantedBy, bannedBy)
-- 2. ReferralReward (id, inviterId, inviteeId)
-- 3. Quest (id)
-- 4. CompletedQuest (id, userId, questId, approvedBy)
-- 5. Game (id)
-- 6. Question (id, gameId)
-- 7. GameEntry (id, gameId, userId)
-- 8. Chat (id, gameId, userId)
-- 9. NotificationToken (id, userId)
-- 10. AuditLog (id, adminId)
-- 11. InviteCode (id, usedById)
-- ============================================================

BEGIN;

-- Enable pgcrypto for random generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Helper function to generate CUID-like IDs
-- Format: cl + timestamp(8) + random(16) = 26 chars
-- ============================================================
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
DECLARE
    ts_part TEXT;
    rand_part TEXT;
BEGIN
    ts_part := lpad(to_hex((extract(epoch from clock_timestamp()) * 1000)::bigint), 12, '0');
    rand_part := encode(gen_random_bytes(8), 'hex');
    RETURN 'cl' || substr(ts_part, 5, 8) || rand_part;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 1: Create ID mapping tables
-- ============================================================

DROP TABLE IF EXISTS _user_map;
DROP TABLE IF EXISTS _game_map;
DROP TABLE IF EXISTS _quest_map;
DROP TABLE IF EXISTS _question_map;
DROP TABLE IF EXISTS _game_entry_map;
DROP TABLE IF EXISTS _chat_map;
DROP TABLE IF EXISTS _completed_quest_map;
DROP TABLE IF EXISTS _referral_reward_map;
DROP TABLE IF EXISTS _notification_token_map;
DROP TABLE IF EXISTS _audit_log_map;
DROP TABLE IF EXISTS _invite_code_map;

CREATE TABLE _user_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "User";
CREATE TABLE _game_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "Game";
CREATE TABLE _quest_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "Quest";
CREATE TABLE _question_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "Question";
CREATE TABLE _game_entry_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "GameEntry";
CREATE TABLE _chat_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "Chat";
CREATE TABLE _completed_quest_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "CompletedQuest";
CREATE TABLE _referral_reward_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "ReferralReward";
CREATE TABLE _notification_token_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "NotificationToken";
CREATE TABLE _audit_log_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "AuditLog";
CREATE TABLE _invite_code_map AS SELECT id AS old_id, generate_cuid() AS new_id FROM "InviteCode";

-- Add indexes for faster lookups
CREATE INDEX ON _user_map(old_id);
CREATE INDEX ON _game_map(old_id);
CREATE INDEX ON _quest_map(old_id);
CREATE INDEX ON _question_map(old_id);
CREATE INDEX ON _game_entry_map(old_id);
CREATE INDEX ON _chat_map(old_id);
CREATE INDEX ON _completed_quest_map(old_id);
CREATE INDEX ON _referral_reward_map(old_id);
CREATE INDEX ON _notification_token_map(old_id);
CREATE INDEX ON _audit_log_map(old_id);
CREATE INDEX ON _invite_code_map(old_id);

-- ============================================================
-- STEP 2: Disable foreign key checks temporarily
-- ============================================================
SET session_replication_role = 'replica';

-- ============================================================
-- STEP 3: Update all foreign keys FIRST (before PKs)
-- ============================================================

-- User self-references
UPDATE "User" u SET "referredById" = m.new_id FROM _user_map m WHERE u."referredById" = m.old_id;
UPDATE "User" u SET "accessGrantedBy" = m.new_id FROM _user_map m WHERE u."accessGrantedBy" = m.old_id;
UPDATE "User" u SET "bannedBy" = m.new_id FROM _user_map m WHERE u."bannedBy" = m.old_id;

-- ReferralReward (inviterId -> User, inviteeId is just a string not FK)
UPDATE "ReferralReward" rr SET "inviterId" = m.new_id FROM _user_map m WHERE rr."inviterId" = m.old_id;
UPDATE "ReferralReward" rr SET "inviteeId" = m.new_id FROM _user_map m WHERE rr."inviteeId" = m.old_id;

-- CompletedQuest (userId -> User, questId -> Quest, approvedBy is nullable string)
UPDATE "CompletedQuest" cq SET "userId" = m.new_id FROM _user_map m WHERE cq."userId" = m.old_id;
UPDATE "CompletedQuest" cq SET "questId" = m.new_id FROM _quest_map m WHERE cq."questId" = m.old_id;
UPDATE "CompletedQuest" cq SET "approvedBy" = m.new_id FROM _user_map m WHERE cq."approvedBy" = m.old_id;

-- Question (gameId -> Game)
UPDATE "Question" q SET "gameId" = m.new_id FROM _game_map m WHERE q."gameId" = m.old_id;

-- GameEntry (gameId -> Game, userId -> User)
UPDATE "GameEntry" ge SET "gameId" = m.new_id FROM _game_map m WHERE ge."gameId" = m.old_id;
UPDATE "GameEntry" ge SET "userId" = m.new_id FROM _user_map m WHERE ge."userId" = m.old_id;

-- Chat (gameId -> Game, userId -> User)
UPDATE "Chat" c SET "gameId" = m.new_id FROM _game_map m WHERE c."gameId" = m.old_id;
UPDATE "Chat" c SET "userId" = m.new_id FROM _user_map m WHERE c."userId" = m.old_id;

-- NotificationToken (userId -> User)
UPDATE "NotificationToken" nt SET "userId" = m.new_id FROM _user_map m WHERE nt."userId" = m.old_id;

-- AuditLog (adminId -> User)
UPDATE "AuditLog" al SET "adminId" = m.new_id FROM _user_map m WHERE al."adminId" = m.old_id;

-- InviteCode (usedById -> User)
UPDATE "InviteCode" ic SET "usedById" = m.new_id FROM _user_map m WHERE ic."usedById" = m.old_id;

-- ============================================================
-- STEP 4: Update all primary keys
-- ============================================================

UPDATE "User" u SET id = m.new_id FROM _user_map m WHERE u.id = m.old_id;
UPDATE "Game" g SET id = m.new_id FROM _game_map m WHERE g.id = m.old_id;
UPDATE "Quest" q SET id = m.new_id FROM _quest_map m WHERE q.id = m.old_id;
UPDATE "Question" q SET id = m.new_id FROM _question_map m WHERE q.id = m.old_id;
UPDATE "GameEntry" ge SET id = m.new_id FROM _game_entry_map m WHERE ge.id = m.old_id;
UPDATE "Chat" c SET id = m.new_id FROM _chat_map m WHERE c.id = m.old_id;
UPDATE "CompletedQuest" cq SET id = m.new_id FROM _completed_quest_map m WHERE cq.id = m.old_id;
UPDATE "ReferralReward" rr SET id = m.new_id FROM _referral_reward_map m WHERE rr.id = m.old_id;
UPDATE "NotificationToken" nt SET id = m.new_id FROM _notification_token_map m WHERE nt.id = m.old_id;
UPDATE "AuditLog" al SET id = m.new_id FROM _audit_log_map m WHERE al.id = m.old_id;
UPDATE "InviteCode" ic SET id = m.new_id FROM _invite_code_map m WHERE ic.id = m.old_id;

-- ============================================================
-- STEP 5: Re-enable foreign key checks
-- ============================================================
SET session_replication_role = 'origin';

-- ============================================================
-- STEP 6: Verify integrity
-- ============================================================

-- Check that all IDs are now CUIDs (start with 'cl')
DO $$
DECLARE
    bad_count INT;
BEGIN
    SELECT COUNT(*) INTO bad_count FROM "User" WHERE id NOT LIKE 'cl%';
    IF bad_count > 0 THEN RAISE EXCEPTION 'User table has % non-CUID ids', bad_count; END IF;
    
    SELECT COUNT(*) INTO bad_count FROM "Game" WHERE id NOT LIKE 'cl%';
    IF bad_count > 0 THEN RAISE EXCEPTION 'Game table has % non-CUID ids', bad_count; END IF;
    
    SELECT COUNT(*) INTO bad_count FROM "GameEntry" WHERE id NOT LIKE 'cl%';
    IF bad_count > 0 THEN RAISE EXCEPTION 'GameEntry table has % non-CUID ids', bad_count; END IF;
    
    SELECT COUNT(*) INTO bad_count FROM "GameEntry" WHERE "gameId" NOT LIKE 'cl%';
    IF bad_count > 0 THEN RAISE EXCEPTION 'GameEntry has % invalid gameId refs', bad_count; END IF;
    
    SELECT COUNT(*) INTO bad_count FROM "GameEntry" WHERE "userId" NOT LIKE 'cl%';
    IF bad_count > 0 THEN RAISE EXCEPTION 'GameEntry has % invalid userId refs', bad_count; END IF;
    
    RAISE NOTICE '✅ All integrity checks passed!';
END $$;

-- ============================================================
-- STEP 7: Verify referential integrity
-- ============================================================

-- Check GameEntry -> User FK
DO $$
DECLARE
    orphan_count INT;
BEGIN
    SELECT COUNT(*) INTO orphan_count 
    FROM "GameEntry" ge 
    WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = ge."userId");
    
    IF orphan_count > 0 THEN 
        RAISE EXCEPTION 'Found % orphan GameEntry records with invalid userId', orphan_count; 
    END IF;
    RAISE NOTICE '✅ GameEntry->User FK verified';
END $$;

-- Check GameEntry -> Game FK
DO $$
DECLARE
    orphan_count INT;
BEGIN
    SELECT COUNT(*) INTO orphan_count 
    FROM "GameEntry" ge 
    WHERE NOT EXISTS (SELECT 1 FROM "Game" g WHERE g.id = ge."gameId");
    
    IF orphan_count > 0 THEN 
        RAISE EXCEPTION 'Found % orphan GameEntry records with invalid gameId', orphan_count; 
    END IF;
    RAISE NOTICE '✅ GameEntry->Game FK verified';
END $$;

-- Check Question -> Game FK
DO $$
DECLARE
    orphan_count INT;
BEGIN
    SELECT COUNT(*) INTO orphan_count 
    FROM "Question" q 
    WHERE NOT EXISTS (SELECT 1 FROM "Game" g WHERE g.id = q."gameId");
    
    IF orphan_count > 0 THEN 
        RAISE EXCEPTION 'Found % orphan Question records with invalid gameId', orphan_count; 
    END IF;
    RAISE NOTICE '✅ Question->Game FK verified';
END $$;

-- ============================================================
-- STEP 8: Cleanup mapping tables
-- ============================================================
DROP TABLE IF EXISTS _user_map;
DROP TABLE IF EXISTS _game_map;
DROP TABLE IF EXISTS _quest_map;
DROP TABLE IF EXISTS _question_map;
DROP TABLE IF EXISTS _game_entry_map;
DROP TABLE IF EXISTS _chat_map;
DROP TABLE IF EXISTS _completed_quest_map;
DROP TABLE IF EXISTS _referral_reward_map;
DROP TABLE IF EXISTS _notification_token_map;
DROP TABLE IF EXISTS _audit_log_map;
DROP TABLE IF EXISTS _invite_code_map;
DROP FUNCTION IF EXISTS generate_cuid();

-- ============================================================
-- STEP 9: Show sample data to verify
-- ============================================================
SELECT '=== SAMPLE DATA AFTER MIGRATION ===' as info;
SELECT 'User' as table_name, id FROM "User" LIMIT 3;
SELECT 'Game' as table_name, id FROM "Game" LIMIT 3;
SELECT 'GameEntry' as table_name, id, "gameId", "userId" FROM "GameEntry" LIMIT 3;

COMMIT;
