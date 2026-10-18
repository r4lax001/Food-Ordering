import React, { Component, lazy, Suspense } from "react";
import { LoaderCircle } from "lucide-react";

const MiniScene = lazy(() => import("./ClocheScene"));

class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Small 3D cloche spinner for loading states; falls back to the plain
// spinner when WebGL is unavailable or the lazy scene fails.
export default function ClocheLoader({ size = 54 }) {
  const fallback = <LoaderCircle className="spin" size={22} />;
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <div style={{ width: size, height: size }} aria-hidden="true">
          <MiniScene />
        </div>
      </Suspense>
    </Boundary>
  );
}
