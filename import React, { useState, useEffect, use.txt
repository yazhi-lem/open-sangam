import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Sample streaming MP4 video links for immediate live testing
const DEMO_TINAI = {
  kurinji: {
    name: "Kurinji",
    landscape: "Mountainous Region",
    videoSrc: "https://assets.mixkit.co/videos/preview/mixkit-fog-over-the-top-of-a-mountain-41549-large.mp4",
    desc: "Mist-covered peaks and mountains where the Kurinji flower blooms.",
    flora: "Kurinji, Teak", fauna: "Nilgiri Tahr", music: "Kurinji Pann"
  },
  mullai: {
    name: "Mullai",
    landscape: "Forest Lands",
    videoSrc: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4",
    desc: "Dense woodlands and pastures filled with wild jasmine blossoms.",
    flora: "Mullai Jasmine", fauna: "Spotted Deer", music: "Mullai Pann"
  },
  marutham: {
    name: "Marutham",
    landscape: "Agricultural Valleys",
    videoSrc: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-grassy-field-41539-large.mp4",
    desc: "Fertile river basins with lush paddy fields and lotus ponds.",
    flora: "Lotus, Paddy", fauna: "Water Buffalo", music: "Marutham Pann"
  },
  neithal: {
    name: "Neithal",
    landscape: "Coastal Realm",
    videoSrc: "https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4",
    desc: "Expansive ocean shorelines, salty sea breezes, and roaring waves.",
    flora: "Water Lily", fauna: "Seagulls, Dolphins", music: "Neithal Pann"
  },
  palai: {
    name: "Palai",
    landscape: "Arid Wasteland",
    videoSrc: "https://assets.mixkit.co/videos/preview/mixkit-desolate-desert-dunes-under-a-clear-sky-40089-large.mp4",
    desc: "Sun-baked dry lands born from severe drought and heat.",
    flora: "Cactus, Kalli", fauna: "Vultures", music: "Palai Pann"
  }
};

export default function TinaiDemoShowcase() {
  const [activeKey, setActiveKey] = useState("kurinji");
  const active = DEMO_TINAI[activeKey];
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [activeKey]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 max-w-5xl mx-auto flex flex-col gap-6">
      <header className="text-center my-4">
        <h1 className="text-3xl font-extrabold text-amber-400 tracking-wider">OPEN SANGAM</h1>
        <p className="text-slate-400 text-sm mt-1">Tinai Interactive Visual Demo</p>
      </header>

      {/* 1. CINEMATIC VIDEO HERO CONTAINER */}
      <div className="relative w-full h-[280px] sm:h-[420px] lg:h-[500px] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeKey}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="w-full h-full"
          >
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src={active.videoSrc} type="video/mp4" />
            </video>
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* 2. INTERACTIVE CARD SELECTORS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(DEMO_TINAI).map(([key, item]) => {
          const isActive = key === activeKey;
          return (
            <motion.button
              key={key}
              onClick={() => setActiveKey(key)}
              animate={{
                scale: isActive ? 1.05 : 1,
                borderColor: isActive ? "rgba(251, 191, 36, 0.8)" : "rgba(255, 255, 255, 0.15)",
                boxShadow: isActive ? "0 0 20px rgba(251, 191, 36, 0.3)" : "none"
              }}
              className={`p-3 rounded-xl border backdrop-blur-md text-center transition-colors ${
                isActive ? "bg-amber-950/40 text-amber-200" : "bg-slate-900/60 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <div className="font-bold text-base">{item.name}</div>
              <div className="text-xs text-slate-400">{item.landscape}</div>
            </motion.button>
          );
        })}
      </div>

      {/* 3. SYNCHRONIZED CONTENT PANEL */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeKey}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="p-6 rounded-2xl bg-slate-900/80 border border-white/10 backdrop-blur-lg flex flex-col gap-2"
        >
          <h2 className="text-2xl font-bold text-amber-400">{active.name} — {active.landscape}</h2>
          <p className="text-slate-300">{active.desc}</p>
          <div className="grid grid-cols-3 gap-4 mt-4 text-xs text-slate-400 border-t border-white/10 pt-4">
            <div><span className="font-semibold text-slate-200">Flora:</span> {active.flora}</div>
            <div><span className="font-semibold text-slate-200">Fauna:</span> {active.fauna}</div>
            <div><span className="font-semibold text-slate-200">Music:</span> {active.music}</div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}