import { Checkbox } from '@/components/ui/checkbox'

type SwapWarningProps = {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  text: string
  textAccent?: string
}

export const SwapAddressWarning = ({ text, textAccent, checked, onCheckedChange }: SwapWarningProps) => {
  return (
    <label className="border-blade flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-sm">
      <Checkbox
        className="size-6"
        checked={checked}
        onCheckedChange={value => {
          const active = document.activeElement
          if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) active.blur()
          onCheckedChange?.(value === true)
        }}
      />
      <div className="space-x-1">
        <span className="text-thor-gray">{text}</span>
        {textAccent && <span className="text-jacob">{textAccent}</span>}
      </div>
    </label>
  )
}
