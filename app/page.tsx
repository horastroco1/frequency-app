'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import { Play, Pause } from 'lucide-react';
import { TheGodLogo } from '../components/TheGodLogo';

// --- CONFIG ---
const R2_DOMAIN = 'https://pub-5e947aef5d7446cba7a0e57a0dc13d6e.r2.dev'; 
const CROSSFADE_DURATION = 3000; // 3 second crossfade

// --- COSMIC FREQUENCY PLAYLIST ---
const PLAYLIST = [
  { id: '001', title: 'FREQUENCY 001', file: `${R2_DOMAIN}/albums/cosmic_01.mp3`, cover: `${R2_DOMAIN}/albums/cosmic_01.png` },
  { id: '002', title: 'FREQUENCY 002', file: `${R2_DOMAIN}/albums/cosmic_02.mp3`, cover: `${R2_DOMAIN}/albums/cosmic_02.png` },
  { id: '003', title: 'FREQUENCY 003', file: `${R2_DOMAIN}/albums/cosmic_03.mp3`, cover: `${R2_DOMAIN}/albums/cosmic_03.png` },
  { id: '004', title: 'FREQUENCY 004', file: `${R2_DOMAIN}/albums/cosmic_04.mp3`, cover: `${R2_DOMAIN}/albums/cosmic_04.png` },
  { id: '005', title: 'FREQUENCY 005', file: `${R2_DOMAIN}/albums/cosmic_05.mp3`, cover: `${R2_DOMAIN}/albums/cosmic_05.png` },
  { id: '006', title: 'FREQUENCY 006', file: `${R2_DOMAIN}/albums/cosmic_06.mp3`, cover: `${R2_DOMAIN}/albums/cosmic_06.png` },
];

// --- EXTRACT DOMINANT COLOR FROM IMAGE ---
const extractDominantColor = (imgSrc: string): Promise<{ r: number; g: number; b: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({ r: 21, g: 22, b: 34 }); // Fallback dark
        return;
      }
      
      // Sample at lower resolution for speed
      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);
      
      const imageData = ctx.getImageData(0, 0, 100, 100).data;
      let r = 0, g = 0, b = 0, count = 0;
      
      // Sample every 10th pixel for performance
      for (let i = 0; i < imageData.length; i += 40) {
        // Skip very dark or very light pixels
        const pr = imageData[i];
        const pg = imageData[i + 1];
        const pb = imageData[i + 2];
        const brightness = (pr + pg + pb) / 3;
        
        if (brightness > 30 && brightness < 220) {
          r += pr;
          g += pg;
          b += pb;
          count++;
        }
      }
      
      if (count > 0) {
        resolve({ r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) });
      } else {
        resolve({ r: 21, g: 22, b: 34 });
      }
    };
    img.onerror = () => resolve({ r: 21, g: 22, b: 34 });
    img.src = imgSrc;
  });
};

export default function RadioPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const soundRef = useRef<Howl | null>(null);
  const nextSoundRef = useRef<Howl | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageError, setImageError] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [dominantColor, setDominantColor] = useState({ r: 21, g: 22, b: 34 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // --- EXTRACT COLOR WHEN TRACK CHANGES ---
  useEffect(() => {
    const track = PLAYLIST[currentTrackIndex];
    extractDominantColor(track.cover).then(setDominantColor);
  }, [currentTrackIndex]);

  // --- AUDIO ENGINE WITH CROSSFADE ---
  useEffect(() => {
    loadTrack(0, true);
    return () => {
      if (soundRef.current) soundRef.current.unload();
      if (nextSoundRef.current) nextSoundRef.current.unload();
    };
  }, []);

  // --- GRADIENT VISUALIZER (Now uses dominant color) ---
  useEffect(() => {
    if (!canvasRef.current || !isPlaying) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bars = 48;
    let t = 0;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width / bars;
      t += 0.08;
      
      for (let i = 0; i < bars; i++) {
        const height = (Math.sin(i * 0.3 + t) * 0.4 + Math.cos(i * 0.7 - t) * 0.2 + 0.6) * (canvas.height * 0.7);
        const x = i * width;
        const y = canvas.height - height;
        
        // Use dominant color for gradient
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.9)`);
        gradient.addColorStop(1, `rgba(${dominantColor.r * 0.5}, ${dominantColor.g * 0.5}, ${dominantColor.b * 0.5}, 0.4)`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, width - 4, height, 4);
        ctx.fill();
      }
      
      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, dominantColor]);

  const loadTrack = (index: number, autoPlay: boolean = false) => {
    if (soundRef.current) soundRef.current.unload();

    const track = PLAYLIST[index];
    soundRef.current = new Howl({
      src: [track.file],
      html5: true,
      volume: 0.8,
      autoplay: autoPlay,
      onplay: () => setIsPlaying(true),
      onend: () => crossfadeToNext(),
      onloaderror: (_id, error) => {
        console.warn('Audio Load Error:', error, track.file);
      }
    });
    setImageError(false);
    
    if (autoPlay) {
      setIsPlaying(true);
    }
  };

  // --- CROSSFADE TRANSITION ---
  const crossfadeToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    let nextIndex = currentTrackIndex + 1;
    if (nextIndex >= PLAYLIST.length) nextIndex = 0;

    const nextTrack = PLAYLIST[nextIndex];
    
    // Preload next track
    nextSoundRef.current = new Howl({
      src: [nextTrack.file],
      html5: true,
      volume: 0,
      autoplay: true,
      onplay: () => {
        // Fade out current, fade in next
        if (soundRef.current) {
          soundRef.current.fade(0.8, 0, CROSSFADE_DURATION);
        }
        nextSoundRef.current?.fade(0, 0.8, CROSSFADE_DURATION);
        
        // After crossfade completes
        setTimeout(() => {
          if (soundRef.current) {
            soundRef.current.unload();
          }
          soundRef.current = nextSoundRef.current;
          nextSoundRef.current = null;
          setCurrentTrackIndex(nextIndex);
          setIsTransitioning(false);
        }, CROSSFADE_DURATION);
      },
      onend: () => crossfadeToNext(),
      onloaderror: (_id, error) => {
        console.warn('Next Track Load Error:', error);
        setIsTransitioning(false);
        // Fallback: just play next without crossfade
        setCurrentTrackIndex(nextIndex);
        loadTrack(nextIndex, true);
      }
    });
  }, [currentTrackIndex, isTransitioning]);

  const togglePlay = () => {
    if (!soundRef.current) return;
    setHasInteracted(true);
    
    if (isPlaying) {
      soundRef.current.pause();
      setIsPlaying(false);
    } else {
      soundRef.current.play();
      setIsPlaying(true);
    }
  };

  const currentTrack = PLAYLIST[currentTrackIndex];

  // Dynamic color styles
  const bgGlow = `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.15)`;
  const bgGlowStrong = `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.25)`;
  const borderGlow = `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.2)`;

  return (
    <div 
      className="min-h-screen text-white font-sans overflow-hidden flex flex-col items-center justify-center p-6 relative selection:bg-white/20 selection:text-white"
      style={{ backgroundColor: '#000000' }}
    >
      
      {/* --- DYNAMIC ATMOSPHERE (Changes with cover) --- */}
      <motion.div 
        className="absolute top-[-30%] left-[-20%] w-[900px] h-[900px] rounded-full blur-[180px] pointer-events-none"
        animate={{ 
          backgroundColor: bgGlowStrong,
          scale: isPlaying ? [1, 1.05, 1] : 1
        }}
        transition={{ 
          backgroundColor: { duration: 2, ease: 'easeInOut' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
        }}
      />
      <motion.div 
        className="absolute bottom-[-30%] right-[-20%] w-[700px] h-[700px] rounded-full blur-[200px] pointer-events-none"
        animate={{ 
          backgroundColor: bgGlow,
          scale: isPlaying ? [1, 1.08, 1] : 1
        }}
        transition={{ 
          backgroundColor: { duration: 2, ease: 'easeInOut' },
          scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' }
        }}
      />
      {/* Center glow behind card */}
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none z-0"
        animate={{ backgroundColor: bgGlowStrong }}
        transition={{ duration: 2, ease: 'easeInOut' }}
      />

      {/* --- G0D LOGO (Top Left) --- */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <TheGodLogo className="w-8 h-8 text-white/80" />
        <span className="text-[10px] tracking-[0.4em] font-mono text-white/40 uppercase hidden md:block">Frequency</span>
      </div>

      {/* --- THE 23,000 YEAR GLASSMORPHISM CARD --- */}
      <div className="relative z-10 w-full max-w-sm md:max-w-md">
        
        {/* Outer holographic rim */}
        <motion.div 
          className="absolute -inset-[1px] rounded-[26px] opacity-50"
          style={{
            background: `linear-gradient(135deg, ${borderGlow}, transparent 40%, ${borderGlow})`,
          }}
          animate={{
            opacity: isPlaying ? [0.3, 0.6, 0.3] : 0.3
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <div 
          className="relative rounded-3xl overflow-hidden backdrop-blur-3xl border border-white/[0.08] transition-all duration-1000"
          style={{
            boxShadow: `0 0 100px -30px ${bgGlowStrong}, 0 0 60px -20px ${bgGlow}, inset 0 1px 0 rgba(255,255,255,0.05)`
          }}
        >
          
          {/* Multi-layer glass effect */}
          <div className="absolute inset-0 bg-[#0a0a0f]/60 z-0" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] via-transparent to-white/[0.01] z-0" />
          
          {/* Animated noise texture overlay */}
          <div 
            className="absolute inset-0 opacity-[0.015] z-0 pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
          
          <div className="relative z-10 p-8 flex flex-col items-center">
            
            {/* HEADER */}
            <div className="w-full flex justify-between items-center mb-8">
              <div className="flex items-center gap-2">
                 {isPlaying && (
                   <span className="relative flex h-2 w-2">
                     <motion.span 
                       className="absolute inline-flex h-full w-full rounded-full opacity-75"
                       style={{ backgroundColor: `rgb(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b})` }}
                       animate={{ scale: [1, 1.5, 1], opacity: [0.75, 0, 0.75] }}
                       transition={{ duration: 1.5, repeat: Infinity }}
                     />
                     <span 
                       className="relative inline-flex rounded-full h-2 w-2"
                       style={{ backgroundColor: `rgb(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b})` }}
                     />
                   </span>
                 )}
                 <span className={`text-[10px] tracking-[0.3em] font-mono uppercase transition-colors duration-1000 ${isPlaying ? 'text-white/60' : 'text-white/30'}`}>
                   {isPlaying ? 'Live' : 'Paused'}
                 </span>
              </div>
              <div className="text-[10px] tracking-[0.2em] font-mono text-white/30">{currentTrack.id}/006</div>
            </div>

            {/* ALBUM ART */}
            <motion.div 
               className="relative w-full aspect-square rounded-2xl overflow-hidden mb-8 shadow-2xl ring-1 ring-white/10 group"
               initial={{ scale: 0.95, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               transition={{ duration: 0.8 }}
            >
               <AnimatePresence mode="wait">
                 <motion.div
                   key={currentTrack.id}
                   initial={{ opacity: 0, scale: 1.05 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   transition={{ duration: 0.8 }}
                   className="w-full h-full"
                 >
                   {!imageError ? (
                     <img 
                       src={currentTrack.cover} 
                       alt={currentTrack.title}
                       onError={() => setImageError(true)}
                       className="w-full h-full object-cover"
                       
                     />
                   ) : (
                     <div className="w-full h-full bg-[#050505] flex items-center justify-center">
                       <span className="font-mono text-white/10 text-6xl">{currentTrack.id}</span>
                     </div>
                   )}
                 </motion.div>
               </AnimatePresence>
               
               {/* VISUALIZER OVERLAY */}
               <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent flex items-end justify-center pb-0">
                  <canvas ref={canvasRef} width={300} height={100} className="w-full h-full opacity-80" />
               </div>
            </motion.div>

            {/* TRACK INFO - THIN FONT */}
            <div className="text-center w-full mb-8">
              <AnimatePresence mode="wait">
                <motion.h1 
                  key={currentTrack.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-2xl md:text-3xl font-extralight text-white tracking-[0.15em] mb-2"
                >
                  {currentTrack.title}
                </motion.h1>
              </AnimatePresence>
              <p className="text-[10px] text-white/30 tracking-[0.5em] uppercase font-light">
                Cosmic Frequency
              </p>
            </div>

            {/* PLAY BUTTON - Dynamic glow */}
            <button
              onClick={togglePlay}
              className="group relative w-20 h-20 rounded-full flex items-center justify-center transition-transform active:scale-95"
            >
              <motion.div 
                className="absolute inset-0 rounded-full border transition-colors"
                style={{ 
                  borderColor: `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.3)`,
                  boxShadow: `0 0 40px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.15)`
                }}
                whileHover={{
                  borderColor: `rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.6)`,
                  boxShadow: `0 0 60px rgba(${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b}, 0.3)`
                }}
              />
              <div className="absolute inset-2 rounded-full bg-white/5 backdrop-blur-md" />
              <div className="relative z-10 text-white fill-current">
                {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-1" />}
              </div>
            </button>

          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-6 text-center w-full z-10">
        <p className="text-[9px] text-white/20 font-mono tracking-[0.5em] uppercase">
          frequency.theg0d.ai
        </p>
      </div>

    </div>
  );
}
