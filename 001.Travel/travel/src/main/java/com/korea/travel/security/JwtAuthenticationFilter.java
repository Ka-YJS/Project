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
	   }
	   filterChain.doFilter(request, response);
	}
}