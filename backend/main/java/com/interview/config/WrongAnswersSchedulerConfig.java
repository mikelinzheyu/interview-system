package com.interview.config;

import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

@Component
public class WrongAnswersSchedulerConfig {
    private volatile String strategy = "sm2"; // sm2 | ebbinghaus | fsrs
    private volatile double fsrsAlpha = 1.0;

    @PostConstruct
    public void init() {
        String env = System.getenv("WRONG_ANSWERS_SCHEDULER");
        if (env != null && !env.isBlank()) {
            String v = env.toLowerCase();
            if (v.equals("sm2") || v.equals("ebbinghaus") || v.equals("fsrs")) {
                strategy = v;
            }
        }
        String alpha = System.getenv("WRONG_ANSWERS_FSRS_ALPHA");
        if (alpha != null) {
            try {
                double val = Double.parseDouble(alpha);
                if (val > 0 && val <= 3) {
                    fsrsAlpha = val;
                }
            } catch (Exception ignored) {}
        }
    }

    public String getStrategy() {
        return strategy;
    }

    public void setStrategy(String strategy) {
        if (strategy == null) return;
        String v = strategy.toLowerCase();
        if (v.equals("sm2") || v.equals("ebbinghaus") || v.equals("fsrs")) {
            this.strategy = v;
        }
    }

    public double getFsrsAlpha() {
        return fsrsAlpha;
    }

    public void setFsrsAlpha(double fsrsAlpha) {
        if (fsrsAlpha > 0 && fsrsAlpha <= 3) {
            this.fsrsAlpha = fsrsAlpha;
        }
    }
}

