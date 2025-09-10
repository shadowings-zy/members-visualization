<script setup>
import { ref, computed, onMounted } from 'vue'
import MemberCard from './MemberCard.vue'

const members = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const selectedDomain = ref('')

// 获取所有研究方向
const allDomains = computed(() => {
  const domains = new Set()
  members.value.forEach(member => {
    member.domain.forEach(domain => domains.add(domain))
  })
  return Array.from(domains).sort()
})

// 过滤后的成员列表
const filteredMembers = computed(() => {
  let filtered = members.value

  // 按姓名搜索
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(member => 
      member.name.toLowerCase().includes(query) ||
      member.id.toLowerCase().includes(query)
    )
  }

  // 按研究方向筛选
  if (selectedDomain.value) {
    filtered = filtered.filter(member => 
      member.domain.includes(selectedDomain.value)
    )
  }

  return filtered
})

// 加载成员数据
const loadMembers = async () => {
  try {
    const basePath = import.meta.env.BASE_URL || '/'
    const csvPath = `${basePath}data/members.csv`.replace('//', '/')
    
    const response = await fetch(csvPath)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const text = await response.text()
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',')
    
    const parsedMembers = lines.slice(1).map(line => {
      const values = line.split(',')
      const obj = {}
      headers.forEach((h, i) => {
        obj[h] = values[i] ? values[i].replace(/"/g, '') : ''
      })
      obj.domain = obj.domain ? obj.domain.split(';').map(d => d.trim()) : []
      return obj
    })

    members.value = parsedMembers
    loading.value = false
  } catch (err) {
    console.error('加载成员数据失败:', err)
    error.value = err.message
    loading.value = false
  }
}

// 清除筛选
const clearFilters = () => {
  searchQuery.value = ''
  selectedDomain.value = ''
}

onMounted(() => {
  loadMembers()
})
</script>

<template>
  <div class="members-list">
    <!-- 搜索和筛选 -->
    <div class="filters">
      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索成员姓名或ID..."
          class="search-input"
        />
        <div class="search-icon">🔍</div>
      </div>
      
      <div class="filter-box">
        <select v-model="selectedDomain" class="domain-select">
          <option value="">所有研究方向</option>
          <option v-for="domain in allDomains" :key="domain" :value="domain">
            {{ domain }}
          </option>
        </select>
      </div>
      
      <button 
        v-if="searchQuery || selectedDomain" 
        @click="clearFilters"
        class="clear-btn"
      >
        清除筛选
      </button>
    </div>

    <!-- 结果统计 -->
    <div v-if="!loading && !error" class="results-info">
      <p>
        显示 <strong>{{ filteredMembers.length }}</strong> / {{ members.length }} 个成员
        <span v-if="selectedDomain">（研究方向：{{ selectedDomain }}）</span>
        <span v-if="searchQuery">（搜索：{{ searchQuery }}）</span>
      </p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>正在加载成员数据...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error">
      <p>加载失败: {{ error }}</p>
    </div>

    <!-- 成员列表 -->
    <div v-else-if="filteredMembers.length > 0" class="members-grid">
      <MemberCard 
        v-for="member in filteredMembers" 
        :key="member.id" 
        :member="member"
      />
    </div>

    <!-- 无结果 -->
    <div v-else class="no-results">
      <p>没有找到匹配的成员</p>
      <button @click="clearFilters" class="clear-btn">清除筛选条件</button>
    </div>
  </div>
</template>

<style scoped>
.members-list {
  width: 100%;
  padding: 20px 0;
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  align-items: center;
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #0366d6;
}

.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.filter-box {
  min-width: 200px;
}

.domain-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.domain-select:focus {
  outline: none;
  border-color: #0366d6;
}

.clear-btn {
  padding: 12px 20px;
  background: #f1f3f4;
  border: none;
  border-radius: 8px;
  color: #5f6368;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s ease;
}

.clear-btn:hover {
  background: #e8eaed;
}

.results-info {
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0366d6;
}

.results-info p {
  margin: 0;
  color: #333;
  font-size: 14px;
}

.loading, .error, .no-results {
  text-align: center;
  padding: 60px 20px;
  border-radius: 12px;
  margin: 20px 0;
}

.loading {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
}

.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.no-results {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box,
  .filter-box {
    min-width: auto;
  }
  
  .members-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>
