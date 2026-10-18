import { SiteHeader, BottomDock } from "./components/Navigation";
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
import "./navigation.css";
import "./menu-cards.css";

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
  const { notice } = useStore();
  const location = useLocation();
  useEffect(() => {
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
        <SiteHeader />
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
      <BottomDock />
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
