'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react'

interface Ingredient {
  id: string
  name: string
  purchase_quantity: number
  purchase_unit: string
  purchase_price: number
  updated_year: number
  notes: string
  display_order: number
}

const emptyIngredient: Omit<Ingredient, 'id'> = {
  name: '',
  purchase_quantity: 0,
  purchase_unit: 'g',
  purchase_price: 0,
  updated_year: new Date().getFullYear(),
  notes: '',
  display_order: 0,
}

export default function IngredientesPage() {
  const [items, setItems] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [form, setForm] = useState(emptyIngredient)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase.from('ingredients').select('*').order('display_order')
    setItems(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const showToast = (type: string, message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const openNew = () => {
    setEditing(null)
    setForm(emptyIngredient)
    setShowModal(true)
  }

  const openEdit = (item: Ingredient) => {
    setEditing(item)
    setForm({
      name: item.name,
      purchase_quantity: item.purchase_quantity,
      purchase_unit: item.purchase_unit,
      purchase_price: item.purchase_price,
      updated_year: item.updated_year,
      notes: item.notes,
      display_order: item.display_order,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    try {
      if (editing) {
        const { error } = await supabase.from('ingredients').update(form).eq('id', editing.id)
        if (error) throw error
        showToast('success', 'Ingrediente atualizado!')
      } else {
        const id = crypto.randomUUID()
        const { error } = await supabase.from('ingredients').insert({ ...form, id })
        if (error) throw error
        showToast('success', 'Ingrediente criado!')
      }
      setShowModal(false)
      load()
    } catch {
      showToast('error', 'Erro ao salvar ingrediente')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este ingrediente?')) return
    try {
      await supabase.from('ingredients').delete().eq('id', id)
      showToast('success', 'Ingrediente excluído!')
      load()
    } catch {
      showToast('error', 'Erro ao excluir')
    }
  }

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="page-container">
      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.message}</div>
      )}

      <div className="page-header">
        <div>
          <h1>Ingredientes</h1>
          <p>Gerencie todos os ingredientes da sua confeitaria</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Novo Ingrediente
        </button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div className="search-bar">
          <Search size={18} />
          <input
            placeholder="Buscar ingrediente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="table-container">
          {[1,2,3,4,5].map(i => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}>
              <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '30%', height: 14 }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Wheat size={48} />
            <h3>Nenhum ingrediente encontrado</h3>
            <p>Comece adicionando seus ingredientes</p>
            <button className="btn btn-primary" onClick={openNew}>
              <Plus size={18} /> Adicionar Ingrediente
            </button>
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Qtd. Compra</th>
                <th>Unidade</th>
                <th>Preço Compra</th>
                <th>Preço/Unid.</th>
                <th>Ano</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.name}</td>
                  <td>{item.purchase_quantity}</td>
                  <td>{item.purchase_unit}</td>
                  <td>{formatCurrency(item.purchase_price)}</td>
                  <td className="text-muted">
                    {item.purchase_quantity > 0
                      ? formatCurrency(item.purchase_price / item.purchase_quantity)
                      : '-'
                    }/{item.purchase_unit}
                  </td>
                  <td>{item.updated_year}</td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost btn-icon" onClick={() => openEdit(item)} title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(item.id)} title="Excluir" style={{ color: 'var(--danger-500)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Editar Ingrediente' : 'Novo Ingrediente'}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Nome *</label>
                <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Farinha de trigo" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Qtd. Compra</label>
                  <input className="form-input" type="number" step="0.01" value={form.purchase_quantity} onChange={e => setForm({ ...form, purchase_quantity: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Unidade</label>
                  <select className="form-select" value={form.purchase_unit} onChange={e => setForm({ ...form, purchase_unit: e.target.value })}>
                    <option value="g">Gramas (g)</option>
                    <option value="kg">Quilos (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="L">Litros (L)</option>
                    <option value="un">Unidade (un)</option>
                    <option value="dz">Dúzia (dz)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Preço de Compra (R$)</label>
                  <input className="form-input" type="number" step="0.01" value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ano de Atualização</label>
                  <input className="form-input" type="number" value={form.updated_year} onChange={e => setForm({ ...form, updated_year: parseInt(e.target.value) || new Date().getFullYear() })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Observações</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas adicionais..." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : (editing ? 'Atualizar' : 'Criar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Wheat(props: { size: number }) {
  return <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 22 16 8"/><path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"/><path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"/><path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/><path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z"/></svg>
}
