import React, { Component, lazy, Suspense } from 'react';
const Scene = lazy(() => import('./RestaurantScene'));
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export default function Restaurant3D(props) {
  const fallback = <div className="room3d-fallback"><p>อุปกรณ์นี้แสดงร้าน 3D ไม่ได้ เลือกโต๊ะต่อจากผัง 2D ได้ครับ</p><button type="button" className="btn secondary" onClick={props.onFallback}>เปิดผัง 2D</button></div>;
  return <SceneBoundary fallback={fallback}><Suspense fallback={<div className="room3d-fallback" role="status">กำลังเตรียมมุมอร่อยของคุณ…</div>}><Scene {...props} fallback={fallback} /></Suspense></SceneBoundary>;
}
