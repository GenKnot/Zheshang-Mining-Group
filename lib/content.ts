// 全站文案（7 种语言）。目前均为通用占位文案，待客户确认后替换。
// 法语、日语、韩语、西班牙语译文建议上线前由母语者校对。

export const LANGS = ['zh-cn', 'zh-hk', 'en', 'ja', 'ko', 'fr', 'es'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'zh-cn';

// <html lang> 使用的标准代码
export const HTML_LANG: Record<Lang, string> = {
  'zh-cn': 'zh-CN',
  'zh-hk': 'zh-HK',
  en: 'en',
  ja: 'ja',
  ko: 'ko',
  fr: 'fr',
  es: 'es',
};

export const TEL = '400-9933-066';
export const MAIL = 'info@zsktgroup.com';

const COORD_HK = 'N 22°19′ · E 114°10′';
const COORD_HZ = 'N 30°12′ · E 120°12′';
// 英文地址为自行翻译，大厦英文名待核实
const ADDR_HK_EN = 'Room 602, 6/F, Kai Yue Commercial Building, 2C Argyle Street, Mong Kok, Kowloon, Hong Kong';
const ADDR_HZ_EN = 'Room 4901, Tower B, Shimao Wisdom Gate, Binjiang District, Hangzhou, China';
const ADDR_HK_ZH = '香港九龍旺角亞皆老街2C號啟如商業大廈6樓602室';

type Dict = {
  name: string; // 语言切换器中显示的名称
  short: string;
  meta: { title: string; desc: string };
  brand: string;
  brandSub: string;
  nav: [string, string, string];
  hero: { eyebrow: string; title: [string, string]; sub: string; cta: string; cta2: string; scroll: string };
  about: {
    label: string;
    title: string;
    body: string;
    principles: string;
    pillars: { k: string; e: string; d: string }[];
  };
  biz: { label: string; items: { t: string; d: string }[] };
  contact: {
    label: string;
    title: string;
    offices: { city: string; en: string; coord: string; addr: string }[];
    tel: string;
    mail: string;
  };
  footer: string;
};

export const content: Record<Lang, Dict> = {
  'zh-cn': {
    name: '简体中文',
    short: '简',
    meta: {
      title: '浙商矿业集团 | Zheshang Mining Group',
      desc: '浙商矿业集团有限公司官方网站。立足香港与杭州，专注矿产资源领域。',
    },
    brand: '浙商矿业集团',
    brandSub: 'ZHESHANG MINING GROUP',
    nav: ['关于集团', '核心业务', '联系我们'],
    hero: {
      eyebrow: 'ZHESHANG MINING GROUP',
      title: ['聚资源之力', '筑产业之基'],
      sub: '浙商矿业集团立足香港与杭州，以长期视角参与矿产资源领域的投资与发展。',
      cta: '了解集团',
      cta2: '联系我们',
      scroll: '向下滚动',
    },
    about: {
      label: '关于集团',
      title: '立足香港与杭州，\n连接资源与产业。',
      body: '浙商矿业集团有限公司是一家专注于矿产资源领域的综合性企业集团。集团秉持稳健、合规、长期的经营理念，致力于与合作伙伴共同创造可持续的价值。',
      principles: '经营理念',
      pillars: [
        { k: '稳健', e: 'Prudence', d: '审慎研判，行稳致远' },
        { k: '合规', e: 'Compliance', d: '规范经营，守正笃实' },
        { k: '长期', e: 'Long-term', d: '着眼长远，持续投入' },
      ],
    },
    biz: {
      label: '核心业务',
      items: [
        { t: '矿产资源投资', d: '聚焦优质矿产资源，以审慎的研判与长期视角开展投资布局。' },
        { t: '矿业工程咨询与技术服务', d: '为矿业项目提供工程咨询与技术服务，支持项目规范、稳健地推进。' },
        { t: '并购重组咨询', d: '为企业并购与重组提供策划与咨询，协助资源与资产的有效整合。' },
        { t: '资产受托管理', d: '接受委托管理相关资产，以审慎、合规的方式维护资产价值。' },
      ],
    },
    contact: {
      label: '联系我们',
      title: '期待与您合作',
      offices: [
        { city: '香港', en: 'HONG KONG', coord: COORD_HK, addr: ADDR_HK_ZH },
        { city: '杭州', en: 'HANGZHOU', coord: COORD_HZ, addr: '杭州市滨江区世茂智慧之门B塔4901室' },
      ],
      tel: '电话',
      mail: '邮箱',
    },
    footer: '浙商矿业集团有限公司　版权所有',
  },

  'zh-hk': {
    name: '繁體中文',
    short: '繁',
    meta: {
      title: '浙商礦業集團 | Zheshang Mining Group',
      desc: '浙商礦業集團有限公司官方網站。立足香港與杭州，專注礦產資源領域。',
    },
    brand: '浙商礦業集團',
    brandSub: 'ZHESHANG MINING GROUP',
    nav: ['關於集團', '核心業務', '聯絡我們'],
    hero: {
      eyebrow: 'ZHESHANG MINING GROUP',
      title: ['聚資源之力', '築產業之基'],
      sub: '浙商礦業集團立足香港與杭州，以長期視角參與礦產資源領域的投資與發展。',
      cta: '了解集團',
      cta2: '聯絡我們',
      scroll: '向下捲動',
    },
    about: {
      label: '關於集團',
      title: '立足香港與杭州，\n連接資源與產業。',
      body: '浙商礦業集團有限公司是一家專注於礦產資源領域的綜合性企業集團。集團秉持穩健、合規、長期的經營理念，致力於與合作夥伴共同創造可持續的價值。',
      principles: '經營理念',
      pillars: [
        { k: '穩健', e: 'Prudence', d: '審慎研判，行穩致遠' },
        { k: '合規', e: 'Compliance', d: '規範經營，守正篤實' },
        { k: '長期', e: 'Long-term', d: '著眼長遠，持續投入' },
      ],
    },
    biz: {
      label: '核心業務',
      items: [
        { t: '礦產資源投資', d: '聚焦優質礦產資源，以審慎的研判與長期視角開展投資佈局。' },
        { t: '礦業工程諮詢與技術服務', d: '為礦業項目提供工程諮詢與技術服務，支持項目規範、穩健地推進。' },
        { t: '併購重組諮詢', d: '為企業併購與重組提供策劃與諮詢，協助資源與資產的有效整合。' },
        { t: '資產受託管理', d: '接受委託管理相關資產，以審慎、合規的方式維護資產價值。' },
      ],
    },
    contact: {
      label: '聯絡我們',
      title: '期待與您合作',
      offices: [
        { city: '香港', en: 'HONG KONG', coord: COORD_HK, addr: ADDR_HK_ZH },
        { city: '杭州', en: 'HANGZHOU', coord: COORD_HZ, addr: '杭州市濱江區世茂智慧之門B塔4901室' },
      ],
      tel: '電話',
      mail: '電郵',
    },
    footer: '浙商礦業集團有限公司　版權所有',
  },

  en: {
    name: 'English',
    short: 'EN',
    meta: {
      title: 'Zheshang Mining Group',
      desc: 'Official website of Zheshang Mining Group. Based in Hong Kong and Hangzhou, focused on mineral resources.',
    },
    brand: 'Zheshang Mining Group',
    brandSub: '浙商矿业集团',
    nav: ['About', 'Business', 'Contact'],
    hero: {
      eyebrow: 'ZHESHANG MINING GROUP',
      title: ['Resources that', 'build industry.'],
      sub: 'Based in Hong Kong and Hangzhou, Zheshang Mining Group takes a long-term view on investment and development in mineral resources.',
      cta: 'About the Group',
      cta2: 'Contact',
      scroll: 'Scroll',
    },
    about: {
      label: 'About',
      title: 'Hong Kong and Hangzhou.\nResources and industry.',
      body: 'Zheshang Mining Group is a diversified enterprise group focused on mineral resources. Guided by prudence, compliance and a long-term outlook, the Group works with its partners to create sustainable value.',
      principles: 'Principles',
      pillars: [
        { k: 'Prudence', e: '稳健', d: 'Careful judgement, steady progress' },
        { k: 'Compliance', e: '合规', d: 'Disciplined and principled operations' },
        { k: 'Long-term', e: '长期', d: 'A long horizon, sustained commitment' },
      ],
    },
    biz: {
      label: 'Business',
      items: [
        { t: 'Resource Investment', d: 'Investing in quality mineral resources with careful judgement and a long-term view.' },
        { t: 'Engineering Consulting & Technical Services', d: 'Engineering consulting and technical services that help mining projects progress soundly and to standard.' },
        { t: 'M&A and Restructuring Advisory', d: 'Planning and advisory support for mergers, acquisitions and restructuring, helping integrate resources and assets.' },
        { t: 'Entrusted Asset Management', d: 'Managing assets on behalf of clients in a prudent and compliant manner to preserve their value.' },
      ],
    },
    contact: {
      label: 'Contact',
      title: 'Get in touch',
      offices: [
        { city: 'Hong Kong', en: '香港', coord: COORD_HK, addr: ADDR_HK_EN },
        { city: 'Hangzhou', en: '杭州', coord: COORD_HZ, addr: ADDR_HZ_EN },
      ],
      tel: 'Tel',
      mail: 'Email',
    },
    footer: 'Zheshang Mining Group Limited. All rights reserved.',
  },

  ja: {
    name: '日本語',
    short: 'JA',
    meta: {
      title: 'Zheshang Mining Group',
      desc: 'Zheshang Mining Group 公式サイト。香港と杭州を拠点に、鉱物資源分野に取り組んでいます。',
    },
    brand: 'Zheshang Mining Group',
    brandSub: '浙商矿业集团',
    nav: ['グループ概要', '事業内容', 'お問い合わせ'],
    hero: {
      eyebrow: 'ZHESHANG MINING GROUP',
      title: ['資源の力を集め、', '産業の礎を築く。'],
      sub: 'Zheshang Mining Group は香港と杭州を拠点に、長期的な視点で鉱物資源分野の投資と発展に取り組んでいます。',
      cta: 'グループについて',
      cta2: 'お問い合わせ',
      scroll: 'スクロール',
    },
    about: {
      label: 'グループ概要',
      title: '香港と杭州を拠点に、\n資源と産業をつなぐ。',
      body: 'Zheshang Mining Group は、鉱物資源分野に特化した総合企業グループです。堅実・コンプライアンス・長期志向を経営理念とし、パートナーの皆様とともに持続可能な価値の創造を目指します。',
      principles: '経営理念',
      pillars: [
        { k: '堅実', e: 'Prudence', d: '慎重な判断で、着実に前進する' },
        { k: '法令遵守', e: 'Compliance', d: '規律ある誠実な事業運営' },
        { k: '長期志向', e: 'Long-term', d: '長期的な視野で、継続的に取り組む' },
      ],
    },
    biz: {
      label: '事業内容',
      items: [
        { t: '鉱物資源投資', d: '優良な鉱物資源に焦点を当て、慎重な分析と長期的な視点で投資を行います。' },
        { t: '鉱業エンジニアリング・技術サービス', d: '鉱業プロジェクトに対しエンジニアリングコンサルティングと技術サービスを提供し、適正かつ着実な推進を支援します。' },
        { t: 'M&A・事業再編コンサルティング', d: '企業の合併・買収および再編に関する企画・助言を行い、資源と資産の統合を支援します。' },
        { t: '資産受託管理', d: '委託を受けた資産を、慎重かつ法令に則って管理し、その価値の維持に努めます。' },
      ],
    },
    contact: {
      label: 'お問い合わせ',
      title: 'お気軽にご連絡ください',
      offices: [
        { city: '香港', en: 'HONG KONG', coord: COORD_HK, addr: ADDR_HK_ZH },
        { city: '杭州', en: 'HANGZHOU', coord: COORD_HZ, addr: '杭州市濱江区世茂智慧之門B棟4901室' },
      ],
      tel: '電話',
      mail: 'メール',
    },
    footer: 'Zheshang Mining Group Limited. All rights reserved.',
  },

  ko: {
    name: '한국어',
    short: 'KO',
    meta: {
      title: 'Zheshang Mining Group',
      desc: 'Zheshang Mining Group 공식 웹사이트. 홍콩과 항저우를 거점으로 광물 자원 분야에 집중합니다.',
    },
    brand: 'Zheshang Mining Group',
    brandSub: '浙商矿业集团',
    nav: ['그룹 소개', '핵심 사업', '문의하기'],
    hero: {
      eyebrow: 'ZHESHANG MINING GROUP',
      title: ['자원의 힘을 모아', '산업의 기반을 세우다'],
      sub: 'Zheshang Mining Group은 홍콩과 항저우를 거점으로, 장기적인 관점에서 광물 자원 분야의 투자와 발전에 참여하고 있습니다.',
      cta: '그룹 소개',
      cta2: '문의하기',
      scroll: '스크롤',
    },
    about: {
      label: '그룹 소개',
      title: '홍콩과 항저우에서,\n자원과 산업을 연결합니다.',
      body: 'Zheshang Mining Group은 광물 자원 분야에 집중하는 종합 기업 그룹입니다. 안정, 준법, 장기적 관점을 경영 이념으로 삼아 파트너와 함께 지속 가능한 가치를 창출하고자 합니다.',
      principles: '경영 이념',
      pillars: [
        { k: '안정', e: 'Prudence', d: '신중한 판단, 꾸준한 전진' },
        { k: '준법', e: 'Compliance', d: '원칙을 지키는 투명한 경영' },
        { k: '장기', e: 'Long-term', d: '멀리 내다보는 지속적인 투자' },
      ],
    },
    biz: {
      label: '핵심 사업',
      items: [
        { t: '광물 자원 투자', d: '우량 광물 자원에 집중하여 신중한 분석과 장기적 관점으로 투자합니다.' },
        { t: '광업 엔지니어링 컨설팅 및 기술 서비스', d: '광업 프로젝트에 엔지니어링 컨설팅과 기술 서비스를 제공하여 안정적이고 규범적인 추진을 지원합니다.' },
        { t: '인수합병 및 구조조정 자문', d: '기업의 인수합병과 구조조정에 대한 기획 및 자문을 제공하여 자원과 자산의 통합을 지원합니다.' },
        { t: '자산 수탁 관리', d: '위탁받은 자산을 신중하고 준법적인 방식으로 관리하여 자산 가치를 지킵니다.' },
      ],
    },
    contact: {
      label: '문의하기',
      title: '함께할 날을 기대합니다',
      offices: [
        { city: '홍콩', en: 'HONG KONG', coord: COORD_HK, addr: ADDR_HK_EN },
        { city: '항저우', en: 'HANGZHOU', coord: COORD_HZ, addr: ADDR_HZ_EN },
      ],
      tel: '전화',
      mail: '이메일',
    },
    footer: 'Zheshang Mining Group Limited. All rights reserved.',
  },

  fr: {
    name: 'Français',
    short: 'FR',
    meta: {
      title: 'Zheshang Mining Group',
      desc: 'Site officiel de Zheshang Mining Group. Implanté à Hong Kong et à Hangzhou, spécialisé dans les ressources minérales.',
    },
    brand: 'Zheshang Mining Group',
    brandSub: '浙商矿业集团',
    nav: ['Le Groupe', 'Activités', 'Contact'],
    hero: {
      eyebrow: 'ZHESHANG MINING GROUP',
      title: ['Les ressources,', 'socle de l’industrie.'],
      sub: 'Implanté à Hong Kong et à Hangzhou, Zheshang Mining Group s’engage sur le long terme dans l’investissement et le développement des ressources minérales.',
      cta: 'Découvrir le Groupe',
      cta2: 'Contact',
      scroll: 'Défiler',
    },
    about: {
      label: 'Le Groupe',
      title: 'Hong Kong et Hangzhou.\nRessources et industrie.',
      body: 'Zheshang Mining Group est un groupe diversifié spécialisé dans les ressources minérales. Guidé par la prudence, la conformité et une vision de long terme, le Groupe œuvre avec ses partenaires à la création d’une valeur durable.',
      principles: 'Principes',
      pillars: [
        { k: 'Prudence', e: '稳健', d: 'Un jugement rigoureux, une progression régulière' },
        { k: 'Conformité', e: '合规', d: 'Une gestion disciplinée et intègre' },
        { k: 'Long terme', e: '长期', d: 'Un horizon lointain, un engagement constant' },
      ],
    },
    biz: {
      label: 'Activités',
      items: [
        { t: 'Investissement minier', d: 'Investir dans des ressources minérales de qualité, avec rigueur et vision de long terme.' },
        { t: 'Conseil en ingénierie et services techniques', d: 'Conseil en ingénierie et services techniques pour accompagner l’avancement rigoureux des projets miniers.' },
        { t: 'Conseil en fusions-acquisitions', d: 'Accompagnement des opérations de fusion, d’acquisition et de restructuration pour une intégration efficace des ressources et des actifs.' },
        { t: 'Gestion d’actifs sous mandat', d: 'Gestion d’actifs pour le compte de tiers, de manière prudente et conforme, afin d’en préserver la valeur.' },
      ],
    },
    contact: {
      label: 'Contact',
      title: 'Nous contacter',
      offices: [
        { city: 'Hong Kong', en: '香港', coord: COORD_HK, addr: ADDR_HK_EN },
        { city: 'Hangzhou', en: '杭州', coord: COORD_HZ, addr: ADDR_HZ_EN },
      ],
      tel: 'Tél.',
      mail: 'E-mail',
    },
    footer: 'Zheshang Mining Group Limited. Tous droits réservés.',
  },

  es: {
    name: 'Español',
    short: 'ES',
    meta: {
      title: 'Zheshang Mining Group',
      desc: 'Sitio web oficial de Zheshang Mining Group. Con sede en Hong Kong y Hangzhou, especializado en recursos minerales.',
    },
    brand: 'Zheshang Mining Group',
    brandSub: '浙商矿业集团',
    nav: ['El Grupo', 'Negocios', 'Contacto'],
    hero: {
      eyebrow: 'ZHESHANG MINING GROUP',
      title: ['Recursos que', 'impulsan la industria.'],
      sub: 'Con sede en Hong Kong y Hangzhou, Zheshang Mining Group participa con visión de largo plazo en la inversión y el desarrollo de recursos minerales.',
      cta: 'Conocer el Grupo',
      cta2: 'Contacto',
      scroll: 'Desplazar',
    },
    about: {
      label: 'El Grupo',
      title: 'Hong Kong y Hangzhou.\nRecursos e industria.',
      body: 'Zheshang Mining Group es un grupo empresarial diversificado centrado en los recursos minerales. Guiado por la prudencia, el cumplimiento normativo y una visión de largo plazo, el Grupo trabaja con sus socios para crear valor sostenible.',
      principles: 'Principios',
      pillars: [
        { k: 'Prudencia', e: '稳健', d: 'Criterio riguroso, avance constante' },
        { k: 'Cumplimiento', e: '合规', d: 'Gestión disciplinada e íntegra' },
        { k: 'Largo plazo', e: '长期', d: 'Horizonte amplio, compromiso sostenido' },
      ],
    },
    biz: {
      label: 'Negocios',
      items: [
        { t: 'Inversión en recursos', d: 'Invertimos en recursos minerales de calidad con criterio riguroso y visión de largo plazo.' },
        { t: 'Consultoría de ingeniería y servicios técnicos', d: 'Consultoría de ingeniería y servicios técnicos para que los proyectos mineros avancen con solidez y conforme a las normas.' },
        { t: 'Asesoría en fusiones y reestructuración', d: 'Planificación y asesoría en fusiones, adquisiciones y reestructuraciones para integrar recursos y activos.' },
        { t: 'Gestión de activos por mandato', d: 'Gestionamos activos por encargo de terceros, con prudencia y cumplimiento, para preservar su valor.' },
      ],
    },
    contact: {
      label: 'Contacto',
      title: 'Contáctenos',
      offices: [
        { city: 'Hong Kong', en: '香港', coord: COORD_HK, addr: ADDR_HK_EN },
        { city: 'Hangzhou', en: '杭州', coord: COORD_HZ, addr: ADDR_HZ_EN },
      ],
      tel: 'Tel.',
      mail: 'Correo',
    },
    footer: 'Zheshang Mining Group Limited. Todos los derechos reservados.',
  },
};
