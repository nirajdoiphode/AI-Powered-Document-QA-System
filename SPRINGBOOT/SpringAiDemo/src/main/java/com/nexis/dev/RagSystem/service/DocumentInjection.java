package com.nexis.dev.RagSystem.service;

import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class DocumentInjection {


    private VectorStore vectorStore;
    private TokenTextSplitter splitter = TokenTextSplitter.builder()
            .withChunkSize(800).build();

    public DocumentInjection(VectorStore vectorStore) {
        this.vectorStore = vectorStore;
    }

    private static final int BATCH_SIZE = 10;
    private static final long WAIT_BETWEEN_BATCHES_MS = 20_000L;

    private final AtomicInteger totalChunks = new AtomicInteger(0);
    private final AtomicInteger completedChunks = new AtomicInteger(0);
    private volatile String status = "IDLE";

    private void addChunksInBatches(List<Document> chunks) {

        for (int start = 0; start < chunks.size(); start += BATCH_SIZE) {
            int end = Math.min(start + BATCH_SIZE, chunks.size());
            List<Document> batch = new ArrayList<>(
                    chunks.subList(start, end)
            );

            System.out.println(
                    "Embedding batch: " + (start + 1) +" to " + end +" of " + chunks.size());

            vectorStore.add(batch);
            completedChunks.set(end);

            System.out.println(
                    "Progress: " +
                            end +
                            "/" +
                            chunks.size()
            );

            boolean lastBatch = end >= chunks.size();
            if (!lastBatch) {
                try {
                    System.out.println("Waiting before next embedding batch...");
                    Thread.sleep(WAIT_BETWEEN_BATCHES_MS);

                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException("Embedding process was interrupted", exception);
                }
            }
        }
    }

    public void inject(String content, String source, String fileHash) {
        Document document = new Document(content, Map.of("source", source, "fileHash", fileHash));

        List<Document> chunk = splitter.apply(List.of(document));
        totalChunks.set(chunk.size());
        completedChunks.set(0);
        status = "EMBEDDING";

        System.out.println("Chunk size: " + chunk.size());
//        addChunksInBatches(chunk);
        try {
            addChunksInBatches(chunk);
            status = "COMPLETED";
        } catch (RuntimeException exception) {
            status = "FAILED";
            throw exception;
        }
    }

    public Map<String, Object> getProgress() {

        int total = totalChunks.get();
        int completed = completedChunks.get();

        int percentage = total == 0
                ? 0
                : completed * 100 / total;

        return Map.of(
                "status", status,
                "totalChunks", total,
                "completedChunks", completed,
                "percentage", percentage
        );
    }

    public boolean alreadyIndexed(String fileHash) {
        List<Document> existing = vectorStore.similaritySearch(
                SearchRequest.builder().query("duplicate file check").filterExpression(
                        "fileHash == '" + fileHash + "'").topK(1).similarityThreshold(0.0).build());

        return !existing.isEmpty();
    }


}
