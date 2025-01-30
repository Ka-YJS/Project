package com.korea.travel.service;

import org.springframework.stereotype.Service;

import com.korea.travel.dto.LikeDTO;
import com.korea.travel.model.LikeEntity;
import com.korea.travel.model.PostEntity;
import com.korea.travel.model.UserEntity;
import com.korea.travel.persistence.LikeRepository;
import com.korea.travel.persistence.PostRepository;
import com.korea.travel.persistence.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class LikeService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final LikeRepository likeRepository;

    // 좋아요 추가
    @Transactional
    public LikeDTO addLike(Long userId, Long postId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User with ID " + userId + " not found"));
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));

        // 이미 좋아요를 눌렀는지 확인
        if (likeRepository.findByUserEntityAndPostEntity(user, post).isEmpty()) {
            LikeEntity like = new LikeEntity();
            like.setUserEntity(user);  // 유저 설정
            like.setPostEntity(post);  // 게시글 설정
            likeRepository.save(like);  // 좋아요 저장
        }

        // 좋아요 추가 후 DTO 반환
        return new LikeDTO(null, userId, postId);  // `null` 대신 실제 ID 값 설정 가능
    }

    // 좋아요 삭제
    @Transactional
    public LikeDTO removeLike(Long userId, Long postId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User with ID " + userId + " not found"));
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));

        LikeEntity like = likeRepository.findByUserEntityAndPostEntity(user, post)
                .orElseThrow(() -> new IllegalArgumentException("Like not found for user " + userId + " and post " + postId));
        likeRepository.delete(like);  // 좋아요 삭제

        // 삭제 후 DTO 반환
        return new LikeDTO(null, userId, postId);  // `null` 대신 실제 ID 값 설정 가능
    }

    // 특정 게시물에 대한 좋아요 수
    public int getLikeCount(Long postId) {
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));
        return post.getLikeCount();  // `PostEntity`에서 좋아요 수를 가져옵니다.
    }

    // 특정 게시물에 대해 사용자가 좋아요를 눌렀는지 확인
    public boolean isLiked(Long userId, Long postId) {
        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User with ID " + userId + " not found"));
        PostEntity post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post with ID " + postId + " not found"));

        // 사용자와 게시물에 해당하는 좋아요가 존재하는지 확인
        return likeRepository.findByUserEntityAndPostEntity(user, post).isPresent();
    }
}