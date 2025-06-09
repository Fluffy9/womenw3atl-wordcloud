import { motion, AnimatePresence } from 'framer-motion';
import { useWordContext } from '../contexts/WordContext';
import { useEffect, useRef, useState } from 'react';

interface WordPosition {
    x: number;
    y: number;
    rotation: number;
}

interface TooltipState {
    text: string;
    frequency: number;
    x: number;
    y: number;
}

export function TagCloud() {
    const { words } = useWordContext();
    const positionsRef = useRef<WordPosition[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [tooltip, setTooltip] = useState<TooltipState | null>(null);

    // Calculate min and max frequencies for scaling
    const frequencies = words.map(word => word.frequency);
    const minFreq = Math.min(...frequencies, 1); // Use 1 as minimum to avoid division by zero
    const maxFreq = Math.max(...frequencies, 1);

    // Function to calculate font size based on frequency
    const getFontSize = (frequency: number) => {
        const minSize = 1; // rem
        const maxSize = 3; // rem
        const scale = (frequency - minFreq) / (maxFreq - minFreq);
        return minSize + (scale * (maxSize - minSize));
    };

    // Function to check if a position is in the safe zone
    const isInSafeZone = (x: number, y: number): boolean => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const safeZoneWidth = 400; // Width of the safe zone
        const safeZoneHeight = 600; // Height of the safe zone

        return Math.abs(x - centerX) < safeZoneWidth / 2 &&
            Math.abs(y - centerY) < safeZoneHeight / 2;
    };

    // Function to generate a random position outside the safe zone
    const generateRandomPosition = (): WordPosition => {
        const containerWidth = window.innerWidth;
        const containerHeight = window.innerHeight;
        const padding = 100; // Padding from edges
        const maxAttempts = 10; // Maximum attempts to find a valid position

        for (let i = 0; i < maxAttempts; i++) {
            const x = Math.random() * (containerWidth - 2 * padding) + padding;
            const y = Math.random() * (containerHeight - 2 * padding) + padding;

            if (!isInSafeZone(x, y)) {
                return {
                    x,
                    y,
                    rotation: Math.random() * 360 - 180 // Random rotation between -180 and 180 degrees
                };
            }
        }

        // If we couldn't find a position outside the safe zone, use the edges
        const isLeft = Math.random() > 0.5;
        const isTop = Math.random() > 0.5;

        return {
            x: isLeft ? padding : containerWidth - padding,
            y: isTop ? padding : containerHeight - padding,
            rotation: Math.random() * 360 - 180
        };
    };

    // Generate random positions for words only when words array changes
    useEffect(() => {
        if (words.length === positionsRef.current.length) return;

        const newPositions = words.map((_, index) => {
            // If we already have a position for this index, keep it
            if (positionsRef.current[index]) {
                return positionsRef.current[index];
            }
            // Otherwise generate a new position
            return generateRandomPosition();
        });

        positionsRef.current = newPositions;
    }, [words]);

    const handleWordHover = (word: { text: string; frequency: number }, x: number, y: number) => {
        setTooltip({
            text: word.text,
            frequency: word.frequency,
            x,
            y
        });
    };

    const handleWordLeave = () => {
        setTooltip(null);
    };

    return (
        <motion.div
            ref={containerRef}
            className="fixed inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {words.map((word, index) => (
                <motion.span
                    key={`${word.text}-${index}`}
                    className="absolute text-purple-600 hover:text-purple-700 transition-colors cursor-pointer"
                    style={{
                        fontSize: `${getFontSize(word.frequency)}rem`,
                        opacity: 0.7 + (word.frequency / maxFreq) * 0.3, // Scale opacity with frequency
                        left: `${positionsRef.current[index]?.x || 0}px`,
                        top: `${positionsRef.current[index]?.y || 0}px`,
                        transform: `rotate(${positionsRef.current[index]?.rotation || 0}deg)`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                        delay: index * 0.05
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onMouseEnter={(e) => handleWordHover(word, e.clientX, e.clientY)}
                    onMouseLeave={handleWordLeave}
                >
                    {word.text}
                </motion.span>
            ))}

            <AnimatePresence>
                {tooltip && (
                    <motion.div
                        className="fixed bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm pointer-events-none z-50"
                        style={{
                            left: tooltip.x + 10,
                            top: tooltip.y + 10,
                        }}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className="font-medium">{tooltip.text}</div>
                        <div className="text-purple-300">Frequency: {tooltip.frequency}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
} 