"use client"

import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { CalendarDays, Clock3, type LucideIcon } from "lucide-react"
import { useState } from "react"
import { DayPicker } from "react-day-picker"
import { zhCN as dayPickerZhCN } from "react-day-picker/locale"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined

  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
    ? date
    : undefined
}

function toLocalDateValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

export function DatePickerField({
  label,
  value,
  onChange,
  minDate,
  maxDate,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  minDate?: string
  maxDate?: string
}) {
  const [open, setOpen] = useState(false)
  const selectedDate = parseLocalDate(value)
  const minimumDate = minDate ? parseLocalDate(minDate) : undefined
  const maximumDate = maxDate ? parseLocalDate(maxDate) : undefined

  return (
    <label className="p0-form-field">
      <span>{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="p0-picker-trigger"
              aria-label={label}
            />
          }
        >
          <CalendarDays data-icon="inline-start" />
          <span>{selectedDate ? format(selectedDate, "M月d日", { locale: zhCN }) : "请选择日期"}</span>
        </PopoverTrigger>
        <PopoverContent align="start" className="p0-date-picker-popover">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return
              onChange(toLocalDateValue(date))
              setOpen(false)
            }}
            disabled={(date) => Boolean(
              (minimumDate && date < minimumDate) ||
              (maximumDate && date > maximumDate)
            )}
            locale={dayPickerZhCN}
            className="p0-date-calendar"
          />
        </PopoverContent>
      </Popover>
    </label>
  )
}

export function OptionPickerField({
  label,
  value,
  onChange,
  options,
  icon: Icon,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  icon?: LucideIcon
}) {
  return (
    <label className="p0-form-field">
      <span>{label}</span>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (typeof nextValue === "string") onChange(nextValue)
        }}
      >
        <SelectTrigger className="p0-picker-trigger" aria-label={label}>
          {Icon && <Icon data-icon="inline-start" />}
          <SelectValue placeholder={`请选择${label}`} />
        </SelectTrigger>
        <SelectContent align="start" className="p0-picker-select-content">
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </label>
  )
}

const timeOptions = Array.from({ length: 96 }, (_, index) => {
  const hours = String(Math.floor(index / 4)).padStart(2, "0")
  const minutes = String((index % 4) * 15).padStart(2, "0")
  return `${hours}:${minutes}`
})

export function TimePickerField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <OptionPickerField
      label={label}
      value={value}
      onChange={onChange}
      options={timeOptions}
      icon={Clock3}
    />
  )
}
