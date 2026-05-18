import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Popconfirm } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';

function OrderLineItems({ orderId, orderStatus, items = [], products = [], onItemsChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const showModal = (item = null) => {
    if (item) {
      setEditingItemId(item.id);
      form.setFieldsValue({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent || 0,
      });
    } else {
      setEditingItemId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (editingItemId) {
        // Update existing item
        await apiClient.put(`/sales-orders/${orderId}/items/${editingItemId}`, values);
        message.success('Line item updated');
      } else {
        // Add new item
        await apiClient.post(`/sales-orders/${orderId}/items`, values);
        message.success('Line item added');
      }

      setIsModalOpen(false);
      onItemsChange();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error saving line item');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      setLoading(true);
      await apiClient.delete(`/sales-orders/${orderId}/items/${itemId}`);
      message.success('Line item deleted');
      onItemsChange();
    } catch (error) {
      message.error('Error deleting line item');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: ['Product', 'name'],
      key: 'product',
      render: (text, record) => record.Product?.name || 'N/A',
    },
    {
      title: 'SKU',
      dataIndex: ['Product', 'sku'],
      key: 'sku',
      render: (text, record) => record.Product?.sku || 'N/A',
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right',
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      align: 'right',
      render: (price) => `$${price?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Discount %',
      dataIndex: 'discount_percent',
      key: 'discount_percent',
      align: 'center',
    },
    {
      title: 'Line Total',
      dataIndex: 'line_total',
      key: 'line_total',
      align: 'right',
      render: (total) => `$${total?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {orderStatus === 'pending' && (
            <>
              <Button size="small" onClick={() => showModal(record)}>
                Edit
              </Button>
              <Popconfirm
                title="Delete"
                description="Are you sure you want to delete this item?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h3>Line Items</h3>
        {orderStatus === 'pending' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Add Item
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={items}
        loading={loading}
        rowKey="id"
        pagination={false}
        scroll={{ x: 800 }}
      />

      <Modal
        title={editingItemId ? 'Edit Line Item' : 'Add Line Item'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        loading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="product_id"
            label="Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select placeholder="Select product" disabled={editingItemId !== null}>
              {products.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Quantity is required' }]}
          >
            <InputNumber min={1} />
          </Form.Item>

          <Form.Item
            name="unit_price"
            label="Unit Price"
            rules={[{ required: true, message: 'Unit price is required' }]}
          >
            <InputNumber min={0} step={0.01} />
          </Form.Item>

          <Form.Item name="discount_percent" label="Discount %" initialValue={0}>
            <InputNumber min={0} max={100} step={0.01} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderLineItems;
