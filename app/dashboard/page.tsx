'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
} from 'lucide-react'

interface DashboardData {
  totalOrders: number
  totalCustomers: number
  totalRevenue: number
  totalIngredients: number
  recentOrders: Array<{
    id: string
    title: string
    status: string
    sale_price: number
    event_date: string
    customer_name?: string
  }>
  upcomingTasks: Array<{
    id: string
    title: string
    status: string
    due_at: string
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalIngredients: 0,
    recentOrders: [],
    upcomingTasks: [],
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, customersRes, ingredientsRes, recentOrdersRes, tasksRes] = await Promise.all([
        supabase.from('orders').select('id, sale_price', { count: 'exact' }),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('ingredients').select('id', { count: 'exact' }),
        supabase.from('orders').select('id, title, status, sale_price, event_date, customer_id, customers(name)').order('event_date', { ascending: false }).limit(5),
        supabase.from('production_tasks').select('id, title, status, due_at').order('due_at', { ascending: true }).limit(5),
      ])

      const totalRevenue = ordersRes.data?.reduce((sum, o) => sum + (o.sale_price || 0), 0) || 0

      setData({
        totalOrders: ordersRes.count || 0,
        totalCustomers: customersRes.count || 0,
        totalRevenue,
        totalIngredients: ingredientsRes.count || 0,
        recentOrders: (recentOrdersRes.data || []).map((o: Record<string, unknown>) => ({
          ...o,
          customer_name: (o.customers as Record<string, unknown>)?.name as string | undefined,
        })) as DashboardData['recentOrders'],
        upcomingTasks: (tasksRes.data || []) as DashboardData['upcomingTasks'],
      })
    } catch (err) {
      console.error('Error loading dashboard:', err)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      in_progress: 'badge-brand',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      delivered: 'badge-success',
      todo: 'badge-neutral',
      doing: 'badge-warning',
      done: 'badge-success',
    }
    return map[status] || 'badge-neutral'
  }

  const statusLabels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    in_progress: 'Em Produção',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    delivered: 'Entregue',
    todo: 'A fazer',
    doing: 'Fazendo',
    done: 'Feito',
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '40%', height: 16 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Painel de Controle</h1>
          <p>Visão geral da sua confeitaria</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><ShoppingBag size={24} /></div>
          <div className="stat-value">{data.totalOrders}</div>
          <div className="stat-label">Pedidos Totais</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users size={24} /></div>
          <div className="stat-value">{data.totalCustomers}</div>
          <div className="stat-label">Clientes Cadastrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><DollarSign size={24} /></div>
          <div className="stat-value">{formatCurrency(data.totalRevenue)}</div>
          <div className="stat-label">Receita Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={24} /></div>
          <div className="stat-value">{data.totalIngredients}</div>
          <div className="stat-label">Ingredientes</div>
        </div>
      </div>

      <div className="grid-2">
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={18} />
              Pedidos Recentes
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {data.recentOrders.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <ShoppingBag size={40} style={{ color: 'var(--gray-300)', margin: '0 auto 12px' }} />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pedido</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.title}</div>
                        <div className="text-xs text-muted">{order.customer_name}</div>
                      </td>
                      <td className="text-sm">{formatDate(order.event_date)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(order.status)}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </td>
                      <td className="text-right font-semibold">{formatCurrency(order.sale_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} />
              Próximas Tarefas
            </h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {data.upcomingTasks.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <ListChecks size={40} style={{ color: 'var(--gray-300)', margin: '0 auto 12px' }} />
                <p>Nenhuma tarefa pendente</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tarefa</th>
                    <th>Prazo</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.upcomingTasks.map((task) => (
                    <tr key={task.id}>
                      <td className="font-semibold">{task.title}</td>
                      <td className="text-sm">{formatDate(task.due_at)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(task.status)}`}>
                          {statusLabels[task.status] || task.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ListChecks(props: { size: number; style?: React.CSSProperties }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={props.style}>
      <path d="M10 6H21"/><path d="M10 12H21"/><path d="M10 18H21"/><polyline points="3 6 4 7 6 5"/><polyline points="3 12 4 13 6 11"/><polyline points="3 18 4 19 6 17"/>
    </svg>
  )
}
