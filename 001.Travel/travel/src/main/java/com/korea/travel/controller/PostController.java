package com.korea.travel.controller;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.korea.travel.dto.PostDTO;
import com.korea.travel.dto.ResponseDTO;
import com.korea.travel.model.PostEntity;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.LikeRepository;
import com.korea.travel.persistence.PostRepository;
import com.korea.travel.persistence.UserRepository;
import com.korea.travel.service.PostService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/travel")
@CrossOrigin(origins = "https://countryrat.site") // React 앱이 동작하는 주소
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
	
	private final UserRepository userRepository;
	
	private final PostRepository postRepository;

    // 게시판 전체 조회
    @GetMapping("/posts")
    public ResponseEntity<?> getAllPosts() {
        List<PostDTO> dtos = postService.getAllPosts();
        ResponseDTO<PostDTO> response = ResponseDTO.<PostDTO>builder().data(dtos).build();
        return ResponseEntity.ok(response);
    }
    
    // 마이 게시판 조회
    @GetMapping("/myPosts/{userId}")
    public ResponseEntity<?> getMyPosts(@PathVariable Long userId){
    	List<PostDTO> dtos = postService.getMyPosts(userId);
        ResponseDTO<PostDTO> response = ResponseDTO.<PostDTO>builder().data(dtos).build();
        return ResponseEntity.ok(response);
    }
    
    // 게시글 한 건 조회
    @GetMapping("/posts/postDetail/{id}")
    public ResponseEntity<?> getPostById(@PathVariable Long id) {
        List<PostDTO> dtos = List.of(postService.getPostById(id));
        ResponseDTO<PostDTO> response = ResponseDTO.<PostDTO>builder().data(dtos).build();
        return ResponseEntity.ok(response);
    }

    // 게시글 작성 + 이미지 업로드
    @PostMapping(value = "/write/{userId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> createPost(
    		@PathVariable Long userId,
            @RequestPart("postTitle") String postTitle,
            @RequestPart("postContent") String postContent,
            @RequestPart(value = "placeList", required = false) String placeList,
            @RequestPart("userNickName") String userNickName,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
    	// 유저 ID를 통해 UserEntity 가져오기
    	
        Optional<UserEntity> userOptional = userRepository.findById(userId);
        if (!userOptional.isPresent()) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);  // 유저가 없으면 오류 반환
        }
        UserEntity user = userOptional.get();  // UserEntity 가져오기

        // 서비스 호출 및 DTO 빌드
        PostDTO postDTO = new PostDTO();
        postDTO.setPostTitle(postTitle);
        postDTO.setPostContent(postContent);
        if (placeList != null && !placeList.trim().isEmpty()) {
            postDTO.setPlaceList(Arrays.asList(placeList.split(", ")));
        }
        postDTO.setUserNickname(userNickName);
        postDTO.setUserEntity(user);
        postDTO.setPostCreatedAt(LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
              
        // 파일 저장 로직 호출
        if (files != null && !files.isEmpty()) {
        	List<String> imageUrls = postService.saveFiles(files);
            imageUrls = postService.saveFiles(files);
            postDTO.setImageUrls(imageUrls);
        }

        PostDTO createdPost = postService.createPost(postDTO);
        return ResponseEntity.ok(createdPost);
    }
    
    
    //게시글 수정
    @PutMapping(value = "/posts/postEdit/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> updatePost(
            @PathVariable Long id,
            @RequestPart("postTitle") String postTitle,
            @RequestPart("postContent") String postContent,
            @RequestPart("userNickName") String userNickName,
            @RequestPart(value = "placeList", required = false) String placeList,
            @RequestPart(value = "files", required = false) List<MultipartFile> files,
            @RequestPart(value = "existingImageUrls", required = false) String existingImageUrlsJson) {

        // JSON 문자열을 List<String>으로 변환
        ObjectMapper objectMapper = new ObjectMapper();
        List<String> existingImageUrls = new ArrayList<>();
        try {
            if (existingImageUrlsJson != null && !existingImageUrlsJson.isEmpty()) {
                existingImageUrls = objectMapper.readValue(existingImageUrlsJson, new TypeReference<List<String>>() {});
            }
        } catch (JsonProcessingException e) {
            throw new RuntimeException("existingImageUrls JSON 파싱 중 오류 발생", e);
        }
        
     // placeList가 null이거나 비어 있으면 빈 리스트 전달
        List<String> placeListParsed = placeList != null && !placeList.trim().isEmpty()
                ? Arrays.asList(placeList.split(", "))
                : null;
        
        // 업데이트 로직 수행
        PostDTO updatedPost = postService.updatePost(
            id,
            postTitle,
            postContent,
            placeListParsed,
            userNickName,
            files,
            existingImageUrls
        );

        return ResponseEntity.ok(updatedPost);
    }




    // 게시글 삭제
    @DeleteMapping("/postDelete/{id}")
    public boolean deletePost(@PathVariable Long id) {
        return postService.deletePost(id);
    }
}
