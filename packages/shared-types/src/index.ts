// ShopSphere Shared Types & Domain Models

export type UserRole =
  | 'Admin'
  | 'Operations Manager'
  | 'Warehouse Manager'
  | 'Support Agent'
  | 'Analyst'
  | 'Viewer';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt: string;
}

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delayed'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type Channel = 'website' | 'marketplace' | 'retail_store';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  channel: Channel;
  warehouseId: string;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  shippingAddress: string;
  shippingCity: string;
  expectedDelivery: string;
  actualDelivery?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  customer?: Customer;
  delivery?: DeliveryRecord;
  payment?: PaymentRecord;
  returns?: ReturnRecord[];
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentMethod: 'credit_card' | 'upi' | 'net_banking' | 'cod' | 'wallet';
  amount: number;
  status: 'success' | 'failed' | 'refunded' | 'pending';
  transactionDate: string;
  failureReason?: string;
}

export interface ReturnRecord {
  id: string;
  returnNumber: string;
  orderId: string;
  productId: string;
  productName?: string;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'refunded';
  refundAmount: number;
  createdAt: string;
}

export interface Customer {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  segment: 'Enterprise' | 'VIP' | 'Regular' | 'Occasional';
  lifetimeValue: number;
  createdAt: string;
}

export interface SupportTicket {
  ticketId: string;
  customerId: string;
  orderId?: string;
  category: 'delivery_delay' | 'product_quality' | 'refund_status' | 'inventory_issue' | 'damaged_item' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  message: string;
  status: 'open' | 'investigating' | 'escalated' | 'resolved';
  rootCauseTag?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface CustomerEvent {
  customerId: string;
  eventType: 'page_view' | 'cart_abandon' | 'checkout_attempt' | 'support_call' | 'ticket_created' | 'return_initiated';
  metadata: Record<string, any>;
  timestamp: string;
}

export interface CommunicationRecord {
  customerId: string;
  channel: 'email' | 'sms' | 'whatsapp' | 'in_app';
  subject: string;
  message: string;
  sentAt: string;
  status: 'sent' | 'delivered' | 'failed';
}

export interface Warehouse {
  id: string;
  code: string; // e.g. W01, W02, W03
  name: string;
  city: string;
  state: string;
  address: string;
  capacity: number;
  currentUtilization: number;
  apiStatus: 'healthy' | 'degraded' | 'sync_error';
  createdAt: string;
}

export type InventoryStatus = 'Healthy' | 'Low Stock' | 'Critical' | 'Mismatch';

export interface InventoryItem {
  id: string;
  productId: string;
  sku: string;
  warehouseId: string;
  warehouseCode?: string;
  productName?: string;
  category?: string;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity: number;
  reorderThreshold: number;
  status: InventoryStatus;
  lastSyncAt: string;
}

export interface InventoryEvent {
  id: string;
  eventType: 'sync' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'restock' | 'reservation';
  productId: string;
  warehouseId: string;
  quantity: number;
  previousQty: number;
  newQty: number;
  reason: string;
  referenceId?: string;
  createdAt: string;
}

export interface RestockRequest {
  id: string;
  requestNumber: string;
  productId: string;
  warehouseId: string;
  supplierId: string;
  quantity: number;
  status: 'pending' | 'ordered' | 'received' | 'cancelled';
  requestedBy: string;
  createdAt: string;
}

export interface InventoryTransfer {
  id: string;
  transferNumber: string;
  productId: string;
  productName?: string;
  fromWarehouseId: string;
  fromWarehouseCode?: string;
  toWarehouseId: string;
  toWarehouseCode?: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'completed' | 'cancelled';
  reason: string;
  requestedBy: string;
  executedAt?: string;
  createdAt: string;
}

export interface DeliveryRecord {
  id: string;
  orderId: string;
  trackingNumber: string;
  partner: 'SpeedFast' | 'BlueDart' | 'Delhivery' | 'ExpressCargo' | 'LocalHub';
  status: 'in_transit' | 'delayed' | 'out_for_delivery' | 'delivered' | 'failed_attempt';
  originWarehouseId: string;
  destinationCity: string;
  dispatchedAt: string;
  estimatedDelivery: string;
  actualDelivery?: string;
  delayReason?: string;
}

export interface IncidentRecord {
  id: string;
  incidentNumber: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  service: string;
  description: string;
  affectedRecordsCount: number;
  status: 'Open' | 'Investigating' | 'Mitigated' | 'Resolved';
  rootCause?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  reason: string;
  details: Record<string, any>;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  timestamp: string;
}

// FDE Integration Types
export interface IntegrationConnection {
  id: string;
  systemName: string;
  baseUrl: string;
  authType: 'api_key' | 'bearer' | 'basic';
  apiKey?: string;
  environment: 'production' | 'staging' | 'sandbox';
  status: 'connected' | 'degraded' | 'disconnected' | 'testing';
  endpointsStatus: {
    authentication: boolean;
    productsEndpoint: boolean;
    inventoryEndpoint: boolean;
    ordersEndpoint: boolean;
    responseFormat: boolean;
  };
  lastTestAt?: string;
}

export interface FieldMapping {
  id: string;
  integrationId: string;
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'array';
  transformation?: 'string_to_int' | 'uppercase' | 'trim' | 'currency_inr_to_usd' | 'date_iso';
  validationRule?: string;
  isActive: boolean;
}

// Canonical Models
export interface CanonicalProduct {
  productId: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  cost: number;
  supplierId: string;
  weight: number;
  reorderThreshold: number;
}

export interface CanonicalInventory {
  productId: string;
  warehouseId: string;
  availableQuantity: number;
  reservedQuantity: number;
  reorderThreshold: number;
}

export interface CanonicalOrder {
  orderId: string;
  customerId: string;
  channel: Channel;
  warehouseId: string;
  status: OrderStatus;
  totalAmount: number;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

// AI Agent & Investigation Types
export interface InvestigationStep {
  id: string;
  title: string;
  status: 'running' | 'completed' | 'failed';
  tool: string;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  summary: string;
  timestamp: string;
}

export interface EvidenceCard {
  id: string;
  title: string;
  type: 'order' | 'warehouse' | 'inventory' | 'ticket' | 'delivery' | 'policy' | 'incident';
  metric: string;
  description: string;
  linkId?: string;
  linkRoute?: string;
  rawDetails?: Record<string, any>;
}

export interface PolicyCitation {
  documentId: string;
  documentName: string;
  section: string;
  page: number;
  chunkId: string;
  content: string;
}

export interface ActionPreview {
  actionType: 'create_transfer' | 'create_restock' | 'update_order' | 'issue_refund' | 'create_ticket' | 'create_incident';
  actionTitle: string;
  reason: string;
  affectedRecordsCount: number;
  affectedRecordsSummary: string;
  expectedImpact: string;
  parameters: Record<string, any>;
  requiresConfirmation: boolean;
}

export interface AIResponse {
  summary: string;
  findings: string[];
  evidence: EvidenceCard[];
  dataSources: string[];
  citations?: PolicyCitation[];
  rootCauseAnalysis?: {
    observedSymptoms: string[];
    evidenceSummary: string;
    possibleCauses: string[];
    correlations: string[];
    rootCause: string;
    businessImpact: string;
    confidence: 'High' | 'Medium' | 'Low';
  };
  recommendedAction?: ActionPreview;
  investigationSteps: InvestigationStep[];
  lineage: {
    question: string;
    dataSources: string[];
    toolsExecuted: string[];
    recordsAnalyzedCount: number;
    conclusion: string;
  };
}
