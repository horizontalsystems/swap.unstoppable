import { useCallback, useEffect, useState } from 'react'
import { Msg, Signer, Simulation, translateError } from 'rujira.js'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SwapButtonProps {
  signer: Signer
  msg: Msg | null
}

export const SwapButton = ({ msg, signer }: SwapButtonProps) => {
  const [simulation, setSimulation] = useState<Simulation>()
  const [simulationError, setSimulationError] = useState<Error>()
  const { simulate, signAndBroadcast } = signer

  const doSimulate = useCallback(
    (msg: Msg | null) => {
      if (simulationError) setSimulationError(undefined)
      if (simulation) setSimulation(undefined)
      if (simulate && msg) {
        simulate(msg)
          .then(s => {
            setSimulation(s)
          })
          .catch(err => {
            console.error(err)
            setSimulationError(err)
          })
      }
    },
    [simulate, simulation, simulationError]
  )

  useEffect(() => {
    doSimulate(msg)
  }, [msg])

  const onSign = () => {
    if (!simulation) throw new Error(`Simulation required`)
    if (!signAndBroadcast) throw new Error(`signAndBroadcast unavailable`)
    if (!msg) throw new Error(`Msg required`)

    const p = signAndBroadcast(simulation, msg)
      .then(res => {
        console.log('res', res)
        return res
      })
      .catch(err => {
        console.error(err)
        throw err
      })

    toast.promise(p, {
      loading: 'Submitting Transaction',
      success: () => 'Transaction Succeeded',
      error: (err: any) => {
        console.error(err)
        return 'Error Submitting Transaction'
      }
    })
  }

  const disabled = !simulation || !msg || !!simulationError

  return (
    <div className="mt-6">
      {simulationError?.message && (
        <div className="mt-3 px-3 text-red-500">{translateError(simulationError.message)}</div>
      )}

      <Button
        className="w-full rounded-2xl bg-gray-200 py-4 font-medium text-black transition-colors hover:bg-white"
        onClick={onSign}
        disabled={disabled}
        size="lg"
      >
        Swap
      </Button>
    </div>
  )
}
