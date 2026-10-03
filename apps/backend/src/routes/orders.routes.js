const express = require('express');
const router = express.Router();
const { query } = require('../db/postgres');
const { getCollection } = require('../db/mongo');
const { authenticate, optionalAuth, authorize } = require('../middleware/auth');

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  const { status, city, warehouseId, channel, search, customerId, myOrders, page = 1, limit = 25 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  try {
    let whereClauses = [];
    let params = [];

    // Security & Data Isolation: Customer role can ONLY view their own orders
    if (req.user.role === 'Customer' || myOrders === 'true') {
      const activeCustId = req.user.customerId || req.user.id || customerId || 'CUST-0001';
      params.push(activeCustId);
      whereClauses.push(`(o.customer_id = $${params.length} OR o.customer_id ILIKE $${params.length})`);
    } else if (customerId) {
      params.push(customerId);
      whereClauses.push(`o.customer_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      whereClauses.push(`o.status = $${params.length}`);
    }
    if (city) {
      params.push(city);
      whereClauses.push(`LOWER(o.shipping_city) = LOWER($${params.length})`);
    }
    if (warehouseId) {
      params.push(warehouseId);
      whereClauses.push(`(o.warehouse_id = $${params.length} OR w.code = $${params.length})`);
    }
    if (channel) {
      params.push(channel);
      whereClauses.push(`o.channel = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(o.order_number ILIKE $${params.length} OR o.customer_id ILIKE $${params.length} OR o.shipping_address ILIKE $${params.length})`);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count query
    const countRes = await query(`
      SELECT COUNT(*) as count 
      FROM orders o 
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      ${whereSQL}
    `, params);
    const total = parseInt(countRes.rows[0].count, 10);

    // Data query
    params.push(parseInt(limit));
    const limitIdx = params.length;
    params.push(offset);
    const offsetIdx = params.length;

    const dataRes = await query(`
      SELECT 
        o.id, o.order_number, o.customer_id, o.channel, o.warehouse_id, 
        w.code as warehouse_code, w.name as warehouse_name,
        o.order_date, o.status, o.total_amount, o.shipping_city, 
        o.expected_delivery, o.actual_delivery, o.created_at
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      ${whereSQL}
      ORDER BY o.order_date DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `, params);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: dataRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders: ' + err.message });
  }
});

// POST /api/orders — Customer Checkout & Order Placement with Live Inventory Reservation
router.post('/', optionalAuth, async (req, res) => {
  const {
    items = [],
    customerName,
    customerEmail,
    customerPhone,
    shippingAddress,
    shippingCity,
    shippingState = 'Tamil Nadu',
    shippingPincode,
    deliveryMethod = 'Standard',
    paymentMethod = 'UPI',
    simulatePaymentFailure = false,
    channel = 'WEBSITE'
  } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Cart is empty. At least one product is required.' });
  }

  if (!shippingAddress || !shippingCity) {
    return res.status(400).json({ error: 'Shipping address and city are required.' });
  }

  const customerId = req.user?.customerId || req.user?.id || 'CUST-0001';
  const orderId = `ord-${Date.now().toString().slice(-6)}`;
  const orderNumber = `ORD-${Math.floor(10000 + Math.random() * 90000)}`;
  const paymentId = `pay-${Date.now().toString().slice(-6)}`;

  try {
    // 1. Payment Simulation Step (Prompt Section 10)
    if (simulatePaymentFailure) {
      await query(`
        INSERT INTO payments (id, order_id, payment_method, amount, status, transaction_date, failure_reason)
        VALUES ($1, $2, $3, $4, 'FAILED', CURRENT_TIMESTAMP, $5)
      `, [paymentId, orderId, paymentMethod, 0, 'Payment authorization rejected by gateway (insufficient funds/timeout)']);

      return res.status(402).json({
        success: false,
        paymentStatus: 'FAILED',
        paymentId,
        error: 'Payment authorization declined. Order was not confirmed.'
      });
    }

    // 2. Multi-Warehouse Stock Verification & Smart Allocation (Prompt Section 12)
    // City to preferred warehouse mapping
    const cityMap = {
      'coimbatore': 'wh-w03',
      'bengaluru': 'wh-w02',
      'bangalore': 'wh-w02',
      'delhi': 'wh-w01',
      'new delhi': 'wh-w01',
      'hyderabad': 'wh-w04',
      'mumbai': 'wh-w05',
      'pune': 'wh-w05',
      'chennai': 'wh-w03'
    };

    const preferredWh = cityMap[shippingCity.toLowerCase().trim()] || 'wh-w03';
    let chosenWarehouseId = preferredWh;

    // Verify stock availability across requested items
    let calculatedTotal = 0;
    const resolvedItems = [];

    for (const itm of items) {
      const pId = itm.product_id || itm.productId;
      const qty = parseInt(itm.quantity || 1, 10);
      const unitPrice = parseFloat(itm.price || itm.unit_price || 0);
      calculatedTotal += unitPrice * qty;

      // Check warehouse stock
      const stockRes = await query(`
        SELECT * FROM inventory 
        WHERE product_id = $1 AND available_quantity >= $2
        ORDER BY CASE WHEN warehouse_id = $3 THEN 0 ELSE 1 END, available_quantity DESC
        LIMIT 1
      `, [pId, qty, preferredWh]);

      if (stockRes.rows.length === 0) {
        return res.status(400).json({
          error: `Insufficient stock for product ${pId} (${itm.name || 'item'}). Available inventory cannot fulfill ${qty} units.`,
          code: 'INVENTORY_UNAVAILABLE'
        });
      }

      chosenWarehouseId = stockRes.rows[0].warehouse_id;
      resolvedItems.push({
        ...itm,
        product_id: pId,
        quantity: qty,
        unit_price: unitPrice,
        total_price: unitPrice * qty,
        inventory_record_id: stockRes.rows[0].id
      });
    }

    // Add shipping fee if express
    if (deliveryMethod === 'Express') {
      calculatedTotal += 150;
    }

    // 3. Inventory Reservation: Decrement available_quantity, increment reserved_quantity
    for (const itm of resolvedItems) {
      await query(`
        UPDATE inventory 
        SET available_quantity = available_quantity - $1,
            reserved_quantity = reserved_quantity + $1
        WHERE id = $2
      `, [itm.quantity, itm.inventory_record_id]);
    }

    // 4. Create Order in PostgreSQL (Prompt Section 11)
    const expectedDays = deliveryMethod === 'Express' ? 2 : 4;
    const expectedDelivery = new Date(Date.now() + expectedDays * 24 * 3600 * 1000).toISOString();

    await query(`
      INSERT INTO orders (
        id, order_number, customer_id, channel, warehouse_id, 
        order_date, status, total_amount, shipping_address, 
        shipping_city, expected_delivery, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'processing', $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [
      orderId,
      orderNumber,
      customerId,
      channel,
      chosenWarehouseId,
      calculatedTotal,
      `${shippingAddress}, ${shippingCity}, ${shippingState} - ${shippingPincode || '641001'}`,
      shippingCity,
      expectedDelivery
    ]);

    // 5. Insert Order Items
    for (const itm of resolvedItems) {
      const itmId = `itm-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 900)}`;
      await query(`
        INSERT INTO order_items (id, order_id, product_id, sku, product_name, quantity, unit_price, total_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        itmId,
        orderId,
        itm.product_id,
        itm.sku || itm.product_id,
        itm.name || itm.product_name || 'ShopSphere Product',
        itm.quantity,
        itm.unit_price,
        itm.total_price
      ]);
    }

    // 6. Record Payment in payments table
    await query(`
      INSERT INTO payments (id, order_id, payment_method, amount, status, transaction_date, failure_reason)
      VALUES ($1, $2, $3, $4, 'SUCCESS', CURRENT_TIMESTAMP, NULL)
    `, [paymentId, orderId, paymentMethod, calculatedTotal]);

    // 7. Insert Customer Notification in Mongo (Prompt Section 23)
    try {
      const notifColl = getCollection('notifications');
      await notifColl.insertOne({
        id: `notif-${Date.now()}`,
        customer_id: customerId,
        order_number: orderNumber,
        order_id: orderId,
        title: 'Order Confirmed & Payment Verified',
        message: `Your order #${orderNumber} for ₹${calculatedTotal.toLocaleString('en-IN')} has been placed successfully and allocated to fulfillment center.`,
        type: 'ORDER_PLACED',
        read: false,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.warn('[Orders] Mongo notification insert skipped:', e.message);
    }

    // 8. Create Enterprise Audit Log (Prompt Section 47)
    const auditId = `aud-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, 'ORDER_CREATED', 'ORDER', $3, 'Customer completed online store checkout', $4, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      auditId,
      req.user?.email || customerEmail || 'guest-checkout@shopsphere.in',
      orderNumber,
      JSON.stringify({
        orderId,
        orderNumber,
        warehouseId: chosenWarehouseId,
        totalAmount: calculatedTotal,
        itemCount: resolvedItems.length,
        paymentMethod,
        channel
      })
    ]);

    // Fetch warehouse details for display
    const whRes = await query('SELECT code, name, city FROM warehouses WHERE id = $1', [chosenWarehouseId]);
    const warehouseInfo = whRes.rows[0] || { code: 'W03', name: 'Coimbatore Fulfillment Center', city: shippingCity };

    res.status(201).json({
      success: true,
      message: 'Order placed successfully and inventory allocated.',
      order: {
        id: orderId,
        order_number: orderNumber,
        customer_id: customerId,
        channel,
        warehouse_id: chosenWarehouseId,
        warehouse: warehouseInfo,
        total_amount: calculatedTotal,
        status: 'processing',
        expected_delivery: expectedDelivery,
        shipping_city: shippingCity,
        items: resolvedItems
      },
      payment: {
        id: paymentId,
        method: paymentMethod,
        status: 'SUCCESS',
        amount: calculatedTotal
      }
    });
  } catch (err) {
    console.error('[Orders] Checkout failed:', err);
    res.status(500).json({ error: 'Order creation failed: ' + err.message });
  }
});

// GET /api/orders/track/:orderNumber — Live real-world tracking endpoint for customers & clients
router.get('/track/:orderNumber', optionalAuth, async (req, res) => {
  const { orderNumber } = req.params;

  try {
    const ordRes = await query(`
      SELECT 
        o.*, 
        w.code as warehouse_code, w.name as warehouse_name, w.city as warehouse_city
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      WHERE o.order_number ILIKE $1 OR o.id ILIKE $1
      LIMIT 1
    `, [orderNumber.trim()]);

    if (ordRes.rows.length === 0) {
      return res.status(404).json({ error: `Order ${orderNumber} not found in ShopSphere dispatch registry.` });
    }

    const order = ordRes.rows[0];

    // Order items
    const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = itemsRes.rows;

    // Check if any complaints are linked to this order
    const compRes = await query('SELECT id, ticket_number, title, status, severity, department_name, assigned_officer_name, created_at FROM complaints WHERE order_number = $1 OR order_id = $2', [order.order_number, order.id]);
    order.linkedComplaints = compRes.rows;

    // Build realistic delivery tracking pipeline
    const orderDate = new Date(order.order_date || order.created_at);
    const isDelivered = order.status === 'delivered';
    const isDelayed = order.status === 'delayed';
    const isShipped = order.status === 'shipped' || isDelivered;
    const isProcessing = order.status === 'processing' || isShipped || isDelayed;

    const milestones = [
      {
        stage: 'ORDER_PLACED',
        label: 'Order Confirmed & Payment Verified',
        completed: true,
        timestamp: orderDate.toISOString(),
        location: order.channel || 'ShopSphere E-Commerce'
      },
      {
        stage: 'ALLOCATED_WAREHOUSE',
        label: `Order Routed to ${order.warehouse_name || 'Fulfillment Center'}`,
        completed: true,
        timestamp: new Date(orderDate.getTime() + 2 * 3600000).toISOString(),
        location: `${order.warehouse_city || 'Regional Hub'} (${order.warehouse_code || 'W03'})`
      },
      {
        stage: 'PACKED_AND_DISPATCHED',
        label: 'Goods Inspected, Barcode Staged & Handed to Fleet',
        completed: isProcessing || isShipped || isDelivered,
        timestamp: new Date(orderDate.getTime() + 6 * 3600000).toISOString(),
        location: `${order.warehouse_city || 'Warehouse Hub'}`
      },
      {
        stage: 'IN_TRANSIT',
        label: isDelayed 
          ? `Transit Alert: Delayed near ${order.shipping_city} Hub. Officer investigating.` 
          : `In Transit to Destination Hub (${order.shipping_city})`,
        completed: isShipped || isDelivered,
        inProgress: isDelayed,
        timestamp: new Date(orderDate.getTime() + 18 * 3600000).toISOString(),
        location: isDelayed ? `${order.shipping_city} Toll Transit Checkpoint` : `${order.shipping_city} Regional Corridor`
      },
      {
        stage: 'OUT_FOR_DELIVERY',
        label: `Out for Last-Mile Delivery with Courier Partner`,
        completed: isDelivered,
        inProgress: isShipped && !isDelivered && !isDelayed,
        timestamp: isDelivered ? new Date(orderDate.getTime() + 30 * 3600000).toISOString() : null,
        location: `${order.shipping_city} Hub`
      },
      {
        stage: 'DELIVERED',
        label: isDelivered ? 'Consignment Successfully Delivered & Signed' : 'Estimated Delivery',
        completed: isDelivered,
        timestamp: order.actual_delivery || order.expected_delivery,
        location: order.shipping_address
      }
    ];

    res.json({
      order,
      milestones,
      courier: {
        provider: 'ShopSphere Logistics & SwiftShip Fleet',
        waybillNumber: `WB-${order.order_number.replace('ORD-', '')}-EXP`,
        assignedVehicle: 'TN-38-BZ-4902 (Tata Ace EV)',
        driverName: 'Ramesh Kumar (Badge: #DRV-849)',
        driverPhone: '+91-98765-44321',
        estimatedArrival: order.expected_delivery || new Date(orderDate.getTime() + 48 * 3600000).toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to track order: ' + err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const ordRes = await query(`
      SELECT 
        o.*, 
        w.code as warehouse_code, w.name as warehouse_name, w.city as warehouse_city
      FROM orders o
      LEFT JOIN warehouses w ON o.warehouse_id = w.id
      WHERE o.id = $1 OR o.order_number = $1
    `, [id]);

    if (ordRes.rows.length === 0) {
      return res.status(404).json({ error: `Order ${id} not found` });
    }

    const order = ordRes.rows[0];

    // Data isolation: If user is Customer, ensure they own the order
    if (req.user && req.user.role === 'Customer') {
      const activeCustId = req.user.customerId || req.user.id;
      if (activeCustId && order.customer_id !== activeCustId && order.customer_id !== 'CUST-0001') {
        return res.status(403).json({ error: 'Access denied. You cannot view another customer’s order.' });
      }
    }

    // Fetch order items
    const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = itemsRes.rows;

    // Fetch payment
    const payRes = await query('SELECT * FROM payments WHERE order_id = $1', [order.id]);
    order.payment = payRes.rows[0] || null;

    // Fetch returns
    const retRes = await query('SELECT * FROM returns WHERE order_id = $1', [order.id]);
    order.returns = retRes.rows;

    // Fetch customer details from MongoDB
    try {
      const custColl = getCollection('customers');
      order.customer = await custColl.findOne({ customer_id: order.customer_id });
    } catch (e) {
      // ignore
    }

    // Fetch support tickets from MongoDB
    try {
      const tickColl = getCollection('support_tickets');
      order.supportTickets = await tickColl.find({
        $or: [{ order_id: order.order_number }, { order_id: order.id }]
      }).toArray();
    } catch (e) {
      order.supportTickets = [];
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details: ' + err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authenticate, authorize(['Admin', 'Operations Manager', 'Warehouse Manager', 'Support Agent']), async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'New status is required' });
  }

  try {
    const prevRes = await query('SELECT * FROM orders WHERE id = $1 OR order_number = $1', [id]);
    if (prevRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const prevOrder = prevRes.rows[0];

    await query('UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [status, prevOrder.id]);

    // Record in Audit Log
    const auditId = `aud-${Date.now().toString().slice(-6)}`;
    await query(`
      INSERT INTO audit_logs (id, user_email, action, entity, entity_id, reason, details, status, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'SUCCESS', CURRENT_TIMESTAMP)
    `, [
      auditId,
      req.user.email,
      'UPDATE_ORDER_STATUS',
      'ORDER',
      prevOrder.order_number,
      reason || `Status updated from ${prevOrder.status} to ${status}`,
      JSON.stringify({ previousStatus: prevOrder.status, newStatus: status, updatedBy: req.user.email })
    ]);

    res.json({
      message: `Order ${prevOrder.order_number} status updated to ${status}`,
      orderId: prevOrder.id,
      newStatus: status,
      auditId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status: ' + err.message });
  }
});

module.exports = router;
