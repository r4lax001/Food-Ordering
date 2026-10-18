import React from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  ArrowUpRight,
  LoaderCircle,
  Utensils,
  CircleAlert,
} from "lucide-react";
import { Badge } from "./components/reui/badge";
import {
  Alert,
  AlertTitle,
  AlertDescription,
  AlertAction,
} from "./components/reui/alert";
import { useStore } from "./state";
import { money, photoFor } from "./utils";
export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="พุงป่อง หน้าหลัก">
      <img src="/logo.svg" alt="" />
      <span>
        พุงป่อง<small>PHUNGPONG</small>
      </span>
    </Link>
  );
}
export function FoodImage({ src, alt, ...props }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/food-placeholder.svg";
      }}
      {...props}
    />
  );
}
export function Feedback({ loading, error, empty = false, reload }) {
  return loading ? (
    <div className="feedback" role="status" aria-live="polite">
      <LoaderCircle className="spin" /> พุงป่องกำลังจัดเตรียมข้อมูล…
    </div>
  ) : error ? (
    <Alert variant="destructive" className="feedback-alert">
      <CircleAlert />
      <AlertTitle>ยังทำรายการไม่สำเร็จ</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      {reload && (
        <AlertAction>
          <button className="btn secondary" onClick={reload}>
            ลองใหม่
          </button>
        </AlertAction>
      )}
    </Alert>
  ) : empty ? (
    <div className="feedback">
      <Utensils /> ยังไม่มีรายการในตอนนี้
    </div>
  ) : null;
}
export function SectionTitle({ title, to = "/menu", label = "ดูทั้งหมด" }) {
  return (
    <div className="section-title">
      <h2>{title}</h2>
      <Link to={to}>
        {label} <ArrowUpRight size={15} />
      </Link>
    </div>
  );
}
export function FoodCard({ item, compact = false }) {
  const { add } = useStore();
  return (
    <article className={`food-card ${compact ? "compact" : ""}`}>
      <Link to={`/menu/${item.id}`} className="food-image">
        <FoodImage src={photoFor(item)} alt={item.name} />
        <Badge
          variant={item.is_available ? "success-light" : "secondary"}
          radius="full"
          className="food-label"
        >
          {item.is_available ? "ปรุงสดใหม่" : "หมดชั่วคราว"}
        </Badge>
      </Link>
      <div className="food-content">
        <p className="eyebrow">{item.category_name || "เมนูจากครัวพุงป่อง"}</p>
        <Link to={`/menu/${item.id}`}>
          <h3>{item.name}</h3>
        </Link>
        <div className="food-bottom">
          <strong>{money(item.price)}</strong>
          <button
            className="add-button"
            disabled={!item.is_available}
            onClick={() => add(item)}
            aria-label={`เพิ่ม ${item.name} ในตะกร้า`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
