import React, { useState, useEffect } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Search,
  Clock,
  Leaf,
  Utensils,
  CalendarDays,
  Heart,
  Check,
  Minus,
  Plus,
  Trash2,
  ChevronLeft,
  ShoppingBag,
  Flame,
  ChefHat,
  MapPin,
} from "lucide-react";
import { useStore, useData } from "./state";
import { api, errorText } from "./services/api";
import { FoodImage, FoodCard, SectionTitle, Feedback } from "./components";
import Food3D from "./components/Food3D";
import { money, photos, photoFor, categoryPhoto, thaiDate, statusText } from "./utils";
import { Badge } from "./components/reui/badge";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldIncrement,
  NumberFieldDecrement,
} from "./components/reui/number-field";



export function Home() {
  const menus = useData("/menu?limit=100"),
    categories = useData("/categories?limit=100");
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  return (
    <div className="home-grid">
      <div className="home-main">
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">
              <Flame size={14} /> อร่อยทุกคำ อิ่มใจทุกมื้อ
            </span>
            <h1>
              หิวเมื่อไหร่
              <br />
              <span>พุงป่อง</span>จัดให้<span className="hero-dot">.</span>
            </h1>
            <p>
              อาหารตามสั่ง ปรุงสดใหม่ทุกจาน
              <br />
              ครบทั้งข้าวจานโปรด ต้มแกง และเครื่องดื่มสดชื่น
            </p>
            <form
              className="hero-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/menu?q=${encodeURIComponent(q)}`);
              }}
            >
              <Search size={19} />
              <input
                aria-label="ค้นหาเมนูที่อยากกิน"
                placeholder="วันนี้อยากกินอะไรดี?"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button className="btn" aria-label="ค้นหาอาหาร">
                <ArrowRight size={20} />
              </button>
            </form>
            <div className="hero-proof">
              <div className="proof-icon">
                <ChefHat size={25} />
              </div>
              <div>
                <strong>ปรุงด้วยใจ เสิร์ฟด้วยรอยยิ้ม</strong>
                <small>สดใหม่จากครัวพุงป่องทุกวัน</small>
              </div>
            </div>
          </div>
          <div className="hero-art">
            <div className="hero-circle" aria-hidden="true" />
            <Food3D />
          </div>
        </section>
        <section className="category-section">
          <SectionTitle title="หมวดหมู่อาหาร" />
          <div className="category-row">
            <Link to="/menu" className="category-tile selected">
              <FoodImage src={photos.hero} alt="อาหารทั้งหมด" />
              <strong>ทั้งหมด</strong>
            </Link>
            {categories.data.map((c) => (
              <Link
                key={c.id}
                className="category-tile"
                to={`/menu?category=${c.id}`}
              >
                <FoodImage
                  src={categoryPhoto(c.name)}
                  alt={c.name}
                />
                <strong>{c.name}</strong>
              </Link>
            ))}
          </div>
          <Feedback
            loading={categories.loading}
            error={categories.error}
            reload={categories.reload}
          />
        </section>
        <section className="reservation-banner">
          <div className="plate-art">
            <div>
              <Utensils size={45} />
              <span>อิ่มพร้อมหน้า</span>
            </div>
            <Leaf className="leaf" size={48} />
          </div>
          <div>
            <span className="eyebrow orange">โต๊ะโปรด มื้อพิเศษ</span>
            <h2>
              อร่อยด้วยกัน
              <br />
              ยิ่งพุงป่องกว่าเดิม
            </h2>
            <p>
              ชวนคนโปรดมาเจอกัน
              <br />
              เลือกวัน เวลา และโต๊ะที่ใช่ล่วงหน้า
            </p>
            <Link className="btn dark" to="/reservation">
              จองโต๊ะเลย <ArrowUpRight size={17} />
            </Link>
          </div>
          <span className="banner-flower">✳</span>
        </section>
        <section className="home-menu">
          <SectionTitle title="วันนี้กินอะไรดี?" />
          <Feedback
            loading={menus.loading}
            error={menus.error}
            reload={menus.reload}
          />
          <div className="food-grid">
            {menus.data.slice(0, 3).map((m) => (
              <FoodCard key={m.id} item={m} />
            ))}
          </div>
        </section>
      </div>
      <aside className="home-side">
        <section>
          <SectionTitle title="เมนูแนะนำ" />
          <Feedback
            loading={menus.loading}
            error={menus.error}
            reload={menus.reload}
          />
          <div className="popular-grid">
            {menus.data.slice(0, 3).map((m) => (
              <FoodCard key={m.id} item={m} compact />
            ))}
          </div>
        </section>
        <section className="offer-banner">
          <span className="pill light">มื้ออร่อย ไม่ต้องรอ</span>
          <h2>
            พักเรื่องวุ่น ๆ<br />
            มาอิ่มให้เต็มพุง
          </h2>
          <Link className="btn white small" to="/menu">
            สั่งเลย <ArrowRight size={15} />
          </Link>
          <FoodImage src={photos.main} alt="อาหารจานโปรด" />
        </section>
        <section className="why-section">
          <SectionTitle title="อิ่มใจในทุกมื้อ" label="เลือกเมนู" />
          <div className="benefits">
            <div>
              <ChefHat />
              <h3>ปรุงสดใหม่</h3>
              <p>
                ใส่ใจทุกรายการ
                <br />
                เหมือนทำให้คนที่บ้าน
              </p>
            </div>
            <div>
              <ShoppingBag />
              <h3>สั่งง่าย</h3>
              <p>
                เลือก ใส่ตะกร้า
                <br />
                แล้วรอรับความอร่อย
              </p>
            </div>
            <div>
              <CalendarDays />
              <h3>จองสะดวก</h3>
              <p>
                เลือกโต๊ะล่วงหน้า
                <br />
                เก็บเวลาไว้ให้คนโปรด
              </p>
            </div>
          </div>
        </section>
        <section className="little-note">
          <span>“</span>
          <h3>
            มื้อธรรมดา
            <br />
            ก็พิเศษได้
          </h3>
          <p>
            เพราะความสุขเล็ก ๆ<br />
            เริ่มต้นจากอาหารอร่อย
          </p>
          <div className="note-line" />
          <small>จากครัวพุงป่อง ด้วยความใส่ใจ</small>
        </section>
      </aside>
    </div>
  );
}

export function MenuPage() {
  const { data, loading, error, reload } = useData("/menu?limit=100"),
    categories = useData("/categories?limit=100");
  const [params, setParams] = useSearchParams();
  const query = params.get("q") || "",
    category = params.get("category") || "";
  const filtered = data.filter(
    (m) =>
      (!category || String(m.category_id) === category) &&
      m.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow orange">เลือกความอร่อยในแบบคุณ</span>
        <h1>เมนูโปรด มื้อไหนก็ใช่</h1>
        <p>อาหารจากครัวพุงป่อง พร้อมเติมความสุขให้ทุกวัน</p>
      </div>
      <div className="menu-toolbar">
        <label className="search-field">
          <Search size={20} />
          <input
            aria-label="ค้นหาเมนู"
            placeholder="ค้นหาเมนูที่อยากกิน"
            value={query}
            onChange={(e) =>
              setParams({
                q: e.target.value,
                ...(category ? { category } : {}),
              })
            }
          />
        </label>
        <div className="filter-row">
          <button
            className={!category ? "active" : ""}
            onClick={() => setParams({ q: query })}
          >
            ทั้งหมด
          </button>
          {categories.data.map((c) => (
            <button
              className={category === String(c.id) ? "active" : ""}
              key={c.id}
              onClick={() => setParams({ q: query, category: c.id })}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
      <Feedback
        loading={loading}
        error={error}
        empty={!loading && !error && !filtered.length}
        reload={reload}
      />
      <div className="food-grid menu-grid">
        {filtered.map((m) => (
          <FoodCard key={m.id} item={m} />
        ))}
      </div>
      <p className="fine-print">
        ภาพประกอบอาหารอาจแตกต่างจากเมนูที่เสิร์ฟจริง ·
        สั่งล่วงหน้าและชำระเงินที่ร้าน
      </p>
    </section>
  );
}

export function FoodDetail() {
  const { id } = useParams(),
    { data: item, loading, error, reload } = useData(`/menu/${id}`),
    { add } = useStore();
  const [quantity, setQuantity] = useState(1);
  if (loading || error)
    return <Feedback loading={loading} error={error} reload={reload} />;
  return (
    <section className="page">
      <Link to="/menu" className="back">
        <ChevronLeft size={17} /> กลับไปเลือกเมนู
      </Link>
      <div className="detail-grid">
        <FoodImage src={photoFor(item)} alt={item.name} />
        <div>
          <span className="pill">ปรุงจากครัวพุงป่อง</span>
          <h1>{item.name}</h1>
          <p>{item.description}</p>
          <strong className="detail-price">{money(item.price)}</strong>
          <p>
            {item.is_available
              ? "พร้อมปรุงความอร่อยให้คุณ"
              : "เมนูนี้หมดชั่วคราว"}
          </p>
          <Quantity value={quantity} onChange={setQuantity} />
          <button
            className="btn"
            disabled={!item.is_available}
            onClick={() => add(item, quantity)}
          >
            เพิ่มลงตะกร้า · {money(Number(item.price) * quantity)}
          </button>
          <p className="fine-print">
            ภาพประกอบเมนู · ชำระเงินและรับอาหารที่ร้าน
          </p>
        </div>
      </div>
    </section>
  );
}
function Quantity({ value, onChange }) {
  return (
    <NumberField
      className="quantity"
      value={value}
      min={1}
      max={99}
      step={1}
      onValueChange={(next) => {
        if (next !== null) onChange(Math.max(1, Math.min(99, Math.round(next))));
      }}
    >
      <NumberFieldGroup>
        <NumberFieldDecrement aria-label="ลดจำนวน" />
        <NumberFieldInput aria-label="จำนวนอาหาร" inputMode="numeric" />
        <NumberFieldIncrement aria-label="เพิ่มจำนวน" />
      </NumberFieldGroup>
    </NumberField>
  );
}
export function Cart() {
  const { cart, setCart, user, setNotice } = useStore(),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate();
  const total =
    cart.reduce(
      (s, i) => s + Math.round(Number(i.price) * 100) * i.quantity,
      0,
    ) / 100;
  async function order() {
    if (!user) {
      navigate("/login", { state: { from: "/cart" } });
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post("/orders", {
        items: cart.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
        note,
      });
      setCart([]);
      setNotice(
        `รับคำสั่งซื้อ #${data.data.id} แล้ว ยอด ${money(data.data.total)}`,
      );
      navigate("/orders");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow orange">อีกนิดก็ได้อิ่ม</span>
        <h1>ตะกร้าของฉัน</h1>
      </div>
      {!cart.length ? (
        <div className="empty-state">
          <ShoppingBag size={48} />
          <h2>ตะกร้ายังว่างอยู่เลย</h2>
          <p>เติมเมนูโปรด แล้วมาอิ่มไปด้วยกัน</p>
          <Link className="btn" to="/menu">
            เลือกเมนูอาหาร <ArrowRight size={17} />
          </Link>
        </div>
      ) : (
        <div className="checkout-grid">
          <div>
            {cart.map((item) => (
              <div className="cart-row" key={item.id}>
                <FoodImage src={photoFor(item)} alt={item.name} />
                <div className="cart-info">
                  <h3>{item.name}</h3>
                  <p>{money(item.price)}</p>
                  <Quantity
                    value={item.quantity}
                    onChange={(quantity) =>
                      setCart((old) =>
                        old.map((i) =>
                          i.id === item.id ? { ...i, quantity } : i,
                        ),
                      )
                    }
                  />
                </div>
                <strong>{money(Number(item.price) * item.quantity)}</strong>
                <button
                  className="icon-button"
                  aria-label={`ลบ ${item.name}`}
                  onClick={() =>
                    setCart((old) => old.filter((i) => i.id !== item.id))
                  }
                >
                  <Trash2 size={19} />
                </button>
              </div>
            ))}
          </div>
          <div className="summary-card">
            <h2>สรุปความอร่อย</h2>
            <div className="summary-line">
              <span>ค่าอาหาร</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="summary-line">
              <span>ยอดรวมโดยประมาณ</span>
              <strong className="orange">{money(total)}</strong>
            </div>
            <p className="fine-print">
              ยอดจริงคำนวณจากราคาเมนูปัจจุบันเมื่อยืนยันรายการ
              ไม่มีส่วนลดหรือค่าจัดส่ง
            </p>
            <label>
              หมายเหตุถึงครัว
              <textarea
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="เช่น เผ็ดน้อย ไม่ใส่ผักชี"
              />
            </label>
            <div className="callout">
              <MapPin size={18} />
              <span>
                รับอาหารและชำระเงินที่ร้าน
                <br />
                <small>ขณะนี้ยังไม่มีบริการจัดส่งออนไลน์</small>
              </span>
            </div>
            <Feedback error={error} />
            <button className="btn full" disabled={busy} onClick={order}>
              {busy
                ? "กำลังส่งรายการ…"
                : user
                  ? "ยืนยันคำสั่งซื้อ"
                  : "เข้าสู่ระบบเพื่อสั่งอาหาร"}
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

export function Auth({ register = false }) {
  const { setUser, user, setNotice } = useStore(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate(),
    location = useLocation();
  useEffect(() => setError(""), [register]);
  async function submit(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    if (new TextEncoder().encode(d.password).length > 72) {
      setError("รหัสผ่านต้องไม่เกิน 72 ไบต์");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (register) await api.post("/auth/register", d);
      const response = await api.post("/auth/login", {
        email: d.email,
        password: d.password,
      });
      sessionStorage.setItem("phungpong.token", response.data.token);
      setUser(response.data.user);
      setNotice(register ? "ยินดีต้อนรับสู่พุงป่อง" : "ยินดีต้อนรับกลับมา");
      navigate(location.state?.from || "/menu");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-page">
      <div className="auth-art">
        <img src="/logo.svg" alt="โลโก้พุงป่อง" />
        <h1>
          ความสุข
          <br />
          เริ่มที่<span>พุงป่อง</span>
        </h1>
        <p>อิ่มอร่อย ส่งไว ถูกใจทุกมื้อ</p>
        <FoodImage src={photos.hero} alt="ข้าวจานโปรด ภาพประกอบอาหารตามสั่ง" />
      </div>
      <div className="auth-form">
        <span className="eyebrow orange">GOOD FOOD, HAPPY BELLY.</span>
        <h1>{register ? "มาเป็นเพื่อนกันนะ" : "ดีใจที่ได้เจอกันอีก"}</h1>
        <p>
          {register
            ? "สมัครสมาชิกเพื่อสั่งอาหารและจองโต๊ะ"
            : "เข้าสู่ระบบ แล้วเลือกมื้อโปรดของคุณ"}
        </p>
        {user ? (
          <>
            <p>คุณเข้าสู่ระบบเป็น {user.name} แล้ว</p>
            <Link className="btn" to="/menu">
              เลือกเมนู
            </Link>
          </>
        ) : (
          <form onSubmit={submit}>
            {register && (
              <label>
                ชื่อของคุณ
                <input
                  name="name"
                  required
                  maxLength={100}
                  autoComplete="name"
                  placeholder="ชื่อที่อยากให้เราเรียก"
                />
              </label>
            )}
            <label>
              อีเมล
              <input
                name="email"
                required
                type="email"
                maxLength={190}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <label>
              รหัสผ่าน
              <input
                name="password"
                required
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
            </label>
            <Feedback error={error} />
            <button className="btn full" disabled={busy}>
              {busy
                ? "กำลังดำเนินการ…"
                : register
                  ? "สมัครสมาชิก"
                  : "เข้าสู่ระบบ"}
              <ArrowRight size={18} />
            </button>
            <p className="auth-switch">
              {register ? "เป็นเพื่อนกันแล้ว?" : "ยังไม่มีบัญชี?"}{" "}
              <Link
                to={register ? "/login" : "/register"}
                state={location.state}
              >
                {register ? "เข้าสู่ระบบ" : "สมัครสมาชิก"}
              </Link>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

export function Reservation() {
  const slots = useData("/reservation-slots"),
    [search, setSearch] = useState(null),
    [tables, setTables] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [note, setNote] = useState("");
  const navigate = useNavigate(),
    { setNotice } = useStore();
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Bangkok",
  });
  async function find(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    d.guests = Number(d.guests);
    setBusy(true);
    setError("");
    setSelected(null);
    try {
      const r = await api.get("/tables/availability", { params: d });
      setTables(r.data.data);
      setSearch(d);
    } catch (err) {
      setSearch(null);
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function book() {
    setBusy(true);
    setError("");
    try {
      await api.post("/reservations", { ...search, table_id: selected, note });
      setNotice("จองโต๊ะเรียบร้อย แล้วพบกันที่พุงป่อง");
      navigate("/reservations");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow orange">เก็บที่นั่งให้คนโปรด</span>
        <h1>จองโต๊ะที่พุงป่อง</h1>
        <p>เลือกเวลาแห่งความอร่อย · รอบละ 90 นาที · จองล่วงหน้าได้ 90 วัน</p>
      </div>
      <form
        className="booking-form"
        onSubmit={find}
        onChange={() => {
          setSearch(null);
          setSelected(null);
        }}
      >
        <label>
          วันที่
          <input
            name="date"
            type="date"
            min={today}
            max={new Date(Date.now() + 89 * 86400000).toLocaleDateString(
              "en-CA",
              { timeZone: "Asia/Bangkok" },
            )}
            required
          />
        </label>
        <label>
          เวลา
          <select name="slot" required>
            {slots.data.map((s) => (
              <option key={s} value={s}>
                {s} น.
              </option>
            ))}
          </select>
        </label>
        <label>
          จำนวนคน
          <input
            name="guests"
            type="number"
            min="1"
            max="20"
            defaultValue="2"
            required
          />
        </label>
        <button
          className="btn"
          disabled={busy || slots.loading || !!slots.error}
        >
          ค้นหาโต๊ะว่าง <Search size={17} />
        </button>
      </form>
      <Feedback loading={busy} error={error || slots.error} />
      {search && (
        <>
          <h2 className="spaced-heading">โต๊ะว่างสำหรับคุณ</h2>
          <div className="tables-grid">
            {tables.map((t) => (
              <button
                className={`table-card ${selected === t.id ? "selected" : ""}`}
                key={t.id}
                onClick={() => setSelected(t.id)}
              >
                <Utensils size={26} />
                <strong>โต๊ะ {t.table_number}</strong>
                <span>{t.capacity} ที่นั่ง</span>
                {selected === t.id && <Check size={18} />}
              </button>
            ))}
          </div>
          {!tables.length && <Feedback empty />}
          {selected && (
            <div className="booking-confirm">
              <label>
                หมายเหตุ
                <textarea
                  maxLength={500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="มีอะไรอยากให้เราดูแลเป็นพิเศษไหม?"
                />
              </label>
              <p>
                {thaiDate(search.date)} เวลา {search.slot} น. · {search.guests}{" "}
                คน
              </p>
              <button className="btn" disabled={busy} onClick={book}>
                ยืนยันการจอง <ArrowRight size={17} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function History({ reservations = false }) {
  const { data, loading, error, reload } = useData(
    reservations ? "/reservations/my?limit=100" : "/me/orders?limit=100",
  );
  const { setNotice } = useStore(),
    [busy, setBusy] = useState(null),
    [detail, setDetail] = useState(null),
    [actionError, setActionError] = useState("");
  useEffect(() => {
    setDetail(null);
    setActionError("");
  }, [reservations]);
  async function cancel(id) {
    setBusy(id);
    setActionError("");
    try {
      await api.patch(
        `/${reservations ? "reservations" : "orders"}/${id}/cancel`,
      );
      setNotice("ยกเลิกรายการเรียบร้อย");
      reload();
    } catch (e) {
      setActionError(errorText(e));
    } finally {
      setBusy(null);
    }
  }
  async function show(id) {
    try {
      setDetail((await api.get(`/orders/${id}`)).data.data);
    } catch (e) {
      setActionError(errorText(e));
    }
  }
  return (
    <section className="page">
      <div className="page-heading">
        <span className="eyebrow orange">มื้ออร่อยของคุณ</span>
        <h1>{reservations ? "การจองของฉัน" : "รายการสั่งซื้อของฉัน"}</h1>
        <p>แสดงรายการล่าสุดสูงสุด 100 รายการ</p>
      </div>
      <Feedback
        loading={loading}
        error={error || actionError}
        empty={!loading && !error && !data.length}
        reload={reload}
      />
      <div className="history-list">
        {data.map((r) => (
          <article className="history-card" key={r.id}>
            <div>
              <span className="eyebrow">
                {reservations ? "การจอง" : "คำสั่งซื้อ"} #{r.id}
              </span>
              <h3>
                {reservations ? `โต๊ะ ${r.table_number}` : money(r.total)}
              </h3>
              <p>
                {reservations
                  ? `${thaiDate(r.reservation_date)} · ${r.slot} น. · ${r.guests} คน`
                  : thaiDate(r.created_at)}
              </p>
            </div>
            <Badge
              radius="full"
              size="xl"
              variant={
                r.status === "cancelled"
                  ? "secondary"
                  : ["confirmed", "completed", "ready"].includes(r.status)
                    ? "success-light"
                    : "warning-light"
              }
            >
              {statusText[r.status]}
            </Badge>
            <div className="history-actions">
              {!reservations && (
                <button className="text-button" onClick={() => show(r.id)}>
                  ดูรายการอาหาร
                </button>
              )}
              {(reservations
                ? r.status === "confirmed" &&
                new Date(`${r.reservation_date}T${r.slot}:00+07:00`) >
                new Date()
                : r.status === "pending") && (
                  <button
                    className="btn secondary small"
                    disabled={busy === r.id}
                    onClick={() => cancel(r.id)}
                  >
                    ยกเลิก
                  </button>
                )}
            </div>
          </article>
        ))}
      </div>
      {detail && (
        <div className="detail-panel">
          <button className="text-button" onClick={() => setDetail(null)}>
            ปิดรายละเอียด
          </button>
          <h2>คำสั่งซื้อ #{detail.id}</h2>
          {detail.items.map((i) => (
            <div className="summary-line" key={i.id}>
              <span>
                {i.menu_name} × {i.quantity}
              </span>
              <strong>{money(Number(i.unit_price) * i.quantity)}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
