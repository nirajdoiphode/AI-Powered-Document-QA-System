package com.nexis.dev.RagSystem.service;

import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DocumentInjection {


    private VectorStore vectorStore;
    private TokenTextSplitter splitter=TokenTextSplitter.builder()
            .withChunkSize(800).build();

    public DocumentInjection(VectorStore vectorStore)
    {this.vectorStore=vectorStore;}


    public void inject(String content,String source, String fileHash)
    {
        Document document=new Document(content, Map.of("source", source, "fileHash", fileHash));

        List<Document> chunk=splitter.apply(List.of(document));
        vectorStore.add(chunk);
    }

    public boolean alreadyIndexed(String fileHash)
    {
        List<Document> existing=vectorStore.similaritySearch(
                SearchRequest.builder().query("duplicate file check").filterExpression(
                        "fileHash == '"+fileHash+"'").topK(1).similarityThreshold(0.0).build());

        return !existing.isEmpty();
    }


}
