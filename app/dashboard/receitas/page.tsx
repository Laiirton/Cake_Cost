'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, Pencil, Trash2, X, BookOpen } from 'lucide-react'

interface Recipe {
  id: string
  name: string
  category: string
  size_label: string
  yield_label: string
  notes: string
  items: Array<{ ingredient_id: string; quantity: number; unit: string }>
  display_order: number
}

const emptyRecipe = {
  name: '',
  category: '',
  size_label: '',
  yield_label: '',
  notes: '',
  items: [] as Array<{ ingredient_id: string; quantity: number; unit: string }>,
  display_order: 0,
}

export default function ReceitasPage() {
  const [items, setItems] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Recipe | null>(null)
  const [form, setForm] = useState(emptyRecipe)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const { data } = await supabase.from('recipes').select('*').order('display_order')
    setItems(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const showToast = (type: string, message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const openNew = () => { setEditing(null); setForm(emptyRecipe); setShowModal(true) }
  const openEdit = (item: Recipe) => {
    setEditing(item)
    setForm({ name: item.name, category: item.category, size_label: item.size_label, yield_label: item.yield_label, notes: item.notes, items: item.items || [], display_order: item.display_order })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      if (editing) {
        const { error } = await supabase.from('recipes').update(form).eq('id', editing.id)
        if (error) throw error
        showToast('success', 'Receita atualizada!')
      } else {
        const { error } = await supabase.from('recipes').insert({ ...form, id: crypto.randomUUID() })
        if (error) throw error
        showToast('success', 'Receita criada!')
      }
      setShowModal(false); load()
    } catch { showToast('error', 'Erro ao salvar') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta receita?')) return
    await supabase.from('recipes').delete().eq('id', id)
    showToast('success', 'Excluída!'); load()
  }

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase()))

  const categories = [...new Set(items.map(i => i.category))].filter(Boolean)

  return (
    <div className="page-container">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <div><h1>Receitas</h1><p>Gerencie suas receitas e composições</p></div>
        <button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Nova Receita</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar"><Search size={18} /><input placeholder="Buscar receita..." value={search} onChange={e => setSearch(e.target.value)} /></div>
      </div>

      {loading ? (
        <div className="table-container">
          {[1,2,3,4].map(i => <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-light)' }}><div className="skeleton" style={{ width: '50%', height: 16, marginBottom: 8 }} /><div className="skeleton" style={{ width: '30%', height: 14 }} /></div>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card"><div className="empty-state"><BookOpen size={48} /><h3>Nenhuma receita encontrada</h3><p>Crie suas receitas para começar</p><button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Criar Receita</button></div></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Nome</th><th>Categoria</th><th>Tamanho</th><th>Rendimento</th><th>Itens</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id}>
                  <td className="font-semibold">{item.name}</td>
                  <td><span className="badge badge-brand">{item.category || '-'}</span></td>
                  <td>{item.size_label || '-'}</td>
                  <td>{item.yield_label || '-'}</td>
                  <td><span className="badge badge-neutral">{(item.items || []).length} itens</span></td>
                  <td><div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn btn-ghost btn-icon" onClick={() => openEdit(item)}><Pencil size={16} /></button>
                    <button className="btn btn-ghost btn-icon" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger-500)' }}><Trash2 size={16} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Editar Receita' : 'Nova Receita'}</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Bolo de Chocolate" /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Categoria</label>
                  <input className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ex: Bolos" list="categories" />
                  <datalist id="categories">{categories.map(c => <option key={c} value={c} />)}</datalist>
                </div>
                <div className="form-group"><label className="form-label">Tamanho</label><input className="form-input" value={form.size_label} onChange={e => setForm({ ...form, size_label: e.target.value })} placeholder="Ex: Grande" /></div>
              </div>
              <div className="form-group"><label className="form-label">Rendimento</label><input className="form-input" value={form.yield_label} onChange={e => setForm({ ...form, yield_label: e.target.value })} placeholder="Ex: 20 fatias" /></div>
              <div className="form-group"><label className="form-label">Observações</label><textarea className="form-textarea" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
