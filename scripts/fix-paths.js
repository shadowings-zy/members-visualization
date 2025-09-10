#!/usr/bin/env node

/**
 * 修复构建后的HTML文件中的资源路径
 * 将相对路径转换为包含base路径的绝对路径
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/members-visualization';
const DIST_DIR = path.join(__dirname, '..', 'docs', '.vitepress', 'dist');

function fixPaths() {
  console.log('🔧 开始修复资源路径...');

  // 获取所有HTML文件
  const htmlFiles = getHtmlFiles(DIST_DIR);

  htmlFiles.forEach(filePath => {
    console.log(`📝 处理文件: ${path.relative(DIST_DIR, filePath)}`);

    let content = fs.readFileSync(filePath, 'utf8');

    // 修复各种资源路径
    content = content
      // 修复CSS文件路径
      .replace(/href="\/assets\//g, `href="${BASE_PATH}/assets/`)
      .replace(/href="\/vp-icons\.css"/g, `href="${BASE_PATH}/vp-icons.css"`)

      // 修复JS文件路径
      .replace(/src="\/assets\//g, `src="${BASE_PATH}/assets/`)

      // 修复字体文件路径
      .replace(/href="\/assets\/inter-/g, `href="${BASE_PATH}/assets/inter-`)

      // 修复模块预加载路径
      .replace(/href="\/assets\/chunks\//g, `href="${BASE_PATH}/assets/chunks/`)

      // 修复logo路径
      .replace(/href="\/logo\.svg"/g, `href="${BASE_PATH}/logo.svg"`)
      .replace(/src="\/logo\.svg"/g, `src="${BASE_PATH}/logo.svg"`)
      .replace(/"\/logo\.svg"/g, `"${BASE_PATH}/logo.svg"`)

      // 修复favicon路径
      .replace(/href="\/favicon\.ico"/g, `href="${BASE_PATH}/favicon.ico"`)
      .replace(/\/favicon\.ico/g, `${BASE_PATH}/favicon.ico`)

      // 修复数据文件路径
      .replace(/\/data\/members\.csv/g, `${BASE_PATH}/data/members.csv`)

      // 修复Vue组件中的数据路径
      .replace(/const basePath = import\.meta\.env\.BASE_URL \|\| '\/'/g, `const basePath = '${BASE_PATH}/'`)

      // 修复JavaScript中的资源路径
      .replace(/\/assets\//g, `${BASE_PATH}/assets/`)
      .replace(/\/hashmap\.json/g, `${BASE_PATH}/hashmap.json`)

      // 修复base路径设置
      .replace(/"base":"\/"/g, `"base":"${BASE_PATH}/"`);

    fs.writeFileSync(filePath, content, 'utf8');
  });

  console.log(`✅ 成功修复 ${htmlFiles.length} 个HTML文件的路径`);
}

function getHtmlFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    items.forEach(item => {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item.endsWith('.html')) {
        files.push(fullPath);
      }
    });
  }

  traverse(dir);
  return files;
}

// 运行修复
if (require.main === module) {
  try {
    fixPaths();
  } catch (error) {
    console.error('❌ 修复路径时出错:', error.message);
    process.exit(1);
  }
}
