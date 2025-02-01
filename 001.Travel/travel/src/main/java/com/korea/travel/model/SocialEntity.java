package com.korea.travel.model;

import org.springframework.context.annotation.Role;

import com.korea.travel.security.SocialRole;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "socials")
public class SocialEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String socialId;      // OAuth 제공자의 고유 ID
    private String name;          // 소셜 계정 이름
    private String email;         // 소셜 이메일
    private String picture;       // 프로필 이미지
    private String createdAt;     // 생성 시간
    
    @Enumerated(EnumType.STRING)
    private AuthProvider authProvider;  // 인증 제공자 (GOOGLE, KAKAO)
    
    @Enumerated(EnumType.STRING)
    private SocialRole role;            // 사용자 권한
    
    // AuthProvider Enum 정의
    public enum AuthProvider {
        GOOGLE,
        KAKAO
    }
    
    // 프로필 업데이트 메소드
    public SocialEntity update(String name, String email, String picture) {
        this.name = name;
        this.email = email;
        this.picture = picture;
        return this;
    }
    
    // 권한 키 조회 메소드
    public String getRoleKey() {
        return this.role.getKey();
    }
    
    // 정보 업데이트 메소드
    public void updateInfo(String name, String picture) {
        this.name = name;
        this.picture = picture;
    }
    
    // OAuth 정보 업데이트 메소드
    public void updateOAuthInfo(String name, String picture, AuthProvider authProvider) {
        this.name = name;
        this.picture = picture;
        this.authProvider = authProvider;
    }
    
    @PrePersist
    protected void onCreate() {
        if (role == null) {
            role = SocialRole.USER;
        }
    }
}
