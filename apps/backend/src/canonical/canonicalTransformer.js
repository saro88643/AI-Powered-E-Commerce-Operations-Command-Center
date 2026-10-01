// ShopSphere Canonical Data Transformation Engine

class CanonicalTransformer {
  /**
   * Applies transformation rules based on registered mappings
   * @param {Object} rawRecord External client record
   * @param {Array} mappings Field mappings from PostgreSQL
   * @returns {Object} Normalized canonical record
   */
  static transform(rawRecord, mappings = []) {
    const canonical = {};

    for (const map of mappings) {
      if (!map.is_active) continue;

      const rawVal = rawRecord[map.source_field];
      if (rawVal === undefined || rawVal === null) {
        continue;
      }

      let transformedVal = rawVal;

      switch (map.transformation) {
        case 'string_to_int':
          transformedVal = parseInt(rawVal, 10);
          if (isNaN(transformedVal)) transformedVal = 0;
          break;

        case 'uppercase':
          transformedVal = String(rawVal).toUpperCase().trim();
          break;

        case 'trim':
          transformedVal = String(rawVal).trim();
          break;

        case 'currency_inr_to_usd':
          // Standard conversion for enterprise client export
          transformedVal = Number((parseFloat(rawVal) / 84.5).toFixed(2));
          break;

        case 'date_iso':
          try {
            transformedVal = new Date(rawVal).toISOString();
          } catch (e) {
            transformedVal = rawVal;
          }
          break;

        default:
          if (map.data_type === 'number') {
            transformedVal = Number(rawVal);
          } else if (map.data_type === 'string') {
            transformedVal = String(rawVal);
          }
      }

      canonical[map.target_field] = transformedVal;
    }

    return canonical;
  }

  static toCanonicalProduct(raw, mappings = []) {
    const base = this.transform(raw, mappings);
    return {
      product_id: base.product_id || raw.sku || raw.product_id,
      sku: base.sku || raw.sku || raw.product_id,
      name: base.name || raw.product_name || raw.name || 'Unnamed Product',
      category: base.category || raw.category || 'General',
      brand: base.brand || raw.brand || 'ShopSphere',
      price: Number(base.price || raw.price || 0),
      cost: Number(base.cost || raw.cost || 0),
      supplier_id: base.supplier_id || raw.supplier_id || 'SUP-001',
      reorder_threshold: Number(base.reorder_threshold || raw.reorder_threshold || 20)
    };
  }

  static toCanonicalInventory(raw, mappings = []) {
    const base = this.transform(raw, mappings);
    return {
      product_id: base.product_id || raw.productId || raw.product_id,
      warehouse_id: base.warehouse || raw.warehouseId || raw.warehouse_id,
      available_quantity: Number(base.stock !== undefined ? base.stock : (raw.available_quantity || raw.availableQuantity || 0)),
      reserved_quantity: Number(raw.reserved_quantity || raw.reservedQuantity || 0),
      status: raw.status || 'Healthy'
    };
  }

  static toCanonicalOrder(raw, mappings = []) {
    const base = this.transform(raw, mappings);
    return {
      order_number: base.order_number || raw.client_order_no || raw.order_number || raw.order_id,
      customer_id: base.customer_id || raw.user_identifier || raw.customer_id,
      warehouse_id: (base.warehouse_id || raw.destination_warehouse || raw.warehouse_id || 'BLR-W02').toUpperCase().trim(),
      total_amount: base.total_amount !== undefined ? base.total_amount : (raw.gross_amount_usd ? raw.gross_amount_usd * 83 : (raw.total_amount || 0)),
      status: base.status || raw.carrier_tracking_status || raw.status || 'processing'
    };
  }

  static transformOrder(raw, mappings = []) {
    return this.toCanonicalOrder(raw, mappings);
  }
}

module.exports = CanonicalTransformer;
