import { useState, useMemo } from 'react';
import { Plus, CheckCircle, Circle, Trash2, Calendar } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Customer, Order } from '../types';

export default function DeliveryList() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('meal-customers', []);
  const [orders, setOrders] = useLocalStorage<Order[]>('meal-orders', []);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [showDelivered, setShowDelivered] = useState(false);

  // Filter orders for today in UI, but actually we just display whatever is in 'meal-orders'.
  // However, we only show 'pending' and 'delivered' states.
  
  const now = new Date();
  const isAfterNoon = now.getHours() >= 12;
  
  const targetDate = new Date(now);
  if (isAfterNoon) {
    targetDate.setDate(targetDate.getDate() + 1);
  }
  
  const targetDateStr = targetDate.toLocaleDateString('zh-CN');
  const titleStr = isAfterNoon ? "明日配送" : "今日配送";

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;

  const handleCreateOrders = (selectedCustomerIds: string[]) => {
    // Exclude those already in the orders list
    const existingCustomerIds = orders.map(o => o.customerId);
    const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    const newOrders: Order[] = selectedCustomerIds
      .filter(id => !existingCustomerIds.includes(id))
      .map(id => ({
        id: Date.now().toString() + id,
        customerId: id,
        date: targetDateStr,
        status: 'pending',
        orderTime: nowTime
      }));
    
    setOrders([...orders, ...newOrders]);
    setIsSelectModalOpen(false);
  };

  const toggleStatus = (orderId: string) => {
    const orderToToggle = orders.find(o => o.id === orderId);
    if (!orderToToggle) return;

    const actualToday = new Date().toLocaleDateString('zh-CN');
    if (orderToToggle.date && orderToToggle.date !== actualToday) {
      // 检查该订单日期是否晚于今天（即是否真的是未来日期的订单）
      const orderDateObj = new Date(orderToToggle.date.replace(/\//g, '-')).getTime();
      const todayDateObj = new Date(actualToday.replace(/\//g, '-')).getTime();
      
      // 如果属于未来才需要配送的单子，弹窗拦截禁止打卡
      if (orderDateObj > todayDateObj) {
        alert("⚠️ 该订单属于【未来/明日】的配送任务。\n\n请在配送任务到达当天，再进行“已送达”的勾选打卡操作！");
        return;
      }
    }

    const nowTime = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    setOrders(orders.map(o => {
      if (o.id === orderId) {
        const isPending = o.status === 'pending';
        
        if (isPending) {
          setCustomers((prevCustomers: Customer[]) => prevCustomers.map(c => {
            if (c.id === o.customerId) {
              return { ...c, lastDeliverTime: `${actualToday} ${nowTime}` };
            }
            return c;
          }));
        }

        return { 
          ...o, 
          status: isPending ? 'delivered' : 'pending',
          deliverTime: isPending ? nowTime : undefined
        };
      }
      return o;
    }));
  };

  const removeOrder = (orderId: string) => {
    if (confirm("确定要将此订单移出配送清单吗？")) {
      setOrders(orders.filter(o => o.id !== orderId));
    }
  };

  const clearToday = () => {
    if (confirm(`确定要清空当前所有配送清单吗？\n(这通常在准备新一轮订餐前操作)`)) {
      setOrders([]);
    }
  };

  const getCustomer = (id: string) => customers.find(c => c.id === id);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const cA = getCustomer(a.customerId);
      const cB = getCustomer(b.customerId);
      if (!cA || !cB) return 0;
      
      const buildingCmp = (cA.building || '').localeCompare(cB.building || '', 'zh-CN', { numeric: true });
      if (buildingCmp !== 0) return buildingCmp;
      
      return (cA.room || '').localeCompare(cB.room || '', 'zh-CN', { numeric: true });
    });
  }, [orders, customers]);

  return (
    <div>
      <header className="app-header">
        <h1>{titleStr}</h1>
        <p className="flex items-center gap-2 mt-4"><Calendar size={14}/> {targetDateStr}</p>
        <div className="flex justify-between items-center mt-4" style={{ marginTop: '16px' }}>
          <div>
            <span style={{ fontSize: '14px', opacity: 0.9 }}>总计: {orders.length} 份</span>
            <span style={{ margin: '0 8px' }}>|</span>
            <span style={{ fontSize: '14px', color: '#ffd32a' }}>待送: {pendingCount}</span>
            <span style={{ margin: '0 8px' }}>|</span>
            <span style={{ fontSize: '14px', color: '#1dd1a1' }}>已送: {deliveredCount}</span>
          </div>
          <button 
            onClick={clearToday}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}
          >
            一键清空
          </button>
        </div>
      </header>

      <div className="container" style={{ paddingBottom: '100px' }}>
        {orders.length === 0 ? (
          <div className="empty-state">
            <TruckPlaceholder />
            <h3>清单为空</h3>
            <p className="mt-4">点击下方按钮，从通讯录中勾选今天的订餐顾客</p>
          </div>
        ) : (
          <>
            {sortedOrders.filter(o => o.status !== 'delivered').map(order => {
              const customer = getCustomer(order.customerId);
              if (!customer) return null;
              
              return (
                <div key={order.id} className="card flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1" onClick={() => toggleStatus(order.id)} style={{ cursor: 'pointer' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                      <Circle size={28} />
                    </div>
                    <div>
                      <div className="card-title">
                        {customer.name}
                      </div>
                      {(customer.building || customer.room) && (
                        <div className="card-subtitle mt-4">
                          地址: {customer.building ? `${customer.building}栋/区 ` : ''}{customer.room ? `${customer.room}室` : ''}
                        </div>
                      )}
                      <div className="card-subtitle mt-4" style={{ fontSize: '12px' }}>
                        <span style={{ marginRight: '12px' }}>下单: {order.orderTime || '--:--'}</span>
                        {customer.lastDeliverTime && (
                          <span style={{ color: 'var(--primary)', opacity: 0.8 }}>上次: {customer.lastDeliverTime}</span>
                        )}
                      </div>
                      {customer.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>备注: {customer.notes}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 pl-4 border-l" style={{ borderLeft: '1px solid var(--border-color)', marginLeft: '12px' }}>
                    <button 
                      onClick={() => removeOrder(order.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {deliveredCount > 0 && !showDelivered && (
              <div className="text-center mt-6 mb-4">
                <button 
                  onClick={() => setShowDelivered(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', padding: '8px' }}
                >
                  展开已配送的 {deliveredCount} 份外卖 ⇣
                </button>
              </div>
            )}
            
            {showDelivered && sortedOrders.filter(o => o.status === 'delivered').map(order => {
              const customer = getCustomer(order.customerId);
              if (!customer) return null;
              
              return (
                <div key={order.id} className="card flex items-center justify-between" style={{ opacity: 0.6 }}>
                  <div className="flex items-center gap-4 flex-1" onClick={() => toggleStatus(order.id)} style={{ cursor: 'pointer' }}>
                    <div style={{ color: 'var(--success)' }}>
                      <CheckCircle size={28} />
                    </div>
                    <div>
                      <div className="card-title" style={{ textDecoration: 'line-through' }}>
                        {customer.name}
                      </div>
                      {(customer.building || customer.room) && (
                        <div className="card-subtitle mt-4">
                          地址: {customer.building ? `${customer.building}栋/区 ` : ''}{customer.room ? `${customer.room}室` : ''}
                        </div>
                      )}
                      <div className="card-subtitle mt-4" style={{ fontSize: '12px' }}>
                        <span style={{ marginRight: '12px' }}>下单: {order.orderTime || '--:--'}</span>
                        {order.deliverTime && (
                          <span style={{ color: 'var(--success)' }}>已送达: {order.deliverTime}</span>
                        )}
                      </div>
                      {customer.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--danger)', marginTop: '4px' }}>备注: {customer.notes}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 pl-4 border-l" style={{ borderLeft: '1px solid var(--border-color)', marginLeft: '12px' }}>
                    <button 
                      onClick={() => removeOrder(order.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {deliveredCount > 0 && showDelivered && (
              <div className="text-center mt-6 mb-4">
                <button 
                  onClick={() => setShowDelivered(false)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', padding: '8px' }}
                >
                  收起已配送的外卖 ⇡
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <button className="btn-floating" onClick={() => setIsSelectModalOpen(true)}>
        <Plus size={24} />
      </button>

      {isSelectModalOpen && (
        <SelectCustomerModal 
          customers={customers}
          existingOrders={orders}
          onClose={() => setIsSelectModalOpen(false)}
          onConfirm={handleCreateOrders}
          isAfterNoon={isAfterNoon}
        />
      )}
    </div>
  );
}

function SelectCustomerModal({ customers, existingOrders, onClose, onConfirm, isAfterNoon }: any) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showHidden, setShowHidden] = useState(false);
  
  const existingCustomerIds = useMemo(() => existingOrders.map((o: any) => o.customerId), [existingOrders]);
  const hiddenCount = useMemo(() => customers.filter((c: any) => existingCustomerIds.includes(c.id)).length, [customers, existingCustomerIds]);
  const visibleCustomers = useMemo(() => customers.filter((c: any) => showHidden || !existingCustomerIds.includes(c.id)), [customers, existingCustomerIds, showHidden]);
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content" style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header mb-4 flex justify-between">
          <h2 className="card-title" style={{ fontSize: '18px' }}>添加{isAfterNoon ? '明日' : '当日'}订单</h2>
          <span className="text-muted">已选: {selectedIds.length}</span>
        </div>
        
        <div style={{ overflowY: 'auto', flex: 1, margin: '16px -12px', padding: '0 12px' }}>
          {customers.length === 0 ? (
            <div className="text-center text-muted mt-4">请先到通讯录中添加顾客</div>
          ) : (
            visibleCustomers.map((c: any) => {
              const isAlreadyOrdered = existingCustomerIds.includes(c.id);
              const isSelected = selectedIds.includes(c.id);

              return (
                <div 
                  key={c.id} 
                  className="card flex items-center mb-4" 
                  onClick={() => !isAlreadyOrdered && toggleSelect(c.id)}
                  style={{ 
                    cursor: isAlreadyOrdered ? 'not-allowed' : 'pointer',
                    opacity: isAlreadyOrdered ? 0.5 : 1,
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    padding: '12px'
                  }}
                >
                  <div style={{ width: '24px', color: isSelected ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {isSelected ? <CheckCircle size={20} /> : <Circle size={20} />}
                  </div>
                  <div className="ml-4 flex-1 pl-4" style={{ paddingLeft: '12px' }}>
                    <div className="card-title">{c.name} {isAlreadyOrdered && '(已在清单中)'}</div>
                    <div className="card-subtitle text-xs">
                      {c.building ? `${c.building}栋/区 ` : ''}{c.room ? `${c.room}室` : ''}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          
          {!showHidden && hiddenCount > 0 && (
            <div className="text-center mt-2 mb-4">
              <button 
                onClick={() => setShowHidden(true)} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '13px', cursor: 'pointer', padding: '8px' }}
              >
                展开已在清单中的 {hiddenCount} 位顾客 ⇣
              </button>
            </div>
          )}
          {showHidden && hiddenCount > 0 && (
            <div className="text-center mt-2 mb-4">
              <button 
                onClick={() => setShowHidden(false)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', padding: '8px' }}
              >
                收起已在清单中的顾客 ⇡
              </button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '24px', paddingTop: '16px', paddingBottom: '16px', borderTop: '1px solid var(--border-color)' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose}>取消</button>
          <button 
            className="btn btn-primary" 
            style={{ flex: 1 }} 
            onClick={() => onConfirm(selectedIds)}
            disabled={selectedIds.length === 0}
          >
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
}

function TruckPlaceholder() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13"></rect>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
      <circle cx="5.5" cy="18.5" r="2.5"></circle>
      <circle cx="18.5" cy="18.5" r="2.5"></circle>
    </svg>
  );
}
