package com.korea.travel.dto;


import java.util.List;

import com.korea.travel.model.UserEntity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PostDTO {
	
	private Long postId;			//고유 id
	private Long userId;
	private String postTitle;		//게시글제목
	private String postContent;		//게시글내용
	private String userNickname;
	private List<String> placeList;
	private List<String> imageUrls;
	private String thumbnail;
	private int likes;
	private String postCreatedAt;	//게시글등록시간
	private UserEntity userEntity;  
	
}

