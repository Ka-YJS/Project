import React, { useState, useContext, useEffect } from "react";
import { SlHome } from "react-icons/sl";
import { LuNotebook } from "react-icons/lu";
import { MdNoteAlt } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../context/UserContext"; // UserContext import
import { Collapse } from "react-bootstrap";
import PersonalInfo from "../pages/PersonalInfo"; // PersonalInfo 컴포넌트 import
import "../css/MyPage.css";
import "bootstrap/dist/css/bootstrap.min.css";
import defaultImage from '../image/defaultImage.png';
import Logo from "../pages/Logo";
import config from "../Apikey";

const TopIcon = ({text}) => {
  const [isProfileDropdownVisible, setIsProfileDropdownVisible] = useState(false);
  const [isMyInfoVisible, setIsMyInfoVisible] = useState(false); // Collapse 상태 관리
  const { user, setUser } = useContext(UserContext); // user 정보와 setter 가져오기
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 localStorage에서 사용자 정보 확인
  useEffect(() => {
    // localStorage에서 사용자 정보 확인
    const storedUser = localStorage.getItem('user');
    
    if (storedUser && (!user || Object.keys(user).length === 0)) {
      // Context에 사용자 정보가 없을 경우 localStorage에서 복원
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        console.log("사용자 정보 복원:", parsedUser);
      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
      }
    }
  }, []);

  const iconComponents = [
    { id: "home", component: <SlHome size={23} />, route: "/main", label: "홈"},
    { id: "map", component: <MdNoteAlt size={23} />, route: "/map",label: "기록하기" },
    { id: "post", component: <LuNotebook  size={25} />, route: "/post",label: "기록일지" },
  ];

  // 사용자 ID 가져오기 (소셜/일반 로그인 모두 지원)
  const getUserId = () => {
    if (!user) return null;
    // 소셜 로그인 ID
    if (user.id) return user.id;
    // 일반 로그인 ID
    if (user.userid) return user.userid;
    return null;
  };
  
  // 사용자 닉네임 가져오기 (소셜/일반 로그인 모두 지원)
  const getUserNickName = () => {
    if (!user) return "게스트";
    // 소셜 로그인 닉네임
    if (user.nickName) return user.nickName;
    if (user.name) return user.name;
    // 일반 로그인 닉네임
    if (user.userNickName) return user.userNickName;
    if (user.username) return user.username;
    return "게스트";
  };

  // 프로필 이미지 URL 가져오기 (소셜/일반 로그인 모두 지원)
  const getProfileImageUrl = () => {
    if (!user) return defaultImage;
    
    // 소셜 로그인 프로필 이미지 (외부 URL)
    if (user.picture) return user.picture;
    
    // 일반 로그인 프로필 이미지 (서버 저장)
    if (user.userProfileImage) return `http://${config.IP_ADD}${user.userProfileImage}`;
    
    return defaultImage;
  };

  // 로그인 제공자 가져오기 (GOOGLE, KAKAO, 또는 일반)
  const getAuthProvider = () => {
    if (!user) return null;
    if (user.authProvider) return user.authProvider;
    return "일반";
  };

  // 로그아웃 버튼
const handleLogout = () => {
  try {
    // 프로필 드롭다운과 내 정보 상태 초기화
    setIsProfileDropdownVisible(false);
    setIsMyInfoVisible(false);
    
    // 소셜 로그인인 경우 추가 로그아웃 처리
    const authProvider = getAuthProvider();
    
    if (authProvider === 'KAKAO' && window.Kakao?.Auth) {
      try {
        if (window.Kakao.Auth.getAccessToken()) {
          window.Kakao.Auth.logout(() => {
            console.log('카카오 로그아웃 완료');
          });
        }
      } catch (error) {
        console.error('카카오 로그아웃 중 오류:', error);
        // 카카오 로그아웃 실패해도 계속 진행
      }
    } else if (authProvider === 'GOOGLE') {
      // 구글 로그아웃은 특별한 처리 없이 토큰 제거만으로 가능
      console.log('구글 로그아웃 완료');
    }
    
    // 공통 로그아웃 처리
    localStorage.clear();
    
    // UserContext 초기화 (비동기 처리를 위해 setTimeout 사용)
    setTimeout(() => {
      setUser(null);
      console.log("로그아웃 완료");
      alert("로그아웃 되었습니다.");
      navigate('/login');
    }, 0);
  } catch (error) {
    console.error('로그아웃 처리 중 오류 발생:', error);
    alert("로그아웃 중 오류가 발생했습니다. 페이지를 새로고침 해주세요.");
    // 오류 발생해도 로그인 페이지로 이동
    navigate('/login');
  }
};

  return (
    <header
      className="home-header"
      style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        height:"90px",
        width: "100%",  
      }}
    >
      <div>
        <Logo/>
      </div>
      <div
        style={{
          fontSize: "50px", // 글자 크기 설정
          fontWeight: "bold", // 두껍게
          position: "absolute", // 절대 위치 설정
          top: "50%", // 수직 가운데
          left: "50%", // 수평 가운데
          transform: "translate(-50%, -50%)", // 실제 가운데로 맞추기 위해 이동
          color: "transparent", // 기본 색상을 투명으로 설정
          backgroundImage: "linear-gradient(90deg, #d18a38,rgb(248, 185, 112))", // 그라데이션 색상
          WebkitBackgroundClip: "text", // 텍스트에만 배경색 적용
          backgroundClip: "text", // 텍스트에만 배경색 적용
          textShadow: "2px 2px 5px rgba(0, 0, 0, 0.3)", // 텍스트 그림자
          textAlign: "center", // 가운데 정렬
        }}
      >
        {text}
      </div>
      {/* 아이콘 영역 */}
      <div
        className="icon-container"
        style={{  display: "flex", alignItems: "center", gap: "15px", position: "relative" }}
      >
        {iconComponents.map((icon) => (
          <div
            key={icon.id}
            className="icon"
            style={{
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              position: "relative",
            }}
            onClick={() => navigate(icon.route)}
          >
            {icon.component}
            {/* 텍스트 부분 */}
            <span className="tooltip" style={{ fontSize: "13px", whiteSpace: 'nowrap' }}>
              {icon.label}
            </span>
          </div>
        ))}
      </div>

      {/* 프로필 영역 */}
      <div className="profile-container" style={{ position: "relative"}}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "20px",
            marginRight:"20px",
            width: "100px", // 고정 너비 설정
          }}
        >
          <img
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              cursor: "pointer"
            }}
            src={getProfileImageUrl()}
            onError={(e) => {
              e.target.src = defaultImage;
              e.target.onerror = null; // 무한 루프 방지
            }}
            alt={`${getUserNickName()} 프로필`}
            onClick={() => {
              if(isProfileDropdownVisible){
                setIsMyInfoVisible(false)
              }
              setIsProfileDropdownVisible(!isProfileDropdownVisible)
            }}
          />
          <div
            style={{
              width: "100px", // 컨테이너 너비 고정
              overflow: "hidden", // 넘치는 텍스트 숨기기
              whiteSpace: "nowrap", // 텍스트를 한 줄로 유지
              position: "relative", // 내부 요소에 대한 위치 기준
            }}
          >
            <p
              style={{
                display: "inline-block", // 텍스트가 슬라이드될 수 있도록 인라인 블록 설정
                animation: "slide 15s linear infinite", // 슬라이드 애니메이션
                fontSize:"20px",
                color:"#d18a38"
              }}
              className="sliding-text"
            >
              시골쥐 {getUserNickName()}님
            </p>
          </div>
        </div>
        {isProfileDropdownVisible && (
          <div
            className="profile_button"
            style={{
              width:isMyInfoVisible?"400px":"200px",
              position: "absolute",
              top: "120px",
              right: "0",
              backgroundColor: "#fff",
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              zIndex: 10,
            }}
          >
            <button
              style={{
                margin: "5px",
                padding: "10px",
                backgroundColor: "#008cba",
                color: "white",
                border: "none",
                borderRadius: "5px",
              }}
              onClick={() =>setIsMyInfoVisible(!isMyInfoVisible)}
            >
              내 정보
            </button>
            <Collapse in={isMyInfoVisible}>
              <div style={{ height: 'auto' }}>
                <PersonalInfo /> {/* PersonalInfo 컴포넌트를 보이도록 렌더링 */}
              </div>
            </Collapse>
            <button
              style={{
                margin: "5px",
                padding: "10px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "5px",
              }}
              onClick={() => {
                navigate(`/mypost/${getUserId()}`);
                setIsProfileDropdownVisible(!isProfileDropdownVisible)
              }}
            >
              내 기록보기
            </button>
            <button
              style={{
                margin: "5px",
                padding: "10px",
                backgroundColor: "rgb(212, 35, 35)",
                color: "white",
                border: "none",
                borderRadius: "5px",
              }}
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopIcon;