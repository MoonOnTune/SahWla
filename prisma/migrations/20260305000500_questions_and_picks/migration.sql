-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "text_hash" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameQuestionPick" (
    "id" TEXT NOT NULL,
    "game_session_id" TEXT NOT NULL,
    "category_name" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "slot_index" INTEGER NOT NULL,
    "question_id" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameQuestionPick_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Question_category_name_value_text_hash_key" ON "Question"("category_name", "value", "text_hash");

-- CreateIndex
CREATE INDEX "Question_category_name_value_active_idx" ON "Question"("category_name", "value", "active");

-- CreateIndex
CREATE UNIQUE INDEX "GameQuestionPick_game_session_id_category_name_value_slot_index_key" ON "GameQuestionPick"("game_session_id", "category_name", "value", "slot_index");

-- CreateIndex
CREATE INDEX "GameQuestionPick_game_session_id_idx" ON "GameQuestionPick"("game_session_id");

-- CreateIndex
CREATE INDEX "GameQuestionPick_question_id_idx" ON "GameQuestionPick"("question_id");

-- CreateIndex
CREATE INDEX "GameQuestionPick_game_session_id_category_name_value_used_at_idx" ON "GameQuestionPick"("game_session_id", "category_name", "value", "used_at");

-- AddForeignKey
ALTER TABLE "GameQuestionPick" ADD CONSTRAINT "GameQuestionPick_game_session_id_fkey" FOREIGN KEY ("game_session_id") REFERENCES "GameSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuestionPick" ADD CONSTRAINT "GameQuestionPick_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "Question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
