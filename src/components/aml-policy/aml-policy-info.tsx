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
    description:
      'Automatic on-chain execution. Funds cannot be frozen or blocked after submission. If swap fails the funds are refunded automatically.'
  },
  {
    policy: 'flexible',
    description: 'Provider operates using their own liquidity. Rejections are rare. Freezes are theoretically possible but highly unlikely'
  },
  {
    policy: 'precheck',
    description:
      'Provider does its own address screening prior processing swap. Rejections are rare. Freezes are theoretically possible but highly unlikely'
  },
  {
    policy: 'controlled',
    description:
      'These provider operates with third party liquidity and has AML policies in place. In most cases swaps are rejected and refunded if any AML issues are detected. In some situations provider may request KYC before releasing funds'
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
            <p className="text-thor-gray text-sm">Risk levels show what actions a provider may take during execution.</p>

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
