import { Credenza, CredenzaContent, CredenzaHeader, CredenzaTitle } from '@/components/ui/credenza'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AmlPolicyBadge } from '@/components/aml-policy/aml-policy-badge'
import { AmlPolicy } from '@/types'

interface AmlRiskLevelsDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

const RISK_LEVELS: { policy: AmlPolicy; description: string }[] = [
  {
    policy: 'auto',
    description: 'Direct on-chain execution. No provider checks or freezes. Automatic refunds if swap fails.'
  },
  {
    policy: 'flexible',
    description: 'Provider checks transactions automatically before completion. If issues are detected, the swap is rejected and funds are refunded.'
  },
  {
    policy: 'controlled',
    description: 'Additional verification may be required for some transactions. If issues are detected, funds are usually refunded automatically.'
  }
]

export const AmlPolicyInfo = ({ isOpen, onOpenChange }: AmlRiskLevelsDialogProps) => {
  return (
    <Credenza open={isOpen} onOpenChange={onOpenChange}>
      <CredenzaContent className="flex h-auto max-h-5/6 flex-col md:max-w-md">
        <CredenzaHeader>
          <CredenzaTitle>Provider Risk Levels</CredenzaTitle>
        </CredenzaHeader>

        <ScrollArea className="relative flex min-h-0 flex-1 px-4 md:px-8" classNameViewport="flex-1 h-auto">
          <div className="pb-4">
            <p className="text-thor-gray text-sm">These levels show how providers handle swaps and transaction checks.</p>

            <div className="mt-6 flex flex-col gap-6">
              {RISK_LEVELS.map(({ policy, description }) => (
                <div key={policy} className="flex flex-col gap-3">
                  <div>
                    <AmlPolicyBadge amlPolicy={policy} />
                  </div>
                  <p className="text-thor-gray text-sm">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </CredenzaContent>
    </Credenza>
  )
}
