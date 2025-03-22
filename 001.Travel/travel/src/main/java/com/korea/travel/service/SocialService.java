package com.korea.travel.service;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import com.korea.travel.dto.SocialDTO;
import com.korea.travel.dto.UserDTO;
import com.korea.travel.mapper.UserMapper;
import com.korea.travel.model.SocialEntity;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.SocialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class SocialService {
   private final SocialRepository socialRepository;
   
   @Autowired
   private UserMapper userMapper;
   
   public UserDTO getUserDTO(UserEntity userEntity) {
       UserDTO result = userMapper.toUserDTO(userEntity);
       return result;
   }
   
   @Transactional
   public void handleOAuthLogin(OAuth2User oauth2User, String provider) {
       log.info("=== Starting OAuth Login Process ===");
       log.info("Raw OAuth2User attributes: {}", oauth2User.getAttributes());  // 원본 데이터 확인
       
       try {
           SocialDTO.dto socialDTO = SocialDTO.dto.of(
               provider,
               "sub",  // userNameAttributeName
               oauth2User.getAttributes()
           );
           
           // DTO 생성 직후 값 확인
           log.info("Created DTO values - name: {}, email: {}, socialId: {}, provider: {}", 
               socialDTO.getName(),
               socialDTO.getEmail(),
               socialDTO.getSocialId(),
               socialDTO.getAuthProvider()
           );
           
           saveOrUpdate(socialDTO);
       } catch (Exception e) {
           log.error("Error during OAuth login: ", e);
           log.error("Provider: {}", provider);
           log.error("OAuth2User attributes: {}", oauth2User.getAttributes());
           throw e;
       }
   }
   
   @Transactional
   public SocialEntity saveOrUpdate(SocialDTO.dto socialDTO) {
       log.info("=== Starting saveOrUpdate ===");
       log.info(String.format("Received socialDTO - socialId: %s, name: %s, email: %s", 
               socialDTO.getSocialId(), 
               socialDTO.getName(), 
               socialDTO.getEmail()));
       
       try {
           SocialEntity user = socialRepository.findBySocialId(socialDTO.getSocialId())
                   .map(entity -> {
                       log.info("Updating existing user with socialId: {}", entity.getSocialId());
                       return entity.update(socialDTO.getName(), 
                                          socialDTO.getEmail(), 
                                          socialDTO.getPicture());
                   })
                   .orElse(socialDTO.toEntity());
           
           SocialEntity savedUser = socialRepository.save(user);
           return savedUser;
       } catch (Exception e) {
    	    log.error("Error in saveOrUpdate: ", e);
    	    log.error("Error message: {}", e.getMessage());
    	    log.error("DTO info - socialId: {}, name: {}, email: {}", 
    	        socialDTO.getSocialId(), 
    	        socialDTO.getName(), 
    	        socialDTO.getEmail());
    	    throw e;
    	}
   }
   
   @Transactional(readOnly = true)
   public SocialEntity findBySocialId(String socialId) {
       log.info("=== Finding user by socialId: {} ===", socialId);
       try {
           SocialEntity result = socialRepository.findBySocialId(socialId)
                   .orElseThrow(() -> new RuntimeException("User not found with socialId: " + socialId));
           log.info("Found user: {}", result);
           return result;
       } catch (Exception e) {
           log.error("Error finding user by socialId: ", e);
           throw e;
       }
   }
   
   /**
    * 소셜 ID로 사용자를 찾고, 없으면 null 반환 (예외 발생하지 않음)
    */
   @Transactional(readOnly = true)
   public SocialEntity findBySocialIdSafe(String socialId) {
       log.info("=== Safely finding user by socialId: {} ===", socialId);
       try {
           return socialRepository.findBySocialId(socialId).orElse(null);
       } catch (Exception e) {
           log.error("Error safely finding user by socialId: ", e);
           return null;
       }
   }
   
   @Transactional
   public void updateUserInfo(String socialId, String name, String picture) {
       log.info("=== Starting updateUserInfo ===");
       log.info("Updating user - socialId: {}, name: {}", socialId, name);
       
       try {
           SocialEntity user = findBySocialId(socialId);
           user.updateInfo(name, picture);
           log.info("Successfully updated user info");
       } catch (Exception e) {
           log.error("Error updating user info: ", e);
           throw e;
       }
   }
   
   @Transactional
   public void updateOAuthUserInfo(String socialId, OAuth2User oauth2User, String provider) {
       log.info("=== Starting updateOAuthUserInfo ===");
       log.info("SocialId: {}, Provider: {}", socialId, provider);
       log.info("OAuth2User attributes: {}", oauth2User.getAttributes());
       
       try {
           SocialEntity user = findBySocialId(socialId);
           userMapper.updateSocialEntity(user, oauth2User);
           log.info("Successfully updated OAuth user info");
       } catch (Exception e) {
           log.error("Error updating OAuth user info: ", e);
           throw e;
       }
   }
   
   @Transactional
   public void deleteUser(String socialId) {
       log.info("=== Starting deleteUser ===");
       log.info("Deleting user with socialId: {}", socialId);
       
       try {
           SocialEntity user = findBySocialId(socialId);
           socialRepository.delete(user);
           log.info("Successfully deleted user");
       } catch (Exception e) {
           log.error("Error deleting user: ", e);
           throw e;
       }
   }
   
   @Transactional(readOnly = true)
   public boolean existsByEmail(String email) {
       log.info("=== Checking if email exists: {} ===", email);
       return socialRepository.existsByEmail(email);
   }
   
   @Transactional(readOnly = true)
   public boolean existsBySocialId(String socialId) {
       log.info("=== Checking if socialId exists: {} ===", socialId);
       return socialRepository.existsBySocialId(socialId);
   }
   
   @Transactional
   public UserEntity convertToUserEntity(String socialId) {
       log.info("=== Starting convertToUserEntity ===");
       log.info("Converting user with socialId: {}", socialId);
       
       try {
           SocialEntity socialEntity = findBySocialId(socialId);
           UserEntity result = userMapper.socialToUserEntity(socialEntity);
           log.info("Successfully converted to UserEntity");
           return result;
       } catch (Exception e) {
           log.error("Error converting to UserEntity: ", e);
           throw e;
       }
   }
   
   /**
    * 소셜 ID로 UserEntity 생성 또는 반환
    * PostService와 연동하기 위한 메서드
    */
   @Transactional
   public UserEntity createOrGetUserEntityFromSocialId(String socialId) {
       log.info("=== Creating or getting UserEntity from socialId: {} ===", socialId);
       
       try {
           // 접두사 제거
           String cleanSocialId = socialId;
           if (socialId.startsWith("google_")) {
               cleanSocialId = socialId.substring("google_".length());
           } else if (socialId.startsWith("kakao_")) {
               cleanSocialId = socialId.substring("kakao_".length());
           }
           
           // 소셜 사용자 엔티티 조회
           SocialEntity socialEntity = findBySocialIdSafe(cleanSocialId);
           
           if (socialEntity != null) {
               // 기존 매핑 메서드 활용 시
               if (userMapper != null) {
                   try {
                       UserEntity userEntity = userMapper.socialToUserEntity(socialEntity);
                       if (userEntity != null) {
                           log.info("Successfully created UserEntity from SocialEntity using mapper");
                           return userEntity;
                       }
                   } catch (Exception e) {
                       log.warn("Error using mapper to convert SocialEntity, falling back to manual creation: {}", e.getMessage());
                   }
               }
               
               // 매핑 실패 시 수동 생성
               UserEntity userEntity = new UserEntity();
               userEntity.setId(1L); // 임시 ID (실제 환경에서는 더 나은 방법 필요)
               userEntity.setUserNickName(socialEntity.getName());
               userEntity.setUserName(socialEntity.getName());
               log.info("Successfully created UserEntity manually from SocialEntity");
               return userEntity;
           } else {
               // 소셜 엔티티가 없을 경우 기본 사용자 생성
               log.warn("SocialEntity not found for id: {}, creating default UserEntity", cleanSocialId);
               UserEntity defaultUser = new UserEntity();
               defaultUser.setId(1L);
               defaultUser.setUserNickName("Guest");
               defaultUser.setUserName("Guest");
               return defaultUser;
           }
       } catch (Exception e) {
           log.error("Error creating UserEntity from socialId: ", e);
           throw new RuntimeException("소셜 사용자 변환 실패: " + e.getMessage(), e);
       }
   }
   
   public SocialDTO.Session createSession(SocialEntity entity) {
       log.info("=== Starting createSession ===");
       log.info("Creating session for entity: {}", entity);
       
       try {
           SocialDTO.Session session = userMapper.toSocialSession(entity);
           log.info("Successfully created session");
           return session;
       } catch (Exception e) {
           log.error("Error creating session: ", e);
           throw e;
       }
   }
}