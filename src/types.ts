export interface Customer {
  id: string; // Unique ID (e.g. timestamp)
  name: string; // Contact name
  building: string; // 楼栋号
  room: string; // 房号
  phone: string; // Phone or WeChat ID
  notes?: string; // Any notes
  lastDeliverTime?: string; // 上次送达时间
}

export interface Order {
  id: string; // Unique Order ID
  customerId: string; // Link to Customer
  date: string; // Date string (YYYY-MM-DD)
  status: 'pending' | 'delivered'; // Delivery status
  orderTime?: string; // 下单时间
  deliverTime?: string; // 送达时间
}
