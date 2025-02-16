import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "../css/Strat.css";
import config from "../Apikey";

const OAuthLogIn = () => {
    // Google 로그인 성공 시 호출되는 함수
    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            // 백엔드로 토큰 전송
            const response = await axios.post(
                `http://${config.IP_ADD}/api/social/user`,
                {
                    socialId: credentialResponse.sub,
                    name: credentialResponse.name,
                    email: credentialResponse.email,
                    picture: credentialResponse.picture,
                    authProvider: 'GOOGLE',  // 필수 필드 추가
                    role: 'USER'            // 필수 필드 추가
                },
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    withCredentials: true
                }
            );
            
            // 로그인 성공 처리
            const { accessToken, user } = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(user));
            
            // 로그인 후 리다이렉트 또는 상태 업데이트
            window.location.href = '/main'; // 또는 원하는 페이지로 이동
        } catch (error) {
            console.error('Google login failed:', error);
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
                    // 백엔드로 인증 정보 전송
                    const response = await axios.post(
                        `http://${config.IP_ADD}/api/social/user`,
                        {
                            socialId: authObj.id,
                            name: authObj.properties.nickname,
                            picture: authObj.properties.profile_image,
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
                    
                    // 로그인 성공 처리
                    const { accessToken, user } = response.data;
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('user', JSON.stringify(user));
                    
                    // 로그인 후 리다이렉트 또는 상태 업데이트
                    window.location.href = '/main';
                } catch (error) {
                    console.error('Kakao login failed:', error);
                    alert('카카오 로그인에 실패했습니다.');
                }
            },
            fail: (err) => {
                console.error('Kakao login failed:', err);
                alert('카카오 로그인에 실패했습니다.');
            },
            scope: 'profile_nickname, profile_image' // 필요한 scope 추가
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