import React, { createContext, useContext, useEffect, useState } from "react";
import { api, errorText } from "./services/api";
const Context = createContext();
export const useStore = () => useContext(Context);
export function Store({ children }) {
  const [user, setUser] = useState(null),
    [ready, setReady] = useState(false),
    [notice, setNotice] = useState(""),
    [celebrate, setCelebrate] = useState("");
  const [cart, setCart] = useState(() => {
    try {
      const v = JSON.parse(localStorage.getItem("phungpong.cart") || "[]");
      return Array.isArray(v)
        ? v.filter(
            (i) =>
              Number.isInteger(i.id) &&
              i.quantity > 0 &&
              Number.isFinite(Number(i.price)),
          )
        : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem("phungpong.cart", JSON.stringify(cart));
  }, [cart]);
  function logout() {
    sessionStorage.removeItem("phungpong.token");
    setUser(null);
  }
  useEffect(() => {
    if (sessionStorage.getItem("phungpong.token"))
      api
        .get("/me")
        .then((r) => setUser(r.data.data))
        .catch(logout)
        .finally(() => setReady(true));
    else setReady(true);
    const expired = () => {
      logout();
      setNotice("เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่");
    };
    window.addEventListener("phungpong:expired", expired);
    return () => window.removeEventListener("phungpong:expired", expired);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(t);
  }, [notice]);
  useEffect(() => {
    if (!celebrate) return;
    const t = setTimeout(() => setCelebrate(""), 4600);
    return () => clearTimeout(t);
  }, [celebrate]);
  function add(item, quantity = 1) {
    setCart((old) => {
      const found = old.find((i) => i.id === item.id);
      return found
        ? old.map((i) =>
            i.id === item.id
              ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
              : i,
          )
        : [
            ...old,
            {
              id: item.id,
              name: item.name,
              price: item.price,
              image_url: item.image_url,
              quantity,
            },
          ];
    });
    setNotice(`เพิ่ม ${item.name} ในตะกร้าแล้ว`);
  }
  return (
    <Context.Provider
      value={{
        user,
        setUser,
        ready,
        logout,
        cart,
        setCart,
        add,
        notice,
        setNotice,
        celebrate,
        setCelebrate,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useData(path) {
  const [data, setData] = useState([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get(path)
      .then((r) => {
        if (active) setData(r.data.data);
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return { data, loading, error, reload: () => setRevision((v) => v + 1) };
}
