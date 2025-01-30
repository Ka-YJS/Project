import React from "react";
import logo4 from '../image/logo4.png';
import { Margin } from "@mui/icons-material";
import zIndex from "@mui/material/styles/zIndex";
import { BiBorderRadius } from "react-icons/bi";

const Logo = () => {
  return (
    <header style={styles.header}>
      {/* 로고 영역 */}
      <div style={styles.logoContainer}>
        <img 
          src={logo4} 
          alt="Logo" 
          style={styles.logoImage} 
        />
      </div>
    </header>
  );
};

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between", // 로고와 TopIcon을 양쪽으로 정렬
    alignItems: "center",           // 세로 중앙 정렬
    padding: "10px 20px",           // 헤더 안쪽 여백
  },
  logoContainer: {
    display: "flex",
    alignItems: "center",           // 로고를 세로 중앙 정렬
  },
  logoImage: {
    width: "100px",                 // 로고 크기 조정
    height: "auto",                 // 비율 유지
    borderRadius: "50px",
    zIndex: 10, /* 높은 값으로 설정해 이미지를 제일 위로 */
    margin:"10px"
  },
  topIconContainer: {
    display: "flex",
    alignItems: "center",           // TopIcon을 세로 중앙 정렬
  },
};

export default Logo;
