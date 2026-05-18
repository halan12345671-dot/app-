import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Space, Select, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';
import { useProductStore, useAuthStore } from '../store/store';

import { exportToExcel, exportToPDF } from '../utils/exportUtils';

function Products() {
  const { user } = useAuthStore();
  const { products, setProducts } = useProductStore();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/products', { params: { search, category: categoryFilter, limit: 1000 } });
      setProducts(response.data);
    } catch (error) {
      message.error('Error fetching products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter]);

  const handleExportExcel = () => {
    const data = products.map(p => ({
      'SKU': p.sku,
      'Name': p.name,
      'Category': p.category,
      'Unit Price': p.unit_price,
      'Cost Price': p.cost_price,
      'Unit': p.unit
    }));
    exportToExcel(data, 'products_list');
  };

  const handleExportPDF = () => {
    const headers = ['SKU', 'Name', 'Category', 'Unit Price', 'Cost Price'];
    const data = products.map(p => [
      p.sku, p.name, p.category || 'N/A', `$${p.unit_price}`, `$${p.cost_price}`
    ]);
    exportToPDF(headers, data, 'Products List', 'products_list');
  };

  const showModal = (product = null) => {
    if (product) {
      setEditingId(product.id);
      form.setFieldsValue(product);
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        await apiClient.put(`/products/${editingId}`, values);
        message.success('Product updated successfully');
      } else {
        await apiClient.post('/products', values);
        message.success('Product created successfully');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error saving product');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/products/${id}`);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      message.error('Error deleting product');
    }
  };

  const columns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Unit Price', dataIndex: 'unit_price', key: 'unit_price', render: (price) => `$${price}` },
    { title: 'Cost Price', dataIndex: 'cost_price', key: 'cost_price', render: (price) => `$${price}` },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => showModal(record)} />
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Products</h1>
        <Space>
          <Input.Search placeholder="Search Products..." allowClear onSearch={value => setSearch(value)} style={{ width: 200 }} />
          <Select placeholder="Category" allowClear style={{ width: 150 }} onChange={value => setCategoryFilter(value)}>
            <Select.Option value="Electronics">Electronics</Select.Option>
            <Select.Option value="Clothing">Clothing</Select.Option>
            <Select.Option value="Food">Food</Select.Option>
            <Select.Option value="Furniture">Furniture</Select.Option>
          </Select>
          <Button onClick={handleExportExcel}>Export Excel</Button>
          <Button onClick={handleExportPDF}>Export PDF</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Add Product
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? 'Edit Product' : 'Add Product'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="sku" label="SKU" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Category">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="unit_price" label="Unit Price" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="cost_price" label="Cost Price" rules={[{ required: true }]}>
            <InputNumber min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="unit" label="Unit">
            <Input placeholder="e.g., piece, box, kg" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Products;
