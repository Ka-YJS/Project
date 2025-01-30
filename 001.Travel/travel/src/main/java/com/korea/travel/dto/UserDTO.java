package com.korea.travel.dto;

import com.korea.travel.model.UserEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserDTO {

	private Long id;
	private String userId;			//유저Id
	private String userName; 		//유저이름
	private String userNickName;	//닉네임
	private String userPhoneNumber;	//전화번호
	private String userPassword;	//비밀번호
	private String newPassword;		//비밀번호
	private String userProfileImage;//프로필이미지
	private String token;			//토큰
	
	
	public UserDTO(UserEntity entity) {
		this.id = entity.getId();
		this.userId = entity.getUserId();
		this.userName = entity.getUserName();
		this.userNickName = entity.getUserNickName();
		this.userPhoneNumber = entity.getUserNickName();
		this.userPassword = entity.getUserPassword();
		this.userProfileImage = entity.getUserProfileImage();
	}
	
	
}
