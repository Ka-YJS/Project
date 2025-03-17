import React, {useEffect} from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import "../css/Strat.css";
import config from "../Apikey";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";
import { useNavigate } from 'react-router-dom';

const OAuthLogIn = () => {

    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();

    useEffect(() => {
        // Kakao SDK 초기화
        if (!window.Kakao.isInitialized()) {
            window.Kakao.init(process.env.REACT_APP_KAKAO_KEY);
        }
    }, []);

    // Google 로그인 성공 시 호출되는 함수
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            // JWT 토큰 디코딩
            const decoded = jwtDecode(credentialResponse.credential)

            // 백엔드로 사용자 정보 전송
            const response = await axios.post(
                `http://${config.IP_ADD}/api/social/user`,
                {
                    socialId: decoded.sub,
                    name: decoded.name,
                    email: decoded.email,
                    picture: decoded.picture,
                    authProvider: 'GOOGLE',
                    role: 'USER'
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );

        
            // Session 정보를 user 객체로 저장
            const userData = {
                id: response.data.socialId,
            name: response.data.name,
            nickName: response.data.name, // 소셜 로그인은 이름을 닉네임으로 사용
            email: response.data.email,
            picture: response.data.picture,
            authProvider: 'GOOGLE',
            phoneNumber: null // 소셜 로그인은 전화번호 없음
            };
            
            // Context 업데이트
            setUser(userData);
            
            // accessToken과 user 정보 localStorage에 저장
            const { accessToken } = response.data;
            
            // 토큰 검증
            if (!accessToken) {
                throw new Error("서버에서 토큰을 받지 못했습니다.");
            }
            
            // 토큰 저장 및 검증
            localStorage.setItem('accessToken', accessToken);
            const storedToken = localStorage.getItem('accessToken');
            if (storedToken !== accessToken) {
                throw new Error("토큰 저장에 실패했습니다.");
            }
        
            // 로그인 후 리다이렉트
            navigate('/main');
        } catch (error) {
            console.error('Google login failed:', error);
            // axios 에러인 경우 응답 데이터도 로깅
            if (error.response) {
                console.error('Server error response:', error.response.data);
                console.error('Status:', error.response.status);
            }
            alert('로그인에 실패했습니다.');
        }
    };

        // Google 로그인 실패 시 호출되는 함수
        const handleGoogleError = () => {
            console.error('Google login failed');
            alert('구글 로그인에 실패했습니다.');
        };

    // 카카오 로그인
    const handleKakaoLogin = () => {
        // Kakao SDK가 전역 객체에 있는지 확인
        if (!window.Kakao) {
            console.error('Kakao SDK not found');
            return;
        }

        window.Kakao.Auth.login({
            success: async (authObj) => {
                try {
                    // Kakao.API.request를 사용하여 사용자 정보 가져오기
                    const userInfo = await window.Kakao.API.request({
                    url: '/v2/user/me'
                    });

                    // 백엔드로 인증 정보 전송
                    const response = await axios.post(
                        `http://${config.IP_ADD}/api/social/user`,
                        {
                            socialId: userInfo.id,
                            name: userInfo.kakao_account.profile.nickname,
                            email: userInfo.kakao_account.email || `kakao_${userInfo.id}@kakao.com`,
                            picture: userInfo.kakao_account.profile.profile_image_url,
                            authProvider: 'KAKAO',
                            role: 'USER'
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            withCredentials: true
                        }
                    );

                    const { accessToken } = response.data;

                    // Session 정보를 user 객체로 저장
                    const userData = {
                        id: response.data.socialId,
                        name: response.data.name,
                        nickName: response.data.name, // 소셜 로그인은 이름을 닉네임으로 사용
                        email: response.data.email,
                        picture: response.data.picture,
                        authProvider: 'KAKAO',
                        phoneNumber: null, // 소셜 로그인은 전화번호 없음
                        accessToken: accessToken
                    };
                    
                    // Context 업데이트
                    setUser(userData);
                    
                    // 로그인 성공 처리
                    // 토큰 검증
                    if (!accessToken) {
                        throw new Error("서버에서 토큰을 받지 못했습니다.");
                    }
                    
                    // 토큰 저장 및 검증
                    localStorage.setItem('accessToken', accessToken);
                    const storedToken = localStorage.getItem('accessToken');
                    if (storedToken !== accessToken) {
                        throw new Error("토큰 저장에 실패했습니다.");
                    }
                
                    console.log("토큰 검증 성공:", storedToken);
                    
                    // 로그인 후 리다이렉트 또는 상태 업데이트
                    navigate('/main');
                } catch (error) {
                    console.error('Kakao login failed:', error);
                    
                    // axios 에러인 경우 응답 데이터도 로깅
                    if (error.response) {
                        console.error('Server error response:', error.response.data);
                        console.error('Status:', error.response.status);
                    }

                    alert('카카오 로그인에 실패했습니다.');
                }
            },
            fail: (err) => {
                console.error('Kakao login failed:', err);
                alert('카카오 로그인에 실패했습니다.');
            },
            scope: 'profile_nickname,profile_image' // 필요한 scope 추가
        });
    };

    return (
        <div className="submit-container">
            <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
                <div className="google-button-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        size="large"
                        text="signin_with"
                    />
                </div>
            </GoogleOAuthProvider>

            <div 
                className="kakao-button"
                onClick={handleKakaoLogin}
            >
                카카오로 시작하기
            </div>
        </div>
    );
};

export default OAuthLogIn;