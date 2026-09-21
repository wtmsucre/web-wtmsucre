import { useTimer } from "@/hooks/useTimer"

const zeroPad = (value: number): string => `${value}`.padStart(2, "0")

interface CountdownProps {
  initialTime: number
  targetDate: Date
  ongoingMessage?: string
}

export const Countdown = ({
  initialTime,
  targetDate,
  ongoingMessage = "¡Empezó En Ellas Late Bolivia!",
}: CountdownProps) => {
  const endDate = targetDate instanceof Date ? targetDate : new Date(targetDate)
  const { days, hours, minutes, seconds } = useTimer(initialTime, endDate)

  if (initialTime <= 0 || (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0)) {
    return (
      <div className="text-center font-google font-extrabold text-white text-2xl md:text-3xl lg:text-4xl">
        {ongoingMessage}
      </div>
    )
  }

  const units = [
    { label: "Días", value: days },
    { label: "Horas", value: hours },
    { label: "Minutos", value: minutes },
    { label: "Segundos", value: seconds },
  ]

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-3 lg:gap-[22px] max-w-[820px] mx-auto">
      {units.map(unit => (
        <div
          key={unit.label}
          className="relative min-w-0 rounded-xl sm:rounded-[18px] border border-white/16 bg-white/7 px-1 sm:px-2.5 pt-[18px] sm:pt-[22px] pb-3 sm:pb-[18px] text-center overflow-hidden"
        >
          {/* Striped ribbon */}
          <div
            className="absolute top-0 left-0 right-0 h-2"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.8) 0 4px, transparent 4px 8px), repeating-linear-gradient(90deg, #10A7BC 0 14px, #F6BE3A 14px 24px, #5C9DF5 24px 38px)",
            }}
            aria-hidden="true"
          />
          <div
            className="font-google font-extrabold text-white leading-none tabular-nums"
            style={{ fontSize: "clamp(26px, 7vw, 60px)" }}
          >
            {zeroPad(unit.value)}
          </div>
          <div className="font-google mt-2 text-[8px] min-[375px]:text-[9px] sm:text-[11px] tracking-[0.04em] sm:tracking-[0.28em] uppercase text-[#A8CDF7]">
            {unit.label}
          </div>
        </div>
      ))}
    </div>
  )
}
