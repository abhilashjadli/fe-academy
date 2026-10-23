import { SYLLABUS } from "./syllabus";

export function Index() {
  return (
    <main className="index">
      <h1>A library of explorable chapters on financial engineering</h1>
      <p className="standfirst">
        Open any chapter in any order. Each one is self-contained and built around the illustration that fits its idea best — something to move,
        step through, break, or watch.
      </p>
      <div className="tracks">
        {SYLLABUS.map((t) => (
          <section className="track" key={t.id}>
            <h2>{t.title}</h2>
            <ol>
              {t.chapters.map((c) => (
                <li key={c.id} className={c.built ? "" : "soon"}>
                  <span className="id">{c.id}</span>
                  {c.built ? <a href={"#/" + c.id}>{c.title}</a> : <span>{c.title}</span>}
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
      <p className="footnote">
        <a href="#/lab">Style lab</a> — new kinds of figure, one real beat each, for review before they go into chapters.
      </p>
    </main>
  );
}
