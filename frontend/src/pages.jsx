import { Eye, EyeOff } from "lucide-react";
import ReservationDate from "./components/ReservationDate";
import CategoryPicker from "./components/CategoryPicker";
import AnimatedHeading from "./components/AnimatedHeading";
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
  Search,
  Clock,
  Utensils,
  CalendarDays,
  Heart,
  Check,
  Minus,
  Plus,
  Trash2,
  ChevronLeft,
  ShoppingBag,
  MapPin,
} from "lucide-react";
import { useStore, useData } from "./state";
import { api, errorText } from "./services/api";
import { FoodImage, FoodCard, SectionTitle, Feedback } from "./components";
import TablePicker from "./components/TablePicker";
import Food3D from "./components/Food3D";
import { money, photos, photoFor, categoryPhoto, thaiDate, statusText } from "./utils";
import { Badge } from "./components/reui/badge";
import GradientText from "./components/reactbits/GradientText";
import ShinyText from "./components/reactbits/ShinyText";
import StarBorder from "./components/reactbits/StarBorder";
import AnimatedContent from "./components/reactbits/AnimatedContent";
import {
  NumberField,
  NumberFieldGroup,
  NumberFieldInput,
  NumberFieldIncrement,
  NumberFieldDecrement,
} from "./components/reui/number-field";



export function Home() {
  const menus = useData("/menu?limit=100");
  const categories = useData("/categories?limit=100");
  const [category, setCategory] = useState("");
  const featured = menus.data.filter(item => !category || String(item.category_id) === category).slice(0, 4);
  return (
    <div className="home-grid home-compact">
      <div className="home-main">
        <section className="hero">
          <div className="hero-copy">
            <AnimatedHeading>หิวเมื่อไหร่<br /><span><GradientText colors={["#F45B0B", "#ff9a3d", "#ffb37a", "#F45B0B"]} variant="flow" animationSpeed={5} glow={0.25}>พุงป่อง</GradientText>จัดให้</span></AnimatedHeading>
            <p>อาหารตามสั่ง ปรุงสดทุกจาน</p>
            <div className="home-actions">
              <StarBorder as={Link} to="/reservation" backgroundColor="#F45B0B" textColor="#fff8ef" color="#ffd9a8" trailColor="#ffe9cf" thickness={1.4} radius={12} duration={4.5} glow={0.5} sparkle>
                <CalendarDays size={19} /> จองโต๊ะ
              </StarBorder>
              <StarBorder as={Link} to="/menu" backgroundColor="#fff4e6" textColor="#7c3a12" color="#F45B0B" trailColor="#ff9a3d" thickness={1.2} radius={12} duration={5.5} glow={0.35}>
                <Utensils size={19} /> สั่งอาหาร
              </StarBorder>
            </div>
            <small className="home-service-note">สั่งล่วงหน้า รับและชำระเงินที่ร้าน</small>
          </div>
          <div className="hero-art">
            <div className="hero-circle" aria-hidden="true" />
            <Food3D />
          </div>
        </section>
        <section className="home-menu">
          <CategoryPicker categories={categories.data} value={category} onChange={setCategory} />
          <Feedback loading={categories.loading} error={categories.error} reload={categories.reload} />
          <SectionTitle title="เมนูแนะนำ" label="ดูเมนูทั้งหมด" linkColor="#ffffff" />
          <Feedback loading={menus.loading} error={menus.error} reload={menus.reload}
            empty={!menus.loading && !menus.error && featured.length === 0} />
          <AnimatedContent distance={50} duration={0.9}>
            <div className="food-grid">
              {featured.map((m) => <FoodCard key={m.id} item={m} />)}
            </div>
          </AnimatedContent>
        </section>
      </div>
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
        <span className="eyebrow orange"><ShinyText text="เลือกความอร่อยในแบบคุณ" color="#F45B0B" shineColor="#ffd9a8" speed={3.5} /></span>
        <AnimatedHeading>เมนูโปรด มื้อไหนก็ใช่</AnimatedHeading>
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
        <CategoryPicker categories={categories.data} value={category}
          onChange={value => setParams({ q: query, ...(value ? {category: value} : {}) })} />
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
      <AnimatedContent distance={40} duration={0.8}>
        <p className="fine-print">
          ภาพประกอบอาหารอาจแตกต่างจากเมนูที่เสิร์ฟจริง ·
          สั่งล่วงหน้าและชำระเงินที่ร้าน
        </p>
      </AnimatedContent>
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
          <AnimatedHeading>{item.name}</AnimatedHeading>
          <p>{item.description}</p>
          <strong className="detail-price">{money(item.price)}</strong>
          <p>
            {item.is_available
              ? "พร้อมปรุงความอร่อยให้คุณ"
              : "เมนูนี้หมดชั่วคราว"}
          </p>
          <Quantity value={quantity} onChange={setQuantity} />
          <StarBorder
            backgroundColor="#F45B0B"
            textColor="#fff8ef"
            color="#ffd9a8"
            trailColor="#ffe9cf"
            thickness={1.4}
            radius={12}
            duration={4.5}
            glow={0.45}
            disabled={!item.is_available}
            onClick={() => add(item, quantity)}
          >
            เพิ่มลงตะกร้า · {money(Number(item.price) * quantity)}
          </StarBorder>
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
  const { cart, setCart, user, setNotice, setCelebrate } = useStore(),
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
      setCelebrate(`สั่งอาหารสำเร็จ · ออเดอร์ #${data.data.id} ยอด ${money(data.data.total)}`);
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
        <span className="eyebrow orange"><ShinyText text="อีกนิดก็ได้อิ่ม" color="#F45B0B" shineColor="#ffd9a8" speed={3.5} /></span>
        <AnimatedHeading>ตะกร้าของฉัน</AnimatedHeading>
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
            <StarBorder
              className="full"
              backgroundColor="#F45B0B"
              textColor="#fff8ef"
              color="#ffd9a8"
              trailColor="#ffe9cf"
              thickness={1.4}
              radius={12}
              duration={4.5}
              glow={0.45}
              disabled={busy}
              onClick={order}
            >
              {busy
                ? "กำลังส่งรายการ…"
                : user
                  ? "ยืนยันคำสั่งซื้อ"
                  : "เข้าสู่ระบบเพื่อสั่งอาหาร"}
              <ArrowRight size={17} />
            </StarBorder>
          </div>
        </div>
      )}
    </section>
  );
}

export function Auth({ register = false }) {
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, user, setNotice } = useStore(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const navigate = useNavigate(),
    location = useLocation();
  useEffect(() => { setError(""); setShowPassword(false); }, [register]);
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
        <AnimatedHeading>
          ความสุข
          <br />
          เริ่มที่<span>พุงป่อง</span>
        </AnimatedHeading>
        <p>อิ่มอร่อย ส่งไว ถูกใจทุกมื้อ</p>
        <FoodImage src={photos.hero} alt="ข้าวจานโปรด ภาพประกอบอาหารตามสั่ง" />
      </div>
      <div className="auth-form">
        <div className="auth-intro">
          <img src="/logo.svg" alt="" width="48" height="48" />
          <h1>{register ? "สมัครสมาชิก" : "ยินดีต้อนรับกลับ"}</h1>
          <p>สั่งอาหารและจองโต๊ะได้ในบัญชีเดียว</p>
        </div>
        {!user && <nav className="auth-tabs" aria-label="เลือกเข้าสู่ระบบหรือสมัครสมาชิก">
          <Link to="/login" state={location.state} aria-current={!register ? 'page' : undefined}>เข้าสู่ระบบ</Link>
          <Link to="/register" state={location.state} aria-current={register ? 'page' : undefined}>สมัครสมาชิก</Link>
        </nav>}
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
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={190}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </label>
            <div className="auth-password-field">
              <label htmlFor="auth-password">รหัสผ่าน</label>
              <div className="auth-password-control">
                <input id="auth-password" name="password" required
                  type={showPassword ? "text" : "password"} minLength={8} maxLength={72}
                  autoComplete={register ? "new-password" : "current-password"}
                  placeholder={register ? "อย่างน้อย 8 ตัวอักษร" : "กรอกรหัสผ่านของคุณ"} />
                <button type="button" className="password-toggle" aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPassword} onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
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
  const [date, setDate] = useState("");
  const slots = useData("/reservation-slots"),
    [search, setSearch] = useState(null),
    [tables, setTables] = useState([]),
    [roomTables, setRoomTables] = useState([]),
    [freeTables, setFreeTables] = useState([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [selected, setSelected] = useState(null),
    [note, setNote] = useState("");
  const navigate = useNavigate(),
    { setNotice, setCelebrate } = useStore();
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
      const [r, room, free] = await Promise.all([api.get("/tables/availability", { params: d }), api.get("/tables?limit=100"), api.get("/tables/availability", { params: { ...d, guests: 1 } })]);
      setTables(r.data.data);
      setRoomTables(room.data.data);
      setFreeTables(free.data.data);
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
      setCelebrate(`จองโต๊ะสำเร็จ · ${thaiDate(search.date)} เวลา ${search.slot} น.`);
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
        <span className="eyebrow orange"><ShinyText text="เก็บที่นั่งให้คนโปรด" color="#F45B0B" shineColor="#ffd9a8" speed={3.5} /></span>
        <AnimatedHeading>จองโต๊ะที่พุงป่อง</AnimatedHeading>
        <p>เลือกเวลาแห่งความอร่อย · รอบละ 90 นาที · จองล่วงหน้าได้ 90 วัน</p>
      </div>
      <AnimatedContent distance={40} duration={0.8} trigger="mount">
        <form
          className="booking-form"
          onSubmit={find}
          onChange={() => {
            setSearch(null);
            setSelected(null);
          }}
        >
        <ReservationDate today={today} value={date} onChange={value => {
          setDate(value); setSearch(null); setSelected(null);
        }} />
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
      </AnimatedContent>
      <Feedback loading={busy} error={error || slots.error} />
      {search && (
        <>
          <TablePicker freeTables={freeTables} roomTables={roomTables} tables={tables} selected={selected} onSelect={setSelected} guests={search.guests} busy={busy} />
          {!tables.length && <Feedback empty />}
          {selected && (
            <div className="booking-confirm">
              <h3 aria-live="polite">โต๊ะ {tables.find(t => t.id === selected)?.table_number} · พร้อมสำหรับมื้อของคุณ</h3>
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
        <span className="eyebrow orange"><ShinyText text={reservations ? "มื้อดีๆ ที่วางแผนไว้" : "มื้ออร่อยของคุณ"} color="#F45B0B" shineColor="#ffd9a8" speed={3.5} /></span>
        <AnimatedHeading>{reservations ? "การจองของฉัน" : "รายการสั่งซื้อของฉัน"}</AnimatedHeading>
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
