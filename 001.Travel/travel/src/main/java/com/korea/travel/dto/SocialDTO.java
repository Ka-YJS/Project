package com.korea.travel.dto;

import java.io.Serializable;
import java.util.Map;

import org.springframework.context.annotation.Role;

import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.SocialEntity.AuthProvider;

import lombok.Builder;
import lombok.Getter;

public class SocialDTO {
    
    @Getter
    @Builder
    public static class dto {
        private Map<String, Object> attributes;
        private String nameAttributeKey;
        private String name;
        private String email;
        private String picture;
        private String socialId;
        private String createdAt;
        private AuthProvider authProvider;

        public static dto of(String registrationId, 
                           String userNameAttributeName,
                           Map<String, Object> attributes) {
            return registrationId.equals("google") ? 
                   ofGoogle(userNameAttributeName, attributes) :
                   ofKakao(userNameAttributeName, attributes);
        }

        private static dto ofGoogle(String userNameAttributeName,
                                  Map<String, Object> attributes) {
            return dto.builder()
                    .name((String) attributes.get("name"))
                    .email((String) attributes.get("email"))
                    .picture((String) attributes.get("picture"))
                    .socialId((String) attributes.get("sub"))
                    .attributes(attributes)
                    .nameAttributeKey(userNameAttributeName)
                    .authProvider(AuthProvider.GOOGLE)
                    .createdAt(java.time.LocalDateTime.now().toString())
                    .build();
        }
        
        private static dto ofKakao(String userNameAttributeName,
                                 Map<String, Object> attributes) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            
            return dto.builder()
                    .name((String) profile.get("nickname"))
                    .email((String) kakaoAccount.get("email"))
                    .picture((String) profile.get("profile_image_url"))
                    .socialId(String.valueOf(attributes.get("id")))
                    .attributes(attributes)
                    .nameAttributeKey(userNameAttributeName)
                    .authProvider(AuthProvider.KAKAO)
                    .createdAt(java.time.LocalDateTime.now().toString())
                    .build();
        }

        public SocialEntity toEntity() {
            return SocialEntity.builder()
                    .name(name)
                    .email(email)
                    .picture(picture)
                    .socialId(socialId)
                    .createdAt(createdAt)
                    .authProvider(authProvider)
                    .role(Role.USER)
                    .build();
        }
    }

    @Getter
    public static class Session implements Serializable {
        private String name;
        private String email;
        private String picture;
        private String socialId;
        private String createdAt;
        private AuthProvider authProvider;

        public Session(SocialEntity user) {
            this.name = user.getName();
            this.email = user.getEmail();
            this.picture = user.getPicture();
            this.socialId = user.getSocialId();
            this.createdAt = user.getCreatedAt();
            this.authProvider = user.getAuthProvider();
        }
    }
}