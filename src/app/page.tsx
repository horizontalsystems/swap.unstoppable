import { redirect } from 'next/navigation'

export default function Page() {
  redirect('/swap?sellAsset=BTC.BTC&buyAsset=XMR.XMR')
}
