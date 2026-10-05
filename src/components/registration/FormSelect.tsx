import type { ControllerRenderProps } from "react-hook-form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FormSelectProps {
  label: string
  options: string[]
  disabledOptions?: string[] | null
  field: ControllerRenderProps
}

export const FormSelect = ({ label, options, disabledOptions, field }: FormSelectProps) => {
  return (
    <Select onValueChange={field.onChange} defaultValue={field.value}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={`Selecciona tu ${label}`} />
      </SelectTrigger>
      <SelectContent>
        {options?.map((option: string) => (
          <SelectItem key={option} value={option} disabled={disabledOptions?.includes(option)}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
