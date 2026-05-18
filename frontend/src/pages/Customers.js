import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import apiClient from '../api/apiClient';
import { useCustomerStore, useAuthStore } from '../store/store';

import { exportToExcel, exportToPDF } from '../utils/exportUtils';

function Customers() {
  const { user } = useAuthStore();
  const { customers, setCustomers } = useCustomerStore();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/customers', { params: { search, status: statusFilter, limit: 1000 } });
      setCustomers(response.data.data || response.data);
    } catch (error) {
      message.error('Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter]);

  const handleExportExcel = () => {
    const data = customers.map(c => ({
      'Company Name': c.company_name,
      'Contact': c.contact_person,
      'Email': c.email,
      'Phone': c.phone,
      'City': c.city,
      'Country': c.country
    }));
    exportToExcel(data, 'customers_list');
  };

  const handleExportPDF = () => {
    const headers = ['Company Name', 'Contact', 'Email', 'Phone', 'City'];
    const data = customers.map(c => [
      c.company_name, c.contact_person || 'N/A', c.email, c.phone || 'N/A', c.city || 'N/A'
    ]);
    exportToPDF(headers, data, 'Customers List', 'customers_list');
  };

  const showModal = (customer = null) => {
    if (customer) {
      setEditingId(customer.id);
      form.setFieldsValue(customer);
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
        await apiClient.put(`/customers/${editingId}`, values);
        message.success('Customer updated successfully');
      } else {
        await apiClient.post('/customers', values);
        message.success('Customer created successfully');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error saving customer');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/customers/${id}`);
      message.success('Customer deleted successfully');
      fetchCustomers();
    } catch (error) {
      message.error('Error deleting customer');
    }
  };

  const columns = [
    { title: 'Company Name', dataIndex: 'company_name', key: 'company_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'City', dataIndex: 'city', key: 'city' },
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
        <h1>Customers</h1>
        <Space>
          <Input.Search placeholder="Search Customers..." allowClear onSearch={value => setSearch(value)} style={{ width: 200 }} />
          <Select placeholder="Status" allowClear style={{ width: 120 }} onChange={value => setStatusFilter(value)}>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="inactive">Inactive</Select.Option>
          </Select>
          <Button onClick={handleExportExcel}>Export Excel</Button>
          <Button onClick={handleExportPDF}>Export PDF</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Add Customer
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingId ? 'Edit Customer' : 'Add Customer'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="company_name"
            label="Company Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contact_person"
            label="Contact Person"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, type: 'email' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="city" label="City">
            <Input />
          </Form.Item>
          <Form.Item name="country" label="Country">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Customers;
