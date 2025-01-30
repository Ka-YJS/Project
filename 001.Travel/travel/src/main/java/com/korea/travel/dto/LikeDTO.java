package com.korea.travel.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LikeDTO {
    
    private Long id; // 고유 id
    private Long userId; // 좋아요를 누른 유저의 ID
    private Long postId; // 좋아요가 눌린 게시글의 ID

}
