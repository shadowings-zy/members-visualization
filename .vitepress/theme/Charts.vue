<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import DataExport from './DataExport.vue'

// 动态导入 echarts-wordcloud
const wordCloudLoaded = ref(false)

const pieRef = ref(null)
const barRef = ref(null)
const wordCloudRef = ref(null)
const networkRef = ref(null)
const trendRef = ref(null)
const loading = ref(true)
const error = ref(null)
const members = ref([])
const domainCount = ref({})

let pieChart = null
let barChart = null
let wordCloudChart = null
let networkChart = null
let trendChart = null

// 统计信息
const stats = computed(() => {
  const totalMembers = members.value.length
  const totalDomains = Object.keys(domainCount.value).length
  const avgDomainsPerMember = totalMembers > 0 ?
    (members.value.reduce((sum, m) => sum + m.domain.length, 0) / totalMembers).toFixed(1) : 0

  return {
    totalMembers,
    totalDomains,
    avgDomainsPerMember,
    mostPopularDomain: Object.entries(domainCount.value).sort((a, b) => b[1] - a[1])[0]?.[0] || '暂无'
  }
})

onMounted(async () => {
  try {
    // 等待DOM完全渲染
    await nextTick()

    // 动态获取 CSV 数据路径，适配开发和生产环境
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/')
    const csvPath = `${basePath}data/members.csv`.replace('//', '/')

    console.log('Fetching data from:', csvPath)

    const res = await fetch(csvPath)
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    const text = await res.text()

    // 解析 CSV 数据（处理带引号的字段）
    const lines = text.trim().split('\n')
    const headers = parseCSVLine(lines[0])
    const parsedMembers = lines.slice(1).map(line => {
      const values = parseCSVLine(line)
      const obj = {}
      headers.forEach((h, i) => {
        obj[h] = values[i] || ''
      })

      // 处理特殊字段
      obj.domain = obj.domain ? obj.domain.split(';').map(d => d.trim()).filter(d => d) : []
      obj.repositories = obj.repositories ? obj.repositories.split(';').map(r => r.trim()).filter(r => r) : []

      // 转换数值字段
      obj.public_repos = parseInt(obj.public_repos) || 0
      obj.total_stars = parseInt(obj.total_stars) || 0
      obj.followers = parseInt(obj.followers) || 0
      obj.following = parseInt(obj.following) || 0

      return obj
    })

// CSV解析函数（处理带引号的字段）
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  result.push(current.trim())
  return result
}

    members.value = parsedMembers
    console.log('Parsed members:', members.value)

    // 统计领域分布
    const domainCountData = {}
    members.value.forEach(m => {
      m.domain.forEach(d => {
        if (d) {
          domainCountData[d] = (domainCountData[d] || 0) + 1
        }
      })
    })

    domainCount.value = domainCountData
    console.log('Domain count:', domainCount.value)

    // 动态加载词云插件
    try {
      await import('echarts-wordcloud')
      wordCloudLoaded.value = true
    } catch (e) {
      console.warn('词云插件加载失败，将跳过词云图表')
    }

    // ---------------- 增强饼图 ----------------
    // 等待DOM更新后再初始化图表
    await nextTick()

    if (!pieRef.value) {
      console.error('饼图容器未找到，等待DOM渲染...')
      // 延迟重试
      setTimeout(() => {
        if (pieRef.value) {
          initPieChart()
        }
      }, 100)
      return
    }

    initPieChart()

    function initPieChart() {
      if (pieChart) {
        pieChart.dispose()
      }
      const pieData = Object.entries(domainCount.value).map(([k, v]) => ({
        name: k,
        value: v
      })).sort((a, b) => b.value - a.value)

      pieChart.setOption({
        title: {
          text: '研究方向分布',
          subtext: `共 ${stats.value.totalDomains} 个研究方向`,
          left: 'center',
          textStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#333'
          },
          subtextStyle: {
            fontSize: 14,
            color: '#666'
          }
        },
        tooltip: {
          trigger: 'item',
          formatter: function(params) {
            const percent = params.percent
            const value = params.value
            return `${params.seriesName}<br/>${params.name}: ${value} 人 (${percent}%)`
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#777',
          borderWidth: 1,
          textStyle: {
            color: '#fff'
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle',
          itemGap: 12,
          textStyle: {
            fontSize: 12
          }
        },
        series: [
          {
            name: '研究方向',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#fff',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold'
              },
              itemStyle: {
                shadowBlur: 20,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            labelLine: {
              show: false
            },
            data: pieData,
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: function (idx) {
              return Math.random() * 200
            }
          }
        ]
      })
    }

    // ---------------- 增强柱状图 ----------------
    if (!barRef.value) {
      console.error('柱状图容器未找到')
      return
    }
    barChart = echarts.init(barRef.value)
    const domainEntries = Object.entries(domainCount.value).sort((a, b) => b[1] - a[1])

    barChart.setOption({
      title: {
        text: '研究方向统计',
        subtext: `平均每人涉及 ${stats.value.avgDomainsPerMember} 个方向`,
        left: 'center',
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#666'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow',
          shadowStyle: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        formatter: function(params) {
          const data = params[0]
          const total = members.value.length
          const percent = ((data.value / total) * 100).toFixed(1)
          return `${data.name}<br/>成员数量: ${data.value} 人<br/>占比: ${percent}%`
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#777',
        borderWidth: 1,
        textStyle: {
          color: '#fff'
        }
      },
      grid: {
        left: '5%',
        right: '5%',
        bottom: '15%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: domainEntries.map(([k, v]) => k),
        axisLabel: {
          rotate: 45,
          interval: 0,
          fontSize: 12,
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        }
      },
      yAxis: {
        type: 'value',
        name: '成员数量',
        nameTextStyle: {
          color: '#666',
          fontSize: 12
        },
        axisLabel: {
          color: '#666'
        },
        axisLine: {
          lineStyle: {
            color: '#ddd'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0'
          }
        }
      },
      series: [
        {
          name: '成员数量',
          type: 'bar',
          barWidth: '60%',
          data: domainEntries.map(([k, v], index) => ({
            value: v,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: `hsl(${200 + index * 20}, 70%, 70%)` },
                { offset: 1, color: `hsl(${200 + index * 20}, 70%, 50%)` }
              ]),
              borderRadius: [4, 4, 0, 0]
            }
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            }
          },
          animationDelay: function (idx) {
            return idx * 100
          }
        }
      ],
      animationEasing: 'elasticOut',
      animationDelayUpdate: function (idx) {
        return idx * 50
      }
    })

    // ---------------- 词云图 ----------------
    if (wordCloudLoaded.value && wordCloudRef.value) {
      wordCloudChart = echarts.init(wordCloudRef.value)
      wordCloudChart.setOption({
        title: {
          text: '研究方向词云',
          subtext: '字体大小反映热门程度',
          left: 'center',
          textStyle: {
            fontSize: 20,
            fontWeight: 'bold',
            color: '#333'
          },
          subtextStyle: {
            fontSize: 14,
            color: '#666'
          }
        },
        tooltip: {
          formatter: function(params) {
            return `${params.name}: ${Math.round(params.value / 10)} 人`
          }
        },
        series: [{
          type: 'wordCloud',
          gridSize: 8,
          sizeRange: [14, 60],
          rotationRange: [-45, 45],
          rotationStep: 45,
          shape: 'pentagon',
          width: '100%',
          height: '100%',
          drawOutOfBound: false,
          textStyle: {
            fontFamily: 'sans-serif',
            fontWeight: 'bold',
            color: function () {
              const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc']
              return colors[Math.floor(Math.random() * colors.length)]
            }
          },
          emphasis: {
            focus: 'self',
            textStyle: {
              shadowBlur: 10,
              shadowColor: '#333'
            }
          },
          data: Object.entries(domainCount.value).map(([k, v]) => ({
            name: k,
            value: v * 10,
            textStyle: {
              fontSize: Math.max(14, Math.min(60, v * 8))
            }
          }))
        }]
      })
    }

    // ---------------- 增强关系网络图 ----------------
    const nodes = members.value.map(m => ({
      name: m.name,
      category: 0,
      symbolSize: Math.max(20, m.domain.length * 8),
      itemStyle: {
        color: '#4CAF50',
        borderColor: '#2E7D32',
        borderWidth: 2
      },
      label: {
        show: true,
        fontSize: 10,
        color: '#333'
      }
    }))

    const domainNodes = Object.keys(domainCount.value).map(d => ({
      name: d,
      category: 1,
      symbolSize: Math.max(30, domainCount.value[d] * 8),
      itemStyle: {
        color: '#2196F3',
        borderColor: '#1565C0',
        borderWidth: 2
      },
      label: {
        show: true,
        fontSize: 12,
        fontWeight: 'bold',
        color: '#333'
      }
    }))

    const edges = []
    members.value.forEach(m => {
      m.domain.forEach(d => {
        if (d) {
          edges.push({
            source: m.name,
            target: d,
            lineStyle: {
              color: '#999',
              width: 2,
              opacity: 0.6
            }
          })
        }
      })
    })

    if (!networkRef.value) {
      console.error('网络图容器未找到')
      return
    }
    networkChart = echarts.init(networkRef.value)
    networkChart.setOption({
      title: {
        text: '成员与研究方向关系网络',
        subtext: '节点大小反映连接数量，支持拖拽和缩放',
        left: 'center',
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#666'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params) {
          if (params.dataType === 'node') {
            if (params.data.category === 0) {
              const memberDomains = members.value.find(m => m.name === params.data.name)?.domain || []
              return `成员: ${params.data.name}<br/>研究方向: ${memberDomains.join(', ')}`
            } else {
              const count = domainCount.value[params.data.name] || 0
              return `研究方向: ${params.data.name}<br/>成员数量: ${count} 人`
            }
          }
          return `${params.data.source} ↔ ${params.data.target}`
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderColor: '#777',
        borderWidth: 1,
        textStyle: {
          color: '#fff'
        }
      },
      legend: [{
        data: ['成员', '研究方向'],
        orient: 'horizontal',
        left: 'center',
        bottom: 20,
        itemGap: 20,
        textStyle: {
          fontSize: 14
        }
      }],
      series: [
        {
          type: 'graph',
          layout: 'force',
          roam: true,
          focusNodeAdjacency: true,
          data: [...nodes, ...domainNodes],
          links: edges,
          categories: [
            {
              name: '成员',
              itemStyle: {
                color: '#4CAF50'
              }
            },
            {
              name: '研究方向',
              itemStyle: {
                color: '#2196F3'
              }
            }
          ],
          force: {
            repulsion: 200,
            gravity: 0.05,
            edgeLength: [50, 100],
            layoutAnimation: true
          },
          lineStyle: {
            color: 'source',
            curveness: 0.2,
            opacity: 0.6
          },
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4,
              opacity: 0.8
            }
          },
          animationDuration: 1500,
          animationEasingUpdate: 'quinticInOut'
        }
      ]
    })

    // ---------------- 趋势分析图 ----------------
    if (!trendRef.value) {
      console.error('趋势图容器未找到')
      return
    }
    trendChart = echarts.init(trendRef.value)

    // 模拟趋势数据（实际项目中可以从历史数据获取）
    const trendData = Object.keys(domainCount.value).map(domain => ({
      name: domain,
      data: Array.from({length: 6}, (_, i) => {
        const baseValue = domainCount.value[domain]
        const variation = Math.random() * 0.3 - 0.15 // ±15% 变化
        return Math.max(1, Math.round(baseValue * (1 + variation * (i + 1) / 6)))
      })
    }))

    const months = ['6个月前', '5个月前', '4个月前', '3个月前', '2个月前', '1个月前']

    trendChart.setOption({
      title: {
        text: '研究方向趋势分析',
        subtext: '近6个月成员数量变化（模拟数据）',
        left: 'center',
        textStyle: {
          fontSize: 20,
          fontWeight: 'bold',
          color: '#333'
        },
        subtextStyle: {
          fontSize: 14,
          color: '#666'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        }
      },
      legend: {
        data: Object.keys(domainCount.value),
        top: '10%',
        type: 'scroll'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '20%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months
      },
      yAxis: {
        type: 'value',
        name: '成员数量'
      },
      series: trendData.map((item, index) => ({
        name: item.name,
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 3
        },
        showSymbol: true,
        symbolSize: 6,
        data: item.data,
        areaStyle: {
          opacity: 0.3
        }
      }))
    })

    // 响应式处理
    const handleResize = () => {
      pieChart?.resize()
      barChart?.resize()
      wordCloudChart?.resize()
      networkChart?.resize()
      trendChart?.resize()
    }
    window.addEventListener('resize', handleResize)

    loading.value = false

  } catch (err) {
    console.error('Error loading data:', err)
    error.value = err.message
    loading.value = false
  }
})

onUnmounted(() => {
  // 清理图表实例
  pieChart?.dispose()
  barChart?.dispose()
  wordCloudChart?.dispose()
  networkChart?.dispose()
  trendChart?.dispose()

  // 移除事件监听器
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="charts">
    <div v-if="loading" class="loading">
      <p>正在加载数据...</p>
    </div>
    
    <div v-else-if="error" class="error">
      <p>加载数据时出错: {{ error }}</p>
    </div>
    
    <div v-else>
      <!-- 统计概览 -->
      <div class="stats-overview">
        <div class="stat-card">
          <div class="stat-number">{{ stats.totalMembers }}</div>
          <div class="stat-label">总成员数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.totalDomains }}</div>
          <div class="stat-label">研究方向数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.avgDomainsPerMember }}</div>
          <div class="stat-label">平均方向数/人</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats.mostPopularDomain }}</div>
          <div class="stat-label">最热门方向</div>
        </div>
      </div>

      <!-- 饼图 -->
      <div class="chart-container">
        <div ref="pieRef" class="chart"></div>
      </div>

      <!-- 柱状图 -->
      <div class="chart-container">
        <div ref="barRef" class="chart"></div>
      </div>

      <!-- 词云图 -->
      <div v-if="wordCloudLoaded" class="chart-container">
        <div ref="wordCloudRef" class="chart"></div>
      </div>

      <!-- 关系网络图 -->
      <div class="chart-container">
        <div ref="networkRef" class="chart-large"></div>
      </div>

      <!-- 趋势分析图 -->
      <div class="chart-container">
        <div ref="trendRef" class="chart"></div>
      </div>

      <!-- 数据导出 -->
      <div class="chart-container">
        <DataExport :members="members" :domain-count="domainCount" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.charts {
  width: 100%;
  padding: 20px 0;
}

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 3rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.stat-label {
  font-size: 1rem;
  opacity: 0.9;
  font-weight: 500;
}

.chart-container {
  margin-bottom: 3rem;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 24px;
  background: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.chart-container:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.chart {
  width: 100%;
  height: 450px;
}

.chart-large {
  width: 100%;
  height: 700px;
}

.loading, .error {
  text-align: center;
  padding: 60px;
  font-size: 18px;
  border-radius: 12px;
  margin: 20px 0;
}

.error {
  color: #e74c3c;
  background: #fdf2f2;
  border: 1px solid #fecaca;
}

.loading {
  color: #3498db;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-number {
    font-size: 2rem;
  }

  .chart {
    height: 350px;
  }

  .chart-large {
    height: 500px;
  }

  .chart-container {
    padding: 16px;
  }
}

@media (max-width: 480px) {
  .stats-overview {
    grid-template-columns: 1fr;
  }

  .stat-number {
    font-size: 1.8rem;
  }

  .chart {
    height: 300px;
  }

  .chart-large {
    height: 400px;
  }
}
</style>
