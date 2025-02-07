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
	   if (requestURI.equals("/travel/userIdCheck") ||
	           requestURI.equals("/travel/login") || 
	           requestURI.equals("/travel/signup")|| 
	           requestURI.equals("/travel/userFindId")|| 
	           requestURI.equals("/travel/userFindPassword")|| 
	           requestURI.equals("/travel/userResetPassword")|| 
	           requestURI.equals("/travel/oauth2/google/callback")||
	           requestURI.startsWith("/travel/email") ||
	           requestURI.startsWith("/api/social") ||  // 추가
	           requestURI.startsWith("/social") ||      // 추가
	           requestURI.startsWith("/login/oauth2/code/google") // 추가
	           ) {
	       filterChain.doFilter(request, response);
	       return;
	   }

	   String token = request.getHeader("Authorization");
	   
	   if (token != null && token.startsWith("Bearer ")) {
	       token = token.substring(7);
	       try {
	           String userId = tokenProvider.validateAndGetUserId(token);
	           UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());
	           SecurityContextHolder.getContext().setAuthentication(authentication);
	       } catch (Exception e) {
	           response.setStatus(HttpServletResponse.SC_FORBIDDEN);
	           response.getWriter().write("Invalid or expired token");
	           return;
	       }
	   } else {
	       response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
	       response.getWriter().write("Authorization header is missing or invalid");
	       System.out.println("Authorization header is missing or invalid");
	       return;
	   }
	   filterChain.doFilter(request, response);
	}
}