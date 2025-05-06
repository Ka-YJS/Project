import React, { useState, useContext, useEffect } from "react";
import Modal from 'react-modal';
import { Input } from "@mui/material";
import { useNavigate } from 'react-router-dom';
import { UserContext } from "../context/UserContext";
import defaultImage from "../image/defaultImage.png";
import '../css/MyPage.css';
import { IoPencil } from "react-icons/io5";
import { FaRegTrashAlt } from "react-icons/fa";
import {call} from "../api/ApiService";
import axios from "axios";
import config from "../Apikey";

Modal.setAppElement('#root');

const PersonalInfo = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentPopup, setCurrentPopup] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [userNickName, setUserNickName] = useState("");
  const { user, setUser } = useContext(UserContext);
  const [isSocialLogin, setIsSocialLogin] = useState(false);

  // 컴포넌트 마운트 시 소셜 로그인 여부 확인
  useEffect(() => {
    if (user) {
      // authProvider가 있으면 소셜 로그인으로 판단
      const socialLoginCheck = user.authProvider === 'GOOGLE' || user.authProvider === 'KAKAO';
      setIsSocialLogin(socialLoginCheck);
    }
  }, [user]);

  // 사용자 ID 가져오기 (소셜/일반 로그인 모두 지원)
  const getUserId = () => {
    if (!user) return null;
    // 소셜 로그인 ID
    if (user.id) return user.id;
    // 일반 로그인 ID
    if (user.userid) return user.userid;
    return null;
  };
  
  // 사용자 아이디(이메일 또는 로그인ID) 가져오기
  const getUserLoginId = () => {
    if (!user) return "";
    // 소셜 로그인은 이메일 사용
    if (user.email) return user.email;
    // 일반 로그인은 userId 사용
    if (user.userId) return user.userId;
    return "";
  };
  
  // 사용자 이름 가져오기
  const getUserName = () => {
    if (!user) return "";
    // 소셜 로그인 이름
    if (user.name) return user.name;
    // 일반 로그인 이름
    if (user.userName) return user.userName;
    return "";
  };
  
  // 사용자 닉네임 가져오기
  const getUserNickName = () => {
    if (!user) return "";
    // 소셜 로그인 닉네임
    if (user.nickName) return user.nickName;
    // 일반 로그인 닉네임
    if (user.userNickName) return user.userNickName;
    return "";
  };

  // 프로필 이미지 URL 가져오기
  const getProfileImageUrl = () => {
    if (!user) return defaultImage;
    
    // 소셜 로그인 프로필 이미지 (외부 URL)
    if (user.picture) return user.picture;
    
    // 일반 로그인 프로필 이미지 (서버 저장)
    if (user.userProfileImage) return `http://${config.IP_ADD}${user.userProfileImage}`;
    
    return defaultImage;
  };

  //팝업열기
  const openPopup = (type) => {
    // 소셜 로그인 사용자는 비밀번호 변경 및 계정 탈퇴가 다르게 처리되어야 함
    if (isSocialLogin && (type === 'password')) {
      alert("소셜 로그인 사용자는 해당 서비스에서 비밀번호를 관리해야 합니다.");
      return;
    }

    setCurrentPopup(type);
    setIsOpen(true);
  }

  //팝업닫기
  const closePopup = () => {
    setUserNickName("");
    setUserPassword("");
    setNewPassword("");
    setNewPasswordConfirm("");
    setIsOpen(false);
  }

  //비밀번호 정규식
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return passwordRegex.test(password);
  };

  //닉네임변경 버튼
  const handleChangeNickname = async () => {
    try {
      const userId = getUserId();
      if (!userId) {
        alert("사용자 정보를 찾을 수 없습니다.");
        return;
      }

      // 기존 닉네임과 새 닉네임 비교
      const currentNickName = getUserNickName();
      if (currentNickName === userNickName) {
        alert("기존 닉네임이랑 똑같습니다.");
        return;
      }

      // 소셜 로그인과 일반 로그인 분기 처리
      if (isSocialLogin) {
        // 소셜 로그인 사용자 닉네임 변경 로직
        try {
          // 여기서는 백엔드에 맞는 API 호출 필요
          const response = await axios.patch(
            `http://${config.IP_ADD}/api/social/user/nickname`, 
            { 
              socialId: user.id,
              nickName: userNickName 
            }, 
            {
              headers: { 'Content-Type': 'application/json' },
              withCredentials: true
            }
          );
          
          if (response.data) {
            // Context와 localStorage 업데이트
            const updatedUser = { ...user, nickName: userNickName };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            alert("닉네임이 변경되었습니다.");
            setUserNickName("");
            closePopup();
          }
        } catch (error) {
          console.error('소셜 사용자 닉네임 변경 실패:', error);
          alert("닉네임 변경에 실패했습니다.");
        }
      } else {
        // 일반 로그인 사용자 닉네임 변경 로직 (기존 코드 유지)
        const userInfo = {
          userNickName: userNickName
        }
        const response = await call(`/travel/userNickNameEdit/${userId}`, "PATCH", userInfo, user);
        
        if (response) {
          setUser(prev => ({...prev, userNickName: response.userNickName}));
          alert("닉네임이 변경되었습니다.");
          setUserNickName("");
          closePopup();
        } else {
          alert("닉네임변경 실패.");
        }
      }
    } catch (error) {
      console.error('닉네임변경 실패:', error);
      alert("닉네임 변경 중 오류가 발생했습니다.");
    }
  };

  //비밀번호변경 버튼 (소셜 로그인은 사용하지 않음)
  const handleChangePassword = async () => {
    // 소셜 로그인 사용자는 함수 실행 중지
    if (isSocialLogin) {
      alert("소셜 로그인 사용자는 해당 서비스에서 비밀번호를 관리해야 합니다.");
      return;
    }

    try {
      //새로운 비밀번호확인 if문
      if (newPassword === newPasswordConfirm) {
        
        if (!validatePassword(newPassword)) {
          alert('비밀번호는 8자 이상이며, 특수문자를 포함해야 합니다.');
          return;
        }

        const userInfo = {
          userPassword: userPassword,
          newPassword: newPassword
        }
        //call메서드 사용해서 백엔드 요청
        const userId = getUserId();
        const response = await call(`/travel/userPasswordEdit/${userId}`, "PATCH", userInfo, user);
        //response가 존재하는지 확인 if문
        if(response){
          alert("비밀번호가 변경되었습니다.");
          setUserPassword("");
          setNewPassword("");
          setNewPasswordConfirm("");
          closePopup();
        } else {
          alert("비밀번호가 틀렸습니다.");
        }
      } else {
        alert("새로운 비밀번호와 확인이 일치하지 않습니다.");
      }

    } catch (error) {
      console.error('비밀번호변경 실패:', error);
    }
  };

  //숨겨놓은 fileInput 클릭버튼
  const handleButtonClick = () => {
    document.getElementById('fileInput').click();
  }

  //프로필이미지변경 버튼
  const handleProfileImageChange = async (e) => {
    const file = e.target.files[0];

    if (file) {
      // FormData 객체를 사용해 파일과 기타 데이터를 전송
      const formData = new FormData();
      formData.append('file', file);

      try {
        const userId = getUserId();
        
        if (isSocialLogin) {
          // 소셜 로그인 사용자 프로필 이미지 변경 로직
          formData.append('socialId', user.id);
          formData.append('authProvider', user.authProvider);
          
          const response = await axios.patch(
            `http://${config.IP_ADD}/api/social/user/profile-image`, 
            formData, 
            {
              headers: { "Content-Type": "multipart/form-data" },
              withCredentials: true
            }
          );
          
          if (response.data) {
            // 소셜 사용자 정보 업데이트 (picture 필드)
            const updatedUser = { ...user, picture: response.data.picture };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          // 일반 로그인 사용자 프로필 이미지 변경 (기존 코드)
          const response = await axios.patch(
            `http://${config.IP_ADD}/travel/userProfileImageEdit/${userId}`, 
            formData, 
            {
              headers: {
                "Content-Type": "multipart/form-data",
                'Authorization': `Bearer ${user.token}`
              },
            }
          );

          if (response.data) {
            // 일반 사용자 정보 업데이트 (userProfileImage 필드)
            setUser(prev => ({...prev, userProfileImage: response.data.userProfileImage}));
          }
        }
      } catch (err) {
        console.error('파일 업로드 실패:', err);
      }    
    }
  };

  //프로필이미지 삭제 버튼
  const handleProfileImageDelete = async () => {
    try {
      const userId = getUserId();
      
      if (isSocialLogin) {
        // 소셜 로그인 사용자는 기본 이미지 사용 알림
        alert("소셜 로그인 사용자는 프로필 이미지를 삭제할 수 없습니다.");
        return;
      } else {
        // 일반 로그인 사용자 프로필 이미지 삭제 로직
        if (user.userProfileImage !== null) {
          const response = await axios.patch(
            `http://${config.IP_ADD}/travel/userProfileImageDelete/${userId}`,
            null, 
            {
              headers: { 'Authorization': `Bearer ${user.token}` },
            }
          );

        } else {
          alert("삭제할 프로필이미지가 없습니다.");
        }
      }
    } catch (error) {
      console.error('프로필이미지 삭제 실패:', error);
    }
  };

  //계정탈퇴 버튼
  const handleDeleteAccount = async() => {
    try {
      const userId = getUserId();
      
      if (isSocialLogin) {
        // 소셜 로그인 사용자 계정 탈퇴 로직
        try {
          const response = await axios.delete(
            `http://${config.IP_ADD}/api/social/user/${userId}`, 
            {
              data: { authProvider: user.authProvider },
              withCredentials: true
            }
          );
          
          if (response.data) {
            localStorage.clear();
            alert("계정이 탈퇴되었습니다.");
            navigate('/login');
          }
        } catch (error) {
          console.error('소셜 계정 탈퇴 실패:', error);
          alert("계정 탈퇴에 실패했습니다.");
        }
      } else {
        // 일반 로그인 사용자 계정 탈퇴 로직 (기존 코드)
        const userInfo = {
          userPassword: userPassword
        }
        const response = await call(`/travel/withdraw/${userId}`, "DELETE", userInfo, user);
        
        if (response) {
          localStorage.clear();
          alert("계정이 탈퇴되었습니다.");
          navigate('/login');
        } else {
          alert("계정 탈퇴실패 비밀번호확인");
        }
      }
    } catch (error) {
      console.error('계정탈퇴 실패:', error);
    }
  };

  return (
    <div className="page_wrapper">
      <div className="wrapper">
        <div className="profile_wrapper ">
          <img
            className="profile_image"
            src={getProfileImageUrl()}
            alt="profile"
            onError={(e) => {
              e.target.src = defaultImage;
              e.target.onerror = null; // 무한 루프 방지
            }}
          />
          <div style={{display:"flex" }}>
            <div>
              <input
                type="file"
                id="fileInput"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleProfileImageChange}
              />
              <button 
                style={{backgroundColor:"transparent"}} 
                type="button" 
                onClick={handleButtonClick}
              >
                <IoPencil />
              </button>
            </div>
            {!isSocialLogin && (
              <button 
                style={{backgroundColor:"transparent"}} 
                type="button" 
                onClick={handleProfileImageDelete}
              >
                <FaRegTrashAlt />
              </button>
            )}
          </div>
        </div>

        <div className="personal_container">
          <div className="user-info">
            <div className="user-info-item">아이디: {getUserLoginId()}</div>
            <div className="user-info-item">이름: {getUserName()}</div>
            <div className="user-info-item">닉네임: {getUserNickName()}</div>
            {isSocialLogin && (
              <div className="user-info-item">로그인 제공자: {user.authProvider}</div>
            )}
          </div>

          <div className="button-container">
            <button className="custom-button" onClick={() => openPopup('nickname')}>닉네임 변경</button>
          </div>
          {!isSocialLogin && (
            <div className="button-container">
              <button className="custom-button" onClick={() => openPopup('password')}>비밀번호 변경</button>
            </div>
          )}
          <div className="button-container">
            <button className="delete-button" onClick={() => openPopup('delete')}>계정탈퇴</button>
          </div>
        </div>
      </div>

      {/* Modal Component */}
      <Modal
        isOpen={isOpen}
        onRequestClose={closePopup}
        contentLabel="Personal Information Popup"
        className="custom_modal"
        overlayClassName="overlay"
      >
        {/* 닉네임변경 팝업창 */}
        {currentPopup === 'nickname' && (
          <div className="popup_wrapper">
            <h2>닉네임 변경</h2>
            <div>
              <Input
                value={userNickName}
                onChange={(e) => setUserNickName(e.target.value)}
                placeholder="새 닉네임"
              />
            </div>
            <button onClick={handleChangeNickname} style={{margin:"10px 5px 0 0"}}>변경</button>
            <button onClick={closePopup} >취소</button>
          </div>
        )}

        {/* 비밀번호변경 팝업창 */}
        {currentPopup === 'password' && (
          <div className="popup_wrapper">
            <h2>비밀번호 변경</h2>
            <div>
              <label>비밀번호</label>
              <Input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />
            </div>
            <div>
              <label>새 비밀번호</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label>새 비밀번호 확인</label>
              <Input
                type="password"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
              />
            </div>
            <button onClick={handleChangePassword} style={{margin:"10px 5px 0 0"}}>변경</button>
            <button onClick={closePopup}>취소</button>
          </div>
        )}

        {/* 계정탈퇴 팝업창 */}
        {currentPopup === 'delete' && (
          <div className="popup_wrapper">
            <h2 style={{color:"#ff4d4f"}}>계정탈퇴 하시겠습니까?</h2>
            {!isSocialLogin && (
              <div>
                <label>비밀번호</label>
                <Input
                  type="password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                />
              </div>
            )}
            <button 
              style={{margin:"10px 5px 0 0",color:"#ff4d4f"}}
              onClick={handleDeleteAccount} 
            >
              탈퇴
            </button>
            <button onClick={closePopup}>취소</button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PersonalInfo;