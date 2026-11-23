'use client'
/* eslint-disable @next/next/no-img-element -- static marketing assets, no optimisation needed */

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import s from './landing.module.css'
import { ASSET_ROWS, CHAIN_ROWS, FEATURE_PILLS, FOOTER_NAV, HERO_SLIDES, IMG, LINKS, PAIRS, PROVIDERS, VIDEO, chainIcon, token } from './landing-data'

const CANVAS_W = 1728
const CANVAS_H = 1117
const CYCLE_MS = 2600
const HERO_VIDEO_PAUSE_MS = 5000
const MOBILE_BP = 768

/* ---------- small building blocks ---------- */

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

/** Heading whose words slide in one by one when it scrolls into view. */
function Words({ text, className }: { text: string; className?: string }) {
  return (
    <h2 className={className} data-words="">
      {text.split(' ').map((w, i) => (
        <span key={i}>
          <span className={s.word} style={{ '--i': i } as CSSProperties}>
            {w}
          </span>
          {i < text.split(' ').length - 1 ? ' ' : ''}
        </span>
      ))}
    </h2>
  )
}

const reveal = (delay = 0): { className: string; style: CSSProperties } => ({
  className: s.reveal,
  style: { '--d': `${delay}ms` } as CSSProperties
})

// `media` on <source> keeps the browser from downloading the variant that CSS hides
// (desktop and mobile each have their own <video> for the same clip).
const DESKTOP_MQ = `(min-width: ${MOBILE_BP}px)`
const MOBILE_MQ = `(max-width: ${MOBILE_BP - 1}px)`

function Video({
  src,
  className,
  loop = true,
  preload,
  mobile
}: {
  src: { webm: string; mp4: string }
  className?: string
  loop?: boolean
  preload?: 'auto' | 'metadata' | 'none'
  mobile?: boolean
}) {
  const media = mobile ? MOBILE_MQ : DESKTOP_MQ
  return (
    <video className={className} muted autoPlay playsInline loop={loop} preload={preload} data-video="">
      <source src={src.webm} type="video/webm" media={media} />
      <source src={src.mp4} type="video/mp4" media={media} />
    </video>
  )
}

const Chevron = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }} aria-hidden>
    <path d="M6 9l6 6 6-6" stroke="#A1A1A1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const ArrowDown = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={s.bob} aria-hidden>
    <path d="M12 4v16M5 13l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

/** Static swap-form mockup that cycles through the hero slides. */
function SwapDemo({ slide, mobile }: { slide: number; mobile?: boolean }) {
  const { sell, buy } = HERO_SLIDES[slide]
  const val = (text: string, d: number) => (
    <span key={`${slide}-${text}`} className={s.val} style={{ '--d': `${d}ms` } as CSSProperties}>
      {text}
    </span>
  )
  const asset = (a: typeof sell) => (
    <div className={s.asset}>
      <img key={slide} src={a.icon} alt="" width={32} height={32} />
      <div className={s.assetText}>
        {val(a.ticker, 0)}
        {val(a.name, 60)}
      </div>
      <Chevron size={mobile ? 18 : 20} />
    </div>
  )
  return (
    <div className={cx(s.form, mobile && s.mForm)}>
      <div className={s.formBoxes}>
        <div className={s.box}>
          <div className={s.boxHead}>
            <span>Sell</span>
          </div>
          <div className={s.boxRow}>
            <div className={s.amount}>
              {val(sell.amount, 40)}
              {val(sell.fiat, 100)}
            </div>
            {asset(sell)}
          </div>
          <div className={s.quick}>
            <span>Clear</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        <div className={s.flip}>
          <span aria-hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 16l4 4 4-4M7 20V4M21 8l-4-4-4 4M17 4v16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        <div className={s.box}>
          <div className={s.boxHead}>
            <span>Buy</span>
            <span className={s.timer} aria-hidden>
              <svg width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" stroke="#232323" />
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  fill="none"
                  strokeWidth="2"
                  stroke="#FFB700"
                  strokeDasharray="62.8"
                  strokeDashoffset="34.5"
                  strokeLinecap="round"
                />
              </svg>
              <span>45</span>
            </span>
          </div>
          <div className={s.boxRow}>
            <div className={s.amount}>
              {val(buy.amount, 40)}
              {val(buy.fiat, 100)}
            </div>
            {asset(buy)}
          </div>
        </div>
      </div>
      <a href={LINKS.app} className={s.launch}>
        Launch App
      </a>
    </div>
  )
}

const StoreLink = ({ href, icon, children }: { href: string; icon: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={s.storeBtn}>
    <span>
      <img src={icon} alt="" />
    </span>
    {children}
  </a>
)

const Social = () => (
  <div className={s.social}>
    <a href={LINKS.x} target="_blank" rel="noopener noreferrer" aria-label="X">
      <img src={IMG.x} alt="" />
    </a>
    <a href={LINKS.telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram">
      <img src={IMG.telegram} alt="" />
    </a>
    <a href={LINKS.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
      <img src={IMG.github} alt="" />
    </a>
  </div>
)

const FooterNav = ({ mobile }: { mobile?: boolean }) => (
  <div className={s.footerNav}>
    {FOOTER_NAV.map(l => (
      <a
        key={l.label}
        href={mobile && l.href.startsWith('#') ? `#m-${l.href.slice(1)}` : l.href}
        target={l.external ? '_blank' : undefined}
        rel={l.external ? 'noopener noreferrer' : undefined}
      >
        {l.label}
      </a>
    ))}
  </div>
)

const year = new Date().getFullYear()

/* ---------- page ---------- */

export function Landing() {
  const root = useRef<HTMLDivElement>(null)
  const [slide, setSlide] = useState(0)
  const [navLight, setNavLight] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [ready, setReady] = useState(false)

  // Hero word / demo pair cycle
  useEffect(() => {
    const id = setInterval(() => setSlide(i => (i + 1) % HERO_SLIDES.length), CYCLE_MS)
    return () => clearInterval(id)
  }, [])

  // Desktop: scale the 1728×1117 canvases to the viewport and re-position hero pieces.
  useEffect(() => {
    const sc = root.current
    if (!sc) return

    const fit = () => {
      const w = sc.clientWidth
      if (w < MOBILE_BP) return
      const h = sc.clientHeight
      const scale = Math.min(1, w / CANVAS_W, h / CANVAS_H)
      const dx = Math.max(0, (w - CANVAS_W * scale) / 2)
      const inv = 1 / scale

      // Hero: keep title + form readable at any scale, vertically centred as a group.
      const headH = 86,
        gap = 32,
        navH = 64,
        topMin = navH + 24,
        bottomMin = 72,
        formH = 620
      const availH = h - topMin - bottomMin - headH - gap
      const fInv = Math.max(Math.min(inv, availH / formH / scale), 0.5 / scale)
      const formRealH = formH * scale * fInv
      const groupTop = Math.max(topMin, navH + (h - navH - (headH + gap + formRealH)) / 2)
      const head = sc.querySelector<HTMLElement>('[data-hero-title]')
      if (head) {
        head.style.top = `${Math.round(groupTop / scale)}px`
        head.style.transform = `scale(${inv})`
      }
      const formTop = groupTop + headH + gap
      const formBottom = formTop + formRealH
      sc.querySelectorAll<HTMLElement>('[data-hero-form]').forEach(el => {
        el.style.top = `${Math.round(formTop / scale)}px`
        el.style.transform = `scale(${fInv})`
      })
      sc.querySelectorAll<HTMLElement>('[data-hero-hint]').forEach(el => {
        const mid = Math.min(Math.max((formBottom + h) / 2 - 20, formBottom + 16), h - 72)
        el.style.top = `${Math.round(mid / scale)}px`
        el.style.transform = `scale(${inv})`
      })
      sc.querySelectorAll<HTMLElement>('[data-canvas]').forEach(c => {
        c.style.transform = `translateX(${dx}px) scale(${scale})`
        c.style.height = `${Math.round(h / scale)}px`
        if (c.parentElement) c.parentElement.style.height = `${h}px`
      })
    }

    fit()
    setReady(true)
    const ro = new ResizeObserver(fit)
    ro.observe(sc)
    return () => ro.disconnect()
  }, [])

  // Scroll-driven bits: reveals, heading words, chain parallax, nav colour.
  useEffect(() => {
    const sc = root.current
    if (!sc) return

    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          ;(e.target as HTMLElement).dataset.in = 'true'
          io.unobserve(e.target)
        }
      },
      { root: sc, threshold: 0.12 }
    )
    sc.querySelectorAll(`.${s.reveal}, [data-words]`).forEach(el => io.observe(el))

    const onScroll = () => {
      const vh = sc.clientHeight
      sc.querySelectorAll<HTMLElement>('[data-plx]').forEach(el => {
        const host = el.closest<HTMLElement>('[data-plx-host]')
        if (!host || host.offsetParent === null) return
        const r = host.getBoundingClientRect()
        const progress = (r.top + r.height / 2 - vh / 2) / vh
        el.style.transform = `translateX(${(progress * parseFloat(el.dataset.plx || '0')).toFixed(1)}px)`
      })
      let light = false
      sc.querySelectorAll<HTMLElement>('[data-tone]').forEach(el => {
        if (el.offsetParent === null) return
        if (el.getBoundingClientRect().top <= 90) light = el.dataset.tone === 'light'
      })
      setNavLight(light)
    }
    onScroll()
    sc.addEventListener('scroll', onScroll, { passive: true })

    // Videos: force muted autoplay; the hero clip pauses on its last frame, then restarts.
    const timers: number[] = []
    sc.querySelectorAll<HTMLVideoElement>('video[data-video]').forEach(v => {
      v.muted = true
      v.defaultMuted = true
      if (!v.loop) {
        v.addEventListener('ended', () => {
          timers.push(
            window.setTimeout(() => {
              v.currentTime = 0
              v.play().catch(() => {})
            }, HERO_VIDEO_PAUSE_MS)
          )
        })
      }
      if (v.paused) v.play().catch(() => {})
    })

    return () => {
      io.disconnect()
      sc.removeEventListener('scroll', onScroll)
      timers.forEach(clearTimeout)
    }
  }, [])

  const heroWord = (
    <span key={slide} className={s.heroWord}>
      {HERO_SLIDES[slide].word}
    </span>
  )

  const chainBands = (mobile: boolean) =>
    CHAIN_ROWS.map((row, i) => {
      const dir = i % 2 === 0 ? 1 : -1
      const px = (mobile ? 440 : 640) * dir
      const bottom = mobile ? undefined : [480, 300, 120][i]
      return (
        <div key={i} className={mobile ? s.mChainBand : s.chainBand} style={{ bottom }}>
          <div className={s.chainTrack} data-plx={px}>
            {row.map(c => (
              <img key={c.id} src={chainIcon(c.id)} alt={c.name} />
            ))}
            {i === CHAIN_ROWS.length - 1 && <span className={s.more}>and more</span>}
          </div>
        </div>
      )
    })

  return (
    <div ref={root} className={s.root} data-ready={ready}>
      {/* progressive blur behind the nav */}
      <div className={s.navBlur} aria-hidden>
        <div />
        <div />
        <div />
        <div />
      </div>

      <nav className={s.nav} data-light={navLight}>
        <div className={s.navInner}>
          <a href="#home" className={s.brand}>
            <img src={IMG.logo} alt="" />
            <span>
              Unstoppable&nbsp;&nbsp;<b>Swap</b>
            </span>
          </a>
          <button className={s.burger} aria-label="Menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(o => !o)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              {menuOpen ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <div className={s.navPills}>
            <a href={LINKS.app} className={cx(s.pill, s.cta)}>
              Launch App
            </a>
          </div>
        </div>
      </nav>
      {menuOpen && (
        <div className={s.menu} onClick={() => setMenuOpen(false)}>
          <a href="#m-dex">Assets</a>
          <a href="#m-best">Best price</a>
          <a href="#m-pairs">Popular pairs</a>
          <a href="#m-chains">Chains</a>
          <a href="#m-ways">Other ways</a>
          <a href={LINKS.app} className={cx(s.pill, s.cta)}>
            Launch App
          </a>
        </div>
      )}

      {/* ======================= DESKTOP ======================= */}
      <div className={s.desktop}>
        <section id="home" className={s.section} data-tone="dark">
          <Video src={VIDEO.hero} className={s.heroVideo} loop={false} preload="auto" />
          <div className={s.canvas} data-canvas="">
            <h1 className={s.heroTitle} data-hero-title="">
              {heroWord}
            </h1>
            <div className={s.heroForm} data-hero-form="">
              <div {...reveal(0)}>
                <SwapDemo slide={slide} />
              </div>
            </div>
            <a href="#dex" className={s.scrollHint} data-hero-hint="">
              <span>Scroll Down</span>
              <ArrowDown />
            </a>
          </div>
        </section>

        <section id="dex" className={s.section} data-tone="light">
          <div className={s.canvas} data-canvas="">
            <div className={s.dexWhite} />
            <Words text="Get it on our DEX" className={s.h2} />
            <div className={s.dexRows}>
              {ASSET_ROWS.map((row, r) => (
                <div key={row.title} className={s.dexRow}>
                  <h3 {...reveal(r * 120)}>{row.title}</h3>
                  <div className={s.dexIcons}>
                    {row.items.map((t, i) => (
                      <a key={t.id} href={t.href} className={cx(s.tile, s.reveal)} style={{ '--d': `${r * 120 + (i + 1) * 100}ms` } as CSSProperties}>
                        <img src={token(t.id)} alt={t.alt} data-round={t.round} />
                        <span className={s.over}>Swap Now</span>
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="best" className={s.section} data-tone="dark">
          <div className={s.canvas} data-canvas="">
            <Words text="Always the best price" className={s.h2} />
            <div className={cx(s.bestText, s.reveal)}>
              <p className={s.lead}>
                We aggregate quotes from the biggest liquidity providers and route every swap through the one with the best rate.
              </p>
              <div className={s.chips}>
                {PROVIDERS.map(p => (
                  <span key={p} className={s.chip}>
                    {p}
                  </span>
                ))}
                <span className={s.chip} data-dim="true">
                  + 20 more
                </span>
              </div>
            </div>
            <div className={cx(s.bestVideo, s.reveal)} style={{ '--d': '140ms' } as CSSProperties}>
              <Video src={VIDEO.best} />
            </div>
          </div>
        </section>

        <section id="pairs" className={s.section} data-tone="light">
          <div className={s.canvas} data-canvas="">
            <Words text="Popular Pairs" className={s.h2} />
            <div className={s.pairs}>
              {PAIRS.map((p, i) => (
                <a key={p.title} href={p.href} className={cx(s.pair, s.reveal)} data-dark={p.dark} style={{ '--d': `${i * 120}ms` } as CSSProperties}>
                  <div className={s.pairTop}>
                    <span className={s.pairTitle}>{p.title}</span>
                    <div className={s.tags}>
                      {p.chains.map(c => (
                        <span key={c} className={s.tag}>
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className={s.pairIcons}>
                      {p.icons.map(t => (
                        <img key={t.id} src={token(t.id)} alt={t.alt} data-round={t.round} />
                      ))}
                    </div>
                  </div>
                  <div className={s.pairMeta}>
                    <div>
                      <span>30d volume:</span>
                      <span>{p.volume}</span>
                    </div>
                  </div>
                  <span className={s.over}>Swap Now</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="chains" className={s.section} data-tone="light" data-plx-host="">
          <div className={s.canvas} data-canvas="">
            <Words text="25+ Chains" className={s.h2} />
            <p className={cx(s.lead, s.chainsLead, s.reveal)} style={{ '--d': '80ms' } as CSSProperties}>
              Swap natively across 25+ blockchains — one app for every network.
            </p>
            {chainBands(false)}
          </div>
        </section>

        <section id="ways" className={s.section} data-tone="dark">
          <div className={s.canvas} data-canvas="">
            <Words text="Also, there are other ways" className={s.h2} />
            <div className={cx(s.way, s.reveal)} style={{ left: 40 }}>
              <img src={IMG.walletIcon} alt="" className={s.wayIcon} />
              <span className={s.wayTitle}>Swap in Wallet App</span>
              <img src={IMG.walletScreen} alt="Wallet app swap screen" className={s.wayScreen} />
              <div className={s.wayLinks}>
                <StoreLink href={LINKS.appStore} icon={IMG.appStore}>
                  App Store
                </StoreLink>
                <StoreLink href={LINKS.googlePlay} icon={IMG.googlePlay}>
                  Google Play
                </StoreLink>
                <StoreLink href={LINKS.fdroid} icon={IMG.fdroid}>
                  F-Droid
                </StoreLink>
              </div>
            </div>
            <div className={cx(s.way, s.reveal)} style={{ left: 876, '--d': '140ms' } as CSSProperties}>
              <img src={IMG.botIcon} alt="" className={s.wayIcon} style={{ borderRadius: 41 }} />
              <span className={s.wayTitle}>Swap via chat bot</span>
              <img src={IMG.botScreen} alt="Telegram swap bot" className={s.wayScreen} />
              <div className={s.wayLinks}>
                <StoreLink href={LINKS.simplex} icon={IMG.simplex}>
                  Simplex
                </StoreLink>
                <StoreLink href={LINKS.telegramBot} icon={IMG.telegramBot}>
                  Telegram
                </StoreLink>
              </div>
            </div>
          </div>
        </section>

        <section id="footer" className={s.section} data-tone="dark">
          <div className={s.canvas} data-canvas="">
            <Video src={VIDEO.footer} className={s.footerVideo} preload="auto" />
            <div className={cx(s.pillGrid, s.reveal)}>
              {[0, 3, 6].map(start => (
                <div key={start}>
                  {FEATURE_PILLS.slice(start, start + 3).map(p => (
                    <span key={p} className={s.bigPill}>
                      {p}
                    </span>
                  ))}
                  {start === 6 && (
                    <a href={LINKS.app} className={cx(s.bigPill, s.cta)}>
                      Launch App
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className={cx(s.footerBottom, s.reveal)} style={{ '--d': '120ms' } as CSSProperties}>
              <div className={s.footerRow}>
                <div className={s.follow}>
                  <span>Follow Us:</span>
                  <Social />
                </div>
                <FooterNav />
              </div>
              <div className={s.legal}>
                <img src={IMG.hs} alt="Horizontal Systems" />
                <a href={LINKS.app}>swap.unstoppable.money</a>
                <span>© {year} HorizontalSystems</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ======================= MOBILE ======================= */}
      <div className={s.mobile}>
        <div id="m-home" className={s.mHome} data-tone="dark">
          <Video src={VIDEO.hero} className={s.heroVideo} loop={false} preload="auto" mobile />
          <h1 className={s.mTitle}>{heroWord}</h1>
          <div {...reveal(0)}>
            <SwapDemo slide={slide} mobile />
            <a href="#m-dex" className={s.mScroll}>
              <span>Scroll Down</span>
              <ArrowDown />
            </a>
          </div>
        </div>

        <div id="m-dex" className={cx(s.mSection, s.mDex)} data-tone="light">
          <div>
            <Words text="Get it on our DEX" className={s.mH2} />
          </div>
          <div className={s.mDexRows}>
            {ASSET_ROWS.map(row => (
              <div key={row.title} className={s.mDexRow}>
                <h3 {...reveal(0)}>{row.title}</h3>
                <div className={s.mAssets}>
                  {row.items.map((t, i) => (
                    <a key={t.id} href={t.href}>
                      <img
                        src={token(t.id)}
                        alt={t.alt}
                        data-round={t.round}
                        className={s.reveal}
                        style={{ '--d': `${(i + 1) * 80}ms` } as CSSProperties}
                      />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="m-best" className={s.mSection} data-tone="dark">
          <Words text="Always the best price" className={s.mH2} />
          <p className={s.mLead}>We aggregate quotes from the biggest liquidity providers and route every swap through the one with the best rate.</p>
          <div className={s.mChips}>
            {PROVIDERS.slice(0, 5).map(p => (
              <span key={p} className={s.chip}>
                {p}
              </span>
            ))}
            <span className={s.chip} data-dim="true">
              + 20 more
            </span>
          </div>
          <div className={cx(s.mBestVideo, s.reveal)}>
            <Video src={VIDEO.best} mobile />
          </div>
        </div>

        <div id="m-pairs" className={s.mSection} data-tone="light">
          <Words text="Popular Pairs" className={s.mH2} />
          <div className={s.mPairs}>
            {PAIRS.map((p, i) => (
              <a key={p.title} href={p.href} className={cx(s.mPair, s.reveal)} data-dark={p.dark} style={{ '--d': `${i * 80}ms` } as CSSProperties}>
                <span className={s.pairTitle}>{p.title}</span>
                <div className={s.mPairIcons}>
                  {p.icons.map(t => (
                    <img key={t.id} src={token(t.id)} alt={t.alt} data-round={t.round} />
                  ))}
                </div>
                <div className={s.mPairMeta}>
                  <span>30d volume:</span>
                  <span>{p.volume}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div id="m-chains" className={cx(s.mSection, s.mChains)} data-tone="light" data-plx-host="">
          <Words text="25+ Chains" className={s.mH2} />
          <p className={s.mLead}>Swap natively across 25+ blockchains — one app for every network.</p>
          {chainBands(true)}
        </div>

        <div id="m-ways" className={s.mSection} data-tone="dark">
          <Words text="Also, there are other ways" className={s.mH2} />
          <div className={s.mWays}>
            <div className={cx(s.mWay, s.reveal)}>
              <img src={IMG.walletIcon} alt="" className={s.wayIcon} />
              <h3>Swap in Wallet App</h3>
              <img src={IMG.walletScreen} alt="Wallet app swap screen" className={s.wayScreen} />
              <div className={s.wayLinks}>
                <StoreLink href={LINKS.appStore} icon={IMG.appStore}>
                  App Store
                </StoreLink>
                <StoreLink href={LINKS.googlePlay} icon={IMG.googlePlay}>
                  Google Play
                </StoreLink>
                <StoreLink href={LINKS.fdroid} icon={IMG.fdroid}>
                  F-Droid
                </StoreLink>
              </div>
            </div>
            <div className={cx(s.mWay, s.reveal)} style={{ '--d': '80ms' } as CSSProperties}>
              <img src={IMG.botIcon} alt="" className={s.wayIcon} style={{ borderRadius: '50%' }} />
              <h3>Swap via chat bot</h3>
              <img src={IMG.botScreen} alt="Telegram swap bot" className={s.wayScreen} />
              <div className={s.wayLinks}>
                <StoreLink href={LINKS.simplex} icon={IMG.simplex}>
                  Simplex
                </StoreLink>
                <StoreLink href={LINKS.telegramBot} icon={IMG.telegramBot}>
                  Telegram
                </StoreLink>
              </div>
            </div>
          </div>
        </div>

        <div id="m-footer" className={cx(s.mSection, s.mFooter)} data-tone="dark">
          <div className={s.mPills}>
            {FEATURE_PILLS.map(p => (
              <span key={p} className={s.bigPill}>
                {p}
              </span>
            ))}
            <a href={LINKS.app} className={cx(s.bigPill, s.cta)}>
              Launch App
            </a>
          </div>
          <Video src={VIDEO.footer} className={s.mFooterVideo} preload="auto" mobile />
          <div className={s.mFooterRow}>
            <FooterNav mobile />
            <div className={s.follow}>
              <span>Follow Us:</span>
              <Social />
            </div>
          </div>
          <div className={s.mLegal}>
            <img src={IMG.hs} alt="Horizontal Systems" />
            <div>
              <a href={LINKS.app}>swap.unstoppable.money</a>
              <span>© {year} HorizontalSystems</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
