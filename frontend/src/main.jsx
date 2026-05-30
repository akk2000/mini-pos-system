import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({}); // { product_id: quantity }
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(err => { setMessage('Backend ချိတ်ဆက်မှု မအောင်မြင်ပါ!'); setLoading(false); });
  }, []);

  const addToCart = (product) => {
    const currentQty = cart[product.id] || 0;
    if (currentQty >= product.stock) {
      alert('ပစ္စည်း လက်ကျန်ထက် ကျော်လွန်၍ ဝယ်ယူ၍မရနိုင်ပါ!');
      return;
    }
    setCart({ ...cart, [product.id]: currentQty + 1 });
  };

  const calculateTotal = () => {
    return Object.keys(cart).reduce((sum, id) => {
      const product = products.find(p => p.id === parseInt(id));
      return sum + (product ? product.price * cart[id] : 0);
    }, 0);
  };

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) return;

    const payload = {
      items: Object.keys(cart).map(id => ({
        product_id: parseInt(id),
        quantity: cart[id]
      }))
    };

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        alert(`ဘေလ်ဖြတ်မှု အောင်မြင်ပါသည်။ \nInvoice ID: ${data.invoice_id}\nစုစုပေါင်းကျသင့်ငွေ: ${data.total_amount} MMK`);
        setCart({}); 
        return fetch('/api/products').then(res => res.json()).then(data => setProducts(data));
      } else {
        alert(`Error: ${data.detail}`);
      }
    })
    .catch(() => alert('Checkout လုပ်၍ မရနိုင်ပါ!'));
  };

  if (loading) return <h2 style={{ textAlign: 'center', marginTop: '50px' }}>Loading POS System...</h2>;

  return (
    <div style={{ display: 'flex', fontFamily: 'Arial, sans-serif', height: '100vh' }}>
      {/* ဘယ်ဘက်ခြမ်း: ပစ္စည်းပြခန်း (Products List) */}
      <div style={{ flex: 2, padding: '20px', overflowY: 'auto' }}>
        <h2 style={{ color: '#333' }}>🛒 Cafe POS Menu</h2>
        {message && <p style={{ color: 'red' }}>{message}</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
          {products.map(p => (
            <div key={p.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: 'white', width: '180px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h3>{p.name}</h3>
              <p style={{ color: '#007bff', fontWeight: 'bold' }}>{p.price} MMK</p>
              <p style={{ color: p.stock > 0 ? '#28a745' : '#dc3545', fontSize: '13px' }}>
                {p.stock > 0 ? `လက်ကျန်: ${p.stock} ခု` : 'ပစ္စည်းပြတ်နေသည်'}
              </p>
              <button 
                onClick={() => addToCart(p)} 
                disabled={p.stock <= 0}
                style={{ width: '100%', padding: '8px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ခြင်းတောင်းထဲထည့်မည်
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ညာဘက်ခြမ်း: ဘေလ်တွက်ချက်ရာနေရာ (Cart & Receipt) */}
      <div style={{ flex: 1, borderLeft: '1px solid #ddd', padding: '20px', background: 'white', display: 'flex', flexDirection: 'column' }}>
        <h2>📝 Current Order</h2>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {Object.keys(cart).map(id => {
            const product = products.find(p => p.id === parseInt(id));
            if (!product) return null;
            return (
              <div key={id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                <span>{product.name} (x{cart[id]})</span>
                <span>{product.price * cart[id]} MMK</span>
              </div>
            );
          })}
        </div>
        <div style={{ borderTop: '2px solid #333', paddingTop: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '18px', marginBottom: '15px' }}>
            <span>စုစုပေါင်း-</span>
            <span>{calculateTotal()} MMK</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={Object.keys(cart).length === 0}
            style={{ width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            ခေါက်আઉਟ (Checkout)
          </button>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);