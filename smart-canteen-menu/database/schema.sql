-- ==============================================================================
-- SMART CANTEEN MENU - DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- ==============================================================================
-- This script sets up all tables, constraints, indexes, triggers,
-- Row Level Security (RLS) policies, and starter menu items.
--
-- How to apply:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Navigate to "SQL Editor" in the left sidebar.
-- 3. Click "New query", paste the contents of this file, and click "Run".
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. DROP TABLES IF THEY EXIST (for clean re-runs)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;

-- 3. CREATE MENU ITEMS TABLE
CREATE TABLE menu_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(50) NOT NULL, -- 'Breakfast', 'Meals', 'Snacks', 'Beverages', 'Healthy'
    is_veg BOOLEAN NOT NULL DEFAULT true,
    is_available BOOLEAN NOT NULL DEFAULT true,
    preparation_time INTEGER NOT NULL DEFAULT 10 CHECK (preparation_time > 0), -- in minutes
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CREATE ORDERS TABLE
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number VARCHAR(20) NOT NULL UNIQUE,
    student_name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    pickup_counter VARCHAR(50) NOT NULL DEFAULT 'Counter 1',
    special_instructions TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending' 
        CHECK (status IN ('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled')),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI / Counter Pay',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CREATE ORDER ITEMS TABLE
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES menu_items(id) ON DELETE SET NULL,
    item_name VARCHAR(120) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INDEXES FOR HIGH QUERY PERFORMANCE
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_is_available ON menu_items(is_available);
CREATE INDEX idx_menu_items_is_veg ON menu_items(is_veg);
CREATE INDEX idx_orders_token_number ON orders(token_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- 7. AUTOMATIC TIMESTAMP UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_menu_items_updated_at
BEFORE UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- In this college canteen web application, students and canteen staff access the system
-- via the Node.js/Express backend (service layer) or via anonymous API keys.
-- We enable RLS and provide permissive policies suitable for an educational canteen kiosk.

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access for menu_items
CREATE POLICY "Allow public read on menu_items" 
    ON menu_items FOR SELECT USING (true);

CREATE POLICY "Allow public insert on menu_items" 
    ON menu_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on menu_items" 
    ON menu_items FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on menu_items" 
    ON menu_items FOR DELETE USING (true);

-- Allow public read & write access for orders
CREATE POLICY "Allow public read on orders" 
    ON orders FOR SELECT USING (true);

CREATE POLICY "Allow public insert on orders" 
    ON orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on orders" 
    ON orders FOR UPDATE USING (true);

CREATE POLICY "Allow public delete on orders" 
    ON orders FOR DELETE USING (true);

-- Allow public read & write access for order_items
CREATE POLICY "Allow public read on order_items" 
    ON order_items FOR SELECT USING (true);

CREATE POLICY "Allow public insert on order_items" 
    ON order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on order_items" 
    ON order_items FOR DELETE USING (true);

-- 9. SEED DATA - REALISTIC CAMPUS CANTEEN MENU ITEMS
INSERT INTO menu_items (name, description, price, category, is_veg, is_available, preparation_time, image_url) VALUES
('Crispy Masala Dosa', 'Golden thin crepe filled with spiced potato masala, served with coconut chutney & piping hot sambar.', 60.00, 'Breakfast', true, true, 8, 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop&q=80'),
('Classic Veg Burger & Fries', 'Crisp vegetable patty with iceberg lettuce, fresh tomatoes, creamy mayo in a toasted sesame bun.', 75.00, 'Snacks', true, true, 10, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80'),
('Paneer Butter Masala Thali', 'Rich cottage cheese curry, 3 butter rotis, fragrant jeera rice, dal tadka, salad and sweet gulab jamun.', 120.00, 'Meals', true, true, 12, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&auto=format&fit=crop&q=80'),
('Iced Cold Coffee with Ice Cream', 'Chilled espresso blended with thick creamy milk, topped with a scoop of vanilla ice cream & cocoa drizzle.', 45.00, 'Beverages', true, true, 5, 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80'),
('Delhi Samosa Chaat (2 Pcs)', 'Crushed golden samosas layered with spiced chole, sweet tamarind chutney, mint sauce & crispy sev.', 40.00, 'Snacks', true, true, 6, 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80'),
('Grilled Cheese Chicken Sandwich', 'Shredded smoked chicken, melted cheddar cheese, bell peppers & Italian herb seasoning grilled to perfection.', 85.00, 'Snacks', false, true, 10, 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80'),
('Special Chicken Dum Biryani', 'Aromatic basmati rice cooked with tender marinated chicken pieces, whole spices, served with mint raita.', 140.00, 'Meals', false, true, 15, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80'),
('Chole Bhature Platter', 'Two fluffy hot bhaturas accompanied by slow-cooked spicy Punjabi chole, pickled onions and fried green chili.', 90.00, 'Breakfast', true, true, 10, 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop&q=80'),
('Masala Kulhad Chai', 'Strong brewed Assam tea infused with ginger, cardamom, and clove, served in an authentic earthen clay cup.', 20.00, 'Beverages', true, true, 4, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80'),
('Cheesy Schezwan Maggi', 'Campus favorite 2-minute noodles tossed with spicy Schezwan sauce, sweet corn and grated mozzarella.', 50.00, 'Snacks', true, true, 7, 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80'),
('Protein Sprout & Fruit Bowl', 'Moong sprouts, diced apples, pomegranate, cucumber, tossed with Himalayan pink salt and lemon mint dressing.', 65.00, 'Healthy', true, true, 5, 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80'),
('Fresh Mint Lemon Soda', 'Refreshing fizzy soda with squeezed yellow lemons, fresh mint leaves, roasted cumin, and black salt.', 30.00, 'Beverages', true, true, 3, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80');

-- End of schema.sql
