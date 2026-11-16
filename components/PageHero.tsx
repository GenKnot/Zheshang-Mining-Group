import Label from './Label';

/** 内页通用的页首：左侧标签，右侧标题与导语 */
export default function PageHero({
  tag,
  title,
  lead,
  notice,
  k,
  children,
}: {
  tag: string;
  title: string;
  lead?: string;
  notice?: string;
  k: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="lpage-hero">
      <div className="sec-head">
        <div className="rise" style={{ animationDelay: '.1s' }}>
          <Label>{tag}</Label>
        </div>
        <div>
          <h1 key={k}>
            <span className="mask">
              <span style={{ animationDelay: '.15s' }}>{title}</span>
            </span>
          </h1>
          {notice && (
            <p className="notice rise" style={{ animationDelay: '.4s' }}>
              ■ {notice}
            </p>
          )}
          {lead && (
            <p className="body rise" style={{ animationDelay: '.5s' }}>
              {lead}
            </p>
          )}
          {children}
        </div>
      </div>
    </section>
  );
}
