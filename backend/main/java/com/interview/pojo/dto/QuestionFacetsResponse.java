package com.interview.dto;

import java.util.List;

public class QuestionFacetsResponse {
    private List<FacetBucket> difficulties;
    private List<FacetBucket> categories;

    public QuestionFacetsResponse() {}

    public QuestionFacetsResponse(List<FacetBucket> difficulties, List<FacetBucket> categories) {
        this.difficulties = difficulties;
        this.categories = categories;
    }

    public List<FacetBucket> getDifficulties() { return difficulties; }
    public void setDifficulties(List<FacetBucket> difficulties) { this.difficulties = difficulties; }

    public List<FacetBucket> getCategories() { return categories; }
    public void setCategories(List<FacetBucket> categories) { this.categories = categories; }
}

