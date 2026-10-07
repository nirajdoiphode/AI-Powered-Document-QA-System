package com.nexis.dev.RagSystem.controller;



import com.nexis.dev.RagSystem.service.LLMService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.google.genai.GoogleGenAiChatModel;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gemini")
@CrossOrigin()
public class GeminiController {

    private ChatClient chatClient;

    @Autowired
    private LLMService LLMService;

    @Autowired
    public EmbeddingModel embeddingModel;

    @Autowired
    VectorStore vectorStore;


    public GeminiController(GoogleGenAiChatModel chatModel, VectorStore vectorStore)
    {
        this.chatClient=ChatClient.create(chatModel);
        this.vectorStore=vectorStore;
    }

    @GetMapping("/{message}")
    public Object getAnswer(@PathVariable String message)
    {
        return LLMService.getReponseService(message);
    }


    @GetMapping("/embedding/{message}")
    public Map<String, Object> getEmbedding(@PathVariable String message) {
        float[] vector = embeddingModel.embed(message);

        return Map.of(
                "dimension", vector.length,
                "firstValues", Arrays.copyOf(vector, 5)
        );
    }

    @PostMapping("/test-document")
    public String testDocuments(@RequestBody String content)
    {
        Document document=new Document(content);
        vectorStore.add(List.of(document));
        return "Document added successfully";
    }

    @GetMapping("/test-search")
    public String testSearch(@RequestParam String query)
    {
        return vectorStore.similaritySearch(SearchRequest.builder().query(query).topK(4).build()).toString();
    }



}
