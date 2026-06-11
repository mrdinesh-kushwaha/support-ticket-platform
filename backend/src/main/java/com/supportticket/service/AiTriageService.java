package com.supportticket.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.supportticket.config.AppProperties;
import com.supportticket.enums.TicketCategory;
import com.supportticket.enums.TicketPriority;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiTriageService {

    private final WebClient webClient;
    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;

    public record TriageResult(TicketCategory category, TicketPriority priority, String suggestedResponse) {}

    public TriageResult triageTicket(String title, String description) {
        String apiKey = appProperties.getAi().getAnthropic().getApiKey();

        if (apiKey == null || apiKey.isBlank()) {
            log.info("No Anthropic API key — using rule-based fallback triage");
            return fallbackTriage(title, description);
        }

        try {
            return callAnthropicApi(title, description, apiKey);
        } catch (Exception e) {
            log.warn("AI triage failed ({}), using fallback", e.getMessage());
            return fallbackTriage(title, description);
        }
    }

    private TriageResult callAnthropicApi(String title, String description, String apiKey) throws Exception {
        String prompt = buildPrompt(title, description);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", appProperties.getAi().getAnthropic().getModel());
        requestBody.put("max_tokens", 512);
        requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));

        String responseJson = webClient.post()
                .uri(appProperties.getAi().getAnthropic().getBaseUrl() + "/v1/messages")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return parseAiResponse(responseJson, title, description);
    }

    private String buildPrompt(String title, String description) {
        return """
                You are a support ticket triage assistant. Analyze the following support ticket and respond ONLY with a valid JSON object (no markdown, no extra text).
                
                Ticket Title: %s
                Ticket Description: %s
                
                Respond with exactly this JSON structure:
                {
                  "category": "<one of: BILLING, TECHNICAL_ISSUE, ACCOUNT_ACCESS, FEATURE_REQUEST, GENERAL_INQUIRY>",
                  "priority": "<one of: LOW, MEDIUM, HIGH, CRITICAL>",
                  "suggestedResponse": "<a professional draft response the agent can send to the customer, 2-3 sentences>"
                }
                
                Rules:
                - CRITICAL: system down, data loss, security breach, cannot access account at all
                - HIGH: major feature broken, billing issue, significant impact
                - MEDIUM: partial functionality issues, general questions with some urgency
                - LOW: feature requests, minor questions, feedback
                """.formatted(title, description);
    }

    private TriageResult parseAiResponse(String responseJson, String title, String description) throws Exception {
        JsonNode root = objectMapper.readTree(responseJson);
        String content = root.path("content").get(0).path("text").asText();

        // Strip possible markdown code fences
        content = content.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

        JsonNode parsed = objectMapper.readTree(content);

        TicketCategory category = safeCategory(parsed.path("category").asText());
        TicketPriority priority = safePriority(parsed.path("priority").asText());
        String suggestedResponse = parsed.path("suggestedResponse").asText();

        if (suggestedResponse.isBlank()) {
            suggestedResponse = generateFallbackResponse(category, title, description);
        }

        log.info("AI triage complete — category={} priority={}", category, priority);
        return new TriageResult(category, priority, suggestedResponse);
    }

    // ─── Rule-based fallback when no API key or API fails ───────────────────────

    private TriageResult fallbackTriage(String title, String description) {
        String combined = (title + " " + description).toLowerCase();

        TicketCategory category = detectCategory(combined);
        TicketPriority priority = detectPriority(combined, category);
        String suggestedResponse = generateFallbackResponse(category, title, description);

        log.debug("Fallback triage — category={} priority={}", category, priority);
        return new TriageResult(category, priority, suggestedResponse);
    }

    private TicketCategory detectCategory(String text) {
        if (text.matches(".*(bill|invoice|payment|charge|refund|subscription|price|cost|fee).*"))
            return TicketCategory.BILLING;
        if (text.matches(".*(login|password|reset|access|locked|account|sign.?in|2fa|authenticat).*"))
            return TicketCategory.ACCOUNT_ACCESS;
        if (text.matches(".*(bug|error|crash|broken|not work|issue|problem|fail|exception|500|404).*"))
            return TicketCategory.TECHNICAL_ISSUE;
        if (text.matches(".*(feature|request|suggest|improve|add|would like|wish|enhancement).*"))
            return TicketCategory.FEATURE_REQUEST;
        return TicketCategory.GENERAL_INQUIRY;
    }

    private TicketPriority detectPriority(String text, TicketCategory category) {
        if (text.matches(".*(urgent|critical|emergency|down|outage|data loss|security|breach|cannot access|system.*down).*"))
            return TicketPriority.CRITICAL;
        if (text.matches(".*(high|important|asap|as soon as|not working|broken|major|significant).*"))
            return TicketPriority.HIGH;
        if (category == TicketCategory.BILLING || category == TicketCategory.ACCOUNT_ACCESS)
            return TicketPriority.HIGH;
        if (category == TicketCategory.TECHNICAL_ISSUE)
            return TicketPriority.MEDIUM;
        if (category == TicketCategory.FEATURE_REQUEST)
            return TicketPriority.LOW;
        return TicketPriority.MEDIUM;
    }

   private String generateFallbackResponse(TicketCategory category, String title, String description) {
    String issueSummary = buildIssueSummary(title, description);

    return switch (category) {
        case BILLING -> String.format(
                "Hi,%n%n" +
                "Thank you for contacting SupportPro. We have received your billing-related request about \"%s\" and our support team is reviewing the details.%n%n" +
                "Please keep this ticket open while we verify the information. We will update you as soon as we have a clear resolution.%n%n" +
                "Thank you for your patience.",
                issueSummary
        );

        case TECHNICAL_ISSUE -> String.format(
                "Hi,%n%n" +
                "Thank you for reporting this technical issue about \"%s\". Our support team has received your request and will investigate the problem carefully.%n%n" +
                "Please share any screenshots, error messages, or steps to reproduce the issue if available. We will update you as soon as possible.%n%n" +
                "Thank you for your patience.",
                issueSummary
        );

        case ACCOUNT_ACCESS -> String.format(
                "Hi,%n%n" +
                "Thank you for contacting SupportPro. We understand that you are facing an account access issue related to \"%s\".%n%n" +
                "Our support team will review your account access request and assist you as quickly as possible. Please keep this ticket open for updates.%n%n" +
                "Thank you for your patience.",
                issueSummary
        );

        case FEATURE_REQUEST -> String.format(
                "Hi,%n%n" +
                "Thank you for sharing your feedback about \"%s\". We have received your suggestion and will review it carefully.%n%n" +
                "Our team will evaluate whether this improvement can be considered in future updates. We appreciate you helping us improve the product.%n%n" +
                "Thank you for your valuable feedback.",
                issueSummary
        );

        case GENERAL_INQUIRY -> String.format(
                "Hi,%n%n" +
                "Thank you for contacting SupportPro. We have received your query about \"%s\" and our support team is reviewing it.%n%n" +
                "We will get back to you with the required information as soon as possible. Please keep this ticket open for updates.%n%n" +
                "Thank you for your patience.",
                issueSummary
        );
    };
}

private String buildIssueSummary(String title, String description) {
    String source = title;

    if (source == null || source.isBlank()) {
        source = description;
    }

    if (source == null || source.isBlank()) {
        return "your request";
    }

    source = source.trim().replaceAll("\\s+", " ");

    if (source.length() > 80) {
        source = source.substring(0, 77) + "...";
    }

    return source;
}

    private TicketCategory safeCategory(String value) {
        try { return TicketCategory.valueOf(value.toUpperCase()); }
        catch (Exception e) { return TicketCategory.GENERAL_INQUIRY; }
    }

    private TicketPriority safePriority(String value) {
        try { return TicketPriority.valueOf(value.toUpperCase()); }
        catch (Exception e) { return TicketPriority.MEDIUM; }
    }
}
