package com.nexis.dev.RagSystem.model;

import lombok.Data;

import java.util.List;
@Data
public class AiResponseDTO {
    private String content;
    private String model;

    private Integer promptTokens;
    private Integer completionTokens;
    private Integer totalTokens;

    private String finishReason;
    private List<?> media;
    private List<?> toolCalls;



}
