package com.korea.travel.oauth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.SocialEntity.AuthProvider;
import com.korea.travel.persistence.SocialRepository;
import com.korea.travel.oauth.CustomOAuth2User;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;
import java.time.LocalDateTime;

@Slf4j
@Service
public class CustomOAuth2UserServiceImpl extends DefaultOAuth2UserService {
   @Autowired
   private SocialRepository socialRepository;

   @Override
   public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
       try {
           OAuth2User oauth2User = super.loadUser(userRequest);
           Map<String, Object> attributes = oauth2User.getAttributes();
           
           log.info("OAuth2 attributes received: {}", attributes);
           
           String email;
           String name;
           String picture;
           String socialId;
           String provider = userRequest.getClientRegistration().getRegistrationId();
           
           // Provider 별 데이터 추출
           if (provider.equals("google")) {
               email = (String) attributes.get("email");
               name = (String) attributes.get("name");
               picture = (String) attributes.get("picture");
               socialId = (String) attributes.get("sub");
           } else if (provider.equals("kakao")) {
               Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
               Map<String, Object> kakaoProfile = (Map<String, Object>) kakaoAccount.get("profile");
               email = (String) kakaoAccount.get("email");
               name = (String) kakaoProfile.get("nickname");
               picture = (String) kakaoProfile.get("profile_image_url");
               socialId = String.valueOf(attributes.get("id"));
           } else {
               throw new OAuth2AuthenticationException("Unsupported provider: " + provider);
           }
           
           // 공통로그추가
           log.info("Final user data - provider: {}, socialId: {}, email: {}, name: {}", 
        		    provider, socialId, email, name);

           // 필수 데이터 유효성 검사
           if (email == null || socialId == null) {
               log.error("Essential OAuth2 data missing - email: {}, socialId: {}", email, socialId);
               throw new OAuth2AuthenticationException("Essential OAuth2 data missing");
           }

           log.info("Processing OAuth2 login - email: {}, socialId: {}, provider: {}", 
               email, socialId, provider);

           // 사용자 조회 또는 생성
           SocialEntity socialEntity = socialRepository.findBySocialId(socialId)
               .map(entity -> {
                   log.info("Updating existing user - socialId: {}", socialId);
                   entity.updateOAuthInfo(
                       name, 
                       picture, 
                       AuthProvider.valueOf(provider.toUpperCase())
                   );
                   return entity;
               })
               .orElseGet(() -> {
                   log.info("Creating new user - socialId: {}", socialId);
                   return SocialEntity.builder()
                       .email(email)
                       .name(name)
                       .picture(picture)
                       .socialId(socialId)
                       .authProvider(AuthProvider.valueOf(provider.toUpperCase()))
                       .createdAt(LocalDateTime.now().toString())
                       .build();
               });

           // 저장 및 로깅
           log.info("Before save - socialEntity: {}", socialEntity);
           socialEntity = socialRepository.save(socialEntity);
           log.info("After save - socialEntity: {}", socialEntity);

           return new CustomOAuth2User(socialEntity, attributes);
           
       } catch (Exception e) {
    	    log.error("Error during OAuth2 authentication", e);
    	    throw new OAuth2AuthenticationException(new OAuth2Error("authentication_error"), e);
    	}
   }
}