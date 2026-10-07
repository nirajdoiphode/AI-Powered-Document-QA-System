package com.nexis.dev.RagSystem.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController()
@RequestMapping("api/ollama")
@CrossOrigin()
public class OllamaController {

    ChatClient chatClient;

    public OllamaController(OllamaChatModel chatmodel) {

        this.chatClient=ChatClient.create(chatmodel);
    }

    @GetMapping("/{message}")
    public ResponseEntity<String> getAnswer(@PathVariable String message)
    {
        String response=chatClient.prompt(message).call().content();
        return ResponseEntity.ok(response);

    }
}

