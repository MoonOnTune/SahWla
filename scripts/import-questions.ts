import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import {
  BANK_CATEGORY_NAMES,
  GAME_POINT_VALUES,
  WALA_KALMA_CATEGORY_NAME,
  WALA_KALMA_SEED_QUESTIONS,
} from "../lib/game/catalog";

const prisma = new PrismaClient();

const BANK_DIR = "/Users/yousefsabti/SahWla/Banks";

const FILE_TO_CATEGORY: Record<string, string> = {
  "category-01-kuwait-gulf.json": "الكويت والخليج",
  "category-02-kuwaiti-slang-sayings.json": "اللهجة الكويتية",
  "category-03-kuwaiti-food-diwaniya.json": "الأكل الكويتي",
  "category-04-world-capitals-countries.json": "عواصم ودول",
  "category-05-famous-landmarks.json": "معالم شهيرة",
  "category-06-hollywood-movies-tv.json": "أفلام ومسلسلات",
  "category-07-sports-big-tournaments.json": "الرياضة والبطولات",
  "category-08-music-artists.json": "الموسيقى والفنانون",
  "category-09-history-highlights.json": "محطات تاريخية",
  "category-10-science.json": "العلوم",
  "category-11-technology-internet.json": "التقنية والإنترنت",
  "category-12-business-brands.json": "علامات تجارية",
  "category-13-animals-nature.json": "الحيوانات والطبيعة",
  "category-14-food-around-world.json": "أطعمة من حول العالم",
  "category-15-language-words.json": "اللغة والكلمات",
  "category-16-mythology-folklore.json": "الأساطير والفلكلور",
  "category-17-riddles-logic.json": "ألغاز ومنطق",
  "category-18-guess-person.json": "خمن الشخصية",
  "category-19-quotes-proverbs.json": "اقتباسات وأمثال",
  "category-20-cars-motors.json": "السيارات والمحركات",
  "category-21-quran-stories-meanings.json": "القرآن الكريم",
  "category-22-prophetic-seerah.json": "السيرة النبوية",
};

type NormalizedQuestion = {
  categoryName: string;
  value: number;
  questionText: string;
  answerText: string;
};

type CountMap = Record<string, number>;

function normalizeText(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}

function hashQuestionText(questionText: string): string {
  return createHash("sha256").update(normalizeText(questionText)).digest("hex");
}

function firstString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string") {
      const normalized = normalizeText(value);
      if (normalized.length > 0) return normalized;
    }
  }
  return null;
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function normalizeQuestionRecord(record: Record<string, unknown>, fallbackValue?: number): Omit<NormalizedQuestion, "categoryName"> | null {
  const questionText = firstString(
    record.question,
    record.question_ar,
    record.q,
    record.prompt,
    record.text,
    record.title,
  );

  const answerText = firstString(
    record.answer,
    record.answer_ar,
    record.a,
    record.solution,
    record.correct,
  );

  const value = firstNumber(record.value, record.points, record.score, fallbackValue);

  if (!questionText || !answerText || value === null) {
    return null;
  }

  return {
    value,
    questionText,
    answerText,
  };
}

function extractQuestionsFromUnknown(input: unknown): Array<Omit<NormalizedQuestion, "categoryName">> {
  const extracted: Array<Omit<NormalizedQuestion, "categoryName">> = [];

  const visit = (node: unknown, fallbackValue?: number): void => {
    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item, fallbackValue);
      }
      return;
    }

    if (!node || typeof node !== "object") {
      return;
    }

    const record = node as Record<string, unknown>;

    const direct = normalizeQuestionRecord(record, fallbackValue);
    if (direct) {
      extracted.push(direct);
      return;
    }

    if (Array.isArray(record.categories)) {
      visit(record.categories, fallbackValue);
    }

    if (Array.isArray(record.questions)) {
      visit(record.questions, fallbackValue);
    }

    for (const [key, value] of Object.entries(record)) {
      if (key === "categories" || key === "questions") continue;

      if (/^\d+$/.test(key)) {
        visit(value, Number(key));
        continue;
      }

      if (typeof value === "object") {
        visit(value, fallbackValue);
      }
    }
  };

  visit(input);

  return extracted;
}

function inferCategoryRanking(fileName: string): Array<{ category: string; score: number }> {
  const slug = fileName.toLowerCase();
  const scoring: Array<{ category: string; score: number }> = BANK_CATEGORY_NAMES.map((category) => ({
    category,
    score: 0,
  }));

  const hints: Array<{ token: string; category: string }> = [
    { token: "kuwait-gulf", category: "الكويت والخليج" },
    { token: "slang", category: "اللهجة الكويتية" },
    { token: "food-diwaniya", category: "الأكل الكويتي" },
    { token: "capitals", category: "عواصم ودول" },
    { token: "landmarks", category: "معالم شهيرة" },
    { token: "movies", category: "أفلام ومسلسلات" },
    { token: "sports", category: "الرياضة والبطولات" },
    { token: "music", category: "الموسيقى والفنانون" },
    { token: "history", category: "محطات تاريخية" },
    { token: "science", category: "العلوم" },
    { token: "technology", category: "التقنية والإنترنت" },
    { token: "brands", category: "علامات تجارية" },
    { token: "animals", category: "الحيوانات والطبيعة" },
    { token: "food-around-world", category: "أطعمة من حول العالم" },
    { token: "language", category: "اللغة والكلمات" },
    { token: "mythology", category: "الأساطير والفلكلور" },
    { token: "riddles", category: "ألغاز ومنطق" },
    { token: "guess-person", category: "خمن الشخصية" },
    { token: "quotes", category: "اقتباسات وأمثال" },
    { token: "cars", category: "السيارات والمحركات" },
    { token: "quran", category: "القرآن الكريم" },
    { token: "seerah", category: "السيرة النبوية" },
  ];

  for (const hint of hints) {
    if (slug.includes(hint.token)) {
      const row = scoring.find((item) => item.category === hint.category);
      if (row) row.score += 10;
    }
  }

  return scoring.sort((a, b) => b.score - a.score);
}

function inferCategoryCandidates(fileName: string): string[] {
  return inferCategoryRanking(fileName)
    .slice(0, 2)
    .map((item) => item.category);
}

async function readSampleQuestions(
  folderPath: string,
  fileName: string,
): Promise<string[]> {
  const absolutePath = path.join(folderPath, fileName);
  const raw = await fs.readFile(absolutePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  return extractQuestionsFromUnknown(parsed)
    .slice(0, 3)
    .map((question) => question.questionText);
}

async function validateMappings(bankFiles: string[], folderPath: string): Promise<void> {
  const missingMappings = bankFiles.filter((fileName) => !FILE_TO_CATEGORY[fileName]);
  if (missingMappings.length > 0) {
    console.error("\nMissing explicit FILE_TO_CATEGORY mappings for:");
    for (const fileName of missingMappings) {
      const topCandidates = inferCategoryCandidates(fileName);
      const samples = await readSampleQuestions(folderPath, fileName).catch(() => []);
      console.error(`- ${fileName}`);
      console.error(`  candidates: ${topCandidates.join(" | ")}`);
      if (samples.length > 0) {
        console.error(`  sample questions: ${samples.join(" || ")}`);
      }
    }
    throw new Error("Please complete FILE_TO_CATEGORY mapping before importing.");
  }

  const invalidTargets = Object.entries(FILE_TO_CATEGORY).filter(([, categoryName]) => !BANK_CATEGORY_NAMES.includes(categoryName));
  if (invalidTargets.length > 0) {
    console.error("\nInvalid category targets in FILE_TO_CATEGORY:");
    for (const [fileName, categoryName] of invalidTargets) {
      console.error(`- ${fileName} => ${categoryName}`);
    }
    throw new Error("FILE_TO_CATEGORY contains category names not present in the game category list.");
  }

  const mappedCategories = Object.values(FILE_TO_CATEGORY);
  const duplicates = mappedCategories.filter((category, index) => mappedCategories.indexOf(category) !== index);
  if (duplicates.length > 0) {
    throw new Error(`FILE_TO_CATEGORY has duplicate category mappings: ${Array.from(new Set(duplicates)).join(", ")}`);
  }

  const ambiguousMappings: string[] = [];
  for (const fileName of bankFiles) {
    const mappedCategory = FILE_TO_CATEGORY[fileName];
    const ranking = inferCategoryRanking(fileName);
    const top1 = ranking[0];
    const top2 = ranking[1];
    const mappedScore = ranking.find((row) => row.category === mappedCategory)?.score ?? 0;
    const isLowConfidence = mappedScore === 0;
    const isAmbiguous = Boolean(top1 && top2 && top1.score - top2.score <= 2);

    if (!isLowConfidence && !isAmbiguous) {
      continue;
    }

    const samples = await readSampleQuestions(folderPath, fileName).catch(() => []);
    ambiguousMappings.push(
      `${fileName}\n` +
        `  mapped: ${mappedCategory}\n` +
        `  candidates: ${top1?.category ?? "n/a"} (${top1?.score ?? 0}) | ${top2?.category ?? "n/a"} (${top2?.score ?? 0})\n` +
        `  sample questions: ${samples.join(" || ") || "n/a"}`,
    );
  }

  if (ambiguousMappings.length > 0) {
    console.error("\nAmbiguous or low-confidence FILE_TO_CATEGORY mappings:");
    for (const warning of ambiguousMappings) {
      console.error(`- ${warning}`);
    }
    throw new Error("Please resolve ambiguous file-to-category mappings before importing.");
  }
}

function countByValue(questions: NormalizedQuestion[]): CountMap {
  const map: CountMap = {};
  for (const value of GAME_POINT_VALUES) {
    map[String(value)] = 0;
  }
  for (const question of questions) {
    const key = String(question.value);
    map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const folderPath = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : BANK_DIR;

  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const bankFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".json"))
    .map((entry) => entry.name)
    .sort();

  if (bankFiles.length === 0) {
    throw new Error(`No JSON files found in: ${folderPath}`);
  }

  await validateMappings(bankFiles, folderPath);

  const importByCategory = new Map<string, NormalizedQuestion[]>();

  for (const fileName of bankFiles) {
    const categoryName = FILE_TO_CATEGORY[fileName];
    const absolutePath = path.join(folderPath, fileName);
    const raw = await fs.readFile(absolutePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;

    const normalized = extractQuestionsFromUnknown(parsed)
      .filter((question) => GAME_POINT_VALUES.includes(question.value))
      .map((question) => ({
        categoryName,
        value: question.value,
        questionText: question.questionText,
        answerText: question.answerText,
      }));

    if (normalized.length === 0) {
      throw new Error(`File '${fileName}' did not produce any importable questions.`);
    }

    importByCategory.set(categoryName, normalized);
  }

  importByCategory.set(
    WALA_KALMA_CATEGORY_NAME,
    WALA_KALMA_SEED_QUESTIONS.map((question) => ({
      categoryName: WALA_KALMA_CATEGORY_NAME,
      value: question.value,
      questionText: question.question,
      answerText: question.answer,
    })),
  );

  let totalImported = 0;
  const perCategoryReport: Array<{ categoryName: string; total: number; byValue: CountMap }> = [];

  for (const [categoryName, questions] of importByCategory.entries()) {
    const dedupedByHash = new Map<string, NormalizedQuestion>();
    for (const question of questions) {
      const hash = hashQuestionText(question.questionText);
      const key = `${categoryName}::${question.value}::${hash}`;
      if (!dedupedByHash.has(key)) {
        dedupedByHash.set(key, question);
      }
    }

    const dedupedQuestions = Array.from(dedupedByHash.values());

    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        await tx.question.updateMany({
          where: {
            category_name: categoryName,
            active: true,
          },
          data: {
            active: false,
          },
        });

        for (const question of dedupedQuestions) {
          const textHash = hashQuestionText(question.questionText);

          await tx.question.upsert({
            where: {
              category_name_value_text_hash: {
                category_name: categoryName,
                value: question.value,
                text_hash: textHash,
              },
            },
            update: {
              question_text: question.questionText,
              answer_text: question.answerText,
              active: true,
            },
            create: {
              category_name: categoryName,
              value: question.value,
              text_hash: textHash,
              question_text: question.questionText,
              answer_text: question.answerText,
              active: true,
            },
          });
        }
      });
    }

    totalImported += dedupedQuestions.length;
    perCategoryReport.push({
      categoryName,
      total: dedupedQuestions.length,
      byValue: countByValue(dedupedQuestions),
    });
  }

  console.log(`\nImport mode: ${dryRun ? "DRY RUN" : "WRITE"}`);
  console.log(`Folder: ${folderPath}`);
  console.log(`JSON files discovered: ${bankFiles.length}`);
  console.log(`Total questions prepared: ${totalImported}`);

  console.log("\nPer-category counts:");
  for (const row of perCategoryReport.sort((a, b) => a.categoryName.localeCompare(b.categoryName))) {
    const valueCounts = GAME_POINT_VALUES.map((value) => `${value}:${row.byValue[String(value)] ?? 0}`).join(" | ");
    console.log(`- ${row.categoryName}: total=${row.total} (${valueCounts})`);
  }

  const missingValueWarnings: string[] = [];
  for (const row of perCategoryReport) {
    for (const value of GAME_POINT_VALUES) {
      if ((row.byValue[String(value)] ?? 0) === 0) {
        missingValueWarnings.push(`${row.categoryName} is missing value ${value}`);
      }
    }
  }

  if (missingValueWarnings.length > 0) {
    console.warn("\nMissing value warnings:");
    for (const warning of missingValueWarnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (!dryRun) {
    const activeQuestionCount = await prisma.question.count({ where: { active: true } });
    console.log(`\nActive questions in DB after import: ${activeQuestionCount}`);
  }
}

main()
  .catch((error) => {
    console.error("\nImport failed:");
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
