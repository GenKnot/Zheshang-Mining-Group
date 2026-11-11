// 新增版块文案：矿产资源、责任、合作方式、合作邀约（7 种语言）。
// 均为行业通用表述，不涉及公司具体项目与数据；待客户确认后调整。
import type { Lang } from './content';

// 元素符号与原子序数（顺序与各语言 minerals.items 一致）
export const ELEMENTS = [
  { s: 'Cu', n: 29 },
  { s: 'Au', n: 79 },
  { s: 'Li', n: 3 },
  { s: 'Fe', n: 26 },
  { s: 'Ni', n: 28 },
  { s: 'Al', n: 13 },
] as const;

type Pair = [string, string];
type More = {
  nav: [string, string]; // 导航：矿产资源、责任
  minerals: { label: string; title: string; intro: string; items: Pair[] };
  resp: { label: string; title: string; items: Pair[] };
  process: { label: string; title: string; items: Pair[] };
  band: { title: string; body: string };
};

export const more: Record<Lang, More> = {
  'zh-cn': {
    nav: ['矿产资源', '责任'],
    minerals: {
      label: '矿产资源',
      title: '矿产资源，\n现代产业的基石。',
      intro: '从电力网络到新能源汽车，从基础建设到电子信息，现代产业的每一次进步都离不开矿产资源。',
      items: [
        ['铜', '电力、新能源与电子工业的关键导体材料'],
        ['金', '价值储备，亦用于精密电子'],
        ['锂', '动力与储能电池的核心原料'],
        ['铁', '钢铁与基础设施建设的基础'],
        ['镍', '不锈钢与电池材料的重要成分'],
        ['铝', '轻量化制造与交通运输的常用金属'],
      ],
    },
    resp: {
      label: '责任',
      title: '负责任地\n参与资源开发。',
      items: [
        ['安全', '把人的安全与健康放在首位'],
        ['环境', '重视生态保护与资源的高效利用'],
        ['社区', '尊重当地社区，追求共同发展'],
        ['治理', '坚持合规透明的公司治理'],
      ],
    },
    process: {
      label: '合作方式',
      title: '从接洽到落地，\n稳步推进每一步。',
      items: [
        ['项目接洽', '了解合作意向与项目基本情况'],
        ['研判评估', '对资源、合规与风险进行审慎评估'],
        ['方案设计', '与伙伴共同确定合作模式与方案'],
        ['落地执行', '按计划推进，并保持持续沟通'],
      ],
    },
    band: { title: '与我们同行', body: '无论是业务合作还是职业发展，欢迎与我们联系。' },
  },

  'zh-hk': {
    nav: ['礦產資源', '責任'],
    minerals: {
      label: '礦產資源',
      title: '礦產資源，\n現代產業的基石。',
      intro: '從電力網絡到新能源汽車，從基礎建設到電子資訊，現代產業的每一次進步都離不開礦產資源。',
      items: [
        ['銅', '電力、新能源與電子工業的關鍵導體材料'],
        ['金', '價值儲備，亦用於精密電子'],
        ['鋰', '動力與儲能電池的核心原料'],
        ['鐵', '鋼鐵與基礎設施建設的基礎'],
        ['鎳', '不鏽鋼與電池材料的重要成分'],
        ['鋁', '輕量化製造與交通運輸的常用金屬'],
      ],
    },
    resp: {
      label: '責任',
      title: '負責任地\n參與資源開發。',
      items: [
        ['安全', '把人的安全與健康放在首位'],
        ['環境', '重視生態保護與資源的高效利用'],
        ['社區', '尊重當地社區，追求共同發展'],
        ['管治', '堅持合規透明的公司管治'],
      ],
    },
    process: {
      label: '合作方式',
      title: '從接洽到落實，\n穩步推進每一步。',
      items: [
        ['項目接洽', '了解合作意向與項目基本情況'],
        ['研判評估', '對資源、合規與風險進行審慎評估'],
        ['方案設計', '與夥伴共同確定合作模式與方案'],
        ['落實執行', '按計劃推進，並保持持續溝通'],
      ],
    },
    band: { title: '與我們同行', body: '無論是業務合作還是職業發展，歡迎與我們聯絡。' },
  },

  en: {
    nav: ['Resources', 'Responsibility'],
    minerals: {
      label: 'Resources',
      title: 'Minerals: the foundation\nof modern industry.',
      intro: 'From power grids to electric vehicles, from infrastructure to electronics, every step forward in modern industry depends on mineral resources.',
      items: [
        ['Copper', 'A key conductor for power, clean energy and electronics'],
        ['Gold', 'A store of value, also used in precision electronics'],
        ['Lithium', 'A core raw material for traction and storage batteries'],
        ['Iron', 'The basis of steel and infrastructure'],
        ['Nickel', 'An important component of stainless steel and battery materials'],
        ['Aluminium', 'A common metal in lightweight manufacturing and transport'],
      ],
    },
    resp: {
      label: 'Responsibility',
      title: 'Taking part in resource\ndevelopment responsibly.',
      items: [
        ['Safety', 'People’s safety and health come first'],
        ['Environment', 'Care for ecosystems and efficient use of resources'],
        ['Community', 'Respect for local communities and shared development'],
        ['Governance', 'Compliant and transparent corporate governance'],
      ],
    },
    process: {
      label: 'How we work',
      title: 'From first contact to delivery,\none steady step at a time.',
      items: [
        ['Initial contact', 'Understanding the intent and basics of a project'],
        ['Assessment', 'Careful review of resources, compliance and risk'],
        ['Structuring', 'Agreeing the cooperation model with our partners'],
        ['Delivery', 'Executing to plan with ongoing communication'],
      ],
    },
    band: { title: 'Work with us', body: 'Whether it is business cooperation or a career, we would be glad to hear from you.' },
  },

  ja: {
    nav: ['鉱物資源', '責任'],
    minerals: {
      label: '鉱物資源',
      title: '鉱物資源は、\n現代産業の礎。',
      intro: '電力網から電気自動車、インフラから電子機器まで、現代産業の進歩は鉱物資源に支えられています。',
      items: [
        ['銅', '電力・新エネルギー・電子産業に欠かせない導電材料'],
        ['金', '価値の保存手段であり、精密電子にも使用'],
        ['リチウム', '車載・蓄電用電池の中核原料'],
        ['鉄', '鉄鋼とインフラ建設の基盤'],
        ['ニッケル', 'ステンレス鋼と電池材料の重要成分'],
        ['アルミニウム', '軽量化製造と輸送分野で広く使われる金属'],
      ],
    },
    resp: {
      label: '責任',
      title: '責任ある姿勢で、\n資源開発に取り組む。',
      items: [
        ['安全', '人の安全と健康を最優先に'],
        ['環境', '生態系の保全と資源の効率的な利用を重視'],
        ['地域社会', '地域社会を尊重し、共に発展を目指す'],
        ['ガバナンス', '法令を遵守した透明性の高い企業統治'],
      ],
    },
    process: {
      label: '協業の進め方',
      title: '最初のご相談から実行まで、\n一歩ずつ着実に。',
      items: [
        ['ご相談', '協業の意向とプロジェクトの概要を把握'],
        ['評価・分析', '資源・法令・リスクを慎重に評価'],
        ['スキーム設計', 'パートナーと協業の形を決定'],
        ['実行', '計画に沿って推進し、継続的に連携'],
      ],
    },
    band: { title: 'ともに歩む', body: '事業協力でもキャリアでも、お気軽にお問い合わせください。' },
  },

  ko: {
    nav: ['광물 자원', '책임'],
    minerals: {
      label: '광물 자원',
      title: '광물 자원,\n현대 산업의 기반.',
      intro: '전력망에서 전기차까지, 인프라에서 전자 산업까지, 현대 산업의 발전은 광물 자원에 기반합니다.',
      items: [
        ['구리', '전력·신에너지·전자 산업의 핵심 도체 소재'],
        ['금', '가치 저장 수단이자 정밀 전자 소재'],
        ['리튬', '동력 및 저장용 배터리의 핵심 원료'],
        ['철', '철강과 인프라 건설의 기초'],
        ['니켈', '스테인리스강과 배터리 소재의 주요 성분'],
        ['알루미늄', '경량화 제조와 운송 분야에 널리 쓰이는 금속'],
      ],
    },
    resp: {
      label: '책임',
      title: '책임 있는 자세로\n자원 개발에 참여합니다.',
      items: [
        ['안전', '사람의 안전과 건강을 최우선으로'],
        ['환경', '생태 보호와 자원의 효율적 이용을 중시'],
        ['지역사회', '지역사회를 존중하고 함께 발전'],
        ['거버넌스', '준법과 투명성을 지키는 기업 지배구조'],
      ],
    },
    process: {
      label: '협력 방식',
      title: '첫 상담부터 실행까지,\n한 걸음씩 착실하게.',
      items: [
        ['상담', '협력 의향과 프로젝트 개요 파악'],
        ['평가', '자원, 준법, 리스크에 대한 신중한 검토'],
        ['구조 설계', '파트너와 협력 모델 확정'],
        ['실행', '계획에 따라 추진하고 지속적으로 소통'],
      ],
    },
    band: { title: '함께합니다', body: '사업 협력이든 채용이든 언제든지 문의해 주십시오.' },
  },

  fr: {
    nav: ['Ressources', 'Responsabilité'],
    minerals: {
      label: 'Ressources',
      title: 'Les minéraux, fondement\nde l’industrie moderne.',
      intro: 'Des réseaux électriques aux véhicules électriques, des infrastructures à l’électronique, chaque avancée de l’industrie moderne repose sur les ressources minérales.',
      items: [
        ['Cuivre', 'Conducteur essentiel pour l’électricité, les énergies propres et l’électronique'],
        ['Or', 'Réserve de valeur, également utilisé en électronique de précision'],
        ['Lithium', 'Matière première clé des batteries de traction et de stockage'],
        ['Fer', 'Base de l’acier et des infrastructures'],
        ['Nickel', 'Composant important de l’acier inoxydable et des batteries'],
        ['Aluminium', 'Métal courant de l’allègement industriel et des transports'],
      ],
    },
    resp: {
      label: 'Responsabilité',
      title: 'Participer de façon responsable\nà la mise en valeur des ressources.',
      items: [
        ['Sécurité', 'La sécurité et la santé des personnes avant tout'],
        ['Environnement', 'Protection des écosystèmes et usage efficace des ressources'],
        ['Communautés', 'Respect des communautés locales et développement partagé'],
        ['Gouvernance', 'Une gouvernance conforme et transparente'],
      ],
    },
    process: {
      label: 'Notre démarche',
      title: 'Du premier contact à la réalisation,\nune étape après l’autre.',
      items: [
        ['Prise de contact', 'Comprendre l’intention et les bases du projet'],
        ['Évaluation', 'Examen rigoureux des ressources, de la conformité et des risques'],
        ['Structuration', 'Définir le modèle de coopération avec nos partenaires'],
        ['Réalisation', 'Exécuter selon le plan, en dialogue constant'],
      ],
    },
    band: { title: 'Travaillons ensemble', body: 'Coopération commerciale ou carrière : nous serons heureux d’échanger avec vous.' },
  },

  es: {
    nav: ['Recursos', 'Responsabilidad'],
    minerals: {
      label: 'Recursos',
      title: 'Los minerales, base\nde la industria moderna.',
      intro: 'De las redes eléctricas a los vehículos eléctricos, de la infraestructura a la electrónica, cada avance de la industria moderna depende de los recursos minerales.',
      items: [
        ['Cobre', 'Conductor clave para la electricidad, las energías limpias y la electrónica'],
        ['Oro', 'Reserva de valor, también usado en electrónica de precisión'],
        ['Litio', 'Materia prima esencial de las baterías de tracción y almacenamiento'],
        ['Hierro', 'Base del acero y de la infraestructura'],
        ['Níquel', 'Componente importante del acero inoxidable y de las baterías'],
        ['Aluminio', 'Metal habitual en la fabricación ligera y el transporte'],
      ],
    },
    resp: {
      label: 'Responsabilidad',
      title: 'Participar de forma responsable\nen el desarrollo de recursos.',
      items: [
        ['Seguridad', 'La seguridad y la salud de las personas, lo primero'],
        ['Medio ambiente', 'Protección de los ecosistemas y uso eficiente de los recursos'],
        ['Comunidad', 'Respeto por las comunidades locales y desarrollo compartido'],
        ['Gobernanza', 'Gobierno corporativo transparente y conforme a la normativa'],
      ],
    },
    process: {
      label: 'Cómo trabajamos',
      title: 'Del primer contacto a la ejecución,\npaso a paso.',
      items: [
        ['Primer contacto', 'Entender la intención y los datos básicos del proyecto'],
        ['Evaluación', 'Revisión rigurosa de recursos, cumplimiento y riesgos'],
        ['Estructuración', 'Definir el modelo de cooperación con nuestros socios'],
        ['Ejecución', 'Ejecutar según el plan, con comunicación continua'],
      ],
    },
    band: { title: 'Trabajemos juntos', body: 'Ya sea una cooperación comercial o una carrera profesional, estaremos encantados de escucharle.' },
  },
};

// ---------- 联系页 ----------
type ContactPage = {
  title: string;
  intro: string;
  offices: string;
  general: string;
  form: string;
  name: string;
  company: string;
  email: string;
  message: string;
  send: string;
  note: string;
  map: string;
  home: string;
  subject: string;
};

export const contactPage: Record<Lang, ContactPage> = {
  'zh-cn': {
    title: '联系我们',
    intro: '欢迎就业务合作、项目洽谈及其他事宜与我们联系。',
    offices: '办公地点',
    general: '联系方式',
    form: '在线留言',
    name: '姓名',
    company: '公司',
    email: '邮箱',
    message: '留言内容',
    send: '发送邮件',
    note: '点击后将打开您的邮件客户端，由您确认发送。',
    map: '查看地图',
    home: '返回首页',
    subject: '网站留言',
  },
  'zh-hk': {
    title: '聯絡我們',
    intro: '歡迎就業務合作、項目洽談及其他事宜與我們聯絡。',
    offices: '辦公地點',
    general: '聯絡方式',
    form: '網上留言',
    name: '姓名',
    company: '公司',
    email: '電郵',
    message: '留言內容',
    send: '發送電郵',
    note: '點擊後將開啟您的電郵程式，由您確認發送。',
    map: '查看地圖',
    home: '返回首頁',
    subject: '網站留言',
  },
  en: {
    title: 'Contact',
    intro: 'We welcome enquiries about business cooperation, projects and other matters.',
    offices: 'Offices',
    general: 'General enquiries',
    form: 'Send a message',
    name: 'Name',
    company: 'Company',
    email: 'Email',
    message: 'Message',
    send: 'Send email',
    note: 'This opens your email app, where you confirm and send.',
    map: 'View map',
    home: 'Back to home',
    subject: 'Website enquiry',
  },
  ja: {
    title: 'お問い合わせ',
    intro: '事業協力、プロジェクトのご相談、その他のお問い合わせを承ります。',
    offices: '拠点',
    general: '連絡先',
    form: 'メッセージ',
    name: 'お名前',
    company: '会社名',
    email: 'メールアドレス',
    message: 'お問い合わせ内容',
    send: 'メールを送信',
    note: 'クリックするとメールソフトが開きます。内容をご確認のうえ送信してください。',
    map: '地図を見る',
    home: 'ホームへ戻る',
    subject: 'ウェブサイトからのお問い合わせ',
  },
  ko: {
    title: '문의하기',
    intro: '사업 협력, 프로젝트 상담 및 기타 문의를 환영합니다.',
    offices: '사무소',
    general: '연락처',
    form: '메시지 보내기',
    name: '이름',
    company: '회사',
    email: '이메일',
    message: '문의 내용',
    send: '이메일 보내기',
    note: '클릭하면 이메일 프로그램이 열리며, 확인 후 직접 전송하실 수 있습니다.',
    map: '지도 보기',
    home: '홈으로',
    subject: '웹사이트 문의',
  },
  fr: {
    title: 'Contact',
    intro: 'Nous accueillons vos demandes concernant la coopération commerciale, les projets et tout autre sujet.',
    offices: 'Bureaux',
    general: 'Coordonnées',
    form: 'Envoyer un message',
    name: 'Nom',
    company: 'Société',
    email: 'E-mail',
    message: 'Message',
    send: 'Envoyer l’e-mail',
    note: 'Ce bouton ouvre votre messagerie, où vous confirmez l’envoi.',
    map: 'Voir la carte',
    home: 'Retour à l’accueil',
    subject: 'Demande via le site',
  },
  es: {
    title: 'Contacto',
    intro: 'Atendemos consultas sobre cooperación comercial, proyectos y otros asuntos.',
    offices: 'Oficinas',
    general: 'Datos de contacto',
    form: 'Enviar un mensaje',
    name: 'Nombre',
    company: 'Empresa',
    email: 'Correo',
    message: 'Mensaje',
    send: 'Enviar correo',
    note: 'Se abrirá su aplicación de correo, donde podrá confirmar el envío.',
    map: 'Ver mapa',
    home: 'Volver al inicio',
    subject: 'Consulta desde el sitio web',
  },
};
