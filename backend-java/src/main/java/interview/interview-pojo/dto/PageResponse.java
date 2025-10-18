package com.interview.dto;

import java.util.List;

public class PageResponse<T> {
    private List<T> list;
    private PageInfo pagination;

    public PageResponse() {}

    public PageResponse(List<T> list, PageInfo pagination) {
        this.list = list;
        this.pagination = pagination;
    }

    public static <T> PageResponse<T> of(List<T> list, int page, int size, long total) {
        PageInfo pageInfo = new PageInfo(page, size, total, (int) Math.ceil((double) total / size));
        return new PageResponse<>(list, pageInfo);
    }

    public List<T> getList() {
        return list;
    }

    public void setList(List<T> list) {
        this.list = list;
    }

    public PageInfo getPagination() {
        return pagination;
    }

    public void setPagination(PageInfo pagination) {
        this.pagination = pagination;
    }

    public static class PageInfo {
        private int page;
        private int size;
        private long total;
        private int pages;

        public PageInfo() {}

        public PageInfo(int page, int size, long total, int pages) {
            this.page = page;
            this.size = size;
            this.total = total;
            this.pages = pages;
        }

        public int getPage() {
            return page;
        }

        public void setPage(int page) {
            this.page = page;
        }

        public int getSize() {
            return size;
        }

        public void setSize(int size) {
            this.size = size;
        }

        public long getTotal() {
            return total;
        }

        public void setTotal(long total) {
            this.total = total;
        }

        public int getPages() {
            return pages;
        }

        public void setPages(int pages) {
            this.pages = pages;
        }
    }
}