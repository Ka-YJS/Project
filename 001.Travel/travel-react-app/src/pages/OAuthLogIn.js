import React from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import "../css/Strat.css";
import config from "../Apikey";

const OAuthLogIn = () => {
    console.log("Google Client ID:", process.env.REACT_APP_GOOGLE_CLIENT_ID);
    // Google 로그인 성공 시 호출되는 함수
    const handleGoogleSuccess = async (credentialResponse) => {
        try {

            // 1. 먼저 Google의 userinfo endpoint로 사용자 정보를 가져옵니다
        const userInfoResponse = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            {
                headers: {
                    'Authorization': `Bearer ${credentialResponse.credential}`
                }
            }
        );
        
        const userInfo = userInfoResponse.data;

            // 백엔드로 토큰 전송
            // 2. 백엔드로 사용자 정보 전송
        const response = await axios.post(
            `http://${config.IP_ADD}/api/social/user`,
            {
                socialId: userInfo.sub,
                name: userInfo.name,
                email: userInfo.email,
                picture: userInfo.picture,
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
                    // Kakao.API.request를 사용하여 사용자 정보 가져오기
                    const userInfo = await window.Kakao.API.request({
                    url: '/v2/user/me'
                    });
                    // 백엔드로 인증 정보 전송
                    const response = await axios.post(
                        `http://${config.IP_ADD}/api/social/user`,
                        {
                            socialId: userInfo.id,
                            name: userInfo.kakao_account.profile.profile_nickname,
                            picture: userInfo.kakao_account.profile.profile_image,
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