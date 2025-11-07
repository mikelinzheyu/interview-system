#!/bin/bash

# 图标映射 (旧图标 -> 新图标)
declare -A icon_map=(
  ["Robot"]="Avatar"
  ["Play"]="VideoPlay"
  ["Success"]="SuccessFilled"
  ["Info"]="InfoFilled"
  ["Lightbulb"]="Bulb"
  ["User"]="Avatar"
  ["Check"]="CircleCheck"
  ["Close"]="CloseBold"
)

# 查找所有使用Element Plus图标的Vue文件
echo "开始修复图标引用..."
find frontend/src -name "*.vue" -type f | while read file; do
  # 检查文件是否包含 @element-plus/icons-vue
  if grep -q "@element-plus/icons-vue" "$file"; then
    echo "处理文件: $file"

    # 为每个映射执行替换
    for old_icon in "${!icon_map[@]}"; do
      new_icon="${icon_map[$old_icon]}"

      # 在import语句中替换
      sed -i "s/\b${old_icon}\b/${new_icon}/g" "$file"
    done
  fi
done

echo "图标修复完成！"
