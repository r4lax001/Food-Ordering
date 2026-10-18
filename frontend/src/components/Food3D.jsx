import React, {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { photos } from "../utils";
import "./food3d.css";

const FoodScene = lazy(() => import("./FoodScene"));
function Fallback() {
  return (
    <img
      className="food3d-fallback"
      src={photos.hero}
      alt="ข้าวกะเพราไก่ ภาพสำรองของจานอาหาร 3D"
    />
  );
}
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFailure();
  }
  render() {
    return this.state.failed ? <Fallback /> : this.props.children;
  }
}

export default function Food3D() {
  const container = useRef(null),
    drag = useRef(null);
  const [angle, setAngle] = useState(0),
    [visible, setVisible] = useState(true),
    [reduced, setReduced] = useState(false),
    [failed, setFailed] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    let onscreen = true;
    const sync = () => setVisible(onscreen && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => {
      onscreen = entry.isIntersecting;
      sync();
    });
    observer.observe(container.current);
    document.addEventListener("visibilitychange", sync);
    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  useEffect(() => {
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = container.current.getBoundingClientRect().top;
        const touch = matchMedia('(hover: none)').matches;
        // Full reveal at page bottom even if the page is shorter than 240px of scroll.
        const span = Math.min(240, Math.max(document.documentElement.scrollHeight - innerHeight, 1));
        const progress = touch ? (innerHeight * .72 - top) / (innerHeight * .36) : window.scrollY / span;
        setScrollProgress(Math.max(0, Math.min(1, progress)));
      });
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', update); removeEventListener('resize', update); };
  }, []);
  const progress = reduced || hovered || focused ? 1 : scrollProgress;
  const turn = (amount) => {
    setAngle((a) => a + amount);
  };
  return (
    <section ref={container} className="food3d" aria-label="จานอาหารสามมิติ">
<div
        className="food3d-stage"
        data-angle={angle}
        data-assembly={progress}
        onPointerEnter={e => { if (e.pointerType === 'mouse') { setHovered(true); } }}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        tabIndex={failed ? -1 : 0}
        role="group"
        aria-label="ลากซ้ายขวา หรือใช้ปุ่มลูกศรเพื่อหมุนจานอาหาร"
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            turn(e.key === "ArrowLeft" ? -0.3 : 0.3);
          }
        }}
        onPointerDown={(e) => {
          if (failed) return;
          drag.current = e.clientX;
          e.currentTarget.setPointerCapture(e.pointerId);
              }}
        onPointerMove={(e) => {
          if (drag.current === null) return;
          const delta = (e.clientX - drag.current) * 0.012;
          drag.current = e.clientX;
          setAngle((a) => a + delta);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        onLostPointerCapture={() => {
          drag.current = null;
        }}
      >
        {failed ? (
          <Fallback />
        ) : (
          <SceneBoundary onFailure={() => setFailed(true)}>
            <Suspense fallback={<Fallback />}>
              <FoodScene
                
                angle={angle}
                progress={progress}
                active={visible}
                reduced={reduced}
                onFailure={() => setFailed(true)}
              />
            </Suspense>
          </SceneBoundary>
        )}
      </div>
    </section>
  );
}
