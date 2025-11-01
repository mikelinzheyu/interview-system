导入《本科专业目录》CSV 指南

字段说明（UTF-8，无 BOM 均可）：
- discipline_name：学科门类（如：理学、工学…）
- field_name：专业类（如：计算机类、电子信息类…）
- major_slug：专业唯一标识（规范，见下）
- major_name：专业中文名（如：计算机科学与技术）
- aliases：常见别名/缩写/英文，分隔符支持 `; | / ， ,`（可空）
- pinyin：拼音或词组（可空；脚本会按内置词典自动补全常见词）
- abbr：缩写（如 CS / SE / EE）（可空）
- alt_en：英文名（可空）
- popularity：热度（0-100，默认0；用于排序权重）

Slug 规范：
- 全小写、英文与数字、连字符 `-` 作为分隔，禁止空格/下划线/特殊字符
- 建议：专业英文名的 `kebab-case`，或稳定缩写（如：computer-science、software-engineering、electronic-information、civil-engineering…）

导入命令：
```
node frontend/scripts/import-academic-csv.js --input frontend/src/data/import/majors-template.csv --output frontend/src/data/academic-tree.json
```

注意：
- 脚本会合并现有 JSON，与 CSV 增量构建树；同 slug 的专业仅合并别名与 meta
- 拼音为空时，会按常见词典自动生成基础拼音，建议后续人工补全

