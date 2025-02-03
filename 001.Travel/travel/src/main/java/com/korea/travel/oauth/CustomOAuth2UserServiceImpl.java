package com.korea.travel.oauth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.persistence.SocialRepository;
import com.korea.travel.security.CustomOAuth2User;
import lombok.extern.slf4j.Slf4j;
import java.util.Map;

@Slf4j
@Service
public class CustomOAuth2UserServiceImpl extends DefaultOAuth2UserService {
   
   @Autowired
   private SocialRepository socialRepository;
   
   @Override 
   public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
       OAuth2User oauth2User = super.loadUser(userRequest);
       Map<String, Object> attributes = oauth2User.getAttributes();
       
       String email;
       String name;
       String picture;
       String socialId;
       String provider = userRequest.getClientRegistration().getRegistrationId();

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

       SocialEntity socialEntity = socialRepository.findByEmail(email)
           .map(entity -> entity.update(name, picture))
           .orElse(SocialEntity.builder()
                   .email(email)
                   .name(name)
                   .picture(picture)
                   .socialId(socialId)
                   .provider(provider)
                   .build());
                   
       socialEntity = socialRepository.save(socialEntity);
       log.info("OAuth2 user processed - email: {}, provider: {}", email, provider);

       return new CustomOAuth2User(email, name, picture, socialId, provider, attributes);
   }
}