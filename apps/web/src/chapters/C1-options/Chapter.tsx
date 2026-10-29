import "./c1.css";
import "./figures/figures.css";
import { M } from "../../ui/Math";
import { F0Chain } from "./figures/F0Chain";
import { F1Choice } from "./figures/F1Choice";
import { F2Column } from "./figures/F2Column";
import { F3Legs } from "./figures/F3Legs";
import { F4Ledger } from "./figures/F4Ledger";
import { F5Rebuild } from "./figures/F5Rebuild";

export function OptionsChapter() {
  return (
    <article className="chapter c1">
      <header className="chapter-head">
        <p className="chapter-id">Chapter C1 · Options</p>
        <h1>Read the chain</h1>
        <p className="standfirst">
          This is the screen a desk looks at all day: one row per strike, calls on the left, puts on the right, forty numbers across. Nobody told these
          numbers to obey a law, and yet every row does. This page takes the screen apart one column at a time, then rebuilds half of it from the other
          half.
        </p>
        <p className="assumes">Assumes: you can read a table and you know what interest is. That is all.</p>
      </header>

      <F0Chain />

      <div className="prose">
        <p>
          Start with the column in the middle. A <strong>strike</strong> is not the price of anything on this screen; it is the price written into a
          contract — the level at which the contract lets you buy (a call) or sell (a put) the index on expiry day. The contract itself has a price, and
          that is the LTP beside it. Take the 22,600 call and see what you have actually bought.
        </p>
      </div>

      <F1Choice />

      <div className="prose">
        <p>
          A baker and a farmer shake hands on a price for next year's wheat; that handshake binds both of them, and it is called a forward. A call is
          the baker paying the farmer, today, to be the only one allowed to walk away. That payment is the 249.15 — and it is why "the index went up" is
          not enough to make money: it has to go up by more than what you paid.
        </p>
        <p>Now walk down the column and watch the price of that choice change with the strike.</p>
      </div>

      <F2Column />

      <div className="prose">
        <p>
          The call's price falls as the strike rises because less of it is "already in it". The put rises for the mirror reason. Somewhere in the middle
          the two prices cross — and the chain is quietly telling you where the index is, without ever printing it. Build that row by hand.
        </p>
      </div>

      <F3Legs />

      <div className="prose">
        <p>
          A long call and a short put at the same strike add up to a straight line: a forward, built from two bent ones. That is not a coincidence of
          this row. It is a law that every row on the screen has to obey, and you can check it with subtraction.
        </p>
      </div>

      <F4Ledger />

      <div className="prose">
        <p>
          Seventeen rows, traded at different seconds, all landing within a dozen points of one number. Two bundles that pay the same whatever happens
          must cost the same — otherwise someone buys the cheap one, sells the dear one, and collects the difference for free. If the law really holds,
          you should be able to throw away half the screen and rebuild it.
        </p>
      </div>

      <F5Rebuild />

      <div className="prose">
        <h2>So what is an option?</h2>
        <p>
          A contract that gives one side a choice and the other an obligation, paid for up front. What it pays at the end is a bent line, and bent lines
          add — so a call and a put at the same strike add to a straight line, and their prices are chained together: call minus put equals index minus
          strike, up to interest. That is why half the screen can be rebuilt from the other half, to within the bid–ask and a few seconds of timing.
        </p>
        <M block tex="c - p = S - K\,e^{-rT}" />
        <p>
          It holds exactly only for options you can use on expiry day alone — which NIFTY's are. American options, usable any day, obey an inequality
          instead; that and the dividend term are in the panel below.
        </p>
        <details className="c1-more">
          <summary>The textbook's version: floors, ceilings, early exercise, dividends</summary>
          <p>
            A call can never be worth less than the index minus the discounted strike (Hull's example: S = 20, K = 18, r = 10 %, one year → at least
            3.71; a call offered at 3 is 0.79 or 1.79 of free money depending on where the index ends). A put can never be worth less than the discounted
            strike minus the index (S = 37, K = 40, r = 5 %, six months → at least 2.01). Neither can be worth more than the thing it is a right on. With
            parity broken (S = 31, K = 30, c = 3, p = 2.25) the lock is 1.02 whatever happens. An American call on a stock without dividends is never
            worth exercising early — you would throw away the choice and pay the strike sooner than you had to; an American put sometimes is, and chapter
            C2's American toggle shows when. Dividends shift the index term by the dividends you miss.
          </p>
        </details>
        <h2>Where it is used</h2>
        <p>
          Every options desk reads this screen; a market maker's first check on a quote is the row's parity, and a broken row is a trade before it is a
          thought. The same "two bundles, same payoff, same price" idea is how every structured product (chapter H2) is priced — as a shelf of these
          legs — and how chapter C2 finds where 249.15 comes from without anyone having an opinion about where the index is going.
        </p>
        <p className="c1-last">
          The screen is forty numbers and one law. Read the law first; the numbers are what it leaves you free to argue about.
        </p>
        <div className="c1-pull">
          <strong>The next thing to find.</strong> The chain says the 22,600 call is worth 249.15. Where does that number come from — and why does the
          answer need no opinion about where the index is going? <a href="#/C2">C2 · Pick any probability →</a>
        </div>
        <details className="prose c1-more">
          <summary>What computes the figures on this page</summary>
          <pre className="num c1-code">
            {`payoff(call) = max(S_T − K, 0);  payoff(put) = max(K − S_T, 0);  legs add pointwise
parity per row: C − P + K ≈ F (the index delivered on expiry);  F = median over rows
predicted put = C − (F − K);  conversion ledger = buy put, sell call, buy forward at F
bounds: c ≥ S − K e^{−rT}, p ≥ K e^{−rT} − S, c ≤ S, p ≤ K e^{−rT}
// chain numbers transcribed from the NSE screenshot; all tested in tests/answer-key/key_C1C2.py`}
          </pre>
        </details>
      </div>
    </article>
  );
}
