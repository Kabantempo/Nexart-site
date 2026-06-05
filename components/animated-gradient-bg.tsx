'use client'

import { motion } from 'framer-motion'

interface AnimatedGradientBgProps {
  children?: React.ReactNode
  className?: string
}

export function AnimatedGradientBg({ children, className = '' }: AnimatedGradientBgProps) {
  return (
    <div
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        minHeight: '100vh',
      }}
    >
      {/* Animated Gradient Background */}
      <motion.div
        animate={{
          background: [
            'linear-gradient(45deg, #6366F1 0%, #818CF8 25%, #C4B5FD 50%, #DDD6FE 75%, #6366F1 100%)',
            'linear-gradient(45deg, #818CF8 0%, #C4B5FD 25%, #DDD6FE 50%, #6366F1 75%, #818CF8 100%)',
            'linear-gradient(45deg, #C4B5FD 0%, #DDD6FE 25%, #6366F1 50%, #818CF8 75%, #C4B5FD 100%)',
            'linear-gradient(45deg, #6366F1 0%, #818CF8 25%, #C4B5FD 50%, #DDD6FE 75%, #6366F1 100%)',
          ],
          backgroundSize: ['400% 400%', '400% 400%', '400% 400%', '400% 400%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          filter: 'blur(80px)',
          opacity: 0.6,
        }}
      />

      {/* Secondary moving gradient */}
      <motion.div
        animate={{
          background: [
            'linear-gradient(-45deg, #DDD6FE 0%, #6366F1 25%, #818CF8 50%, #C4B5FD 75%, #DDD6FE 100%)',
            'linear-gradient(-45deg, #6366F1 0%, #C4B5FD 25%, #DDD6FE 50%, #818CF8 75%, #6366F1 100%)',
            'linear-gradient(-45deg, #818CF8 0%, #DDD6FE 25%, #6366F1 50%, #C4B5FD 75%, #818CF8 100%)',
            'linear-gradient(-45deg, #DDD6FE 0%, #6366F1 25%, #818CF8 50%, #C4B5FD 75%, #DDD6FE 100%)',
          ],
          backgroundSize: ['400% 400%', '400% 400%', '400% 400%', '400% 400%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
          delay: 1,
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          filter: 'blur(100px)',
          opacity: 0.4,
        }}
      />

      {/* Overlay for contrast */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.7), rgba(255,255,255,0.3))',
          zIndex: 1,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          minHeight: '100vh',
        }}
        className={className}
      >
        {children}
      </div>
    </div>
  )
}
