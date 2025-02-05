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
        this.socialId = user.getSocialId();
        this.email = user.getEmail();
        this.role = user.getRole();
        this.attributes = attributes;
        this.authorities = Collections.singleton(new SimpleGrantedAuthority(user.getRoleKey()));
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
        // OAuth2User 인터페이스에서 요구하는 getName() 메소드
        // 보통 Primary Key 값을 반환
        return socialId;
    }
    
    // 권한 확인 메소드
    public boolean hasRole(SocialRole role) {
        return this.role.equals(role);
    }
    
    // 사용자 정보 업데이트 메소드
    public void updateAttributes(Map<String, Object> attributes) {
        this.attributes = attributes;
    }
    
    // Role 업데이트 메소드
    public void updateRole(SocialRole newRole) {
        this.role = newRole;
        this.authorities = Collections.singleton(new SimpleGrantedAuthority(newRole.getKey()));
    }
}