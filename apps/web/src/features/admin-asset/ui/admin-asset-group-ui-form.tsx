import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AdminAssetGroupResolverKind as ResolverKind, AdminAssetGroupUpdateInput } from '@tokengator/sdk'
import { Button } from '@tokengator/ui/components/button'
import { Checkbox } from '@tokengator/ui/components/checkbox'
import { Input } from '@tokengator/ui/components/input'
import { Label } from '@tokengator/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tokengator/ui/components/select'

import {
  getAssetGroupResolverKindLabel,
  getDefaultAssetGroupResolverKind,
  getSupportedAssetGroupResolverKinds,
  isAssetGroupResolverKindCompatible,
} from '@/features/asset-group/util/asset-group-resolver-kind'
import { ellipsifyAddress } from '../util/ellipsify-address'

interface AdminAssetGroupUiFormProps {
  initialValues: AdminAssetGroupUpdateInput['data']
  isPending: boolean
  onSubmit: (values: AdminAssetGroupUpdateInput['data']) => void
  showEnabled?: boolean
  submitLabel: string
}

type NormalizedAdminAssetGroupFormValues = AdminAssetGroupUpdateInput['data'] & {
  resolverKind: ResolverKind
}

function normalizeAdminAssetGroupFormValues(
  values: AdminAssetGroupUpdateInput['data'],
): NormalizedAdminAssetGroupFormValues {
  const resolverKind =
    values.resolverKind &&
    isAssetGroupResolverKindCompatible({
      resolverKind: values.resolverKind as ResolverKind,
      type: values.type,
    })
      ? values.resolverKind
      : getDefaultAssetGroupResolverKind(values.type)

  return {
    ...values,
    resolverKind,
  }
}

export function AdminAssetGroupUiForm(props: AdminAssetGroupUiFormProps) {
  const { initialValues, isPending, onSubmit, showEnabled = true, submitLabel } = props
  const [values, setValues] = useState(() => normalizeAdminAssetGroupFormValues(initialValues))
  const [decimalsInputValue, setDecimalsInputValue] = useState(() => String(initialValues.decimals))
  const fallbackLabel = ellipsifyAddress(values.address)
  const resolverKindItems = getSupportedAssetGroupResolverKinds(values.type).map((resolverKind) => ({
    label: getAssetGroupResolverKindLabel(resolverKind),
    value: resolverKind,
  }))

  useEffect(() => {
    const nextValues = normalizeAdminAssetGroupFormValues(initialValues)

    setValues(nextValues)
    setDecimalsInputValue(String(nextValues.decimals))
  }, [initialValues])

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        const address = values.address.trim()

        onSubmit({
          ...values,
          address,
          imageUrl: values.imageUrl?.trim() || null,
          label: values.label.trim() || ellipsifyAddress(address),
          symbol: values.symbol?.trim() || null,
          symbolMagicEden: values.symbolMagicEden?.trim() || null,
        })
      }}
    >
      <div className="grid gap-1.5">
        <Label id="asset-group-type-label">Type</Label>
        <Select
          disabled={isPending}
          onValueChange={(value) => {
            if (value === null) {
              return
            }

            setValues((currentValues) => {
              const nextType = value as AdminAssetGroupUpdateInput['data']['type']
              const nextResolverKind = isAssetGroupResolverKindCompatible({
                resolverKind: currentValues.resolverKind as ResolverKind,
                type: nextType,
              })
                ? currentValues.resolverKind
                : getDefaultAssetGroupResolverKind(nextType)

              return {
                ...currentValues,
                resolverKind: nextResolverKind,
                type: nextType,
              }
            })
          }}
          value={values.type}
        >
          <SelectTrigger aria-labelledby="asset-group-type-label" className="w-full" id="asset-group-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="collection">collection</SelectItem>
            <SelectItem value="mint">mint</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="asset-group-address">Address</Label>
        <Input
          id="asset-group-address"
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              address: event.target.value,
              label:
                !currentValues.label.trim() || currentValues.label.trim() === ellipsifyAddress(currentValues.address)
                  ? ellipsifyAddress(event.target.value)
                  : currentValues.label,
            }))
          }
          placeholder="Collection, mint, or realm address"
          required
          value={values.address}
        />
      </div>
      <div className="grid gap-1.5">
        <Label id="asset-group-resolver-kind-label">Source</Label>
        <Select
          disabled={isPending || values.type === 'collection'}
          items={resolverKindItems}
          onValueChange={(value) => {
            if (value === null) {
              return
            }

            setValues((currentValues) => ({
              ...currentValues,
              resolverKind: value as ResolverKind,
            }))
          }}
          value={values.resolverKind}
        >
          <SelectTrigger
            aria-labelledby="asset-group-resolver-kind-label"
            className="w-full"
            id="asset-group-resolver-kind"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {resolverKindItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="asset-group-decimals">Decimals</Label>
        <Input
          id="asset-group-decimals"
          max={255}
          min={0}
          onBlur={() => {
            const trimmedValue = decimalsInputValue.trim()
            const parsedValue = Number.parseInt(trimmedValue, 10)
            const isValid =
              /^\d+$/.test(trimmedValue) && Number.isInteger(parsedValue) && parsedValue >= 0 && parsedValue <= 255

            if (!isValid) {
              setDecimalsInputValue(String(values.decimals))
            }
          }}
          onChange={(event) => {
            const nextValue = event.currentTarget.value

            if (nextValue === '') {
              setDecimalsInputValue(nextValue)

              return
            }

            if (!/^\d+$/.test(nextValue)) {
              return
            }

            const nextDecimals = Number.parseInt(nextValue, 10)

            if (!Number.isInteger(nextDecimals) || nextDecimals < 0 || nextDecimals > 255) {
              return
            }

            setDecimalsInputValue(nextValue)
            setValues((currentValues) => ({
              ...currentValues,
              decimals: nextDecimals,
            }))
          }}
          step={1}
          type="number"
          value={decimalsInputValue}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="asset-group-symbol">Symbol</Label>
        <Input
          id="asset-group-symbol"
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              symbol: event.target.value,
            }))
          }
          placeholder="Optional"
          value={values.symbol ?? ''}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="asset-group-symbol-magic-eden">Magic Eden Symbol</Label>
        <Input
          id="asset-group-symbol-magic-eden"
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              symbolMagicEden: event.target.value,
            }))
          }
          placeholder="some_collection_symbol"
          value={values.symbolMagicEden ?? ''}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="asset-group-image-url">Image URL</Label>
        <Input
          id="asset-group-image-url"
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              imageUrl: event.target.value,
            }))
          }
          placeholder="https://example.com/collection.png"
          value={values.imageUrl ?? ''}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="asset-group-label">Label</Label>
        <Input
          id="asset-group-label"
          onChange={(event) =>
            setValues((currentValues) => ({
              ...currentValues,
              label: event.target.value,
            }))
          }
          placeholder={fallbackLabel || 'Defaults to the address'}
          value={values.label}
        />
      </div>
      {showEnabled ? (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={values.enabled}
            id="asset-group-enabled"
            onCheckedChange={(checked) =>
              setValues((currentValues) => ({
                ...currentValues,
                enabled: Boolean(checked),
              }))
            }
          />
          <Label htmlFor="asset-group-enabled">Enabled</Label>
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button disabled={isPending || !values.address.trim()} type="submit">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving
            </>
          ) : (
            submitLabel
          )}
        </Button>
      </div>
    </form>
  )
}
