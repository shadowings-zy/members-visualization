# 成员可视化

<script setup>
import Charts from './.vitepress/theme/Charts.vue'
import MembersList from './.vitepress/theme/MembersList.vue'
</script>



## 成员详情

以下是所有成员的详细信息，包括 GitHub 数据和研究方向：

<MembersList />

## 使用说明

### 饼图
- 显示各研究方向的成员数量分布
- 鼠标悬停可查看具体数值和百分比
- 点击图例可隐藏/显示对应的数据

### 柱状图
- 按成员数量排序显示各研究方向
- 支持鼠标悬停查看详细数值
- 渐变色彩增强视觉效果

### 关系图
- 绿色节点代表成员
- 蓝色节点代表研究方向
- 节点大小反映重要程度
- 支持拖拽和缩放操作
- 鼠标悬停可查看详细信息

## 数据更新

要更新数据，请编辑 `data/members.csv` 文件：

1. 保持 CSV 格式：`id,name,github,domain`
2. 多个研究方向用分号 `;` 分隔
3. 提交更改后，GitHub Actions 会自动重新部署

## 示例数据格式

```csv
id,name,github,domain
user1,张三,https://github.com/user1,"推荐系统;CV"
user2,李四,https://github.com/user2,"NLP"
```

---

*数据最后更新时间：{{ new Date().toLocaleDateString('zh-CN') }}*
