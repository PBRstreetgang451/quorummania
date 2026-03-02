import { useState, useMemo, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

function binomialProb(n, k, p) {
  if (k <= 0) return 1;
  if (k > n) return 0;
  if (p <= 0) return 0;
  if (p >= 1) return 1;
  const logFact = [0];
  for (let i = 1; i <= n; i++) logFact[i] = logFact[i - 1] + Math.log(i);
  let prob = 0;
  for (let i = k; i <= n; i++)
    prob += Math.exp(
      logFact[n] -
        logFact[i] -
        logFact[n - i] +
        i * Math.log(p) +
        (n - i) * Math.log(1 - p)
    );
  return Math.min(1, prob);
}
function getQuorumCount(n, type, fixed, fn, fd, pct) {
  if (type === 'majority') return Math.floor(n / 2) + 1;
  if (type === 'fixed') return Math.min(Math.max(1, fixed), n);
  if (type === 'fraction') return Math.ceil(n * (fn / fd));
  return Math.ceil(n * (pct / 100));
}
function findMinAttendance(n, q, target = 0.95) {
  if (q > n) return 1;
  let lo = 0,
    hi = 1;
  for (let i = 0; i < 60; i++) {
    const m = (lo + hi) / 2;
    binomialProb(n, q, m) >= target ? (hi = m) : (lo = m);
  }
  return hi;
}

const CONF_LEVELS = [80, 85, 90, 95, 99];
const CONF_COLORS = {
  80: '#94a3b8',
  85: '#38bdf8',
  90: '#34d399',
  95: '#f59e0b',
  99: '#f87171',
};
const clr = {
  good: '#34d399',
  bad: '#f87171',
  neutral: '#6366f1',
  warn: '#f59e0b',
  muted: '#64748b',
  text: '#e2e8f0',
  dim: '#94a3b8',
};

const TR = {
  en: {
    name: 'English',
    rtl: false,
    calc1Title:
      'What average attendance do my members need to reliably make quorum?',
    calc1Sub:
      'Set your board size, quorum rule, and confidence level — get the minimum average attendance rate needed.',
    calc2Title: 'What is the probability my group will make quorum?',
    calc2Sub:
      'Enter your board size, quorum rule, and actual average attendance to find your per-meeting quorum probability.',
    explTitle: 'Quorum, quorum, quorum!',
    explSub:
      'Interactive explainer — understand the math behind the calculators',
    cfg: 'Configuration',
    boardSize: 'Total Board Seats',
    vacant: 'Vacant Seats',
    filled: 'Filled Seats',
    basisLbl: 'Quorum Based On',
    basisTotal: 'Total authorized seats',
    basisFilled: 'Filled seats only',
    qDef: 'Quorum Definition',
    optMaj: 'Simple Majority (⌊n/2⌋ + 1)',
    optFix: 'Fixed Number',
    optFrac: 'Custom Fraction',
    optPct: 'Percentage Threshold',
    memReq: 'Members required',
    fracLbl: 'Fraction (numerator / denominator)',
    pctLbl: 'Threshold (%)',
    confLbl: 'Confidence Level',
    qReq: 'Quorum requirement',
    minAttLbl: 'Minimum average attendance needed',
    confWord: 'confidence',
    prob: 'Probability',
    attRate: 'Attendance rate',
    simpMaj: 'Simple majority',
    fixNum: 'Fixed number',
    mems: 'members',
    fracWord: 'fraction',
    thrWord: 'threshold',
    ofWord: 'of',
    rWith: 'With a',
    rBoard: 'member board requiring',
    rForQ:
      'members for quorum, if each member independently attends at a rate of',
    rChance: 'there is a',
    rEnd: 'chance that quorum will be reached at any given meeting.',
    chartTitle: 'Probability of Reaching Quorum by Attendance Rate',
    chartNote:
      'Colored dashed line = selected confidence level. Purple dashed line = minimum required attendance.',
    tblTitle: 'Attendance Required by Confidence Level',
    tblConf: 'Confidence Level',
    tblAtt: 'Min. Avg. Attendance',
    tblBar: 'Bar',
    selTag: 'selected',
    avgAttLbl: 'Average Individual Attendance Rate (%)',
    avgAttNote: 'What % of meetings does a typical member attend?',
    probResult: 'Probability of Reaching Quorum',
    probChartTitle: 'How Probability Changes with Attendance Rate',
    probChartNote: 'Green dashed line = your current attendance rate.',
    probTblTitle: 'Confidence Benchmark Check',
    mtgsLbl: 'Meetings per year (optional)',
    missedLbl: 'expected meetings without quorum/year',
    yourRate: '← your rate',
    vacNote:
      'Note: Quorum calculated against total seats. Only {f} of {t} seats are filled — max possible attendance is {f}.',
    vacImp:
      '⚠️ Quorum is impossible: {q} members required but only {f} seats are filled.',
    asmNote:
      '📊 Model assumption: This calculator assumes each member attends independently with equal probability. In practice, attendance can be correlated (bad weather, competing events) and members vary in reliability. Treat this as a statistical baseline, not a guarantee.',
    qImp: 'Quorum impossible',
    lang: 'Language',
  },
  es: {
    name: 'Español',
    rtl: false,
    calc1Title:
      '¿Qué asistencia promedio necesitan mis miembros para alcanzar el quórum?',
    calc1Sub:
      'Configure el tamaño de la junta, la regla de quórum y el nivel de confianza.',
    calc2Title: '¿Cuál es la probabilidad de que mi grupo alcance el quórum?',
    calc2Sub:
      'Ingrese el tamaño de la junta, la regla de quórum y la asistencia promedio real.',
    explTitle: '¡Quórum, quórum, quórum!',
    explSub:
      'Explicador interactivo — comprenda las matemáticas detrás de las calculadoras',
    cfg: 'Configuración',
    boardSize: 'Asientos Totales',
    vacant: 'Asientos Vacantes',
    filled: 'Asientos Ocupados',
    basisLbl: 'Quórum Basado En',
    basisTotal: 'Asientos totales autorizados',
    basisFilled: 'Solo asientos ocupados',
    qDef: 'Definición de Quórum',
    optMaj: 'Mayoría Simple (⌊n/2⌋ + 1)',
    optFix: 'Número Fijo',
    optFrac: 'Fracción Personalizada',
    optPct: 'Umbral de Porcentaje',
    memReq: 'Miembros requeridos',
    fracLbl: 'Fracción (numerador / denominador)',
    pctLbl: 'Umbral (%)',
    confLbl: 'Nivel de Confianza',
    qReq: 'Requisito de quórum',
    minAttLbl: 'Asistencia promedio mínima necesaria',
    confWord: 'confianza',
    prob: 'Probabilidad',
    attRate: 'Tasa de asistencia',
    simpMaj: 'Mayoría simple',
    fixNum: 'Número fijo',
    mems: 'miembros',
    fracWord: 'fracción',
    thrWord: 'umbral',
    ofWord: 'de',
    rWith: 'Con una junta de',
    rBoard: 'miembros que requiere',
    rForQ: 'miembros para el quórum, si cada miembro asiste a una tasa del',
    rChance: 'hay una probabilidad del',
    rEnd: 'de que se alcance el quórum en cualquier reunión.',
    chartTitle: 'Probabilidad de Alcanzar el Quórum por Tasa de Asistencia',
    chartNote:
      'Línea de puntos de color = nivel de confianza. Línea morada = asistencia mínima requerida.',
    tblTitle: 'Asistencia Requerida por Nivel de Confianza',
    tblConf: 'Nivel de Confianza',
    tblAtt: 'Asistencia Promedio Mín.',
    tblBar: 'Barra',
    selTag: 'seleccionado',
    avgAttLbl: 'Tasa de Asistencia Individual Promedio (%)',
    avgAttNote: '¿Qué % de reuniones asiste un miembro típico?',
    probResult: 'Probabilidad de Alcanzar el Quórum',
    probChartTitle: 'Cómo Cambia la Probabilidad con la Asistencia',
    probChartNote: 'Línea verde = su tasa de asistencia actual.',
    probTblTitle: 'Verificación de Nivel de Confianza',
    mtgsLbl: 'Reuniones por año (opcional)',
    missedLbl: 'reuniones esperadas sin quórum/año',
    yourRate: '← su tasa',
    vacNote:
      'Nota: Quórum calculado sobre asientos totales. Solo {f} de {t} están ocupados.',
    vacImp:
      '⚠️ Quórum imposible: se requieren {q} miembros pero solo hay {f} asientos ocupados.',
    asmNote:
      '📊 Supuesto del modelo: asume que cada miembro asiste de forma independiente con igual probabilidad. Trate esto como una base estadística.',
    qImp: 'Quórum imposible',
    lang: 'Idioma',
  },
  ar: {
    name: 'العربية',
    rtl: true,
    calc1Title:
      'ما متوسط الحضور الذي يحتاجه أعضائي للوصول إلى النصاب بشكل موثوق؟',
    calc1Sub: 'حدد حجم مجلسك وقاعدة النصاب ومستوى الثقة.',
    calc2Title: 'ما احتمالية وصول مجموعتي إلى النصاب القانوني؟',
    calc2Sub: 'أدخل حجم مجلسك وقاعدة النصاب ومتوسط حضور مجموعتك الفعلي.',
    explTitle: 'النصاب، النصاب، النصاب!',
    explSub: 'شرح تفاعلي — افهم الرياضيات وراء الآلات الحاسبة',
    cfg: 'الإعدادات',
    boardSize: 'إجمالي مقاعد المجلس',
    vacant: 'المقاعد الشاغرة',
    filled: 'المقاعد المشغولة',
    basisLbl: 'النصاب مبني على',
    basisTotal: 'إجمالي المقاعد المعتمدة',
    basisFilled: 'المقاعد المشغولة فقط',
    qDef: 'تعريف النصاب',
    optMaj: 'الأغلبية البسيطة (⌊n/2⌋ + 1)',
    optFix: 'عدد ثابت',
    optFrac: 'كسر مخصص',
    optPct: 'حد النسبة المئوية',
    memReq: 'الأعضاء المطلوبون',
    fracLbl: 'الكسر (البسط / المقام)',
    pctLbl: 'الحد (%)',
    confLbl: 'مستوى الثقة',
    qReq: 'اشتراط النصاب',
    minAttLbl: 'الحد الأدنى لمتوسط الحضور المطلوب',
    confWord: 'ثقة',
    prob: 'الاحتمالية',
    attRate: 'معدل الحضور',
    simpMaj: 'الأغلبية البسيطة',
    fixNum: 'عدد ثابت',
    mems: 'أعضاء',
    fracWord: 'كسر',
    thrWord: 'حد',
    ofWord: 'من',
    rWith: 'مع مجلس مؤلف من',
    rBoard: 'عضوًا يتطلب',
    rForQ: 'أعضاء للنصاب، إذا حضر كل عضو بمعدل',
    rChance: 'فهناك احتمال',
    rEnd: 'للوصول إلى النصاب في أي اجتماع.',
    chartTitle: 'احتمالية الوصول إلى النصاب حسب معدل الحضور',
    chartNote:
      'الخط المنقط الملون = مستوى الثقة. الخط البنفسجي = الحد الأدنى للحضور.',
    tblTitle: 'الحضور المطلوب حسب مستوى الثقة',
    tblConf: 'مستوى الثقة',
    tblAtt: 'الحد الأدنى لمتوسط الحضور',
    tblBar: 'شريط',
    selTag: 'محدد',
    avgAttLbl: 'متوسط معدل الحضور الفردي (%)',
    avgAttNote: 'ما نسبة الاجتماعات التي يحضرها العضو النموذجي؟',
    probResult: 'احتمالية الوصول إلى النصاب',
    probChartTitle: 'كيف تتغير الاحتمالية مع معدل الحضور',
    probChartNote: 'الخط الأخضر = معدلك الحالي.',
    probTblTitle: 'فحص مستوى الثقة',
    mtgsLbl: 'الاجتماعات في السنة (اختياري)',
    missedLbl: 'اجتماعات متوقعة بدون نصاب/سنة',
    yourRate: '← معدلك',
    vacNote:
      'ملاحظة: النصاب محسوب على إجمالي المقاعد. {f} من {t} مقاعد مشغولة فقط.',
    vacImp: '⚠️ النصاب مستحيل: مطلوب {q} أعضاء لكن {f} مقاعد فقط مشغولة.',
    asmNote:
      '📊 افتراض النموذج: يفترض أن كل عضو يحضر باستقلالية وبنفس الاحتمالية.',
    qImp: 'النصاب مستحيل',
    lang: 'اللغة',
  },
  zh: {
    name: '中文',
    rtl: false,
    calc1Title: '我的成员需要多少平均出勤率才能可靠地达到法定人数？',
    calc1Sub:
      '设置董事会规模、法定人数规则和置信水平，获取所需的最低平均出勤率。',
    calc2Title: '我的小组达到法定人数的概率是多少？',
    calc2Sub:
      '输入董事会规模、法定人数规则和实际平均出勤率，了解达到法定人数的可能性。',
    explTitle: '法定人数，法定人数，法定人数！',
    explSub: '互动解释器——了解计算器背后的数学原理',
    cfg: '配置',
    boardSize: '董事会总席位',
    vacant: '空缺席位',
    filled: '已填席位',
    basisLbl: '法定人数基于',
    basisTotal: '总授权席位',
    basisFilled: '仅已填席位',
    qDef: '法定人数定义',
    optMaj: '简单多数 (⌊n/2⌋ + 1)',
    optFix: '固定人数',
    optFrac: '自定义分数',
    optPct: '百分比阈值',
    memReq: '所需成员数',
    fracLbl: '分数（分子 / 分母）',
    pctLbl: '阈值 (%)',
    confLbl: '置信水平',
    qReq: '法定人数要求',
    minAttLbl: '所需最低平均出勤率',
    confWord: '置信度',
    prob: '概率',
    attRate: '出勤率',
    simpMaj: '简单多数',
    fixNum: '固定人数',
    mems: '名成员',
    fracWord: '分数',
    thrWord: '阈值',
    ofWord: '中的',
    rWith: '在拥有',
    rBoard: '名成员的董事会中，需要',
    rForQ: '名成员达到法定人数，若每位成员出席率为',
    rChance: '则达到法定人数的概率为',
    rEnd: '。',
    chartTitle: '按出勤率划分的达到法定人数概率',
    chartNote: '彩色虚线 = 置信水平。紫色虚线 = 最低出勤率。',
    tblTitle: '按置信水平划分的所需出勤率',
    tblConf: '置信水平',
    tblAtt: '最低平均出勤率',
    tblBar: '条形',
    selTag: '已选',
    avgAttLbl: '平均个人出勤率 (%)',
    avgAttNote: '一个典型成员参加多少比例的会议？',
    probResult: '达到法定人数的概率',
    probChartTitle: '概率如何随出勤率变化',
    probChartNote: '绿色虚线 = 您当前的出勤率。',
    probTblTitle: '置信基准检查',
    mtgsLbl: '每年会议次数（可选）',
    missedLbl: '每年预计无法达到法定人数的会议',
    yourRate: '← 您的率',
    vacNote: '注意：法定人数按总席位计算。{t}个席位中只有{f}个已填。',
    vacImp: '⚠️ 法定人数不可能达到：需要{q}名成员但只有{f}个席位已填。',
    asmNote:
      '📊 模型假设：假设每位成员以相同概率独立出席。这是统计基准，不是保证。',
    qImp: '法定人数不可能达到',
    lang: '语言',
  },
  vi: {
    name: 'Tiếng Việt',
    rtl: false,
    calc1Title:
      'Tỷ lệ tham dự trung bình bao nhiêu để thành viên đạt túc số đáng tin cậy?',
    calc1Sub:
      'Đặt quy mô hội đồng, quy tắc túc số và mức tin cậy để nhận tỷ lệ tối thiểu.',
    calc2Title: 'Xác suất nhóm của tôi đạt túc số là bao nhiêu?',
    calc2Sub: 'Nhập quy mô hội đồng, quy tắc túc số và tỷ lệ tham dự thực tế.',
    explTitle: 'Túc số, túc số, túc số!',
    explSub: 'Giải thích tương tác — hiểu toán học đằng sau các máy tính',
    cfg: 'Cấu hình',
    boardSize: 'Tổng Số Ghế',
    vacant: 'Ghế Trống',
    filled: 'Ghế Có Người',
    basisLbl: 'Túc Số Dựa Trên',
    basisTotal: 'Tổng số ghế được phép',
    basisFilled: 'Chỉ ghế có người',
    qDef: 'Định nghĩa Túc số',
    optMaj: 'Đa số đơn giản (⌊n/2⌋ + 1)',
    optFix: 'Số cố định',
    optFrac: 'Phân số tùy chỉnh',
    optPct: 'Ngưỡng phần trăm',
    memReq: 'Số thành viên cần thiết',
    fracLbl: 'Phân số (tử số / mẫu số)',
    pctLbl: 'Ngưỡng (%)',
    confLbl: 'Mức độ tin cậy',
    qReq: 'Yêu cầu túc số',
    minAttLbl: 'Mức tham dự tối thiểu cần thiết',
    confWord: 'tin cậy',
    prob: 'Xác suất',
    attRate: 'Tỷ lệ tham dự',
    simpMaj: 'Đa số đơn giản',
    fixNum: 'Số cố định',
    mems: 'thành viên',
    fracWord: 'phân số',
    thrWord: 'ngưỡng',
    ofWord: 'trong',
    rWith: 'Với hội đồng',
    rBoard: 'thành viên yêu cầu',
    rForQ: 'thành viên để đạt túc số, nếu mỗi thành viên tham dự ở tỷ lệ',
    rChance: 'có',
    rEnd: 'khả năng đạt túc số.',
    chartTitle: 'Xác suất Đạt Túc số theo Tỷ lệ Tham dự',
    chartNote: 'Đường màu = mức tin cậy. Đường tím = tỷ lệ tối thiểu.',
    tblTitle: 'Tỷ lệ Tham dự Yêu cầu theo Mức Tin cậy',
    tblConf: 'Mức Tin cậy',
    tblAtt: 'Tham dự T.B. Tối thiểu',
    tblBar: 'Thanh',
    selTag: 'đã chọn',
    avgAttLbl: 'Tỷ lệ Tham dự Cá nhân Trung bình (%)',
    avgAttNote: 'Một thành viên điển hình tham dự bao nhiêu % cuộc họp?',
    probResult: 'Xác suất Đạt Túc số',
    probChartTitle: 'Xác suất Thay đổi theo Tỷ lệ Tham dự',
    probChartNote: 'Đường xanh = tỷ lệ hiện tại của bạn.',
    probTblTitle: 'Kiểm tra Mốc Tin cậy',
    mtgsLbl: 'Số cuộc họp mỗi năm (tùy chọn)',
    missedLbl: 'cuộc họp dự kiến không đạt túc số/năm',
    yourRate: '← tỷ lệ của bạn',
    vacNote: 'Lưu ý: Túc số tính trên tổng ghế. {f} trong {t} ghế có người.',
    vacImp: '⚠️ Túc số không thể đạt: cần {q} thành viên nhưng chỉ có {f} ghế.',
    asmNote:
      '📊 Giả định mô hình: Mỗi thành viên tham dự độc lập với xác suất như nhau.',
    qImp: 'Túc số không thể đạt',
    lang: 'Ngôn ngữ',
  },
};
TR.ku = {
  name: 'Kurdî',
  rtl: false,
  calc1Title:
    'Beşdariya navînî çiqas lazim e ku endamên min bi pêbawerî bigihîjin quorumê?',
  calc1Sub:
    'Mezinahiya desteya xwe, rêgeza quorumê û asta pêbaweriyê saz bike — rêjeya kêmtirîn beşdariya navînî bistîne.',
  calc2Title: 'Îhtimala ku koma min quorumê bi dest bixe çiqas e?',
  calc2Sub:
    'Mezinahiya desteya xwe, rêgeza quorumê û rêjeya beşdariya rastîn a navînî binivîse.',
  explTitle: 'Quorum, quorum, quorum!',
  explSub: 'Ravekera înteraktîf — matematîka li pişt hesabkeran fêm bike',
  cfg: 'Mîhengkirin',
  boardSize: 'Kursiyên Desteya Tevahî',
  vacant: 'Kursiyên Vala',
  filled: 'Kursiyên Dagirtî',
  basisLbl: 'Quorum li ser Bingeha',
  basisTotal: 'Kursiyên destûrkirî yên tevahî',
  basisFilled: 'Tenê kursiyên dagirtî',
  qDef: 'Pênasekirina Quorumê',
  optMaj: 'Piraniya Sade (⌊n/2⌋ + 1)',
  optFix: 'Hejmara Sabît',
  optFrac: 'Perçeya Xwerû',
  optPct: 'Sînorê Rêjeyê',
  memReq: 'Endamên pêwist',
  fracLbl: 'Perçe (sernav / binav)',
  pctLbl: 'Sînor (%)',
  confLbl: 'Asta Pêbaweriyê',
  qReq: 'Hewcedariya quorumê',
  minAttLbl: 'Kêmtirîn beşdariya navînî ya pêwist',
  confWord: 'pêbaweri',
  prob: 'Îhtimal',
  attRate: 'Rêjeya beşdariyê',
  simpMaj: 'Piraniya sade',
  fixNum: 'Hejmara sabît',
  mems: 'endam',
  fracWord: 'perçe',
  thrWord: 'sînor',
  ofWord: 'ji',
  rWith: 'Bi desteyeke',
  rBoard: 'endaman ku hewce dike',
  rForQ: 'endaman ji bo quorumê, ger her endam bi rêjeya',
  rChance: 'îhtimala',
  rEnd: 'heye ku quorum di her civînekê de were gihîştin.',
  chartTitle: 'Îhtimala Gihîştina Quorumê li gorî Rêjeya Beşdariyê',
  chartNote:
    'Xeta rengîn a xaldar = asta pêbaweriyê. Xeta morî = kêmtirîn beşdariya pêwist.',
  tblTitle: 'Beşdariya Pêwist li gorî Asta Pêbaweriyê',
  tblConf: 'Asta Pêbaweriyê',
  tblAtt: 'Kêm. Navg. Beşdarî',
  tblBar: 'Bar',
  selTag: 'hilbijartî',
  avgAttLbl: 'Rêjeya Beşdariya Takekesî ya Navînî (%)',
  avgAttNote: 'Endamek tîpîk çend % ji civînan beşdar dibe?',
  probResult: 'Îhtimala Gihîştina Quorumê',
  probChartTitle: 'Îhtimal Çawa li gorî Rêjeya Beşdariyê Diguhêre',
  probChartNote: 'Xeta kesk a xaldar = rêjeya beşdariya te ya niha.',
  probTblTitle: 'Kontrolkirina Asta Pêbaweriyê',
  mtgsLbl: 'Civîn di salê de (vebijarkî)',
  missedLbl: 'civînên bêyî quorum ên hêvîkirî / sal',
  yourRate: '← rêjeya te',
  vacNote:
    'Not: Quorum li dijî kursiyên tevahî tê hesibandin. Tenê {f} ji {t} kursî dagirtî ne — herî zêde beşdariya mimkûn {f} e.',
  vacImp:
    '⚠️ Quorum ne gengaz e: {q} endam lazim e lê tenê {f} kursî dagirtî ne.',
  asmNote:
    '📊 Texmîna model: Ev hesabker texmîn dike ku her endam bi rêjeyek wekhev û serbixwe beşdar dibe. Di pratîkê de, beşdarbûn dikare bibe yek (hewaya xirab, bûyerên hevrik) û endaman pêbaweriya cûda heye. Vê wekî bingehek statîstîk bihesibîne, ne garantî.',
  qImp: 'Quorum ne gengaz e',
  lang: 'Ziman',
};

TR.so = {
  name: 'Soomaali',
  rtl: false,
  calc1Title:
    'Maxay tahay jooga celceliska ee xubnaha loo baahanyahay si loo gaaro quorum si kalsoon?',
  calc1Sub:
    'Dejiso cabbirka guddiga, xeerka quorum, iyo heerka kalsoonida — hel heerka ugu yar ee jooga.',
  calc2Title: 'Maxay tahay suurtogalnimada kooxdayda ay gaari doonto quorum?',
  calc2Sub:
    'Geli cabbirka guddiga, xeerka quorum, iyo heerka jooga celceliska si aad u hesho suurtogalnimada.',
  explTitle: 'Quorum, quorum, quorum!',
  explSub:
    'Sharaxaad isdhexgal ah — faham xisaabta ka dambaysa xisaabiyeyaasha',
  cfg: 'Habaynta',
  boardSize: 'Kuraasta Guddi Oo Dhan',
  vacant: 'Kuraasta Bannaan',
  filled: 'Kuraasta Buuxda',
  basisLbl: 'Quorum Ku Salaysan',
  basisTotal: 'Kuraasta ogolaadey ee guud',
  basisFilled: 'Kuraasta buuxda kaliya',
  qDef: 'Qeexida Quorum',
  optMaj: 'Aqlabiyadda Fudud (⌊n/2⌋ + 1)',
  optFix: "Tiro Go'an",
  optFrac: 'Jajab Gaar ah',
  optPct: 'Xadka Boqolkiiba',
  memReq: 'Xubnaha loo baahan yahay',
  fracLbl: 'Jajab (tiraha kor / tiraha hoose)',
  pctLbl: 'Xad (%)',
  confLbl: 'Heerka Kalsoonida',
  qReq: 'Shuruudda quorum',
  minAttLbl: 'Ugu yaraan joogo celceliska',
  confWord: 'kalsoonida',
  prob: 'Suurtogalnimada',
  attRate: 'Heerka jooga',
  simpMaj: 'Aqlabiyadda fudud',
  fixNum: "Tiro go'an",
  mems: 'xubnaha',
  fracWord: 'jajab',
  thrWord: 'xad',
  ofWord: 'ka',
  rWith: 'Guddi',
  rBoard: 'xubnood oo u baahan',
  rForQ: 'xubnood quorum, haddii xubin kasta u soo xaadirto',
  rChance: 'waxaa jira',
  rEnd: 'fursad ah in quorum lagu gaaro kulankasta.',
  chartTitle: 'Suurtogalnimada Gaarista Quorum Heerka Jooga',
  chartNote:
    'Xarriiqda midabaysan = heerka kalsoonida. Xarriiqda moriyaha = heerka ugu yar ee jooga.',
  tblTitle: 'Jooga Loo Baahan yahay Heerka Kalsoonida',
  tblConf: 'Heerka Kalsoonida',
  tblAtt: 'Ugu Yar. Celc. Joogo',
  tblBar: 'Bar',
  selTag: 'la doortay',
  avgAttLbl: 'Heerka Jooga Xubnaha Celceliska (%)',
  avgAttNote: 'Xubin caadi ah maxay boqolkiiba kulanno ka soo qayb qaadataa?',
  probResult: 'Suurtogalnimada Gaarista Quorum',
  probChartTitle: 'Suurtogalnimadu Sida u Beddelanto Heerka Jooga',
  probChartNote: 'Xarriiqda cagaaran = heerkaaga jooga ee hadda.',
  probTblTitle: 'Hubinta Heerka Kalsoonida',
  mtgsLbl: 'Kulamo sanadkiiba (ikhtiyaari)',
  missedLbl: 'kulamo la filayo oo aan quorum lahayn/sanad',
  yourRate: '← heerkaaga',
  vacNote:
    'Xusuusin: Quorum waxaa lagu xisaabiyaa kuraasta guud. {f} oo ka mid ah {t} ayaa buuxda — joogo ugu badan ee suurtogalka ah waa {f}.',
  vacImp:
    '⚠️ Quorum ma suurtogalana: {q} xubnood ayaa loo baahan yahay laakiin {f} kursi kaliya ayaa buuxda.',
  asmNote:
    '📊 Qiyaasta nambarka: Xisaabiyahan wuxuu qiyaasaa in xubin kasta si madaxbannaan oo isku xad ah ay u soo xaadirto. Dhab ahaantii, xaadirnimadu waxay noqon kartaa mid xidhiidh leh (cimilo xun, dhacdooyinka tartanka) xubnuhuna waxay leeyihiin kalsoonida kala duwan. Tan u tixgeli saldhig xisaab ah, ma garantiga.',
  qImp: 'Quorum ma suurtogalana',
  lang: 'Luuqadda',
};

TR.my = {
  name: 'မြန်မာ',
  rtl: false,
  calc1Title:
    'ကျွန်ုပ်တို့အဖွဲ့ဝင်များ ယုံကြည်စိတ်ချစွာ ကိုရမ်ရောက်ရှိရန် ပျမ်းမျှတက်ရောက်မှုနှုန်း မည်မျှလိုသနည်း?',
  calc1Sub:
    'ဘုတ်အဖွဲ့အရွယ်အစား၊ ကိုရမ်စည်းမျဉ်းနှင့် ယုံကြည်မှုအဆင့် သတ်မှတ်ပါ — လိုအပ်သောနှုန်းအနည်းဆုံး ရယူပါ။',
  calc2Title: 'ကျွန်ုပ်တို့အဖွဲ့ ကိုရမ်ပြည့်မည့် ဖြစ်နိုင်ချေ မည်မျှရှိသနည်း?',
  calc2Sub:
    'ဘုတ်အဖွဲ့အရွယ်အစား၊ ကိုရမ်စည်းမျဉ်းနှင့် လက်ရှိပျမ်းမျှတက်ရောက်မှုနှုန်း ထည့်သွင်းပါ။',
  explTitle: 'Quorum, quorum, quorum!',
  explSub:
    'အပြန်အလှန် ရှင်းလင်းချက် — ကိန်းဂဏန်းများ နောက်ကွယ်ရှိ သင်္ချာ နားလည်ပါ',
  cfg: 'ဖွဲ့စည်းမှု',
  boardSize: 'ဘုတ်အဖွဲ့ ခုံနေရာ စုစုပေါင်း',
  vacant: 'ဗလာ ခုံနေရာများ',
  filled: 'ဖြည့်ထားသော ခုံနေရာများ',
  basisLbl: 'ကိုရမ် အခြေခံ',
  basisTotal: 'ခွင့်ပြုထားသော ခုံနေရာ စုစုပေါင်း',
  basisFilled: 'ဖြည့်ထားသော ခုံနေရာများသာ',
  qDef: 'ကိုရမ် အဓိပ္ပာယ်ဖွင့်ဆိုချက်',
  optMaj: 'ရိုးရှင်းသော အများစု (⌊n/2⌋ + 1)',
  optFix: 'သတ်မှတ်ဂဏန်း',
  optFrac: 'စိတ်ကြိုက်ပုံစံ',
  optPct: 'ရာခိုင်နှုန်း အနှစ်',
  memReq: 'လိုအပ်သော အဖွဲ့ဝင်များ',
  fracLbl: 'ပုံစံ (ဦးရေ / စုစုပေါင်းရေ)',
  pctLbl: 'အနှစ် (%)',
  confLbl: 'ယုံကြည်မှုအဆင့်',
  qReq: 'ကိုရမ် လိုအပ်ချက်',
  minAttLbl: 'လိုအပ်သော ပျမ်းမျှတက်ရောက်မှုနှုန်း အနည်းဆုံး',
  confWord: 'ယုံကြည်မှု',
  prob: 'ဖြစ်နိုင်ချေ',
  attRate: 'တက်ရောက်မှုနှုန်း',
  simpMaj: 'ရိုးရှင်းသောအများစု',
  fixNum: 'သတ်မှတ်ဂဏန်း',
  mems: 'အဖွဲ့ဝင်',
  fracWord: 'ပုံစံ',
  thrWord: 'အနှစ်',
  ofWord: 'မှ',
  rWith: 'အဖွဲ့ဝင်',
  rBoard: 'ပါဝင်သည့် ဘုတ်အဖွဲ့တွင် လိုအပ်သည်',
  rForQ: 'ကိုရမ်အတွက် အဖွဲ့ဝင်၊ အဖွဲ့ဝင်တစ်ဦးချင်းစီ တက်ရောက်မှုနှုန်း',
  rChance: 'ရှိသည်',
  rEnd: 'မည်သည့်အစည်းအဝေးတွင်မဆို ကိုရမ်ရောက်ရှိမည့် ဖြစ်နိုင်ချေ။',
  chartTitle: 'တက်ရောက်မှုနှုန်းအလိုက် ကိုရမ်ရောက်ရှိနိုင်ချေ',
  chartNote:
    'အရောင် ဖောက်ထားသောမျဉ်း = ယုံကြည်မှုအဆင့်။ ခရမ်းရောင်မျဉ်း = လိုအပ်သောနှုန်းအနည်းဆုံး။',
  tblTitle: 'ယုံကြည်မှုအဆင့်အလိုက် လိုအပ်သောတက်ရောက်မှုနှုန်း',
  tblConf: 'ယုံကြည်မှုအဆင့်',
  tblAtt: 'ပျမ်းမျှ တက်ရောက်မှုနှုန်း အနည်းဆုံး',
  tblBar: 'ဘား',
  selTag: 'ရွေးချယ်ထားသည်',
  avgAttLbl: 'ပျမ်းမျှ တစ်ဦးချင်း တက်ရောက်မှုနှုန်း (%)',
  avgAttNote: 'ပုံမှန်အဖွဲ့ဝင်တစ်ဦး အစည်းအဝေးများ၏ % မည်မျှ တက်ရောက်သနည်း?',
  probResult: 'ကိုရမ်ရောက်ရှိနိုင်ချေ',
  probChartTitle: 'တက်ရောက်မှုနှုန်းနှင့် ဖြစ်နိုင်ချေ ပြောင်းလဲပုံ',
  probChartNote: 'အစိမ်းရောင် ဖောက်ထားသောမျဉ်း = သင်၏လက်ရှိ တက်ရောက်မှုနှုန်း။',
  probTblTitle: 'ယုံကြည်မှုအဆင့် စစ်ဆေးချက်',
  mtgsLbl: 'တစ်နှစ်လျှင် အစည်းအဝေးအရေအတွက် (ရွေးချယ်မှု)',
  missedLbl: 'ကိုရမ်မရှိသော မျှော်မှန်းထားသောအစည်းအဝေးများ/နှစ်',
  yourRate: '← သင်၏နှုန်း',
  vacNote:
    'မှတ်ချက်: ကိုရမ်ကို ခုံနေရာ စုစုပေါင်းအပေါ် တွက်ချက်သည်။ {t} ခုနေရာထဲမှ {f} ခုသာ ဖြည့်ထားသည် — အများဆုံးဖြစ်နိုင်သောတက်ရောက်မှု {f}။',
  vacImp:
    '⚠️ ကိုရမ် မဖြစ်နိုင်: {q} အဖွဲ့ဝင် လိုအပ်သော်လည်း {f} ခုနေရာသာ ဖြည့်ထားသည်။',
  asmNote:
    '📊 မော်ဒယ်ယူဆချက်: ဤကိန်းဂဏန်းတွက်စက်သည် အဖွဲ့ဝင်တစ်ဦးချင်းစီ တူညီသောဖြစ်နိုင်ချေဖြင့် သီးခြားတက်ရောက်သည်ဟု ယူဆသည်။ လက်တွေ့တွင် တက်ရောက်မှုသည် ဆက်နွှယ်နိုင်ပြီး အဖွဲ့ဝင်များသည် ကွဲပြားသောယုံကြည်မှု ရှိကြသည်။ ဒါကို စာရင်းဇယားအခြေခံအဖြစ် မှတ်ပါ — အာမခံမဟုတ်ပါ။',
  qImp: 'ကိုရမ် မဖြစ်နိုင်',
  lang: 'ဘာသာစကား',
};

TR.ne = {
  name: 'नेपाली',
  rtl: false,
  calc1Title:
    'मेरा सदस्यहरूलाई भरपर्दो रूपमा कोरम पुग्न औसत उपस्थिति कति चाहिन्छ?',
  calc1Sub:
    'बोर्डको आकार, कोरम नियम र विश्वास स्तर सेट गर्नुहोस् — न्यूनतम औसत उपस्थिति दर पाउनुहोस्।',
  calc2Title: 'मेरो समूहले कोरम पुग्ने सम्भावना कति छ?',
  calc2Sub:
    'बोर्डको आकार, कोरम नियम र वास्तविक औसत उपस्थिति प्रविष्ट गर्नुहोस्।',
  explTitle: 'कोरम, कोरम, कोरम!',
  explSub:
    'अन्तरक्रियात्मक व्याख्याकर्ता — क्यालकुलेटरहरू पछाडिको गणित बुझ्नुहोस्',
  cfg: 'कन्फिगरेसन',
  boardSize: 'कुल बोर्ड सिटहरू',
  vacant: 'रिक्त सिटहरू',
  filled: 'भरिएका सिटहरू',
  basisLbl: 'कोरम आधारित',
  basisTotal: 'कुल अधिकृत सिटहरू',
  basisFilled: 'भरिएका सिटहरू मात्र',
  qDef: 'कोरम परिभाषा',
  optMaj: 'साधारण बहुमत (⌊n/2⌋ + 1)',
  optFix: 'निश्चित संख्या',
  optFrac: 'कस्टम अंश',
  optPct: 'प्रतिशत थ्रेसहोल्ड',
  memReq: 'आवश्यक सदस्यहरू',
  fracLbl: 'अंश (अंश / हर)',
  pctLbl: 'थ्रेसहोल्ड (%)',
  confLbl: 'विश्वास स्तर',
  qReq: 'कोरम आवश्यकता',
  minAttLbl: 'न्यूनतम औसत उपस्थिति आवश्यक',
  confWord: 'विश्वास',
  prob: 'सम्भावना',
  attRate: 'उपस्थिति दर',
  simpMaj: 'साधारण बहुमत',
  fixNum: 'निश्चित संख्या',
  mems: 'सदस्यहरू',
  fracWord: 'अंश',
  thrWord: 'थ्रेसहोल्ड',
  ofWord: 'को',
  rWith: 'एउटा',
  rBoard: 'सदस्यीय बोर्डले आवश्यक गर्ने',
  rForQ: 'सदस्य कोरमका लागि, यदि प्रत्येक सदस्य स्वतन्त्र रूपमा उपस्थित हुन्छ',
  rChance: 'दरमा, त्यहाँ',
  rEnd: 'कुनै पनि बैठकमा कोरम पुग्ने सम्भावना छ।',
  chartTitle: 'उपस्थिति दर अनुसार कोरम पुग्ने सम्भावना',
  chartNote:
    'रंगीन डट रेखा = विश्वास स्तर। बैजनी रेखा = न्यूनतम आवश्यक उपस्थिति।',
  tblTitle: 'विश्वास स्तर अनुसार आवश्यक उपस्थिति',
  tblConf: 'विश्वास स्तर',
  tblAtt: 'न्यूनतम औसत उपस्थिति',
  tblBar: 'बार',
  selTag: 'चयन गरिएको',
  avgAttLbl: 'औसत व्यक्तिगत उपस्थिति दर (%)',
  avgAttNote: 'एक सामान्य सदस्यले कति % बैठकमा भाग लिन्छ?',
  probResult: 'कोरम पुग्ने सम्भावना',
  probChartTitle: 'उपस्थिति दर अनुसार सम्भावना कसरी परिवर्तन हुन्छ',
  probChartNote: 'हरियो डट रेखा = तपाईंको हालको उपस्थिति दर।',
  probTblTitle: 'विश्वास बेन्चमार्क जाँच',
  mtgsLbl: 'वर्षको बैठकहरू (वैकल्पिक)',
  missedLbl: 'कोरम बिना अपेक्षित बैठकहरू/वर्ष',
  yourRate: '← तपाईंको दर',
  vacNote:
    'नोट: कोरम कुल सिटहरू विरुद्ध गणना गरिएको छ। {t} सिटमध्ये {f} मात्र भरिएको छ — अधिकतम सम्भव उपस्थिति {f} हो।',
  vacImp: '⚠️ कोरम असम्भव: {q} सदस्य आवश्यक तर {f} सिट मात्र भरिएको छ।',
  asmNote:
    '📊 मोडेल अनुमान: यो क्यालकुलेटरले मान्छ कि प्रत्येक सदस्य समान सम्भावनाका साथ स्वतन्त्र रूपमा उपस्थित हुन्छ। व्यवहारमा, उपस्थिति सहसम्बन्धित हुन सक्छ र सदस्यहरूको विश्वसनीयता फरक हुन्छ। यसलाई सांख्यिकीय आधारको रूपमा लिनुहोस् — ग्यारेन्टी होइन।',
  qImp: 'कोरम असम्भव',
  lang: 'भाषा',
};

TR.am = {
  name: 'አማርኛ',
  rtl: false,
  calc1Title: 'አባሎቼ ዕድለኛ በሆነ መልኩ ኳረም ለማሟላት አማካይ ተሳትፎ ምን ያህል ያስፈልጋቸዋል?',
  calc1Sub:
    'የቦርዱን መጠን፣ የኳረም ደንብ እና የእምነት ደረጃ ያዘጋጁ — አስፈላጊውን ዝቅተኛ አማካይ ተሳትፎ ያግኙ።',
  calc2Title: 'ቡድኔ ኳረም የማሟላት ዕድሉ ምን ያህል ነው?',
  calc2Sub: 'የቦርዱን መጠን፣ የኳረም ደንብ እና ትክክለኛ አማካይ ተሳትፎ ያስገቡ።',
  explTitle: 'ኳረም, ኳረም, ኳረም!',
  explSub: 'መስተጋብር ማብራሪያ — ከስሌቶቹ ጀርባ ያለውን ሒሳብ ይረዱ',
  cfg: 'ውቅር',
  boardSize: 'ጠቅላላ የቦርድ ወንበሮች',
  vacant: 'ባዶ ወንበሮች',
  filled: 'የተሞሉ ወንበሮች',
  basisLbl: 'ኳረም የተመሠረተበት',
  basisTotal: 'ጠቅላላ ፈቀዱ ወንበሮች',
  basisFilled: 'የተሞሉ ወንበሮች ብቻ',
  qDef: 'የኳረም ፍቺ',
  optMaj: 'ቀላል ብዙሃን (⌊n/2⌋ + 1)',
  optFix: 'ቋሚ ቁጥር',
  optFrac: 'ብጁ ክፍልፋይ',
  optPct: 'የፐርሰንት ደረጃ',
  memReq: 'አስፈላጊ አባላት',
  fracLbl: 'ክፍልፋይ (ቆጠራ / ድምር)',
  pctLbl: 'ደረጃ (%)',
  confLbl: 'የእምነት ደረጃ',
  qReq: 'የኳረም መስፈርት',
  minAttLbl: 'አስፈላጊ ዝቅተኛ አማካይ ተሳትፎ',
  confWord: 'እምነት',
  prob: 'ዕድል',
  attRate: 'የተሳትፎ ደረጃ',
  simpMaj: 'ቀላል ብዙሃን',
  fixNum: 'ቋሚ ቁጥር',
  mems: 'አባላት',
  fracWord: 'ክፍልፋይ',
  thrWord: 'ደረጃ',
  ofWord: 'ከ',
  rWith: 'የ',
  rBoard: 'አባላት ቦርድ ይፈልጋል',
  rForQ: 'አባላትን ለኳረም፣ እያንዳንዱ አባል በ',
  rChance: 'ደረጃ ቢሳተፍ፣ ዕድሉ',
  rEnd: 'በማንኛውም ስብሰባ ኳረም የሚሟላ ነው።',
  chartTitle: 'በተሳትፎ ደረጃ ኳረም የማሟላት ዕድል',
  chartNote: 'ቀለማዊ ነጠብጣብ መስመር = የእምነት ደረጃ። ወይን ቀለም መስመር = ዝቅተኛ አስፈላጊ ተሳትፎ።',
  tblTitle: 'በእምነት ደረጃ አስፈላጊ ተሳትፎ',
  tblConf: 'የእምነት ደረጃ',
  tblAtt: 'ዝቅ. አማካይ ተሳትፎ',
  tblBar: 'አሞሌ',
  selTag: 'የተመረጠ',
  avgAttLbl: 'አማካይ ግለሰብ ተሳትፎ ደረጃ (%)',
  avgAttNote: 'አማካይ አባል ስንት % ስብሰባዎች ይሳተፋሉ?',
  probResult: 'ኳረም የማሟላት ዕድል',
  probChartTitle: 'ዕድሉ በተሳትፎ ደረጃ እንዴት ይለዋወጣል',
  probChartNote: 'አረንጓዴ ነጠብጣብ መስመር = የአሁኑ ተሳትፎ ደረጃ።',
  probTblTitle: 'የእምነት ደረጃ ምዘና',
  mtgsLbl: 'በዓመት ስብሰባዎች (አማራጭ)',
  missedLbl: 'ኳረም ያልሟሉ የሚጠበቁ ስብሰባዎች/ዓመት',
  yourRate: '← ደረጃዎ',
  vacNote:
    'ማሳሰቢያ: ኳረም ከጠቅላላ ወንበሮች ጋር ይሰላል። ከ{t} ወንበሮች {f} ብቻ ተሞልተዋል — ከፍተኛ ተሳትፎ {f} ነው።',
  vacImp: '⚠️ ኳረም የማይቻል: {q} አባላት ያስፈልጋሉ ነገር ግን {f} ወንበሮች ብቻ ተሞልተዋል።',
  asmNote:
    '📊 የሞዴል ግምት: ይህ ስሌት እያንዳንዱ አባል በእኩል ዕድል ነፃ ሆኖ እንደሚሳተፍ ይገምታል። በተግባር ተሳትፎ ሊዛመድ ይችላል፤ አባላትም የተለያየ አስተማማኝነት አላቸው። ይህን እንደ ስታቲስቲካዊ መሠረት ይወስዱ — ዋስትና አይደለም።',
  qImp: 'ኳረም የማይቻል',
  lang: 'ቋንቋ',
};

TR.kar = {
  name: 'ကညီကျိာ်',
  rtl: false,
  calc1Title: 'ယၢ်ဆဲးကၠိဃာ်တၢ်ကပီၤ မုၢ်ကတၢၢ်တဘျီ ဘၣ်ဆ့ မနုၤ လိၣ်ဘၣ်?',
  calc1Sub:
    'ဒုးနဲၣ် ပှၤနုာ်လီၤဘၣ်တၢ်၊ သဲစး quorum နှင်တ ယုၢ်တၢ်နာ်အဆၢ — ဒိးသန့ၤ တၢ်ပြောပ်ဆ့ကနၢ်.',
  calc2Title: 'ပှၤမၤဃုာ်ဒၢးယၢ်ကမၤတၢ် quorum ဘၣ်?',
  calc2Sub: 'ဒုးနဲၣ် ပှၤနုာ်လီၤ၊ quorum သဲစး နှင်တ တၢ်ဟးဆှဲ တၢ်ပြောပ်ဆ့.',
  explTitle: 'Quorum, quorum, quorum!',
  explSub: 'တၢ်ဟ့ၣ်ကူၣ်ကျဲ — နၢ်ပၢၢ် ကိၣ်မ မၤသကိးသကိး ဂ့ၢ်.',
  cfg: 'တၢ်မၤကွၢ်',
  boardSize: 'ပှၤနုာ်လီၤ ဒိၣ်မ့ၢ်ဆ့',
  vacant: 'တၢ်လၢ ကမၤ',
  filled: 'ဟ့ၣ်ဒိၣ်ဒၢးဒ့ဒ်ဘၣ်',
  basisLbl: 'Quorum ကမၤဘၣ်',
  basisTotal: 'ပှၤနုာ်လီၤ ဒိၣ်မ့ၢ်ဆ့ ဂ့ၢ်ကီ',
  basisFilled: 'တၢ်ဟ့ၣ်လၢ ဒ့ဒ်ဘၣ် မ့ၢ်ကျဲ',
  qDef: 'Quorum ကတိၤပၢၤ',
  optMaj: 'ဂ့ၢ်ဂၢၢ် ဒၢး (⌊n/2⌋ + 1)',
  optFix: 'ကကီ ဒ့ဒ်',
  optFrac: 'ဂ့ၢ်ကီ ဒ့ဒ်',
  optPct: 'ရ့ ဘၣ် %',
  memReq: 'ပှၤဃုာ် လိၣ်ဘၣ်',
  fracLbl: 'ဒ့ဒ် (ဒိၣ် / ဂ့ၢ်)',
  pctLbl: 'ဘၣ် (%)',
  confLbl: 'တၢ်နာ် ဆ့',
  qReq: 'Quorum လိၣ်ဘၣ်',
  minAttLbl: 'တၢ်ဟ့ၣ် ဆ့ ကနၢ် ဒၢး',
  confWord: 'နာ်',
  prob: 'ဂ့ၢ်ကီ',
  attRate: 'တၢ်ပြောပ်ဆ့',
  simpMaj: 'ဂ့ၢ်ဂၢၢ်ဒၢး',
  fixNum: 'ကကီ ဒ့ဒ်',
  mems: 'ပှၤဃုာ်',
  fracWord: 'ဒ့ဒ်',
  thrWord: 'ဘၣ်',
  ofWord: 'လၢ',
  rWith: 'ဒ်ပှၤ',
  rBoard: 'ပှၤဃုာ် ဒၢး လိၣ်ဘၣ်',
  rForQ: 'ပှၤဃုာ် quorum, ပှၤနုာ်ဘၣ် တၢ်ပြောပ်ဆ့',
  rChance: 'ဂ့ၢ်ကီ',
  rEnd: 'quorum မၤတ့ၢ်ဘၣ် တၢ်ကၢးကွၢ်.',
  chartTitle: 'Quorum မၤနၢ် တၢ်ပြောပ်ဆ့',
  chartNote: 'ဂ့ၢ်ကီ ဒ့ = တၢ်နာ်ဆ့. ဒ့ = တၢ်ပြောပ်ဆ့ ဒၢး.',
  tblTitle: 'တၢ်နာ် ဆ့ ပြောပ်ဆ့',
  tblConf: 'တၢ်နာ် ဆ့',
  tblAtt: 'တၢ်ပြောပ် ဒၢး',
  tblBar: 'ဒ့',
  selTag: 'ဃုာ်ဒ်ပှၤ',
  avgAttLbl: 'တၢ်ပြောပ်ဆ့ (%)',
  avgAttNote: 'ပှၤနုာ်ဘၣ် % တၢ်ကၢးကွၢ်?',
  probResult: 'Quorum ဂ့ၢ်ကီ',
  probChartTitle: 'ဂ့ၢ်ကီ မၤပြောပ်ဆ့',
  probChartNote: 'ဂ့ၢ်ကိ = တၢ်ပြောပ်ဆ့.',
  probTblTitle: 'တၢ်နာ် ဆ့ မၤကွၢ်',
  mtgsLbl: 'တၢ်ကၢးကွၢ် ဂ့ၢ် (ဃုာ်)',
  missedLbl: 'quorum ကမၤ/ဂ့ၢ်',
  yourRate: '← ဘၣ်',
  vacNote: 'တၢ်ဂ့ၢ်: Quorum ဒ့ {t} ပှၤနုာ် {f} ဒ့ — {f} ဒ်ပှၤ.',
  vacImp: '⚠️ Quorum ကမၤ: {q} ပှၤဃုာ် လိၣ်ဘၣ် {f} ဒ့.',
  asmNote:
    '📊 ပှၤနုာ်ဘၣ် ဒ်ပှၤ တၢ်ပြောပ်ဆ့ နုာ်ဘၣ်. တၢ်ပြောပ်ဆ့ ကမၤ ကၢးကွၢ် ဒ်ပှၤ. ဂ့ၢ်ကီ မ့ၢ်ကျဲ ကိၣ်မ, မ့ၢ်ကျဲ မ့ၢ်.',
  qImp: 'Quorum ကမၤ ကဲ',
  lang: 'ကျိာ်',
};
const LANG_OPTIONS = Object.entries(TR).map(([code, t]) => ({
  code,
  name: t.name,
}));
const EXPL_STEPS = [
  'What is quorum?',
  'Why?',
  'Board Size',
  'The Average Trap',
  'Flip of a Coin',
  'The Math',
  'Simulator',
  'Summary',
];

function Collapsible({
  title,
  subtitle,
  icon,
  open,
  onToggle,
  accent = '#6366f1',
  children,
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          background: '#1e293b',
          border: `1px solid ${open ? accent : '#334155'}`,
          borderRadius: open ? '12px 12px 0 0' : '12px',
          padding: '1.1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          color: '#e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.3rem' }}>{icon}</span>
          <div style={{ textAlign: 'left' }}>
            <div
              style={{ fontWeight: 700, fontSize: '1rem', color: '#f8fafc' }}
            >
              {title}
            </div>
            <div
              style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}
            >
              {subtitle}
            </div>
          </div>
        </div>
        <span
          style={{
            fontSize: '1rem',
            color: open ? accent : '#64748b',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          style={{
            background: '#1e293b',
            borderRadius: '0 0 12px 12px',
            border: `1px solid ${accent}`,
            borderTop: '1px solid #0f172a',
            padding: '1.5rem',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function BoardControls({
  tr,
  boardSize,
  setBoardSize,
  vacantSeats,
  setVacantSeats,
  quorumBasis,
  setQuorumBasis,
  quorumType,
  setQuorumType,
  fixedNum,
  setFixedNum,
  fracNum,
  setFracNum,
  fracDen,
  setFracDen,
  pctThreshold,
  setPctThreshold,
  filledSeats,
  quorumLabel,
  accent,
  uid,
}) {
  const inp = (st = {}) => ({
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: '6px 10px',
    color: '#f1f5f9',
    ...st,
  });
  return (
    <>
      <div style={{ marginBottom: '1rem' }}>
        <span
          style={{
            fontSize: '0.88rem',
            color: '#cbd5e1',
            display: 'block',
            marginBottom: 6,
          }}
        >
          {tr.boardSize}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="range"
            min={2}
            max={100}
            value={Math.min(boardSize, 100)}
            onChange={(e) => {
              const v = +e.target.value;
              setBoardSize(v);
              setVacantSeats((vs) => Math.min(vs, v - 1));
            }}
            style={{ flex: 1, accentColor: accent }}
          />
          <input
            type="number"
            min={2}
            max={500}
            value={boardSize}
            onChange={(e) => {
              const v = Math.max(2, +e.target.value);
              setBoardSize(v);
              setVacantSeats((vs) => Math.min(vs, v - 1));
            }}
            style={inp({ width: 60, textAlign: 'center' })}
          />
        </div>
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <span
          style={{
            fontSize: '0.88rem',
            color: '#cbd5e1',
            display: 'block',
            marginBottom: 6,
          }}
        >
          {tr.vacant}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="range"
            min={0}
            max={boardSize - 1}
            value={vacantSeats}
            onChange={(e) => setVacantSeats(+e.target.value)}
            style={{ flex: 1, accentColor: '#f59e0b' }}
          />
          <input
            type="number"
            min={0}
            max={boardSize - 1}
            value={vacantSeats}
            onChange={(e) =>
              setVacantSeats(
                Math.min(boardSize - 1, Math.max(0, +e.target.value))
              )
            }
            style={inp({ width: 60, textAlign: 'center' })}
          />
        </div>
        {vacantSeats > 0 && (
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <div
              style={{
                flex: 1,
                background: '#34d39322',
                border: '1px solid #34d399',
                borderRadius: 6,
                padding: '4px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: clr.muted }}>
                {tr.filled}
              </div>
              <div
                style={{ fontSize: '1.1rem', fontWeight: 700, color: clr.good }}
              >
                {filledSeats}
              </div>
            </div>
            <div
              style={{
                flex: 1,
                background: '#f59e0b22',
                border: '1px solid #f59e0b',
                borderRadius: 6,
                padding: '4px 8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: clr.muted }}>
                {tr.vacant}
              </div>
              <div
                style={{ fontSize: '1.1rem', fontWeight: 700, color: clr.warn }}
              >
                {vacantSeats}
              </div>
            </div>
          </div>
        )}
      </div>
      {vacantSeats > 0 && (
        <div
          style={{
            marginBottom: '1rem',
            background: '#0f172a',
            borderRadius: 8,
            padding: '0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.82rem',
              color: '#cbd5e1',
              display: 'block',
              marginBottom: 8,
            }}
          >
            {tr.basisLbl}
          </span>
          {[
            ['total', tr.basisTotal],
            ['filled', tr.basisFilled],
          ].map(([val, label]) => (
            <label
              key={val}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name={`qb-${uid}`}
                value={val}
                checked={quorumBasis === val}
                onChange={() => setQuorumBasis(val)}
                style={{ accentColor: '#f59e0b' }}
              />
              <span
                style={{
                  fontSize: '0.8rem',
                  color: quorumBasis === val ? '#fcd34d' : '#94a3b8',
                }}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      )}
      <div style={{ marginBottom: '1rem' }}>
        <span
          style={{
            fontSize: '0.88rem',
            color: '#cbd5e1',
            display: 'block',
            marginBottom: 8,
          }}
        >
          {tr.qDef}
        </span>
        {[
          ['majority', tr.optMaj],
          ['fixed', tr.optFix],
          ['fraction', tr.optFrac],
          ['percentage', tr.optPct],
        ].map(([val, label]) => (
          <label
            key={val}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 7,
              cursor: 'pointer',
            }}
          >
            <input
              type="radio"
              name={`qt-${uid}`}
              value={val}
              checked={quorumType === val}
              onChange={() => setQuorumType(val)}
              style={{ accentColor: accent }}
            />
            <span
              style={{
                fontSize: '0.82rem',
                color: quorumType === val ? '#a5b4fc' : '#94a3b8',
              }}
            >
              {label}
            </span>
          </label>
        ))}
      </div>
      {quorumType === 'fixed' && (
        <div style={{ marginBottom: '1rem' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: '#94a3b8',
              display: 'block',
              marginBottom: 6,
            }}
          >
            {tr.memReq}
          </span>
          <input
            type="number"
            min={1}
            max={boardSize}
            value={fixedNum}
            onChange={(e) =>
              setFixedNum(Math.min(boardSize, Math.max(1, +e.target.value)))
            }
            style={inp({ width: '100%' })}
          />
        </div>
      )}
      {quorumType === 'fraction' && (
        <div style={{ marginBottom: '1rem' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: '#94a3b8',
              display: 'block',
              marginBottom: 6,
            }}
          >
            {tr.fracLbl}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="number"
              min={1}
              max={fracDen}
              value={fracNum}
              onChange={(e) =>
                setFracNum(Math.min(fracDen, Math.max(1, +e.target.value)))
              }
              style={inp({ width: 60, textAlign: 'center' })}
            />
            <span style={{ color: '#64748b' }}>/</span>
            <input
              type="number"
              min={2}
              max={20}
              value={fracDen}
              onChange={(e) => setFracDen(Math.max(2, +e.target.value))}
              style={inp({ width: 60, textAlign: 'center' })}
            />
          </div>
        </div>
      )}
      {quorumType === 'percentage' && (
        <div style={{ marginBottom: '1rem' }}>
          <span
            style={{
              fontSize: '0.82rem',
              color: '#94a3b8',
              display: 'block',
              marginBottom: 6,
            }}
          >
            {tr.pctLbl}
          </span>
          <input
            type="number"
            min={1}
            max={100}
            value={pctThreshold}
            onChange={(e) =>
              setPctThreshold(Math.min(100, Math.max(1, +e.target.value)))
            }
            style={inp({ width: '100%' })}
          />
        </div>
      )}
      <div
        style={{
          background: '#0f172a',
          borderRadius: 8,
          padding: '0.75rem 1rem',
          borderLeft: `3px solid ${accent}`,
        }}
      >
        <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 2 }}>
          {tr.qReq}
        </p>
        <p style={{ fontSize: '0.88rem', color: '#a5b4fc', fontWeight: 600 }}>
          {quorumLabel()}
        </p>
      </div>
    </>
  );
}

export default function App() {
  const [lang, setLang] = useState('en');
  const tr = TR[lang] || TR.en;
  const inp = (st = {}) => ({
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: '6px 10px',
    color: '#f1f5f9',
    ...st,
  });
  const crd = (ex = {}) => ({
    background: '#1e293b',
    borderRadius: 10,
    padding: '1.25rem',
    ...ex,
  });

  const [explOpen, setExplOpen] = useState(false);
  const [c1Open, setC1Open] = useState(false);
  const [c2Open, setC2Open] = useState(false);

  const [c1Board, setC1Board] = useState(10);
  const [c1Vac, setC1Vac] = useState(0);
  const [c1Basis, setC1Basis] = useState('total');
  const [c1Type, setC1Type] = useState('majority');
  const [c1Fix, setC1Fix] = useState(6);
  const [c1FN, setC1FN] = useState(2);
  const [c1FD, setC1FD] = useState(3);
  const [c1Pct, setC1Pct] = useState(60);
  const [c1Conf, setC1Conf] = useState(95);
  const c1Fill = c1Board - c1Vac;
  const c1QN = c1Basis === 'filled' ? c1Fill : c1Board;
  const c1Q = useMemo(
    () => getQuorumCount(c1QN, c1Type, c1Fix, c1FN, c1FD, c1Pct),
    [c1QN, c1Type, c1Fix, c1FN, c1FD, c1Pct]
  );
  const c1Imp = c1Q > c1Fill;
  const c1MinAtt = useMemo(
    () => (c1Imp ? 1 : findMinAttendance(c1Fill, c1Q, c1Conf / 100)),
    [c1Fill, c1Q, c1Conf, c1Imp]
  );
  const c1MinPct = c1Imp ? null : Math.round(c1MinAtt * 1000) / 10;
  const c1Chart = useMemo(
    () =>
      Array.from({ length: 101 }, (_, i) => ({
        attendance: i,
        probability: c1Imp
          ? 0
          : Math.round(binomialProb(c1Fill, c1Q, i / 100) * 1000) / 10,
      })),
    [c1Fill, c1Q, c1Imp]
  );
  const c1Tbl = useMemo(
    () =>
      CONF_LEVELS.map((cl) => ({
        cl,
        att: c1Imp
          ? null
          : Math.round(findMinAttendance(c1Fill, c1Q, cl / 100) * 1000) / 10,
      })),
    [c1Fill, c1Q, c1Imp]
  );
  const c1QL = () => {
    const b = c1Basis === 'filled' ? c1Fill : c1Board;
    if (c1Type === 'majority')
      return `${tr.simpMaj} (${c1Q} ${tr.ofWord} ${b})`;
    if (c1Type === 'fixed') return `${tr.fixNum} (${c1Q} ${tr.mems})`;
    if (c1Type === 'fraction')
      return `${c1FN}/${c1FD} ${tr.fracWord} (${c1Q} ${tr.ofWord} ${b})`;
    return `${c1Pct}% ${tr.thrWord} (${c1Q} ${tr.ofWord} ${b})`;
  };
  const c1VacMsg = () => {
    if (!c1Vac) return null;
    if (c1Imp) return tr.vacImp.replace('{q}', c1Q).replace('{f}', c1Fill);
    if (c1Basis === 'total')
      return tr.vacNote.replace('{f}', c1Fill).replace('{t}', c1Board);
    return null;
  };

  const [c2Board, setC2Board] = useState(10);
  const [c2Vac, setC2Vac] = useState(0);
  const [c2Basis, setC2Basis] = useState('total');
  const [c2Type, setC2Type] = useState('majority');
  const [c2Fix, setC2Fix] = useState(6);
  const [c2FN, setC2FN] = useState(2);
  const [c2FD, setC2FD] = useState(3);
  const [c2Pct, setC2Pct] = useState(60);
  const [c2Att, setC2Att] = useState(70);
  const [c2Mtgs, setC2Mtgs] = useState(12);
  const [c2ShowMtgs, setC2ShowMtgs] = useState(false);
  const c2Fill = c2Board - c2Vac;
  const c2QN = c2Basis === 'filled' ? c2Fill : c2Board;
  const c2Q = useMemo(
    () => getQuorumCount(c2QN, c2Type, c2Fix, c2FN, c2FD, c2Pct),
    [c2QN, c2Type, c2Fix, c2FN, c2FD, c2Pct]
  );
  const c2Imp = c2Q > c2Fill;
  const c2P = c2Att / 100;
  const c2Prob = useMemo(
    () => (c2Imp ? 0 : Math.round(binomialProb(c2Fill, c2Q, c2P) * 1000) / 10),
    [c2Fill, c2Q, c2P, c2Imp]
  );
  const c2Chart = useMemo(
    () =>
      Array.from({ length: 101 }, (_, i) => ({
        attendance: i,
        probability: c2Imp
          ? 0
          : Math.round(binomialProb(c2Fill, c2Q, i / 100) * 1000) / 10,
      })),
    [c2Fill, c2Q, c2Imp]
  );
  const c2ConfData = useMemo(
    () =>
      CONF_LEVELS.map((cl) => {
        const minR = c2Imp
          ? null
          : Math.round(findMinAttendance(c2Fill, c2Q, cl / 100) * 1000) / 10;
        return { cl, minR, meets: !c2Imp && c2Att >= (minR || 0) };
      }),
    [c2Fill, c2Q, c2Att, c2Imp]
  );
  const c2ProbColor =
    c2Prob >= 95
      ? clr.good
      : c2Prob >= 80
      ? clr.warn
      : c2Prob >= 60
      ? '#fb923c'
      : clr.bad;
  const expectedMissed = c2ShowMtgs
    ? Math.round((1 - c2Prob / 100) * c2Mtgs * 10) / 10
    : null;
  const c2QL = () => {
    const b = c2Basis === 'filled' ? c2Fill : c2Board;
    if (c2Type === 'majority')
      return `${tr.simpMaj} (${c2Q} ${tr.ofWord} ${b})`;
    if (c2Type === 'fixed') return `${tr.fixNum} (${c2Q} ${tr.mems})`;
    if (c2Type === 'fraction')
      return `${c2FN}/${c2FD} ${tr.fracWord} (${c2Q} ${tr.ofWord} ${b})`;
    return `${c2Pct}% ${tr.thrWord} (${c2Q} ${tr.ofWord} ${b})`;
  };
  const c2VacMsg = () => {
    if (!c2Vac) return null;
    if (c2Imp) return tr.vacImp.replace('{q}', c2Q).replace('{f}', c2Fill);
    if (c2Basis === 'total')
      return tr.vacNote.replace('{f}', c2Fill).replace('{t}', c2Board);
    return null;
  };

  const [step, setStep] = useState(0);
  const [sBd, setSBd] = useState(10);
  const [sQ, setSQ] = useState(6);
  const [sAtt, setSAtt] = useState(60);
  const [sN, setSN] = useState(50);
  const [sRes, setSRes] = useState([]);
  const [sRun, setSRun] = useState(false);
  const [sDone, setSDone] = useState(false);
  const [coinFlip, setCoinFlip] = useState(0);
  const animRef = useRef(null);
  const sP = sAtt / 100;
  const sTheo = Math.round(binomialProb(sBd, sQ, sP) * 1000) / 10;
  const sAvg = Math.round(sBd * sP * 10) / 10;
  const sRate =
    sRes.length > 0
      ? Math.round((sRes.filter((r) => r >= sQ).length / sRes.length) * 1000) /
        10
      : null;
  const sHist = useMemo(() => {
    const counts = Array.from({ length: sBd + 1 }, (_, i) => ({
      attendees: i,
      count: 0,
    }));
    sRes.forEach((r) => {
      if (r <= sBd) counts[r].count++;
    });
    return counts.filter(
      (_, i) => i >= Math.max(0, Math.round(sBd * sP) - 5) && i <= sBd
    );
  }, [sRes, sBd, sP]);
  function runSim() {
    clearTimeout(animRef.current);
    setSRes([]);
    setSDone(false);
    setSRun(true);
    let col = [],
      i = 0;
    const batch = Math.max(1, Math.floor(sN / 40));
    function tick() {
      const end = Math.min(i + batch, sN);
      while (i < end) {
        let c = 0;
        for (let j = 0; j < sBd; j++) if (Math.random() < sP) c++;
        col.push(c);
        i++;
      }
      setSRes([...col]);
      if (i < sN) animRef.current = setTimeout(tick, 30);
      else {
        setSRun(false);
        setSDone(true);
      }
    }
    tick();
  }
  useEffect(() => () => clearTimeout(animRef.current), []);

  const SimCtrl = () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 14,
        marginBottom: '1.25rem',
        background: '#0f172a',
        borderRadius: 10,
        padding: '0.85rem 1.1rem',
      }}
    >
      {[
        [
          'Board size',
          sBd,
          (v) => {
            setSBd(v);
            if (sQ > v) setSQ(v);
          },
          2,
          30,
        ],
        ['Quorum needed', sQ, (v) => setSQ(Math.min(v, sBd)), 1, sBd],
        ['Attendance (%)', sAtt, setSAtt, 1, 99],
      ].map(([label, val, setter, mn, mx]) => (
        <label
          key={label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            flex: 1,
            minWidth: 130,
          }}
        >
          <span style={{ fontSize: '0.75rem', color: clr.muted }}>{label}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="range"
              min={mn}
              max={mx}
              value={val}
              onChange={(e) => setter(+e.target.value)}
              style={{ flex: 1, accentColor: '#6366f1' }}
            />
            <span
              style={{
                fontSize: '0.88rem',
                color: clr.text,
                fontWeight: 700,
                minWidth: 28,
                textAlign: 'right',
              }}
            >
              {val}
            </span>
          </div>
        </label>
      ))}
    </div>
  );

  const explPages = [
    // Step 1 — What is quorum?
    <div key="i0">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
        What is quorum?
      </h3>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        According to <em>Robert's Rules of Order, Newly Revised</em> (12th Ed., §3.3):
      </p>
      <div style={{ background: '#1e293b', borderLeft: '3px solid #f5a800', borderRadius: 8, padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
        <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
          "The minimum number of members who must be present at the meetings of a deliberative assembly for business to be validly transacted is the <strong>quorum</strong> of the assembly."
        </p>
      </div>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        In plain terms: quorum is the threshold your board must hit before it can take any official action — votes, motions, binding decisions. No quorum, no business.
      </p>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1.25rem' }}>
        For most nonprofit and civic boards, quorum is defined in the bylaws as a simple majority. A 10-member board typically needs 6 present to proceed.
      </p>
      <div style={{ ...crd(), marginTop: '1rem' }}>
        <div style={{ fontSize: '0.75rem', color: clr.muted, marginBottom: 10 }}>
          Board seats — quorum threshold highlighted
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>          {Array.from({ length: sBd }, (_, i) => {
            const isQuorum = i === sQ - 1;
            const isFilled = i < sQ;
            return (
              <div key={i} style={{
                width: 36, height: 36, borderRadius: '50%',
                background: isFilled ? (isQuorum ? '#f5a800' : clr.good + '33') : '#1e293b',
                border: `2px solid ${isQuorum ? '#f5a800' : isFilled ? clr.good : '#334155'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700,
                color: isFilled ? (isQuorum ? '#0f172a' : clr.good) : '#475569',
              }}>
                {i + 1}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: '0.72rem', color: clr.dim, marginTop: 8 }}>
          🟡 = quorum threshold seat · 🟢 = needed for quorum · ⚫ = not needed for quorum
        </div>
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#475569' }}>
        Source: <a href="https://robertsrules.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>robertsrules.com</a> — Robert's Rules of Order, Newly Revised, 12th Ed.
      </div>
    </div>,

    // Step 2 — Why it matters
    <div key="i1">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
        Why does quorum matter?
      </h3>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        Robert's Rules explains why quorum exists (12th Ed., §3.3):
      </p>
      <div style={{ background: '#1e293b', borderLeft: '3px solid #f5a800', borderRadius: 8, padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
        <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
          "The requirement of a quorum is a protection against totally unrepresentative action in the name of the body by an unduly small number of persons."
        </p>
      </div>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1.25rem' }}>
        Quorum isn't bureaucratic red tape — it's a democratic safeguard. It ensures decisions represent the board as a whole, not just whoever happened to show up.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
        {[
          { icon: '🗳️', t: 'No votes', d: "Motions can't pass, resolutions can't be adopted." },
          { icon: '⏰', t: 'Delays', d: 'Decisions get pushed to a future meeting.' },
          { icon: '⚠️', t: 'Liability', d: 'Missed quorums can signal governance failure to funders and regulators.' },
        ].map(({ icon, t, d }) => (
          <div key={t} style={{ ...crd(), borderTop: '2px solid #6366f1' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{icon}</div>
            <div style={{ fontWeight: 700, color: clr.text, marginBottom: 4, fontSize: '0.85rem' }}>{t}</div>
            <div style={{ color: clr.dim, fontSize: '0.78rem', lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
      <div style={{ background: '#450a0a', border: '1px solid #f87171', borderRadius: 8, padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.6 }}>
        Missing quorum once is an inconvenience. Missing it repeatedly is a governance crisis.
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#475569' }}>
        Source: <a href="https://robertsrules.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>robertsrules.com</a> — Robert's Rules of Order, Newly Revised, 12th Ed.
      </div>
    </div>,

    // Step 3 — Board size & quorum
    <div key="i2">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
        How does board size affect quorum?
      </h3>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        Here's guidance most boards overlook. Robert's Rules (12th Ed., §3.7) says a quorum provision:
      </p>
      <div style={{ background: '#1e293b', borderLeft: '3px solid #f5a800', borderRadius: 8, padding: '0.9rem 1.1rem', marginBottom: '1rem' }}>
        <p style={{ color: '#e2e8f0', fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
          "should approximate the largest number that can be depended on to attend any meeting except in very bad weather or other extremely unfavorable conditions."
        </p>
      </div>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1.25rem' }}>
        Robert's Rules isn't saying set quorum at your aspirational attendance. It's saying set it at your <em>realistic floor</em> — the number you can count on even on a bad day. Most boards do the opposite.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
        {[
          {
            myth: '❌ "A smaller board makes quorum easier."',
            truth: 'Not necessarily. With fewer members, each absence hits harder. A single no-show on a 6-member board needing 4 is already a near-miss.',
          },
          {
            myth: '❌ "A bigger board makes quorum harder."',
            truth: 'Actually the opposite. More members means more statistical buffer — as long as your attendance rate stays consistent, a larger board gives you more room for the inevitable absences.',
          },
        ].map(({ myth, truth }) => (
          <div key={myth} style={{ ...crd(), borderLeft: '3px solid #f87171' }}>
            <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: 6, fontSize: '0.88rem' }}>{myth}</div>
            <div style={{ color: clr.dim, fontSize: '0.82rem', lineHeight: 1.6 }}>{truth}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#475569' }}>
        Source: <a href="https://robertsrules.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>robertsrules.com</a> — Robert's Rules of Order, Newly Revised, 12th Ed.
      </div>
    </div>,

    // Step 4 — The average trap
    <div key="i3">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
        Why is just enough not enough?
      </h3>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        Suppose your board has 10 members and quorum is 6. Your members attend an average of 60% of meetings. You might think: 60% of 10 is exactly 6 — we're right at quorum, we should be fine most of the time!
      </p>
      <div style={{ background: '#450a0a', border: '1px solid #f87171', borderRadius: 8, padding: '0.85rem 1rem', fontSize: '0.88rem', color: '#fca5a5', lineHeight: 1.6, marginBottom: '1rem', fontWeight: 700 }}>
        But that's the trap.
      </div>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        Your average tells you what happens <em>across all meetings over time</em>. It says nothing about what happens at <em>this specific meeting</em>. Some months everyone shows up. Some months three people are traveling, one is sick, and another has a family emergency — all at the same time.
      </p>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1.25rem' }}>
        Quorum doesn't grade on a curve. It doesn't care that your annual average looks good. It only asks one question: <strong style={{ color: clr.text }}>Are enough people here right now?</strong>
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: '1rem' }}>
        <div style={{ ...crd(), borderLeft: `3px solid ${clr.neutral}` }}>
          <div style={{ fontSize: '0.75rem', color: clr.muted, marginBottom: 3 }}>Expected average attendees</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: clr.text }}>{sAvg}</div>
          <div style={{ fontSize: '0.78rem', color: clr.dim }}>out of {sBd} at {sAtt}%</div>
        </div>
        <div style={{ ...crd(), borderLeft: `3px solid ${sTheo >= 95 ? clr.good : sTheo >= 70 ? clr.warn : clr.bad}` }}>
          <div style={{ fontSize: '0.75rem', color: clr.muted, marginBottom: 3 }}>Actual probability of quorum</div>
          <div style={{ fontSize: '2.2rem', fontWeight: 800, color: sTheo >= 95 ? clr.good : sTheo >= 70 ? clr.warn : clr.bad }}>{sTheo}%</div>
          <div style={{ fontSize: '0.78rem', color: clr.dim }}>chance per meeting</div>
        </div>
      </div>
      {sAvg >= sQ && sTheo < 80 && (
        <div style={{ background: '#450a0a', border: '1px solid #f87171', borderRadius: 8, padding: '0.65rem 0.9rem', marginTop: 10, fontSize: '0.83rem' }}>
          <strong style={{ color: clr.bad }}>⚠️ The trap in action!</strong>
          <span style={{ color: '#fca5a5' }}> Average ({sAvg}) is above quorum ({sQ}), but quorum is only reached {sTheo}% of the time.</span>
        </div>
      )}
      <div style={{ background: '#0f172a', border: '1px solid #6366f1', borderRadius: 8, padding: '0.85rem 1rem', marginTop: 12 }}>
        <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: 6, fontSize: '0.88rem' }}>One Solution: Formal Attendance Requirements</div>
        <p style={{ color: clr.dim, fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 8 }}>
        Some boards address the average trap not just through quorum rules, but by holding individual members accountable. Metro Nashville's Municipal Code, for example, defines "excessive absences" as missing two-thirds of meetings over a one-year period — and ties that standard to meetings where quorum is required.
        </p>
        <p style={{ color: clr.dim, fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 8 }}>
          Setting an explicit attendance expectation in your bylaws shifts the conversation from "did we make quorum today?" to "are our members meeting their obligations year-round?"
        </p>
        <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: 6, fontSize: '0.88rem' }}>But is one-third enough?</div>
        <p style={{ color: clr.dim, fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 8 }}>
          Missing two-thirds of meetings means a member only needs to show up 34% of the time to avoid removal. If your whole board operated at that floor, quorum would almost never be reached. Most governance experts recommend a minimum attendance requirement of 75% — and the calculators below can show you exactly what quorum probability looks like at whatever rate your board sets.
        </p>
        <div style={{ fontSize: '0.75rem', color: '#475569' }}>
          Source: <a href="https://library.municode.com/tn/metro_government_of_nashville_and_davidson_county/codes/code_of_ordinances?nodeId=CD_TIT2AD_DIVIIBOCO_CH2.64OROPBOCO_2.64.070TECOATRE" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>Metro Nashville Municipal Code §2.64.070</a> — Term commencement; Attendance requirements.
        </div>
        </div>
    </div>,

    // Step 5 — Think of a coin flip
    <div key="i4">
     <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
        Flip of a Coin
      </h3>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        Here's a way to make the randomness concrete.
      </p>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        Imagine each board member is a weighted coin. Before every meeting, flip all the coins. Heads means they show up. Tails means something came up and they can't make it.
      </p>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        A reliable member is a coin that lands heads 85% of the time. A busier member might land heads 60% of the time. Nobody is being irresponsible — that's just life.
      </p>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1.25rem' }}>
        Now flip all the coins at once. Most of the time you get a good spread. But sometimes several tails cluster together in the same meeting — not because anyone failed, just because that's how randomness works. <strong style={{ color: clr.text }}>Bad streaks are inevitable. The question is whether your board is built to survive them.</strong>
      </p>
      <div style={{ ...crd(), marginTop: '1rem' }}>
        <div style={{ fontSize: '0.75rem', color: clr.muted, marginBottom: 10 }}>
          One random meeting at {sAtt}% attendance — each circle is a board member:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {Array.from({ length: sBd }, (_, i) => {
            const a = Math.random() < 0.6;
            return (
              <div key={i} style={{
                width: 38, height: 38, borderRadius: '50%',
                background: a ? clr.good + '33' : clr.bad + '22',
                border: `2px solid ${a ? clr.good : clr.bad}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1rem',
              }}>
                {a ? '✓' : '✗'}
              </div>
            );
          })}
                  </div>
                  <button
          onClick={() => setCoinFlip((n) => n + 1)}
          style={{ marginTop: 10, marginBottom: 8, padding: '7px 18px', borderRadius: 8, border: 'none', background: '#6366f1', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
        >
          🪙 Flip the Coins
        </button>
        <div style={{ fontSize: '0.72rem', color: clr.dim, marginTop: 8 }}>
          <span style={{ color: clr.good }}>✓ attends</span> · <span style={{ color: clr.bad }}>✗ misses</span>
        </div>
      </div>
    </div>,

    // Step 6 — The Math
    <div key="i5">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
        The Math Behind It
      </h3>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        What you just saw with the coins has a name: the <strong style={{ color: clr.text }}>binomial distribution</strong>. It's the formula that calculates exactly how likely you are to get a bad streak — and by extension, how likely your board is to make quorum on any given meeting.
      </p>
      <div style={{ ...crd(), marginBottom: 10 }}>
        <div style={{ background: '#0f172a', borderRadius: 8, padding: '0.85rem 1rem', fontFamily: 'monospace', fontSize: '0.95rem', color: '#a5b4fc', marginBottom: 10, lineHeight: 2 }}>
          P(X ≥ k) = Σ <span style={{ color: clr.warn }}>C(n,i)</span> × <span style={{ color: clr.good }}>p<sup>i</sup></span> × <span style={{ color: clr.bad }}>(1−p)<sup>n−i</sup></span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
          {[
            { sym: 'n', col: clr.text, lbl: 'Board members', val: sBd },
            { sym: 'k', col: clr.warn, lbl: 'Quorum needed', val: sQ },
            { sym: 'p', col: clr.good, lbl: 'Attendance rate', val: `${sAtt}% = ${sP.toFixed(2)}` },
            { sym: 'C(n,i)', col: clr.warn, lbl: 'Combinations', val: 'n! / (i! × (n−i)!)' },
          ].map(({ sym, col, lbl, val }) => (
            <div key={sym} style={{ background: '#0f172a', borderRadius: 6, padding: '0.5rem 0.75rem', display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 700, color: col, fontSize: '0.95rem', minWidth: 52 }}>{sym}</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: clr.muted }}>{lbl}</div>
                <div style={{ fontSize: '0.82rem', color: clr.text, fontWeight: 600 }}>{val}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...crd({ borderLeft: `3px solid ${sTheo >= 95 ? clr.good : clr.warn}` }) }}>
        <span style={{ color: clr.dim, lineHeight: 1.7, fontSize: '0.88rem' }}>
          With <strong style={{ color: clr.text }}>{sBd}</strong> members at <strong style={{ color: clr.text }}>{sAtt}%</strong>, probability of reaching quorum (<strong style={{ color: clr.text }}>{sQ}</strong>) is <strong style={{ color: sTheo >= 95 ? clr.good : sTheo >= 70 ? clr.warn : clr.bad, fontSize: '1.1rem' }}>{sTheo}%</strong>.
        </span>
      </div>
    </div>,

    // Step 7 — Live Simulation
    <div key="i6">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
        Live Simulation
      </h3>
      <p style={{ color: clr.dim, lineHeight: 1.7, marginBottom: '1rem' }}>
        Run hundreds of simulated meetings and watch what actually happens. The simulated rate will converge to exactly what the formula predicts — every time.
      </p>
      <SimCtrl />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[25, 50, 100, 500].map((n) => (
            <button key={n} onClick={() => setSN(n)} style={{ padding: '4px 11px', borderRadius: 16, border: `1px solid ${sN === n ? '#6366f1' : '#334155'}`, background: sN === n ? '#6366f133' : 'transparent', color: sN === n ? '#a5b4fc' : '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
              {n}
            </button>
          ))}
        </div>
        <button onClick={runSim} disabled={sRun} style={{ padding: '7px 18px', borderRadius: 8, background: sRun ? '#334155' : '#6366f1', border: 'none', color: '#fff', cursor: sRun ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
          {sRun ? `Running... (${sRes.length}/${sN})` : sDone ? '▶ Run Again' : '▶ Run Simulation'}
        </button>
      </div>
      {sRes.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { lbl: 'Simulated', val: sRes.length, col: clr.neutral },
              { lbl: 'Quorum ✅', val: sRes.filter((r) => r >= sQ).length, col: clr.good },
              { lbl: 'Failed ❌', val: sRes.filter((r) => r < sQ).length, col: clr.bad },
            ].map(({ lbl, val, col }) => (
              <div key={lbl} style={{ ...crd({ padding: '0.75rem' }), borderTop: `2px solid ${col}` }}>
                <div style={{ fontSize: '0.72rem', color: clr.muted }}>{lbl}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: col }}>{val}</div>
              </div>
            ))}
          </div>
          {sDone && (
            <div style={{ ...crd({ padding: '0.85rem' }), borderLeft: `3px solid ${Math.abs((sRate || 0) - sTheo) < 6 ? clr.good : clr.warn}`, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: clr.muted }}>Simulated rate</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: clr.good }}>{sRate}%</div>
              </div>
              <div style={{ color: clr.muted }}>vs</div>
              <div>
                <div style={{ fontSize: '0.72rem', color: clr.muted }}>Formula predicts</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: clr.neutral }}>{sTheo}%</div>
              </div>
              <div style={{ fontSize: '0.78rem', color: clr.dim, maxWidth: 140, lineHeight: 1.5 }}>
                {Math.abs((sRate || 0) - sTheo) < 8 ? '✅ The math works!' : 'Run more meetings to converge.'}
              </div>
            </div>
          )}
          <div style={{ ...crd() }}>
            <div style={{ fontSize: '0.72rem', color: clr.muted, marginBottom: 6 }}>Attendees per meeting</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={sHist} margin={{ top: 2, right: 8, bottom: 2, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="attendees" tick={{ fill: clr.muted, fontSize: 10 }} />
                <YAxis tick={{ fill: clr.muted, fontSize: 10 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, color: clr.text }} formatter={(v, _, p) => [`${v} meetings`, p.payload.attendees >= sQ ? '✅ Quorum' : '❌ No quorum']} />
                <ReferenceLine x={sQ} stroke={clr.warn} strokeDasharray="4 4" label={{ value: `Q(${sQ})`, fill: clr.warn, fontSize: 9, position: 'top' }} />
                <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                  {sHist.map((e, i) => (
                    <Cell key={i} fill={e.attendees >= sQ ? clr.good + 'bb' : clr.bad + 'bb'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div style={{ ...crd(), textAlign: 'center', padding: '2rem', color: clr.muted, fontSize: '0.88rem' }}>
          Press "Run Simulation" to see results
        </div>
      )}
    </div>,

    // Step 8 — Summary
    <div key="i7">
      <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>
        Putting It All Together
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.25rem' }}>
        {[
          { n: '1', col: clr.neutral, t: 'Quorum is a democratic safeguard.', b: "It ensures decisions represent the full board — not just whoever showed up." },
          { n: '2', col: clr.warn, t: 'Attendance is random.', b: 'Even reliable members miss meetings unpredictably. Bad streaks happen.' },
          { n: '3', col: clr.bad, t: 'Average ≠ Guaranteed Quorum', b: "If average equals quorum, you'll fail roughly half the time." },
          { n: '4', col: clr.good, t: 'You need a buffer.', b: 'Average attendance must be meaningfully higher than quorum to be safe.' },
          { n: '5', col: clr.neutral, t: 'Board size cuts both ways.', b: 'Smaller boards feel each absence more. Larger boards have more statistical buffer.' },
          { n: '6', col: clr.neutral, t: 'The math is proven.', b: 'The binomial distribution is used in medicine, engineering, and finance for exactly this kind of problem.' },
        ].map(({ n, col, t, b }) => (
          <div key={n} style={{ ...crd({ padding: '0.9rem 1.1rem' }), display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: col + '33', border: `2px solid ${col}`, display: 'flex', alignItems: 'left', justifyContent: 'center', fontWeight: 800, color: col, flexShrink: 0, fontSize: '0.82rem' }}>
              {n}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: clr.text, marginBottom: 3, fontSize: '0.88rem' }}>{t}</div>
              <div style={{ color: clr.dim, fontSize: '0.8rem', lineHeight: 1.5 }}>{b}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: 'linear-gradient(135deg,#312e81,#1e1b4b)', borderRadius: 10, padding: '1rem 1.25rem', border: '1px solid #4338ca', marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, color: '#a5b4fc', marginBottom: 4, fontSize: '0.88rem' }}>Now you have the tools.</div>
        <div style={{ color: '#c7d2fe', fontSize: '0.82rem', lineHeight: 1.6 }}>
          Stop guessing. Use the calculators below to find your board's real numbers — and build a quorum strategy that actually holds up.
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: '#475569' }}>
        Parliamentary authority: <a href="https://robertsrules.com" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1' }}>robertsrules.com</a> — Robert's Rules of Order, Newly Revised, 12th Ed.
      </div>
    </div>,
  ];

  return (
    <>
      <style>{`
      @font-face { font-family: 'Wrestlemania'; src: url('/WRESTLEMANIA.ttf'); }
  @import url('https://fonts.googleapis.com/css2?family=Titan+One&display=swap');
`}</style>
      <div
        style={{
          minHeight: '100vh',
          background: '#0f172a',
          color: '#e2e8f0',
          fontFamily: "'Inter', sans-serif",
          padding: '2rem',
          direction: tr.rtl ? 'rtl' : 'ltr',
        }}
      >
        <div style={{ maxWidth: 1020, margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.75rem',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: "'Titan One', sans-serif",
                  fontSize: '3.5rem',
                  margin: 0,
                  flexWrap: 'wrap',
                  lineHeight: 1,
                }}
              >
                <span
                  style={{
                    background:
                      'linear-gradient(160deg, #fff0a0 0%, #f5a800 20%, #c97a00 40%, #fff0a0 55%, #f5a800 70%, #c97a00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter:
                      'drop-shadow(0 0 1px #000) drop-shadow(2px 2px 0px #000) drop-shadow(4px 4px 0px #000) drop-shadow(6px 6px 0px #000)',
                    display: 'inline-block',
                    fontSize: 'clamp(3rem, 12vw, 6rem)',
                  }}
                >
                  Q
                </span>
                <span
                  style={{
                    background:
                      'linear-gradient(160deg, #fff0a0 0%, #f5a800 20%, #c97a00 40%, #fff0a0 55%, #f5a800 70%, #c97a00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter:
                      'drop-shadow(0 0 1px #000) drop-shadow(2px 2px 0px #000) drop-shadow(4px 4px 0px #000) drop-shadow(6px 6px 0px #000)',
                    display: 'inline-block',
                    fontSize: 'clamp(1.8rem, 7vw, 3.5rem)',                  }}
                >
                  UORUM
                </span>
                <span
                  style={{
                    background:
                      'linear-gradient(160deg, #fff0a0 0%, #f5a800 20%, #c97a00 40%, #fff0a0 55%, #f5a800 70%, #c97a00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter:
                      'drop-shadow(0 0 1px #000) drop-shadow(2px 2px 0px #000) drop-shadow(4px 4px 0px #000) drop-shadow(6px 6px 0px #000)',
                    display: 'inline-block',
                    fontSize: 'clamp(3rem, 12vw, 6rem)',
                  }}
                >
                  M
                </span>
                <span
                  style={{
                    background:
                      'linear-gradient(160deg, #fff0a0 0%, #f5a800 20%, #c97a00 40%, #fff0a0 55%, #f5a800 70%, #c97a00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    filter:
                      'drop-shadow(0 0 1px #000) drop-shadow(2px 2px 0px #000) drop-shadow(4px 4px 0px #000) drop-shadow(6px 6px 0px #000)',
                    display: 'inline-block',
                    fontSize: 'clamp(1.8rem, 7vw, 3.5rem)',                  }}
                >
                  ANIA
                </span>
              </h1>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '1.1rem',
                  marginTop: 4,
                  letterSpacing: '0.05em',
                  background:
                    'linear-gradient(160deg, #fff0a0 0%, #f5a800 20%, #c97a00 40%, #fff0a0 55%, #f5a800 70%, #c97a00 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter:
                    'drop-shadow(0 0 1px #000) drop-shadow(1px 1px 0px #000) drop-shadow(2px 2px 0px #000)',
                }}
              >
                Three tools to understand, calculate, and explain quorum for
                your board.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                🌐 {tr.lang}:
              </span>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                style={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 6,
                  padding: '7px 10px',
                  color: '#f1f5f9',
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                }}
              >
                {LANG_OPTIONS.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Collapsible
            title={tr.explTitle}
            subtitle={tr.explSub}
            icon="🎓"
            open={explOpen}
            onToggle={() => setExplOpen((v) => !v)}
            accent="#8b5cf6"
          >
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginBottom: '1.5rem',
              }}
            >
              {EXPL_STEPS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: `1px solid ${i === step ? '#8b5cf6' : '#334155'}`,
                    background: i === step ? '#8b5cf6' : 'transparent',
                    color:
                      i === step ? '#fff' : i < step ? '#94a3b8' : '#64748b',
                    cursor: 'pointer',
                    fontSize: '0.72rem',
                    whiteSpace: 'nowrap',
                    textAlign: 'right',
                    fontWeight: i === step ? 700 : 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background:
                        i < step ? '#34d399' : i === step ? '#fff' : '#334155',
                      color:
                        i < step
                          ? '#0f172a'
                          : i === step
                          ? '#8b5cf6'
                          : '#64748b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {i < step ? '✓' : i + 1}
                  </span>
                  {label}
                </button>
              ))}
            </div>
            <div
              style={{
                background: '#0f172a',
                borderRadius: 10,
                padding: '1.25rem',
                minHeight: 300,
                textAlign: 'left',
              }}
            >
              {explPages[step]}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1rem',
              }}
            >
              <button
                onClick={() => { setStep((prev) => Math.max(0, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                disabled={step === 0}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: step === 0 ? '#334155' : '#94a3b8',
                  cursor: step === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                ← Previous
              </button>
              {step === EXPL_STEPS.length - 1 ? (
  <button
    onClick={() => document.getElementById('calculators')?.scrollIntoView({ behavior: 'smooth' })}
    style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#f5a800', color: '#0f172a', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}
  >
    Use the Calculators ↓
  </button>
) : (
  <button
  onClick={() => { setStep((prev) => Math.min(EXPL_STEPS.length - 1, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}    style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
  >
    Next →
  </button>
)}   </div>
          </Collapsible>

          <Collapsible
          id="calculators"
            title={tr.calc2Title}
            subtitle={tr.calc2Sub}
            icon="📊"
            open={c2Open}
            onToggle={() => setC2Open((v) => !v)}
            accent="#10b981"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: 10,
                  padding: '1.25rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748b',
                    marginBottom: '1rem',
                  }}
                >
                  {tr.cfg}
                </h3>
                <BoardControls
                  tr={tr}
                  boardSize={c2Board}
                  setBoardSize={setC2Board}
                  vacantSeats={c2Vac}
                  setVacantSeats={setC2Vac}
                  quorumBasis={c2Basis}
                  setQuorumBasis={setC2Basis}
                  quorumType={c2Type}
                  setQuorumType={setC2Type}
                  fixedNum={c2Fix}
                  setFixedNum={setC2Fix}
                  fracNum={c2FN}
                  setFracNum={setC2FN}
                  fracDen={c2FD}
                  setFracDen={setC2FD}
                  pctThreshold={c2Pct}
                  setPctThreshold={setC2Pct}
                  filledSeats={c2Fill}
                  quorumLabel={c2QL}
                  accent="#10b981"
                  uid="c2"
                />
                <div style={{ marginTop: '1rem' }}>
                  <span
                    style={{
                      fontSize: '0.88rem',
                      color: '#cbd5e1',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    {tr.avgAttLbl}
                  </span>
                  <span
                    style={{
                      fontSize: '0.73rem',
                      color: '#64748b',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    {tr.avgAttNote}
                  </span>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={c2Att}
                      onChange={(e) => setC2Att(+e.target.value)}
                      style={{ flex: 1, accentColor: '#10b981' }}
                    />
                    <span
                      style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: clr.text,
                        minWidth: 40,
                        textAlign: 'right',
                      }}
                    >
                      {c2Att}%
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      cursor: 'pointer',
                      marginBottom: 8,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={c2ShowMtgs}
                      onChange={(e) => setC2ShowMtgs(e.target.checked)}
                      style={{ accentColor: '#10b981' }}
                    />
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      {tr.mtgsLbl}
                    </span>
                  </label>
                  {c2ShowMtgs && (
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <input
                        type="range"
                        min={1}
                        max={52}
                        value={c2Mtgs}
                        onChange={(e) => setC2Mtgs(+e.target.value)}
                        style={{ flex: 1, accentColor: '#10b981' }}
                      />
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={c2Mtgs}
                        onChange={(e) =>
                          setC2Mtgs(Math.max(1, +e.target.value))
                        }
                        style={inp({ width: 55, textAlign: 'center' })}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem',
                }}
              >
                {c2VacMsg() && (
                  <div
                    style={{
                      background: c2Imp ? '#450a0a' : '#422006',
                      border: `1px solid ${c2Imp ? clr.bad : clr.warn}`,
                      borderRadius: 10,
                      padding: '0.85rem',
                      fontSize: '0.85rem',
                      color: c2Imp ? '#fca5a5' : '#fcd34d',
                      lineHeight: 1.6,
                    }}
                  >
                    {c2VacMsg()}
                  </div>
                )}
                <div
                  style={{
                    background: 'linear-gradient(135deg,#064e3b,#022c22)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    border: `1px solid ${c2ProbColor}44`,
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: '#6ee7b7',
                      marginBottom: 8,
                    }}
                  >
                    {tr.probResult}
                  </p>
                  {c2Imp ? (
                    <div>
                      <span
                        style={{
                          fontSize: '1.6rem',
                          fontWeight: 800,
                          color: clr.bad,
                        }}
                      >
                        ⚠️ {tr.qImp}
                      </span>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#fca5a5',
                          marginTop: 10,
                          lineHeight: 1.6,
                        }}
                      >
                        Quorum requires {c2Q} members but only {c2Fill} seat
                        {c2Fill !== 1 ? 's are' : ' is'} filled.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '3.5rem',
                            fontWeight: 800,
                            color: c2ProbColor,
                            lineHeight: 1,
                          }}
                        >
                          {c2Prob}%
                        </span>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                          }}
                        >
                          <span
                            style={{ fontSize: '0.85rem', color: '#94a3b8' }}
                          >
                            per meeting
                          </span>
                          {c2ShowMtgs && expectedMissed !== null && (
                            <span
                              style={{
                                fontSize: '0.82rem',
                                color: '#fcd34d',
                                background: '#422006',
                                border: '1px solid #f59e0b',
                                borderRadius: 6,
                                padding: '2px 8px',
                              }}
                            >
                              ~{expectedMissed} {tr.missedLbl}
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <div
                          style={{
                            height: 10,
                            background: '#0f172a',
                            borderRadius: 5,
                            overflow: 'hidden',
                            marginBottom: 6,
                          }}
                        >
                          <div
                            style={{
                              width: `${c2Prob}%`,
                              height: '100%',
                              background: `linear-gradient(90deg,${clr.bad},${clr.warn},${clr.good})`,
                              borderRadius: 5,
                              transition: 'width 0.4s',
                            }}
                          />
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.7rem',
                            color: '#475569',
                          }}
                        >
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <p
                        style={{
                          fontSize: '0.82rem',
                          color: '#6ee7b7',
                          marginTop: 10,
                          lineHeight: 1.6,
                        }}
                      >
                        {c2Prob >= 95
                          ? '✅ Very likely to make quorum.'
                          : c2Prob >= 80
                          ? '🟡 Reasonably likely, but some risk.'
                          : c2Prob >= 60
                          ? '🟠 Significant risk of missing quorum.'
                          : '🔴 High risk — quorum is frequently in doubt.'}
                      </p>
                    </>
                  )}
                </div>
                {!c2Imp && (
                  <>
                    <div style={{ ...crd() }}>
                      <h4
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#64748b',
                          marginBottom: '1rem',
                        }}
                      >
                        {tr.probChartTitle}
                      </h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart
                          data={c2Chart}
                          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e3a5f"
                          />
                          <XAxis
                            dataKey="attendance"
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(v) => [`${v}%`, tr.prob]}
                            labelFormatter={(l) => `${tr.attRate}: ${l}%`}
                            contentStyle={{
                              background: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: 8,
                              color: '#e2e8f0',
                            }}
                          />
                          <ReferenceLine
                            x={c2Att}
                            stroke="#10b981"
                            strokeDasharray="4 4"
                            label={{
                              value: `${c2Att}%`,
                              fill: '#6ee7b7',
                              fontSize: 11,
                              position: 'insideTopLeft',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="probability"
                            stroke="#10b981"
                            strokeWidth={2.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <p
                        style={{
                          fontSize: '0.72rem',
                          color: '#475569',
                          marginTop: 6,
                        }}
                      >
                        {tr.probChartNote}
                      </p>
                    </div>
                    <div style={{ ...crd() }}>
                      <h4
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#64748b',
                          marginBottom: '1rem',
                        }}
                      >
                        {tr.probTblTitle}
                      </h4>
                      <table
                        style={{ width: '100%', borderCollapse: 'collapse' }}
                      >
                        <thead>
                          <tr>
                            {[
                              'Confidence Target',
                              'Min. Rate Needed',
                              'Qualifies?',
                            ].map((h, i) => (
                              <th
                                key={i}
                                style={{
                                  textAlign: i === 0 ? 'left' : 'right',
                                  fontSize: '0.78rem',
                                  color: '#475569',
                                  paddingBottom: 8,
                                  fontWeight: 500,
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {c2ConfData.map(({ cl, minR, meets }) => (
                            <tr
                              key={cl}
                              style={{ borderTop: '1px solid #ffffff0a' }}
                            >
                              <td
                                style={{
                                  padding: '9px 0',
                                  fontSize: '0.88rem',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: CONF_COLORS[cl],
                                    marginRight: 8,
                                  }}
                                />
                                <span
                                  style={{
                                    color: CONF_COLORS[cl],
                                    fontWeight: 600,
                                  }}
                                >
                                  {cl}%
                                </span>
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontSize: '0.88rem',
                                  color: '#94a3b8',
                                }}
                              >
                                {minR}%
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <span
                                  style={{
                                    fontSize: '0.82rem',
                                    fontWeight: 700,
                                    color: meets ? clr.good : clr.bad,
                                    background: meets
                                      ? clr.good + '22'
                                      : clr.bad + '22',
                                    border: `1px solid ${
                                      meets ? clr.good : clr.bad
                                    }`,
                                    borderRadius: 6,
                                    padding: '2px 10px',
                                  }}
                                >
                                  {meets ? '✅ Yes' : '❌ No'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                <div
                  style={{
                    ...crd({ border: '1px solid #334155' }),
                    fontSize: '0.78rem',
                    color: '#64748b',
                    lineHeight: 1.6,
                  }}
                >
                  {tr.asmNote}
                </div>
              </div>
            </div>
          </Collapsible>

          <Collapsible
            title={tr.calc1Title}
            subtitle={tr.calc1Sub}
            icon="🎯"
            open={c1Open}
            onToggle={() => setC1Open((v) => !v)}
            accent="#6366f1"
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                alignItems: 'start',
              }}
            >
              <div
                style={{
                  background: '#0f172a',
                  borderRadius: 10,
                  padding: '1.25rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: '#64748b',
                    marginBottom: '1rem',
                  }}
                >
                  {tr.cfg}
                </h3>
                <BoardControls
                  tr={tr}
                  boardSize={c1Board}
                  setBoardSize={setC1Board}
                  vacantSeats={c1Vac}
                  setVacantSeats={setC1Vac}
                  quorumBasis={c1Basis}
                  setQuorumBasis={setC1Basis}
                  quorumType={c1Type}
                  setQuorumType={setC1Type}
                  fixedNum={c1Fix}
                  setFixedNum={setC1Fix}
                  fracNum={c1FN}
                  setFracNum={setC1FN}
                  fracDen={c1FD}
                  setFracDen={setC1FD}
                  pctThreshold={c1Pct}
                  setPctThreshold={setC1Pct}
                  filledSeats={c1Fill}
                  quorumLabel={c1QL}
                  accent="#6366f1"
                  uid="c1"
                />
                <div style={{ marginTop: '1rem' }}>
                  <span
                    style={{
                      fontSize: '0.88rem',
                      color: '#cbd5e1',
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    {tr.confLbl}
                  </span>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {CONF_LEVELS.map((cl) => (
                      <button
                        key={cl}
                        onClick={() => setC1Conf(cl)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 20,
                          border: `1px solid ${
                            c1Conf === cl ? CONF_COLORS[cl] : '#334155'
                          }`,
                          background:
                            c1Conf === cl
                              ? CONF_COLORS[cl] + '22'
                              : 'transparent',
                          color: c1Conf === cl ? CONF_COLORS[cl] : '#64748b',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        {cl}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.1rem',
                }}
              >
                {c1VacMsg() && (
                  <div
                    style={{
                      background: c1Imp ? '#450a0a' : '#422006',
                      border: `1px solid ${c1Imp ? clr.bad : clr.warn}`,
                      borderRadius: 10,
                      padding: '0.85rem',
                      fontSize: '0.85rem',
                      color: c1Imp ? '#fca5a5' : '#fcd34d',
                      lineHeight: 1.6,
                    }}
                  >
                    {c1VacMsg()}
                  </div>
                )}
                <div
                  style={{
                    background: 'linear-gradient(135deg,#312e81,#1e1b4b)',
                    borderRadius: 12,
                    padding: '1.5rem',
                    border: `1px solid ${
                      c1Imp ? clr.bad : CONF_COLORS[c1Conf]
                    }44`,
                  }}
                >
                  <p
                    style={{
                      fontSize: '0.82rem',
                      color: '#a5b4fc',
                      marginBottom: 8,
                    }}
                  >
                    {tr.minAttLbl} ({c1Conf}% {tr.confWord})
                  </p>
                  {c1Imp ? (
                    <div>
                      <span
                        style={{
                          fontSize: '1.6rem',
                          fontWeight: 800,
                          color: clr.bad,
                        }}
                      >
                        ⚠️ {tr.qImp}
                      </span>
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#fca5a5',
                          marginTop: 10,
                          lineHeight: 1.6,
                        }}
                      >
                        Quorum requires {c1Q} members but only {c1Fill} seat
                        {c1Fill !== 1 ? 's are' : ' is'} filled. Fill{' '}
                        {c1Q - c1Fill} more seat{c1Q - c1Fill !== 1 ? 's' : ''}{' '}
                        or change the quorum rule.
                      </p>
                    </div>
                  ) : (
                    <>
                      <span
                        style={{
                          fontSize: '3.2rem',
                          fontWeight: 800,
                          color: '#fff',
                          lineHeight: 1,
                        }}
                      >
                        {c1MinPct}%
                      </span>
                      {c1Vac > 0 && (
                        <span
                          style={{
                            display: 'inline-block',
                            marginLeft: 12,
                            background: '#f59e0b22',
                            border: '1px solid #f59e0b',
                            borderRadius: 6,
                            padding: '2px 8px',
                            fontSize: '0.75rem',
                            color: '#fcd34d',
                            verticalAlign: 'middle',
                          }}
                        >
                          of {c1Fill} filled seats
                        </span>
                      )}
                      <p
                        style={{
                          fontSize: '0.85rem',
                          color: '#c7d2fe',
                          marginTop: 10,
                          lineHeight: 1.6,
                        }}
                      >
                        {tr.rWith} {c1Board} {tr.rBoard} {c1Q} {tr.rForQ}{' '}
                        {c1MinPct}%, {tr.rChance} {c1Conf}% {tr.rEnd}
                      </p>
                    </>
                  )}
                </div>
                {!c1Imp && (
                  <>
                    <div style={{ ...crd() }}>
                      <h4
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#64748b',
                          marginBottom: '1rem',
                        }}
                      >
                        {tr.chartTitle}
                      </h4>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart
                          data={c1Chart}
                          margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#1e3a5f"
                          />
                          <XAxis
                            dataKey="attendance"
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(v) => [`${v}%`, tr.prob]}
                            labelFormatter={(l) => `${tr.attRate}: ${l}%`}
                            contentStyle={{
                              background: '#0f172a',
                              border: '1px solid #334155',
                              borderRadius: 8,
                              color: '#e2e8f0',
                            }}
                          />
                          <ReferenceLine
                            y={c1Conf}
                            stroke={CONF_COLORS[c1Conf]}
                            strokeDasharray="4 4"
                            label={{
                              value: `${c1Conf}%`,
                              fill: CONF_COLORS[c1Conf],
                              fontSize: 11,
                              position: 'insideTopRight',
                            }}
                          />
                          <ReferenceLine
                            x={Math.round(c1MinAtt * 100)}
                            stroke="#6366f1"
                            strokeDasharray="4 4"
                            label={{
                              value: `${c1MinPct}%`,
                              fill: '#a5b4fc',
                              fontSize: 11,
                              position: 'insideTopLeft',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="probability"
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                      <p
                        style={{
                          fontSize: '0.72rem',
                          color: '#475569',
                          marginTop: 6,
                        }}
                      >
                        {tr.chartNote}
                      </p>
                    </div>
                    <div style={{ ...crd() }}>
                      <h4
                        style={{
                          fontSize: '0.73rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#64748b',
                          marginBottom: '1rem',
                        }}
                      >
                        {tr.tblTitle}
                      </h4>
                      <table
                        style={{ width: '100%', borderCollapse: 'collapse' }}
                      >
                        <thead>
                          <tr>
                            {[tr.tblConf, tr.tblAtt, tr.tblBar].map((h, i) => (
                              <th
                                key={i}
                                style={{
                                  textAlign: i === 0 ? 'left' : 'right',
                                  fontSize: '0.78rem',
                                  color: '#475569',
                                  paddingBottom: 8,
                                  fontWeight: 500,
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {c1Tbl.map(({ cl, att }) => (
                            <tr
                              key={cl}
                              style={{
                                borderTop: '1px solid #ffffff0a',
                                background:
                                  cl === c1Conf ? '#0f172a' : 'transparent',
                              }}
                            >
                              <td
                                style={{
                                  padding: '9px 0',
                                  fontSize: '0.88rem',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    background: CONF_COLORS[cl],
                                    marginRight: 8,
                                  }}
                                />
                                <span
                                  style={{
                                    color:
                                      cl === c1Conf
                                        ? CONF_COLORS[cl]
                                        : '#94a3b8',
                                    fontWeight: cl === c1Conf ? 700 : 400,
                                  }}
                                >
                                  {cl}%
                                </span>
                                {cl === c1Conf && (
                                  <span
                                    style={{
                                      fontSize: '0.7rem',
                                      color: '#6366f1',
                                      marginLeft: 6,
                                    }}
                                  >
                                    ← {tr.selTag}
                                  </span>
                                )}
                              </td>
                              <td
                                style={{
                                  textAlign: 'right',
                                  fontSize: '0.92rem',
                                  fontWeight: 700,
                                  color: CONF_COLORS[cl],
                                }}
                              >
                                {att}%
                              </td>
                              <td
                                style={{ textAlign: 'right', paddingLeft: 16 }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                  }}
                                >
                                  <div
                                    style={{
                                      width: 80,
                                      height: 6,
                                      background: '#0f172a',
                                      borderRadius: 3,
                                      overflow: 'hidden',
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: `${att}%`,
                                        height: '100%',
                                        background: CONF_COLORS[cl],
                                        borderRadius: 3,
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                <div
                  style={{
                    ...crd({ border: '1px solid #334155' }),
                    fontSize: '0.78rem',
                    color: '#64748b',
                    lineHeight: 1.6,
                  }}
                >
                  {tr.asmNote}
                </div>
              </div>
            </div>
          </Collapsible>
        </div>
      </div>
    </>
  );
}
