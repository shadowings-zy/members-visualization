<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  member: {
    type: Object,
    required: true
  }
})

const githubData = ref(null)
const loading = ref(true)
const error = ref(null)

// 从 GitHub URL 提取用户名
const getGithubUsername = (url) => {
  const match = url.match(/github\.com\/([^\/]+)/)
  return match ? match[1] : null
}

// 获取 GitHub 用户数据
const fetchGithubData = async (username) => {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const userData = await response.json()
    
    // 获取仓库数据
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`)
    const repos = reposResponse.ok ? await reposResponse.json() : []
    
    return {
      ...userData,
      repos: repos,
      totalStars: repos.reduce((sum, repo) => sum + repo.stargazers_count, 0)
    }
  } catch (err) {
    console.warn(`获取 ${username} 的 GitHub 数据失败:`, err)
    return null
  }
}

onMounted(async () => {
  const username = getGithubUsername(props.member.github)
  if (username) {
    githubData.value = await fetchGithubData(username)
  }
  loading.value = false
})
</script>

<template>
  <div class="member-card">
    <div class="member-header">
      <div class="avatar-container">
        <img 
          v-if="githubData?.avatar_url" 
          :src="githubData.avatar_url" 
          :alt="member.name"
          class="avatar"
        />
        <div v-else class="avatar-placeholder">
          {{ member.name.charAt(0) }}
        </div>
      </div>
      
      <div class="member-info">
        <h3 class="member-name">
          <a :href="member.github" target="_blank" rel="noopener noreferrer">
            {{ member.name }}
          </a>
        </h3>
        <p v-if="githubData?.bio" class="member-bio">{{ githubData.bio }}</p>
        <div class="member-domains">
          <span 
            v-for="domain in member.domain" 
            :key="domain" 
            class="domain-tag"
          >
            {{ domain }}
          </span>
        </div>
      </div>
    </div>

    <div v-if="githubData" class="github-stats">
      <div class="stat-item">
        <span class="stat-number">{{ githubData.public_repos || 0 }}</span>
        <span class="stat-label">仓库</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ githubData.totalStars || 0 }}</span>
        <span class="stat-label">总 Stars</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ githubData.followers || 0 }}</span>
        <span class="stat-label">关注者</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ githubData.following || 0 }}</span>
        <span class="stat-label">关注中</span>
      </div>
    </div>

    <div v-if="githubData?.repos?.length" class="recent-repos">
      <h4>最近更新的仓库</h4>
      <div class="repo-list">
        <div 
          v-for="repo in githubData.repos.slice(0, 3)" 
          :key="repo.id"
          class="repo-item"
        >
          <a :href="repo.html_url" target="_blank" rel="noopener noreferrer" class="repo-name">
            {{ repo.name }}
          </a>
          <p v-if="repo.description" class="repo-description">{{ repo.description }}</p>
          <div class="repo-meta">
            <span v-if="repo.language" class="repo-language">{{ repo.language }}</span>
            <span class="repo-stars">⭐ {{ repo.stargazers_count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.member-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border: 1px solid #e1e5e9;
}

.member-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.member-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.avatar-container {
  flex-shrink: 0;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f0f0f0;
}

.avatar-placeholder {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  font-weight: bold;
}

.member-name a {
  color: #333;
  text-decoration: none;
  transition: color 0.3s ease;
}

.member-name a:hover {
  color: #0366d6;
}

.member-bio {
  margin: 0 0 12px 0;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.4;
}

.member-domains {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.domain-tag {
  background: #f1f3f4;
  color: #5f6368;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.github-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  display: block;
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.stat-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-top: 2px;
}

.recent-repos h4 {
  margin: 0 0 12px 0;
  font-size: 1rem;
  color: #333;
}

.repo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.repo-item {
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 3px solid #0366d6;
}

.repo-name {
  color: #0366d6;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
}

.repo-name:hover {
  text-decoration: underline;
}

.repo-description {
  margin: 4px 0;
  color: #666;
  font-size: 0.8rem;
  line-height: 1.3;
}

.repo-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.repo-language {
  font-size: 0.8rem;
  color: #666;
  background: #e1e4e8;
  padding: 2px 6px;
  border-radius: 4px;
}

.repo-stars {
  font-size: 0.8rem;
  color: #666;
}

@media (max-width: 768px) {
  .github-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .member-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
}
</style>
