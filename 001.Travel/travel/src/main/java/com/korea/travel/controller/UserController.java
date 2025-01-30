package com.korea.travel.controller;

import java.util.Collections;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.korea.travel.dto.ResponseDTO;
import com.korea.travel.dto.UserDTO;
import com.korea.travel.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/travel")
@RequiredArgsConstructor
public class UserController {

	private final UserService service;
	
	
    //회원가입
    @PostMapping("/signup")
    public boolean signup(@RequestBody UserDTO dto) {
    	//저장 성공시 true
    	if(service.signup(dto)) {
    		return true;
    	}else {
    		return false;
    	}
        
    }
    
    
    //userId가 있는지 중복체크
    @PostMapping("/userIdCheck")
    public boolean userIdCheck (@RequestBody UserDTO dto) {
    	System.out.println(dto.getUserId());
    	//중복 userId가 없으면 true
    	if(service.getUserIds(dto)) {
    		return true;
    	}else {
    		return false;
    	}
    	
    }
    

    
    //로그인
    @PostMapping("/login")
    public ResponseEntity<?> authenticate(@RequestBody UserDTO dto) {
    	
        UserDTO userDTO = service.getByCredentials(dto);
                
        if(userDTO != null) {
        	return ResponseEntity.ok().body(userDTO);
        }else {
        	ResponseDTO responseDTO = ResponseDTO.builder()
        			.error("로그인 실패")
        			.build();
        	return ResponseEntity.badRequest().body(responseDTO);
        }
        
    }
    
    
    //구글로그인
    @PostMapping("/oauth2/google/callback")
    public ResponseEntity<?> handleGoogleCallback(@RequestBody Map<String, String> payload) {
        try {
            String credential = payload.get("credential");
            System.out.println("aaa0"+credential);
            if (credential == null || credential.isEmpty()) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Credential is missing or empty"));
            }

            // Google 정보 검증 및 UserDTO 생성
            UserDTO userDTO = service.verifyAndGetUserInfo(credential);

            return ResponseEntity.ok(userDTO);

        } catch (Exception e) {
            log.error("Unexpected error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body(Collections.singletonMap("error", e.getMessage()));
        }
    }
    
    
    //Id찾기
    @PostMapping("/userFindId")
    public ResponseEntity<?> userFindId(@RequestBody UserDTO dto){
    	
       UserDTO user = service.userFindId(dto);
       
       if(user != null) {
          return ResponseEntity.ok().body(user);
       }else {
           ResponseDTO responseDTO = ResponseDTO.builder()
                 .error("ID를 찾을수없습니다.")
                 .build();
           return ResponseEntity.badRequest().body(responseDTO);
        }
       
    }
    
    // 비밀번호 찾기 (사용자 정보 확인)
    @PostMapping("/userFindPassword")
    public ResponseEntity<?> findPassword(@RequestBody UserDTO dto) {
    	System.out.println(dto);
        UserDTO foundUser = service.userFindPassword(dto);
        
        if (foundUser != null) {
            return ResponseEntity.ok().body(foundUser);
        } else {
            ResponseDTO responseDTO = ResponseDTO.builder()
                    .error("일치하는 사용자를 찾을 수 없습니다.")
                    .build();
            return ResponseEntity.badRequest().body(responseDTO);
        }
    }

    //비밀번호 초기화
    @PostMapping("/userResetPassword")
    public ResponseEntity<?> resetPassword(@RequestBody UserDTO dto) {
        boolean isReset = service.userResetPassword(dto);
        
        if (isReset) {
            return ResponseEntity.ok().body(true);
        } else {
            ResponseDTO responseDTO = ResponseDTO.builder()
                    .error("비밀번호 재설정에 실패했습니다.")
                    .build();
            return ResponseEntity.badRequest().body(responseDTO);
        }
    }
    
    //userPassword 수정하기
    @PatchMapping("/userPasswordEdit/{id}")
    
    public boolean userPasswordEdit(@PathVariable Long id,@RequestBody UserDTO dto){
    	
        System.out.println("User ID: " + id);
        System.out.println("dto : " + dto);
        
        //변경완료 true
    	if(service.userPasswordEdit(id,dto)) {
    		return true;
    	}else {
    		return false;
    	}
    	
    }
    
    
    //userNickName 수정하기
    @PatchMapping("/userNickNameEdit/{id}")
    public ResponseEntity<?> userNickNameEdit(@PathVariable Long id,@RequestBody UserDTO dto){
    	
    	UserDTO userDTO = service.userNickNameEdit(id,dto);
    	
    	if(userDTO != null) {
        	return ResponseEntity.ok().body(userDTO);
        }else {
        	ResponseDTO responseDTO = ResponseDTO.builder()
        			.error("닉네임 변경 실패")
        			.build();
        	return ResponseEntity.badRequest().body(responseDTO);
        }
    	
    }
    
    
    //프로필사진 수정
    @PatchMapping("/userProfileImageEdit/{id}")
    public ResponseEntity<?> userProfileImageEdit(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        // 업로드된 파일의 정보 출력 (디버깅용)
        System.out.println("Received file: " + file.getOriginalFilename() + ", size: " + file.getSize());

        try {
            // 서비스 호출하여 프로필 사진 수정
            UserDTO updatedUserDTO = service.userProfileImageEdit(id, file);

            // 수정된 DTO 정보 출력 (디버깅용)
            System.out.println("수정완료: " + updatedUserDTO);

            // 성공적으로 수정된 UserDTO 반환
            return ResponseEntity.ok().body(updatedUserDTO);

        } catch (IllegalArgumentException e) {
            // 잘못된 사용자 ID 또는 업로드 문제 처리
            System.err.println("Invalid request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                 .body("Invalid request: " + e.getMessage());
        } catch (RuntimeException e) {
            // 파일 업로드 또는 저장 과정에서의 문제 처리
            System.err.println("Server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                                 .body("Error occurred during profile update: " + e.getMessage());
        }
    }

    

    //프로필사진 삭제
    @PatchMapping("/userProfileImageDelete/{id}")
    public boolean userProfileImageDelete(@PathVariable Long id) {
    	
    	//정상 삭제되었으면 true
    	if(service.userProfileImageDelete(id)) {
        	return true;
        }else {
        	return false;
        }
    	
    }
    
    //로그아웃
    @PostMapping("/logout/{id}")
    public boolean logout(@PathVariable Long id) {
    	
    	if(service.logout(id)) {
    		return true;
    	}else {
    		return false;
    	}
    	
    }
    

    //회원탈퇴
    @DeleteMapping("/withdraw/{id}")
    public boolean userWithdrawal(@PathVariable Long id,@RequestBody UserDTO dto){
    	//유저정보 삭제완료되었으면 true
    	if(service.userWithdrawal(id,dto)) {
    		return true;
    	}else {
    		return false;
    	}
    	
    }
    

}
