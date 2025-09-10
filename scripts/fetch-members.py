#!/usr/bin/env python3
"""
数据拉取脚本 (Python 版本)
从 GitHub API 获取组织成员信息并转换为 CSV 格式
"""

import os
import sys
import csv
import json
import time
import requests
from pathlib import Path

# 加载环境变量
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # python-dotenv 不是必需的，如果没有安装就忽略
    pass

# 配置
CONFIG = {
    'ORG_NAME': os.getenv('GITHUB_ORG', 'datawhalechina'),
    'GITHUB_TOKEN': os.getenv('GITHUB_TOKEN'),
    'OUTPUT_FILE': Path(__file__).parent.parent / 'data' / 'members.csv',
    'API_BASE': 'https://api.github.com',
    'DEFAULT_DOMAINS': {
        'machine-learning': '机器学习',
        'deep-learning': '深度学习',
        'nlp': 'NLP',
        'cv': 'CV',
        'data-mining': '数据挖掘',
        'recommendation': '推荐系统',
        'reinforcement-learning': '强化学习'
    }
}

def get_headers():
    """获取请求头"""
    headers = {
        'User-Agent': 'members-visualization-bot',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    if CONFIG['GITHUB_TOKEN']:
        headers['Authorization'] = f"token {CONFIG['GITHUB_TOKEN']}"
    
    return headers

def fetch_api(url, retries=3):
    """发送 API 请求（带重试逻辑）"""
    if not CONFIG['GITHUB_TOKEN']:
        print("⚠️  未设置 GITHUB_TOKEN，可能会遇到 API 速率限制")

    for attempt in range(retries):
        try:
            print(f"🔄 请求 {url} (尝试 {attempt + 1}/{retries})")

            response = requests.get(url, headers=get_headers(), timeout=30)

            # 检查速率限制
            remaining = response.headers.get('X-RateLimit-Remaining')
            reset_time = response.headers.get('X-RateLimit-Reset')

            if remaining:
                print(f"📊 API 剩余请求次数: {remaining}")

            if response.status_code == 403 and remaining == '0':
                if reset_time and attempt < retries - 1:
                    reset_timestamp = int(reset_time)
                    wait_time = reset_timestamp - int(time.time()) + 1
                    if wait_time > 0:
                        print(f"⏳ API 速率限制，等待 {wait_time} 秒后重试...")
                        time.sleep(wait_time)
                        continue
                raise requests.exceptions.HTTPError(f"API 速率限制已达上限")

            response.raise_for_status()
            return response.json()

        except requests.RequestException as e:
            print(f"❌ 请求失败 (尝试 {attempt + 1}/{retries}): {url}")
            print(f"错误: {e}")

            if attempt == retries - 1:
                return None

            # 指数退避延迟
            wait_time = (2 ** attempt)
            print(f"⏳ 等待 {wait_time} 秒后重试...")
            time.sleep(wait_time)

    return None

def get_org_members(org_name):
    """获取组织成员列表"""
    print(f"正在获取组织 {org_name} 的成员列表...")
    
    url = f"{CONFIG['API_BASE']}/orgs/{org_name}/members?per_page=100"
    members = fetch_api(url)
    
    if members:
        print(f"找到 {len(members)} 个成员")
        return members
    return []

def get_user_details(username):
    """获取用户详细信息"""
    url = f"{CONFIG['API_BASE']}/users/{username}"
    return fetch_api(url)

def get_user_repos(username, max_repos=10):
    """获取用户仓库信息"""
    url = f"{CONFIG['API_BASE']}/users/{username}/repos?sort=updated&per_page={max_repos}"
    repos = fetch_api(url)
    return repos if repos else []

def infer_domains(repos, user_bio=''):
    """根据仓库信息推断研究方向"""
    domains = set()
    text = (user_bio or '').lower()
    
    # 从用户简介中提取关键词
    for key, value in CONFIG['DEFAULT_DOMAINS'].items():
        if key in text or value.lower() in text:
            domains.add(value)
    
    # 从仓库名称和描述中提取关键词
    for repo in repos:
        repo_text = f"{repo.get('name', '')} {repo.get('description', '')}".lower()
        
        for key, value in CONFIG['DEFAULT_DOMAINS'].items():
            if key in repo_text or value.lower() in repo_text:
                domains.add(value)
        
        # 根据仓库语言推断
        language = repo.get('language', '').lower()
        if language in ['python', 'jupyter notebook']:
            domains.add('机器学习')
        elif language in ['javascript', 'typescript']:
            domains.add('前端开发')
    
    # 如果没有找到任何领域，设置默认值
    if not domains:
        domains.add('数据科学')
    
    return list(domains)

def save_to_csv(members, output_file):
    """保存数据到 CSV 文件"""
    with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        
        # 写入表头
        writer.writerow(['id', 'name', 'github', 'domain'])
        
        # 写入数据
        for member in members:
            writer.writerow([
                member['id'],
                member['name'],
                member['github'],
                ';'.join(member['domains'])
            ])

def check_existing_data():
    """检查现有数据文件"""
    return os.path.exists(CONFIG['OUTPUT_FILE'])

def backup_existing_data():
    """备份现有数据"""
    if os.path.exists(CONFIG['OUTPUT_FILE']):
        # 将Path对象转换为字符串进行操作
        output_file_str = str(CONFIG['OUTPUT_FILE'])
        backup_path = output_file_str.replace('.csv', f'.backup.{int(time.time())}.csv')
        import shutil
        shutil.copy2(CONFIG['OUTPUT_FILE'], backup_path)
        print(f"📋 已备份现有数据: {backup_path}")
        return backup_path
    return None

def main():
    """主函数"""
    has_existing_data = check_existing_data()

    try:
        print("🚀 开始拉取成员数据...")

        if has_existing_data:
            backup_existing_data()

        # 获取组织成员
        org_members = get_org_members(CONFIG['ORG_NAME'])

        if not org_members:
            print("⚠️  未找到任何成员数据")

            if has_existing_data:
                print("✅ 保持使用现有数据")
                return
            else:
                raise Exception("没有现有数据可用，且无法获取新数据")

        # 处理每个成员
        processed_members = []
        max_members = min(len(org_members), 50)  # 增加处理数量

        for i, member in enumerate(org_members[:max_members]):
            print(f"处理成员 {i + 1}/{max_members}: {member['login']}")

            try:
                # 获取用户详细信息
                user_details = get_user_details(member['login'])

                # 获取用户仓库
                repos = get_user_repos(member['login'])

                # 推断研究方向
                domains = infer_domains(repos, user_details.get('bio') if user_details else '')

                processed_members.append({
                    'id': member['login'],
                    'name': user_details.get('name') if user_details else member['login'],
                    'github': member['html_url'],
                    'domains': domains
                })

                # 动态延迟以避免 API 速率限制
                delay = 0.05 if CONFIG['GITHUB_TOKEN'] else 0.2
                time.sleep(delay)

            except Exception as e:
                print(f"⚠️  处理成员 {member['login']} 时出错: {e}")
                # 继续处理其他成员

        if not processed_members:
            raise Exception("没有成功处理任何成员数据")

        # 保存到 CSV
        save_to_csv(processed_members, CONFIG['OUTPUT_FILE'])

        print(f"✅ 成功生成 CSV 文件: {CONFIG['OUTPUT_FILE']}")
        print(f"📊 处理了 {len(processed_members)} 个成员")

    except Exception as e:
        print(f"❌ 数据拉取失败: {e}")

        if has_existing_data:
            print("🔄 使用现有数据继续构建...")
            print("💡 提示：设置 GITHUB_TOKEN 环境变量可以避免 API 速率限制")
            sys.exit(0)  # 不中断构建流程
        else:
            print("💥 没有现有数据可用，构建失败")
            sys.exit(1)

if __name__ == '__main__':
    main()
