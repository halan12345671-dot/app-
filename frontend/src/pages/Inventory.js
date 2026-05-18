import React, { useEffect, useState } from 'react';
import { Table, message } from 'antd';
import apiClient from '../api/apiClient';
import { useInventoryStore } from '../store/store';

function Inventory() {
  const { inventory, setInventory } = useInventoryStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/inventory');
      setInventory(response.data);
    } catch (error) {
      message.error('Error fetching inventory');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'Product', dataIndex: ['Product', 'name'], key: 'product_name' },
    { title: 'SKU', dataIndex: ['Product', 'sku'], key: 'sku' },
    { title: 'On Hand', dataIndex: 'quantity_on_hand', key: 'qty_on_hand' },
    { title: 'Reserved', dataIndex: 'quantity_reserved', key: 'qty_reserved' },
    { title: 'Available', dataIndex: 'quantity_available', key: 'qty_available' },
    { title: 'Warehouse Location', dataIndex: 'warehouse_location', key: 'location' },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Inventory Management</h1>
      <Table
        columns={columns}
        dataSource={inventory}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}

export default Inventory;
