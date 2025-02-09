package com.korea.travel.oauth;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import com.korea.travel.model.SocialEntity;
import com.korea.travel.security.SocialRole;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class CustomOAuth2User implements OAuth2User {
   @Getter
   private String socialId;
   @Getter 
   private String email;
   @Getter
   private SocialRole role;
   private Collection<? extends GrantedAuthority> authorities;
   private Map<String, Object> attributes;
   
   // 일반 유저 정보를 기반으로 한 생성자
   public CustomOAuth2User(SocialEntity user, Map<String, Object> attributes) {
       if (user == null) {
           throw new IllegalArgumentException("User cannot be null");
       }
       if (attributes == null) {
           throw new IllegalArgumentException("Attributes cannot be null");
       }
       
       log.info("Creating CustomOAuth2User - socialId: {}, email: {}, role: {}", 
           user.getSocialId(), user.getEmail(), user.getRole());
           
       this.socialId = user.getSocialId();
       this.email = user.getEmail();
       this.role = (user.getRole() != null) ? user.getRole() : SocialRole.USER;
       this.attributes = attributes;
       this.authorities = Collections.singleton(new SimpleGrantedAuthority(
           (user.getRoleKey() != null) ? user.getRoleKey() : SocialRole.USER.getKey()
       ));
   }

   // OAuth2User 인터페이스 메소드 구현
   @Override
   public Map<String, Object> getAttributes() {
       return attributes;
   }

   @Override
   public Collection<? extends GrantedAuthority> getAuthorities() {
       return authorities;
   }

   @Override
   public String getName() {
       return socialId != null ? socialId : email;
   }
   
   // 권한 확인 메소드
   public boolean hasRole(SocialRole role) {
       return this.role != null && this.role.equals(role);
   }
   
   // Role 업데이트 메소드
   public void updateRole(SocialRole newRole) {
       this.role = newRole;
       this.authorities = Collections.singleton(new SimpleGrantedAuthority(newRole.getKey()));
   }
   
   // 사용자 정보 업데이트 메소드
   public void updateAttributes(Map<String, Object> attributes) {
       this.attributes = attributes;
   }
   
   // Role Key 조회 메소드
   public String getRoleKey() {
       return role != null ? role.getKey() : SocialRole.USER.getKey();
   }
}