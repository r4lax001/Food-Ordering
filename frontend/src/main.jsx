import AnimatedHeading from "./components/AnimatedHeading";
import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  ShoppingBag,
  Menu as MenuIcon,
  X,
  ArrowUpRight,
  Heart,
  LogOut,
  Instagram,
  Facebook,
} from "lucide-react";
import { Store, useStore } from "./state";
import { Brand, Feedback } from "./components";
import {
  Home,
  MenuPage,
  FoodDetail,
  Cart,
  Auth,
  Reservation,
  History,
} from "./pages";
import Admin from "./admin";
import ClickSpark from "./components/reactbits/ClickSpark";
import { Dialog } from "@base-ui/react/dialog";
import "./styles.css";
import "./responsive.css";

function NavigationLinks({ user, onNavigate }) {
  return (
    <>
      <NavLink to="/" onClick={onNavigate}>
        หน้าหลัก
      </NavLink>
      <NavLink to="/menu" onClick={onNavigate}>
        เมนูอาหาร
      </NavLink>
      <NavLink to="/reservation" onClick={onNavigate}>
        จองโต๊ะ
      </NavLink>
      {user && (
        <>
          <NavLink to="/orders" onClick={onNavigate}>
            รายการสั่งซื้อ
          </NavLink>
          <NavLink to="/reservations" onClick={onNavigate}>
            การจองของฉัน
          </NavLink>
        </>
      )}
      {user?.role === "admin" && (
        <NavLink to="/admin" onClick={onNavigate}>
          จัดการร้าน
        </NavLink>
      )}
    </>
  );
}

function Protected({ children, admin = false }) {
  const { user, ready } = useStore();
  const location = useLocation();
  if (!ready) return <Feedback loading />;
  if (!user)
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
function App() {
  const { user, cart, logout, notice } = useStore(),
    [mobile, setMobile] = useState(false);
  const location = useLocation();
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1280px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMobile(false);
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
    const names = {
      "/": "หน้าหลัก",
      "/menu": "เมนูอาหาร",
      "/cart": "ตะกร้าของฉัน",
      "/login": "เข้าสู่ระบบ",
      "/register": "สมัครสมาชิก",
      "/reservation": "จองโต๊ะ",
      "/orders": "รายการสั่งซื้อของฉัน",
      "/reservations": "การจองของฉัน",
      "/admin": "จัดการร้าน",
    };
    document.title = `${names[location.pathname] || "เมนูโปรด"} | พุงป่อง (PhungPong)`;
  }, [location.pathname]);
  return (
    <>
      <div className="top-note">
        มื้ออร่อยเริ่มที่นี่ <span>Good Food, Happy Belly.</span>
        <Heart size={12} />
      </div>
      <div className="site-shell">
        <header>
          <Brand />
          <nav className="desktop-nav" aria-label="เมนูหลัก">
            <NavigationLinks user={user} />
          </nav>
          <div className="header-actions">
            <Link
              className="cart-icon"
              to="/cart"
              aria-label={`ตะกร้าของฉัน ${cart.reduce((s, i) => s + i.quantity, 0)} รายการ`}
            >
              <ShoppingBag size={21} />
              {cart.length > 0 && (
                <b>{cart.reduce((s, i) => s + i.quantity, 0)}</b>
              )}
            </Link>
            {user ? (
              <button className="account" onClick={logout} title="ออกจากระบบ">
                <span>{user.name.split(" ")[0]}</span>
                <LogOut size={16} />
              </button>
            ) : (
              <Link className="btn small header-login" to="/login">
                เข้าสู่ระบบ <ArrowUpRight size={14} />
              </Link>
            )}
            <Dialog.Root open={mobile} onOpenChange={setMobile}>
              <Dialog.Trigger className="mobile-toggle" aria-label="เปิดเมนู">
                <MenuIcon />
              </Dialog.Trigger>
              <Dialog.Portal>
                <Dialog.Backdrop className="menu-backdrop" />
                <Dialog.Popup className="mobile-menu">
                  <div className="mobile-menu-heading">
                    <Dialog.Title>เมนูพุงป่อง</Dialog.Title>
                    <Dialog.Close className="icon-button" aria-label="ปิดเมนู">
                      <X />
                    </Dialog.Close>
                  </div>
                  <Dialog.Description>
                    หิวเมื่อไหร่ พุงป่องจัดให้
                  </Dialog.Description>
                  <nav className="drawer-nav" aria-label="เมนูมือถือ">
                    <NavigationLinks
                      user={user}
                      onNavigate={() => setMobile(false)}
                    />
                  </nav>
                  <Link
                    className="btn full"
                    to="/cart"
                    onClick={() => setMobile(false)}
                  >
                    <ShoppingBag size={18} />
                    ตะกร้าของฉัน
                  </Link>
                  {user ? (
                    <button
                      className="btn secondary full"
                      onClick={() => {
                        logout();
                        setMobile(false);
                      }}
                    >
                      <LogOut size={18} />
                      ออกจากระบบ
                    </button>
                  ) : (
                    <Link
                      className="btn secondary full"
                      to="/login"
                      onClick={() => setMobile(false)}
                    >
                      เข้าสู่ระบบ / สมัครสมาชิก
                    </Link>
                  )}
                  <p className="mobile-menu-note">
                    อิ่มอร่อย ส่งไว ถูกใจทุกมื้อ
                  </p>
                </Dialog.Popup>
              </Dialog.Portal>
            </Dialog.Root>
          </div>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/menu/:id" element={<FoodDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth register />} />
            <Route
              path="/reservation"
              element={
                <Protected>
                  <Reservation />
                </Protected>
              }
            />
            <Route
              path="/orders"
              element={
                <Protected>
                  <History />
                </Protected>
              }
            />
            <Route
              path="/reservations"
              element={
                <Protected>
                  <History reservations />
                </Protected>
              }
            />
            <Route
              path="/admin"
              element={
                <Protected admin>
                  <Admin />
                </Protected>
              }
            />
            <Route
              path="*"
              element={
                <div className="page centered">
                  <AnimatedHeading>หน้านี้ยังไม่อยู่ในเมนู</AnimatedHeading>
                  <Link className="btn" to="/">
                    กลับหน้าหลัก
                  </Link>
                </div>
              }
            />
          </Routes>
        </main>
        {location.pathname === "/admin" || location.pathname.startsWith("/admin/") ? (
          <footer className="admin-footer-minimal">© {new Date().getFullYear()} พุงป่อง · PhungPong</footer>
        ) : (
          <footer className="site-footer-compact">
            <Brand />
            <div className="footer-links">
              <Link to="/menu">เมนูอาหาร</Link>
              <Link to="/reservation">จองโต๊ะ</Link>
            </div>
            <small className="footer-credit">© {new Date().getFullYear()} พุงป่อง · PhungPong</small>
          </footer>
        )}
      </div>
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Store>
      <ClickSpark sparkColor="#F45B0B" sparkSize={13} sparkCount={10} glow={0.5}>
        <App />
      </ClickSpark>
    </Store>
  </BrowserRouter>,
);
