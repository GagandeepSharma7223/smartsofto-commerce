"use client"
import LoadingState from '@/components/LoadingState'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  apiAdminClients,
  apiAdminCreateClient,
  apiAdminUpdateClient,
  apiAdminDeleteClient,
  apiAdminRestoreClient,
  apiAdminClientAddresses,
  apiAdminCreateClientAddress,
  apiAdminUpdateClientAddress,
  apiAdminDeleteClientAddress,
  type AdminClient,
  type ClientAddress
} from '@/lib/api'
import { getToken, useClientUser } from '@/lib/auth'
import { confirmAction, showError, showSuccess } from '@/lib/alert'
import { FieldError, fieldClass, isBlank, isEmail } from '@/lib/form-ui'

const clientTypes = ['Regular', 'VIP', 'Wholesale']

type ClientForm = {
  name: string
  referenceName: string
  companyName: string
  email: string
  phoneNumber: string
  clientType: string
  isActive: boolean
  notes: string
}

type ClientFormErrors = {
  name?: string
  email?: string
}

type AddressForm = {
  id?: number
  label: string
  name: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

const emptyForm: ClientForm = {
  name: '',
  referenceName: '',
  companyName: '',
  email: '',
  phoneNumber: '',
  clientType: 'Regular',
  isActive: true,
  notes: ''
}

const emptyAddress: AddressForm = {
  label: 'Home',
  name: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: 'Gurugram',
  state: 'Haryana',
  postalCode: '',
  country: 'India',
  isDefault: false
}

export default function ClientsPage() {
  const user = useClientUser()
  const token = getToken() || undefined
  const [rows, setRows] = useState<AdminClient[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<AdminClient | null>(null)
  const [form, setForm] = useState<ClientForm>({ ...emptyForm })
  const [formErrors, setFormErrors] = useState<ClientFormErrors>({})
  const [addresses, setAddresses] = useState<AddressForm[]>([])
  const [removedAddressIds, setRemovedAddressIds] = useState<number[]>([])
  const [addressLoading, setAddressLoading] = useState(false)

  const load = useCallback(async () => {
    setError(null)
    try {
      const data = await apiAdminClients(token, showInactive)
      setRows(data)
    } catch (e: any) {
      setError(e?.message || 'Failed to load clients')
      setRows([])
    }
  }, [token, showInactive])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const list = rows || []
    if (!query.trim()) return list
    const q = query.trim().toLowerCase()
    return list.filter(c =>
      String(c.name || '').toLowerCase().includes(q) ||
      String(c.email || '').toLowerCase().includes(q) ||
      String(c.phoneNumber || '').toLowerCase().includes(q)
    )
  }, [rows, query])

  if (user === undefined) {
    return <Shell title="Clients"><LoadingState /></Shell>
  }
  if (!user || user.role?.toLowerCase() !== 'admin') {
    return <Shell title="Clients"><div className="text-red-600">Not authorized.</div></Shell>
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setFormErrors({})
    setAddresses([])
    setRemovedAddressIds([])
    setOpen(true)
  }

  const openEdit = async (client: AdminClient) => {
    setEditing(client)
    setFormErrors({})
    setForm({
      name: client.name || '',
      referenceName: client.referenceName || client.name || '',
      companyName: client.companyName || '',
      email: client.email || '',
      phoneNumber: client.phoneNumber || '',
      clientType: client.clientType || 'Regular',
      isActive: client.isActive ?? true,
      notes: client.notes || ''
    })
    setRemovedAddressIds([])
    setAddressLoading(true)
    try {
      const list = await apiAdminClientAddresses(client.id, token)
      setAddresses((list || []).map(mapAddressToForm))
    } catch (e: any) {
      setAddresses([])
      setError(e?.message || 'Failed to load addresses')
    } finally {
      setAddressLoading(false)
    }
    setOpen(true)
  }

  const setDefaultAddress = (index: number) => {
    setAddresses(prev => prev.map((a, i) => ({ ...a, isDefault: i === index })))
  }

  const addAddressRow = () => {
    setAddresses(prev => [...prev, { ...emptyAddress }])
  }

  const removeAddressRow = (index: number) => {
    setAddresses(prev => {
      const next = [...prev]
      const removed = next.splice(index, 1)
      if (removed[0]?.id) {
        setRemovedAddressIds(ids => [...ids, removed[0].id as number])
      }
      return next
    })
  }

  const persistAddresses = async (clientId: number) => {
    for (const id of removedAddressIds) {
      await apiAdminDeleteClientAddress(clientId, id, token)
    }

    for (const addr of addresses) {
      if (!addr.addressLine1.trim()) {
        continue
      }
      const payload = {
        label: addr.label || 'Home',
        name: addr.name || form.name,
        phone: addr.phone || form.phoneNumber,
        addressLine1: addr.addressLine1,
        addressLine2: addr.addressLine2 || '',
        city: addr.city || 'Gurugram',
        state: addr.state || 'Haryana',
        postalCode: addr.postalCode,
        country: addr.country || 'India',
        isDefault: addr.isDefault
      }
      if (addr.id) {
        await apiAdminUpdateClientAddress(clientId, addr.id, payload, token)
      } else {
        await apiAdminCreateClientAddress(clientId, payload, token)
      }
    }
  }

  const saveClient = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: ClientFormErrors = {}
    if (isBlank(form.name)) nextErrors.name = 'Name is required.'
    if (form.email.trim() && !isEmail(form.email.trim())) nextErrors.email = 'Enter a valid email address.'
    setFormErrors(nextErrors)
    if (Object.keys(nextErrors).length) return

    setSaving(true)
    setError(null)

    const payload = {
      name: form.name.trim(),
      referenceName: (form.referenceName || form.name).trim(),
      companyName: form.companyName.trim() || null,
      email: form.email.trim() || null,
      phoneNumber: form.phoneNumber.trim() || null,
      clientType: form.clientType || 'Regular',
      isActive: form.isActive,
      notes: form.notes.trim() || null
    }

    try {
      if (editing) {
        const updated: AdminClient = {
          ...editing,
          ...payload,
          referenceName: payload.referenceName || editing.referenceName,
          updatedAt: new Date().toISOString()
        }
        await apiAdminUpdateClient(editing.id, updated, token)
        await persistAddresses(editing.id)
        setRows(prev => prev ? prev.map(r => r.id === editing.id ? updated : r) : prev)
        await showSuccess('Operation completed successfully')
      } else {
        const created = await apiAdminCreateClient(payload as any, token)
        await persistAddresses(created.id)
        setRows(prev => prev ? [created, ...prev] : [created])
        await showSuccess('Operation completed successfully')
      }
      setOpen(false)
    } catch (e: any) {
      const message = e?.message || 'Something went wrong'
      setError(message)
      await showError(message, 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const archiveClient = async (client: AdminClient) => {
    const confirmed = await confirmAction({
      title: 'Archive client',
      text: `Archive ${client.name}? You can restore this client later.`,
      confirmText: 'Archive',
      cancelText: 'Cancel',
    })
    if (!confirmed) return

    setError(null)
    try {
      await apiAdminDeleteClient(client.id, token)
      setRows(prev => prev ? prev.filter(r => r.id !== client.id) : prev)
      await showSuccess('Operation completed successfully')
    } catch (e: any) {
      const message = e?.message || 'Something went wrong'
      setError(message)
      await showError(message, 'Archive failed')
    }
  }

  const restoreClient = async (client: AdminClient) => {
    setError(null)
    try {
      await apiAdminRestoreClient(client.id, token)
      setRows(prev => prev ? prev.map(r => r.id === client.id ? { ...r, isActive: true } : r) : prev)
      await showSuccess('Operation completed successfully')
    } catch (e: any) {
      const message = e?.message || 'Something went wrong'
      setError(message)
      await showError(message, 'Restore failed')
    }
  }

  return (
    <Shell title="Clients">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
          <input
            className="w-full rounded-md border px-3 py-2 sm:w-64"
            placeholder="Search by name, email, phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          className="bg-[#6FAF3D] hover:bg-[#5F9B34] text-white px-4 py-2 rounded-md"
          onClick={openCreate}
        >
          Add Client
        </button>
      </div>

      {error && <div className="text-red-600 mb-3">{error}</div>}

      {rows === null ? (
        <LoadingState />
      ) : filtered.length === 0 ? (
        <div className="text-slate-600">No clients found.</div>
      ) : (
        <div className="overflow-auto border rounded-xl bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="text-left px-3 py-2">Client</th>
                <th className="text-left px-3 py-2">Contact</th>
                <th className="text-left px-3 py-2">Type</th>
                <th className="text-left px-3 py-2">Status</th>
                <th className="text-left px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-3 py-2">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-slate-500">Ref: {c.referenceName || '-'}</div>
                  </td>
                  <td className="px-3 py-2">
                    <div>{c.email || '-'}</div>
                    <div className="text-xs text-slate-500">{c.phoneNumber || '-'}</div>
                  </td>
                  <td className="px-3 py-2">{c.clientType || 'Regular'}</td>
                  <td className="px-3 py-2">
                    <Badge tone={c.isActive ? 'green' : 'gray'}>
                      {c.isActive ? 'Active' : 'Archived'}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <button
                        className="text-[#2B7CBF] text-sm"
                        onClick={() => openEdit(c)}
                      >
                        Edit
                      </button>
                      {c.isActive ? (
                        <button
                          className="text-sm text-red-600"
                          onClick={() => archiveClient(c)}
                        >
                          Archive
                        </button>
                      ) : (
                        <button
                          className="text-sm text-[#2B7CBF]"
                          onClick={() => restoreClient(c)}
                        >
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 overflow-y-auto">
          <div className="min-h-full flex items-start justify-center px-4 py-6">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[calc(100vh-3rem)] overflow-y-auto">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div className="font-semibold">{editing ? 'Edit client' : 'Add client'}</div>
              <button className="text-slate-500 hover:text-slate-800" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <form className="p-4 space-y-4" onSubmit={saveClient} noValidate>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm mb-1">Name</label>
                  <input
                    className={fieldClass(!!formErrors.name)}
                    value={form.name}
                    onChange={(e) => {
                      const value = e.target.value
                      setForm({ ...form, name: value })
                      setFormErrors((prev) => ({ ...prev, name: value.trim() ? undefined : prev.name }))
                    }}
                  />
                  <FieldError error={formErrors.name} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Reference Name</label>
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    value={form.referenceName}
                    onChange={(e) => setForm({ ...form, referenceName: e.target.value })}
                    placeholder="Auto from name"
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm mb-1">Email</label>
                  <input
                    type="email"
                    className={fieldClass(!!formErrors.email)}
                    value={form.email}
                    onChange={(e) => {
                      const value = e.target.value
                      setForm({ ...form, email: value })
                      setFormErrors((prev) => ({ ...prev, email: !value.trim() || isEmail(value.trim()) ? undefined : prev.email }))
                    }}
                  />
                  <FieldError error={formErrors.email} />
                </div>
                <div>
                  <label className="block text-sm mb-1">Phone</label>
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm mb-1">Company</label>
                  <input
                    className="border rounded-md px-3 py-2 w-full"
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Client Type</label>
                  <select
                    className="border rounded-md px-3 py-2 w-full"
                    value={form.clientType}
                    onChange={(e) => setForm({ ...form, clientType: e.target.value })}
                  >
                    {clientTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1">Notes</label>
                <textarea
                  className="border rounded-md px-3 py-2 w-full"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Active
              </label>

              <div className="border rounded-xl p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Addresses</div>
                  <button type="button" className="text-sm text-[#2B7CBF]" onClick={addAddressRow}>+ Add address</button>
                </div>
                {addressLoading ? (
                  <div className="text-sm text-slate-500">Loading addresses...</div>
                ) : addresses.length === 0 ? (
                  <div className="text-sm text-slate-500">No addresses yet.</div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr, index) => (
                      <div key={addr.id ?? index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Address {index + 1}</div>
                          <button type="button" className="text-sm text-red-600" onClick={() => removeAddressRow(index)}>Remove</button>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            className="border rounded-md px-3 py-2"
                            placeholder="Label"
                            value={addr.label}
                            onChange={(e) => {
                              const val = e.target.value
                              setAddresses(prev => prev.map((a, i) => i === index ? { ...a, label: val } : a))
                            }}
                          />
                          <input
                            className="border rounded-md px-3 py-2"
                            placeholder="Phone"
                            value={addr.phone}
                            onChange={(e) => {
                              const val = e.target.value
                              setAddresses(prev => prev.map((a, i) => i === index ? { ...a, phone: val } : a))
                            }}
                          />
                        </div>
                        <input
                          className="border rounded-md px-3 py-2 w-full"
                          placeholder="Address line 1"
                          value={addr.addressLine1}
                          onChange={(e) => {
                            const val = e.target.value
                            setAddresses(prev => prev.map((a, i) => i === index ? { ...a, addressLine1: val } : a))
                          }}
                        />
                        <input
                          className="border rounded-md px-3 py-2 w-full"
                          placeholder="Address line 2"
                          value={addr.addressLine2}
                          onChange={(e) => {
                            const val = e.target.value
                            setAddresses(prev => prev.map((a, i) => i === index ? { ...a, addressLine2: val } : a))
                          }}
                        />
                        <div className="grid gap-2 sm:grid-cols-3">
                          <input
                            className="border rounded-md px-3 py-2"
                            placeholder="City"
                            value={addr.city}
                            onChange={(e) => {
                              const val = e.target.value
                              setAddresses(prev => prev.map((a, i) => i === index ? { ...a, city: val } : a))
                            }}
                          />
                          <input
                            className="border rounded-md px-3 py-2"
                            placeholder="State"
                            value={addr.state}
                            onChange={(e) => {
                              const val = e.target.value
                              setAddresses(prev => prev.map((a, i) => i === index ? { ...a, state: val } : a))
                            }}
                          />
                          <input
                            className="border rounded-md px-3 py-2"
                            placeholder="Postal code"
                            value={addr.postalCode}
                            onChange={(e) => {
                              const val = e.target.value
                              setAddresses(prev => prev.map((a, i) => i === index ? { ...a, postalCode: val } : a))
                            }}
                          />
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <input
                            className="border rounded-md px-3 py-2"
                            placeholder="Country"
                            value={addr.country}
                            onChange={(e) => {
                              const val = e.target.value
                              setAddresses(prev => prev.map((a, i) => i === index ? { ...a, country: val } : a))
                            }}
                          />
                          <label className="inline-flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={addr.isDefault}
                              onChange={() => setDefaultAddress(index)}
                            />
                            Default
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  className="px-3 py-2 border rounded-md"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-md bg-[#6FAF3D] text-white hover:bg-[#5F9B34] disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}

    </Shell>
  )
}

function mapAddressToForm(address: ClientAddress): AddressForm {
  return {
    id: Number(address.id),
    label: address.label || 'Home',
    name: address.name || '',
    phone: address.phone || '',
    addressLine1: address.addressLine1 || '',
    addressLine2: address.addressLine2 || '',
    city: address.city || 'Gurugram',
    state: address.state || 'Haryana',
    postalCode: address.postalCode || '',
    country: address.country || 'India',
    isDefault: !!address.isDefault
  }
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="landing">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Link href="/" className="text-[#2B7CBF]">Back to dashboard</Link>
        </div>
        {children}
      </main>
    </div>
  )
}

function Badge({ children, tone = 'gray' }: { children: React.ReactNode; tone?: 'gray' | 'green' | 'amber' }) {
  const colors =
    tone === 'green'
      ? 'bg-green-100 text-green-800'
      : tone === 'amber'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-slate-100 text-slate-700'
  return <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${colors}`}>{children}</span>
}

