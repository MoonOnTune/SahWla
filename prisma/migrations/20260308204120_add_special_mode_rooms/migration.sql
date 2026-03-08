-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('CLASSIC', 'SPECIAL');

-- CreateEnum
CREATE TYPE "GameRoomStatus" AS ENUM ('SETUP', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "GameRoomPhase" AS ENUM ('QR', 'BOARD', 'QUESTION', 'ANSWER', 'WINNER');

-- CreateEnum
CREATE TYPE "GameTeamKey" AS ENUM ('A', 'B');

-- CreateEnum
CREATE TYPE "GameParticipantRole" AS ENUM ('CAPTAIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "GameAbilityType" AS ENUM ('STEAL', 'DOUBLE_POINTS', 'SHIELD', 'BONUS_PICK', 'POINT_THEFT');

-- CreateTable
CREATE TABLE "GameRoom" (
    "id" TEXT NOT NULL,
    "game_session_id" TEXT NOT NULL,
    "mode" "GameMode" NOT NULL DEFAULT 'SPECIAL',
    "room_code" TEXT NOT NULL,
    "status" "GameRoomStatus" NOT NULL DEFAULT 'SETUP',
    "phase" "GameRoomPhase" NOT NULL DEFAULT 'QR',
    "daily_double_enabled" BOOLEAN NOT NULL DEFAULT true,
    "current_turn_team" "GameTeamKey" NOT NULL DEFAULT 'A',
    "current_round" INTEGER NOT NULL DEFAULT 1,
    "ability_used_by_a_round" INTEGER NOT NULL DEFAULT 0,
    "ability_used_by_b_round" INTEGER NOT NULL DEFAULT 0,
    "pending_suggested_pick_id" TEXT,
    "selected_pick_id" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRoomTeam" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "team_key" "GameTeamKey" NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "color_light" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "correct_streak" INTEGER NOT NULL DEFAULT 0,
    "captain_participant_id" TEXT,
    "pending_double_points" BOOLEAN NOT NULL DEFAULT false,
    "pending_bonus_pick" BOOLEAN NOT NULL DEFAULT false,
    "pending_steal" BOOLEAN NOT NULL DEFAULT false,
    "shield_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRoomTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRoomParticipant" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "team_key" "GameTeamKey" NOT NULL,
    "nickname" TEXT NOT NULL,
    "role" "GameParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "device_token" TEXT NOT NULL,
    "connected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disconnected_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameRoomParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRoomChatMessage" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "team_key" "GameTeamKey" NOT NULL,
    "participant_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRoomChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRoomAbility" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "team_key" "GameTeamKey" NOT NULL,
    "ability_type" "GameAbilityType" NOT NULL,
    "unlocked_round" INTEGER NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRoomAbility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameRoomEvent" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "team_key" "GameTeamKey",
    "event_type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRoomEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GameRoom_game_session_id_key" ON "GameRoom"("game_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "GameRoom_room_code_key" ON "GameRoom"("room_code");

-- CreateIndex
CREATE INDEX "GameRoom_room_code_status_idx" ON "GameRoom"("room_code", "status");

-- CreateIndex
CREATE INDEX "GameRoom_game_session_id_status_idx" ON "GameRoom"("game_session_id", "status");

-- CreateIndex
CREATE INDEX "GameRoomTeam_room_id_idx" ON "GameRoomTeam"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "GameRoomTeam_room_id_team_key_key" ON "GameRoomTeam"("room_id", "team_key");

-- CreateIndex
CREATE INDEX "GameRoomParticipant_room_id_team_key_idx" ON "GameRoomParticipant"("room_id", "team_key");

-- CreateIndex
CREATE INDEX "GameRoomParticipant_room_id_role_idx" ON "GameRoomParticipant"("room_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "GameRoomParticipant_room_id_device_token_key" ON "GameRoomParticipant"("room_id", "device_token");

-- CreateIndex
CREATE INDEX "GameRoomChatMessage_room_id_team_key_created_at_idx" ON "GameRoomChatMessage"("room_id", "team_key", "created_at");

-- CreateIndex
CREATE INDEX "GameRoomChatMessage_participant_id_idx" ON "GameRoomChatMessage"("participant_id");

-- CreateIndex
CREATE INDEX "GameRoomAbility_room_id_team_key_consumed_at_idx" ON "GameRoomAbility"("room_id", "team_key", "consumed_at");

-- CreateIndex
CREATE INDEX "GameRoomAbility_room_id_unlocked_round_idx" ON "GameRoomAbility"("room_id", "unlocked_round");

-- CreateIndex
CREATE INDEX "GameRoomEvent_room_id_created_at_idx" ON "GameRoomEvent"("room_id", "created_at");

-- CreateIndex
CREATE INDEX "GameRoomEvent_room_id_team_key_created_at_idx" ON "GameRoomEvent"("room_id", "team_key", "created_at");

-- AddForeignKey
ALTER TABLE "GameRoom" ADD CONSTRAINT "GameRoom_game_session_id_fkey" FOREIGN KEY ("game_session_id") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRoom" ADD CONSTRAINT "GameRoom_pending_suggested_pick_id_fkey" FOREIGN KEY ("pending_suggested_pick_id") REFERENCES "GameQuestionPick"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRoom" ADD CONSTRAINT "GameRoom_selected_pick_id_fkey" FOREIGN KEY ("selected_pick_id") REFERENCES "GameQuestionPick"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRoomTeam" ADD CONSTRAINT "GameRoomTeam_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRoomParticipant" ADD CONSTRAINT "GameRoomParticipant_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRoomChatMessage" ADD CONSTRAINT "GameRoomChatMessage_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRoomAbility" ADD CONSTRAINT "GameRoomAbility_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRoomEvent" ADD CONSTRAINT "GameRoomEvent_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "GameRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "GameQuestionPick_game_session_id_category_name_value_slot_index" RENAME TO "GameQuestionPick_game_session_id_category_name_value_slot_i_key";

-- RenameIndex
ALTER INDEX "GameQuestionPick_game_session_id_category_name_value_used_at_id" RENAME TO "GameQuestionPick_game_session_id_category_name_value_used_a_idx";
