import { useEffect, useState } from "react";
import "./App.css";

const API_URL ='https://drfproject-651j.onrender.com/api/products/';

const EMPTY_FORM = {
  name: "",
  price: "",
  description: "",
};

function App() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // READ: Fetch products from Django
  async function fetchProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Could not load products.");
      }

      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle changes in the form
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  }

  // Reset the form
  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  }

  // CREATE and UPDATE
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const name = form.name.trim();
    const price = form.price.trim();

    if (!name || !price) {
      setError("Product name and price are required.");
      return;
    }

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      setError("Enter a valid, non-negative price.");
      return;
    }

    const payload = {
      name,
      price,
      description: form.description.trim(),
    };

    const isEditing = editingId !== null;

    const url = isEditing
      ? `${API_URL}${editingId}/`
      : API_URL;

    const method = isEditing ? "PUT" : "POST";

    setSaving(true);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        const message = errorData
          ? Object.entries(errorData)
              .map(([field, messages]) => {
                const text = Array.isArray(messages)
                  ? messages.join(", ")
                  : String(messages);

                return `${field}: ${text}`;
              })
              .join(" | ")
          : "Unable to save product.";

        throw new Error(message);
      }

      await fetchProducts();
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Load a product into the form
  function handleEdit(product) {
    setForm({
      name: product.name,
      price: product.price,
      description: product.description || "",
    });

    setEditingId(product.id);
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // DELETE
  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response = await fetch(
        `${API_URL}${product.id}/`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Could not delete product.");
      }

      setProducts((previousProducts) =>
        previousProducts.filter(
          (item) => item.id !== product.id
        )
      );

      if (editingId === product.id) {
        resetForm();
      }
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="container">
      <header className="page-header">
        <h1>Product Management</h1>
        <p>React + Vite + Django REST Framework</p>
      </header>

      <section className="card">
        <h2>
          {editingId !== null
            ? "Edit Product"
            : "Add New Product"}
        </h2>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Product Name</label>

            <input
              id="name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter product name"
              maxLength={100}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="price">Price (৳)</label>

            <input
              id="price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="Enter price"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter product description"
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Product"
                  : "Add Product"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="products-section">
        <h2>Product List</h2>

        {loading ? (
          <p>Loading products...</p>
        ) : products.length === 0 ? (
          <p>No products found. Add your first product.</p>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <article
                className="product-card"
                key={product.id}
              >
                <h3>{product.name}</h3>

                <p className="price">
                  ৳{product.price}
                </p>

                <p className="description">
                  {product.description || "No description"}
                </p>

                <div className="product-actions">
                  <button
                    type="button"
                    className="edit-button"
                    onClick={() => handleEdit(product)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => handleDelete(product)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
