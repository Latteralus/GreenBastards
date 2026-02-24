import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { fmt } from "../../helpers";

// ─── COLORS & DESIGN TOKENS ─────────────────────────────────────────────────
const C = {
  bg:        "#0d0a1a",
  bgAlt:     "#111820",
  bgDeep:    "#0a0714",
  gold:      "#c8a820",
  goldDark:  "#a08010",
  text:      "#e8e0d0",
  textSec:   "#8a9a8a",
  textMuted: "#5a6a5a",
  textVMuted:"#3a4a3a",
  border:    "rgba(180,140,20,0.15)",
  borderEm:  "rgba(180,140,20,0.3)",
  card:      "rgba(15,10,30,0.8)",
  green:     "#50c860",
  red:       "#e05050",
  amber:     "#e09030",
  inputBg:   "rgba(255,255,255,0.04)",
  inputBdr:  "rgba(180,140,20,0.2)",
  navBg:     "rgba(10,7,20,0.95)",
};

const goldGradient = `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`;
const font = "Georgia, serif";

// ─── REUSABLE STYLES ─────────────────────────────────────────────────────────
const btnGold = {
  background: goldGradient,
  color: C.bg,
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: 2,
  border: "none",
  padding: "14px 32px",
  fontSize: 14,
  fontFamily: font,
  cursor: "pointer",
  borderRadius: 4,
  transition: "opacity 0.2s",
};

const btnOutline = {
  background: "transparent",
  color: C.gold,
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: 2,
  border: `2px solid ${C.gold}`,
  padding: "12px 30px",
  fontSize: 14,
  fontFamily: font,
  cursor: "pointer",
  borderRadius: 4,
  transition: "all 0.2s",
};

const inputStyle = {
  background: C.inputBg,
  border: `1px solid ${C.inputBdr}`,
  color: C.text,
  fontFamily: font,
  fontSize: 14,
  padding: "10px 14px",
  borderRadius: 4,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const sectionHeading = {
  color: C.gold,
  fontSize: 32,
  fontWeight: "bold",
  letterSpacing: 3,
  textTransform: "uppercase",
  marginBottom: 8,
  fontFamily: font,
};

const goldUnderline = {
  width: 60,
  height: 3,
  background: goldGradient,
  margin: "0 auto 40px",
  borderRadius: 2,
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function PublicSite() {
  // ── state ──
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);
  const [showAllProducts, setShowAllProducts] = useState(true);

  // order form
  const [quantities, setQuantities] = useState({});
  const [icName, setIcName] = useState("");
  const [discord, setDiscord] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("Pickup");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null); // { id }

  // hover states
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredNav, setHoveredNav] = useState(null);

  // refs for scroll
  const heroRef = useRef(null);
  const aboutRef = useRef(null);
  const menuRef = useRef(null);
  const orderRef = useRef(null);

  // ── fetch products ──
  useEffect(() => {
    (async () => {
      setLoadingProducts(true);
      setProductsError(null);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) {
        setProductsError(error.message);
      } else {
        setProducts(data || []);
      }
      setLoadingProducts(false);
    })();
  }, []);

  // ── smooth scroll helper ──
  const scrollTo = useCallback((ref) => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // ── order helpers ──
  const inStockProducts = products.filter((p) => p.in_stock && p.stock_qty > 0);
  const displayProducts = showAllProducts ? products : products.filter((p) => p.in_stock && p.stock_qty > 0);

  const setQty = (productId, val) => {
    const n = Math.max(0, parseInt(val, 10) || 0);
    setQuantities((prev) => ({ ...prev, [productId]: n }));
  };

  const orderTotal = inStockProducts.reduce((sum, p) => {
    const qty = quantities[p.id] || 0;
    return sum + qty * p.price;
  }, 0);

  const hasItems = orderTotal > 0;
  const canSubmit = hasItems && icName.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setOrderError(null);

    try {
      // 1. Insert order
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .insert({
          customer_ic_name: icName.trim(),
          customer_discord: discord.trim() || null,
          delivery_method: deliveryMethod,
          delivery_location: deliveryMethod === "Delivery" ? deliveryLocation.trim() : null,
          total_cost: Math.round(orderTotal * 100) / 100,
          notes: notes.trim() || null,
          status: "Submitted",
        })
        .select("id")
        .single();

      if (orderErr) throw orderErr;

      const orderId = orderData.id;

      // 2. Build order items
      const items = inStockProducts
        .filter((p) => (quantities[p.id] || 0) > 0)
        .map((p) => ({
          order_id: orderId,
          product_id: p.id,
          product_name: p.name,
          quantity: quantities[p.id],
          unit_price: p.price,
          subtotal: Math.round(quantities[p.id] * p.price * 100) / 100,
        }));

      const { error: itemsErr } = await supabase.from("order_items").insert(items);
      if (itemsErr) throw itemsErr;

      // 3. Success
      setOrderSuccess({ id: orderId });
    } catch (err) {
      setOrderError(err.message || "Failed to submit order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetOrder = () => {
    setQuantities({});
    setIcName("");
    setDiscord("");
    setDeliveryMethod("Pickup");
    setDeliveryLocation("");
    setNotes("");
    setOrderError(null);
    setOrderSuccess(null);
  };

  // ── NAV LINKS ──
  const navLinks = [
    { label: "Home", ref: heroRef },
    { label: "About", ref: aboutRef },
    { label: "Menu", ref: menuRef },
    { label: "Order", ref: orderRef },
  ];

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: font }}>

      {/* ─── HERO SECTION ─────────────────────────────────────────────────── */}
      <div ref={heroRef} style={{ position: "relative", overflow: "hidden", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Atmospheric background layers */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(200,168,32,0.08) 0%, transparent 70%),
                       radial-gradient(ellipse 60% 50% at 30% 60%, rgba(200,168,32,0.04) 0%, transparent 60%),
                       radial-gradient(ellipse 50% 40% at 70% 30%, rgba(160,128,16,0.05) 0%, transparent 50%),
                       linear-gradient(180deg, ${C.bgDeep} 0%, ${C.bg} 40%, ${C.bgAlt} 100%)`,
          zIndex: 0,
        }} />
        {/* Decorative top glow */}
        <div style={{
          position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)",
          width: 600, height: 300,
          background: "radial-gradient(ellipse, rgba(200,168,32,0.1) 0%, transparent 70%)",
          borderRadius: "50%", filter: "blur(60px)", zIndex: 0,
        }} />
        {/* Bottom vignette */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
          background: `linear-gradient(transparent, ${C.bg})`,
          zIndex: 0,
        }} />

        {/* Content */}
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🍺</div>
          <h1 style={{
            color: C.gold, fontSize: "clamp(28px, 5vw, 52px)", fontWeight: "bold",
            letterSpacing: 6, margin: "0 0 16px", textTransform: "uppercase", fontFamily: font,
            textShadow: "0 0 40px rgba(200,168,32,0.3)",
          }}>
            Green Bastards Brewery
          </h1>
          <p style={{ color: C.textMuted, fontSize: "clamp(14px, 2vw, 18px)", margin: "0 0 48px", letterSpacing: 1 }}>
            Handcrafted Spirits &amp; Ales in the Heart of Redmont
          </p>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={btnGold} onClick={() => scrollTo(menuRef)}
              onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
              onMouseLeave={(e) => (e.target.style.opacity = 1)}>
              View Our Menu
            </button>
            <button style={btnOutline} onClick={() => scrollTo(orderRef)}
              onMouseEnter={(e) => { e.target.style.background = C.gold; e.target.style.color = C.bg; }}
              onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = C.gold; }}>
              Place an Order
            </button>
          </div>
        </div>
      </div>

      {/* ─── STICKY NAV BAR ───────────────────────────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: C.navBg, backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
        borderBottom: `1px solid ${C.border}`,
        padding: "0 24px",
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto",
          display: "flex", justifyContent: "center", gap: 8,
        }}>
          {navLinks.map((link, i) => (
            <button key={link.label}
              onClick={() => scrollTo(link.ref)}
              onMouseEnter={() => setHoveredNav(i)}
              onMouseLeave={() => setHoveredNav(null)}
              style={{
                background: "none", border: "none", fontFamily: font,
                color: hoveredNav === i ? C.gold : C.textMuted,
                fontSize: 14, letterSpacing: 1, textTransform: "uppercase",
                padding: "14px 18px", cursor: "pointer",
                transition: "color 0.2s",
                borderBottom: hoveredNav === i ? `2px solid ${C.gold}` : "2px solid transparent",
              }}>
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── ABOUT SECTION ────────────────────────────────────────────────── */}
      <section ref={aboutRef} id="about" style={{
        padding: "100px 24px", background: C.bg,
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={sectionHeading}>About Us</h2>
          <div style={goldUnderline} />
          <p style={{ color: C.textSec, fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
            Green Bastards Brewery is a licensed business proudly operating within the
            Redmont jurisdiction. Established under DemocracyCraft's Department of Commerce,
            we are committed to delivering the finest handcrafted spirits and ales to citizens
            and visitors alike.
          </p>
          <p style={{ color: C.textSec, fontSize: 16, lineHeight: 1.8, marginBottom: 24 }}>
            Every product we offer is brewed in-house using authentic brewing methods,
            from sourcing the finest ingredients to careful fermentation and quality control.
            Our brewmasters take pride in every batch, ensuring consistency and character
            in every pour.
          </p>
          <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.8, fontStyle: "italic" }}>
            Whether you're raising a glass at a town gathering or stocking your private cellar,
            Green Bastards Brewery stands for quality, community, and the craft.
          </p>
        </div>
      </section>

      {/* ─── MENU SECTION ─────────────────────────────────────────────────── */}
      <section ref={menuRef} id="menu" style={{
        padding: "100px 24px",
        background: `linear-gradient(180deg, ${C.bgAlt} 0%, ${C.bg} 100%)`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={sectionHeading}>Our Menu</h2>
            <div style={goldUnderline} />
          </div>

          {/* Filter toggle */}
          {!loadingProducts && !productsError && products.length > 0 && (
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <button
                onClick={() => setShowAllProducts((v) => !v)}
                style={{
                  ...btnOutline,
                  padding: "8px 20px",
                  fontSize: 12,
                  borderWidth: 1,
                }}
                onMouseEnter={(e) => { e.target.style.background = C.gold; e.target.style.color = C.bg; }}
                onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = C.gold; }}
              >
                {showAllProducts ? "Available Only" : "Show All"}
              </button>
            </div>
          )}

          {/* Loading */}
          {loadingProducts && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{
                color: C.gold, fontSize: 18, letterSpacing: 1,
                animation: "pulse 1.5s ease-in-out infinite",
              }}>
                Loading menu...
              </div>
              <style>{`@keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
            </div>
          )}

          {/* Error */}
          {productsError && (
            <div style={{ textAlign: "center", padding: 60, color: C.red, fontSize: 16 }}>
              Failed to load menu: {productsError}
            </div>
          )}

          {/* Product Grid */}
          {!loadingProducts && !productsError && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 24,
            }}>
              {displayProducts.map((p) => {
                const available = p.in_stock && p.stock_qty > 0;
                const isHovered = hoveredCard === p.id;
                return (
                  <div key={p.id}
                    onMouseEnter={() => setHoveredCard(p.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      background: C.card,
                      border: `1px solid ${isHovered ? C.borderEm : C.border}`,
                      borderRadius: 8,
                      padding: 24,
                      opacity: available ? 1 : 0.5,
                      transition: "border-color 0.2s, opacity 0.2s",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <h3 style={{
                        color: available ? C.gold : C.textMuted,
                        fontSize: 18, fontWeight: "bold", margin: 0,
                        fontFamily: font,
                      }}>
                        {p.name}
                      </h3>
                      <span style={{
                        fontSize: 11, fontWeight: "bold", textTransform: "uppercase",
                        letterSpacing: 1,
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: available ? "rgba(80,200,96,0.12)" : "rgba(224,80,80,0.1)",
                        color: available ? C.green : C.red,
                        whiteSpace: "nowrap",
                      }}>
                        {available ? "In Stock" : "Unavailable"}
                      </span>
                    </div>
                    <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6, margin: 0, flex: 1 }}>
                      {p.description || "A fine selection from our brewery."}
                    </p>
                    <div style={{
                      color: available ? C.text : C.textMuted,
                      fontSize: 22, fontWeight: "bold", fontFamily: font,
                    }}>
                      {fmt(p.price)}
                    </div>
                  </div>
                );
              })}
              {displayProducts.length === 0 && (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: 40, color: C.textMuted }}>
                  No products to display.
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── ORDER SECTION ────────────────────────────────────────────────── */}
      <section ref={orderRef} id="order" style={{
        padding: "100px 24px",
        background: C.bg,
      }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center" }}>
            <h2 style={sectionHeading}>Place an Order</h2>
            <div style={goldUnderline} />
          </div>

          {/* ── CONFIRMATION VIEW ── */}
          {orderSuccess ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: "rgba(80,200,96,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 24px", fontSize: 40,
              }}>
                ✓
              </div>
              <h3 style={{ color: C.green, fontSize: 26, margin: "0 0 12px", fontFamily: font }}>
                Order Submitted Successfully!
              </h3>
              <p style={{ color: C.text, fontSize: 18, margin: "0 0 8px" }}>
                Order ID: <span style={{ color: C.gold, fontWeight: "bold" }}>#{orderSuccess.id}</span>
              </p>
              <p style={{
                color: C.textMuted, fontSize: 14, lineHeight: 1.7,
                maxWidth: 500, margin: "20px auto 32px",
                padding: "16px 20px",
                background: "rgba(224,144,48,0.06)",
                border: `1px solid rgba(224,144,48,0.15)`,
                borderRadius: 6,
              }}>
                Orders are not confirmed until in-game payment is received.
                A staff member will contact you via Discord or in-game.
              </p>
              <button style={btnGold} onClick={resetOrder}
                onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
                onMouseLeave={(e) => (e.target.style.opacity = 1)}>
                Place Another Order
              </button>
            </div>
          ) : (
            /* ── FORM VIEW ── */
            <div>
              {/* Product quantity selector */}
              {loadingProducts ? (
                <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>Loading products...</div>
              ) : inStockProducts.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: C.textMuted }}>
                  No products are currently available for order.
                </div>
              ) : (
                <>
                  {/* Header row */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto",
                    gap: 16, padding: "12px 0",
                    borderBottom: `1px solid ${C.border}`,
                    color: C.textMuted, fontSize: 12,
                    textTransform: "uppercase", letterSpacing: 1,
                  }}>
                    <span>Product</span>
                    <span style={{ textAlign: "right", minWidth: 80 }}>Price</span>
                    <span style={{ textAlign: "center", minWidth: 70 }}>Qty</span>
                    <span style={{ textAlign: "right", minWidth: 90 }}>Subtotal</span>
                  </div>

                  {/* Product rows */}
                  {inStockProducts.map((p) => {
                    const qty = quantities[p.id] || 0;
                    const sub = qty * p.price;
                    return (
                      <div key={p.id} style={{
                        display: "grid",
                        gridTemplateColumns: "1fr auto auto auto",
                        gap: 16, padding: "14px 0",
                        borderBottom: `1px solid ${C.border}`,
                        alignItems: "center",
                      }}>
                        <span style={{ color: C.text, fontSize: 15 }}>{p.name}</span>
                        <span style={{ color: C.textSec, fontSize: 14, textAlign: "right", minWidth: 80 }}>
                          {fmt(p.price)}
                        </span>
                        <span style={{ textAlign: "center", minWidth: 70 }}>
                          <input
                            type="number"
                            min="0"
                            value={qty}
                            onChange={(e) => setQty(p.id, e.target.value)}
                            style={{
                              ...inputStyle,
                              width: 60,
                              textAlign: "center",
                              padding: "6px 4px",
                            }}
                          />
                        </span>
                        <span style={{
                          color: sub > 0 ? C.gold : C.textVMuted,
                          fontSize: 15, fontWeight: sub > 0 ? "bold" : "normal",
                          textAlign: "right", minWidth: 90,
                        }}>
                          {fmt(sub)}
                        </span>
                      </div>
                    );
                  })}

                  {/* Running total */}
                  <div style={{
                    display: "flex", justifyContent: "flex-end", alignItems: "center",
                    padding: "20px 0", gap: 16,
                    borderBottom: `2px solid ${C.borderEm}`,
                  }}>
                    <span style={{ color: C.textSec, fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>
                      Total:
                    </span>
                    <span style={{ color: C.gold, fontSize: 24, fontWeight: "bold" }}>
                      {fmt(orderTotal)}
                    </span>
                  </div>
                </>
              )}

              {/* Customer information */}
              {inStockProducts.length > 0 && (
                <div style={{ marginTop: 40 }}>
                  <h3 style={{ color: C.gold, fontSize: 18, marginBottom: 24, letterSpacing: 1, fontFamily: font }}>
                    Customer Information
                  </h3>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20, marginBottom: 20 }}>
                    {/* IC Name */}
                    <div>
                      <label style={{ color: C.textSec, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
                        IC Name <span style={{ color: C.red }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={icName}
                        onChange={(e) => setIcName(e.target.value)}
                        placeholder="Your in-game name"
                        style={inputStyle}
                      />
                    </div>

                    {/* Discord */}
                    <div>
                      <label style={{ color: C.textSec, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
                        Discord Username
                      </label>
                      <input
                        type="text"
                        value={discord}
                        onChange={(e) => setDiscord(e.target.value)}
                        placeholder="Optional"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Delivery Method */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ color: C.textSec, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 10 }}>
                      Delivery Method
                    </label>
                    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                      {["Pickup", "Delivery"].map((method) => (
                        <label key={method} style={{
                          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                          color: deliveryMethod === method ? C.gold : C.textSec,
                          transition: "color 0.2s",
                        }}>
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value={method}
                            checked={deliveryMethod === method}
                            onChange={(e) => setDeliveryMethod(e.target.value)}
                            style={{ accentColor: C.gold }}
                          />
                          <span style={{ fontSize: 14 }}>{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Location - conditional */}
                  {deliveryMethod === "Delivery" && (
                    <div style={{ marginBottom: 20 }}>
                      <label style={{ color: C.textSec, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
                        Delivery Location
                      </label>
                      <input
                        type="text"
                        value={deliveryLocation}
                        onChange={(e) => setDeliveryLocation(e.target.value)}
                        placeholder="In-game address or coordinates"
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {/* Notes */}
                  <div style={{ marginBottom: 32 }}>
                    <label style={{ color: C.textSec, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, display: "block", marginBottom: 6 }}>
                      Notes
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any special requests or instructions (optional)"
                      rows={3}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  </div>

                  {/* Error */}
                  {orderError && (
                    <div style={{
                      padding: "12px 16px", marginBottom: 20,
                      background: "rgba(224,80,80,0.08)",
                      border: `1px solid rgba(224,80,80,0.2)`,
                      borderRadius: 6, color: C.red, fontSize: 14,
                    }}>
                      {orderError}
                    </div>
                  )}

                  {/* Submit button */}
                  <div style={{ textAlign: "center" }}>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      style={{
                        ...btnGold,
                        opacity: canSubmit ? 1 : 0.4,
                        cursor: canSubmit ? "pointer" : "not-allowed",
                        minWidth: 220,
                      }}
                      onMouseEnter={(e) => { if (canSubmit) e.target.style.opacity = 0.85; }}
                      onMouseLeave={(e) => { if (canSubmit) e.target.style.opacity = 1; }}
                    >
                      {submitting ? "Submitting..." : "Submit Order"}
                    </button>
                    {!hasItems && icName.trim().length > 0 && (
                      <p style={{ color: C.textMuted, fontSize: 12, marginTop: 10 }}>
                        Select at least one item to continue.
                      </p>
                    )}
                    {hasItems && icName.trim().length === 0 && (
                      <p style={{ color: C.textMuted, fontSize: 12, marginTop: 10 }}>
                        Please enter your IC Name to continue.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
      <footer style={{
        padding: "60px 24px 40px",
        background: C.bgAlt,
        borderTop: `1px solid ${C.border}`,
        textAlign: "center",
      }}>
        <div style={{ color: C.gold, fontSize: 18, fontWeight: "bold", letterSpacing: 3, marginBottom: 12, fontFamily: font, textTransform: "uppercase" }}>
          Green Bastards Brewery
        </div>
        <div style={{ color: C.textMuted, fontSize: 13, letterSpacing: 1, marginBottom: 8 }}>
          Licensed Business · Redmont Jurisdiction · DemocracyCraft
        </div>
        <div style={{ color: C.textVMuted, fontSize: 12, marginBottom: 24 }}>
          © 2026 Green Bastards Brewery. All rights reserved.
        </div>
        <Link
          to="/login"
          style={{
            color: C.textVMuted, fontSize: 11, textDecoration: "none",
            letterSpacing: 1, textTransform: "uppercase",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.color = C.textMuted)}
          onMouseLeave={(e) => (e.target.style.color = C.textVMuted)}
        >
          Staff Portal
        </Link>
      </footer>
    </div>
  );
}
