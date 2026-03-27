// 动态导航栏加载脚本
// 所有日推页面引用此脚本，导航栏会自动同步更新

(function() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNav);
    } else {
        initNav();
    }
    
    function initNav() {
        // 获取当前页面信息
        const currentPage = window.location.pathname.split('/').pop();
        const currentDayNum = extractDayNumber(currentPage);
        
        // 加载导航数据并生成导航栏
        loadNavData().then(navData => {
            if (navData && navData.days) {
                generateNavBar(currentDayNum, navData.days);
                updateFooterNavigation(currentDayNum, navData.days);
            }
        }).catch(error => {
            console.error('导航数据加载失败:', error);
            // 使用默认导航栏
            generateFallbackNavBar(currentDayNum);
        });
    }
    
    // 从文件名中提取天数
    function extractDayNumber(filename) {
        const match = filename.match(/Day_(\d+)\.html/);
        return match ? parseInt(match[1]) : null;
    }
    
    // 加载导航数据
    function loadNavData() {
        return fetch('_nav-data.json')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            });
    }
    
    // 生成动态导航栏
    function generateNavBar(currentDayNum, days) {
        // 找到当前页面的索引
        const currentIndex = days.findIndex(day => day.num === currentDayNum);
        
        if (currentIndex === -1) {
            generateFallbackNavBar(currentDayNum);
            return;
        }
        
        const currentDay = days[currentIndex];
        const prevDay = currentIndex > 0 ? days[currentIndex - 1] : null;
        const nextDay = currentIndex < days.length - 1 ? days[currentIndex + 1] : null;
        
        // 创建导航栏HTML
        const navHTML = `
            <a class="home" href="index.html">📖 目录</a>
            ${prevDay ? `<a class="prev" href="${prevDay.file}">← Day ${prevDay.num}</a>` : ''}
            <a class="current">Day ${currentDayNum}</a>
            ${nextDay ? `<a class="next" href="${nextDay.file}">Day ${nextDay.num} →</a>` : ''}
        `;
        
        // 插入到页面中
        const navBar = document.querySelector('.nav-bar');
        if (navBar) {
            navBar.innerHTML = navHTML;
        } else {
            // 如果页面没有nav-bar容器，就在页面顶部添加一个
            const container = document.querySelector('.container');
            if (container) {
                const navDiv = document.createElement('div');
                navDiv.className = 'nav-bar';
                navDiv.innerHTML = navHTML;
                container.insertBefore(navDiv, container.firstChild);
            }
        }
    }
    
    // 更新底部导航
    function updateFooterNavigation(currentDayNum, days) {
        const currentIndex = days.findIndex(day => day.num === currentDayNum);
        if (currentIndex === -1) return;
        
        const prevDay = currentIndex > 0 ? days[currentIndex - 1] : null;
        const nextDay = currentIndex < days.length - 1 ? days[currentIndex + 1] : null;
        
        // 更新上一篇链接
        const prevBtn = document.querySelector('.footer-nav-btn.prev');
        if (prevBtn && prevDay) {
            prevBtn.className = 'footer-nav-btn';
            prevBtn.href = prevDay.file;
            prevBtn.innerHTML = `<span>←</span> Day ${prevDay.num}`;
        } else if (prevBtn && !prevDay) {
            prevBtn.className = 'footer-nav-btn disabled';
            prevBtn.removeAttribute('href');
            prevBtn.innerHTML = `<span>←</span> 上一篇`;
        }
        
        // 更新下一篇链接
        const nextBtn = document.querySelector('.footer-nav-btn.next');
        if (nextBtn && nextDay) {
            nextBtn.className = 'footer-nav-btn';
            nextBtn.href = nextDay.file;
            nextBtn.innerHTML = `Day ${nextDay.num} <span>→</span>`;
        } else if (nextBtn && !nextDay) {
            nextBtn.className = 'footer-nav-btn disabled';
            nextBtn.removeAttribute('href');
            nextBtn.innerHTML = `下一篇 <span>→</span>`;
        }
    }
    
    // 生成后备导航栏（当数据加载失败时使用）
    function generateFallbackNavBar(currentDayNum) {
        const navBar = document.querySelector('.nav-bar');
        if (!navBar) return;
        
        let navHTML = `<a class="home" href="index.html">📖 目录</a>`;
        navHTML += `<a class="current">Day ${currentDayNum || '?'}</a>`;
        
        if (currentDayNum > 1) {
            navHTML += `<a class="prev" href="Day_${currentDayNum - 1}.html">← Day ${currentDayNum - 1}</a>`;
        }
        
        navHTML += `<a class="next" href="Day_${currentDayNum + 1}.html">Day ${currentDayNum + 1} →</a>`;
        
        navBar.innerHTML = navHTML;
    }
    
    // 添加CSS样式（如果页面没有的话）
    function ensureNavStyles() {
        const styleId = 'dynamic-nav-styles';
        if (document.getElementById(styleId)) return;
        
        const styles = `
            .nav-bar {
                display: flex; gap: 10px; margin-bottom: 20px; align-items: center;
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
            .nav-bar a.current { background: #ecf0f1; color: #7f8c8d; cursor: default; }
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
        `;
        
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
    }
    
    // 确保CSS样式存在
    ensureNavStyles();
})();