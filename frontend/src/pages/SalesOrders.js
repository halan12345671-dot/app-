import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Space, message, Drawer, Tag, Statistic, Row, Col, DatePicker, Select, Input } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../api/apiClient';
import { useSalesOrderStore, useAuthStore } from '../store/store';
import OrderLineItems from '../components/OrderLineItems';
import { generateInvoice } from '../utils/invoiceGenerator';

function SalesOrders() {
  const { user } = useAuthStore();
  const { orders, setOrders } = useSalesOrderStore();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);

  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize);
    fetchCustomers();
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter]);

  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      
      const response = await apiClient.get('/sales-orders', { params });
      setOrders(response.data.data);
      setPagination({ current: page, pageSize, total: response.data.pagination.total });
    } catch (error) {
      message.error('Error fetching sales orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await apiClient.get('/customers', { params: { limit: 1000 } });
      setCustomers(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products', { params: { limit: 1000 } });
      setProducts(response.data.data || response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const showModal = (order = null) => {
    if (order) {
      setEditingId(order.id);
      form.setFieldsValue({
        customer_id: order.customer_id,
        order_date: dayjs(order.order_date),
        due_date: dayjs(order.due_date),
        discount: order.discount,
      });
    } else {
      setEditingId(null);
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        order_date: values.order_date.format('YYYY-MM-DD'),
        due_date: values.due_date.format('YYYY-MM-DD'),
      };

      if (editingId) {
        await apiClient.put(`/sales-orders/${editingId}`, payload);
        message.success('Sales order updated');
      } else {
        await apiClient.post('/sales-orders', payload);
        message.success('Sales order created');
      }
      setIsModalOpen(false);
      fetchOrders();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error saving sales order');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/sales-orders/${id}`);
      message.success('Sales order deleted');
      fetchOrders();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error deleting sales order');
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      setLoading(true);
      await apiClient.post(`/sales-orders/${orderId}/confirm`);
      message.success('Order confirmed and inventory reserved');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'confirmed' });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error confirming order');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'default',
      confirmed: 'processing',
      shipped: 'warning',
      delivered: 'success',
      cancelled: 'error',
    };
    return colors[status] || 'default';
  };

  const columns = [
    { title: 'Order #', dataIndex: 'order_number', key: 'order_number', width: 100 },
    {
      title: 'Customer',
      dataIndex: ['Customer', 'company_name'],
      key: 'customer',
      render: (text, record) => record.Customer?.company_name || 'N/A',
    },
    { title: 'Order Date', dataIndex: 'order_date', key: 'order_date', width: 120 },
    {
      title: 'Total',
      dataIndex: 'total_amount',
      key: 'total_amount',
      align: 'right',
      render: (total) => `$${total?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            disabled={record.status !== 'pending'}
            onClick={() => handleConfirmOrder(record.id)}
          >
            Confirm
          </Button>
          <Button size="small" onClick={() => {
            setSelectedOrder(record);
            setDrawerOpen(true);
          }}>
            Details
          </Button>
          {record.status === 'pending' && (
            <>
              <Button icon={<EditOutlined />} size="small" onClick={() => showModal(record)} />
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <Button icon={<DeleteOutlined />} danger size="small" onClick={() => handleDelete(record.id)} />
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Sales Orders</h1>
        <Space>
          <Input.Search placeholder="Search SO #" allowClear onSearch={value => setSearchTerm(value)} style={{ width: 200 }} />
          <Select placeholder="Status" allowClear style={{ width: 150 }} onChange={value => setStatusFilter(value)}>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="confirmed">Confirmed</Select.Option>
            <Select.Option value="shipped">Shipped</Select.Option>
            <Select.Option value="delivered">Delivered</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            New Order
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize }),
        }}
        scroll={{ x: 1000 }}
      />

      <Modal
        title={editingId ? 'Edit Sales Order' : 'New Sales Order'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="customer_id"
            label="Customer"
            rules={[{ required: true, message: 'Please select a customer' }]}
          >
            <Select placeholder="Select customer">
              {customers.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.company_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="order_date"
            label="Order Date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="due_date"
            label="Due Date"
            rules={[{ required: true }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="discount" label="Discount Amount" initialValue={0}>
            <input type="number" min={0} step={0.01} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d9d9d9' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="Order Details"
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={900}
      >
        {selectedOrder && (
          <>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={12}>
                <Statistic title="Order Number" value={selectedOrder.order_number} />
              </Col>
              <Col span={12}>
                <Statistic title="Status" value={selectedOrder.status} />
              </Col>
              <Col span={12}>
                <Statistic title="Customer" value={selectedOrder.Customer?.company_name} />
              </Col>
              <Col span={12}>
                <Statistic title="Total Amount" value={`$${selectedOrder.total_amount?.toFixed(2)}`} />
              </Col>
            </Row>

            <OrderLineItems
              orderId={selectedOrder.id}
              orderStatus={selectedOrder.status}
              items={selectedOrder.SalesOrderItems || []}
              products={products}
              onItemsChange={fetchOrders}
            />

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <Button 
                type="primary" 
                icon={<CheckOutlined />} 
                onClick={() => generateInvoice(selectedOrder)}
              >
                Print Invoice (PDF)
              </Button>
              <Button onClick={() => setDrawerOpen(false)}>Close</Button>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}

export default SalesOrders;
