package com.supportticket.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Getter @Setter
public class AppProperties {

    private Ai ai = new Ai();
    private Init init = new Init();

    @Getter @Setter
    public static class Ai {
        private Anthropic anthropic = new Anthropic();

        @Getter @Setter
        public static class Anthropic {
            private String apiKey = "";
            private String model = "claude-haiku-4-5-20251001";
            private String baseUrl = "https://api.anthropic.com";
        }
    }

    @Getter @Setter
    public static class Init {
        private boolean sampleData = false;
    }
}
