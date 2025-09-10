#!/usr/bin/env node

/**
 * 数据拉取脚本
 * 从 GitHub API 获取组织成员信息并转换为 CSV 格式
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // GitHub 组织名称
  ORG_NAME: process.env.GITHUB_ORG || 'datawhalechina',

  // GitHub API Token (可选，但建议设置以避免速率限制)
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,

  // 输出文件路径
  OUTPUT_FILE: path.join(__dirname, '../data/members.csv'),

  // API 基础 URL
  API_BASE: 'https://api.github.com',

  // 默认研究方向映射（可根据实际情况调整）
  DEFAULT_DOMAINS: {
    'machine-learning': '机器学习',
    'deep-learning': '深度学习',
    'nlp': 'NLP',
    'cv': 'CV',
    'data-mining': '数据挖掘',
    'recommendation': '推荐系统',
    'reinforcement-learning': '强化学习'
  }
};

/**
 * 发送 HTTP 请求（带重试逻辑）
 */
async function fetchAPI(url, retries = 3, delay = 1000) {
  const headers = {
    'User-Agent': 'members-visualization-bot/1.0',
    'Accept': 'application/vnd.github.v3+json'
  };

  if (CONFIG.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${CONFIG.GITHUB_TOKEN}`;
  } else {
    console.warn('⚠️  未设置 GITHUB_TOKEN，可能会遇到 API 速率限制');
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 请求 ${url} (尝试 ${attempt}/${retries})`);

      const response = await fetch(url, { headers });

      // 检查速率限制
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const resetTime = response.headers.get('X-RateLimit-Reset');

      if (remaining) {
        console.log(`📊 API 剩余请求次数: ${remaining}`);
      }

      if (response.status === 403 && response.headers.get('X-RateLimit-Remaining') === '0') {
        const resetDate = new Date(parseInt(resetTime) * 1000);
        const waitTime = resetDate.getTime() - Date.now();

        if (waitTime > 0 && attempt < retries) {
          console.log(`⏳ API 速率限制，等待 ${Math.ceil(waitTime / 1000)} 秒后重试...`);
          await new Promise(resolve => setTimeout(resolve, waitTime + 1000));
          continue;
        } else {
          throw new Error(`API 速率限制已达上限，重置时间: ${resetDate.toISOString()}`);
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      console.error(`❌ 请求失败 (尝试 ${attempt}/${retries}): ${url}`, error.message);

      if (attempt === retries) {
        throw error;
      }

      // 指数退避延迟
      const waitTime = delay * Math.pow(2, attempt - 1);
      console.log(`⏳ 等待 ${waitTime}ms 后重试...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

/**
 * 获取组织成员列表
 */
async function getOrgMembers(orgName) {
  console.log(`正在获取组织 ${orgName} 的成员列表...`);

  const url = `${CONFIG.API_BASE}/orgs/${orgName}/members?per_page=100`;
  const members = await fetchAPI(url);

  console.log(`找到 ${members.length} 个成员`);
  return members;
}

/**
 * 获取用户详细信息
 */
async function getUserDetails(username) {
  try {
    const url = `${CONFIG.API_BASE}/users/${username}`;
    const user = await fetchAPI(url);
    return user;
  } catch (error) {
    console.warn(`获取用户 ${username} 详细信息失败:`, error.message);
    return null;
  }
}

/**
 * 获取用户仓库信息（用于推断研究方向）
 */
async function getUserRepos(username, maxRepos = 10) {
  try {
    const url = `${CONFIG.API_BASE}/users/${username}/repos?sort=updated&per_page=${maxRepos}`;
    const repos = await fetchAPI(url);
    return repos;
  } catch (error) {
    console.warn(`获取用户 ${username} 仓库信息失败:`, error.message);
    return [];
  }
}

/**
 * 根据仓库信息推断研究方向
 */
function inferDomains(repos, userBio = '') {
  const domains = new Set();
  const text = (userBio || '').toLowerCase();

  // 从用户简介中提取关键词
  Object.entries(CONFIG.DEFAULT_DOMAINS).forEach(([key, value]) => {
    if (text.includes(key) || text.includes(value.toLowerCase())) {
      domains.add(value);
    }
  });

  // 从仓库名称和描述中提取关键词
  repos.forEach(repo => {
    const repoText = `${repo.name} ${repo.description || ''}`.toLowerCase();

    Object.entries(CONFIG.DEFAULT_DOMAINS).forEach(([key, value]) => {
      if (repoText.includes(key) || repoText.includes(value.toLowerCase())) {
        domains.add(value);
      }
    });

    // 根据仓库语言推断
    if (repo.language) {
      const lang = repo.language.toLowerCase();
      if (lang === 'python' || lang === 'jupyter notebook') {
        domains.add('机器学习');
      }
      if (lang === 'javascript' || lang === 'typescript') {
        domains.add('前端开发');
      }
    }
  });

  // 如果没有找到任何领域，设置默认值
  if (domains.size === 0) {
    domains.add('数据科学');
  }

  return Array.from(domains);
}

/**
 * 将数据转换为 CSV 格式
 */
function convertToCSV(members) {
  const headers = ['id', 'name', 'github', 'domain'];
  const rows = [headers.join(',')];

  members.forEach(member => {
    const row = [
      member.id,
      `"${member.name || member.login}"`,
      `"${member.github}"`,
      `"${member.domains.join(';')}"`
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
}

/**
 * 检查现有数据文件
 */
function checkExistingData() {
  return fsSync.existsSync(CONFIG.OUTPUT_FILE);
}

/**
 * 备份现有数据
 */
function backupExistingData() {
  const backupPath = CONFIG.OUTPUT_FILE.replace('.csv', `.backup.${Date.now()}.csv`);

  if (fsSync.existsSync(CONFIG.OUTPUT_FILE)) {
    fsSync.copyFileSync(CONFIG.OUTPUT_FILE, backupPath);
    console.log(`📋 已备份现有数据: ${backupPath}`);
    return backupPath;
  }
  return null;
}

/**
 * 清理旧备份文件
 */
function cleanupOldBackups() {
  try {
    const dataDir = path.dirname(CONFIG.OUTPUT_FILE);
    const files = fsSync.readdirSync(dataDir);
    const backupFiles = files
      .filter(file => file.includes('.backup.') && file.endsWith('.csv'))
      .map(file => ({
        name: file,
        path: path.join(dataDir, file),
        time: fsSync.statSync(path.join(dataDir, file)).mtime
      }))
      .sort((a, b) => b.time - a.time);

    // 保留最近3个备份
    if (backupFiles.length > 3) {
      const filesToDelete = backupFiles.slice(3);
      filesToDelete.forEach(file => {
        fsSync.unlinkSync(file.path);
        console.log(`🗑️  删除旧备份: ${file.name}`);
      });
    }
  } catch (error) {
    console.warn('⚠️  清理备份文件时出错:', error.message);
  }
}

/**
 * 主函数
 */
async function main() {
  const hasExistingData = checkExistingData();
  let backupPath = null;

  try {
    console.log('🚀 开始拉取成员数据...');

    if (hasExistingData) {
      backupPath = backupExistingData();
    }

    // 获取组织成员
    const orgMembers = await getOrgMembers(CONFIG.ORG_NAME);

    if (orgMembers.length === 0) {
      console.log('⚠️  未找到任何成员数据');

      if (hasExistingData) {
        console.log('✅ 保持使用现有数据');
        return;
      } else {
        throw new Error('没有现有数据可用，且无法获取新数据');
      }
    }

    // 处理每个成员
    const processedMembers = [];
    const maxMembers = Math.min(orgMembers.length, 50); // 增加处理数量

    for (let i = 0; i < maxMembers; i++) {
      const member = orgMembers[i];
      console.log(`处理成员 ${i + 1}/${maxMembers}: ${member.login}`);

      try {
        // 获取用户详细信息
        const userDetails = await getUserDetails(member.login);

        // 获取用户仓库
        const repos = await getUserRepos(member.login);

        // 推断研究方向
        const domains = inferDomains(repos, userDetails?.bio);

        processedMembers.push({
          id: member.login,
          name: userDetails?.name || member.login,
          github: member.html_url,
          domains: domains
        });

        // 动态延迟以避免 API 速率限制
        await new Promise(resolve => setTimeout(resolve, CONFIG.GITHUB_TOKEN ? 50 : 200));

      } catch (error) {
        console.warn(`⚠️  处理成员 ${member.login} 时出错: ${error.message}`);
        // 继续处理其他成员
      }
    }

    if (processedMembers.length === 0) {
      throw new Error('没有成功处理任何成员数据');
    }

    // 转换为 CSV
    const csvContent = convertToCSV(processedMembers);

    // 写入文件
    await fs.writeFile(CONFIG.OUTPUT_FILE, csvContent, 'utf8');

    console.log(`✅ 成功生成 CSV 文件: ${CONFIG.OUTPUT_FILE}`);
    console.log(`📊 处理了 ${processedMembers.length} 个成员`);

    // 清理旧备份
    cleanupOldBackups();

  } catch (error) {
    console.error('❌ 数据拉取失败:', error.message);

    if (hasExistingData) {
      console.log('🔄 使用现有数据继续构建...');
      console.log('💡 提示：设置 GITHUB_TOKEN 环境变量可以避免 API 速率限制');
      process.exit(0); // 不中断构建流程
    } else {
      console.error('💥 没有现有数据可用，构建失败');
      process.exit(1);
    }
  }
}

// 运行主函数
if (require.main === module) {
  main();
}

module.exports = { main };
