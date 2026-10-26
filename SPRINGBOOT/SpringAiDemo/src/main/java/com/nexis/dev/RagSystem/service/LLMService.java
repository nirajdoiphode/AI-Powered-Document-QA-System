package com.nexis.dev.RagSystem.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

@Service
public class LLMService {

    private ChatClient chatClient;

    public LLMService(GoogleGenAiChatModel chatModel, VectorStore vectorStore)
    {
        this.chatClient= ChatClient.builder(chatModel)
                .defaultAdvisors(QuestionAnswerAdvisor.builder(vectorStore)
                        .searchRequest(SearchRequest.builder()
                        .topK(4).similarityThreshold(0.7).build()).build()).build();


    }




//    public LLMService(ChatClient.Builder builder) {
//        this.chatClient = builder.build();

//    NOTE:
//        ABstractionn | only works whem there is no ambigious data ( mainly used with one model)
//        we can also use it with multpiple models but ChatCLient Beans are needed to be created .
//        @Qualifier() us used to choose which one to invoke
//    }


    public String getReponseService(String userprompt) {

        ChatResponse response = chatClient.prompt(userprompt).call().chatResponse();
//        System.out.println("Response:=-==:     "+response.getResults().get(0).getOutput().getText());
//        System.out.println("Model name:  "+aiResponseDTO.getModel());

        return response.getResults().get(0).getOutput().getText();
    }




}
