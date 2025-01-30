import React from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from "../image/back1.jpg"
import Logo from "./Logo";

function HomeScreen() {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate("/Login");
  };

  return (
    <div
      style={{
        position: "relative",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      {/* 로고 */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Logo /> {/* 로고 컴포넌트 호출 */}
      </div>

      {/* 시골쥐의 여행하쥐 텍스트 */}
      <div
        style={{
          fontSize: "36px",
          fontWeight: "bold",
          marginBottom: "20px",
          textAlign: "center",
          color: "white", // 흰색 텍스트
          textShadow: `
            0 0 10px rgba(240, 175, 91, 0.8), 
            0 0 20px rgba(223, 168, 50, 0.6),
            0 0 30px rgba(224, 117, 55, 0.4)
          `, // 광택 효과
          animation: "pulse 2s infinite", // 빛나는 애니메이션
        }}
      >
        시골쥐의 어디가쥐
      </div>

      {/* 버튼 */}
      <button
        onClick={handleStart}
        style={{
          padding: "20px 40px",
          fontSize: "24px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontWeight: "bold",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = "#f39c12";
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = "#4CAF50";
        }}
      >
        여행 시작
      </button>

      {/* 애니메이션 스타일 */}
      <style>
        {`
          @keyframes pulse {
            0% {
              text-shadow: 
                0 0 10px rgba(255, 255, 255, 0.8),
                0 0 20px rgba(255, 255, 255, 0.6),
                0 0 30px rgba(255, 255, 255, 0.4);
            }
            50% {
              text-shadow: 
                0 0 15px rgba(255, 255, 255, 1),
                0 0 25px rgba(255, 255, 255, 0.8),
                0 0 40px rgba(255, 255, 255, 0.6);
            }
            100% {
              text-shadow: 
                0 0 10px rgba(19, 2, 2, 0.8),
                0 0 20px rgba(24, 3, 3, 0.6),
                0 0 30px rgba(22, 1, 1, 0.4);
            }
          }
        `}
      </style>
    </div>
  );
}

export default HomeScreen;