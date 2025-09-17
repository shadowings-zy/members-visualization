#!/usr/bin/env python3
"""
测试脚本：验证基于 topics 的研究领域推断功能
"""

import sys
import os
sys.path.append('scripts')

# 导入修改后的函数
from fetch_members import infer_domains_from_repos

def test_topics_inference():
    """测试基于 topics 的领域推断"""
    print("🧪 测试基于 topics 的研究领域推断...")
    
    # 模拟用户仓库数据（包含 topics）
    mock_user_repos = [
        {
            'name': 'ml-project',
            'topics': ['machine-learning', 'python', 'scikit-learn']
        },
        {
            'name': 'nlp-toolkit',
            'topics': ['nlp', 'natural-language-processing', 'bert', 'transformer']
        },
        {
            'name': 'cv-detection',
            'topics': ['computer-vision', 'opencv', 'yolo', 'image-processing']
        },
        {
            'name': 'llm-chatbot',
            'topics': ['llm', 'gpt', 'chatbot', 'openai']
        }
    ]
    
    # 测试用例1：基于 topics 推断
    print("\n📋 测试用例1：基于 topics 推断")
    repo_names = ['ml-project', 'nlp-toolkit']
    user_bio = 'AI researcher interested in machine learning'
    
    domains = infer_domains_from_repos(repo_names, user_bio, mock_user_repos[:2])
    print(f"推断结果: {domains}")
    
    # 测试用例2：包含更多 topics
    print("\n📋 测试用例2：包含更多 topics")
    domains = infer_domains_from_repos(
        ['ml-project', 'nlp-toolkit', 'cv-detection', 'llm-chatbot'], 
        user_bio, 
        mock_user_repos
    )
    print(f"推断结果: {domains}")
    
    # 测试用例3：没有 topics 的情况（回退到仓库名称）
    print("\n📋 测试用例3：没有 topics 的情况")
    mock_repos_no_topics = [
        {'name': 'deep-learning-pytorch'},
        {'name': 'recommendation-system'}
    ]
    
    domains = infer_domains_from_repos(
        ['deep-learning-pytorch', 'recommendation-system'], 
        '', 
        mock_repos_no_topics
    )
    print(f"推断结果: {domains}")
    
    # 测试用例4：空 topics 但有仓库名称
    print("\n📋 测试用例4：空 topics 但有仓库名称")
    mock_repos_empty_topics = [
        {'name': 'web-frontend-react', 'topics': []},
        {'name': 'data-visualization-pandas', 'topics': []}
    ]
    
    domains = infer_domains_from_repos(
        ['web-frontend-react', 'data-visualization-pandas'], 
        '', 
        mock_repos_empty_topics
    )
    print(f"推断结果: {domains}")

if __name__ == '__main__':
    test_topics_inference()
