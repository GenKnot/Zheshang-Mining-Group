import type { Lang } from './content';

// 联系页上"项目覆盖地区"相关的文案
export const coverage: Record<Lang, { site: string; label: string; hint: string }> = {
  'zh-cn': { site: '项目所在地', label: '项目覆盖地区', hint: '以下为项目所在地区，非办公地点。点击查看该地区的项目。' },
  'zh-hk': { site: '項目所在地', label: '項目覆蓋地區', hint: '以下為項目所在地區，並非辦公地點。點擊查看該地區的項目。' },
  en: { site: 'Project site', label: 'Project coverage', hint: 'Regions where our projects are located, not office locations. Select one to view its projects.' },
  ja: { site: 'プロジェクト所在地', label: 'プロジェクト対象地域', hint: 'プロジェクトの所在地域であり、事業所ではありません。選択すると該当地域のプロジェクトを表示します。' },
  ko: { site: '프로젝트 소재지', label: '프로젝트 지역', hint: '프로젝트가 위치한 지역이며 사무소 소재지가 아닙니다. 선택하면 해당 지역의 프로젝트를 볼 수 있습니다.' },
  fr: { site: 'Site de projet', label: 'Zones de projets', hint: 'Régions où se situent nos projets, et non des bureaux. Sélectionnez-en une pour voir ses projets.' },
  es: { site: 'Sitio de proyecto', label: 'Zonas de proyectos', hint: 'Regiones donde se ubican nuestros proyectos, no oficinas. Seleccione una para ver sus proyectos.' },
};
