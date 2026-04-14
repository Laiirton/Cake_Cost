'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, Trash2, X, Calculator } from 'lucide-react'

interface Preset {
  id: string; name: string; recipe_id: string; size_label: string; servings: number; markup_pct: number; labor_hours: number; labor_hour_rate: number; fixed_cost: number; packaging_cost: number; delivery_cost: number; extra_items: unknown[]; notes: string; display_order: number
  recipes?: { name: string }
}

interface Recipe { id: string; name: string }

export default function CalculadoraPage() {
  const [items, setItems] = useState<Preset[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Preset | null>(null)
  const [form, setForm] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null)
  const supabase = createClient()

  const load = useCallback(async () => {
    const [presetsRes, recipesRes] = await Promise.all([
      supabase.from('calculator_presets').select('*, recipes(name)').order('display_order'),
      supabase.from('recipes').select('id, name').order('name'),
    ])
    setItems(presetsRes.data || [])
    setRecipes(recipesRes.data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])
  const showToast = (type: string, message: string) => { setToast({ type, message }); setTimeout(() => setToast(null), 3000) }

  const openNew = () => { setEditing(null); setForm({ name: '', recipe_id: recipes[0]?.id || '', size_label: '', servings: 0, markup_pct: 0, labor_hours: 0, labor_hour_rate: 0, fixed_cost: 0, packaging_cost: 0, delivery_cost: 0, extra_items: [], notes: '', display_order: 0 }); setShowModal(true) }
  const openEdit = (item: Preset) => { setEditing(item); setForm({ name: item.name, recipe_id: item.recipe_id, size_label: item.size_label, servings: item.servings, markup_pct: item.markup_pct, labor_hours: item.labor_hours, labor_hour_rate: item.labor_hour_rate, fixed_cost: item.fixed_cost, packaging_cost: item.packaging_cost, delivery_cost: item.delivery_cost, extra_items: item.extra_items, notes: item.notes, display_order: item.display_order }); setShowModal(true) }

  const handleSave = async () => {
    if (!(form.name as string)?.trim()) return
    setSaving(true)
    try {
      if (editing) { await supabase.from('calculator_presets').update(form).eq('id', editing.id); showToast('success', 'Atualizado!') }
      else { await supabase.from('calculator_presets').insert({ ...form, id: crypto.randomUUID() }); showToast('success', 'Criado!') }
      setShowModal(false); load()
    } catch { showToast('error', 'Erro') } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir preset?')) return
    await supabase.from('calculator_presets').delete().eq('id', id); showToast('success', 'Excluído!'); load()
  }

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="page-container">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}
      <div className="page-header"><div><h1>Calculadora de Preços</h1><p>Presets de cálculo de custo e preço</p></div><button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Novo Preset</button></div>

      {loading ? <div className="table-container">{[1,2,3].map(i => <div key={i} style={{ padding: 14, borderBottom: '1px solid var(--border-light)' }}><div className="skeleton" style={{ width: '50%', height: 16 }} /></div>)}</div> : items.length === 0 ? (
        <div className="card"><div className="empty-state"><Calculator size={48} /><h3>Nenhum preset</h3><p>Crie presets para calcular preços rapidamente</p><button className="btn btn-primary" onClick={openNew}><Plus size={18} /> Criar</button></div></div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead><tr><th>Nome</th><th>Receita</th><th>Tamanho</th><th>Porções</th><th>Markup</th><th>Mão de obra</th><th>Embalagem</th><th style={{ textAlign: 'right' }}>Ações</th></tr></thead>
            <tbody>{items.map(item => (
              <tr key={item.id}>
                <td className="font-semibold">{item.name}</td>
                <td>{item.recipes?.name || '-'}</td>
                <td>{item.size_label || '-'}</td>
                <td>{item.servings}</td>
                <td><span className="badge badge-brand">{item.markup_pct}%</span></td>
                <td>{item.labor_hours}h × {formatCurrency(item.labor_hour_rate)}</td>
                <td>{formatCurrency(item.packaging_cost)}</td>
                <td><div className="table-actions" style={{ justifyContent: 'flex-end' }}><button className="btn btn-ghost btn-icon" onClick={() => openEdit(item)}><Pencil size={16} /></button><button className="btn btn-ghost btn-icon" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger-500)' }}><Trash2 size={16} /></button></div></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>{editing ? 'Editar Preset' : 'Novo Preset'}</h2><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Nome *</label><input className="form-input" value={(form.name as string) || ''} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Receita</label><select className="form-select" value={(form.recipe_id as string) || ''} onChange={e => setForm({ ...form, recipe_id: e.target.value })}><option value="">Selecione...</option>{recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Tamanho</label><input className="form-input" value={(form.size_label as string) || ''} onChange={e => setForm({ ...form, size_label: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Porções</label><input className="form-input" type="number" value={(form.servings as number) || 0} onChange={e => setForm({ ...form, servings: parseInt(e.target.value) || 0 })} /></div>
                <div className="form-group"><label className="form-label">Markup (%)</label><input className="form-input" type="number" step="0.1" value={(form.markup_pct as number) || 0} onChange={e => setForm({ ...form, markup_pct: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Horas de Trabalho</label><input className="form-input" type="number" step="0.5" value={(form.labor_hours as number) || 0} onChange={e => setForm({ ...form, labor_hours: parseFloat(e.target.value) || 0 })} /></div>
                <div className="form-group"><label className="form-label">Valor/Hora (R$)</label><input className="form-input" type="number" step="0.01" value={(form.labor_hour_rate as number) || 0} onChange={e => setForm({ ...form, labor_hour_rate: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Custo Fixo (R$)</label><input className="form-input" type="number" step="0.01" value={(form.fixed_cost as number) || 0} onChange={e => setForm({ ...form, fixed_cost: parseFloat(e.target.value) || 0 })} /></div>
                <div className="form-group"><label className="form-label">Embalagem (R$)</label><input className="form-input" type="number" step="0.01" value={(form.packaging_cost as number) || 0} onChange={e => setForm({ ...form, packaging_cost: parseFloat(e.target.value) || 0 })} /></div>
              </div>
              <div className="form-group"><label className="form-label">Entrega (R$)</label><input className="form-input" type="number" step="0.01" value={(form.delivery_cost as number) || 0} onChange={e => setForm({ ...form, delivery_cost: parseFloat(e.target.value) || 0 })} /></div>
              <div className="form-group"><label className="form-label">Observações</label><textarea className="form-textarea" value={(form.notes as string) || ''} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Atualizar' : 'Criar'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
