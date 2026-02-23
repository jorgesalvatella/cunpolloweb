"use client";

import { motion } from "framer-motion";
import Container from "@/components/ui/Container";

export default function VideoSection() {
  return (
    <section className="py-10 sm:py-14 bg-warm-white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            controls
            className="w-full rounded-xl sm:rounded-2xl shadow-lg"
          >
            <source src="/cunpollovideo.mp4" type="video/mp4" />
          </video>
        </motion.div>
      </Container>
    </section>
  );
}
