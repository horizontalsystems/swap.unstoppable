import type { Metadata } from 'next'
import { Footer } from '@/components/footer/footer'
import { Header } from '@/components/header/header'
import { AppConfig } from '@/config'

export const metadata: Metadata = {
  title: `Privacy Policy | ${AppConfig.name}`,
  description: `How ${AppConfig.name} handles your data.`,
  alternates: { canonical: `${AppConfig.baseUrl}/privacy-policy` }
}

const LAST_UPDATED = 'September 25, 2026'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h2 className="text-leah text-lg font-semibold">{title}</h2>
    {children}
  </section>
)

const List = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc space-y-2 pl-5">
    {items.map((item, i) => (
      <li key={i}>{item}</li>
    ))}
  </ul>
)

// kept in English only: a translated legal text would need its own review per language
export default function PrivacyPolicyPage() {
  const { name, supportEmail, gtag } = AppConfig
  // only the Unstoppable brand ships the browser extension
  const hasExtension = AppConfig.id === 'unstoppable'
  const mail = (
    <a className="text-leah underline" href={`mailto:${supportEmail}`}>
      {supportEmail}
    </a>
  )

  return (
    <main className="min-h-screen">
      <Header />
      <article className="text-thor-gray mx-auto max-w-2xl space-y-8 px-4 py-8 pb-24 text-sm leading-6">
        <header className="space-y-2">
          <h1 className="text-leah text-2xl font-semibold">Privacy Policy</h1>
          <p>Last updated: {LAST_UPDATED}</p>
        </header>

        <p>
          This policy explains what data {name} (&quot;we&quot;, &quot;us&quot;) processes when you use the {name} website
          {hasExtension && <> and the {name} browser extension</>} ({hasExtension && <>together, </>}the &quot;Service&quot;). The Service is
          non-custodial: it never has access to your private keys or recovery phrase, and it does not require an account, name, email or phone number.
        </p>

        <Section title="Data we process">
          <p>To quote, create and track a swap, the Service processes:</p>
          <List
            items={[
              'The assets and amounts you want to swap.',
              'The receiving address and refund address you enter, and the sending address of a wallet you connect.',
              'Swap details such as the chosen provider, the deposit address, transaction hashes and the swap status.',
              'Standard technical data that every web request carries, such as your IP address and browser user agent.'
            ]}
          />
          <p>We do not ask for, and do not link these addresses to, your name or other identity details.</p>
        </Section>

        <Section title="How we use it">
          <List
            items={[
              'To fetch quotes from swap providers and show you the available routes.',
              'To create the swap with the provider you choose and show you where to send your funds.',
              'To track the status of your swap until the funds arrive or are refunded.',
              'To screen addresses for compliance and to protect users and providers against fraud and sanctioned activity.',
              'To show balances and USD values, and to answer your support requests.'
            ]}
          />
        </Section>

        <Section title="Who we share it with">
          <List
            items={[
              <>
                <span className="text-leah font-medium">Swap providers.</span> When you request a quote or create a swap, the swap details and
                addresses are sent to the providers involved (for example THORChain, Maya Protocol, NEAR Intents or an instant-exchange provider).
                Each provider processes this data under its own privacy policy and terms.
              </>,
              <>
                <span className="text-leah font-medium">Blockchain data services.</span> To read balances, pool data and prices, the Service sends
                public wallet addresses and token identifiers to blockchain RPC nodes, indexers and price services.
              </>,
              <>
                <span className="text-leah font-medium">Public blockchains.</span> Transactions you send are recorded on public blockchains and are
                visible to anyone. This is outside our control.
              </>,
              <>
                <span className="text-leah font-medium">Legal requirements.</span> We may disclose data if required by law or to protect the rights
                and safety of users and the Service.
              </>
            ]}
          />
          <p>We do not sell your data.</p>
        </Section>

        <Section title="Data stored on your device">
          <p>
            Your selected pair and amount, connected wallet addresses, swap history and interface preferences (such as theme and language) are stored
            in your browser&apos;s local storage{hasExtension && <> or, for the browser extension, in the extension&apos;s own storage</>}. This data
            stays on your device, and you can remove it at any time by clearing the site data{hasExtension && <> or removing the extension</>}. The
            website also sets a cookie to remember your language.
          </p>
          {hasExtension && (
            <p>
              The browser extension does not read your browsing history, the content of the pages you visit or any data from other websites. It reads
              your clipboard only when you click a &quot;Paste&quot; button.
            </p>
          )}
        </Section>

        {gtag && (
          <Section title="Analytics">
            <p>
              The website uses Google Analytics to understand general usage, such as page views and the type of device used. Google Analytics sets
              cookies and processes data under{' '}
              <a className="text-leah underline" href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">
                Google&apos;s privacy policy
              </a>
              . We use this data only in aggregate, not to identify individual users.
              {hasExtension && <> The browser extension does not use analytics.</>}
            </p>
          </Section>
        )}

        <Section title="Retention">
          <p>
            We keep swap records only as long as needed to process and track swaps, handle support requests and meet legal obligations. Swap providers
            keep data according to their own policies.
          </p>
        </Section>

        <Section title="Your choices">
          <p>
            You can use the Service without connecting a wallet, clear the data stored on your device at any time, and block cookies in your browser.
            To ask about the data we hold, contact us at {mail}.
          </p>
        </Section>

        <Section title="Changes">
          <p>We may update this policy. The date at the top shows when it was last changed.</p>
        </Section>

        <Section title="Contact">
          <p>Questions about this policy: {mail}.</p>
        </Section>
      </article>
      <Footer />
    </main>
  )
}
