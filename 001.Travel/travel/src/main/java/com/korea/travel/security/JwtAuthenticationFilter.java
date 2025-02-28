package com.korea.travel.security;

import java.io.IOException;
import java.util.ArrayList;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import com.korea.travel.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
	
	private final TokenProvider tokenProvider;
	
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
	                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
	                response.getWriter().write("Invalid user ID in token");
	                return;
	            }
	            
	            UsernamePasswordAuthenticationToken authentication = 
	                new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());
	            SecurityContextHolder.getContext().setAuthentication(authentication);
	        } catch (Exception e) {
	            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
	            response.getWriter().write("Token validation failed: " + e.getMessage());
	            return;
	        }
	   } else {
	       // 토큰이 없는 요청에 대한 처리
	       response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
	       response.getWriter().write("Authorization token is missing");
	       return;
	   }
	   
	   filterChain.doFilter(request, response);
	}
}