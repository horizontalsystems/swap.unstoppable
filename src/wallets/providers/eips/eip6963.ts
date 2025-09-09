import { Eip1193Provider } from 'ethers'
import { Eip1193Adapter } from './eip1193' // Interface for provider information following Eip-6963.

// Interface for provider information following Eip-6963.
interface Eip6963ProviderInfo {
  /**
  Unique identifier for the wallet e.g io.metamask, io.metamask.flask
  */
  rdns: string
  /**
  Globally unique ID to differentiate between provider sessions for the lifetime of the page
  */
  uuid: string
  /**
  Human-readable name of the wallet
  */
  name: string
  /**
  URL to the wallet's icon
  */
  icon: string
}

// Type representing the event structure for announcing a provider based on Eip-6963.
interface Eip6963AnnounceProviderEvent {
  info: Eip6963ProviderInfo // The provider's info
  provider: Eip1193Provider // The Eip-1193 compatible provider
}

declare global {
  interface WindowEventMap {
    'eip6963:announceProvider': CustomEvent<Eip6963AnnounceProviderEvent>
  }
}

export class Eip6963Adapter extends Eip1193Adapter {
  private provider?: Eip1193Provider
  constructor(
    private rdns: string,
    eip712 = false
  ) {
    super(() => this.provider, eip712)
    window.addEventListener('eip6963:announceProvider', this.handleAnnounce.bind(this))

    window.dispatchEvent(new Event('eip6963:requestProvider'))
  }

  private handleAnnounce(res: CustomEvent<Eip6963AnnounceProviderEvent>) {
    if (res.detail.info.rdns.includes(this.rdns)) {
      this.provider = res.detail.provider
    }
  }
}
