export type GameCategoryType = "normal" | "walakalma";

export type GameCategoryDef = {
  name: string;
  type?: GameCategoryType;
};

export const GAME_CATEGORY_DEFS: GameCategoryDef[] = [
  { name: "القرآن الكريم" },
  { name: "السيرة النبوية" },
  { name: "الكويت والخليج" },
  { name: "اللهجة الكويتية" },
  { name: "الأكل الكويتي" },
  { name: "عواصم ودول" },
  { name: "معالم شهيرة" },
  { name: "أفلام ومسلسلات" },
  { name: "الرياضة والبطولات" },
  { name: "الموسيقى والفنانون" },
  { name: "محطات تاريخية" },
  { name: "العلوم" },
  { name: "التقنية والإنترنت" },
  { name: "علامات تجارية" },
  { name: "الحيوانات والطبيعة" },
  { name: "أطعمة من حول العالم" },
  { name: "اللغة والكلمات" },
  { name: "الأساطير والفلكلور" },
  { name: "ألغاز ومنطق" },
  { name: "خمن الشخصية" },
  { name: "اقتباسات وأمثال" },
  { name: "السيارات والمحركات" },
  { name: "ولا كلمة", type: "walakalma" },
];

export const WALA_KALMA_CATEGORY_NAME = "ولا كلمة";

export const GAME_CATEGORY_NAMES = GAME_CATEGORY_DEFS.map((category) => category.name);

export const BANK_CATEGORY_NAMES = GAME_CATEGORY_DEFS
  .filter((category) => category.name !== WALA_KALMA_CATEGORY_NAME)
  .map((category) => category.name);

export const GAME_POINT_VALUE_SLOTS = [200, 200, 400, 400, 600, 600] as const;

export const GAME_POINT_VALUES = Array.from(new Set(GAME_POINT_VALUE_SLOTS));

export type WalakalmaSeedQuestion = {
  value: number;
  question: string;
  answer: string;
};

export const WALA_KALMA_SEED_QUESTIONS: WalakalmaSeedQuestion[] = [
  { value: 200, question: "الأسد الملك", answer: "الأسد الملك" },
  { value: 200, question: "البحث عن نيمو", answer: "البحث عن نيمو" },
  { value: 400, question: "تايتانيك", answer: "تايتانيك" },
  { value: 400, question: "المهمة المستحيلة", answer: "المهمة المستحيلة" },
  { value: 600, question: "عمارة يعقوبيان", answer: "عمارة يعقوبيان" },
  { value: 600, question: "الناصر صلاح الدين", answer: "الناصر صلاح الدين" },
];
