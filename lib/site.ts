import type { Lang } from './content';
import projectData from './data/projects.json';
import siteData from './data/site.json';

// 文案源文件是 lib/data/*.src.json；改完简体后运行 scripts/hant.py 生成带繁体的 *.json

export type Ui = {
  brand: string;
  brandSub: string;
  legalName: string;
  metaTitle: string;
  metaDesc: string;
  nav: { about: string; business: string; projects: string; summit: string; contact: string };
};
export type Home = {
  heroEyebrow: string;
  heroTitle: string[];
  heroSub: string;
  cta1: string;
  cta2: string;
  aboutTitle: string;
  aboutBody: string;
  aboutMore: string;
  bizLabel: string;
  biz: { t: string; d: string }[];
  projLabel: string;
  projTitle: string;
  projIntro: string;
  projAll: string;
  regLabel: string;
  regTitle: string;
  regions: string[][];
  sumLabel: string;
  sumTitle: string;
  sumBody: string;
  sumMore: string;
};
export type ProjText = {
  title: string;
  intro: string;
  all: string;
  facts: string;
  highlights: string;
  gallery: string;
  videos: string;
  list: string;
  region: string;
  mineral: string;
  area: string;
  stage: string;
  coop: string;
  view: string;
  back: string;
  inquire: string;
  inquireBody: string;
  enNotice: string;
};
export type Summit = {
  title: string;
  lead: string;
  status: string;
  formatsLabel: string;
  formats: string[][];
  whoLabel: string;
  who: string[];
  cta: string;
  goalsLabel: string;
  goalsTitle: string;
  goals: string[];
  fieldsLabel: string;
  fieldsTitle: string;
  fields: string[];
};
export type About = {
  title: string;
  lead: string;
  sections: { h: string; p: string[] }[];
  deptLabel: string;
  depts: string[][];
  ceoLabel: string;
  ceoName: string;
  ceoTitle: string;
  ceoBio: string[];
};

export const ui = siteData.ui as Record<Lang, Ui>;
export const home = siteData.home as Record<Lang, Home>;
export const projText = siteData.proj as Record<Lang, ProjText>;
export const summit = siteData.summit as Record<Lang, Summit>;
export const about = siteData.about as Record<Lang, About>;

/** 项目详情只有简体、繁体、英文三个版本，其余语言显示英文 */
export type PLang = 'zh-cn' | 'zh-hk' | 'en';
export const projLang = (l: Lang): PLang => (l === 'zh-cn' || l === 'zh-hk' ? l : 'en');

export type ProjectBody = {
  name: string;
  country: string;
  mineral: string;
  area: string;
  stage: string;
  coop: string;
  summary: string;
  facts: string[][];
  highlights: string[];
  table?: { head: string[]; rows: string[][] };
  sections: { h: string; p: string[] }[];
};
export type Project = {
  slug: string;
  region: string;
  symbols: string[];
  images: number;
  /** 现场视频的数量（没有就不写）。文件为 v01.mp4、v02.mp4…，同名 .jpg 是封面 */
  videos?: number;
  coord: number[];
  t: Record<PLang, ProjectBody>;
};

export const projects = projectData.projects as unknown as Project[];
export const regions = projectData.regions as Record<string, Record<PLang, string>>;
export const projectBySlug = (slug: string) => projects.find((p) => p.slug === slug);
export const projectImage = (p: Project, n: number) => `/projects/${p.slug}/${String(n).padStart(2, '0')}.jpg`;
export const projectVideo = (p: Project, n: number) => `/projects/${p.slug}/v${String(n).padStart(2, '0')}`;
