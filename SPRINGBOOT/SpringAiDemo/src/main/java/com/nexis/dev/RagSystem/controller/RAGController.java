package com.nexis.dev.RagSystem.controller;


import com.nexis.dev.RagSystem.service.DocumentInjection;
import com.nexis.dev.RagSystem.service.LLMService;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@RestController
@RequestMapping("/api/documents")
@CrossOrigin(origins = {"http://localhost:3000",
        "http://127.0.0.1:3000"})
public class RAGController {

    private DocumentInjection documentInjection;
    private LLMService LLMService;

    public RAGController(DocumentInjection documentInjection, LLMService LLMService)
    {
        this.documentInjection=documentInjection;
        this.LLMService = LLMService;
    }


    @PostMapping(value = "/ask",consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> askQuestion(@RequestPart(value = "file", required = false) MultipartFile file, @RequestPart("question") String question)
    {
//        if(file.isEmpty())
//        {
//            return ResponseEntity.badRequest().body("File is empty");
//        }
//        System.out.println("Received File: " + file.getOriginalFilename());
//        System.out.println("Size: " + file.getSize());

        try {
            if(file!= null ) {

                byte[] fileBytes = file.getBytes();
                String fileHash=calculateFileHash(fileBytes);

                if (!documentInjection.alreadyIndexed(fileHash))
                {
                    Tika tika = new Tika();

                    String extractedText = tika.parseToString(
                            file.getInputStream()
                    );

//            System.out.println(extractedText);

                    if (extractedText == null || extractedText.isBlank()) {
                        return ResponseEntity.badRequest().body("Could not extact Text from file");
                    }

                    documentInjection.inject(extractedText, file.getOriginalFilename(), fileHash);

                }

            }


            String answer= LLMService.getReponseService(question);

            return ResponseEntity.ok().body(answer);


        } catch (IOException | TikaException exception) {
            return ResponseEntity.internalServerError()
                    .body("Could not process file: " + exception.getMessage());
        }

//        return ResponseEntity.ok(file.getOriginalFilename());

    }


    private String calculateFileHash(byte[] fileBytes)
    {
        try{
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(fileBytes));
        }
        catch (NoSuchAlgorithmException ex)
        {
            throw new IllegalStateException(
                    "SHA-256 algorithm is not available",
                    ex
            );
        }

    }

}
