import csv
import json
import os
import random
from datetime import datetime, timedelta
from faker import Faker

fake = Faker('en_IN')
random.seed(42)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_DIR = os.path.join(BASE_DIR, 'data', 'csv')
GEN_DIR = os.path.join(BASE_DIR, 'data', 'generated')
DOC_DIR = os.path.join(BASE_DIR, 'data', 'documents')

os.makedirs(CSV_DIR, exist_ok=True)
os.makedirs(GEN_DIR, exist_ok=True)
os.makedirs(DOC_DIR, exist_ok=True)

print("Starting ShopSphere Synthetic Data Generation...")

# -------------------------------------------------------------
# 1. GENERATE SUPPLIERS (500+ suppliers)
# -------------------------------------------------------------
print("Generating 500+ suppliers...")
suppliers = []
supplier_ids = []
for i in range(1, 515):
    sup_id = f"SUP-{i:03d}"
    supplier_ids.append(sup_id)
    suppliers.append({
        'supplier_id': sup_id,
        'supplier_name': f"{fake.company()} Logistics & Tech",
        'country': random.choice(['India', 'Taiwan', 'Vietnam', 'Germany', 'USA', 'Japan', 'South Korea']),
        'contact_email': f"procurement@{sup_id.lower()}-supply.com",
        'lead_time_days': random.randint(3, 45),
        'reliability_score': round(random.uniform(0.70, 0.99), 2),
        'payment_terms': random.choice(['Net 30', 'Net 45', 'Net 60', 'Immediate'])
    })

supplier_csv_path = os.path.join(CSV_DIR, 'supplier_data.csv')
with open(supplier_csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['supplier_id', 'supplier_name', 'country', 'contact_email', 'lead_time_days', 'reliability_score', 'payment_terms'])
    writer.writeheader()
    writer.writerows(suppliers)
print(f"Saved {len(suppliers)} suppliers to {supplier_csv_path}")

# -------------------------------------------------------------
# 2. GENERATE PRODUCT CATALOG (2000+ products)
# -------------------------------------------------------------
print("Generating 2,000+ products...")
categories = [
    ('Electronics', ['SmartPulse', 'AeroGrip', 'SoundWave', 'VisionMax', 'HyperCharge']),
    ('Home & Kitchen', ['ChefMaster', 'PureBreeze', 'ErgoLiving', 'KitchenCraft', 'CleanPro']),
    ('Apparel & Fashion', ['UrbanStyle', 'FlexFit', 'NordicWeave', 'ActiveWear', 'ComfortPlus']),
    ('Fitness & Health', ['FitPro', 'AeroPulse', 'VitalCore', 'ZenGym', 'PulseTrack']),
    ('Office & Computing', ['DeskPro', 'ErgoTech', 'LogiMax', 'KeyCraft', 'OptiScreen'])
]

products = []
product_ids = []

# Key operational problem product: P-204
products.append({
    'product_id': 'P-204',
    'sku': 'AP-FIT-204',
    'name': 'AeroPulse Pro Smart Fitness Band & Pulse Oximeter',
    'category': 'Electronics',
    'brand': 'AeroPulse',
    'supplier_id': 'SUP-012',
    'price': 3499.00,
    'cost': 1850.00,
    'weight': 0.25,
    'rating': 3.7,
    'return_rate': 0.095,
    'reorder_threshold': 50
})
product_ids.append('P-204')

# High return rate product 1: P-512
products.append({
    'product_id': 'P-512',
    'sku': 'EC-CHR-512',
    'name': 'ErgoComfort Orthopedic High-Back Mesh Chair',
    'category': 'Office & Computing',
    'brand': 'ErgoTech',
    'supplier_id': 'SUP-045',
    'price': 12999.00,
    'cost': 7200.00,
    'weight': 14.5,
    'rating': 3.1,
    'return_rate': 0.245,  # 24.5% high return rate!
    'reorder_threshold': 20
})
product_ids.append('P-512')

# High return rate product 2: P-884
products.append({
    'product_id': 'P-884',
    'sku': 'QB-ANC-884',
    'name': 'QuantumBass Active Noise Cancelling Wireless Headphones',
    'category': 'Electronics',
    'brand': 'SoundWave',
    'supplier_id': 'SUP-088',
    'price': 4999.00,
    'cost': 2600.00,
    'weight': 0.45,
    'rating': 3.4,
    'return_rate': 0.198,  # 19.8% high return rate!
    'reorder_threshold': 35
})
product_ids.append('P-884')

# Fill up to 2,050 products
for i in range(4, 2051):
    pid = f"P-{i:04d}"
    product_ids.append(pid)
    cat, brands = random.choice(categories)
    brand = random.choice(brands)
    price = round(random.uniform(299, 24999), 2)
    cost = round(price * random.uniform(0.45, 0.75), 2)
    return_rate = round(random.uniform(0.01, 0.07), 3)
    products.append({
        'product_id': pid,
        'sku': f"{brand[:3].upper()}-{cat[:3].upper()}-{i:04d}",
        'name': f"{brand} {cat[:-1]} Series-{i} {fake.word().capitalize()}",
        'category': cat,
        'brand': brand,
        'supplier_id': random.choice(supplier_ids),
        'price': price,
        'cost': cost,
        'weight': round(random.uniform(0.1, 15.0), 2),
        'rating': round(random.uniform(3.5, 4.9), 1),
        'return_rate': return_rate,
        'reorder_threshold': random.randint(15, 60)
    })

product_csv_path = os.path.join(CSV_DIR, 'product_catalog.csv')
with open(product_csv_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['product_id', 'sku', 'name', 'category', 'brand', 'supplier_id', 'price', 'cost', 'weight', 'rating', 'return_rate', 'reorder_threshold'])
    writer.writeheader()
    writer.writerows(products)
print(f"Saved {len(products)} products to {product_csv_path}")

# -------------------------------------------------------------
# 3. GENERATE WAREHOUSES (20 warehouses)
# -------------------------------------------------------------
print("Generating 20 warehouses...")
warehouse_configs = [
    ("W01", "Mumbai West Fulfillment Center", "Mumbai", "Maharashtra", "healthy", 50000),
    ("W02", "Bengaluru Central Logistics Hub", "Bengaluru", "Karnataka", "healthy", 65000),
    ("W03", "Coimbatore Hub & Regional Facility", "Coimbatore", "Tamil Nadu", "sync_error", 25000), # Correlated failure warehouse!
    ("W04", "Delhi NCR Mega Warehouse", "Gurgaon", "Haryana", "healthy", 80000),
    ("W05", "Chennai Gateway Distribution", "Chennai", "Tamil Nadu", "healthy", 40000),
    ("W06", "Hyderabad Tech Zone Warehouse", "Hyderabad", "Telangana", "healthy", 45000),
    ("W07", "Kolkata East Logistics Center", "Kolkata", "West Bengal", "healthy", 35000),
    ("W08", "Pune Express Depot", "Pune", "Maharashtra", "healthy", 30000),
    ("W09", "Ahmedabad Industrial Hub", "Ahmedabad", "Gujarat", "healthy", 38000),
    ("W10", "Jaipur North Depot", "Jaipur", "Rajasthan", "healthy", 25000),
    ("W11", "Kochi Coastal Hub", "Kochi", "Kerala", "healthy", 22000),
    ("W12", "Lucknow Central Depot", "Lucknow", "Uttar Pradesh", "healthy", 28000),
    ("W13", "Chandigarh Express Center", "Chandigarh", "Punjab", "healthy", 20000),
    ("W14", "Indore Central Logistics", "Indore", "Madhya Pradesh", "healthy", 24000),
    ("W15", "Nagpur Logistics Node", "Nagpur", "Maharashtra", "healthy", 30000),
    ("W16", "Bhubaneswar Hub", "Bhubaneswar", "Odisha", "healthy", 18000),
    ("W17", "Guwahati North-East Depot", "Guwahati", "Assam", "healthy", 15000),
    ("W18", "Visakhapatnam Port Depot", "Visakhapatnam", "Andhra Pradesh", "healthy", 22000),
    ("W19", "Patna Regional Hub", "Patna", "Bihar", "healthy", 20000),
    ("W20", "Surat Textile & Goods Hub", "Surat", "Gujarat", "healthy", 26000),
]

warehouses = []
for code, name, city, state, api_status, capacity in warehouse_configs:
    warehouses.append({
        'id': f"wh-{code.lower()}",
        'code': code,
        'name': name,
        'city': city,
        'state': state,
        'address': f"{random.randint(10, 999)} Industrial Area, {city}, {state}",
        'capacity': capacity,
        'current_utilization': random.randint(int(capacity * 0.6), int(capacity * 0.92)),
        'api_status': api_status,
        'created_at': (datetime.now() - timedelta(days=random.randint(300, 700))).isoformat()
    })

with open(os.path.join(GEN_DIR, 'warehouses.json'), 'w', encoding='utf-8') as f:
    json.dump(warehouses, f, indent=2)

# -------------------------------------------------------------
# 4. GENERATE CUSTOMERS (10,000 customers)
# -------------------------------------------------------------
print("Generating 10,000 customers...")
customers = []
customer_ids = []

# Key customers for repeat contact demo
repeat_customers = [
    {
        'customer_id': 'CUST-1042',
        'name': 'Arjun Sundaram',
        'email': 'arjun.sundaram@example.com',
        'phone': '+91 98401 23456',
        'city': 'Coimbatore',
        'state': 'Tamil Nadu',
        'segment': 'VIP',
        'lifetime_value': 48500.00,
        'created_at': (datetime.now() - timedelta(days=210)).isoformat()
    },
    {
        'customer_id': 'CUST-1088',
        'name': 'Kavitha Raman',
        'email': 'kavitha.raman@example.com',
        'phone': '+91 94432 98765',
        'city': 'Coimbatore',
        'state': 'Tamil Nadu',
        'segment': 'Regular',
        'lifetime_value': 18200.00,
        'created_at': (datetime.now() - timedelta(days=140)).isoformat()
    },
    {
        'customer_id': 'CUST-2105',
        'name': 'Prakash Velu',
        'email': 'prakash.velu@example.com',
        'phone': '+91 97890 54321',
        'city': 'Coimbatore',
        'state': 'Tamil Nadu',
        'segment': 'Enterprise',
        'lifetime_value': 125000.00,
        'created_at': (datetime.now() - timedelta(days=320)).isoformat()
    }
]

for rc in repeat_customers:
    customers.append(rc)
    customer_ids.append(rc['customer_id'])

cities = [
    ('Coimbatore', 'Tamil Nadu', 0.12), # high weight for Coimbatore
    ('Bengaluru', 'Karnataka', 0.18),
    ('Chennai', 'Tamil Nadu', 0.14),
    ('Mumbai', 'Maharashtra', 0.15),
    ('Delhi', 'Delhi', 0.14),
    ('Hyderabad', 'Telangana', 0.09),
    ('Pune', 'Maharashtra', 0.08),
    ('Kolkata', 'West Bengal', 0.05),
    ('Ahmedabad', 'Gujarat', 0.05)
]

city_choices, state_choices, city_weights = zip(*cities)

for i in range(len(repeat_customers) + 1, 10001):
    cid = f"CUST-{i:05d}"
    customer_ids.append(cid)
    city_idx = random.choices(range(len(cities)), weights=city_weights)[0]
    city, state = city_choices[city_idx], state_choices[city_idx]
    first = fake.first_name()
    last = fake.last_name()
    customers.append({
        'customer_id': cid,
        'name': f"{first} {last}",
        'email': f"{first.lower()}.{last.lower()}{random.randint(10, 999)}@example.com",
        'phone': f"+91 {random.randint(70000, 99999)} {random.randint(10000, 99999)}",
        'city': city,
        'state': state,
        'segment': random.choices(['Regular', 'VIP', 'Enterprise', 'Occasional'], weights=[0.60, 0.20, 0.05, 0.15])[0],
        'lifetime_value': round(random.uniform(1200, 85000), 2),
        'created_at': (datetime.now() - timedelta(days=random.randint(15, 600))).isoformat()
    })

with open(os.path.join(GEN_DIR, 'customers.json'), 'w', encoding='utf-8') as f:
    json.dump(customers, f)
print(f"Generated {len(customers)} customers.")

# -------------------------------------------------------------
# 5. GENERATE INVENTORY (2,050 products across warehouses)
# -------------------------------------------------------------
print("Generating inventory records across warehouses...")
inventory_records = []
inventory_events = []
w_codes = [w['code'] for w in warehouses]
w_ids = {w['code']: w['id'] for w in warehouses}

for prod in products:
    pid = prod['product_id']
    threshold = prod['reorder_threshold']
    
    for w_code in ['W01', 'W02', 'W03', 'W04', 'W05']:
        wid = w_ids[w_code]
        
        # Specially design P-204 at W03: MISMATCH / CRITICAL!
        if pid == 'P-204' and w_code == 'W03':
            available = 0 # Physical stock zero!
            reserved = 18 # 18 orders waiting!
            damaged = 12
            status = 'Mismatch'
            last_sync = (datetime.now() - timedelta(hours=36)).isoformat() # 36h stale!
        elif pid == 'P-204' and w_code == 'W02':
            available = 145 # Surplus available in W02 for transfer!
            reserved = 8
            damaged = 0
            status = 'Healthy'
            last_sync = datetime.now().isoformat()
        else:
            # General inventory distribution
            dice = random.random()
            if dice < 0.04:
                available = random.randint(0, 5)
                reserved = random.randint(0, 4)
                damaged = random.randint(0, 3)
                status = 'Critical'
            elif dice < 0.12:
                available = random.randint(6, threshold)
                reserved = random.randint(1, 10)
                damaged = random.randint(0, 2)
                status = 'Low Stock'
            else:
                available = random.randint(threshold + 15, threshold + 250)
                reserved = random.randint(2, 25)
                damaged = random.randint(0, 5)
                status = 'Healthy'
            last_sync = datetime.now().isoformat()

        inv_id = f"inv-{pid.lower()}-{w_code.lower()}"
        inventory_records.append({
            'id': inv_id,
            'product_id': pid,
            'sku': prod['sku'],
            'warehouse_id': wid,
            'warehouse_code': w_code,
            'product_name': prod['name'],
            'category': prod['category'],
            'available_quantity': available,
            'reserved_quantity': reserved,
            'damaged_quantity': damaged,
            'reorder_threshold': threshold,
            'status': status,
            'last_sync_at': last_sync
        })

# Initial Inventory Events
for inv in inventory_records[:500]:
    inventory_events.append({
        'id': f"ie-{len(inventory_events) + 1:06d}",
        'event_type': 'sync',
        'product_id': inv['product_id'],
        'warehouse_id': inv['warehouse_id'],
        'quantity': inv['available_quantity'],
        'previous_qty': inv['available_quantity'] + random.randint(-10, 10),
        'new_qty': inv['available_quantity'],
        'reason': 'Periodic warehouse sync cycle',
        'reference_id': 'SYNC-CYCLE-DAILY',
        'created_at': (datetime.now() - timedelta(hours=random.randint(1, 72))).isoformat()
    })

# Add the specific discrepancy event for P-204 at W03
inventory_events.append({
    'id': f"ie-{len(inventory_events) + 1:06d}",
    'event_type': 'adjustment',
    'product_id': 'P-204',
    'warehouse_id': w_ids['W03'],
    'quantity': -50,
    'previous_qty': 50,
    'new_qty': 0,
    'reason': 'Physical cycle audit detected zero physical stock vs ERP 50 - sync mismatch',
    'reference_id': 'AUDIT-W03-ERR',
    'created_at': (datetime.now() - timedelta(hours=28)).isoformat()
})

with open(os.path.join(GEN_DIR, 'inventory.json'), 'w', encoding='utf-8') as f:
    json.dump(inventory_records, f)

with open(os.path.join(GEN_DIR, 'inventory_events.json'), 'w', encoding='utf-8') as f:
    json.dump(inventory_events, f)
print(f"Generated {len(inventory_records)} inventory items and {len(inventory_events)} inventory events.")

# -------------------------------------------------------------
# 6. GENERATE ORDERS, ITEMS, PAYMENTS, RETURNS, DELIVERIES
# -------------------------------------------------------------
print("Generating 15,000 realistic orders with correlated delay patterns...")
orders = []
order_items = []
payments = []
returns = []
deliveries = []

# Map products by id for fast lookup
prod_map = {p['product_id']: p for p in products}

# We will generate 15,000 orders
# Special cohort: 143 delayed orders from Coimbatore served by Warehouse W03!
# 18 of these 143 orders will explicitly contain Product P-204!

num_orders = 15000
order_start_date = datetime.now() - timedelta(days=90)

for idx in range(1, num_orders + 1):
    order_num = f"ORD-{idx:05d}"
    order_id = f"ord-{idx:05d}"
    
    # Check if this order belongs to the Coimbatore delayed cohort (143 orders)
    is_coimbatore_delayed = (idx <= 143)
    is_p204_affected = (idx <= 18)
    
    if is_coimbatore_delayed:
        cust_id = random.choice(['CUST-1042', 'CUST-1088', 'CUST-2105'] + customer_ids[:200])
        city = 'Coimbatore'
        state = 'Tamil Nadu'
        channel = random.choice(['website', 'marketplace'])
        warehouse_id = w_ids['W03']
        order_dt = datetime.now() - timedelta(days=random.randint(2, 6), hours=random.randint(1, 20))
        status = 'delayed'
        expected_del = (order_dt + timedelta(days=2)).isoformat()
        actual_del = None
    else:
        cust_id = random.choice(customer_ids)
        city_idx = random.choices(range(len(cities)), weights=city_weights)[0]
        city, state = city_choices[city_idx], state_choices[city_idx]
        channel = random.choices(['website', 'marketplace', 'retail_store'], weights=[0.55, 0.35, 0.10])[0]
        # Route warehouse
        if city == 'Coimbatore':
            warehouse_id = w_ids['W03']
        elif city in ['Bengaluru', 'Kochi']:
            warehouse_id = w_ids['W02']
        elif city in ['Mumbai', 'Pune']:
            warehouse_id = w_ids['W01']
        elif city in ['Delhi', 'Chandigarh', 'Lucknow']:
            warehouse_id = w_ids['W04']
        else:
            warehouse_id = random.choice(list(w_ids.values()))
            
        order_dt = order_start_date + timedelta(seconds=random.randint(0, int((datetime.now() - order_start_date).total_seconds())))
        
        # Realistic status distribution
        dice = random.random()
        if dice < 0.72:
            status = 'delivered'
        elif dice < 0.85:
            status = 'shipped'
        elif dice < 0.93:
            status = 'processing'
        elif dice < 0.97:
            status = 'delayed'
        else:
            status = 'cancelled'

        expected_del = (order_dt + timedelta(days=random.randint(2, 5))).isoformat()
        if status == 'delivered':
            actual_del = (order_dt + timedelta(days=random.randint(2, 4))).isoformat()
        else:
            actual_del = None

    # Generate Order Items
    items_in_order = []
    if is_p204_affected:
        items_in_order.append(('P-204', random.randint(1, 2)))
        if random.random() < 0.4:
            items_in_order.append((random.choice(product_ids[5:50]), 1))
    else:
        item_count = random.choices([1, 2, 3, 4], weights=[0.55, 0.30, 0.10, 0.05])[0]
        chosen_pids = random.sample(product_ids[:500], item_count)
        for cpid in chosen_pids:
            items_in_order.append((cpid, random.randint(1, 3)))

    order_total = 0.0
    for p_id, qty in items_in_order:
        p_obj = prod_map[p_id]
        unit_price = p_obj['price']
        total_p = round(unit_price * qty, 2)
        order_total += total_p
        
        item_id = f"item-{len(order_items) + 1:06d}"
        order_items.append({
            'id': item_id,
            'order_id': order_id,
            'product_id': p_id,
            'sku': p_obj['sku'],
            'product_name': p_obj['name'],
            'quantity': qty,
            'unit_price': unit_price,
            'total_price': total_p
        })

    order_total = round(order_total, 2)
    orders.append({
        'id': order_id,
        'order_number': order_num,
        'customer_id': cust_id,
        'channel': channel,
        'warehouse_id': warehouse_id,
        'order_date': order_dt.isoformat(),
        'status': status,
        'total_amount': order_total,
        'shipping_address': f"{random.randint(1, 999)}, Cross Street, {city}, {state}",
        'shipping_city': city,
        'expected_delivery': expected_del,
        'actual_delivery': actual_del,
        'created_at': order_dt.isoformat(),
        'updated_at': datetime.now().isoformat()
    })

    # Payment Record
    pay_status = 'failed' if (random.random() < 0.035 and status != 'delivered') else 'success'
    payments.append({
        'id': f"pay-{idx:05d}",
        'order_id': order_id,
        'payment_method': random.choice(['credit_card', 'upi', 'net_banking', 'cod', 'wallet']),
        'amount': order_total,
        'status': pay_status,
        'transaction_date': order_dt.isoformat(),
        'failure_reason': 'Gateway timeout on bank response' if pay_status == 'failed' else None
    })

    # Delivery Record
    deliv_partner = random.choice(['SpeedFast', 'BlueDart', 'Delhivery', 'ExpressCargo', 'LocalHub'])
    deliv_status = 'delayed' if status == 'delayed' else ('delivered' if status == 'delivered' else 'in_transit')
    deliveries.append({
        'id': f"del-{idx:05d}",
        'order_id': order_id,
        'tracking_number': f"TRK-{deliv_partner[:3].upper()}-{idx:06d}",
        'partner': deliv_partner,
        'status': deliv_status,
        'origin_warehouse_id': warehouse_id,
        'destination_city': city,
        'dispatched_at': (order_dt + timedelta(hours=12)).isoformat(),
        'estimated_delivery': expected_del,
        'actual_delivery': actual_del,
        'delay_reason': 'Origin facility stock fulfillment delayed' if is_coimbatore_delayed else (
            'Local logistics routing issue' if deliv_status == 'delayed' else None
        )
    })

    # Returns (for delivered items, especially high-return products like P-512 and P-884)
    if status == 'delivered':
        has_high_return_item = any(p_id in ['P-512', 'P-884'] for p_id, _ in items_in_order)
        should_return = has_high_return_item if random.random() < 0.28 else (random.random() < 0.03)
        if should_return and len(returns) < 3200:
            ret_pid, _ = items_in_order[0]
            ret_price = prod_map[ret_pid]['price']
            returns.append({
                'id': f"ret-{len(returns) + 1:05d}",
                'return_number': f"RET-{len(returns) + 1:05d}",
                'order_id': order_id,
                'product_id': ret_pid,
                'product_name': prod_map[ret_pid]['name'],
                'reason': 'Specification mismatch / Lumbar support defect' if ret_pid == 'P-512' else (
                    'Bluetooth pairing dropout / audio crackling' if ret_pid == 'P-884' else 'Size or fit issue'
                ),
                'status': random.choice(['requested', 'approved', 'refunded']),
                'refund_amount': ret_price,
                'created_at': (datetime.fromisoformat(actual_del) + timedelta(days=random.randint(1, 7))).isoformat()
            })

with open(os.path.join(GEN_DIR, 'orders.json'), 'w', encoding='utf-8') as f:
    json.dump(orders, f)

with open(os.path.join(GEN_DIR, 'order_items.json'), 'w', encoding='utf-8') as f:
    json.dump(order_items, f)

with open(os.path.join(GEN_DIR, 'payments.json'), 'w', encoding='utf-8') as f:
    json.dump(payments, f)

with open(os.path.join(GEN_DIR, 'deliveries.json'), 'w', encoding='utf-8') as f:
    json.dump(deliveries, f)

with open(os.path.join(GEN_DIR, 'returns.json'), 'w', encoding='utf-8') as f:
    json.dump(returns, f)

print(f"Generated {len(orders)} orders, {len(order_items)} items, {len(payments)} payments, {len(deliveries)} deliveries, {len(returns)} returns.")

# -------------------------------------------------------------
# 7. GENERATE SUPPORT TICKETS (5,000 support tickets)
# -------------------------------------------------------------
print("Generating 5,000 support tickets in MongoDB format...")
support_tickets = []

# Repeat customer tickets from Coimbatore for orders with P-204 & delays
coimbatore_complaints = [
    ("CUST-1042", "ORD-00001", "delivery_delay", "urgent", "My order ORD-00001 for AeroPulse P-204 is delayed by 4 days in Coimbatore! No updates from W03 hub. Need this immediately for a health monitor.", "open", "W03_INVENTORY_SYNC_ERROR"),
    ("CUST-1042", "ORD-00001", "delivery_delay", "urgent", "Second follow-up! Still no progress on ORD-00001. Support executive promised dispatch 24h ago.", "escalated", "W03_INVENTORY_SYNC_ERROR"),
    ("CUST-1042", "ORD-00001", "refund_status", "high", "Third time contacting support. If Product P-204 cannot be shipped from Coimbatore warehouse, please refund or transfer from Bengaluru.", "open", "W03_INVENTORY_SYNC_ERROR"),
    ("CUST-1088", "ORD-00003", "delivery_delay", "high", "Order ORD-00003 delayed. Tracking says 'Awaiting stock allocation at Coimbatore W03'. What is going on?", "open", "W03_INVENTORY_SYNC_ERROR"),
    ("CUST-1088", "ORD-00003", "inventory_issue", "urgent", "Follow-up: Spoke to support yesterday, was told P-204 inventory is being reconciled. Please prioritize delivery to RS Puram, Coimbatore.", "escalated", "W03_INVENTORY_SYNC_ERROR"),
    ("CUST-2105", "ORD-00005", "delivery_delay", "urgent", "Enterprise shipment of P-204 trackers for our Coimbatore corporate wellness program is stuck. 10 units pending.", "escalated", "W03_INVENTORY_SYNC_ERROR"),
    ("CUST-2105", "ORD-00005", "delivery_delay", "urgent", "Escalation: Account manager promised W03 would dispatch. Need cross-warehouse transfer from W02 Bengaluru immediately!", "open", "W03_INVENTORY_SYNC_ERROR")
]

for cid, oid, cat, prio, msg, stat, tag in coimbatore_complaints:
    support_tickets.append({
        'ticket_id': f"TCK-{len(support_tickets) + 1:05d}",
        'customer_id': cid,
        'order_id': oid,
        'category': cat,
        'priority': prio,
        'message': msg,
        'status': stat,
        'root_cause_tag': tag,
        'created_at': (datetime.now() - timedelta(days=random.randint(1, 3), hours=random.randint(2, 18))).isoformat(),
        'resolved_at': None
    })

# Add 25 more Coimbatore delay tickets
for i in range(2, 28):
    support_tickets.append({
        'ticket_id': f"TCK-{len(support_tickets) + 1:05d}",
        'customer_id': customer_ids[i],
        'order_id': f"ORD-{i:05d}",
        'category': 'delivery_delay',
        'priority': random.choice(['high', 'medium', 'urgent']),
        'message': f"Order ORD-{i:05d} to Coimbatore is delayed. Origin facility W03 has not dispatched.",
        'status': random.choice(['open', 'investigating', 'escalated']),
        'root_cause_tag': 'W03_INVENTORY_SYNC_ERROR',
        'created_at': (datetime.now() - timedelta(days=random.randint(1, 4))).isoformat(),
        'resolved_at': None
    })

# Fill remaining up to 5,000 tickets
ticket_cats = ['delivery_delay', 'product_quality', 'refund_status', 'inventory_issue', 'damaged_item', 'general']
ticket_prios = ['low', 'medium', 'high', 'urgent']
ticket_statuses = ['open', 'investigating', 'escalated', 'resolved']

while len(support_tickets) < 5000:
    t_idx = len(support_tickets) + 1
    c_id = random.choice(customer_ids)
    cat = random.choice(ticket_cats)
    prio = random.choices(ticket_prios, weights=[0.30, 0.40, 0.20, 0.10])[0]
    stat = random.choices(ticket_statuses, weights=[0.25, 0.20, 0.10, 0.45])[0]
    
    msg_templates = {
        'delivery_delay': f"Shipment tracking has not updated for 3 days. Where is my parcel?",
        'product_quality': f"Product packaging arrived scuffed and contents seem defective. Requesting replacement.",
        'refund_status': f"Returned item last week, waiting for bank refund confirmation.",
        'inventory_issue': f"Item showed in stock during order placement but now shows backordered.",
        'damaged_item': f"Item was cracked upon opening box. Pictures sent to support email.",
        'general': f"Need invoice copy with GST details for corporate expense filing."
    }

    created = datetime.now() - timedelta(days=random.randint(1, 60))
    resolved = (created + timedelta(days=random.randint(1, 4))).isoformat() if stat == 'resolved' else None

    support_tickets.append({
        'ticket_id': f"TCK-{t_idx:05d}",
        'customer_id': c_id,
        'order_id': f"ORD-{random.randint(1, num_orders):05d}" if random.random() < 0.8 else None,
        'category': cat,
        'priority': prio,
        'message': msg_templates[cat],
        'status': stat,
        'root_cause_tag': None,
        'created_at': created.isoformat(),
        'resolved_at': resolved
    })

with open(os.path.join(GEN_DIR, 'support_tickets.json'), 'w', encoding='utf-8') as f:
    json.dump(support_tickets, f)
print(f"Generated {len(support_tickets)} support tickets.")

# -------------------------------------------------------------
# 8. GENERATE OPERATIONAL INCIDENTS (Real Correlation Event!)
# -------------------------------------------------------------
incidents = [
    {
        'id': 'inc-001',
        'incident_number': 'INC-2026-081',
        'title': 'Warehouse W03 Inventory Synchronization Failure & Discrepancy',
        'severity': 'high',
        'service': 'inventory-api',
        'description': 'Network partition and stale inventory cache in W03 edge gateway caused out-of-sync available stock counts. Systems accepted orders for Product P-204 despite zero physical inventory, impacting 143 orders in Coimbatore region.',
        'affected_records_count': 143,
        'status': 'Open',
        'root_cause': 'Inventory synchronization failure at Warehouse W03 edge gateway caused out-of-sync inventory values and fulfillment failure for P-204.',
        'resolution': 'Requires inventory restock / cross-warehouse transfer from W02 to W03 and cache invalidation.',
        'created_at': (datetime.now() - timedelta(hours=30)).isoformat(),
        'updated_at': datetime.now().isoformat()
    },
    {
        'id': 'inc-002',
        'incident_number': 'INC-2026-079',
        'title': 'SpeedFast Logistics South-Zone Hub Routing Congestion',
        'severity': 'medium',
        'service': 'delivery-api',
        'description': 'Heavy vehicle route breakdown near Salem bypass resulting in +36h transit delays for consignments routed south.',
        'affected_records_count': 54,
        'status': 'Investigating',
        'root_cause': 'Highway vehicle breakdown causing hub queue backlog.',
        'resolution': 'Re-routed critical parcels via BlueDart secondary network.',
        'created_at': (datetime.now() - timedelta(hours=48)).isoformat(),
        'updated_at': datetime.now().isoformat()
    },
    {
        'id': 'inc-003',
        'incident_number': 'INC-2026-074',
        'title': 'UPI Payment Gateway Bank Webhook Timeout Surge',
        'severity': 'low',
        'service': 'payment-api',
        'description': 'Intermittent 504 timeouts on bank clearing house webhooks between 14:00 - 15:30 yesterday.',
        'affected_records_count': 28,
        'status': 'Resolved',
        'root_cause': 'NPCI UPI switch momentary latency peak.',
        'resolution': 'Re-polled pending transactions; all 28 settled or reversed automatically.',
        'created_at': (datetime.now() - timedelta(days=2)).isoformat(),
        'updated_at': (datetime.now() - timedelta(days=1)).isoformat()
    }
]

with open(os.path.join(GEN_DIR, 'incidents.json'), 'w', encoding='utf-8') as f:
    json.dump(incidents, f, indent=2)
print("Generated operational incidents.")

# -------------------------------------------------------------
# 9. GENERATE INITIAL AUDIT LOGS
# -------------------------------------------------------------
audit_logs = [
    {
        'id': 'aud-001',
        'user_email': 'system@shopsphere.com',
        'action': 'SYSTEM_INCIDENT_FLAGGED',
        'entity': 'INCIDENT',
        'entity_id': 'INC-2026-081',
        'reason': 'Automated inventory mismatch monitor flagged 50 unit discrepancy on P-204 at W03',
        'details': {'warehouse': 'W03', 'product': 'P-204', 'delta': -50},
        'status': 'SUCCESS',
        'timestamp': (datetime.now() - timedelta(hours=29)).isoformat()
    },
    {
        'id': 'aud-002',
        'user_email': 'admin@shopsphere.com',
        'action': 'USER_ROLE_ASSIGNED',
        'entity': 'USER',
        'entity_id': 'USR-002',
        'reason': 'Assigned Operations Manager role to ops.lead@shopsphere.com',
        'details': {'assigned_role': 'Operations Manager'},
        'status': 'SUCCESS',
        'timestamp': (datetime.now() - timedelta(days=10)).isoformat()
    }
]

with open(os.path.join(GEN_DIR, 'audit_logs.json'), 'w', encoding='utf-8') as f:
    json.dump(audit_logs, f, indent=2)
print("Generated initial audit logs.")

print("All synthetic datasets generated successfully!")
