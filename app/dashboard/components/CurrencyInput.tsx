'use client'

import React, { useEffect, useRef } from 'react'
import { parseCurrencyInput } from '@/lib/utils'

interface CurrencyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  className?: string
}

function formatDisplayValue(value: number) {
  if (!Number.isFinite(value) || value === 0) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = '0,00',
  className = '',
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const input = inputRef.current
    if (!input || document.activeElement === input) {
      return
    }

    input.value = formatDisplayValue(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseCurrencyInput(e.target.value))
  }

  const handleBlur = () => {
    const input = inputRef.current
    if (!input) return

    input.value = formatDisplayValue(value)
  }

  return (
    <div className="currency-field">
      <span className="currency-field-prefix">R$</span>
      <input
        ref={inputRef}
        className={`form-input currency-field-input ${className}`.trim()}
        type="text"
        inputMode="decimal"
        defaultValue={formatDisplayValue(value)}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  )
}
