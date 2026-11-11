// 隐私政策与法律声明正文。
// 只提供简体中文、繁体中文、英文三个版本；日、韩、法、西语页面显示英文正文并附一行说明。
// 这是按网站当前实际行为写的通用模板，上线前应由公司法务或律师审阅。
import { MAIL, type Lang } from './content';

export type Section = { h: string; p: string[] };
export type LegalDoc = { intro: string; sections: Section[] };
export type LegalKind = 'privacy' | 'legal';
type DocLang = 'zh-cn' | 'zh-hk' | 'en';

export const docLang = (l: Lang): DocLang => (l === 'zh-cn' || l === 'zh-hk' ? l : 'en');

// 各语言的页面标题、页脚链接名、“本页为英文”说明、企业文化、404 文案
export const pageText: Record<
  Lang,
  {
    privacy: string;
    legal: string;
    enNotice: string;
    culture: { label: string; items: [string, string][] };
    nf: { title: string; body: string };
  }
> = {
  'zh-cn': {
    privacy: '隐私政策',
    legal: '法律声明',
    enNotice: '',
    culture: {
      label: '企业文化',
      items: [
        ['使命', '连接优质矿产资源与产业需求，创造长期价值。'],
        ['愿景', '成为值得信赖的矿业投资与合作伙伴。'],
        ['价值观', '稳健、合规、长期。'],
      ],
    },
    nf: { title: '页面不存在', body: '您访问的页面可能已被移动或删除。' },
  },
  'zh-hk': {
    privacy: '私隱政策',
    legal: '法律聲明',
    enNotice: '',
    culture: {
      label: '企業文化',
      items: [
        ['使命', '連接優質礦產資源與產業需求，創造長期價值。'],
        ['願景', '成為值得信賴的礦業投資與合作夥伴。'],
        ['價值觀', '穩健、合規、長期。'],
      ],
    },
    nf: { title: '頁面不存在', body: '您瀏覽的頁面可能已被移動或刪除。' },
  },
  en: {
    privacy: 'Privacy Policy',
    legal: 'Legal Notice',
    enNotice: '',
    culture: {
      label: 'Culture',
      items: [
        ['Mission', 'To connect quality mineral resources with industry and create long-term value.'],
        ['Vision', 'To be a trusted partner in mining investment and cooperation.'],
        ['Values', 'Prudence, compliance, long-term thinking.'],
      ],
    },
    nf: { title: 'Page not found', body: 'The page you are looking for may have been moved or removed.' },
  },
  ja: {
    privacy: 'プライバシーポリシー',
    legal: '法的事項',
    enNotice: '本ページは英語でのみ提供しています。',
    culture: {
      label: '企業文化',
      items: [
        ['ミッション', '優良な鉱物資源と産業のニーズをつなぎ、長期的な価値を創造する。'],
        ['ビジョン', '鉱業投資と協業において、信頼されるパートナーとなる。'],
        ['バリュー', '堅実、法令遵守、長期志向。'],
      ],
    },
    nf: { title: 'ページが見つかりません', body: 'お探しのページは移動または削除された可能性があります。' },
  },
  ko: {
    privacy: '개인정보 처리방침',
    legal: '법적 고지',
    enNotice: '이 페이지는 영어로만 제공됩니다.',
    culture: {
      label: '기업 문화',
      items: [
        ['미션', '우량 광물 자원과 산업의 수요를 연결하여 장기적인 가치를 창출합니다.'],
        ['비전', '광업 투자와 협력에서 신뢰받는 파트너가 됩니다.'],
        ['가치', '안정, 준법, 장기적 관점.'],
      ],
    },
    nf: { title: '페이지를 찾을 수 없습니다', body: '찾으시는 페이지가 이동되었거나 삭제되었을 수 있습니다.' },
  },
  fr: {
    privacy: 'Politique de confidentialité',
    legal: 'Mentions légales',
    enNotice: 'Cette page est disponible uniquement en anglais.',
    culture: {
      label: 'Culture',
      items: [
        ['Mission', 'Relier des ressources minérales de qualité aux besoins de l’industrie et créer de la valeur à long terme.'],
        ['Vision', 'Être un partenaire de confiance en matière d’investissement et de coopération minière.'],
        ['Valeurs', 'Prudence, conformité, vision de long terme.'],
      ],
    },
    nf: { title: 'Page introuvable', body: 'La page que vous recherchez a peut-être été déplacée ou supprimée.' },
  },
  es: {
    privacy: 'Política de privacidad',
    legal: 'Aviso legal',
    enNotice: 'Esta página está disponible únicamente en inglés.',
    culture: {
      label: 'Cultura',
      items: [
        ['Misión', 'Conectar recursos minerales de calidad con las necesidades de la industria y crear valor a largo plazo.'],
        ['Visión', 'Ser un socio de confianza en inversión y cooperación minera.'],
        ['Valores', 'Prudencia, cumplimiento, visión de largo plazo.'],
      ],
    },
    nf: { title: 'Página no encontrada', body: 'Es posible que la página que busca se haya movido o eliminado.' },
  },
};

export const docs: Record<DocLang, Record<LegalKind, LegalDoc>> = {
  'zh-cn': {
    privacy: {
      intro: '浙商矿业集团有限公司（下称“我们”）重视您的隐私。本政策说明您访问本网站或与我们联系时，我们如何处理您的个人信息。',
      sections: [
        {
          h: '我们收集的信息',
          p: [
            '本网站无需注册即可浏览，我们不会要求您提供个人信息。',
            '当您通过电子邮件、电话或网站留言功能与我们联系时，我们会收到您主动提供的信息，例如姓名、公司名称、电子邮箱及留言内容。网站的留言功能会在您的设备上打开邮件程序，由您自行确认并发送，网站本身不会保存表单内容。',
          ],
        },
        { h: '信息的使用', p: ['我们仅将您提供的信息用于回复您的咨询、与您进行业务沟通，以及履行法律法规规定的义务。'] },
        { h: '信息的共享', p: ['我们不会出售或出租您的个人信息。除法律法规要求或为回应您的请求所必需外，我们不会向第三方提供您的个人信息。'] },
        {
          h: 'Cookie 与访问记录',
          p: [
            '本网站目前不使用 Cookie，也未接入第三方统计或广告服务。',
            '为保障网站安全与正常运行，承载本网站的服务器可能会记录基本的访问日志，例如 IP 地址、访问时间和浏览器类型。',
          ],
        },
        { h: '信息的保存', p: ['我们仅在实现上述目的所需的期限内保存您的信息，法律法规另有规定的除外。'] },
        { h: '您的权利', p: ['您可以联系我们，要求查阅、更正或删除我们持有的您的个人信息。我们会在合理期限内予以处理。'] },
        { h: '外部链接', p: ['本网站包含指向第三方地图服务的链接。第三方网站的隐私做法不受本政策约束，请您自行查阅其相关政策。'] },
        { h: '政策更新', p: ['我们可能不时更新本政策，更新后的内容将在本页面发布。'] },
        { h: '联系我们', p: [`如对本政策有任何疑问，请发送邮件至 ${MAIL}。`] },
      ],
    },
    legal: {
      intro: '访问和使用本网站，即表示您已阅读并同意以下条款。',
      sections: [
        { h: '网站内容', p: ['本网站所载内容仅供一般参考，旨在介绍浙商矿业集团有限公司的基本情况。我们力求信息准确，但不对其完整性、准确性或时效性作出任何明示或默示的保证。'] },
        { h: '不构成要约或建议', p: ['本网站的任何内容均不构成证券或其他金融产品的要约、要约邀请，亦不构成投资、法律、税务或其他专业建议。您应在作出任何决定前自行寻求独立的专业意见。'] },
        { h: '知识产权', p: ['除另有说明外，本网站的文字、图形、标识、界面设计及其他内容的知识产权归浙商矿业集团有限公司或相关权利人所有。未经书面许可，不得复制、转载或用于商业用途。'] },
        { h: '责任限制', p: ['在法律允许的最大范围内，对于因访问或使用本网站，或因依赖本网站内容而产生的任何直接或间接损失，我们不承担责任。'] },
        { h: '外部链接', p: ['本网站可能包含第三方网站的链接，仅为方便访问而提供。我们不对第三方网站的内容或可用性负责。'] },
        { h: '语言版本', p: ['本网站提供多种语言版本。各版本内容如有不一致，以简体中文版本为准。'] },
        { h: '条款更新', p: ['我们可能不时修订本声明，修订后的内容将在本页面发布。'] },
      ],
    },
  },

  'zh-hk': {
    privacy: {
      intro: '浙商礦業集團有限公司（下稱「我們」）重視您的私隱。本政策說明您瀏覽本網站或與我們聯絡時，我們如何處理您的個人資料。',
      sections: [
        {
          h: '我們收集的資料',
          p: [
            '本網站無需註冊即可瀏覽，我們不會要求您提供個人資料。',
            '當您透過電郵、電話或網站留言功能與我們聯絡時，我們會收到您主動提供的資料，例如姓名、公司名稱、電郵地址及留言內容。網站的留言功能會在您的裝置上開啟電郵程式，由您自行確認並發送，網站本身不會儲存表格內容。',
          ],
        },
        { h: '資料的使用', p: ['我們僅將您提供的資料用於回覆您的查詢、與您進行業務溝通，以及履行法律法規規定的責任。'] },
        { h: '資料的分享', p: ['我們不會出售或出租您的個人資料。除法律法規要求或為回應您的請求所必需外，我們不會向第三方提供您的個人資料。'] },
        {
          h: 'Cookie 與瀏覽記錄',
          p: [
            '本網站目前不使用 Cookie，亦未接入第三方統計或廣告服務。',
            '為保障網站安全與正常運作，承載本網站的伺服器可能會記錄基本的瀏覽日誌，例如 IP 位址、瀏覽時間和瀏覽器類型。',
          ],
        },
        { h: '資料的保存', p: ['我們僅在達成上述目的所需的期限內保存您的資料，法律法規另有規定者除外。'] },
        { h: '您的權利', p: ['您可以聯絡我們，要求查閱、更正或刪除我們持有的您的個人資料。我們會在合理期限內處理。'] },
        { h: '外部連結', p: ['本網站包含指向第三方地圖服務的連結。第三方網站的私隱做法不受本政策約束，請您自行查閱其相關政策。'] },
        { h: '政策更新', p: ['我們可能不時更新本政策，更新後的內容將在本頁面發佈。'] },
        { h: '聯絡我們', p: [`如對本政策有任何疑問，請電郵至 ${MAIL}。`] },
      ],
    },
    legal: {
      intro: '瀏覽和使用本網站，即表示您已閱讀並同意以下條款。',
      sections: [
        { h: '網站內容', p: ['本網站所載內容僅供一般參考，旨在介紹浙商礦業集團有限公司的基本情況。我們力求資料準確，但不對其完整性、準確性或時效性作出任何明示或默示的保證。'] },
        { h: '不構成要約或建議', p: ['本網站的任何內容均不構成證券或其他金融產品的要約、要約邀請，亦不構成投資、法律、稅務或其他專業建議。您應在作出任何決定前自行尋求獨立的專業意見。'] },
        { h: '知識產權', p: ['除另有說明外，本網站的文字、圖形、標誌、介面設計及其他內容的知識產權歸浙商礦業集團有限公司或相關權利人所有。未經書面許可，不得複製、轉載或用於商業用途。'] },
        { h: '責任限制', p: ['在法律允許的最大範圍內，對於因瀏覽或使用本網站，或因依賴本網站內容而產生的任何直接或間接損失，我們概不負責。'] },
        { h: '外部連結', p: ['本網站可能包含第三方網站的連結，僅為方便瀏覽而提供。我們不對第三方網站的內容或可用性負責。'] },
        { h: '語言版本', p: ['本網站提供多種語言版本。各版本內容如有不一致，以簡體中文版本為準。'] },
        { h: '條款更新', p: ['我們可能不時修訂本聲明，修訂後的內容將在本頁面發佈。'] },
      ],
    },
  },

  en: {
    privacy: {
      intro: 'Zheshang Mining Group Limited (“we”) respects your privacy. This policy explains how we handle your personal information when you visit this website or contact us.',
      sections: [
        {
          h: 'Information we collect',
          p: [
            'You can browse this website without registering, and we do not ask you to provide personal information.',
            'When you contact us by email, by telephone or through the message form on this website, we receive the information you choose to provide, such as your name, company, email address and message. The message form opens the email application on your own device, where you confirm and send the message; the website itself does not store what you enter.',
          ],
        },
        { h: 'How we use information', p: ['We use the information you provide only to respond to your enquiry, to communicate with you about business matters, and to meet our legal obligations.'] },
        { h: 'Sharing of information', p: ['We do not sell or rent your personal information. We do not provide it to third parties unless required by law or necessary to respond to your request.'] },
        {
          h: 'Cookies and access records',
          p: [
            'This website does not currently use cookies and is not connected to third-party analytics or advertising services.',
            'To keep the website secure and running, the server that hosts it may record basic access logs, such as IP address, time of access and browser type.',
          ],
        },
        { h: 'Retention', p: ['We keep your information only for as long as needed for the purposes above, unless the law requires otherwise.'] },
        { h: 'Your rights', p: ['You may contact us to request access to, correction of or deletion of the personal information we hold about you. We will respond within a reasonable time.'] },
        { h: 'External links', p: ['This website contains links to third-party map services. Their privacy practices are not covered by this policy; please refer to their own policies.'] },
        { h: 'Changes to this policy', p: ['We may update this policy from time to time. The updated version will be published on this page.'] },
        { h: 'Contact', p: [`If you have any questions about this policy, please email ${MAIL}.`] },
      ],
    },
    legal: {
      intro: 'By accessing and using this website, you confirm that you have read and agree to the following terms.',
      sections: [
        { h: 'Website content', p: ['The content of this website is for general information only and is intended to introduce Zheshang Mining Group Limited. We aim to keep the information accurate, but give no express or implied warranty as to its completeness, accuracy or timeliness.'] },
        { h: 'No offer or advice', p: ['Nothing on this website constitutes an offer or invitation to buy or sell securities or other financial products, nor investment, legal, tax or other professional advice. You should seek independent professional advice before making any decision.'] },
        { h: 'Intellectual property', p: ['Unless otherwise stated, the intellectual property rights in the text, graphics, marks, interface design and other content of this website belong to Zheshang Mining Group Limited or the relevant rights holders. No part may be reproduced, republished or used commercially without written permission.'] },
        { h: 'Limitation of liability', p: ['To the fullest extent permitted by law, we accept no liability for any direct or indirect loss arising from access to or use of this website, or from reliance on its content.'] },
        { h: 'External links', p: ['This website may contain links to third-party websites, provided for convenience only. We are not responsible for the content or availability of those websites.'] },
        { h: 'Language versions', p: ['This website is available in several languages. If there is any inconsistency between versions, the Simplified Chinese version prevails.'] },
        { h: 'Changes to this notice', p: ['We may revise this notice from time to time. The revised version will be published on this page.'] },
      ],
    },
  },
};
