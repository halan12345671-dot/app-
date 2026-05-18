import create from 'zustand';

export const useAuthStore = create((set) => {
  const savedUser = localStorage.getItem('user');
  let initialUser = null;
  try {
    if (savedUser) initialUser = JSON.parse(savedUser);
  } catch (e) {}

  return {
    user: initialUser,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),

    login: (user, token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      set({ user: null, token: null, isAuthenticated: false });
    },

    setUser: (user) => {
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    },
  };
});

export const useCustomerStore = create((set) => ({
  customers: [],
  loading: false,

  setCustomers: (customers) => set({ customers }),
  setLoading: (loading) => set({ loading }),

  addCustomer: (customer) =>
    set((state) => ({ customers: [...state.customers, customer] })),

  updateCustomer: (id, customer) =>
    set((state) => ({
      customers: state.customers.map((c) => (c.id === id ? customer : c)),
    })),

  deleteCustomer: (id) =>
    set((state) => ({
      customers: state.customers.filter((c) => c.id !== id),
    })),
}));

export const useProductStore = create((set) => ({
  products: [],
  loading: false,

  setProducts: (products) => set({ products }),
  setLoading: (loading) => set({ loading }),

  addProduct: (product) =>
    set((state) => ({ products: [...state.products, product] })),

  updateProduct: (id, product) =>
    set((state) => ({
      products: state.products.map((p) => (p.id === id ? product : p)),
    })),

  deleteProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),
}));

export const useInventoryStore = create((set) => ({
  inventory: [],
  loading: false,

  setInventory: (inventory) => set({ inventory }),
  setLoading: (loading) => set({ loading }),

  updateInventory: (id, item) =>
    set((state) => ({
      inventory: state.inventory.map((i) => (i.id === id ? item : i)),
    })),
}));

export const useSalesOrderStore = create((set) => ({
  orders: [],
  loading: false,

  setOrders: (orders) => set({ orders }),
  setLoading: (loading) => set({ loading }),

  addOrder: (order) =>
    set((state) => ({ orders: [...state.orders, order] })),

  updateOrder: (id, order) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? order : o)),
    })),

  deleteOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    })),
}));

export const usePurchaseOrderStore = create((set) => ({
  orders: [],
  loading: false,

  setOrders: (orders) => set({ orders }),
  setLoading: (loading) => set({ loading }),

  addOrder: (order) =>
    set((state) => ({ orders: [...state.orders, order] })),

  updateOrder: (id, order) =>
    set((state) => ({
      orders: state.orders.map((o) => (o.id === id ? order : o)),
    })),

  deleteOrder: (id) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    })),
}));
