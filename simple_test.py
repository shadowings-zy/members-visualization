#!/usr/bin/env python3

# 简单测试脚本
print("开始测试...")

# 模拟 topics 数据
mock_repos = [
    {'name': 'ml-project', 'topics': ['machine-learning', 'python']},
    {'name': 'nlp-toolkit', 'topics': ['nlp', 'bert']}
]

# 提取 topics
all_topics = []
for repo in mock_repos:
    if 'topics' in repo:
        topics = repo.get('topics', [])
        if topics:
            all_topics.extend(topics)
            print(f"仓库 {repo['name']} topics: {topics}")

print(f"所有 topics: {all_topics}")
topics_text = ' '.join(all_topics).lower()
print(f"topics 文本: '{topics_text}'")

# 测试关键词匹配
if 'machine-learning' in topics_text:
    print("✅ 找到机器学习关键词")
if 'nlp' in topics_text:
    print("✅ 找到NLP关键词")

print("测试完成!")
