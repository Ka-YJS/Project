import React, { useState, useContext } from "react";
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
  const { user,setUser} = useContext(UserContext);

  //팝업열기
  const openPopup = (type) => {
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
      //기존닉네임 새닉네임 같은지 비교하는 if문
      if(user.userNickName !== userNickName){
        const userInfo = {
          userNickName: userNickName
        }
        //call메서드 사용해서 백엔드 요청
        const response = await call(`/travel/userNickNameEdit/${user.id}`,"PATCH",userInfo,user)        
        //response가 존재하면 user 업데이트 if문
        if(response){
          console.log("닉네임 변경 call 메서드 : " + response)
          setUser(prev =>(
            {...prev,userNickName:response.userNickName}
          ))
          alert("닉네임이 변경되었습니다.");
          setUserNickName("");
          closePopup();
        }else{
          alert("닉네임변경 실패.");
        }//response가 존재하면 user 업데이트 if문 종료
      } else {
        alert("기존 닉네임이랑 똑같습니다.");
      }//기존닉네임 새닉네임 같은지 비교하는 if문 종료
    } catch (error) {
      console.error('닉네임변경 실패:', error);
    }
  };//닉네임변경 버튼 종료


  //비밀번호변경 버튼
  const handleChangePassword = async () => {

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
        const response = await call(`/travel/userPasswordEdit/${user.id}`,"PATCH",userInfo,user)
        //response가 존재하는지 확인 if문
        if(response){
          console.log("비밀번호 변경 call 메서드 : " + response)
          alert("비밀번호가 변경되었습니다.");
          setUserPassword("")
          setNewPassword("")
          setNewPasswordConfirm("")
          closePopup();
        }else{
          console.log("비밀번호 변경 call 메서드 : " + response)
          alert("비밀번호가 틀렸습니다.");
        }//response가 존재하는지 확인 if문 종료
      } else {
        alert("새로운 비밀번호와 확인이 일치하지 않습니다.");
      }//새로운 비밀번호확인 if문 종료

    } catch (error) {
      console.error('비밀번호변경 실패:', error);
    }

  };//비밀번호변경 버튼 종료


  //숨겨놓은 fileInput 클릭버튼
  const handleButtonClick = () => {
    document.getElementById('fileInput').click();
  }

  //프로필이미지번경 버튼
  const handleProfileImageChange = async (e) => {

    const file = e.target.files[0];

    if (file) {
      // FormData 객체를 사용해 파일과 기타 데이터를 전송
      const formData = new FormData();
      formData.append('file', file);
      console.log(formData.get('file'))

      try {
        // 백엔드에 프로필 사진을 업로드
        const response = await axios.patch(`https://${config.IP_ADD}/travel/userProfileImageEdit/${user.id}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            'Authorization': `Bearer ${user.token}`
          },
        });

        if(response.data){
          console.log(response.data)
          //성공적으로 업로드되면 사용자 정보 업데이트
          setUser(prev=>({...prev,userProfileImage:response.data.userProfileImage}));
        }

      } catch (err) {
        console.error('파일 업로드 실패:', err);
      }    
    }
  };//프로필이미지번경 버튼


  //프로필이미지 삭제 버튼
  const handleProfileImageDelete = async () => {
    
    try {      
      //유저프로필이미지 있는지확인 있으면 true
      if(user.userProfileImage !== null){        

        const response = await axios.patch(`https://${config.IP_ADD}/travel/userProfileImageDelete/${user.id}`,null, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          },
        });

        if(response.data){
          console.log(response.data)
          console.log(response.data.userProfileImage)
          setUser(prev=>({...prev,userProfileImage:null}));
        }

      }else{
        alert("삭제할 프로필이미지가 없습니다.")
      }

    } catch (error) {
      console.error('프로필이미지 삭제 실패:', error);
    }

  }//프로필이미지 삭제 버튼


  //계정탈퇴 버튼
  const handleDeleteAccount = async() => {
    
    try {

      const userInfo = {
        userPassword: userPassword
      }
      //계정탈퇴 call메서드 사용해서 백엔드 요청
      const response = await call(`/travel/withdraw/${user.id}`,"DELETE",userInfo,user)
      //response가 존재하는지 확인 if문
      if(response){
        localStorage.clear(); //계정 탈퇴하면 로컬스토리지 전부지우기
        alert("계정이 탈퇴되었습니다.");
        navigate('/login');
      }else{
        alert("계정 탈퇴실패 비밀번호확인");
      }
      
    } catch (error) {
      console.error('계정탈퇴 실패:', error);
    }

  };//계정탈퇴 버튼 종료


  return (
    <div className="page_wrapper">
      <div className="wrapper">
        <div className="profile_wrapper ">
          <img
            className="profile_image"
            //                          D:\Aproject\Travel_2024\Spring\travel\uploads
            src={user.userProfileImage?`https://${config.IP_ADD}${user.userProfileImage}`: defaultImage}
            alt="profile"
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
            <button 
              style={{backgroundColor:"transparent"}} 
              type="button" 
              onClick={handleProfileImageDelete}
            >
            <FaRegTrashAlt />
            </button>
          </div>
        </div>

        <div className="personal_container">
          <div className="user-info">
            <div className="user-info-item">아이디 : {user.userId}</div>
            <div className="user-info-item">이름 : {user.userName}</div>
            <div className="user-info-item">닉네임 : {user.userNickName}</div>
          </div>

          <div className="button-container">
            <button className="custom-button" onClick={() => openPopup('nickname')}>닉네임 변경</button>
          </div>
          <div className="button-container">
            <button className="custom-button" onClick={() => openPopup('password')}>비밀번호 변경</button>
          </div>
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
            <div>
              <label>비밀번호</label>
              <Input
                type="password"
                value={userPassword}
                onChange={(e) => setUserPassword(e.target.value)}
              />
            </div>
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
