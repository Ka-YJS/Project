import React, { useState } from "react";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import "../css/Strat.css";
import TopIcon from "../TopIcon/TopIcon";
import {call} from "../api/ApiService";
import backgroundImage from "../image/back3.png"
import config from "../Apikey";
import axios from "axios";
import OAuthLogIn from "./OAuthLogIn";

const Login = () => {
  const { user,setUser } = useContext(UserContext); // `user` 배열로부터 사용자 정보를 가져옴
  const [loginId, setLoginId] = useState(""); // 입력받은 ID 저장 useState
  const [loginPassword, setLoginPassword] = useState(""); // 입력받은 비밀번호 상태 useState
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [isFindUserId,setIsFindUserId] = useState(false);
  const [isFindPassword, setIsFindPassword] = useState(false);
  const [isNewPassword,setIsNewPassword] = useState(false);
  //passwordError 저장 useState
  const [passwordError, setPasswordError] = useState("");
  //phoneNumberError 저장 useState
  const [phoneNumberError,setPhoneNumberError] = useState("");
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
  const [findUserId,setFindUserId] = useState("");
  const [findUserName,setFindUserName] = useState("");
  const [findUserPhoneNumber,setFindUserPhoneNumber] = useState("");
  const navigate = useNavigate();

  

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

  //비밀번호 정규식
  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    return passwordRegex.test(password);
  };

  //회원가입 버튼
  const toSignup = () => {
    navigate('/Signup')
  };//회원가입 버튼 종료


  //ID 찾기 팝업창 확인 버튼
  const handleFindIdConfirm = async() => {

    if (!validataeUserPhoneNumber(findUserPhoneNumber)) {
      alert("전화번호는 - 들어가지않은 11자리 숫자로 이루어져야 됩니다..");
      return;
    }

    const userInfo = {
      userName: findUserName,
      userPhoneNumber: findUserPhoneNumber
    };

    console.log(userInfo)
    try {
      //ID찾기 call 메서드
      const response = await call("/travel/userFindId","POST",userInfo,user)

      if(response){
        console.log("ID찾기 call 메서드 response:"+response);
        setFindUserName("");
        setFindUserPhoneNumber("");
        setIsFindUserId(false)
        alert(`ID는 ${response.userId} 입니다`);        
      }
    } catch (error) {
      console.error("ID찾기 실패:", error);
      alert("이름or전화번호 확인해주세요");
    }
  }//ID 찾기 팝업창 확인 버튼 종료

  





  //이메일인증버튼
  const handleEmailVerification = async () => {

    // 이메일 형식 검증
    if (!validateEmail(findUserId)) {
      alert("이메일 형식이 올바르지 않습니다.");
      return;
    }

    console.log()
    // 이메일 인증 코드 발송 전에 로딩 상태로 설정
    setIsLoading(true);

    try {
      const response = await axios.get(`http://${config.IP_ADD}/travel/email/auth?address=${findUserId}`);
      
      if (response.data.success) {
        alert("이메일 인증 코드가 발송되었습니다. 인증 코드를 입력하세요.");
        setIsAuthCodeSent(true);
      } else {
        alert("이메일 인증 코드 발송에 실패했습니다.");
      }
    } catch (error) {
      console.error("이메일 인증 코드 발송 실패:", error);
      alert("이메일 인증 코드 발송 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false); // 로딩 상태 해제
    }
  };

  //이메일 인증코드 체크
  const handleAuthCodeChange = (e) => {
    setAuthCode(e.target.value);
    setAuthCodeError(""); // 오류 초기화
  };

  //이메일 인증코드 확인버튼
  const handleAuthCodeVerification = async () => {
    if (!authCode) {
      setAuthCodeError("인증 코드를 입력해주세요.");
      return;
    }

    // 인증 코드 검증
    await axios.post(`http://${config.IP_ADD}/travel/email/auth?address=${findUserId}&authCode=${authCode}`)
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


  //Password 찾기 팝업창 확인 버튼
  const handleFindPasswordConfirm = async () => {
    
    // 이메일 인증 확인
    if (!isEmailVerified) {
      alert("이메일 인증을 완료해주세요.");
      return;
    }
    // 전화번호 정규식 검증    
    if (!validataeUserPhoneNumber(findUserPhoneNumber)) {
      alert("전화번호는 - 들어가지않은 11자리 숫자로 이루어져야 됩니다..");
      return;
    }
    
    try {
      const userInfo = {
        userId: findUserId,
        userName: findUserName,
        userPhoneNumber: findUserPhoneNumber,
      };
  
      const response = await call("/travel/userFindPassword","POST",userInfo,user)

      console.log("findPassword response:", response);

      if (response) {
        setAuthCode("");
        setFindUserName("");
        setFindUserPhoneNumber("");
        setIsNewPassword(true);
        setIsFindPassword(false);
        setIsEmailVerified(false);
        alert("새로운 비밀번호를 입력해주세요")
      } else {
          alert("입력하신 정보와 일치하는 계정이 없습니다.");
      }

    } catch (error) {
      alert("정보를 다시 확인해주세요");
    }

  }//Password 찾기 확인 버튼 종료

  const handleNewPassword = async() => {

    if (!validatePassword(newPassword)) {
      alert('비밀번호는 8자 이상이며, 특수문자를 포함해야 합니다.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {

      const userInfo = {
        userId: findUserId,
        userPassword: newPassword
      }

      const response = await call("/travel/userResetPassword","POST",userInfo,user)

      if(response){
        alert('비밀번호가 성공적으로 변경되었습니다.');
        setFindUserId("");
        setNewPassword("");
        setNewPasswordConfirm("");
        setIsNewPassword(false)
      }

    } catch (error) {
      alert("비밀번호 변경 실패");
    }


  }

  //로그인 버튼
  const handleLogin = async (event) => {

    event.preventDefault();

    const userProfile = {
      userId: loginId,
      userPassword: loginPassword
    };

    try {

      //로그인 call 메서드
      const response = await call("/travel/login","POST",userProfile,user)

      if(response){
        setUser(response);
        console.log("로그인 call 메서드 response:"+response);
        alert(`로그인 성공! 환영합니다, ${response.userNickName}님!`);
        navigate("/main")
      }
      
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("아이디 또는 비밀번호가 올바르지 않습니다.");
    }
  };//로그인 버튼 종료

  //ID찾기 전화번호 입력및 정규식확인
  const handleFindUserIdUserPhoneNumber = (e) => {
    const phoneNumber = e.target.value;
    setFindUserPhoneNumber(phoneNumber);

    if (!validataeUserPhoneNumber(phoneNumber)) {
      setPhoneNumberError("전화번호는 - 들어가지않은 11자리 숫자로 이루어져야 됩니다..");
    } else {
      setPhoneNumberError("");
    }
    if(!phoneNumber){
      setPhoneNumberError("");
    }
  };

  //비밀번호찾기 이메일 입력및 정규식확인
  const handleFindUserPasswordUserId = (e) => {
    const userId = e.target.value;
    setFindUserId(userId);

    if (!validateEmail(userId)) {
      setEmailError("이메일 형식이 올바르지 않습니다.");
    } else {
      setEmailError("");
    }
    if(!userId){
      setEmailError("");
    }
  }
  

  //비밀번호찾기 전화번호 입력및 정규식확인
  const handleFindUserPasswordUserPhoneNumber = (e) => {
    const phoneNumber = e.target.value;
    setFindUserPhoneNumber(phoneNumber);

    if (!validataeUserPhoneNumber(phoneNumber)) {
      setPhoneNumberError("전화번호는 - 들어가지않은 11자리 숫자로 이루어져야 됩니다..");
    } else {
      setPhoneNumberError("");
    }
    if(!phoneNumber){
      setPhoneNumberError("");
    }
  };

  
  //비밀번호찾기 비밀번호 입력및 정규식확인
  const handleFindUserPasswordUserPassword = (e) => {
    const password = e.target.value;
    setNewPassword(password);

    if (!validatePassword(password)) {
      setPasswordError("비밀번호는 8자 이상이며 특수문자를 포함해야 합니다.");
    } else {
      setPasswordError("");
    }
    if(!password){
      setPasswordError("");
    }
  };

  return (
    <div>
      <TopIcon />
    <div
    className="fullscreen-background"
    style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="overlay-text">시골쥐의 어디가쥐</div>
      <div className="container">
        <main>
          {!isFindUserId && !isFindPassword && !isNewPassword && (<form className="form" onSubmit={handleLogin}>
            <h3>::: 로그인 :::</h3>

            <div className="form-group">
              <label htmlFor="loginId">이메일(아이디)</label>
              <input
                id="loginId"
                name="loginId"
                value={loginId}
                placeholder="example@email.com"
                onChange={(e) => setLoginId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="loginPassword">비밀번호</label>
              <input
                id="loginPassword"
                name="loginPassword"
                type="password"
                value={loginPassword}
                placeholder="Password"
                onChange={(e) => setLoginPassword(e.target.value)}
              />
            </div>

            {/* ID 찾기 및 Password 찾기 텍스트 */}
            <div className="find-texts">
              <span className="find-text" onClick={()=>setIsFindUserId(true)}>
                ID 찾기
              </span>
              <span className="divider">|</span>
              <span className="find-text" onClick={()=>setIsFindPassword(true)}>
                Password 찾기
              </span>
            </div>
            
            <div className="submit-container">
              <input type="submit" value="로그인" className="submit" />
              <input type="button" value="회원가입" className="cancel" onClick={toSignup} />
              <OAuthLogIn />
            </div>

          </form>
          )}
          {isFindUserId && (
            <div className="form">
              <h4>이메일(아이디) 찾기</h4>
              <div className="form-group">
                <label htmlFor="findUserName">이름</label>
                <input 
                  id="findUserName" 
                  name="findUserName"
                  value={findUserName}
                  placeholder="Name" 
                  onChange={(e) => setFindUserName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="findUserPhoneNumber">전화번호</label>
                <input
                  id="findUserPhoneNumber"
                  name="findUserPhoneNumber"
                  value={findUserPhoneNumber}
                  placeholder=" - 빼고 숫자만 입력하세요"
                  onChange={handleFindUserIdUserPhoneNumber}
                />
                {phoneNumberError && <span className="error-message">{phoneNumberError}</span>}
              </div>
              <div className="popup-buttons">
                <button onClick={handleFindIdConfirm}>확인</button>
                <button 
                  onClick={()=>{
                    setIsFindUserId(false)
                    setFindUserName("");
                    setFindUserPhoneNumber("");
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}
          {isFindPassword && (
              <div className="form">
                <h4>Password 찾기</h4>
                <div className="form-group">
                  <label htmlFor="findUserId">새 비밀번호</label>
                  <input 
                    id="findUserId" 
                    name="findUserId" 
                    value={findUserId}
                    placeholder="example@email.com"  
                    onChange={handleFindUserPasswordUserId}
                  />
                  {emailError && <span className="error-message">{emailError}</span>}
                  <input
                    type="button"
                    value={isLoading ? "발송 중..." : "인증번호 발송"}
                    className="button-verify"
                    onClick={handleEmailVerification}
                    disabled={isLoading || !findUserId || emailError || isEmailVerified}
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
                <div className="form-group">
                  <label htmlFor="findIdName">이름</label>
                  <input 
                    id="findUserName" 
                    name="findUserName" 
                    value={findUserName}
                    placeholder="Name"
                    onChange={(e) => setFindUserName(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="findIdPhone">전화번호</label>
                  <input
                    id="findIdPhone"
                    name="findIdPhone"
                    value={findUserPhoneNumber}
                    placeholder=" - 빼고 숫자만 입력하세요"
                    onChange={handleFindUserPasswordUserPhoneNumber}
                  />
                  {phoneNumberError && <span className="error-message">{phoneNumberError}</span>}
                </div>
                <div className="popup-buttons">
                  <button onClick={handleFindPasswordConfirm}>확인</button>
                  <button 
                    onClick={()=>{
                      setIsFindPassword(false)
                      setFindUserId("");
                      setAuthCode("");
                      setFindUserName("");
                      setIsEmailVerified(false);
                      setFindUserPhoneNumber("");
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
            {isNewPassword && (
              <div className="form">
                <h4>새비밀번호등록</h4>
                <div className="form-group">
                  <label htmlFor="newPassword">새비밀번호</label>
                  <input 
                    id="newPassword" 
                    name="newPassword" 
                    type="password"
                    value={newPassword}
                    placeholder="NewPassword"  
                    onChange={handleFindUserPasswordUserPassword}           
                  />
                  {passwordError && <span className="error-message">{passwordError}</span>}
                </div>                
                <div className="form-group">
                  <label htmlFor="newPasswordConfirm">새비밀번호 확인</label>
                  <input 
                    id="newPasswordConfirm" 
                    name="newPasswordConfirm" 
                    type="password"
                    value={newPasswordConfirm}
                    placeholder="NewPasswordConfirm"
                    onChange={(e) => setNewPasswordConfirm(e.target.value)} 
                  />
                </div>                
                <div className="popup-buttons">
                  <button onClick={handleNewPassword}>확인</button>
                  <button 
                    onClick={()=>{
                      setFindUserId("");
                      setNewPassword("");
                      setNewPasswordConfirm("");
                      setIsNewPassword(false)
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
    
  </div>
  );
};

export default Login;
