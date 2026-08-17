import Barcode from "react-barcode";
import { formatPrice } from "../utils/priceFormatters";
import PropTypes from "prop-types";

function ProductCard({ product, onAddToCart, billType }) {
  const {
    name,
    description,
    image,
    retailPrice,
    wholesalePrice,
    quantity,
    sku,
    category,
  } = product;

  // Get the appropriate price based on bill type
  const price = billType === "wholesale" ? wholesalePrice : retailPrice;

  return (
    <div className="bg-bg-secondary rounded-lg shadow p-4 border border-border-color hover:shadow-md transition-shadow duration-200">
      <div className="aspect-w-1 aspect-h-1 mb-3 relative">
        <img
          src={image || "https://via.placeholder.com/150"}
          alt={name}
          className="object-cover rounded-lg w-full h-32"
        />
        {category && (
          <span className="absolute top-2 left-2 bg-accent-primary text-white text-xs font-semibold px-2 py-0.5 rounded-full capitalize shadow">
            {category}
          </span>
        )}
        <span
          className={`absolute top-2 right-2 text-xs font-bold px-2 py-0.5 rounded-full ${
            quantity > 0
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {quantity > 0 ? `${quantity} in stock` : "Out of stock"}
        </span>
      </div>
      <h3 className="text-base font-semibold text-text-primary truncate">{name}</h3>
      <p className="text-gray-600 text-sm mb-2">
        {description || "No description available"}
      </p>
      <div className="flex justify-between items-center mb-2">
        <span className="text-lg font-bold">${formatPrice(price)}</span>
        <span
          className={`text-sm ${
            quantity > 0 ? "text-green-600" : "text-red-600"
          }`}
        >
          Stock: {quantity}
        </span>
      </div>
      <div className="mb-3">
        <Barcode value={sku} width={1.5} height={40} fontSize={12} />
      </div>
      <button
        className="btn btn-primary w-full"
        onClick={() => onAddToCart(product)}
        disabled={quantity === 0}
      >
        {quantity === 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}
ProductCard.propTypes = {
  product: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    image: PropTypes.string,
    retailPrice: PropTypes.number.isRequired,
    wholesalePrice: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
    sku: PropTypes.string.isRequired,
    category: PropTypes.string,
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired,
  billType: PropTypes.string.isRequired,
};

export default ProductCard;
