import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';

export type Language = 'ar' | 'en';
export type Screen = 'welcome' | 'categories' | 'teams' | 'board' | 'question' | 'walakalma' | 'winner';
export type QuestionPhase = 'showing' | 'timerA' | 'timerB' | 'answer';

export interface Question {
  question: string;
  answer: string;
  value: number;
}

export interface Category {
  name: string;
  questions: Question[];
  type?: 'normal' | 'walakalma';
}

export interface Team {
  name: string;
  nameAr: string;
  score: number;
  playerCount: number;
  playerNames: string[];
  color: string;
  colorLight: string;
}

interface SelectedQuestion {
  catIndex: number;
  qIndex: number;
}

interface GameContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  screen: Screen;
  setScreen: (s: Screen) => void;
  categories: Category[];
  setCategories: (c: Category[]) => void;
  teams: [Team, Team];
  setTeams: (t: [Team, Team]) => void;
  currentTurn: number;
  setCurrentTurn: (t: number) => void;
  selectedQuestion: SelectedQuestion | null;
  setSelectedQuestion: (q: SelectedQuestion | null) => void;
  questionPhase: QuestionPhase;
  setQuestionPhase: (p: QuestionPhase) => void;
  usedTiles: Set<string>;
  markTileUsed: (key: string) => void;
  awardPoints: (teamIndex: number, points: number) => void;
  t: (ar: string, en: string) => string;
  resetGame: () => void;
  rematch: () => void;
}

const defaultTeams: [Team, Team] = [
  { name: 'Team A', nameAr: 'الفريق أ', score: 0, playerCount: 2, playerNames: [], color: '#06b6d4', colorLight: '#22d3ee' },
  { name: 'Team B', nameAr: 'الفريق ب', score: 0, playerCount: 2, playerNames: [], color: '#d946ef', colorLight: '#e879f9' },
];

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

// ---- localStorage persistence helpers ----
const STORAGE_KEY = 'sah_wala_game_state';

interface SavedGameState {
  screen: Screen;
  categories: Category[];
  teams: [Team, Team];
  currentTurn: number;
  selectedQuestion: SelectedQuestion | null;
  questionPhase: QuestionPhase;
  usedTiles: string[]; // serialized from Set
}

function loadSavedState(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedGameState;
    // Basic validation
    if (!parsed.screen || !parsed.categories || !parsed.teams) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveState(state: SavedGameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}

// Preset Arabic categories with questions
export const PRESET_CATEGORIES: Category[] = [
  {
    name: 'القرآن الكريم',
    questions: [
      { question: 'ما اسم السورة التي تُلقّب بـ "قلب القرآن"؟', answer: 'سورة يس', value: 200 },
      { question: 'من هو النبي الذي ابتلعه الحوت؟', answer: 'يونس عليه السلام', value: 200 },
      { question: 'كم عدد سور القرآن الكريم؟', answer: '٢٩ سورة', value: 400 },
      { question: 'ما اسم السورة التي ذُكرت فيها قصة أصحاب الكهف؟', answer: 'سورة الكهف', value: 400 },
      { question: 'من هو النبي الذي أُلقي في النار فجعلها الله برداً وسلاماً عليه؟', answer: 'إبراهيم عليه السلام', value: 600 },
      { question: 'ما هي السورة التي ذُكر فيها اسم امرأة صراحةً وهي الوحيدة في القرآن؟', answer: 'سورة مريم (مريم عليها السلام)', value: 600 },
    ],
  },
  {
    name: 'السيرة النبوية',
    questions: [
      { question: 'ما اسم أم النبي محمد ﷺ؟', answer: 'آمنة بنت وهب', value: 200 },
      { question: 'في أي غار كان النبي ﷺ يتعبّد قبل البعثة؟', answer: 'غار حراء', value: 200 },
      { question: 'من هو الصحابي الذي رافق النبي ﷺ في هجرته إلى المدينة؟', answer: 'أبو بكر الصديق رضي الله عنه', value: 400 },
      { question: 'ما اسم أول معركة كبرى في الإسلام وفي أي سنة هجرية وقعت؟', answer: 'غزوة بدر — السنة الثانية للهجرة', value: 400 },
      { question: 'ما اسم الغار الذي اختبأ فيه النبي ﷺ وأبو بكر أثناء الهجرة؟', answer: 'غار ثور', value: 600 },
      { question: 'ما هو الاسم الذي أُطلق على العام الذي وُلد فيه النبي ﷺ ولماذا؟', answer: 'عام الفيل — لأن أبرهة الحبشي حاول هدم الكعبة بالفيلة في نفس العام', value: 600 },
    ],
  },
  {
    name: 'الكويت والخليج',
    questions: [
      { question: 'ما هو الاسم القديم للكويت؟', answer: 'القرين', value: 200 },
      { question: 'في أي عام استقلت دولة الكويت؟', answer: '١٩٦١', value: 200 },
      { question: 'ما اسم أشهر معلم معماري في الكويت يت��ون من ثلاثة أبراج؟', answer: 'أبراج الكويت', value: 400 },
      { question: 'ما هو أكبر حقل نفطي في الكويت؟', answer: 'حقل برقان', value: 400 },
      { question: 'ما اسم الجزيرة الكويتية التي تُعتبر أكبر جزيرة في الخليج العربي؟', answer: 'جزيرة بوبيان', value: 600 },
      { question: 'من هو مؤسس إمارة الكويت من آل صباح؟', answer: 'صباح الأول بن جابر', value: 600 },
    ],
  },
  {
    name: 'اللهجة الكويتية',
    questions: [
      { question: 'شنو يعني "يقوم الساع" باللهجة الكويتية؟', answer: 'يقوم فوراً / حالاً', value: 200 },
      { question: 'شنو يعني "إمبيّن"؟', answer: 'واضح / ظاهر', value: 200 },
      { question: 'أكمل المثل: "اللي ما يعرف الصقر..."', answer: 'يشويه', value: 400 },
      { question: 'شنو يعني "دحين"؟', answer: 'الحين / الآن', value: 400 },
      { question: 'أكمل المثل: "عنز ولو طارت"...', answer: 'يعني الشيء لا يتغير مهما حاول', value: 600 },
      { question: 'شنو يعني "تكرفس"؟', answer: 'تكاسل وما يسوي شي', value: 600 },
    ],
  },
  {
    name: 'الأكل الكويتي',
    questions: [
      { question: 'ما هو الطبق الكويتي الشهير المكون من الأرز والدجاج أو اللحم؟', answer: 'المچبوس', value: 200 },
      { question: 'ما اسم الحلوى الكويتية الشهيرة المصنوعة من التمر والطحين؟', answer: 'اللقيمات', value: 200 },
      { question: 'ما هي الوجبة الكويتية التقليدية في رمضان المكونة من القمح واللحم؟', answer: 'الهريس', value: 400 },
      { question: 'ما هو المشروب التقليدي الذي يُقدم في الديوانية الكويتية؟', answer: 'الشاي (چاي)', value: 400 },
      { question: 'ما اسم الطبق البحري الكويتي المصنوع من السمك المجفف والأرز؟', answer: 'المطبّق سمك', value: 600 },
      { question: 'ما هو البهار الكويتي المميز الذي يُستخدم في المچبوس؟', answer: 'بهارات المچبوس (لومي أسود + بزار)', value: 600 },
    ],
  },
  {
    name: 'عواصم ودول',
    questions: [
      { question: 'ما هي عاصمة فرنسا؟', answer: 'باريس', value: 200 },
      { question: 'ما هي عاصمة اليابان؟', answer: 'طوكيو', value: 200 },
      { question: 'ما هي عاصمة البرازيل؟', answer: 'برازيليا (وليست ريو دي جانيرو)', value: 400 },
      { question: 'ما هي عاصمة أستراليا؟', answer: 'كانبرا (وليست سيدني)', value: 400 },
      { question: 'ما هي عاصمة ميانمار؟', answer: 'نايبيداو', value: 600 },
      { question: 'ما هي الدولة التي لها عاصمتان رسميتان؟ (إحداهما تشريعية والأخرى قضائية)', answer: 'جنوب أفريقيا (بريتوريا وكيب تاون)', value: 600 },
    ],
  },
  {
    name: 'معالم شهيرة',
    questions: [
      { question: 'في أي مدينة يوجد برج إيفل؟', answer: 'باريس', value: 200 },
      { question: 'أين يقع تمثال الحرية؟', answer: 'نيويورك، الولايات المتحدة', value: 200 },
      { question: 'ما هو المعلم الهندي الشهير المصنوع من الرخام الأبيض؟', answer: 'تاج محل', value: 400 },
      { question: 'أين يقع سور الصين العظيم وكم يبلغ طوله تقريباً؟', answer: 'الصين — حوالي ٢١,٠٠٠ كم', value: 400 },
      { question: 'أين تقع مدينة البتراء المنحوتة في الصخر؟', answer: 'الأردن', value: 600 },
      { question: 'ما هو أطول مبنى في العالم وأين يقع؟', answer: 'برج خليفة — دبي', value: 600 },
    ],
  },
  {
    name: 'أفلام ومسلسلات',
    questions: [
      { question: 'ما اسم السفينة في فيلم تايتانيك؟', answer: 'آر إم إس تايتانيك (RMS Titanic)', value: 200 },
      { question: 'من يلعب دور الرجل الحديدي (Iron Man) في أفلام مارفل؟', answer: 'روبرت داوني جونيور', value: 200 },
      { question: 'ما هو الاسم الكامل لشخصية "والتر وايت" في مسلسل Breaking Bad؟', answer: 'والتر هارتويل وايت (هايزنبرغ)', value: 400 },
      { question: 'كم عدد أفلام سلسلة هاري بوتر؟', answer: 'ثمانية أفلام', value: 400 },
      { question: 'أي فيلم فاز بأكبر عدد من جوائز الأوسكار في التاريخ؟', answer: 'تايتانيك / بن هور / سيد الخواتم (١١ جائزة لكل منهم)', value: 600 },
      { question: 'من هو مخرج ثلاثية "سيد الخواتم"؟', answer: 'بيتر جاكسون', value: 600 },
    ],
  },
  {
    name: 'الرياضة والبطولات',
    questions: [
      { question: 'كم عدد لاعبي فريق كرة القدم على أرض الملعب؟', answer: 'أحد عشر لاعباً', value: 200 },
      { question: 'أين أقيمت بطولة كأس العالم ٢٠٢٢؟', answer: 'قطر', value: 200 },
      { question: 'من هو هداف كأس العالم التاريخي؟', answer: 'ميروسلاف كلوزه (١٦ هدفاً)', value: 400 },
      { question: 'كم مرة فازت البرازيل بكأس العالم؟', answer: 'خمس مرات', value: 400 },
      { question: 'أين أقيمت أول دورة ألعاب أولمبية حديثة ومتى؟', answer: 'أثينا، اليونان — ١٨٩٦', value: 600 },
      { question: 'ما هو الرقم القياسي العالمي لسباق ٠٠ متر ومن يحمله؟', answer: 'يوسين بولت — ٩.٥٨ ثانية', value: 600 },
    ],
  },
  {
    name: 'الموسيقى والفنانون',
    questions: [
      { question: 'من هي "كوكب الشرق"؟', answer: 'أم كلثوم', value: 200 },
      { question: 'من غنّى أغنية "Bohemian Rhapsody"؟', answer: 'فرقة كوين (Queen) — فريدي ميركوري', value: 200 },
      { question: 'ما هي جنسية المغنية شاكيرا؟', answer: 'كولومبية', value: 400 },
      { question: 'من لحّن أغنية "أنت عمري" لأم كلثوم؟', answer: 'محمد عبد الوهاب', value: 400 },
      { question: 'ما اسم ألبوم مايكل جاكسون الأكثر مبيعاً في التاريخ؟', answer: 'Thriller', value: 600 },
      { question: 'من هو الملحن الألماني الأصم الذي ألّف السيمفونية التاسعة؟', answer: 'لودفيغ فان بيتهوفن', value: 600 },
    ],
  },
  {
    name: 'محطات تاريخية',
    questions: [
      { question: 'متى وقع سقوط جدار برلين؟', answer: '١٩٨٩', value: 200 },
      { question: 'من هو أول إنسان مشى على سطح القمر؟', answer: 'نيل أرمسترونغ', value: 200 },
      { question: 'في أي عام اندلعت الثورة الفرنسية؟', answer: '١٧٨٩', value: 400 },
      { question: 'ما هي الحضارة التي بنت مدينة ماتشو بيتشو؟', answer: 'حضارة الإنكا', value: 400 },
      { question: 'من هو القائد المغولي الذي أسس أكبر إمبراطورية برية في التاريخ؟', answer: 'جنكيز خان', value: 600 },
      { question: 'ما هو اسم المعاهدة التي أنهت الحرب العالمية الأولى؟', answer: 'معاهدة فرساي', value: 600 },
    ],
  },
  {
    name: 'العلوم',
    questions: [
      { question: 'ما هو أقرب كوكب إلى الشمس؟', answer: 'عطارد', value: 200 },
      { question: 'كم عدد عظام جسم الإنسان البالغ؟', answer: '٢٠٦ عظمة', value: 200 },
      { question: 'من اخترع المصباح الكهربائي؟', answer: 'توماس إديسون', value: 400 },
      { question: 'ما هو أكبر عضو في جسم الإنسان؟', answer: 'الجلد', value: 400 },
      { question: 'ما هي المجرة التي يقع فيها كوكب الأرض؟', answer: 'مجرة درب التبانة', value: 600 },
      { question: 'ما هو العنصر الكيميائي الذي رمزه Au؟', answer: 'الذهب', value: 600 },
    ],
  },
  {
    name: 'التقنية والإنترنت',
    questions: [
      { question: 'ما هو أكثر تطبيق تواصل اجتماعي استخداماً في العالم؟', answer: 'فيسبوك', value: 200 },
      { question: 'من هو مؤسس شركة أبل؟', answer: 'ستيف جوبز', value: 200 },
      { question: 'في أي عام أُطلق أول آيفون؟', answer: '٢٠٠٧', value: 400 },
      { question: 'ما اسم محرك البحث الذي أسسه لاري بيج وسيرجي برين؟', answer: 'جوجل (Google)', value: 400 },
      { question: 'ما هو ChatGPT وأي شركة طورته؟', answer: 'نموذج ذكاء اصطناعي من شركة OpenAI', value: 600 },
      { question: 'ما هي العملة الرقمية الأولى في العالم؟', answer: 'بيتكوين (Bitcoin)', value: 600 },
    ],
  },
  {
    name: 'علامات تجارية',
    questions: [
      { question: 'ما هي الشركة صاحبة شعار "التفاحة المقضومة"؟', answer: 'أبل (Apple)', value: 200 },
      { question: 'ما هي أكبر شركة تجارة إلكترونية في العالم؟', answer: 'أمازون (Amazon)', value: 200 },
      { question: 'من هو مؤسس شركة تسلا للسيارات الكهربائية؟', answer: 'إيلون ماسك (شارك في التأسيس)', value: 400 },
      { question: 'ما هي ماركة الأزياء الإيطالية ذات الشعار المكون من حرفين G متقابلين؟', answer: 'غوتشي (Gucci)', value: 400 },
      { question: 'ما اسم مؤسس شركة علي بابا الصينية؟', answer: 'جاك ما', value: 600 },
      { question: 'ما هي الشركة الأعلى قيمة سوقية في العالم؟', answer: 'أبل (Apple)', value: 600 },
    ],
  },
  {
    name: 'الحيوانات والطبيعة',
    questions: [
      { question: 'ما هو أسرع حيوان بري في العالم؟', answer: 'الفهد (الشيتا)', value: 200 },
      { question: 'ما هو أكبر حيوان على وجه الأرض؟', answer: 'الحوت الأزرق', value: 200 },
      { question: 'كم قلب للأخطبوط؟', answer: 'ثلاثة قلوب', value: 400 },
      { question: 'ما هو الحيوان الوحيد الذي لا يستطيع القفز؟', answer: 'الفيل', value: 400 },
      { question: 'ما هي أكبر غابة مطيرة في العالم؟', answer: 'غابة الأمازون', value: 600 },
      { question: 'ما هو الحيوان الذي ينام وعين مفتوحة؟', answer: 'الدلفين', value: 600 },
    ],
  },
  {
    name: 'أطعمة من حول العالم',
    questions: [
      { question: 'من أي بلد نشأت البيتزا؟', answer: 'إيطاليا', value: 200 },
      { question: 'أي دولة تشتهر بطبق السوشي؟', answer: 'اليابان', value: 200 },
      { question: 'ما هي التوابل الأغلى في العالم؟', answer: 'الزعفران', value: 400 },
      { question: 'من أي بلد نشأ طبق "الباييلا" الشهير بالأرز والمأكولات البحرية؟', answer: 'إسبانيا', value: 400 },
      { question: 'ما هو الطبق الوطني لتايلاند المكون من النودلز المقلية؟', answer: 'باد تاي (Pad Thai)', value: 600 },
      { question: 'ما هي الفاكهة الآسيوية ذات الرائحة القوية جداً والمحظورة في بعض الفنادق؟', answer: 'الدوريان', value: 600 },
    ],
  },
  {
    name: 'اللغة والكلمات',
    questions: [
      { question: 'كم عدد حروف اللغة العربية؟', answer: '٢٨ حرفاً', value: 200 },
      { question: 'ما هي اللغة الأكثر تحدثاً في العالم؟', answer: 'الماندرين (الصينية)', value: 200 },
      { question: 'ما معنى كلمة "أوكي" (OK) وما أصلها؟', answer: 'اختصار لـ "Oll Korrect" — تحريف مقصود لـ All Correct', value: 400 },
      { question: 'ما هي اللغة التي تُكتب من اليسار لليمين ومن اليمين لليسار في نفس الوقت؟', answer: 'لا توجد — لكن الصينية تُكتب عمودياً', value: 400 },
      { question: 'ما هي أطول كلمة في اللغة العربية؟', answer: 'أفاستسقيناكموها (١٥ حرفاً)', value: 600 },
      { question: 'ما هي اللغة التي يُطلق عليها "لغة الضاد"؟', answer: 'اللغة العربية', value: 600 },
    ],
  },
  {
    name: 'الأساطير والفلكلور',
    questions: [
      { question: 'ما اسم إله البحر عند الإغريق؟', answer: 'بوسيدون', value: 200 },
      { question: 'ما هو اسم الطائر الأسطوري الذي يبعث من رماده؟', answer: 'طائر الفينيق (العنقاء)', value: 200 },
      { question: 'من هو بطل قصة "ألف ليلة وليلة" الذي سافر سبع رحلات؟', answer: 'السندباد البحري', value: 400 },
      { question: 'ما اسم المخلوق الأسطوري نصف إنسان ونصف حصان عند الإغريق؟', answer: 'القنطور (سنتور)', value: 400 },
      { question: 'ما هو اسم المطرقة السحرية لإله الرعد ثور في الأساطير الإسكندنافية؟', answer: 'ميولنير (Mjolnir)', value: 600 },
      { question: 'ما اسم الجنية التي تسكن البحر في الفلكلور العربي الخليجي؟', answer: 'أم الدويس / بنت البحر', value: 600 },
    ],
  },
  {
    name: 'ألغاز ومنطق',
    questions: [
      { question: 'ما هو الشيء الذي له رأس وليس له عيون؟', answer: 'الدبوس / المسمار', value: 200 },
      { question: 'أنا أطول حين أكون صغيراً وأقصر حين أكبر. ما أنا؟', answer: 'الشمعة', value: 200 },
      { question: 'إذا كان عندك ٣ تفاحات وأخذت ٢، كم تفاحة عندك؟', answer: '٢ (اللي أخذتهم)', value: 400 },
      { question: 'ما هو الشيء الذي كلما أخذت منه كبر؟', answer: 'الحفرة', value: 400 },
      { question: 'أب وابنه بحادث. الأب توفي. الابن دخل العمليات والجراح قال: "ما أقدر أسوي العملية، هذا ولدي!" من هو الجراح؟', answer: 'أمه', value: 600 },
      { question: 'يمشي بلا أرجل ويبكي بلا عيون. ما هو؟', answer: 'الغيمة / السحابة', value: 600 },
    ],
  },
  {
    name: 'خمن الشخصية',
    questions: [
      { question: 'عالم فيزياء ألماني اشتهر بنظرية النسبية ومعادلة E=mc²', answer: 'ألبرت أينشتاين', value: 200 },
      { question: 'ملاكم أمريكي أسلم وغيّر اسمه، ويُلقب بـ "الأعظم"', answer: 'محمد علي كلاي', value: 200 },
      { question: '��سام إيطالي رسم "العشاء الأخير" و"الموناليزا"', answer: 'ليوناردو دافنشي', value: 400 },
      { question: 'مخترع أمريكي اخترع المصباح الكهربائي والفونوغراف', answer: 'توماس إديسون', value: 400 },
      { question: 'مستكشف إيطالي عبر المحيط الأطلسي ووصل لأمريكا عام ١٤٩٢', answer: 'كريستوفر كولومبوس', value: 600 },
      { question: 'ملكة مصر القديمة عُرفت بجمالها وذكائها وعلاقتها بيوليوس قيصر', answer: 'كليوباترا', value: 600 },
    ],
  },
  {
    name: 'اقتباسات وأمثال',
    questions: [
      { question: 'من القائل: "أنا أفكر إذن أنا موجود"؟', answer: 'رينيه ديكارت', value: 200 },
      { question: 'أكمل المثل العربي: "من جدّ..."', answer: 'وجد', value: 200 },
      { question: 'من القائل: "لي حيلة فيمن ينم، ليس لي حيلة فيمن يتألم"؟', answer: 'المتنبي', value: 400 },
      { question: 'من قال: "سأكون أو لا أكون، تلك هي المسألة"؟', answer: 'وليم شكسبير (هاملت)', value: 400 },
      { question: 'من القائل: "إذا الشعب يوماً أراد الحياة فلا بد أن يست��يب القدر"؟', answer: 'أبو القاسم الشابي', value: 600 },
      { question: 'من القائل: "النصر ينتمي لأولئك الذين يؤمنون به أكثر"؟', answer: 'نابليون بونابرت', value: 600 },
    ],
  },
  {
    name: 'السيارات والمحركات',
    questions: [
      { question: 'ما هي الدولة المصنعة لسيارات تويوتا؟', answer: 'اليابان', value: 200 },
      { question: 'ما هو شعار شركة مرسيدس بنز؟', answer: 'النجمة الثلاثية', value: 200 },
      { question: 'ما هي أسرع سيارة إنتاج في العالم من حيث السرعة القصوى؟', answer: 'بوغاتي شيرون سوبر سبورت (أو ما يعادلها)', value: 400 },
      { question: 'ما اسم سباق السيارات الأشهر الذي يُقام في موناكو؟', answer: 'جائزة موناكو الكبرى (فورمولا ٢)', value: 400 },
      { question: 'من هو مؤسس شركة فيراري؟', answer: 'إنزو فيراري', value: 600 },
      { question: 'ما اسم أول سيارة أنتجها هنري فورد للعامة؟', answer: 'فورد موديل تي (Model T)', value: 600 },
    ],
  },
  // Movie-guessing category "ولا كلمة"
  {
    name: 'ولا كلمة',
    type: 'walakalma',
    questions: [
      { question: 'الأسد الملك', answer: 'الأسد الملك', value: 200 },
      { question: 'البحث عن نيمو', answer: 'البحث عن نيمو', value: 200 },
      { question: 'تايتانيك', answer: 'تايتانيك', value: 400 },
      { question: 'المهمة المستحيلة', answer: 'المهمة المستحيلة', value: 400 },
      { question: 'عمارة يعقوبيان', answer: 'عمارة يعقوبيان', value: 600 },
      { question: 'الناصر صلاح الدين', answer: 'الناصر صلاح الدين', value: 600 },
    ],
  },
];

interface GameProviderProps {
  children: ReactNode;
  initialScreen?: Screen;
}

export function GameProvider({ children, initialScreen }: GameProviderProps) {
  // Try to load saved state
  const saved = useRef(loadSavedState());
  const hasRestored = useRef(false);

  const [language, setLanguage] = useState<Language>('ar');
  const [screen, setScreen] = useState<Screen>(saved.current?.screen || initialScreen || 'categories');
  const [categories, setCategories] = useState<Category[]>(saved.current?.categories || []);
  const [teams, setTeams] = useState<[Team, Team]>(
    saved.current?.teams || [{ ...defaultTeams[0] }, { ...defaultTeams[1] }]
  );
  const [currentTurn, setCurrentTurn] = useState(saved.current?.currentTurn ?? 0);
  const [selectedQuestion, setSelectedQuestion] = useState<SelectedQuestion | null>(
    saved.current?.selectedQuestion ?? null
  );
  const [questionPhase, setQuestionPhase] = useState<QuestionPhase>(
    saved.current?.questionPhase || 'showing'
  );
  const [usedTiles, setUsedTiles] = useState<Set<string>>(
    new Set(saved.current?.usedTiles || [])
  );

  // If we restored from a mid-question state, snap back to the board
  useEffect(() => {
    if (hasRestored.current) return;
    hasRestored.current = true;
    if (saved.current) {
      const s = saved.current.screen;
      // If the saved state was mid-question or mid-walakalma, return to board
      if (s === 'question' || s === 'walakalma') {
        setScreen('board');
        setSelectedQuestion(null);
        setQuestionPhase('showing');
      }
    }
  }, []);

  // ---- Persist to localStorage on every meaningful state change ----
  useEffect(() => {
    // Don't persist the welcome screen (nothing to save) or winner (game over)
    if (screen === 'winner') {
      clearSavedState();
      return;
    }
    const stateToSave: SavedGameState = {
      screen,
      categories,
      teams,
      currentTurn,
      selectedQuestion,
      questionPhase,
      usedTiles: Array.from(usedTiles),
    };
    saveState(stateToSave);
  }, [screen, categories, teams, currentTurn, selectedQuestion, questionPhase, usedTiles]);

  const markTileUsed = useCallback((key: string) => {
    setUsedTiles(prev => new Set(prev).add(key));
  }, []);

  const awardPoints = useCallback((teamIndex: number, points: number) => {
    setTeams(prev => {
      const next = [...prev] as [Team, Team];
      next[teamIndex] = { ...next[teamIndex], score: next[teamIndex].score + points };
      return next;
    });
  }, []);

  const t = useCallback((ar: string, en: string) => language === 'ar' ? ar : en, [language]);

  const resetGame = useCallback(() => {
    clearSavedState();
    setScreen('categories');
    setCategories([]);
    setTeams([{ ...defaultTeams[0] }, { ...defaultTeams[1] }]);
    setCurrentTurn(0);
    setSelectedQuestion(null);
    setQuestionPhase('showing');
    setUsedTiles(new Set());
  }, []);

  const rematch = useCallback(() => {
    setTeams(prev => [
      { ...prev[0], score: 0 },
      { ...prev[1], score: 0 },
    ] as [Team, Team]);
    setCurrentTurn(0);
    setSelectedQuestion(null);
    setQuestionPhase('showing');
    setUsedTiles(new Set());
    setScreen('board');
  }, []);

  return (
    <GameContext.Provider value={{
      language, setLanguage, screen, setScreen,
      categories, setCategories, teams, setTeams,
      currentTurn, setCurrentTurn, selectedQuestion, setSelectedQuestion,
      questionPhase, setQuestionPhase, usedTiles, markTileUsed,
      awardPoints, t, resetGame, rematch,
    }}>
      {children}
    </GameContext.Provider>
  );
}