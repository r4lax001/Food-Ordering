import React, { Children, cloneElement, isValidElement, useSyncExternalStore } from 'react';
import BlurText from './reactbits/BlurText';
import './animated-heading.css';

const media = () => window.matchMedia('(prefers-reduced-motion: reduce)');
const subscribe = (notify) => {
  const query = media();
  query.addEventListener('change', notify);
  return () => query.removeEventListener('change', notify);
};
const snapshot = () => media().matches;

// Keep the original heading semantics, links and Thai text intact.
export default function AnimatedHeading({ as: Tag = 'h1', children, className = '', ...props }) {
  const reduced = useSyncExternalStore(subscribe, snapshot, () => true);
  const decorate = (nodes) => Children.map(nodes, (child) => {
    if (typeof child === 'string' && child.trim()) {
      return <BlurText key={child} text={child} className="rb-text" animateBy="words"
        delay={20} stepDuration={0.18} distance={8} blur={3} direction="bottom"
        animationFrom={{ opacity: 0.4, filter: 'blur(3px)', y: 8 }}
        animationTo={[{ opacity: 1, filter: 'blur(0px)', y: 0 }]} />;
    }
    if (isValidElement(child) && child.props.children) {
      return cloneElement(child, {}, decorate(child.props.children));
    }
    return child;
  });
  return <Tag {...props} className={`animated-heading ${className}`.trim()}>
    {reduced ? children : decorate(children)}
  </Tag>;
}
