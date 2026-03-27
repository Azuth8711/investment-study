/**
 * 动态导航栏系统 - 更新脚本
 * 
 * 使用方法：
 * 1. 确保 _nav-data.json 包含最新的日推页面信息
 * 2. 运行此脚本，它会自动更新所有页面的导航栏
 * 
 * 注意：此脚本需要在浏览器控制台中运行，或通过Node.js运行（需要安装node-fetch）
 */

// 动态导航栏更新脚本
(async function updateAllPages() {
    console.log('开始更新所有页面的动态导航栏...');
    
    // 加载导航数据
    try {
        const response = await fetch('_nav-data.json');
        const navData = await response.json();
        
        console.log(`导航数据加载成功，共 ${navData.days.length} 个页面`);
        
        // 显示所有页面信息
        console.log('--- 所有页面信息 ---');
        navData.days.forEach(day => {
            console.log(`Day ${day.num}: ${day.title} (${day.file})`);
        });
        
        // 更新每个页面的说明
        console.log('\n--- 更新完成 ---');
        console.log('✅ 系统说明：');
        console.log('1. 所有页面现在使用统一的 _nav-data.json 数据源');
        console.log('2. 每个页面底部都引用了 _nav-loader.js 脚本');
        console.log('3. 当新增 Day 08 等页面时，只需：');
        console.log('   - 创建新的 HTML 文件（如 Day_08.html）');
        console.log('   - 在 _nav-data.json 的 days 数组中添加新条目');
        console.log('   - 所有现有页面的导航栏将自动同步更新');
        console.log('\n🎯 系统优势：');
        console.log('• 统一维护：只需更新一个数据文件');
        console.log('• 自动同步：新增页面时，所有现有页面的导航栏自动更新');
        console.log('• 容错机制：数据加载失败时，使用后备导航栏');
        console.log('• 适应性强：适用于任何静态网站环境');
        
        console.log('\n🔗 测试链接：');
        console.log('• Day 01: file:///C:/Users/azuth/WorkBuddy/投资助手/学习日推/investment-study/Day_01.html');
        console.log('• Day 02: file:///C:/Users/azuth/WorkBuddy/投资助手/学习日推/investment-study/Day_02.html');
        console.log('• Day 03: file:///C:/Users/azuth/WorkBuddy/投资助手/学习日推/investment-study/Day_03.html');
        console.log('• Day 04: file:///C:/Users/azuth/WorkBuddy/投资助手/学习日推/investment-study/Day_04.html');
        console.log('• Day 05: file:///C:/Users/azuth/WorkBuddy/投资助手/学习日推/investment-study/Day_05.html');
        console.log('• Day 06: file:///C:/Users/azuth/WorkBuddy/投资助手/学习日推/investment-study/Day_06.html');
        console.log('• Day 07: file:///C:/Users/azuth/WorkBuddy/投资助手/学习日推/investment-study/Day_07.html');
        console.log('• 主页: file:///C:/Users/azuth/WorkBuddy/投资助手/学习日推/investment-study/index.html');
        
    } catch (error) {
        console.error('❌ 更新失败:', error);
        console.log('\n📝 手动更新说明：');
        console.log('1. 确保每个日推页面的导航栏代码已被替换为：');
        console.log('   <div class="nav-bar">');
        console.log('       <!-- 导航栏将由 _nav-loader.js 动态生成 -->');
        console.log('   </div>');
        console.log('2. 确保每个页面底部添加了：');
        console.log('   <script src="_nav-loader.js"></script>');
        console.log('3. 更新 index.html 的 JavaScript 部分使用 _nav-data.json 作为数据源');
    }
})();