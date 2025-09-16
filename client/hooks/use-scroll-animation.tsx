import { useInView } from "framer-motion";
import { useRef } from "react";

export function useScrollAnimation() {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: "-100px 0px" 
  });

  return { ref, isInView };
}

export const fadeInUp = {
  initial: { 
    opacity: 0, 
    y: 60 
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export const fadeInLeft = {
  initial: { 
    opacity: 0, 
    x: -60 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export const fadeInRight = {
  initial: { 
    opacity: 0, 
    x: 60 
  },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut"
    }
  }
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.2
    }
  }
};
