import os

file_path = "D:/code7/interview-system/backend/main/java/com/interview/server/service/impl/AiServiceImpl.java"

# Try to read with different encodings
content = None
for encoding in ['utf-8-sig', 'utf-8', 'gbk', 'gb2312', 'latin-1']:
    try:
        with open(file_path, 'r', encoding=encoding) as f:
            content = f.read()
            print(f"Read with {encoding}")
        break
    except Exception as e:
        continue

if content:
    # Fix the corrupted section - the original should have Chinese text
    # Looking at lines 136-140, we need proper Chinese prompts
    lines = content.split('\n')
    
    # Check if lines are corrupted (contain only ?)
    for i in range(135, 141):
        if i < len(lines):
            print(f"Line {i+1}: {repr(lines[i][:60])}")
    
    # Rewrite the file as UTF-8 without BOM
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed encoding for {file_path}")
else:
    print(f"Could not read {file_path}")
