import React, { lazy, Suspense } from "react";

const Scene = lazy(() => import("./CelebrationScene"));

// Full-screen but click-through celebration overlay; shown briefly after an
// order or reservation succeeds. Purely decorative.
export default function Celebration({ message }) {
  if (!message) return null;
  return (
    <div className="celebration" role="status" aria-live="polite">
      <div className="celebration-card">
        <div className="celebration-art" aria-hidden="true">
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </div>
        <strong>ยินดีด้วยนะ!</strong>
        <p>{message}</p>
      </div>
    </div>
  );
}
