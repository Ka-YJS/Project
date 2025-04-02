package com.korea.travel.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Optional;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.SocialRepository;
import com.korea.travel.persistence.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

/**
 * JWT 인증 필터 클래스
 * HTTP 요청에서 JWT 토큰을 검증하고 인증 처리를 수행합니다.
 */
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private final TokenProvider tokenProvider;
    private final UserRepository userRepository;
    private final SocialRepository socialRepository;
    
    /**
     - 모든 HTTP 요청에 대해 실행되는 필터 메서드
     - 인증이 필요한 경로에 대해 JWT 토큰을 검증하고 인증 정보를 설정
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
           throws ServletException, IOException {
       
       String requestURI = request.getRequestURI();
       // 인증이 필요 없는 엔드포인트 목록
       if (requestURI.equals("/travel/userIdCheck") ||
               requestURI.equals("/travel/login") || 
               requestURI.equals("/travel/signup")|| 
               requestURI.equals("/travel/userFindId")|| 
               requestURI.equals("/travel/userFindPassword")|| 
               requestURI.equals("/travel/userResetPassword")|| 
               requestURI.equals("/travel/oauth2/google/callback")||
               requestURI.startsWith("/travel/email") ||
               requestURI.startsWith("/api/social") ||  
               requestURI.startsWith("/social") ||      
               requestURI.startsWith("/login/oauth2/code/google")
               ) {
           filterChain.doFilter(request, response);
           return;
       }
       
       // 조회성 엔드포인트 확인 (인증 실패해도 진행 가능)
       boolean isPublicReadEndpoint = 
           (requestURI.startsWith("/travel/posts") && request.getMethod().equals("GET")) ||
           (requestURI.startsWith("/travel/likes") && request.getMethod().equals("GET"));
       
       String token = request.getHeader("Authorization");
       
       if (token != null && token.startsWith("Bearer ")) {
           token = token.substring(7);
           try {
                String userId;
                
                // 토큰 종류에 따라 다른 검증 방법 사용
                if (tokenProvider.isSocialToken(token)) {
                    // 소셜 토큰 검증
                    userId = tokenProvider.validateAndGetUserId(token); // 이메일 또는 socialId 반환
                } else {
                    // 일반 토큰 검증
                    userId = tokenProvider.validateAndGetUserId(token);
                }
                
                if (userId == null || userId.isEmpty()) {
                    // 조회성 엔드포인트면 인증 없이 진행
                    if (isPublicReadEndpoint) {
                        filterChain.doFilter(request, response);
                        return;
                    }
                    
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"Invalid user ID in token\"}");
                    return;
                }
                
                // URL에서 사용자 ID 추출
                String pathUserId = extractUserIdFromPath(requestURI);
                
                // 디버깅 로그 추가
                System.out.println("Token userId: " + userId);
                System.out.println("Path userId: " + pathUserId);

                // 토큰에서 추출한 userId와 URL에서 추출한 userId 비교
                if (pathUserId != null && !pathUserId.equals(userId) && !isCompatibleId(pathUserId, userId)) {
                    // 조회성 엔드포인트면 인증 없이 진행
                    if (isPublicReadEndpoint) {
                        filterChain.doFilter(request, response);
                        return;
                    }
                    
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write("{\"error\":\"User ID in token does not match URL path ID\"}");
                    return;
                }
                
                // 사용자 객체를 찾아서 SecurityContext에 설정
                // 변경된 부분: 사용자 객체를 찾아서 SecurityContext에 설정
                if (tokenProvider.isSocialToken(token)) {
                    // 소셜 로그인 사용자 검색 - Optional 처리
                    Optional<SocialEntity> optionalSocialUser = socialRepository.findBySocialId(userId);
                    if (optionalSocialUser.isPresent()) {
                        SocialEntity socialUser = optionalSocialUser.get();
                        // 소셜 사용자의 권한 설정
                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(socialUser.getRoleKey());
                        UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(socialUser, null, Collections.singleton(authority));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } else {
                        // 조회성 엔드포인트면 인증 없이 진행
                        if (isPublicReadEndpoint) {
                            filterChain.doFilter(request, response);
                            return;
                        }
                        
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\":\"Social user not found with ID: " + userId + "\"}");
                        return;
                    }
                } else {
                    // 일반 사용자 검색
                	Optional<UserEntity> user = userRepository.findByUserId(userId);
                    if (user != null) {
                        // 일반 사용자의 권한 설정 (기본적으로 USER 권한 부여)
                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_USER");
                        UsernamePasswordAuthenticationToken authentication = 
                            new UsernamePasswordAuthenticationToken(user, null, Collections.singleton(authority));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    } else {
                        // 조회성 엔드포인트면 인증 없이 진행
                        if (isPublicReadEndpoint) {
                            filterChain.doFilter(request, response);
                            return;
                        }
                        
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json;charset=UTF-8");
                        response.getWriter().write("{\"error\":\"User not found with ID: " + userId + "\"}");
                        return;
                    }
                }
            } catch (Exception e) {
                // 조회성 엔드포인트면 인증 없이 진행
                if (isPublicReadEndpoint) {
                    filterChain.doFilter(request, response);
                    return;
                }
                
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"error\":\"Token validation failed: " + e.getMessage() + "\"}");
                return;
            }
       } else {
           // 토큰이 없는 요청에 대한 처리
           // 조회성 엔드포인트면 인증 없이 진행
           if (isPublicReadEndpoint) {
               filterChain.doFilter(request, response);
               return;
           }
           
           response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
           response.setContentType("application/json;charset=UTF-8");
           response.getWriter().write("{\"error\":\"Authorization token is missing\"}");
           return;
       }
       
       filterChain.doFilter(request, response);
    }
   
    /**
     * URL 경로에서 사용자 ID를 추출하는 메서드
     - @param requestURI HTTP 요청 URI
     - @return 추출된 사용자 ID 또는 null
     */
    private String extractUserIdFromPath(String requestURI) {
        // /travel/write/{userId} 형식의 URL 처리
        if (requestURI.startsWith("/travel/write/")) {
            return requestURI.substring("/travel/write/".length());
        }
        
        // 필요한 경우 다른 경로 패턴 추가
        // 예: /travel/posts/{userId}
        
        return null; // 매칭되는 패턴이 없으면 null 반환
    }

    /**
     - 경로에서 추출한 ID와 토큰에서 추출한 ID가 호환되는지 확인하는 메서드
     - 소셜 로그인의 경우 ID 형식 차이를 처리 
     - @param pathId URL 경로에서 추출한 사용자 ID
     - @param tokenId 토큰에서 추출한 사용자 ID
     - @return 두 ID가 호환되면 true, 아니면 false
     */
    private boolean isCompatibleId(String pathId, String tokenId) {
        System.out.println("Comparing pathId: " + pathId + " with tokenId: " + tokenId);
        
        // 카카오 소셜 로그인 처리
        if (pathId.startsWith("kakao_")) {
            String kakaoId = pathId.substring("kakao_".length());
            return tokenId.equals(kakaoId);
        }
        
        // 구글 소셜 로그인 처리
        if (pathId.startsWith("google_")) {
            String googleId = pathId.substring("google_".length());
            return tokenId.equals(googleId);
        }
        
        return false;
    }
}