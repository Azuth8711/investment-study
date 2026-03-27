// 动态导航栏加载脚本（支持阶段切换）
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
        const currentPhaseNum = extractPhaseNumber(currentPage);
        
        // 加载导航数据并生成导航栏
        loadPhaseData(currentPhaseNum).then(phaseData => {
            if (phaseData && phaseData.days) {
                generateNavBar(currentDayNum, phaseData, currentPhaseNum);
                updateFooterNavigation(currentDayNum, phaseData, currentPhaseNum);
            }
        }).catch(error => {
            console.error('阶段数据加载失败:', error);
            // 使用默认导航栏
            generateFallbackNavBar(currentDayNum);
        });
    }
    
    // 从文件名中提取天数
    function extractDayNumber(filename) {
        const match = filename.match(/Day_(\d+)\.html/);
        if (match) return parseInt(match[1]);
        
        // 尝试匹配阶段文件名格式 phase2_day1.html
        const phaseMatch = filename.match(/phase(\d+)_day(\d+)\.html/);
        return phaseMatch ? parseInt(phaseMatch[2]) : null;
    }
    
    // 从文件名中提取阶段号
    function extractPhaseNumber(filename) {
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
    function loadPhaseData(phaseNum) {
        if (!phaseNum || phaseNum < 1) phaseNum = 1;
        
        const phaseFilename = `_nav-data-phase${phaseNum}.json`;
        
        return fetch(phaseFilename)
            .then(response => {
                if (!response.ok) throw new Error(`Network response was not ok for ${phaseFilename}`);
                return response.json();
            })
            .catch(error => {
                console.warn(`阶段${phaseNum}数据加载失败，尝试加载主数据:`, error);
                // 如果阶段文件不存在，尝试加载主数据
                return fetch('_nav-data.json')
                    .then(response => {
                        if (!response.ok) throw new Error('Network response was not ok for _nav-data.json');
                        return response.json();
                    })
                    .then(mainData => {
                        // 从主数据中提取当前阶段的数据
                        if (mainData && mainData.phases && mainData.phases[phaseNum - 1]) {
                            return mainData.phases[phaseNum - 1];
                        }
                        throw new Error(`阶段${phaseNum}数据不存在`);
                    });
            });
    }
    
    // 生成动态导航栏（支持阶段切换）
    function generateNavBar(currentDayNum, phaseData, currentPhaseNum) {
        // 查找当前页面在阶段中的索引
        const currentIndex = phaseData.days.findIndex(day => day.num === currentDayNum);
        
        if (currentIndex === -1) {
            generateFallbackNavBar(currentDayNum);
            return;
        }
        
        const currentDay = phaseData.days[currentIndex];
        const prevDay = currentIndex > 0 ? phaseData.days[currentIndex - 1] : null;
        const nextDay = currentIndex < phaseData.days.length - 1 ? phaseData.days[currentIndex + 1] : null;
        
        // 检查是否为阶段边界
        const isFirstDayInPhase = currentDayNum === 1;
        const isLastDayInPhase = currentDayNum === phaseData.totalDays;
        
        // 创建导航栏HTML
        let navHTML = `<a class="home" href="index.html">📖 目录</a>`;
        
        // 上一阶段按钮（如果不是第一阶段的第一天）
        if (isFirstDayInPhase && currentPhaseNum > 1 && phaseData.prevPhaseFile) {
            navHTML += `<a class="prev-phase" href="${phaseData.prevPhaseFile}">← 上一阶段</a>`;
        }
        
        // 上一篇按钮
        if (prevDay) {
            navHTML += `<a class="prev" href="${prevDay.file}">← Day ${prevDay.num}</a>`;
        }
        
        // 当前页标识
        navHTML += `<a class="current">阶段${currentPhaseNum} · Day ${currentDayNum}</a>`;
        
        // 下一篇按钮
        if (nextDay) {
            navHTML += `<a class="next" href="${nextDay.file}">Day ${nextDay.num} →</a>`;
        }
        
        // 下一阶段按钮（如果是最后一天且不是最后一个阶段）
        if (isLastDayInPhase && phaseData.nextPhaseFile) {
            navHTML += `<a class="next-phase" href="${phaseData.nextPhaseFile}">下一阶段 →</a>`;
        }
        
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
    function updateFooterNavigation(currentDayNum, phaseData, currentPhaseNum) {
        const currentIndex = phaseData.days.findIndex(day => day.num === currentDayNum);
        if (currentIndex === -1) return;
        
        const prevDay = currentIndex > 0 ? phaseData.days[currentIndex - 1] : null;
        const nextDay = currentIndex < phaseData.days.length - 1 ? phaseData.days[currentIndex + 1] : null;
        
        // 检查是否为阶段边界
        const isFirstDayInPhase = currentDayNum === 1;
        const isLastDayInPhase = currentDayNum === phaseData.totalDays;
        
        // 更新上一篇链接
        const prevBtn = document.querySelector('.footer-nav-btn.prev');
        if (prevBtn) {
            if (prevDay) {
                prevBtn.className = 'footer-nav-btn';
                prevBtn.href = prevDay.file;
                prevBtn.innerHTML = `<span>←</span> Day ${prevDay.num}`;
            } else if (isFirstDayInPhase && currentPhaseNum > 1 && phaseData.prevPhaseFile) {
                // 如果是阶段的第一天，显示上一阶段
                prevBtn.className = 'footer-nav-btn';
                prevBtn.href = phaseData.prevPhaseFile;
                prevBtn.innerHTML = `<span>←</span> 上一阶段`;
            } else {
                prevBtn.className = 'footer-nav-btn disabled';
                prevBtn.removeAttribute('href');
                prevBtn.innerHTML = `<span>←</span> 上一篇`;
            }
        }
        
        // 更新下一篇链接
        const nextBtn = document.querySelector('.footer-nav-btn.next');
        if (nextBtn) {
            if (nextDay) {
                nextBtn.className = 'footer-nav-btn';
                nextBtn.href = nextDay.file;
                nextBtn.innerHTML = `Day ${nextDay.num} <span>→</span>`;
            } else if (isLastDayInPhase && phaseData.nextPhaseFile) {
                // 如果是阶段的最后一天，显示下一阶段
                nextBtn.className = 'footer-nav-btn';
                nextBtn.href = phaseData.nextPhaseFile;
                nextBtn.innerHTML = `下一阶段 <span>→</span>`;
            } else {
                nextBtn.className = 'footer-nav-btn disabled';
                nextBtn.removeAttribute('href');
                nextBtn.innerHTML = `下一篇 <span>→</span>`;
            }
        }
    }
    
    // 生成后备导航栏（当数据加载失败时使用）
    function generateFallbackNavBar(currentDayNum) {
        const navBar = document.querySelector('.nav-bar');
        if (!navBar) return;
        
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
        
        navBar.innerHTML = navHTML;
    }
    
    // 添加CSS样式（如果页面没有的话）
    function ensureNavStyles() {
        const styleId = 'dynamic-nav-styles-phase';
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
                border: 1px solid #dce4e6;
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
            
            /* 阶段指示器样式 */
            .phase-indicator {
                display: inline-block; padding: 2px 8px; border-radius: 4px;
                font-size: 11px; font-weight: 600; margin-left: 8px;
                background: #e8eaf5; color: #8e44ad;
            }
            
            /* 移动端适配 */
            @media (max-width: 600px) {
                .nav-bar {
                    gap: 6px;
                }
                .nav-bar a {
                    padding: 6px 12px; font-size: 12px;
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