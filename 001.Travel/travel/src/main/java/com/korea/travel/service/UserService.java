package com.korea.travel.service;

import java.io.File;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.korea.travel.dto.UserDTO;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.UserRepository;
import com.korea.travel.security.TokenProvider;

import io.jsonwebtoken.io.IOException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class UserService {
	
	private final UserRepository repository;
	
	private final PasswordEncoder passwordEncoder;
	
	private final TokenProvider tokenProvider;
	
	
	
	
	
	//userId가 있는지 중복체크
	public boolean getUserIds(UserDTO dto) {
		
		//중복 userId가 없으면 true
		if(!repository.existsByUserId(dto.getUserId())) {
			return true;
		}else{
			return false;
		}
		
	}
	
	
	//회원가입
	public boolean signup(UserDTO dto) {
		
		UserEntity user = UserEntity.builder()
				.userId(dto.getUserId())
				.userName(dto.getUserName())
				.userNickName(dto.getUserNickName())
				.userPhoneNumber(dto.getUserPhoneNumber())
				.userPassword(passwordEncoder.encode(dto.getUserPassword()))
				.userCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")))
				.build();
		//user저장완료시 true;
		if(user != null) {
			repository.save(user);
			return true;
		}else {
			return false;
		}
		
		
	}
	
	
	//Id찾기
	public UserDTO userFindId(UserDTO dto) {
      
		UserEntity user = repository.findByUserNameAndUserPhoneNumber(dto.getUserName(),dto.getUserPhoneNumber());
		if(user != null) {
			return UserDTO.builder()
               .userId(user.getUserId())
               .build();
		}else {
			throw new IllegalStateException("User not found");
		}
	}
   
	// 비밀번호 찾기 (사용자 정보 확인)
    public UserDTO userFindPassword(UserDTO dto) {
        // 아이디, 이름, 전화번호로 사용자 조회
        UserEntity user = repository.findByUserIdAndUserNameAndUserPhoneNumber(
            dto.getUserId(), 
            dto.getUserName(), 
            dto.getUserPhoneNumber()
        );
        
        if (user != null) {
            return UserDTO.builder()
                .userId(user.getUserId())
                .userName(user.getUserName())
                .build();
        }else {
        	return null;
        }
        
    }

    // 비밀번호 초기화
    @Transactional
    public boolean userResetPassword(UserDTO dto) {
        // 아이디로 사용자 조회
        UserEntity user = repository.findByUserId(dto.getUserId());
        
        if (user != null) {
            // 새 비밀번호 암호화하여 저장
            user.setUserPassword(passwordEncoder.encode(dto.getUserPassword()));
            repository.save(user);
            return true;
        }
        
        return false;
    }
	
	
	//로그인(로그인할때 토큰생성)
	public UserDTO getByCredentials(UserDTO dto) {
		
		UserEntity user = repository.findByUserId(dto.getUserId());		
		
		//user가 존재하면 /DB에 저장된 암호화된 비밀번호와 사용자에게 입력받아 전달된 암호화된 비밀번호를 비교
		if(user != null && passwordEncoder.matches(dto.getUserPassword(),user.getUserPassword())) {
			//토큰생성(180분설정해둠)
			final String token = tokenProvider.create(user);
						
			return UserDTO.builder()
				.id(user.getId())
				.userId(user.getUserId())
				.userName(user.getUserName())
				.userNickName(user.getUserNickName())
				.userPassword(user.getUserPassword())
				.userProfileImage(user.getUserProfileImage())
				.token(token)
				.build();
		}else {
			return null;
		}
		
	}
	
	
	//구글 로그인정보가져오기
	public UserDTO verifyAndGetUserInfo(String credential) throws Exception {
	    String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential;
	    System.out.println("ssssssssssss"+tokenInfoUrl);
	    RestTemplate restTemplate = new RestTemplate();
	    ResponseEntity<Map> response = restTemplate.getForEntity(tokenInfoUrl, Map.class);
	    System.out.println(response);
	    if (response.getStatusCode() != HttpStatus.OK) {
	        throw new Exception("Invalid ID token");
	    }
	    System.out.println("ssssssssssss"+response.getBody());
	    Map<String, Object> tokenInfo = response.getBody();
	    String email = (String) tokenInfo.get("email");
	    String name = (String) tokenInfo.get("name");

	    // Google 정보를 UserDTO에 매핑
	    UserDTO userDTO = UserDTO.builder()
	        .userId(email)                // 이메일을 UserId로 설정
	        .userName(name)               // 이름 설정
	        .build();

	    return userDTO;
	}
	
	
	//userPassword 수정하기
	public boolean userPasswordEdit (Long id,UserDTO dto) {
		
		Optional <UserEntity> user = repository.findById(id);
		
		if(user.isPresent()) {	
			//기존 비밀번호맞으면 true
			if(passwordEncoder.matches(dto.getUserPassword(),user.get().getUserPassword())) {				
				//기존 비밀번호랑 변경하려는 비밀번호가 다르면 true
				if(!passwordEncoder.matches(dto.getNewPassword(),user.get().getUserPassword())) {
					UserEntity entity = user.get();
					entity.setUserPassword(passwordEncoder.encode(dto.getNewPassword()));
					repository.save(entity);
					return true;
					
				}else {
					//변경하려는 비밀번호가 기존 비밀번호랑 똑같으면 false
					System.out.println("변경하려는 비밀번호가 기존 비밀번호랑 똑같다");
					return false;
				}
				
			}else {
				//user 비밀번호랑 받아온 비밀번호랑 다르면 false
				System.out.println("비밀번호 틀림");
				return false;
			}
			
		} else {
			//user 존재하지않으면 false
			return false;
		}
		
	}
		
	
	//userNickName 수정하기
    public UserDTO userNickNameEdit(Long id,UserDTO dto) {
    	
    	Optional <UserEntity> user = repository.findById(id);
    	
    	//유저 확인
    	if(user.isPresent() && user.get().getUserNickName() != dto.getUserNickName()) {    		
    		UserEntity entity = user.get();    		
			//변경된 userNickName 저장
			entity.setUserNickName(dto.getUserNickName());
    		repository.save(entity);
    		//변경된 userNickName 반환
    		return UserDTO.builder()
    				.userNickName(entity.getUserNickName())
    				.build();
		} else {
			System.out.println("유저가 존재하지않거나 닉네임이 같다");
			return null;
		}    	
    	
    }
    
  //프로필사진 수정
    public UserDTO userProfileImageEdit(Long id, MultipartFile file) {
    	
        try {
            //ID로 사용자 정보 확인 (UserEntity 찾기)
            UserEntity userEntity = repository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));
            
            //기존 프로필 사진 삭제 처리
            String existingUserProfileImage = userEntity.getUserProfileImage();
            //기존 프로필 파일이 없거나 null이면 true
            if (existingUserProfileImage != null && !existingUserProfileImage.isEmpty()) {
            	//저장된 file 경로로 수정
                String existingFilePath = "/home/ubuntu/app"+existingUserProfileImage;
                File existingFile = new File(existingFilePath);	//객체 생성
                if (existingFile.exists()) {	//해당 파일이있으면 true
                    if (existingFile.delete()) {
                        System.out.println("기존 프로필이미지가 삭제되었습니다: " + existingFilePath);
                    } else {
                        System.err.println("기존 프로필이미지 삭제 실패: " + existingFilePath);
                    }
                }
            }
            
            //파일경로 지정
            String uploadDir = "/home/ubuntu/app/uploads/profilePictures/";
            String fileName = file.getOriginalFilename().replaceAll("[\\s\\(\\)]", "_");
            //filePath - file 저장할 경로
            String filePath = uploadDir + id + "_" + fileName;
            
            File dest = new File(filePath);			//파일객체 생성
            File parentDir = dest.getParentFile();	//부모 디렉토리 경로 추출
            if (!parentDir.exists()) {	//부모 디렉토리가 없으면 true
            	parentDir.mkdirs();		// 디렉토리 생성
            }
            
            
            try {
                file.transferTo(dest);	//파일 저장
                System.out.println("파일저장완료");
            } catch (IOException e) {
                System.err.println("파일 저장 실패: " + e.getMessage());
                e.printStackTrace();  // 스택 트레이스 출력
                throw new RuntimeException("파일 저장 중 오류가 발생했습니다.", e);
            }
            
            //filePath는 파일저장 경로지 불러올때는 fileUrl로 불러와야한다.
            //fileUrl - file 불러올 경로 db 에 저장
            String fileUrl = "/uploads/profilePictures/" + id + "_" + fileName;
            
            //UserEntity에 프로필 사진 경로 업데이트
            userEntity.setUserProfileImage(fileUrl);
            repository.save(userEntity);  // UserEntity 업데이트 저장
            
            //업데이트된 UserEntity를 UserDTO로 변환하여 반환
            return UserDTO.builder().
            		userProfileImage(userEntity.getUserProfileImage())
            		.build();
            
        } catch (IOException e) {
            //파일 저장 오류 처리
            throw new RuntimeException("프로필이미지 업로드 중 오류가 발생했습니다.", e);
        } catch (Exception e) {
            //다른 예외 처리
            throw new RuntimeException("프로필이미지 수정 중 오류가 발생했습니다.", e);
        }
    }

    
    //프로필사진 삭제
    public boolean userProfileImageDelete (Long id) {
    	
    	UserEntity userEntity = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        //기존 프로필 사진 삭제 처리
        String existingUserProfileImage = userEntity.getUserProfileImage();
        //기존 프로필 파일이 없거나 null이면 true
        if (existingUserProfileImage != null && !existingUserProfileImage.isEmpty()) {
        	//저장된 file 경로로 수정
        	String existingFilePath = System.getProperty("user.dir")+existingUserProfileImage;
            File existingFile = new File(existingFilePath);	//객체 생성
            if (existingFile.exists()) {	//해당 파일이있으면 true
                if (existingFile.delete()) {
                    System.out.println("기존 프로필이미지가 삭제되었습니다: " + existingFilePath);
                } else {
                    System.err.println("기존 프로필이미지 삭제 실패: " + existingFilePath);
                }
            }
            userEntity.setUserProfileImage(null);
            repository.save(userEntity);
            return true;
        }else {
        	throw new IllegalArgumentException("프로필 사진이 없습니다.");
        }
        
    }
    
    
    //로그아웃
    public boolean logout (Long id) {
    	Optional<UserEntity> user = repository.findById(id);
    	
    	if(user.isPresent()) {
    		UserDTO.builder()
	    		.id(null)
				.userId(null)
				.userName(null)
				.userNickName(null)
				.userPassword(null)
				.userProfileImage(null)
				.token(null)
				.build();
    		return true;
    	}else {
    		return false;
    	}
    	
    }
    
    
    //회원탈퇴
    public boolean userWithdrawal (Long id, UserDTO dto) {
    	
    	Optional<UserEntity> user = repository.findById(id);
    	//유저존재&&비밀번호 맞으면 유저삭제후 true
    	if(user.isPresent() && passwordEncoder.matches(dto.getUserPassword(),user.get().getUserPassword())) {
			UserEntity entity = user.get();
    		repository.delete(entity);
    		return true;    		
    	}else {
			return false;
		}
    	
    }
    
    
}
