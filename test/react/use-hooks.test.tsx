import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { signal, computed } from '../../src/core'
import { describe, it, expect } from 'vitest'
import { InspectSignal, InspectSignalValue } from './test-helper'

describe('useSignalValue', () => {
  it('renders a signal value', async () => {
    const value = signal(3)
    const double = computed(() => value() * 2)

    render(
      <>
        <InspectSignalValue signal={value} label="value" />
        <InspectSignalValue signal={double} label="double" />
      </>
    )

    expect(screen.getByText(':value:3:1:')).toBeTruthy()
    expect(screen.getByText(':double:6:1:')).toBeTruthy()

    await act(async () => value(6))

    expect(screen.getByText(':value:6:2:')).toBeTruthy()
    expect(screen.getByText(':double:12:2:')).toBeTruthy()
  })
})

describe('useSignal', () => {
  it('renders hello world message', async () => {
    const value = signal(3)
    const other = signal(3)
    const double = computed(() => value() * 2)

    const { getByText, findByText } = render(
      <>
        <InspectSignal
          signal={value}
          label="value"
          onClick={value => value + 1}
        >
          <InspectSignalValue signal={other} label="other" />
        </InspectSignal>

        <InspectSignalValue signal={double} label="double" />
      </>
    )

    const button = getByText(':value:button:')

    expect(getByText(':value:3:1:')).toBeTruthy()
    expect(getByText(':double:6:1:')).toBeTruthy()
    expect(getByText(':other:3:1:')).toBeTruthy()

    fireEvent.click(button)

    expect(getByText(':value:4:2:')).toBeTruthy()
    expect(getByText(':double:8:2:')).toBeTruthy()
    expect(getByText(':other:3:1:')).toBeTruthy()

    fireEvent.click(button)

    expect(getByText(':value:5:4:')).toBeTruthy()
    expect(getByText(':double:10:4:')).toBeTruthy()
    expect(getByText(':other:3:1:')).toBeTruthy()

    fireEvent.click(button)

    expect(getByText(':value:6:5:')).toBeTruthy()
    expect(getByText(':double:12:5:')).toBeTruthy()
    expect(getByText(':other:3:1:')).toBeTruthy()
  })
})
