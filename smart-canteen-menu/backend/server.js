/**
 * Smart Canteen Menu - Backend Server
 * --------------------------------------------------------------------------
 * Express.js REST API + WebSocket Server + Supabase PostgreSQL Integration
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const { supabase, isConfigured, getSupabaseStatus } = require('./supabase');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files directly from the parent frontend directory
const frontendDir = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendDir));

// ============================================================================
// WEBSOCKET REAL-TIME SERVER
// ============================================================================
const wss = new WebSocketServer({ server });

function broadcast(eventType, payload) {
  const message = JSON.stringify({ type: eventType, data: payload, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    data: { message: 'Connected to Smart Canteen real-time event stream.' },
    timestamp: new Date().toISOString()
  }));

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err.message);
  });
});

// ============================================================================
// IN-MEMORY DEMO FALLBACK STORE (Active only when Supabase .env is not yet set)
// ============================================================================
let demoMenuItems = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    name: 'Crispy Masala Dosa',
    description: 'Golden thin crepe filled with spiced potato masala, served with coconut chutney & piping hot sambar.',
    price: 60.00,
    category: 'Breakfast',
    is_veg: true,
    is_available: true,
    preparation_time: 8,
    image_url: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    name: 'Classic Veg Burger & Fries',
    description: 'Crisp vegetable patty with iceberg lettuce, fresh tomatoes, creamy mayo in a toasted sesame bun.',
    price: 75.00,
    category: 'Snacks',
    is_veg: true,
    is_available: true,
    preparation_time: 10,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    name: 'Paneer Butter Masala Thali',
    description: 'Rich cottage cheese curry, 3 butter rotis, fragrant jeera rice, dal tadka, salad and sweet gulab jamun.',
    price: 120.00,
    category: 'Meals',
    is_veg: true,
    is_available: true,
    preparation_time: 12,
    image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    name: 'Iced Cold Coffee with Ice Cream',
    description: 'Chilled espresso blended with thick creamy milk, topped with a scoop of vanilla ice cream & cocoa drizzle.',
    price: 45.00,
    category: 'Beverages',
    is_veg: true,
    is_available: true,
    preparation_time: 5,
    image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111105',
    name: 'Delhi Samosa Chaat (2 Pcs)',
    description: 'Crushed golden samosas layered with spiced chole, sweet tamarind chutney, mint sauce & crispy sev.',
    price: 40.00,
    category: 'Snacks',
    is_veg: true,
    is_available: true,
    preparation_time: 6,
    image_url: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111106',
    name: 'Grilled Cheese Chicken Sandwich',
    description: 'Shredded smoked chicken, melted cheddar cheese, bell peppers & Italian herb seasoning grilled to perfection.',
    price: 85.00,
    category: 'Snacks',
    is_veg: false,
    is_available: true,
    preparation_time: 10,
    image_url: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111107',
    name: 'Special Chicken Dum Biryani',
    description: 'Aromatic basmati rice cooked with tender marinated chicken pieces, whole spices, served with mint raita.',
    price: 140.00,
    category: 'Meals',
    is_veg: false,
    is_available: true,
    preparation_time: 15,
    image_url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111108',
    name: 'Chole Bhature Platter',
    description: 'Two fluffy hot bhaturas accompanied by slow-cooked spicy Punjabi chole, pickled onions and fried green chili.',
    price: 90.00,
    category: 'Breakfast',
    is_veg: true,
    is_available: true,
    preparation_time: 10,
    image_url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111109',
    name: 'Masala Kulhad Chai',
    description: 'Strong brewed Assam tea infused with ginger, cardamom, and clove, served in an authentic earthen clay cup.',
    price: 20.00,
    category: 'Beverages',
    is_veg: true,
    is_available: true,
    preparation_time: 4,
    image_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111110',
    name: 'Cheesy Schezwan Maggi',
    description: 'Campus favorite 2-minute noodles tossed with spicy Schezwan sauce, sweet corn and grated mozzarella.',
    price: 50.00,
    category: 'Snacks',
    is_veg: true,
    is_available: true,
    preparation_time: 7,
    image_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Protein Sprout & Fruit Bowl',
    description: 'Moong sprouts, diced apples, pomegranate, cucumber, tossed with Himalayan pink salt and lemon mint dressing.',
    price: 65.00,
    category: 'Healthy',
    is_veg: true,
    is_available: true,
    preparation_time: 5,
    image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: '11111111-1111-1111-1111-111111111112',
    name: 'Fresh Mint Lemon Soda',
    description: 'Refreshing fizzy soda with squeezed yellow lemons, fresh mint leaves, roasted cumin, and black salt.',
    price: 30.00,
    category: 'Beverages',
    is_veg: true,
    is_available: true,
    preparation_time: 3,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  }
];

let demoOrders = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    token_number: 'CAN-101',
    student_name: 'Rahul Sharma',
    student_id: 'CS2024-042',
    phone: '+91 98765 43210',
    pickup_counter: 'Counter 1',
    special_instructions: 'Extra spicy sambar please',
    status: 'Ready',
    total_amount: 105.00,
    payment_method: 'UPI / Counter Pay',
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    order_items: [
      { id: '3301', item_name: 'Crispy Masala Dosa', price: 60.00, quantity: 1 },
      { id: '3302', item_name: 'Iced Cold Coffee with Ice Cream', price: 45.00, quantity: 1 }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    token_number: 'CAN-102',
    student_name: 'Priya Patel',
    student_id: 'EC2024-118',
    phone: '+91 91234 56789',
    pickup_counter: 'Counter 2',
    special_instructions: 'No ice in cold coffee',
    status: 'Preparing',
    total_amount: 165.00,
    payment_method: 'UPI / Counter Pay',
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    order_items: [
      { id: '3303', item_name: 'Paneer Butter Masala Thali', price: 120.00, quantity: 1 },
      { id: '3304', item_name: 'Iced Cold Coffee with Ice Cream', price: 45.00, quantity: 1 }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    token_number: 'CAN-103',
    student_name: 'Aman Verma',
    student_id: 'ME2024-077',
    phone: '+91 99887 76655',
    pickup_counter: 'Counter 1',
    special_instructions: 'Pack separately',
    status: 'Pending',
    total_amount: 90.00,
    payment_method: 'UPI / Counter Pay',
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    order_items: [
      { id: '3305', item_name: 'Delhi Samosa Chaat (2 Pcs)', price: 40.00, quantity: 1 },
      { id: '3306', item_name: 'Cheesy Schezwan Maggi', price: 50.00, quantity: 1 }
    ]
  }
];

let tokenCounter = 104;

// Helper to generate unique token
function generateToken() {
  const token = `CAN-${tokenCounter++}`;
  return token;
}

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

// 1. Health & Database Diagnostic Endpoint
app.get('/api/health', (req, res) => {
  const status = getSupabaseStatus();
  res.json({
    success: true,
    service: 'Smart Canteen Menu API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      provider: 'Supabase PostgreSQL',
      configured: status.configured,
      targetUrl: status.url,
      mode: status.configured ? 'Real PostgreSQL Database' : 'Local In-Memory Mode (Set .env for live Supabase)'
    },
    websocket: {
      clientsConnected: wss.clients.size
    }
  });
});

// 2. GET /api/menu - List all menu items with search & category filters
app.get('/api/menu', async (req, res) => {
  try {
    const { category, search, veg, available } = req.query;

    if (isConfigured()) {
      let query = supabase.from('menu_items').select('*').order('name');

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      if (search && search.trim() !== '') {
        query = query.ilike('name', `%${search.trim()}%`);
      }
      if (veg !== undefined && veg !== '') {
        query = query.eq('is_veg', veg === 'true');
      }
      if (available !== undefined && available !== '') {
        query = query.eq('is_available', available === 'true');
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    }

    // In-Memory Fallback
    let filtered = [...demoMenuItems];
    if (category && category !== 'All') {
      filtered = filtered.filter(item => item.category.toLowerCase() === category.toLowerCase());
    }
    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(item => item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q)));
    }
    if (veg !== undefined && veg !== '') {
      const isVeg = veg === 'true';
      filtered = filtered.filter(item => item.is_veg === isVeg);
    }
    if (available !== undefined && available !== '') {
      const isAvail = available === 'true';
      filtered = filtered.filter(item => item.is_available === isAvail);
    }

    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    console.error('Error fetching menu items:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. GET /api/menu/:id - Get a single menu item
app.get('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConfigured()) {
      const { data, error } = await supabase.from('menu_items').select('*').eq('id', id).single();
      if (error) {
        return res.status(404).json({ success: false, error: 'Menu item not found' });
      }
      return res.json({ success: true, data });
    }

    const item = demoMenuItems.find(i => i.id === id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Menu item not found' });
    }
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/menu - Create a new menu item (Admin/Staff)
app.post('/api/menu', async (req, res) => {
  try {
    const { name, description, price, category, is_veg, is_available, preparation_time, image_url } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Menu item name is required.' });
    }
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return res.status(400).json({ success: false, error: 'Valid price (greater than or equal to 0) is required.' });
    }
    if (!category) {
      return res.status(400).json({ success: false, error: 'Category is required.' });
    }

    const newItem = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: numericPrice,
      category: category.trim(),
      is_veg: is_veg === true || is_veg === 'true',
      is_available: is_available !== false && is_available !== 'false',
      preparation_time: parseInt(preparation_time, 10) || 10,
      image_url: image_url && image_url.trim() !== '' 
        ? image_url.trim() 
        : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
    };

    if (isConfigured()) {
      const { data, error } = await supabase.from('menu_items').insert([newItem]).select().single();
      if (error) throw error;
      broadcast('MENU_UPDATED', { action: 'CREATED', item: data });
      return res.status(201).json({ success: true, message: 'Item added successfully', data });
    }

    const created = {
      id: 'demo-' + Date.now(),
      ...newItem,
      created_at: new Date().toISOString()
    };
    demoMenuItems.unshift(created);
    broadcast('MENU_UPDATED', { action: 'CREATED', item: created });
    res.status(201).json({ success: true, message: 'Item added successfully', data: created });
  } catch (err) {
    console.error('Error creating menu item:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. PUT /api/menu/:id - Update an existing menu item
app.put('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, is_veg, is_available, preparation_time, image_url } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    if (price !== undefined) {
      const p = parseFloat(price);
      if (isNaN(p) || p < 0) return res.status(400).json({ success: false, error: 'Price must be >= 0' });
      updates.price = p;
    }
    if (category !== undefined) updates.category = category.trim();
    if (is_veg !== undefined) updates.is_veg = is_veg === true || is_veg === 'true';
    if (is_available !== undefined) updates.is_available = is_available === true || is_available === 'true';
    if (preparation_time !== undefined) updates.preparation_time = parseInt(preparation_time, 10) || 10;
    if (image_url !== undefined) updates.image_url = image_url.trim();

    if (isConfigured()) {
      const { data, error } = await supabase.from('menu_items').update(updates).eq('id', id).select().single();
      if (error) throw error;
      broadcast('MENU_UPDATED', { action: 'UPDATED', item: data });
      return res.json({ success: true, message: 'Menu item updated', data });
    }

    const index = demoMenuItems.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Menu item not found' });
    demoMenuItems[index] = { ...demoMenuItems[index], ...updates };
    broadcast('MENU_UPDATED', { action: 'UPDATED', item: demoMenuItems[index] });
    res.json({ success: true, message: 'Menu item updated', data: demoMenuItems[index] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. PATCH /api/menu/:id/toggle - Toggle availability (In Stock / Sold Out)
app.patch('/api/menu/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConfigured()) {
      const { data: current, error: getErr } = await supabase.from('menu_items').select('is_available').eq('id', id).single();
      if (getErr) throw getErr;

      const newStatus = !current.is_available;
      const { data, error } = await supabase.from('menu_items').update({ is_available: newStatus }).eq('id', id).select().single();
      if (error) throw error;

      broadcast('MENU_UPDATED', { action: 'TOGGLE_AVAILABILITY', item: data });
      return res.json({ success: true, message: `Status changed to ${newStatus ? 'Available' : 'Sold Out'}`, data });
    }

    const item = demoMenuItems.find(i => i.id === id);
    if (!item) return res.status(404).json({ success: false, error: 'Menu item not found' });
    item.is_available = !item.is_available;
    broadcast('MENU_UPDATED', { action: 'TOGGLE_AVAILABILITY', item });
    res.json({ success: true, message: `Status changed to ${item.is_available ? 'Available' : 'Sold Out'}`, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. DELETE /api/menu/:id - Delete a menu item
app.delete('/api/menu/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isConfigured()) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      broadcast('MENU_UPDATED', { action: 'DELETED', id });
      return res.json({ success: true, message: 'Item deleted successfully' });
    }

    const index = demoMenuItems.findIndex(i => i.id === id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Menu item not found' });
    demoMenuItems.splice(index, 1);
    broadcast('MENU_UPDATED', { action: 'DELETED', id });
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. GET /api/orders - List all orders (with order_items)
app.get('/api/orders', async (req, res) => {
  try {
    const { student_id, status } = req.query;

    if (isConfigured()) {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });

      if (student_id) query = query.eq('student_id', student_id);
      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    }

    let orders = [...demoOrders];
    if (student_id) orders = orders.filter(o => o.student_id.toLowerCase() === student_id.toLowerCase());
    if (status) orders = orders.filter(o => o.status.toLowerCase() === status.toLowerCase());

    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. GET /api/orders/token/:token - Search order by token
app.get('/api/orders/token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const cleanToken = token.trim().toUpperCase();

    if (isConfigured()) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .ilike('token_number', cleanToken)
        .single();

      if (error || !data) {
        return res.status(404).json({ success: false, error: `No order found with token ${cleanToken}` });
      }
      return res.json({ success: true, data });
    }

    const found = demoOrders.find(o => o.token_number.toUpperCase() === cleanToken);
    if (!found) {
      return res.status(404).json({ success: false, error: `No order found with token ${cleanToken}` });
    }
    res.json({ success: true, data: found });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. POST /api/orders - Place a new order
app.post('/api/orders', async (req, res) => {
  try {
    const { student_name, student_id, phone, pickup_counter, special_instructions, items } = req.body;

    if (!student_name || student_name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Student full name is required.' });
    }
    if (!student_id || student_id.trim() === '') {
      return res.status(400).json({ success: false, error: 'Student ID / Roll number is required.' });
    }
    if (!phone || phone.trim() === '') {
      return res.status(400).json({ success: false, error: 'Contact phone number is required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Order must contain at least one item.' });
    }

    // Calculate total amount
    let total_amount = 0;
    const sanitizedItems = items.map(it => {
      const price = parseFloat(it.price) || 0;
      const qty = parseInt(it.quantity, 10) || 1;
      total_amount += price * qty;
      return {
        menu_item_id: it.id || it.menu_item_id || null,
        item_name: it.name || it.item_name || 'Canteen Item',
        price,
        quantity: qty
      };
    });

    const token_number = generateToken();

    const orderPayload = {
      token_number,
      student_name: student_name.trim(),
      student_id: student_id.trim(),
      phone: phone.trim(),
      pickup_counter: pickup_counter || 'Counter 1',
      special_instructions: special_instructions ? special_instructions.trim() : '',
      status: 'Pending',
      total_amount,
      payment_method: 'UPI / Counter Pay'
    };

    if (isConfigured()) {
      // 1. Insert order
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert([orderPayload])
        .select()
        .single();

      if (orderErr) throw orderErr;

      // 2. Insert order items
      const itemsToInsert = sanitizedItems.map(it => ({
        order_id: orderData.id,
        menu_item_id: it.menu_item_id && it.menu_item_id.length > 20 ? it.menu_item_id : null,
        item_name: it.item_name,
        price: it.price,
        quantity: it.quantity
      }));

      const { data: itemsData, error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsToInsert)
        .select();

      if (itemsErr) throw itemsErr;

      const completeOrder = {
        ...orderData,
        order_items: itemsData
      };

      // Broadcast new order to canteen staff & live token board
      broadcast('NEW_ORDER', completeOrder);

      return res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        token_number: completeOrder.token_number,
        data: completeOrder
      });
    }

    // In-Memory Fallback
    const createdOrder = {
      id: 'demo-ord-' + Date.now(),
      ...orderPayload,
      created_at: new Date().toISOString(),
      order_items: sanitizedItems.map((it, idx) => ({ id: `ord-it-${idx}`, ...it }))
    };

    demoOrders.unshift(createdOrder);
    broadcast('NEW_ORDER', createdOrder);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      token_number: createdOrder.token_number,
      data: createdOrder
    });
  } catch (err) {
    console.error('Error placing order:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. PATCH /api/orders/:id/status - Update order status (Pending -> Preparing -> Ready -> Completed -> Cancelled)
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (isConfigured()) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select('*, order_items(*)')
        .single();

      if (error) throw error;

      broadcast('ORDER_STATUS_UPDATED', data);
      return res.json({ success: true, message: `Order status updated to ${status}`, data });
    }

    const order = demoOrders.find(o => o.id === id);
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    order.status = status;
    broadcast('ORDER_STATUS_UPDATED', order);
    res.json({ success: true, message: `Order status updated to ${status}`, data: order });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. GET /api/stats - Dashboard analytics for staff
app.get('/api/stats', async (req, res) => {
  try {
    if (isConfigured()) {
      const { data: allOrders, error: ordErr } = await supabase.from('orders').select('status, total_amount');
      const { count: menuCount, error: menuErr } = await supabase.from('menu_items').select('*', { count: 'exact', head: true });

      if (ordErr || menuErr) throw ordErr || menuErr;

      const totalRevenue = allOrders.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);
      const pendingCount = allOrders.filter(o => o.status === 'Pending').length;
      const preparingCount = allOrders.filter(o => o.status === 'Preparing').length;
      const readyCount = allOrders.filter(o => o.status === 'Ready').length;

      return res.json({
        success: true,
        data: {
          totalOrders: allOrders.length,
          totalRevenue,
          pendingCount,
          preparingCount,
          readyCount,
          totalMenuItems: menuCount || 0
        }
      });
    }

    const totalRevenue = demoOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const pendingCount = demoOrders.filter(o => o.status === 'Pending').length;
    const preparingCount = demoOrders.filter(o => o.status === 'Preparing').length;
    const readyCount = demoOrders.filter(o => o.status === 'Ready').length;

    res.json({
      success: true,
      data: {
        totalOrders: demoOrders.length,
        totalRevenue,
        pendingCount,
        preparingCount,
        readyCount,
        totalMenuItems: demoMenuItems.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend SPA fallback for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Start the server
server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Smart Canteen Menu Server running at http://localhost:${PORT}`);
  console.log(`📡 WebSocket real-time updates enabled on ws://localhost:${PORT}`);
  console.log(`📋 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🍔 Menu API: http://localhost:${PORT}/api/menu`);
  console.log(`======================================================\n`);
});
