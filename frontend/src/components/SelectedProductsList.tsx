import type { ProductSearchResult } from '@grocery-price-finder/types';
import './SelectedProductsList.css';

export interface SelectedProduct {
  product: ProductSearchResult;
  quantity: number;
}

interface SelectedProductsListProps {
  products: SelectedProduct[];
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

export function SelectedProductsList({
  products,
  onQuantityChange,
  onRemove,
}: SelectedProductsListProps) {
  if (products.length === 0) {
    return (
      <div className="selected-products-empty">
        <p>No products selected yet. Search and add products above.</p>
      </div>
    );
  }

  return (
    <div className="selected-products-list">
      <h3>Your Grocery List ({products.length} items)</h3>
      <ul className="products-list">
        {products.map(({ product, quantity }) => (
          <li key={product.id} className="product-item">
            <div className="product-info">
              <span className="product-name">{product.displayName}</span>
              <span className="product-category">{product.category}</span>
            </div>
            <div className="product-controls">
              <div className="quantity-controls">
                <button
                  type="button"
                  onClick={() => onQuantityChange(product.id, Math.max(1, quantity - 1))}
                  className="quantity-btn"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={quantity}
                  onChange={(e) => {
                    const newQuantity = parseInt(e.target.value);
                    if (!isNaN(newQuantity) && newQuantity > 0) {
                      onQuantityChange(product.id, newQuantity);
                    }
                  }}
                  className="quantity-input"
                  aria-label="Quantity"
                />
                <button
                  type="button"
                  onClick={() => onQuantityChange(product.id, Math.min(99, quantity + 1))}
                  className="quantity-btn"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => onRemove(product.id)}
                className="remove-btn"
                aria-label="Remove product"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
