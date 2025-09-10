# 🔄 数据更新

## 📅 自动更新机制

### 定时更新
系统每天 **00:00 UTC**（北京时间 08:00）自动执行数据更新任务：

1. **数据拉取**：从 GitHub API 获取最新的组织成员信息
2. **数据处理**：解析和转换数据格式
3. **变化检测**：对比新旧数据，检测是否有变化
4. **智能部署**：只有数据发生变化时才重新构建和部署网站

### 更新内容
- ✅ **成员列表**：新加入或离开的成员
- ✅ **个人信息**：姓名、头像、简介等基本信息
- ✅ **仓库统计**：仓库数量、star 数、关注者数等
- ✅ **研究方向**：基于最新仓库内容推断的研究方向
- ✅ **活跃度数据**：最近的提交、仓库更新等活跃度指标

## 🔧 手动更新方式

### 对于项目维护者

#### 方式一：触发 GitHub Actions
1. 访问项目的 [GitHub Actions 页面](https://github.com/datawhalechina/members-visualization/actions)
2. 选择 "Daily Data Update" 工作流
3. 点击 "Run workflow" 按钮
4. 选择分支并点击 "Run workflow" 确认

#### 方式二：本地运行脚本
```bash
# 克隆项目
git clone https://github.com/datawhalechina/members-visualization.git
cd members-visualization

# 安装依赖
npm install

# 设置环境变量（可选，避免 API 限制）
export GITHUB_TOKEN=your_github_token
export GITHUB_ORG=datawhalechina

# 运行数据拉取脚本
npm run fetch-data

# 或使用 Python 脚本
npm run fetch-data:python
```

#### 方式三：直接编辑数据文件
1. 编辑 `data/members.csv` 文件
2. 按照以下格式添加或修改成员信息：
   ```csv
   id,name,github,domain
   username,"显示名称","https://github.com/username","研究方向1;研究方向2"
   ```
3. 提交更改到 GitHub
4. 系统会自动重新构建和部署

## 📊 数据格式说明

### CSV 文件结构
```csv
id,name,github,domain
archwalker,"archwalker","https://github.com/archwalker","机器学习"
ChuanyuXue,"skewcy","https://github.com/ChuanyuXue","机器学习;推荐系统"
```

### 字段说明
- **id**：GitHub 用户名（必填）
- **name**：显示名称（必填）
- **github**：GitHub 主页链接（必填）
- **domain**：研究方向，多个方向用分号 `;` 分隔（必填）

### 研究方向标准化
为了保持数据的一致性，建议使用以下标准化的研究方向名称：

- **机器学习** - Machine Learning
- **深度学习** - Deep Learning  
- **自然语言处理** - NLP
- **计算机视觉** - CV
- **推荐系统** - Recommendation Systems
- **数据挖掘** - Data Mining
- **强化学习** - Reinforcement Learning
- **前端开发** - Frontend Development
- **后端开发** - Backend Development
- **数据科学** - Data Science
- **人工智能** - Artificial Intelligence

## 🔍 数据质量保证

### 自动验证
- **格式检查**：确保 CSV 格式正确
- **链接验证**：验证 GitHub 链接的有效性
- **数据完整性**：检查必填字段是否完整
- **重复检测**：检测和处理重复的成员记录

### 数据清洗
- **编码处理**：正确处理中文字符编码
- **空值处理**：处理空值和缺失数据
- **格式统一**：统一数据格式和命名规范
- **异常处理**：处理异常和错误数据

## 🚨 错误处理机制

### API 限制处理
- **速率限制检测**：自动检测 GitHub API 速率限制
- **智能重试**：使用指数退避算法进行重试
- **降级策略**：API 失败时使用现有数据
- **通知机制**：及时通知维护者处理问题

### 数据备份
- **自动备份**：每次更新前自动备份现有数据
- **版本控制**：通过 Git 保存数据的历史版本
- **恢复机制**：出现问题时可以快速恢复到之前的版本
- **备份清理**：定期清理过期的备份文件

## 📈 更新日志

### 查看更新历史
- **GitHub Commits**：查看 `data/members.csv` 的提交历史
- **Actions 日志**：查看 GitHub Actions 的执行日志
- **网站更新时间**：页面底部显示最后更新时间

### 更新通知
- **GitHub Issues**：重要更新会在 Issues 中通知
- **Commit 消息**：详细的提交消息说明更新内容
- **Release Notes**：重大版本更新的发布说明

## 🛠️ 故障排除

### 常见问题

#### Q: 数据更新失败怎么办？
A: 检查 GitHub Actions 日志，通常是 API 限制或网络问题。可以手动重新运行工作流。

#### Q: 新成员没有显示怎么办？
A: 确保新成员已加入 Datawhale GitHub 组织，并且组织设置为公开可见。

#### Q: 研究方向显示不准确怎么办？
A: 可以手动编辑 `data/members.csv` 文件来修正研究方向信息。

#### Q: 网站显示的数据是旧的怎么办？
A: 检查浏览器缓存，尝试强制刷新页面（Ctrl+F5）。

### 联系支持
如果遇到无法解决的问题，可以：
- 在 [GitHub Issues](https://github.com/datawhalechina/members-visualization/issues) 提交问题
- 联系项目维护者
- 查看项目文档获取更多帮助

## 🔮 未来计划

### 功能增强
- **实时更新**：考虑实现更频繁的数据更新
- **增量更新**：只更新变化的部分，提高效率
- **多数据源**：支持从多个平台获取数据
- **用户反馈**：允许用户提交数据修正建议

### 性能优化
- **缓存优化**：改进数据缓存策略
- **并发处理**：并行处理多个 API 请求
- **压缩存储**：优化数据存储格式
- **CDN 加速**：使用 CDN 加速数据访问

---

*数据的及时性和准确性是平台价值的核心，我们持续优化数据更新机制以提供最佳体验。*
