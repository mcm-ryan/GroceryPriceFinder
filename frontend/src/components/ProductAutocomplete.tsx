import { useState, useEffect } from 'react';
import { useCombobox } from 'downshift';
import type { ProductSearchResult } from '@grocery-price-finder/types';
import { searchProducts } from '../api/products';
import './ProductAutocomplete.css';

interface ProductAutocompleteProps {
  onProductSelect: (product: ProductSearchResult) => void;
  placeholder?: string;
}

export function ProductAutocomplete({ onProductSelect, placeholder }: ProductAutocompleteProps) {
  const [inputValue, setInputValue] = useState('');
  const [items, setItems] = useState<ProductSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch products when input changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (inputValue.trim().length === 0) {
        // Show common products when input is empty
        setIsLoading(true);
        try {
          const response = await searchProducts('', 10);
          setItems(response.products);
        } catch (error) {
          console.error('Failed to fetch products:', error);
          setItems([]);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      if (inputValue.trim().length < 2) {
        // Don't search for single characters
        setItems([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchProducts(inputValue, 10);
        setItems(response.products);
      } catch (error) {
        console.error('Failed to search products:', error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  const {
    isOpen,
    getToggleButtonProps,
    getLabelProps,
    getMenuProps,
    getInputProps,
    highlightedIndex,
    getItemProps,
    selectedItem,
    reset,
  } = useCombobox({
    items,
    inputValue,
    onInputValueChange: ({ inputValue }) => {
      setInputValue(inputValue || '');
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        onProductSelect(selectedItem);
        // Reset the combobox state and clear input
        setTimeout(() => {
          reset();
          setInputValue('');
        }, 0);
      }
    },
    itemToString: (item) => (item ? item.displayName : ''),
    // Prevent the input from being populated with the selected item
    stateReducer: (_, actionAndChanges) => {
      const { type, changes } = actionAndChanges;

      switch (type) {
        case useCombobox.stateChangeTypes.ItemClick:
        case useCombobox.stateChangeTypes.InputKeyDownEnter:
          return {
            ...changes,
            inputValue: '', // Keep input empty after selection
            isOpen: false,  // Close the menu
          };
        default:
          return changes;
      }
    },
  });

  return (
    <div className="product-autocomplete">
      <label {...getLabelProps()}>Add items to your grocery list:</label>
      <div className="autocomplete-input-wrapper">
        <input
          {...getInputProps()}
          placeholder={placeholder || 'Search for products (e.g., milk, eggs)...'}
          className="autocomplete-input"
        />
        <button
          type="button"
          {...getToggleButtonProps()}
          aria-label="toggle menu"
          className="autocomplete-toggle"
        >
          ▼
        </button>
      </div>
      <ul {...getMenuProps()} className="autocomplete-menu">
        {isOpen && (
          <>
            {isLoading && (
              <li className="autocomplete-item autocomplete-item-loading">
                Loading...
              </li>
            )}
            {!isLoading && items.length === 0 && inputValue && (
              <li className="autocomplete-item autocomplete-item-empty">
                No products found
              </li>
            )}
            {!isLoading &&
              items.map((item, index) => (
                <li
                  key={item.id}
                  {...getItemProps({ item, index })}
                  className={`autocomplete-item ${
                    highlightedIndex === index ? 'autocomplete-item-highlighted' : ''
                  } ${selectedItem === item ? 'autocomplete-item-selected' : ''}`}
                >
                  <div className="autocomplete-item-content">
                    <span className="autocomplete-item-name">{item.displayName}</span>
                    <span className="autocomplete-item-category">{item.category}</span>
                  </div>
                </li>
              ))}
          </>
        )}
      </ul>
    </div>
  );
}
