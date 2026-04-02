import { useState } from 'react';
import { Users, Truck } from 'lucide-react';
import CustomerList from './components/CustomerList';
import DeliveryList from './components/DeliveryList';

function App() {
  const [activeTab, setActiveTab] = useState<'delivery' | 'customers'>('delivery');

  return (
    <>
      {activeTab === 'delivery' ? <DeliveryList /> : <CustomerList />}

      <nav className="bottom-nav">
        <button 
          className={`nav-item ${activeTab === 'delivery' ? 'active' : ''}`}
          onClick={() => setActiveTab('delivery')}
        >
          <Truck size={24} />
          <span>配送</span>
        </button>
        <button 
          className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          <Users size={24} />
          <span>通讯录</span>
        </button>
      </nav>
    </>
  );
}

export default App;
