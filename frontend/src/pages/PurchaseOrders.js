import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, message, Drawer, DatePicker, Tag, Popconfirm, Row, Col, Statistic } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckCircleOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '../api/apiClient';
import OrderLineItems from '../components/OrderLineItems';
import { useAuthStore } from '../store/store';

function PurchaseOrders() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchOrders(pagination.current, pagination.pageSize);
    fetchProducts();
  }, [searchTerm, statusFilter]);

  const fetchOrders = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = { page, limit: pageSize };
      if (searchTerm) params.search = searchTerm;
      if (statusFilter) params.status = statusFilter;
      const response = await apiClient.get('/purchase-orders', { params });
      const data = response.data?.data || response.data || [];
      const total = response.data?.pagination?.total || data.length;
      setOrders(data);
      setPagination({ current: page, pageSize, total });
    } catch (error) {
      message.error('Error fetching purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await apiClient.get('/products', { params: { limit: 1000 } });
      const products = response.data?.data || response.data || [];
      setProducts(products);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const showModal = (order = null) => {
    if (order) {
      setEditingId(order.id);
      form.setFieldsValue({
        ...order,
        po_date: order.po_date ? dayjs(order.po_date) : undefined,
        expected_delivery_date: order.expected_delivery_date ? dayjs(order.expected_delivery_date) : undefined,
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
        po_date: values.po_date?.format('YYYY-MM-DD'),
        expected_delivery_date: values.expected_delivery_date?.format('YYYY-MM-DD'),
      };

      if (editingId) {
        await apiClient.put(`/purchase-orders/${editingId}`, payload);
        message.success('Purchase order updated');
      } else {
        await apiClient.post('/purchase-orders', payload);
        message.success('Purchase order created');
      }
      setIsModalOpen(false);
      fetchOrders(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.message || 'Error saving purchase order');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/purchase-orders/${id}`);
      message.success('Purchase order deleted');
      fetchOrders(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Error deleting purchase order');
    }
  };

  const handleReceive = async (id) => {
    try {
      await apiClient.post(`/purchase-orders/${id}/receive`);
      message.success('Purchase order received and inventory updated');
      setDrawerOpen(false);
      fetchOrders(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error(error.response?.data?.message || 'Error receiving purchase order');
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      setLoading(true);
      await apiClient.post(`/purchase-orders/${orderId}/confirm`);
      message.success('Purchase order confirmed');
      fetchOrders(pagination.current, pagination.pageSize);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: 'confirmed' });
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Error confirming order');
    } finally {
      setLoading(false);
    }
  };

  const showDrawer = (order) => {
    setSelectedOrder(order);
    setDrawerOpen(true);
  };

  const handleItemsChange = () => {
    fetchOrders(pagination.current, pagination.pageSize);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'blue',
      confirmed: 'orange',
      received: 'green',
      cancelled: 'red',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'PO #',
      dataIndex: 'po_number',
      key: 'po_number',
      width: 120,
    },
    {
      title: 'Order Date',
      dataIndex: 'po_date',
      key: 'po_date',
      render: (date) => (date ? dayjs(date).format('YYYY-MM-DD') : 'N/A'),
    },
    {
      title: 'Total Amount',
      dataIndex: 'total_amount',
      key: 'total',
      render: (total) => `$${total?.toFixed(2) || '0.00'}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
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
          <Button size="small" onClick={() => showDrawer(record)}>
            Details
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
            disabled={record.status !== 'pending'}
          />
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <Popconfirm
              title="Delete"
              description="Delete this PO?"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button size="small" danger icon={<DeleteOutlined />} disabled={record.status !== 'pending'} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Purchase Orders</h1>
        <Space>
          <Input.Search placeholder="Search PO #" allowClear onSearch={value => setSearchTerm(value)} style={{ width: 200 }} />
          <Select placeholder="Status" allowClear style={{ width: 150 }} onChange={value => setStatusFilter(value)}>
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="confirmed">Confirmed</Select.Option>
            <Select.Option value="received">Received</Select.Option>
            <Select.Option value="cancelled">Cancelled</Select.Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            Create PO
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
          onChange: (page, pageSize) => fetchOrders(page, pageSize),
        }}
      />

      <Modal
        title={editingId ? 'Edit Purchase Order' : 'Create Purchase Order'}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="supplier_name" label="Supplier Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="po_date" label="Order Date" rules={[{ required: true }]}>
            <DatePicker />
          </Form.Item>
          <Form.Item name="expected_delivery_date" label="Expected Delivery Date">
            <DatePicker />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`PO #${selectedOrder?.po_number}`}
        placement="right"
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
        width={900}
      >
        {selectedOrder && (
          <div>
            <Row gutter={16} style={{ marginBottom: '24px' }}>
              <Col span={8}>
                <Statistic title="Status" value={selectedOrder.status.toUpperCase()} />
              </Col>
              <Col span={8}>
                <Statistic title="Supplier" value={selectedOrder.supplier_name} />
              </Col>
              <Col span={8}>
                <Statistic title="Total Amount" value={`$${selectedOrder.total_amount?.toFixed(2) || '0.00'}`} />
              </Col>
            </Row>

            <OrderLineItems
              orderId={selectedOrder.id}
              orderStatus={selectedOrder.status}
              items={selectedOrder.PurchaseOrderItems || []}
              products={products}
              onItemsChange={handleItemsChange}
              isPurchaseOrder={true}
            />

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              {selectedOrder.status === 'confirmed' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleReceive(selectedOrder.id)}
                >
                  Receive Order
                </Button>
              )}
              <Button onClick={() => setDrawerOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default PurchaseOrders;
