import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { UserContext } from "../context/UserContext";
import TopIcon from "../TopIcon/TopIcon";
import main1 from "../image/mainImage/main1.jpg"
import main2 from "../image/mainImage/main2.jpg"
import main3 from "../image/mainImage/main3.jpg"
import main4 from "../image/mainImage/main4.jpg"
import main5 from "../image/mainImage/main5.jpg"
import main6 from "../image/mainImage/main6.jpg"
import main7 from "../image/mainImage/main7.jpg"
import main8 from "../image/mainImage/main8.jpg"
import main9 from "../image/mainImage/main9.jpg"
import main10 from "../image/mainImage/main10.jpg"

function MainScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // user가 없는 경우 로그인 페이지로 리다이렉트
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  // 사용자 이름을 가져오는 함수
  const getUserName = () => {
    if (!user) return "홍길동";
    // 일반 로그인의 경우 userNickName 사용
    if (user.userNickName) return user.userNickName;
    // 소셜 로그인의 경우 name 사용
    if (user.name) return user.name;
    return "홍길동";
  };

  // 이미지 파일 경로 배열
  const images = [
    main1, main2, main3, main4, main5, main6, main7, main8, main9, main10
  ];

  const imageCount = images.length;

  // 이미지 슬라이드 효과
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % imageCount);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [imageCount]);

  // 기록 시작하기 버튼 클릭 시 실행되는 함수
  const handleStartRecord = () => {
    if (!user?.id) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }
    navigate("/map");
  };

  // 내 게시물 보기 버튼 클릭 시 실행되는 함수
  const handleViewPosts = () => {
    if (!user?.id) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }
    navigate(`/mypost/${user.id}`);
  };

 return (
   <div>
     <TopIcon />
     <div className="main-screen">
       <div className="content">
         <h1>{getUserName()}님 환영합니다.</h1>

         {/* 이미지 슬라이드 */}
         <div className="image-slider">
           {images.map((src, index) => (
             <img
               key={index}
               src={src}
               alt={`슬라이드 이미지 ${index + 1}`}
               className="slider-image"
               style={{
                 opacity: index === currentIndex ? 1 : 0,
                 transition: "opacity 1s ease-out",
                 position: "absolute",
                 width: "100%",
                 height: "100vh",
               }}
             />
           ))}
         </div>

         <div className="button-row">
           <button className="main-button" onClick={handleStartRecord}>
             기록 시작하기
           </button>
           <button className="main-button" onClick={handleViewPosts}>
             내 기록 보기
           </button>
         </div>
       </div>
     </div>
   </div>
 );
}

export default MainScreen;