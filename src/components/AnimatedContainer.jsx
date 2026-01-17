import { motion as Motion } from "framer-motion";

export default function AnimatedContainer({
  children,
  className = "",
  delay = 0,
}) {
  return (
    <Motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {
          opacity: 0,
          y: 40,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.8,
            ease: "easeOut",
            delay,
            staggerChildren: 0.15,
          },
        },
      }}
    >
      {children}
    </Motion.div>
  );
}