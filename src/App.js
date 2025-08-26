import React, { useEffect, useMemo, useRef, useState } from "react";

export default function App() {
  // === Config ===
  const TOTAL_CATS = 14;
  const CARD_WIDTH_VW = 92;
  const LIKE_VIBRATE = 20;
  const DISLIKE_VIBRATE = 15;

  // Build a list of unique Cataas URLs
  const catImages = useMemo(
    () =>
      Array.from({ length: TOTAL_CATS }, (_, i) => {
        const seed = `${Date.now()}_${i}_${Math.random().toString(36).slice(2)}`;
        return `https://cataas.com/cat?random=${seed}`;
      }),
    []
  );

  // === State ===
  const [index, setIndex] = useState(() => {
    const saved = localStorage.getItem("ct_index");
    return saved ? Number(saved) : 0;
  });
  const [likedCats, setLikedCats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ct_liked") || "[]");
    } catch {
      return [];
    }
  });
  const [dislikedCats, setDislikedCats] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ct_disliked") || "[]");
    } catch {
      return [];
    }
  });

  // Single-step undo flag: becomes true after a swipe, and resets after one undo.
  const [canUndo, setCanUndo] = useState(false);

  // History stack to know what the last action was
  const historyRef = useRef([]);

  // Persist minimal progress
  useEffect(() => {
    localStorage.setItem("ct_index", String(index));
  }, [index]);
  useEffect(() => {
    localStorage.setItem("ct_liked", JSON.stringify(likedCats));
  }, [likedCats]);
  useEffect(() => {
    localStorage.setItem("ct_disliked", JSON.stringify(dislikedCats));
  }, [dislikedCats]);

  // Preload images for smoother transitions
  useEffect(() => {
    catImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [catImages]);

  // === Gesture state ===
  const startXRef = useRef(null);
  const deltaXRef = useRef(0);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [flyOutDir, setFlyOutDir] = useState(null);

  const currentSrc = catImages[index];
  const isDone = index >= catImages.length;

  // Haptics helper (mobile)
  const vibrate = (ms) => {
    if (window.navigator && "vibrate" in navigator) {
      try { navigator.vibrate(ms); } catch {}
    }
  };

  // Commit a swipe in a direction (right = like, left = dislike)
  const commitSwipe = (dir) => {
    if (isDone || isAnimatingOut) return;
    const src = currentSrc;
    if (!src) return;

    historyRef.current.push({ src, action: dir === "right" ? "like" : "dislike" });
    setCanUndo(true); // allow a single undo for this swipe

    if (dir === "right") {
      setLikedCats((p) => [...p, src]);
      vibrate(LIKE_VIBRATE);
    } else {
      setDislikedCats((p) => [...p, src]);
      vibrate(DISLIKE_VIBRATE);
    }

    setFlyOutDir(dir);
    setIsAnimatingOut(true);

    // Advance after the fly-out animation
    setTimeout(() => {
      setIndex((i) => i + 1);
      deltaXRef.current = 0;
      setIsAnimatingOut(false);
      setFlyOutDir(null);
    }, 220);
  };

  // Pointer handlers
  const handlePointerDown = (clientX) => {
    if (isDone || isAnimatingOut) return;
    startXRef.current = clientX;
    deltaXRef.current = 0;
  };

  const handlePointerMove = (clientX) => {
    if (startXRef.current == null || isDone || isAnimatingOut) return;
    deltaXRef.current = clientX - startXRef.current;
    forceUpdate((t) => t + 1); // force a repaint to reflect drag position
  };

  const SWIPE_THRESHOLD = 70; // px
  const handlePointerUp = (clientX) => {
    if (startXRef.current == null || isAnimatingOut) return;
    const diff = clientX - startXRef.current;
    if (diff > SWIPE_THRESHOLD) commitSwipe("right");
    else if (diff < -SWIPE_THRESHOLD) commitSwipe("left");
    else {
      // Not enough distance: snap back
      deltaXRef.current = 0;
      forceUpdate((t) => t + 1);
    }
    startXRef.current = null;
  };

  // State used only to re-render during drag
  const [, forceUpdate] = useState(0);

  // Keyboard shortcuts
  const onKeyDown = (e) => {
    if (isDone) return;
    if (e.key === "ArrowRight") commitSwipe("right");
    if (e.key === "ArrowLeft") commitSwipe("left");
  };

  // Single-step undo: only undo the very last swipe. Disable after one use.
  const undo = () => {
    if (!canUndo) return; // allow only one undo per swipe
    const last = historyRef.current.pop();
    if (!last) return;

    setIndex((i) => Math.max(0, i - 1));
    if (last.action === "like") {
      setLikedCats((arr) => arr.filter((s) => s !== last.src));
    } else {
      setDislikedCats((arr) => arr.filter((s) => s !== last.src));
    }

    setCanUndo(false); // consume the one-time undo
  };

  // Progress dots component
  const Progress = () => (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", margin: "8px 0 16px" }}>
      {catImages.map((_, i) => (
        <span
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: i < index ? "#7dd3fc" : i === index ? "#0ea5e9" : "#e5e7eb",
            boxShadow: i === index ? "0 0 0 3px rgba(14,165,233,0.15)" : "none",
            transition: "all .2s ease",
          }}
        />
      ))}
    </div>
  );

  // Top bar with title and undo
  const TopBar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 18 }}>🐾 Cat Tinder</div>
      <button
        onClick={undo}
        disabled={!canUndo}
        style={btnSecondary}
        aria-label="Undo last swipe"
        title={canUndo ? "Undo last swipe" : "You can undo once after a swipe"}
      >
        ↩️ Undo
      </button>
    </div>
  );

  // === Summary screen ===
  if (isDone) {
    return (
      <Shell>
        <TopBar />
        <div style={{ textAlign: "center" }}>
          <h2 style={{ margin: "4px 0 8px" }}>Summary 🐱</h2>
          <p style={{ margin: 0 }}>
            You liked <strong>{likedCats.length}</strong> cat{likedCats.length !== 1 ? "s" : ""} and disliked {dislikedCats.length}.
          </p>
        </div>

        {likedCats.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: 10,
              marginTop: 16,
            }}
          >
            {likedCats.map((src, i) => (
              <img
                key={i}
                src={src}
                alt="liked cat"
                loading="lazy"
                style={{
                  width: "100%",
                  height: 140,
                  objectFit: "cover",
                  borderRadius: 14,
                  boxShadow: "0 6px 16px rgba(0,0,0,.12)",
                  userSelect: "none",
                }}
                draggable={false}
              />
            ))}
          </div>
        ) : (
          <p style={{ marginTop: 16 }}>No liked cats this round. 😼</p>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
          <button
            onClick={() => {
              // Reset progress but keep the same cat set
              setIndex(0);
              setLikedCats([]);
              setDislikedCats([]);
              historyRef.current = [];
              setCanUndo(false);
            }}
            style={btnPrimary}
          >
            Start Over
          </button>
        </div>
      </Shell>
    );
  }

  // === Main swipe screen ===
  const dx = deltaXRef.current || 0;
  const rotation = Math.max(-15, Math.min(15, dx / 10));
  const opacityHint = Math.min(1, Math.abs(dx) / 90);

  // If currently animating out, compute a fly-out transform
  const flyOutTransform = flyOutDir
    ? `translate(${flyOutDir === "right" ? 120 : -120}vw, 0) rotate(${flyOutDir === "right" ? 20 : -20}deg)`
    : undefined;

  return (
    <Shell onKeyDown={onKeyDown}>
      <TopBar />
      <Progress />

      <div
        style={{
          position: "relative",
          width: `min(${CARD_WIDTH_VW}vw, 420px)`,
          height: "64vh",
          maxHeight: 560,
          margin: "0 auto",
        }}
      >
        {/* Swipe card */}
        <div
          role="img"
          aria-label="Cat photo"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 18,
            overflow: "hidden",
            boxShadow: "0 14px 34px rgba(0,0,0,.28)",
            background: "#f3f4f6",
            touchAction: "pan-y",
            userSelect: "none",
            transform: isAnimatingOut
              ? flyOutTransform
              : `translateX(${dx}px) rotate(${rotation}deg)`,
            transition: isAnimatingOut ? "transform .22s ease" : dx === 0 ? "transform .18s ease" : "none",
          }}
          onPointerDown={(e) => handlePointerDown(e.clientX)}
          onPointerMove={(e) => handlePointerMove(e.clientX)}
          onPointerUp={(e) => handlePointerUp(e.clientX)}
          onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
          onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
          onTouchEnd={(e) => handlePointerUp(e.changedTouches[0].clientX)}
        >
          <img
            key={currentSrc}
            src={currentSrc}
            alt="cat"
            loading="eager"
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            draggable={false}
          />

          {/* Like/Nope hints while dragging */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 16,
              left: 16,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(34,197,94,0.15)",
              color: "#16a34a",
              fontWeight: 700,
              transform: "rotate(-8deg)",
              opacity: dx > 0 ? opacityHint : 0,
              transition: "opacity .1s",
            }}
          >
            LIKE
          </div>
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              padding: "6px 10px",
              borderRadius: 999,
              background: "rgba(239,68,68,0.15)",
              color: "#dc2626",
              fontWeight: 700,
              transform: "rotate(8deg)",
              opacity: dx < 0 ? opacityHint : 0,
              transition: "opacity .1s",
            }}
          >
            NOPE
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 14 }}>
        <button style={btnGhost} onClick={() => commitSwipe("left")} aria-label="Dislike">
          👎 Dislike
        </button>
        <button style={btnPrimary} onClick={() => commitSwipe("right")} aria-label="Like">
          👍 Like
        </button>
      </div>

      <p style={{ color: "#6b7280", fontSize: 14, textAlign: "center", marginTop: 8 }}>
        Tip: swipe the card, or use ← / → keys
      </p>
    </Shell>
  );
}

function Shell({ children, onKeyDown }) {
  return (
    <div
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{
        minHeight: "100svh",
        WebkitTapHighlightColor: "transparent",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        maxWidth: 900,
        margin: "0 auto",
      }}
    >
      {children}
    </div>
  );
}

// Button styles
const btnBase = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #e5e7eb",
  cursor: "pointer",
  fontWeight: 600,
  boxShadow: "0 6px 14px rgba(0,0,0,.08)",
  background: "#fff",
};

const btnPrimary = {
  ...btnBase,
  background: "#0ea5e9",
  border: "1px solid #0284c7",
  color: "white",
};

const btnSecondary = {
  ...btnBase,
  background: "#f8fafc",
};

const btnGhost = {
  ...btnBase,
  background: "#ffffff",
};
``