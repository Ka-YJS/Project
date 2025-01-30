import React, { useState, useContext,useEffect } from "react";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import {call} from "../api/ApiService"
import axios from "axios";
import "../css/Strat.css";
import TopIcon from "../TopIcon/TopIcon";
import config from "../Apikey";
import backgroundImage from "../image/back3.png"

function Signup() {
  //user정보 useContext
  const { user,googleUser,setGoogleUser } = useContext(UserContext);
  //userId 저장 useState
  const [userId, setUserId] = useState("");
  //id중복체크 useState
  const [isIdChecked, setIsIdChecked] = useState(false);
  //userPassword 저장 useState
  const [userPassword, setUserPassword] = useState("");
  //userPassword 확인 저장 useState
  const [userPasswordConfirm, setUserPasswordConfirm] = useState("");
  //passwordError 저장 useState
  const [passwordError, setPasswordError] = useState("");
  //userName 저장 useState
  const [userName, setUserName] = useState("");
  //userNickName 저장 useState
  const [userNickName, setUserNickName] = useState("");
  //userPhoneNumber 저장 useState
  const [userPhoneNumber, setUserPhoneNumber] = useState("");
  //emailError 상태 저장 useState
  const [emailError, setEmailError] = useState(false);
  //email 인증상태 저장 useState
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  //email 인증코드 저장 useState
  const [authCode, setAuthCode] = useState("");
  //email 인증코드error 저장 useState
  const [authCodeError, setAuthCodeError] = useState("");
  //email 인증코드 발송 상태 저장 useState
  const [isAuthCodeSent, setIsAuthCodeSent] = useState(false);
  //loading 상태 저장 useState
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumberError,setPhoneNumberError] = useState("");

  const navigate = useNavigate();

  useEffect(()=>{
    if(googleUser && (!Array.isArray(googleUser) || googleUser.length > 0)){
      setUserId(googleUser.userId)
      setUserName(googleUser.userName)
      setUserNickName(googleUser.userName)
    }
  },[googleUser])

  useEffect(()=>{
    if(googleUser.userId !==userId){
      setIsEmailVerified(false)
    }else{
      setIsEmailVerified(true)
    }
  },[userId,googleUser.userId])

  //비밀번호 정규식
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return passwordRegex.test(password);
  };

  //이메일 정규식
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  //전화번호 정규식
  const validataeUserPhoneNumber = (userPhoneNumber) =>{
    const userPhoneNumberRegex = /^01\d{9}$/;
    return userPhoneNumberRegex.test(userPhoneNumber);
  }

  //회원가입 버튼
  const handleSubmit = async (event) => {
    event.preventDefault();

    // 이메일 형식 검증
    if (!validateEmail(userId)) {
      alert("이메일 형식이 올바르지 않습니다.");
      return;
    }
    // 이메일 인증 확인
    // if (!isEmailVerified) {
    //   alert("이메일 인증을 완료해주세요.");
    //   return;
    // }

    // 비밀번호 형식 검증
    if (!validatePassword(userPassword)) {
      alert("비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.");
      return;
    }
    // 전화번호 정규식 검증
    
    if (!validataeUserPhoneNumber(userPhoneNumber)) {
      alert("전화번호는 - 들어가지않은 11자리 숫자로 이루어져야 됩니다..");
      return;
    }
    
    // 비밀번호 확인 일치 여부
    if (userPassword !== userPasswordConfirm) {
      alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    // 아이디 중복 체크 확인
    if (!isIdChecked) {
      alert("아이디 중복체크를 해주세요.");
      return;
    }
    const userInfo = {
      userId: userId,
      userName: userName,
      userNickName: userNickName,
      userPhoneNumber:userPhoneNumber,
      userPassword: userPassword,
    };
    //회원가입 call 메서드
    await call("/travel/signup","POST",userInfo,user)
      .then((response)=>{
        if(response){
          console.log("회원가입 call메서드 response : " + response)
          alert("회원가입이 완료되었습니다.")
          navigate("/Login");
        }
      })
  };//회원가입 버튼


  //userId 중복체크
  const handleUserIdCheck = async() => {
    //userId 입력란이 비어있을때
    if (!userId) {
      alert("아이디를 입력하세요.");
      return;
    }

    const userIdCheck = {userId: userId};

    // userId 중복확인 call 메서드
    await call("/travel/userIdCheck","POST",userIdCheck,user)
      .then((response)=>{
        if(response){
          alert("사용 가능한 아이디입니다.")
          setIsIdChecked(true);
        }else{
          alert("이미 사용 중인 아이디입니다.")
          setIsIdChecked(false);
        }
      })
  };//userId 중복체크

  const handleEmailValidation = (value) => {
    setUserId(value);
    setIsIdChecked(false);
    setEmailError(!validateEmail(value)); // 이메일 형식 검증
  };

  const handleEmailVerification = () => {
    if (emailError || !userId) {
      alert("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    // 이메일 인증 코드 발송 전에 로딩 상태로 설정
    setIsLoading(true);

    // 이메일 인증 코드 발송
    axios.get(`https://${config.IP_ADD}/travel/email/auth?address=${userId}`)
      .then((response) => {
        setIsLoading(false); // 로딩 상태 해제
        if (response.data.success) {
          alert("이메일 인증 코드가 발송되었습니다. 인증 코드를 입력하세요.");
          setIsAuthCodeSent(true); // 인증 코드 입력창 활성화
        } else {
          alert("이메일 인증 코드 발송에 실패했습니다.");
        }
      })
      .catch((error) => {
        setIsLoading(false); // 로딩 상태 해제
        console.error("이메일 인증 코드 발송 실패:", error);
        alert("이메일 인증 코드 발송 중 오류가 발생했습니다.");
      });
  };

  //이메일 인증코드 체크
  const handleAuthCodeChange = (e) => {
    setAuthCode(e.target.value);
    setAuthCodeError(""); // 오류 초기화
  };

  //이메일 인증코드 확인버튼
  const handleAuthCodeVerification = () => {
    if (!authCode) {
      setAuthCodeError("인증 코드를 입력해주세요.");
      return;
    }

    // 인증 코드 검증
    axios.post(`https://${config.IP_ADD}/travel/email/auth?address=${userId}&authCode=${authCode}`)
      .then((response) => {
        const { success } = response.data;
        if (success) {
          setIsEmailVerified(true);
          alert("이메일 인증이 완료되었습니다.");
        } else {
          setAuthCodeError("인증 코드가 일치하지 않습니다.");
        }
      })
      .catch((error) => {
        console.error("인증 코드 검증 실패:", error);
        setAuthCodeError("인증 코드 검증 중 오류가 발생했습니다.");
      });

  };//이메일 인증코드 확인버튼
  

  //비밀번호 입력및 정규식확인
  const handleUserPassword = (e) => {
    const password = e.target.value;
    setUserPassword(password);

    if (!validatePassword(password)) {
      setPasswordError("비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.");
    } else {
      setPasswordError("");
    }
    if(!password){
      setPasswordError("");
    }
  };

  //전화번호 입력및 정규식확인
  const handleUserPhoneNumber = (e) => {
    const phoneNumber = e.target.value;
    setUserPhoneNumber(phoneNumber);

    if (!validataeUserPhoneNumber(phoneNumber)) {
      setPhoneNumberError("전화번호는 - 들어가지않은 11자리 숫자로 이루어져야 됩니다..");
    } else {
      setPhoneNumberError("");
    }
    if(!phoneNumber){
      setPhoneNumberError("");
    }
  };

  return (
    <div>
      <TopIcon />
    <div
  className="fullscreen-background"
  style={{ backgroundImage: `url(${backgroundImage})` }}
> 
    <div className="overlay-text">
      시골쥐의 어디가쥐</div>
      <div 
        className="container"
        style={{height:"100vh"}}
      >
        <main>
          <form className="form" onSubmit={handleSubmit}>
            <h3>::: 회원가입 :::</h3>

            {/* 이메일 입력 필드 */}
            <div className="form-group">
              <label htmlFor="userId">이메일 (아이디)</label>
              <input
                id="userId"
                name="userId"
                value={userId}
                placeholder="example@email.com"
                onChange={(e) => handleEmailValidation(e.target.value)}
              />
              {emailError && <span className="error-message">이메일 형식이 올바르지 않습니다.</span>}
            </div>

            {/* 버튼 그룹 */}
            <div className="buttons-container">
              <input
                type="button"
                value="중복체크"
                className="button-check"
                onClick={handleUserIdCheck}
              />
              <input
                type="button"
                value={isLoading ? "발송 중..." : "인증번호 발송"}
                className="button-verify"
                onClick={handleEmailVerification}
                disabled={isLoading || !userId || emailError || isEmailVerified}
              />
            </div>

            {/* 인증 코드 입력 필드 */}
            {isAuthCodeSent && (
              <div className="form-group">
                <label htmlFor="authCode">인증 코드</label>
                <input
                  id="authCode"
                  name="authCode"
                  value={authCode}
                  onChange={handleAuthCodeChange}
                  placeholder="인증 코드를 입력하세요"
                />
                {authCodeError && <span className="error-message">{authCodeError}</span>}
                <div className="auth-code-button">
                  <input
                    type="button"
                    value="인증 코드 확인"
                    onClick={handleAuthCodeVerification}
                  />
                </div>
              </div>
            )}

            {/* 이름 입력 필드 */}
            <div className="form-group">
              <label htmlFor="userName">이름</label>
              <input
                id="userName"
                name="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Name"
              />
            </div>

            {/* 닉네임 입력 필드 */}
            <div className="form-group">
              <label htmlFor="userNickName">닉네임</label>
              <input
                id="userNickName"
                name="userNickName"
                value={userNickName}
                onChange={(e) => setUserNickName(e.target.value)}
                placeholder="NickName"
              />
            </div>
            
            {/* 전화번호 입력 필드 */}
            <div className="form-group">
              <label htmlFor="userNickName">전화번호</label>
              <input
                id="user"
                name="userPhoneNumber"
                value={userPhoneNumber}
                onChange={handleUserPhoneNumber}
                placeholder=" - 빼고 숫자만 입력하세요"
              />
              {phoneNumberError && <span className="error-message">{phoneNumberError}</span>}
            </div>

            {/* 비밀번호 입력 필드 */}
            <div className="form-group">
              <label htmlFor="userPassword">비밀번호</label>
              <input
                id="userPassword"
                name="userPassword"
                type="password"
                value={userPassword}
                onChange={handleUserPassword}
                placeholder="Password"
              />
              {passwordError && <span className="error-message">{passwordError}</span>}
            </div>

            {/* 비밀번호 확인 필드 */}
            <div className="form-group">
              <label htmlFor="userPasswordConfirm">비밀번호 확인</label>
              <input
                id="userPasswordConfirm"
                name="userPasswordConfirm"
                type="password"
                value={userPasswordConfirm}
                onChange={(e) => setUserPasswordConfirm(e.target.value)}
                placeholder="PasswordConfirm"
              />
            </div>

            {/* 제출 및 취소 버튼 */}
            <div className="submit-container">
              <input type="submit" value="가입" className="submit" />
              <input
                type="button"
                value="취소"
                className="cancel"
                onClick={() => {
                  navigate("/login")
                  setGoogleUser({});
                }}
              />
            </div>
          </form>

          {/* 큰 로고 */}
        </main>
      </div>
     </div> 
     </div>
  );
}

export default Signup;