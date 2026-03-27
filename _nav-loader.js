// 动态导航栏加载脚本 V2（支持阶段切换和向后兼容）
// 所有日推页面引用此脚本，导航栏会自动同步更新

(function() {
    // 配置
    const CONFIG = {
        maxRetries: 2,
        fallbackToLegacy: true,
        showPhaseIndicator: true
    };
    
    // 状态
    let currentPhaseNum = 1;
    let currentDayNum = null;
    let currentPhaseData = null;
    
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav);
    } else {
        initNav();
    }
    
    async function initNav() {
        try {
            // 获取当前页面信息
            const currentPage = window.location.pathname.split('/').pop();
            currentDayNum = extractDayNumber(currentPage);
            currentPhaseNum = extractPhaseNumber(currentPage) || 1;
            
            console.log(`初始化导航: 阶段${currentPhaseNum}, 第${currentDayNum}天`);
            
            // 尝试加载阶段数据
            currentPhaseData = await loadPhaseData(currentPhaseNum);
            
            if (currentPhaseData && currentPhaseData.days) {
                // 成功加载阶段数据
                generatePhaseNavBar();
                updatePhaseFooterNavigation();
                return;
            }
        } catch (error) {
            console.warn('阶段数据加载失败:', error);
        }
        
        // 如果阶段数据加载失败，尝试旧格式数据
        if (CONFIG.fallbackToLegacy) {
            try {
                const legacyData = await loadLegacyNavData();
                if (legacyData && legacyData.days) {
                    console.log('使用旧格式导航数据');
                    generateLegacyNavBar(legacyData.days);
                    updateLegacyFooterNavigation(legacyData.days);
                    return;
                }
            } catch (error) {
                console.warn('旧格式数据加载失败:', error);
            }
        }
        
        // 所有加载都失败，使用后备导航
        console.log('使用后备导航栏');
        generateFallbackNavBar();
    }
    
    // 从文件名中提取天数
    function extractDayNumber(filename) {
        if (!filename) return null;
        
        // 匹配阶段文件名格式 phase2_day1.html
        const phaseMatch = filename.match(/phase(\d+)_day(\d+)\.html/);
        if (phaseMatch) return parseInt(phaseMatch[2]);
        
        // 匹配标准文件名格式 Day_01.html
        const dayMatch = filename.match(/Day_(\d+)\.html/);
        if (dayMatch) return parseInt(dayMatch[1]);
        
        // 匹配简写格式 day1.html
        const shortMatch = filename.match(/day(\d+)\.html/);
        if (shortMatch) return parseInt(shortMatch[1]);
        
        return null;
    }
    
    // 从文件名中提取阶段号
    function extractPhaseNumber(filename) {
        if (!filename) return 1;
        
        // 匹配阶段文件名格式 phase2_day1.html（向后兼容）
        const phaseMatch = filename.match(/phase(\d+)_day(\d+)\.html/);
        if (phaseMatch) return parseInt(phaseMatch[1]);
        
        // 根据总天数计算阶段号（Day_XX.html格式）
        // 阶段1：day 1-7，阶段2：day 8-14，阶段3：day 15-21，阶段4：day 22-28
        const dayMatch = filename.match(/Day_(\d+)\.html/);
        if (dayMatch) {
            const dayNum = parseInt(dayMatch[1]);
            if (dayNum >= 1 && dayNum <= 7) return 1;
            if (dayNum >= 8 && dayNum <= 14) return 2;
            if (dayNum >= 15 && dayNum <= 21) return 3;
            if (dayNum >= 22 && dayNum <= 28) return 4;
            return Math.ceil(dayNum / 7); // 默认计算方式
        }
        
        return 1;
    }
    
    // 加载阶段数据
    async function loadPhaseData(phaseNum) {
        if (!phaseNum || phaseNum < 1) phaseNum = 1;
        
        // 尝试加载阶段专属文件
        const phaseFilename = `_nav-data-phase${phaseNum}.json`;
        
        try {
            const response = await fetchWithRetry(phaseFilename, CONFIG.maxRetries);
            if (response.ok) {
                const data = await response.json();
                console.log(`成功加载阶段${phaseNum}数据`);
                return data;
            }
        } catch (error) {
            console.warn(`阶段${phaseNum}数据加载失败:`, error);
        }
        
        // 尝试从主数据中提取阶段信息
        try {
            const mainResponse = await fetchWithRetry('_nav-data.json', CONFIG.maxRetries);
            if (mainResponse.ok) {
                const mainData = await mainResponse.json();
                if (mainData && mainData.phases && mainData.phases[phaseNum - 1]) {
                    console.log(`从主数据中提取阶段${phaseNum}`);
                    return mainData.phases[phaseNum - 1];
                }
            }
        } catch (error) {
            console.warn('主数据加载失败:', error);
        }
        
        throw new Error(`无法加载阶段${phaseNum}数据`);
    }
    
    // 加载旧格式导航数据
    async function loadLegacyNavData() {
        try {
            const response = await fetchWithRetry('_nav-data.json', CONFIG.maxRetries);
            if (response.ok) {
                const data = await response.json();
                
                // 如果是旧格式，返回days数组
                if (data && data.days) {
                    return data;
                }
                
                // 如果是新格式但phases数组为空，返回第一个阶段的数据
                if (data && data.phases && data.phases.length > 0 && data.phases[0].days) {
                    return { days: data.phases[0].days };
                }
            }
        } catch (error) {
            console.warn('旧格式数据加载失败:', error);
        }
        
        throw new Error('无法加载旧格式数据');
    }
    
    // 带重试的fetch
    async function fetchWithRetry(url, maxRetries) {
        let lastError;
        
        for (let i = 0; i <= maxRetries; i++) {
            try {
                const response = await fetch(`${url}?_t=${Date.now() + i}`);
                if (response.ok) {
                    return response;
                }
                lastError = new Error(`HTTP ${response.status} for ${url}`);
            } catch (error) {
                lastError = error;
            }
            
            if (i < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
            }
        }
        
        throw lastError;
    }
    
    // 生成阶段导航栏
    function generatePhaseNavBar() {
        if (!currentPhaseData || !currentPhaseData.days) {
            generateFallbackNavBar();
            return;
        }
        
        // 查找当前页面在阶段中的索引
        const currentIndex = currentPhaseData.days.findIndex(day => day.num === currentDayNum);
        
        if (currentIndex === -1) {
            generateFallbackNavBar();
            return;
        }
        
        const currentDay = currentPhaseData.days[currentIndex];
        const prevDay = currentIndex > 0 ? currentPhaseData.days[currentIndex - 1] : null;
        const nextDay = currentIndex < currentPhaseData.days.length - 1 ? currentPhaseData.days[currentIndex + 1] : null;
        
        // 检查是否为阶段边界
        const isFirstDayInPhase = currentDayNum === 1;
        const isLastDayInPhase = currentDayNum === (currentPhaseData.totalDays || 7);
        
        // 创建导航栏HTML
        let navHTML = `<a class="home" href="index.html">📖 目录</a>`;
        
        // 上一阶段按钮（如果不是第一阶段的第一天）
        if (isFirstDayInPhase && currentPhaseNum > 1 && currentPhaseData.prevPhaseFile) {
            navHTML += `<a class="prev-phase" href="${currentPhaseData.prevPhaseFile}">← 上一阶段</a>`;
        }
        
        // 上一篇按钮
        if (prevDay) {
            navHTML += `<a class="prev" href="${prevDay.file}">← Day ${prevDay.num}</a>`;
        }
        
        // 当前页标识
        const phaseIndicator = CONFIG.showPhaseIndicator ? `<span class="phase-indicator">阶段${currentPhaseNum}</span>` : '';
        navHTML += `<a class="current">Day ${currentDayNum}${phaseIndicator}</a>`;
        
        // 下一篇按钮
        if (nextDay) {
            navHTML += `<a class="next" href="${nextDay.file}">Day ${nextDay.num} →</a>`;
        }
        
        // 下一阶段按钮（如果是最后一天且不是最后一个阶段）
        if (isLastDayInPhase && currentPhaseData.nextPhaseFile) {
            navHTML += `<a class="next-phase" href="${currentPhaseData.nextPhaseFile}">下一阶段 →</a>`;
        }
        
        // 插入到页面中
        insertNavBar(navHTML);
    }
    
    // 生成旧格式导航栏
    function generateLegacyNavBar(days) {
        if (!days || !Array.isArray(days)) {
            generateFallbackNavBar();
            return;
        }
        
        const currentIndex = days.findIndex(day => day.num === currentDayNum);
        
        if (currentIndex === -1) {
            generateFallbackNavBar();
            return;
        }
        
        const currentDay = days[currentIndex];
        const prevDay = currentIndex > 0 ? days[currentIndex - 1] : null;
        const nextDay = currentIndex < days.length - 1 ? days[currentIndex + 1] : null;
        
        // 创建导航栏HTML
        let navHTML = `<a class="home" href="index.html">📖 目录</a>`;
        
        if (prevDay) {
            navHTML += `<a class="prev" href="${prevDay.file}">← Day ${prevDay.num}</a>`;
        }
        
        navHTML += `<a class="current">Day ${currentDayNum}</a>`;
        
        if (nextDay) {
            navHTML += `<a class="next" href="${nextDay.file}">Day ${nextDay.num} →</a>`;
        }
        
        insertNavBar(navHTML);
    }
    
    // 生成后备导航栏
    function generateFallbackNavBar() {
        let navHTML = `<a class="home" href="index.html">📖 目录</a>`;
        navHTML += `<a class="current">Day ${currentDayNum || '?'}</a>`;
        
        if (currentDayNum > 1) {
            const prevDayNum = currentDayNum - 1;
            const prevDayFormatted = prevDayNum.toString().padStart(2, '0');
            navHTML += `<a class="prev" href="Day_${prevDayFormatted}.html">← Day ${prevDayNum}</a>`;
        }
        
        const nextDayNum = currentDayNum + 1;
        const nextDayFormatted = nextDayNum.toString().padStart(2, '0');
        navHTML += `<a class="next" href="Day_${nextDayFormatted}.html">Day ${nextDayNum} →</a>`;
        
        insertNavBar(navHTML);
    }
    
    // 插入导航栏到页面
    function insertNavBar(html) {
        const navBar = document.querySelector('.nav-bar');
        if (navBar) {
            navBar.innerHTML = html;
        } else {
            // 如果页面没有nav-bar容器，就在页面顶部添加一个
            const container = document.querySelector('.container');
            if (container) {
                const navDiv = document.createElement('div');
                navDiv.className = 'nav-bar';
                navDiv.innerHTML = html;
                container.insertBefore(navDiv, container.firstChild);
            }
        }
    }
    
    // 更新阶段底部导航
    function updatePhaseFooterNavigation() {
        if (!currentPhaseData || !currentPhaseData.days) return;
        
        const currentIndex = currentPhaseData.days.findIndex(day => day.num === currentDayNum);
        if (currentIndex === -1) return;
        
        const prevDay = currentIndex > 0 ? currentPhaseData.days[currentIndex - 1] : null;
        const nextDay = currentIndex < currentPhaseData.days.length - 1 ? currentPhaseData.days[currentIndex + 1] : null;
        
        // 检查是否为阶段边界
        const isFirstDayInPhase = currentDayNum === 1;
        const isLastDayInPhase = currentDayNum === (currentPhaseData.totalDays || 7);
        
        // 更新上一篇链接
        updateFooterButton('.prev', prevDay, isFirstDayInPhase && currentPhaseNum > 1, '上一阶段');
        
        // 更新下一篇链接
        updateFooterButton('.next', nextDay, isLastDayInPhase, '下一阶段');
    }
    
    // 更新旧格式底部导航
    function updateLegacyFooterNavigation(days) {
        const currentIndex = days.findIndex(day => day.num === currentDayNum);
        if (currentIndex === -1) return;
        
        const prevDay = currentIndex > 0 ? days[currentIndex - 1] : null;
        const nextDay = currentIndex < days.length - 1 ? days[currentIndex + 1] : null;
        
        updateFooterButton('.prev', prevDay, false, '上一篇');
        updateFooterButton('.next', nextDay, false, '下一篇');
    }
    
    // 更新底部按钮通用函数
    function updateFooterButton(selector, day, showPhaseLink, phaseText) {
        const btn = document.querySelector(`.footer-nav-btn${selector}`);
        if (!btn) return;
        
        if (day) {
            btn.className = 'footer-nav-btn';
            btn.href = day.file;
            btn.innerHTML = selector === '.prev' 
                ? `<span>←</span> Day ${day.num}`
                : `Day ${day.num} <span>→</span>`;
        } else if (showPhaseLink) {
            btn.className = 'footer-nav-btn';
            btn.href = selector === '.prev' 
                ? (currentPhaseData.prevPhaseFile || '#')
                : (currentPhaseData.nextPhaseFile || '#');
            btn.innerHTML = selector === '.prev'
                ? `<span>←</span> ${phaseText}`
                : `${phaseText} <span>→</span>`;
        } else {
            btn.className = 'footer-nav-btn disabled';
            btn.removeAttribute('href');
            btn.innerHTML = selector === '.prev'
                ? `<span>←</span> 上一篇`
                : `下一篇 <span>→</span>`;
        }
    }
    
    // 添加CSS样式
    function ensureNavStyles() {
        const styleId = 'dynamic-nav-styles-v2';
        if (document.getElementById(styleId)) return;
        
        const styles = `
            .nav-bar {
                display: flex; gap: 10px; margin-bottom: 20px; align-items: center;
                flex-wrap: wrap;
            }
            .nav-bar a {
                padding: 8px 18px; border-radius: 8px; text-decoration: none;
                font-size: 13px; font-weight: 600; transition: all 0.2s;
            }
            .nav-bar a.home { background: #fff; color: #1a5276; border: 1px solid #d4e6f1; }
            .nav-bar a.home:hover { background: #eaf2f8; }
            .nav-bar a.prev { background: #fff; color: #2c3e50; border: 1px solid #ecf0f1; }
            .nav-bar a.prev:hover { background: #f8f9fb; }
            .nav-bar a.next { background: #2e86c1; color: #fff; border: 1px solid #2e86c1; }
            .nav-bar a.next:hover { opacity: 0.9; }
            .nav-bar a.prev-phase { background: #f8f9fa; color: #8e44ad; border: 1px solid #e8eaf5; }
            .nav-bar a.prev-phase:hover { background: #f0e7f6; }
            .nav-bar a.next-phase { background: #27ae60; color: #fff; border: 1px solid #27ae60; }
            .nav-bar a.next-phase:hover { opacity: 0.9; }
            .nav-bar a.current { 
                background: #ecf0f1; color: #7f8c8d; cursor: default;
                border: 1px solid #dce4e6; display: flex; align-items: center; gap: 8px;
            }
            .phase-indicator {
                display: inline-block; padding: 2px 8px; border-radius: 4px;
                font-size: 11px; font-weight: 600;
                background: #e8eaf5; color: #8e44ad;
            }
            .footer-nav-btn {
                padding: 8px 16px; border: 1px dashed #95a5a6; border-radius: 6px;
                background: transparent; color: #7f8c8d; font-size: 13px;
                cursor: pointer; transition: all 0.2s ease;
                text-decoration: none; display: inline-flex; align-items: center; gap: 5px;
            }
            .footer-nav-btn:hover {
                border-color: #2e86c1; color: #2e86c1;
            }
            .footer-nav-btn.disabled {
                opacity: 0.4; cursor: not-allowed;
            }
            .footer-nav-btn.disabled:hover {
                border-color: #95a5a6; color: #7f8c8d;
            }
            
            /* 移动端适配 */
            @media (max-width: 600px) {
                .nav-bar {
                    gap: 6px;
                }
                .nav-bar a {
                    padding: 6px 12px; font-size: 12px;
                }
                .nav-bar a.current {
                    font-size: 12px;
                }
                .phase-indicator {
                    padding: 1px 6px; font-size: 10px;
                }
            }
        `;
        
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    // 确保CSS样式存在
    ensureNavStyles();
})();