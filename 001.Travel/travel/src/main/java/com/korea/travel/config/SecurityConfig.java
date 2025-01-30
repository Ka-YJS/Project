package com.korea.travel.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.korea.travel.security.JwtAuthenticationFilter;
import com.korea.travel.security.TokenProvider;

import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
	
	private final TokenProvider tokenProvider;
	
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf().disable()  // CSRF 보호 비활성화 (필요시 활성화)
            .authorizeRequests()
          	.requestMatchers(
          			"/travel/login",
          			"/travel/signup",
          			"/travel/userIdCheck",
          			"/travel/userFindId",
          			"/travel/userFindPassword",
          			"/travel/userResetPassword",
          			"/travel/oauth2/google/callback",
          			"/travel/email/**"
          			).permitAll() //경로는 인증 없이 허용
          	.anyRequest().authenticated()  // 그 외 요청은 인증 필요
        	.and()
        	.cors()//CORS 설정 활성화
        	.and()
        	//JWT 인증 필터 추가 요청이 들어올 때마다 JWT 토큰을 검증하고 인증처리하도록
        	.addFilterBefore(
        			new JwtAuthenticationFilter(tokenProvider), 
        			UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
    
    
    //비밀번호를 BCrypt 해시 알고리즘으로 암호화
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

}