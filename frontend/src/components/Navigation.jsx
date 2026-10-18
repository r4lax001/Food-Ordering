import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { House, Utensils, CalendarDays, ClipboardList, ShoppingBag, UserRound, LogIn, LogOut, X } from 'lucide-react';
import { Dialog } from '@base-ui/react/dialog';
import { Brand } from '../components';
import { useStore } from '../state';

export function SiteHeader() {
  const { user, logout } = useStore();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useEffect(() => setOpen(false), [location.pathname]);
  const signout = () => { setOpen(false); logout(); };
  return <header className="dock-header">
    <Brand />
    <BottomDock desktop />
    <div className="header-actions">
      {user ? <>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger className="profile-trigger" aria-label="เปิดเมนูบัญชี" title="บัญชีของฉัน"><UserRound size={21} /><span>{user.name.split(' ')[0]}</span></Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="menu-backdrop" />
            <Dialog.Popup className="mobile-menu account-panel">
              <div className="mobile-menu-heading"><Dialog.Title>บัญชีของฉัน</Dialog.Title><Dialog.Close className="icon-button" aria-label="ปิดเมนูบัญชี"><X /></Dialog.Close></div>
              <Dialog.Description className="account-details">{user.name}<br />{user.email}</Dialog.Description>
              <nav className="drawer-nav" aria-label="เมนูบัญชี">
                <Link to="/orders" onClick={() => setOpen(false)}><ClipboardList size={20} /> รายการสั่งซื้อของฉัน</Link>
                <Link to="/reservations" onClick={() => setOpen(false)}><CalendarDays size={20} /> การจองของฉัน</Link>
                {user.role === 'admin' && <Link to="/admin" onClick={() => setOpen(false)}><Utensils size={20} /> จัดการร้าน</Link>}
              </nav>
              <button className="btn secondary full" onClick={signout}><LogOut size={18} /> ออกจากระบบ</button>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
        <button className="header-signout" onClick={signout} aria-label="ออกจากระบบ" title="ออกจากระบบ"><LogOut size={20} /></button>
      </> : <Link className="dock-login" to="/login"><LogIn size={20} /><span>เข้าสู่ระบบ</span></Link>}
    </div>
  </header>;
}

export function BottomDock({ desktop = false }) {
  const { cart } = useStore();
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  return <nav className={desktop ? 'top-navigation' : 'bottom-dock'} aria-label="เมนูหลัก">
    <NavLink to="/" end><House /><span>หน้าหลัก</span></NavLink>
    <NavLink to="/menu"><Utensils /><span>เมนูอาหาร</span></NavLink>
    <NavLink to="/cart" className="dock-cart" aria-label={`ตะกร้าของฉัน ${count} รายการ`}><ShoppingBag /><span>ตะกร้า</span>{count > 0 && <b className="dock-count">{count > 99 ? '99+' : count}</b>}</NavLink>
    <NavLink to="/reservation"><CalendarDays /><span>จองโต๊ะ</span></NavLink>
    <NavLink to="/orders"><ClipboardList /><span>คำสั่งซื้อ</span></NavLink>
  </nav>;
}
