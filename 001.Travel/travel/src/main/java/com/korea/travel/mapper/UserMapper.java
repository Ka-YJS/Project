package com.korea.travel.mapper;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import com.korea.travel.dto.SocialDTO;
import com.korea.travel.dto.UserDTO;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.UserEntity;
import com.korea.travel.model.SocialEntity.AuthProvider;
import com.korea.travel.security.SocialRole;

@Component
public class UserMapper {
    
    // UserEntity -> UserDTO 변환
    public UserDTO toUserDTO(UserEntity entity) {
        return UserDTO.builder()
                .id(entity.getId())
                .userId(entity.getUserId())
                .userName(entity.getUserName())
                .userNickName(entity.getUserNickName())
                .userPhoneNumber(entity.getUserPhoneNumber())
                .userPassword(entity.getUserPassword())
                .userProfileImage(entity.getUserProfileImage())
                .build();
    }
    
    // UserDTO -> UserEntity 변환
    public UserEntity toUserEntity(UserDTO dto) {
        return UserEntity.builder()
                .id(dto.getId())
                .userId(dto.getUserId())
                .userName(dto.getUserName())
                .userNickName(dto.getUserNickName())
                .userPhoneNumber(dto.getUserPhoneNumber())
                .userPassword(dto.getUserPassword())
                .userProfileImage(dto.getUserProfileImage())
                .userCreatedAt(LocalDateTime.now().toString())
                .build();
    }
    
    // OAuth2User -> SocialEntity 변환
    public SocialEntity toSocialEntity(OAuth2User oauth2User, String provider) {
        Map<String, Object> attributes = oauth2User.getAttributes();
        
        if (provider.equals("google")) {
            return SocialEntity.builder()
                    .email((String) attributes.get("email"))
                    .name((String) attributes.get("name"))
                    .picture((String) attributes.get("picture"))
                    .socialId((String) attributes.get("sub"))
                    .authProvider(AuthProvider.GOOGLE)
                    .role(SocialRole.USER)
                    .createdAt(LocalDateTime.now().toString())
                    .build();
        } else if (provider.equals("kakao")) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            
            return SocialEntity.builder()
                    .email((String) kakaoAccount.get("email"))
                    .name((String) profile.get("nickname"))
                    .picture((String) profile.get("profile_image_url"))
                    .socialId(String.valueOf(attributes.get("id")))
                    .authProvider(AuthProvider.KAKAO)
                    .role(SocialRole.USER)
                    .createdAt(LocalDateTime.now().toString())
                    .build();
        }
        
        throw new IllegalArgumentException("Unsupported provider: " + provider);
    }
    
    // SocialEntity -> SocialDTO.Session 변환
    public SocialDTO.Session toSocialSession(SocialEntity entity) {
        return new SocialDTO.Session(entity);
    }
    
    // SocialEntity -> UserEntity 변환
    public UserEntity socialToUserEntity(SocialEntity socialEntity) {
        return UserEntity.builder()
                .userName(socialEntity.getName())
                .userProfileImage(socialEntity.getPicture())
                .userCreatedAt(socialEntity.getCreatedAt())
                .build();
    }
    
    // UserEntity -> SocialEntity 변환 (필요한 경우)
    public SocialEntity userToSocialEntity(UserEntity userEntity) {
        return SocialEntity.builder()
                .name(userEntity.getUserName())
                .picture(userEntity.getUserProfileImage())
                .createdAt(userEntity.getUserCreatedAt())
                .role(SocialRole.USER)
                .build();
    }
    
    // SocialEntity 업데이트
    public void updateSocialEntity(SocialEntity entity, OAuth2User oauth2User) {
        Map<String, Object> attributes = oauth2User.getAttributes();
        
        if (entity.getAuthProvider() == AuthProvider.GOOGLE) {
            entity.updateOAuthInfo(
                (String) attributes.get("name"),
                (String) attributes.get("picture"),
                AuthProvider.GOOGLE
            );
        } else if (entity.getAuthProvider() == AuthProvider.KAKAO) {
            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");
            
            entity.updateOAuthInfo(
                (String) profile.get("nickname"),
                (String) profile.get("profile_image_url"),
                AuthProvider.KAKAO
            );
        }
    }
    
    // UserEntity 업데이트 (SocialEntity 정보로)
    public void updateUserFromSocial(UserEntity userEntity, SocialEntity socialEntity) {
        userEntity.setUserName(socialEntity.getName());
        userEntity.setUserProfileImage(socialEntity.getPicture());
        userEntity.setUserCreatedAt(socialEntity.getCreatedAt());
    }
}