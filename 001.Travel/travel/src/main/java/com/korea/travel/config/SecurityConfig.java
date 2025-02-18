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
import com.korea.travel.oauth.CustomOAuth2UserServiceImpl;
import com.korea.travel.security.JwtAuthenticationFilter;
import com.korea.travel.security.TokenProvider;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

   private final TokenProvider tokenProvider;
   private final CustomOAuth2UserServiceImpl customOAuth2UserService;

   @Bean
   public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
	   
	   System.out.println("=== Security Configuration Loading ===");
	   
       http
           .csrf(csrf -> csrf.disable())  // CSRF 보호 비활성화 (필요시 활성화)
           .authorizeHttpRequests(auth -> auth
               .requestMatchers(
                   "/travel/login",
                   "/travel/signup", 
                   "/travel/userIdCheck",
                   "/travel/userFindId",
                   "/travel/userFindPassword",
                   "/travel/userResetPassword",
                   "/travel/oauth2/google/callback",
                   "/travel/email/**",
                   "/social/**",  // OAuth2 엔드포인트도 /social로 통일
                   "/api/social/**",
                   "/login/oauth2/code/google",
                   "/static/**"
               ).permitAll()  //경로는 인증 없이 허용
               .anyRequest().authenticated()  // 그 외 요청은 인증 필요
           )//authorizeHttpRequests
           .oauth2Login(oauth2 -> oauth2  // OAuth2 로그인 활성화
               .userInfoEndpoint(userInfo -> userInfo
                   .userService(customOAuth2UserService))  // OAuth2 사용자 서비스 설정
               .successHandler((request, response, authentication) -> {
                   // JWT 토큰 생성 및 쿠키/헤더 설정
                   // 프론트엔드로 리다이렉트
               })
           )//oauth2Login
           .cors(cors -> cors.configurationSource(corsConfigurationSource()))  //CORS 설정 활성화
           //JWT 인증 필터 추가 요청이 들어올 때마다 JWT 토큰을 검증하고 인증처리하도록
           .addFilterBefore(
               new JwtAuthenticationFilter(tokenProvider),
               UsernamePasswordAuthenticationFilter.class
           );

       return http.build();
   }

   //비밀번호를 BCrypt 해시 알고리즘으로 암호화
   @Bean
   public PasswordEncoder passwordEncoder() {
       return new BCryptPasswordEncoder();
   }

   /*CorsConfigurationSource는 CORS(Cross-Origin Resource Sharing) 정책을 설정하는 객체
   -허용할 출처(Origin) 지정, 허용할 HTTP 메서드 설정, 헤더 설정, 인증 관련 설정*/
   @Bean
   public CorsConfigurationSource corsConfigurationSource() {
       CorsConfiguration configuration = new CorsConfiguration();
       configuration.setAllowedOrigins(Arrays.asList("http://todo-test-dev.store", "https://todo-test-dev.store", "http://localhost:3000"));
       configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
       configuration.setAllowedHeaders(Arrays.asList("*"));
       configuration.setAllowCredentials(true);
       configuration.setExposedHeaders(Arrays.asList("Authorization"));

       UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
       source.registerCorsConfiguration("/**", configuration);
       return source;
   }
}