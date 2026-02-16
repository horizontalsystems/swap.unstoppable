import { Checkbox } from '@/components/ui/checkbox'

type SwapWarningProps = {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  text: string
  textAccent?: string
}

export const SwapAddressWarning = ({ text, textAccent, checked, onCheckedChange }: SwapWarningProps) => {
  return (
    <div className="border-blade flex items-center gap-4 rounded-xl border p-4 text-sm">
      <Checkbox className="size-6" checked={checked} onCheckedChange={onCheckedChange} />
      <div className="space-x-1">
        <span className="text-thor-gray">{text}</span>
        {textAccent && <span className="text-jacob">{textAccent}</span>}
      </div>
    </div>
  )
}
