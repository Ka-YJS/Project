package com.korea.travel.config;

import java.util.Arrays;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.korea.travel.oauth.CustomOAuth2User;
import com.korea.travel.oauth.CustomOAuth2UserServiceImpl;
import com.korea.travel.persistence.SocialRepository;
import com.korea.travel.persistence.UserRepository;
import com.korea.travel.security.JwtAuthenticationFilter;
import com.korea.travel.security.TokenProvider;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Configuration
@RequiredArgsConstructor
public class SecurityConfig {

   private final TokenProvider tokenProvider;
   private final CustomOAuth2UserServiceImpl customOAuth2UserService;
   private final UserRepository userRepository;
   private final SocialRepository socialRepository;

   @Bean
   public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
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
                   "/static/**",
                   "/travel/posts/**",  // 게시글 조회는 인증 없이 허용
                   "/travel/likes/**",   // 좋아요 조회는 인증 없이 허용
                   "/uploads/**"
               ).permitAll()  //경로는 인증 없이 허용
               .anyRequest().authenticated()  // 그 외 요청은 인증 필요
           )//authorizeHttpRequests
           .exceptionHandling(ex -> ex
               .authenticationEntryPoint((request, response, authException) -> {
                   // 인증 실패 시 JSON 형식으로 응답
                   response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                   response.setContentType("application/json;charset=UTF-8");
                   response.getWriter().write("{\"error\":\"인증이 필요합니다\"}");
               })
           )
           .oauth2Login(oauth2 -> oauth2  // OAuth2 로그인 활성화
               .userInfoEndpoint(userInfo -> userInfo
                   .userService(customOAuth2UserService))  // OAuth2 사용자 서비스 설정
               .successHandler((request, response, authentication) -> {
                   // JWT 토큰 생성 및 쿠키/헤더 설정
                   // 프론트엔드로 리다이렉트
            	   
            	// CustomOAuth2User에서 정보 추출
                   CustomOAuth2User oAuth2User = (CustomOAuth2User) authentication.getPrincipal();
                   String socialId = oAuth2User.getSocialId();
                   String email = oAuth2User.getEmail();
                   
                   // 사용자 정보와 함께 토큰 생성
                   String token = tokenProvider.createToken(socialId, email, oAuth2User.getRoleKey());
                   
                   // 토큰을 헤더에 추가
                   response.setHeader("Authorization", "Bearer " + token);
                   
                   // 프론트엔드로 리다이렉트
                   response.sendRedirect("http://localhost:3000/oauth2/redirect?token=" + token);
               })
           )//oauth2Login
           .cors(cors -> cors.configurationSource(corsConfigurationSource()))  //CORS 설정 활성화
           //JWT 인증 필터 추가 요청이 들어올 때마다 JWT 토큰을 검증하고 인증처리하도록
           .addFilterBefore(
               new JwtAuthenticationFilter(tokenProvider, userRepository, socialRepository),
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
       configuration.setMaxAge(3600L);

       UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
       source.registerCorsConfiguration("/**", configuration);
       return source;
   }
}