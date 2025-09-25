import classes from "./landing.module.css";
import { useState, useEffect } from "react";

function HomeBGEffects({ setIsVisible }) {
  //   const [isVisible, setIsVisible] = useState(false);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [particles] = useState(() =>
    [...Array(100)].map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      animationDelay: Math.random() * 3,
      animationDuration: 2 + Math.random() * 3,
    }))
  );

  // useEffect לניהול מיקום העכבר וגלילה
  useEffect(() => {
    setIsVisible(true);

    // Throttle mouse move events
    let mouseTimeout;
    const handleMouseMove = (e) => {
      if (mouseTimeout) return;
      mouseTimeout = setTimeout(() => {
        setMousePos({ x: e.clientX, y: e.clientY });
        mouseTimeout = null;
      }, 50); // עדכון כל 50ms במקום בכל תזוזה
    };

    // Throttle scroll events
    let scrollTimeout;
    const handleScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        scrollTimeout = null;
      });
    };

    // הוסף passive: true לביצועים
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      // נקה timeouts
      if (mouseTimeout) clearTimeout(mouseTimeout);
      if (scrollTimeout) cancelAnimationFrame(scrollTimeout);
    };
  }, [setIsVisible]); // dependency array ריק

  return (
    <div className={classes.backgroundEffects}>
      {/* Animated gradient orbs */}
      <div
        className={classes.gradientOrb1}
        style={{
          left: mousePos.x / 10,
          top: mousePos.y / 10,
          transform: `translate(-50%, -50%) scale(${1 + scrollY / 5000})`,
        }}
      />
      <div
        className={classes.gradientOrb2}
        style={{
          right: mousePos.x / 15,
          bottom: mousePos.y / 15,
          transform: `translate(50%, 50%) scale(${1 + scrollY / 8000})`,
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={classes.particle}
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            animationDelay: `${particle.animationDelay}s`,
            animationDuration: `${particle.animationDuration}s`,
          }}
        />
      ))}
    </div>
  );
}

export default HomeBGEffects;
