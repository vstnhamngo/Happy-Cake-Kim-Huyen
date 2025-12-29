import { useEffect, useState } from "react";
import "./styles.css";

interface CelebrationProps {
  show: boolean;
  name: string;
  onHide: () => void;
}

export const Celebration: React.FC<CelebrationProps> = ({
  show,
  name,
  onHide,
}) => {
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setFadeOut(false);

      // Auto hide after 8 seconds
      const hideTimer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          onHide();
        }, 1000);
      }, 8000);

      return () => clearTimeout(hideTimer);
    }
  }, [show, onHide]);

  if (!visible) return null;

  return (
    <div
      className={`celebration-container ${fadeOut ? "fade-out" : "fade-in"}`}
    >
      {/* Confetti rơi từ trên xuống */}
      <div className="confetti-container">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: [
                "#ff6b6b",
                "#feca57",
                "#48dbfb",
                "#ff9ff3",
                "#54a0ff",
                "#00d2d3",
                "#ff9f43",
                "#f0e4d0",
              ][Math.floor(Math.random() * 8)],
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              width: `${6 + Math.random() * 6}px`,
              height: `${6 + Math.random() * 6}px`,
            }}
          />
        ))}
      </div>

      {/* Thông báo chúc mừng - đơn giản, không có background */}
      <div className="celebration-message-box">
        <h1 className="celebration-title">Chúc Mừng Sinh Nhật</h1>
        <h2 className="celebration-name">{name}</h2>
        <p className="celebration-wish">
          Chúc em tuổi mới xinh đẹp hơn, thành công hơn
        </p>
        <div className="celebration-emoji">🎁 🎈 🎊 ✨</div>
      </div>
    </div>
  );
};
