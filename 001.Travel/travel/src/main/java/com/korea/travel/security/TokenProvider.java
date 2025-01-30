package com.korea.travel.security;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.korea.travel.model.UserEntity;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;

@Service
public class TokenProvider {
	
	@Value("${jwt.secret}")
	private String secretKey; 
	
	//JWT생성
	public String create(UserEntity entity) {
		
		//JWT Header
		//JWT header의 값을 담을 Map.
		Map<String, Object> header = new HashMap<>();		
		//만들어진 Map타입을 가지고있는 header 변수에 key value 방식으로 typ(key)와 JWT(value)를 넣어준다.
		header.put("typ", "JWT");
		
		//토큰의 유효기간 1000(밀리세컨드)*60(초)*180(분)설정
		Long expTime = 1000*60L*180L;
		//현재시간
		Date ext = new Date();
		//ext의 시간을 현재 시간에 추가해주기
		ext.setTime(ext.getTime() + expTime);
		
		//payload를 담을 Map
		Map<String,Object> payload = new HashMap<>();
		//Map타입을 가지고있는 
		
		//jwt 생성
		String jwt = Jwts.builder()
				.setHeader(header)	//헤더 설정
				.signWith(SignatureAlgorithm.HS512,secretKey)// 서명 알고리즘과 비교
				.setSubject(entity.getUserId())	//사용자 id설정
				.setIssuer("travel app")	//토큰 발행 주체
				.setIssuedAt(new Date())	//토큰 발행 날짜
				.setExpiration(ext)		//exp
				.compact();			//토큰을 .으로 구분된 하나의 문자열로 만들어준다
		return jwt;
	}
	
	
	//JWT 토큰 검증 및 유저 id 반환
	public String validateAndGetUserId(String token) {
		
		if(!isTokenExpired(token)) {
			try {
				Claims claims = Jwts.parser()
						.setSigningKey(secretKey)
						.parseClaimsJws(token)
						.getBody();
				return claims.getSubject();
			} catch (Exception e) {
				throw new RuntimeException("Token validation failed",e);
			}
		}else {
			return null;
		}
	}
		
	
	//토큰이 만료되었는지 확인
	public boolean isTokenExpired(String token) {
		Date expiration = Jwts.parser()
				.setSigningKey(secretKey)
				.parseClaimsJws(token)
				.getBody()
				.getExpiration();
		
		//만료되었으면 true
		return expiration.before(new Date());
	}
	
}
