package com.korea.travel.model;
import java.time.LocalDateTime;
import com.korea.travel.security.SocialRole;
import jakarta.persistence.Column;
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
import lombok.extern.slf4j.Slf4j;

@Slf4j
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
    
    @Column(nullable = false, unique = true)
    private String socialId;      // OAuth 제공자의 고유 ID
    
    @Column(nullable = false)
    private String name;          // 소셜 계정 이름
    
    @Column(nullable = true)
    private String email;         // 소셜 이메일
    
    @Column
    private String picture;       // 프로필 이미지
    
    @Column(nullable = false)
    private String createdAt;     // 생성 시간
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AuthProvider authProvider;  // 인증 제공자 (GOOGLE, KAKAO)
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
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
        log.info("Getting role key for user: {}", this.name);
        return this.role.getKey();
    }
    
    // 정보 업데이트 메소드
    public void updateInfo(String name, String picture) {
        log.info("Updating user info - name: {}, picture: {}", name, picture);
        this.name = name;
        this.picture = picture;
    }
    
    // OAuth 정보 업데이트 메소드
    public void updateOAuthInfo(String name, String picture, AuthProvider authProvider) {
        log.info("Updating OAuth info - name: {}, authProvider: {}", name, authProvider);
        this.name = name;
        this.picture = picture;
        this.authProvider = authProvider;
    }
    
    @PrePersist
    protected void onCreate() {
        if (role == null) {
            role = SocialRole.USER;
            log.info("Setting default role for new user: {}", role);
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now().toString();
            log.info("Setting creation time: {}", createdAt);
        }
        log.info("Creating new social entity - socialId: {}, name: {}, email: {}", 
                socialId, name, email);
    }
    
    // Provider 문자열 반환 메소드 - SocialController에서 필요함
    public String getProvider() {
        if (authProvider == null) {
            return null;
        }
        return authProvider.name();
    }
}