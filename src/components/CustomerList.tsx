import { useState } from 'react';
import { Plus, Trash2, MapPin, MessageCircle, Edit2, Clock, Settings, Download, Upload } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Customer } from '../types';

export default function CustomerList() {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('meal-customers', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Customer>>({});
  
  const existingBuildings = Array.from(new Set(customers.map(c => c.building).filter(Boolean))).sort();

  const handleAdd = () => {
    if (!formData.name) {
      alert("请输入顾客姓名");
      return;
    }
    
    if (editingId) {
      setCustomers((prev: Customer[]) => prev.map(c => c.id === editingId ? {
        ...c,
        name: formData.name!,
        building: formData.building || '',
        room: formData.room || '',
        phone: formData.phone || '',
        notes: formData.notes || ''
      } : c));
    } else {
      const newCustomer: Customer = {
        id: Date.now().toString(),
        name: formData.name,
        building: formData.building || '',
        room: formData.room || '',
        phone: formData.phone || '',
        notes: formData.notes || ''
      };
      setCustomers((prev: Customer[]) => [...prev, newCustomer]);
    }
    
    setFormData({});
    setEditingId(null);
    setIsModalOpen(false);
  };

  const openEditModal = (customer: Customer) => {
    setFormData({
      name: customer.name,
      building: customer.building,
      room: customer.room,
      phone: customer.phone,
      notes: customer.notes
    });
    setEditingId(customer.id);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({});
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这位顾客吗？")) {
      setCustomers((prev: Customer[]) => prev.filter(c => c.id !== id));
    }
  };

  const exportData = () => {
    try {
      const customersData = localStorage.getItem('meal-customers');
      const ordersData = localStorage.getItem('meal-orders');
      
      const data = {
        customers: customersData ? JSON.parse(customersData) : [],
        orders: ordersData ? JSON.parse(ordersData) : []
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `送餐管家备份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("导出失败，出现异常");
    }
  };

  const importData = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ 危险操作警告：\n恢复数据将【彻底覆写】您本机当前的所有通讯录和订单数据！\n强烈建议在此之前先导出当前数据作为备份。\n\n您确定要继续覆盖吗？")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.customers && Array.isArray(data.customers) && data.orders && Array.isArray(data.orders)) {
          localStorage.setItem('meal-customers', JSON.stringify(data.customers));
          localStorage.setItem('meal-orders', JSON.stringify(data.orders));
          alert("数据恢复成功！正在重新加载...");
          window.location.reload();
        } else {
          alert("导入失败：备份文件格式不正确");
        }
      } catch (err) {
        alert("导入失败：无法解析该文件");
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <header className="app-header">
        <h1>通讯录</h1>
        <p>共 {customers.length} 位订餐客户</p>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          style={{ position: 'absolute', top: '44px', right: '20px', background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '4px' }}
        >
          <Settings size={22} />
        </button>
      </header>

      <div className="container" style={{ paddingBottom: '100px' }}>
        {customers.length === 0 ? (
          <div className="empty-state">
            <UsersPlaceholder />
            <h3>暂无顾客</h3>
            <p className="mt-4">点击右下角按钮添加第一位订餐客户</p>
          </div>
        ) : (
          customers.map(customer => (
            <div key={customer.id} className="card customer-item">
              <div className="customer-avatar">
                {customer.name.substring(0, 1)}
              </div>
              <div className="customer-info" style={{ flex: 1, overflow: 'hidden' }}>
                <div className="card-title font-semibold text-lg">{customer.name}</div>
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(customer.building || customer.room) && (
                    <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ flexShrink: 0 }} /> 
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {customer.building ? `${customer.building}栋/区 ` : ''}
                        {customer.room ? `${customer.room}室` : ''}
                      </span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="card-subtitle" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MessageCircle size={14} style={{ flexShrink: 0 }} /> 
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {customer.phone}
                      </span>
                    </div>
                  )}
                  {customer.notes && (
                    <div className="card-subtitle" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ fontSize: '13px', color: '#888', wordBreak: 'break-all' }}>
                        备注: {customer.notes}
                      </span>
                    </div>
                  )}
                  {customer.lastDeliverTime && (
                    <div className="card-subtitle mt-2" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)' }}>
                      <Clock size={14} style={{ flexShrink: 0 }} /> 
                      <span style={{ fontSize: '12px' }}>
                        上次送达: {customer.lastDeliverTime}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => openEditModal(customer)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '8px' }}
                >
                  <Edit2 size={20} />
                </button>
                <button 
                  onClick={() => handleDelete(customer.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '8px' }}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <button className="btn-floating" onClick={openAddModal}>
        <Plus size={24} />
      </button>

      {isModalOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          <div className="modal-content">
            <div className="card-header mb-4">
              <h2 className="card-title" style={{ fontSize: '20px' }}>{editingId ? "修改顾客" : "新增顾客"}</h2>
            </div>
            
            <div className="form-group">
              <label className="form-label">姓名/称呼</label>
              <input 
                className="form-input" 
                placeholder="例如：张哥" 
                value={formData.name || ''}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="flex gap-4">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">楼栋</label>
                <input 
                  className="form-input" 
                  placeholder="例如：1 或 A" 
                  list="buildings-list"
                  value={formData.building || ''}
                  onChange={e => setFormData({...formData, building: e.target.value})}
                />
                <datalist id="buildings-list">
                  {existingBuildings.map(b => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">房号</label>
                <input 
                  className="form-input" 
                  placeholder="例如：302" 
                  value={formData.room || ''}
                  onChange={e => setFormData({...formData, room: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">微信或电话 (选填)</label>
              <input 
                className="form-input" 
                placeholder="填写微信号或手机号" 
                value={formData.phone || ''}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label className="form-label">备注 (选填)</label>
              <input 
                className="form-input" 
                placeholder="例如：少加辣，不要香菜" 
                value={formData.notes || ''}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', paddingBottom: '16px' }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsModalOpen(false)}>取消</button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>保存</button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsSettingsOpen(false); }}>
          <div className="modal-content" style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))' }}>
            <div className="card-header mb-4">
              <h2 className="card-title" style={{ fontSize: '20px' }}>数据备份与恢复</h2>
            </div>
            
            <p className="text-muted mb-4" style={{ fontSize: '13px', lineHeight: 1.5 }}>
              如果在使用过程中更换手机、重置微信，或者清除了浏览器缓存，可能会导致本地存储的通讯录和所有订单记录不可逆地丢失。<br/><br/>
              强烈建议您养成偶尔【导出当前数据】发送到文件助手的习惯。
            </p>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginBottom: '16px' }}
              onClick={exportData}
            >
              <Download size={18} /> 导出当前所有数据备份
            </button>

            <div style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept=".json" 
                onChange={importData}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
              />
              <button 
                className="btn btn-outline" 
                style={{ width: '100%', borderColor: 'var(--text-muted)', color: 'var(--text-main)' }}
              >
                <Upload size={18} /> 获取文件覆盖恢复数据
              </button>
            </div>
            
            <button className="btn" style={{ width: '100%', marginTop: '24px', background: 'var(--bg-color)' }} onClick={() => setIsSettingsOpen(false)}>
              关闭面板
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function UsersPlaceholder() {
  return (
    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  );
}
