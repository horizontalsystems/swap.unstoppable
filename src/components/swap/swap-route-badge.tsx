interface SwapRouteBadgeProps {
  index: number
  fasterIndex: number
}

export const SwapRouteBadge = ({ index, fasterIndex }: SwapRouteBadgeProps) => {
  if (index === 0) {
    return <span className="text-remus border-remus rounded-lg border px-1.5 text-[10px] font-semibold">BEST PRICE</span>
  }
  if (index === fasterIndex) {
    return <span className="text-jacob border-jacob rounded-lg border px-1.5 text-[10px] font-semibold">FASTER</span>
  }
  return null
}
