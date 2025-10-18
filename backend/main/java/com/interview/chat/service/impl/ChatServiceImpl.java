package com.interview.chat.service.impl;

import com.interview.chat.dto.ChatMessageDto;
import com.interview.chat.dto.ChatRoomCreateRequest;
import com.interview.chat.dto.ChatRoomDto;
import com.interview.chat.dto.ChatRoomListResponse;
import com.interview.chat.dto.ChatRoomStatsDto;
import com.interview.chat.service.ChatService;
import com.interview.exception.BusinessException;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class ChatServiceImpl implements ChatService {

    private final List<ChatRoomDto> rooms = new CopyOnWriteArrayList<>();
    private final Set<Long> joinedRoomIds = ConcurrentHashMap.newKeySet();
    private final AtomicLong idGenerator = new AtomicLong(5);

    public ChatServiceImpl() {
        rooms.add(buildRoom(1L,
                "公共大厅",
                "public",
                "所有用户都可以参与的公共聊天室",
                1000,
                128,
                64,
                true,
                List.of("公告", "社区"),
                "trending",
                "热门",
                82,
                "系统通知",
                "欢迎所有新加入的伙伴！",
                "2024-01-01T00:00:00Z",
                "2024-10-15T10:00:00Z",
                "2024-10-15T09:45:00Z"));

        rooms.add(buildRoom(2L,
                "前端技术交流",
                "group",
                "前端开发者交流现代框架、工具链和性能优化的聚集地",
                200,
                86,
                28,
                true,
                List.of("前端", "React", "性能"),
                "tech-share",
                "技术交流",
                88,
                "Grace",
                "有同学整理了 React Hooks 的最佳实践清单吗？",
                "2024-01-10T00:00:00Z",
                "2024-10-15T09:30:00Z",
                "2024-10-15T09:20:00Z"));

        rooms.add(buildRoom(3L,
                "面试经验分享",
                "group",
                "分享面试实战、准备思路和拿 offer 的技巧",
                150,
                57,
                16,
                false,
                List.of("面试", "求职", "经验"),
                "career",
                "职场成长",
                52,
                "TravelCat",
                "今晚分享我刚结束的远程面试准备流程~",
                "2024-01-15T00:00:00Z",
                "2024-10-14T21:20:00Z",
                "2024-10-14T21:05:00Z"));

        rooms.add(buildRoom(4L,
                "AI 产品脑暴",
                "group",
                "脑暴和验证 AI 产品创意，推动落地方案和团队协作",
                300,
                142,
                72,
                true,
                List.of("AI", "产品", "创新"),
                "innovation",
                "创新实验室",
                91,
                "ProductX",
                "冷启动提示词模板已经更新，欢迎试用。",
                "2024-02-01T00:00:00Z",
                "2024-10-15T11:24:00Z",
                "2024-10-15T11:23:00Z"));

        joinedRoomIds.add(1L);
        joinedRoomIds.add(2L);
        joinedRoomIds.add(4L);
    }

    @Override
    public ChatRoomListResponse getChatRooms(boolean includeStats) {
        List<ChatRoomDto> result = rooms.stream()
                .map(this::enrichRoom)
                .collect(Collectors.toList());

        ChatRoomStatsDto stats = null;
        if (includeStats) {
            stats = computeStats(result);
        }

        return new ChatRoomListResponse(result, stats);
    }

    @Override
    public ChatRoomDto createChatRoom(ChatRoomCreateRequest request) {
        if (!StringUtils.hasText(request.getName())) {
            throw new BusinessException("聊天室名称不能为空");
        }

        String now = Instant.now().toString();
        String categoryKey = resolveCategoryKey(request);
        String categoryLabel = StringUtils.hasText(request.getCategoryLabel())
                ? request.getCategoryLabel()
                : (StringUtils.hasText(request.getCategory()) ? request.getCategory() : categoryKey);

        ChatRoomDto room = new ChatRoomDto();
        room.setId(idGenerator.getAndIncrement());
        room.setName(request.getName());
        room.setType(StringUtils.hasText(request.getType()) ? request.getType() : "group");
        room.setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription() : "");
        room.setAvatar(null);
        room.setMaxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 100);
        room.setMemberCount(1);
        room.setOnlineCount(1);
        room.setFeatured(Boolean.TRUE.equals(request.getIsFeatured()));
        room.setTags(request.getTags() != null ? new ArrayList<>(request.getTags()) : new ArrayList<>());
        room.setCategoryKey(categoryKey);
        room.setCategoryLabel(categoryLabel);
        room.setActivityScore(request.getActivityScore() != null ? request.getActivityScore() : 20);
        room.setOwnerName(StringUtils.hasText(request.getOwnerName()) ? request.getOwnerName() : "系统通知");
        room.setStatus("active");
        room.setLastMessage(null);
        room.setLastMessageAt(null);
        room.setCreatedAt(now);
        room.setUpdatedAt(now);
        room.setJoined(true);

        rooms.add(room);
        joinedRoomIds.add(room.getId());

        return enrichRoom(room);
    }

    @Override
    public ChatRoomDto joinRoom(Long roomId) {
        ChatRoomDto room = findRoom(roomId);

        if (joinedRoomIds.contains(roomId)) {
            throw new BusinessException("已经加入该聊天室");
        }

        if (room.getMemberCount() != null && room.getMaxMembers() != null && room.getMemberCount() >= room.getMaxMembers()) {
            throw new BusinessException("聊天室已满");
        }

        room.setMemberCount(room.getMemberCount() != null ? room.getMemberCount() + 1 : 1);
        room.setOnlineCount(room.getOnlineCount() != null ? room.getOnlineCount() + 1 : 1);
        room.setUpdatedAt(Instant.now().toString());

        joinedRoomIds.add(roomId);
        return enrichRoom(room);
    }

    @Override
    public ChatRoomDto leaveRoom(Long roomId) {
        ChatRoomDto room = findRoom(roomId);

        if (!joinedRoomIds.contains(roomId)) {
            throw new BusinessException("未加入该聊天室");
        }

        room.setMemberCount(Math.max(0, room.getMemberCount() - 1));
        room.setOnlineCount(Math.max(0, room.getOnlineCount() - 1));
        room.setUpdatedAt(Instant.now().toString());

        joinedRoomIds.remove(roomId);
        return enrichRoom(room);
    }

    private ChatRoomDto buildRoom(Long id,
                                  String name,
                                  String type,
                                  String description,
                                  Integer maxMembers,
                                  Integer memberCount,
                                  Integer onlineCount,
                                  boolean featured,
                                  List<String> tags,
                                  String categoryKey,
                                  String categoryLabel,
                                  Integer activityScore,
                                  String ownerName,
                                  String lastMessageContent,
                                  String createdAt,
                                  String updatedAt,
                                  String lastMessageAt) {
        ChatRoomDto dto = new ChatRoomDto();
        dto.setId(id);
        dto.setName(name);
        dto.setType(type);
        dto.setDescription(description);
        dto.setAvatar(null);
        dto.setMaxMembers(maxMembers);
        dto.setMemberCount(memberCount);
        dto.setOnlineCount(onlineCount);
        dto.setFeatured(featured);
        dto.setTags(new ArrayList<>(tags));
        dto.setCategoryKey(categoryKey);
        dto.setCategoryLabel(categoryLabel);
        dto.setActivityScore(activityScore);
        dto.setOwnerName(ownerName);
        dto.setStatus("active");
        dto.setLastMessage(new ChatMessageDto(lastMessageContent));
        dto.setLastMessageAt(lastMessageAt);
        dto.setCreatedAt(createdAt);
        dto.setUpdatedAt(updatedAt);
        dto.setJoined(false);
        return dto;
    }

    private ChatRoomDto findRoom(Long roomId) {
        return rooms.stream()
                .filter(room -> room.getId().equals(roomId))
                .findFirst()
                .orElseThrow(() -> new BusinessException("聊天室不存在"));
    }

    private ChatRoomDto enrichRoom(ChatRoomDto room) {
        ChatRoomDto copy = room.copy();
        copy.setJoined(joinedRoomIds.contains(room.getId()));
        return copy;
    }

    private ChatRoomStatsDto computeStats(List<ChatRoomDto> roomViews) {
        int total = roomViews.size();
        int joined = (int) roomViews.stream().filter(ChatRoomDto::isJoined).count();
        int trending = (int) roomViews.stream().filter(this::isTrending).count();
        int newRooms = (int) roomViews.stream().filter(this::isNewRoom).count();
        int onlineUsers = roomViews.stream().map(ChatRoomDto::getOnlineCount).filter(count -> count != null).mapToInt(Integer::intValue).sum();
        return new ChatRoomStatsDto(total, joined, trending, newRooms, onlineUsers);
    }

    private boolean isTrending(ChatRoomDto room) {
        if (room.isFeatured()) {
            return true;
        }
        Integer activity = room.getActivityScore();
        if (activity != null && activity >= 70) {
            return true;
        }
        if (room.getMaxMembers() != null && room.getMaxMembers() > 0 && room.getMemberCount() != null) {
            double ratio = room.getMemberCount() * 1.0 / room.getMaxMembers();
            return ratio >= 0.5;
        }
        return false;
    }

    private boolean isNewRoom(ChatRoomDto room) {
        if (!StringUtils.hasText(room.getCreatedAt())) {
            return false;
        }
        try {
            Instant created = Instant.parse(room.getCreatedAt());
            return Duration.between(created, Instant.now()).toDays() <= 7;
        } catch (Exception ignored) {
            return false;
        }
    }

    private String resolveCategoryKey(ChatRoomCreateRequest request) {
        if (StringUtils.hasText(request.getCategoryKey())) {
            return request.getCategoryKey();
        }
        if (StringUtils.hasText(request.getCategory())) {
            return request.getCategory();
        }
        List<String> tags = request.getTags();
        if (tags != null && !tags.isEmpty()) {
            return tags.get(0);
        }
        return "general";
    }
}
