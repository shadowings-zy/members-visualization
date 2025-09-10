# 📈 数据统计

<script setup>
import DataExport from '../.vitepress/theme/DataExport.vue'
import { ref, onMounted } from 'vue'

const members = ref([])
const domainCount = ref({})
const loading = ref(true)

// 加载数据
const loadData = async () => {
  try {
    const basePath = '/members-visualization/'
    const csvPath = `${basePath}data/members.csv`
    
    const response = await fetch(csvPath)
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
    
    // 计算领域统计
    const domainCountData = {}
    parsedMembers.forEach(member => {
      member.domain.forEach(domain => {
        domainCountData[domain] = (domainCountData[domain] || 0) + 1
      })
    })
    domainCount.value = domainCountData
    
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

## 📊 组织数据概览

<div v-if="loading" class="loading">
  <p>正在加载统计数据...</p>
</div>

<div v-else>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-number">{{ members.length }}</div>
      <div class="stat-label">总成员数</div>
      <div class="stat-desc">Datawhale 组织成员总数</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">{{ Object.keys(domainCount).length }}</div>
      <div class="stat-label">研究方向数</div>
      <div class="stat-desc">涉及的研究领域总数</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">{{ members.length > 0 ? (members.reduce((sum, m) => sum + m.domain.length, 0) / members.length).toFixed(1) : 0 }}</div>
      <div class="stat-label">平均方向数/人</div>
      <div class="stat-desc">每个成员平均涉及的方向数</div>
    </div>

    <div class="stat-card">
      <div class="stat-number">{{ Object.entries(domainCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '暂无' }}</div>
      <div class="stat-label">最热门方向</div>
      <div class="stat-desc">参与人数最多的研究方向</div>
    </div>
  </div>
</div>

## 📋 详细统计分析

### 研究方向分布

<div v-if="!loading" class="domain-stats">
  <div v-for="[domain, count] in Object.entries(domainCount).sort((a, b) => b[1] - a[1])" :key="domain" class="domain-row">
    <div class="domain-name">{{ domain }}</div>
    <div class="domain-bar">
      <div class="domain-fill" :style="{ width: (count / Math.max(...Object.values(domainCount)) * 100) + '%' }"></div>
    </div>
    <div class="domain-count">{{ count }} 人 ({{ ((count / members.length) * 100).toFixed(1) }}%)</div>
  </div>
</div>

## 📤 数据导出工具

<DataExport v-if="!loading" :members="members" :domain-count="domainCount" />

<style scoped>
.loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin: 32px 0;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 24px;
  border-radius: 16px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
}

.stat-number {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 8px;
  opacity: 0.95;
}

.stat-desc {
  font-size: 0.9rem;
  opacity: 0.8;
  line-height: 1.4;
}

.domain-stats {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  margin: 24px 0;
}

.domain-row {
  display: grid;
  grid-template-columns: 1fr 2fr auto;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.domain-row:last-child {
  border-bottom: none;
}

.domain-name {
  font-weight: 600;
  color: #333;
  min-width: 120px;
}

.domain-bar {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.domain-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.6s ease;
}

.domain-count {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
  min-width: 100px;
  text-align: right;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .stat-card {
    padding: 24px 16px;
  }
  
  .stat-number {
    font-size: 2.2rem;
  }
  
  .domain-row {
    grid-template-columns: 1fr;
    gap: 8px;
    text-align: center;
  }
  
  .domain-count {
    text-align: center;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
