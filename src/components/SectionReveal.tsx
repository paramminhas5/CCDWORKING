/**
 * SectionReveal — lightweight viewport-triggered fade-in.
 * 
 * Keeps animations subtle (opacity + tiny Y shift) so they don't
 * fight with Lenis smooth scroll or cause compositor thrashing.
 */
import { motion } from "framer-motion";
import { ReactNode } from "react";

const SectionReveal = ({ children, className, id }: { children: ReactNode; className?: string; id?: string }) => (
  <motion.div
    id={id}
    initial={{ opacity: 0, y: 12 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

export default SectionReveal;
