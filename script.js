// script.js
document.addEventListener("DOMContentLoaded", () => {
    // 预处理所有需要打字的文本（.trim() 去掉 HTML 缩进带来的前后不可见空白）
    const typeTexts = document.querySelectorAll('.js-seq.type-text');
    typeTexts.forEach(el => {
        el.setAttribute('data-original-text', el.textContent.trim());
        el.textContent = '';
    });

    // === 加载页逻辑 ===
    const loadingScreen = document.getElementById('loading-screen');

    // 模拟资源加载进度，2秒后淡出
    setTimeout(() => {
        loadingScreen.style.opacity = '0';

        // 淡出动画结束后(0.8s)隐藏 DOM，并初始化滑动插件
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            initSwiper();
        }, 800);
    }, 2000);

    // === BGM 音乐控制逻辑 ===
    const bgm = document.getElementById('bgm');
    const musicBtn = document.getElementById('music-toggle');
    let isBgmPlaying = false;

    // 自动跳过前3秒的空白前奏（包括首次播放和单曲循环时）
    bgm.addEventListener('timeupdate', () => {
        if (bgm.currentTime < 3) {
            bgm.currentTime = 3;
        }
    });

    // 为了兼容浏览器的 Autoplay 政策，监听第一次用户交互来播放音乐
    const initMusic = () => {
        if (!isBgmPlaying) {
            bgm.play().then(() => {
                isBgmPlaying = true;
                musicBtn.classList.add('playing');
            }).catch(err => console.log('Autoplay prevented:', err));
        }
        document.removeEventListener('touchstart', initMusic);
        document.removeEventListener('click', initMusic);
    };
    document.addEventListener('touchstart', initMusic, { once: true });
    document.addEventListener('click', initMusic, { once: true });

    // 点击右上角按钮切换播放/暂停
    musicBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止冒泡触发 initMusic
        if (bgm.paused) {
            bgm.play();
            isBgmPlaying = true;
            musicBtn.classList.add('playing');
        } else {
            bgm.pause();
            isBgmPlaying = false;
            musicBtn.classList.remove('playing');
        }
    });

    // === 滑动交互初始化 ===
    function initSwiper() {
        const swiper = new Swiper('.mySwiper', {
            direction: 'vertical', // 垂直全屏滑动
            mousewheel: true,      // 允许鼠标滚轮触发
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            speed: 600,            // 切换速度
            on: {
                // 初始化完成时触发第一页的动画
                init: function () {
                    playSlideAnimation(this.activeIndex);
                },
                // 每次开始切换时重置所有动画，保证多次滑动依然有入场动效
                slideChangeTransitionStart: function () {
                    resetSlideAnimations();
                },
                // 切换结束时播放当前页的动画
                slideChangeTransitionEnd: function () {
                    playSlideAnimation(this.activeIndex);
                }
            }
        });

        window.anniversarySwiper = swiper; // 暴露给全局以便交互控制

        // 确保第一屏动画生效
        playSlideAnimation(swiper.activeIndex);
    }

    // 播放入场动画 (Fade-in + Slide-up)
    function playSlideAnimation(index) {
        const activeSlide = document.querySelectorAll('.swiper-slide')[index];
        if (!activeSlide) return;

        const content = activeSlide.querySelector('.content');
        if (content) {
            content.classList.remove('hidden');
            content.classList.add('active');
        }

        // --- 触发当前页面的数字滚动动画 (排除受控渐显的内容) ---
        const numberElements = activeSlide.querySelectorAll('.data-number:not(.type-fade)');
        if (numberElements.length > 0) {
            animateNumbers(numberElements);
        }

        // 触发 JS 依次打字机动效
        playTypewriterSequence(activeSlide);

        // 模块 7 弹幕控制 (index 为 6 的滑块)
        if (index === 6) {
            if (typeof window.startDanmaku === 'function') window.startDanmaku();
        } else {
            if (typeof window.stopDanmaku === 'function') window.stopDanmaku();
        }
    }

    // 重置动效至初始隐藏状态
    function resetSlideAnimations() {
        const contents = document.querySelectorAll('.swiper-slide .content');
        contents.forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });

        // --- 重置数字为 0 ---
        const numberElements = document.querySelectorAll('.data-number');
        numberElements.forEach(el => {
            el.innerText = '0';
        });

        // --- 重置打字机文本和隐藏层 ---
        const typeTexts = document.querySelectorAll('.js-seq.type-text');
        typeTexts.forEach(el => {
            el.textContent = '';
            el.classList.remove('typing-cursor');
        });
        const typeFades = document.querySelectorAll('.js-seq.type-fade');
        typeFades.forEach(el => {
            el.style.opacity = '0';
        });

        // 停止并清理所有页面的弹幕
        if (typeof window.stopDanmaku === 'function') window.stopDanmaku();
    }

    // === JS 依次打字机动效 ===
    let currentSeqId = 0; // 防止快速滑动导致动画重叠

    function playTypewriterSequence(activeSlide) {
        const seqElements = activeSlide.querySelectorAll('.js-seq');
        if (seqElements.length === 0) return;

        currentSeqId++;
        const seqId = currentSeqId;
        let idx = 0;

        async function next() {
            if (seqId !== currentSeqId) return; // 用户已切走页面

            // 移除上一个元素的光标
            if (idx > 0) {
                seqElements[idx - 1].classList.remove('typing-cursor');
            }

            if (idx >= seqElements.length) {
                return; // 所有打字完毕
            }

            const el = seqElements[idx];

            if (el.classList.contains('type-text')) {
                // 确保打字机元素可见
                el.style.opacity = '1';
                el.classList.add('active');

                // 如果还没有备份原始文本，在这里备份并清空
                if (!el.hasAttribute('data-original-text')) {
                    el.setAttribute('data-original-text', el.textContent.trim());
                    el.textContent = '';
                }

                el.classList.add('typing-cursor');
                const text = el.getAttribute('data-original-text') || '';
                let charIdx = 0;

                function typeChar() {
                    if (seqId !== currentSeqId) return;
                    if (charIdx < text.length) {
                        el.textContent += text.charAt(charIdx);
                        charIdx++;
                        setTimeout(typeChar, 40);
                    } else {
                        idx++;
                        next();
                    }
                }
                typeChar();
            } else if (el.classList.contains('type-fade')) {
                el.style.opacity = '1';
                el.classList.add('active');

                // 如果是数字，等待数字滚动完成后再继续
                if (el.classList.contains('data-number')) {
                    if (el.hasAttribute('data-async')) {
                        // 不阻塞后续打字，数字跳动并行执行
                        animateNumbers([el]);
                        setTimeout(() => {
                            idx++;
                            next();
                        }, 50); // 极小延迟无缝接续打字
                    } else {
                        await animateNumbers([el]);
                        setTimeout(() => {
                            idx++;
                            next();
                        }, 100); // 极小延迟无缝接续打字
                    }
                } else {
                    setTimeout(() => {
                        idx++;
                        next();
                    }, 400);
                }
            } else {
                idx++;
                next();
            }
        }

        // 稍微延迟一下整体打字开始时间，配合 Slide-up 动画入场
        setTimeout(next, 600);
    }

    // === 数字翻滚动画函数 (返回 Promise 以便同步控制) ===
    function animateNumbers(elements) {
        const promises = Array.from(elements).map(el => {
            return new Promise((resolve) => {
                const targetStr = el.getAttribute('data-target');
                const target = parseFloat(targetStr);
                const isFloat = targetStr.includes('.'); // 判断是否需要保留小数
                const duration = parseInt(el.getAttribute('data-duration')) || 1500; // 动画时长，支持自定义，默认 1.5s

                el.innerText = '0';
                let startTimestamp = null;

                const step = (timestamp) => {
                    if (!startTimestamp) startTimestamp = timestamp;
                    let progress = Math.min((timestamp - startTimestamp) / duration, 1);

                    // 改为 easeOutCubic，避免 Expo 的末尾长时间小幅跳动
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    let currentNumber = easeOut * target;

                    // 当进度超过 95% 或数值十分接近时，强制吸附完成动画
                    if ((target - currentNumber < 0.5 && target > 10) || progress >= 0.95) {
                        progress = 1;
                        currentNumber = target;
                    }

                    // 格式化数字：添加千位分隔符，保留小数位如果是浮点数
                    const formatNum = (num, floatFlag) => {
                        return floatFlag
                            ? num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                            : Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    };

                    if (progress < 1) {
                        el.innerText = formatNum(currentNumber, isFloat);
                        window.requestAnimationFrame(step);
                    } else {
                        el.innerText = formatNum(target, isFloat); // 确保最终数字精确
                        resolve(); // 动画结束，Promise 完成
                    }
                };

                window.requestAnimationFrame(step);
            });
        });

        return Promise.all(promises);
    }


    // === 海报生成逻辑 (html2canvas) ===
    const btnGenerate = document.getElementById('btn-generate-poster');
    const loadingText = document.getElementById('poster-loading-text');

    // 1. 头像和文字实时同步
    const avatarInput = document.getElementById('avatar-input');
    const nicknameInput = document.getElementById('nickname-input');
    const quoteInput = document.getElementById('quote-input');
    const previewSubtitle = document.getElementById('preview-subtitle');
    const previewTitle = document.getElementById('preview-title');
    const previewAvatar = document.getElementById('preview-avatar');
    const modalAvatarPreview = document.getElementById('modal-avatar-preview');

    if (nicknameInput && previewSubtitle) {
        nicknameInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            previewSubtitle.textContent = val ? `- 1% 好事代言人 ${val} -` : '- 1% 好事代言人 -';
        });
    }

    if (quoteInput && previewTitle) {
        quoteInput.addEventListener('input', (e) => {
            const val = e.target.value;
            // 支持换行显示 (普通换行或 \n)
            previewTitle.innerHTML = val ? val.replace(/\n|\\n/g, '<br>') : '给希望以方法<br>给善意以答案';
        });
    }

    if (avatarInput && previewAvatar && modalAvatarPreview) {
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const dataUrl = event.target.result;
                    // 同步到海报主图
                    previewAvatar.src = dataUrl;
                    // 更新 Modal 预览
                    modalAvatarPreview.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // --- 弹窗控制逻辑 ---
    const btnOpenModal = document.getElementById('btn-open-edit-modal');
    const btnCloseModal = document.getElementById('btn-close-edit-modal');
    const posterModal = document.getElementById('poster-edit-modal');

    if (btnOpenModal && posterModal) {
        btnOpenModal.addEventListener('click', () => {
            posterModal.classList.remove('hidden');
        });
    }

    if (btnCloseModal && posterModal) {
        btnCloseModal.addEventListener('click', () => {
            posterModal.classList.add('hidden');
        });
    }

    // 3. 点击生成按钮
    if (btnGenerate) {
        btnGenerate.addEventListener('click', () => {
            // 防止重复点击
            btnGenerate.style.display = 'none';
            loadingText.style.display = 'block';

            // 目标截图区域：竖版海报
            const targetElement = document.getElementById('anniversary-poster-preview');

            // 稍微延迟保证没有未完成的渲染
            setTimeout(() => {
                html2canvas(targetElement, {
                    scale: 3, // 极高清晰度
                    useCORS: true,
                    backgroundColor: '#1a3a6c', // 背景色对齐
                    logging: false
                }).then(canvas => {
                    // 转为 base64 图片格式
                    const imgData = canvas.toDataURL("image/png");

                    // 创建结果容器
                    const resultContainer = document.createElement('div');
                    resultContainer.className = 'poster-result-overlay';
                    resultContainer.style.cssText = `
                        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                        background: rgba(0,0,0,0.9); z-index: 10000;
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                    `;

                    const resultImg = document.createElement('img');
                    resultImg.src = imgData;
                    resultImg.style.cssText = `
                        width: 90%; max-width: 500px; border-radius: 8px;
                        box-shadow: 0 0 30px rgba(255,255,255,0.2);
                    `;

                    const hint = document.createElement('p');
                    hint.innerText = '长按图片保存，分享这份周年纪念';
                    hint.style.cssText = 'color: #FFD700; margin-top: 20px; font-size: 14px; text-shadow: 1px 1px 0 #000;';

                    const closeBtn = document.createElement('button');
                    closeBtn.innerText = '返回修改';
                    closeBtn.className = 'pixel-btn-small';
                    closeBtn.style.marginTop = '20px';
                    closeBtn.addEventListener('click', () => {
                        document.body.removeChild(resultContainer);
                        btnGenerate.style.display = 'inline-block';
                        loadingText.style.display = 'none';
                    });

                    resultContainer.appendChild(resultImg);
                    resultContainer.appendChild(hint);
                    resultContainer.appendChild(closeBtn);
                    document.body.appendChild(resultContainer);

                    // 恢复按钮状态
                    loadingText.style.display = 'none';

                }).catch(err => {
                    console.error("生成海报失败:", err);
                    alert("生成海报失败请重试。");

                    outlinedElements.forEach(el => {
                        el.classList.remove('temp-no-outline');
                        el.style.textShadow = "2px 2px 0 #1a1a1a, -2px -2px 0 #1a1a1a, 2px -2px 0 #1a1a1a, -2px 2px 0 #1a1a1a";
                    });

                    btnGenerate.style.display = 'inline-block';
                    loadingText.style.display = 'none';
                });
            }, 300);
        });
    }


    // === 详情弹窗逻辑 ===
    const overlay = document.getElementById('detail-overlay');
    const modal = overlay.querySelector('.detail-modal');
    const closeModalBtn = overlay.querySelector('.modal-close-btn');

    // 给所有卡片绑定点击事件
    document.addEventListener('click', (e) => {
        const card = e.target.closest('.floating-card');
        if (card) {
            openDetail(card);
        }
    });

    function openDetail(card) {
        const titleEl = card.querySelector('.card-title');
        const fullTitle = titleEl ? titleEl.textContent.trim() : '';
        const num = card.querySelector('.card-num').textContent;
        const org = card.getAttribute('data-org') || '—';
        const title = card.getAttribute('data-title') || '';
        const impactText = card.getAttribute('data-impact-text') || '';
        const imagesStr = card.getAttribute('data-images') || '';

        // 提取括号内的单位，大标题去掉单位部分（避免重复显示）
        const unitMatch = fullTitle.match(/[（(]([^）)]+)[）)]/);
        const unit = unitMatch ? unitMatch[0] : '';
        const titleWithoutUnit = fullTitle.replace(/[（(][^）)]+[）)]/g, '').trim();

        // 填充弹窗字段
        overlay.querySelector('.modal-org').textContent = org;

        const titleElNode = overlay.querySelector('.modal-title');
        titleElNode.textContent = title || titleWithoutUnit;
        titleElNode.style.display = (title || titleWithoutUnit) ? '' : 'none';

        overlay.querySelector('.modal-num').textContent = num;
        overlay.querySelector('.modal-unit').textContent = unit;

        const impactEl = overlay.querySelector('.modal-impact-text');
        impactEl.textContent = impactText;
        impactEl.style.display = impactText ? '' : 'none';

        // 用 cloneNode 替换 gallery 元素，彻底清除旧的事件监听器
        const oldGallery = overlay.querySelector('.modal-gallery');
        const newGallery = oldGallery.cloneNode(false);
        oldGallery.parentNode.replaceChild(newGallery, oldGallery);
        const gallery = newGallery;
        const images = imagesStr ? imagesStr.split(',').map(s => s.trim()).filter(Boolean) : [];

        if (images.length === 0) {
            for (let i = 0; i < 2; i++) {
                const item = document.createElement('div');
                item.className = 'modal-gallery-item';
                const ph = document.createElement('div');
                ph.className = 'modal-gallery-placeholder';
                ph.textContent = `图片 ${i + 1}`;
                item.appendChild(ph);
                gallery.appendChild(item);
            }
        } else {
            images.forEach((src, i) => {
                const item = document.createElement('div');
                item.className = 'modal-gallery-item';
                const img = document.createElement('img');
                img.src = src;
                img.alt = `图片 ${i + 1}`;
                img.onerror = () => {
                    item.innerHTML = '';
                    const ph = document.createElement('div');
                    ph.className = 'modal-gallery-placeholder';
                    ph.textContent = `图片 ${i + 1}`;
                    item.appendChild(ph);
                };
                item.appendChild(img);
                gallery.appendChild(item);
            });
        }

        // 横向滑动用 CSS touch-action: pan-x 处理，不再需要 stopPropagation

        // 显示弹窗
        overlay.classList.remove('hidden');
        overlay.offsetHeight; // 强制重排以触发 transition
        overlay.classList.add('active');

        // 禁用外层 Swiper 滑动
        if (window.anniversarySwiper) {
            window.anniversarySwiper.allowTouchMove = false;
        }
    }


    function closeDetail() {
        overlay.classList.remove('active');
        setTimeout(() => {
            overlay.classList.add('hidden');
            // 恢复 Swiper 滑动
            if (window.anniversarySwiper) {
                window.anniversarySwiper.allowTouchMove = true;
            }
        }, 300);
    }

    // 仅点击 X 按钮关闭
    closeModalBtn.addEventListener('click', closeDetail);

    // === 弹幕功能实现 ===
    const danmakuMessages = ["愿世界真的可以更好，愿我也是", "愿世界和平，愿星光和馒头都可得", "今天我开心，我要你也开心", "菩萨应如是，布施不住于相。", "在困惑和迷茫的时候，发现还有人坚持做一些利他的事情；在过载的信息和世界面前，还有人脚踏实地地从小事做起", "进绵薄之力", "致敬每一位为了公益和善意切实付出的人！", "世界和平，自然和谐", "一起努力", "黑夜给我黑色的眼睛，我却用它寻找光明。", "虽然少但还是想做点，希望以后可以挣得更多尽更多的力！", "如果这份捐款真的能让世界变得更好一点点，那就再好不过了。", "世界并不好，但很幸运地，有人在努力让这里变得更好。", "货币从人这里来也到人那里去，完成基本的循环，是它存在的意义。", "一直觉得这个世界不会再变好了，一直个逃避的悲观主义者，也许这次会有所改变吧～", "请坚持", "我们会有更好的明天", "不知道怎么帮助他们，只能尽这些绵薄之力啦", "希望能帮助到需要帮助的人～", "嗯，好的，我爱你", "在不确定的世界中，共同投身一份美好的事业", "希望我爱的人和爱我的人都健康平安❤️❤️ 我爱你，谢谢你，请原谅，不客气 爱你", "在动荡而不确定的世界，做我们能做的事。", "听了最近一期脆弱世界，不错！坚持把播客做下去吧。", "世界和平", "希望微小的善意可以练成花海", "让善意传递下去。", "赠人玫瑰，手留余香", "祝愿这个世界更美好！", "创始人的演讲先是让我觉得自己很幸福，其实是感动，每个人都付出一点点，相信世界会越来越好", "祝福人们的灵魂获得幸福。", "希望能帮到需要帮助的人呢☺️", "希望世界越來越好♡(.◜ω◝.)♡", "地球远看很圆，近看坑坑洼洼，需要有人缝缝补补", "我希望能帮助到女性同胞", "虽然这个世界不那么美好，庆幸有大家在努力，让他变得更美好", "愿世界和平", "希望提供一点微小而美好的改变", "从今天起，我跟这个世界更多地联系起来啦！", "希望能够帮助有需要帮助的人，也希望能够让自己逐渐意识到帮助他人的力量", "谢谢星星的推荐！", "找一道缝隙，做一点小事", "希望大家获得幸福", "让专业的人做专业的事，放眼全球，我们中国的普通人其实也并不普通，我们个体也能为这个世界做点什么，“其实我可能是那个应该承担更多责任的人”。公益不是少数人做很多，而是每个人多做一点点。加油！", "一直觉得有一份力出一份力，积少成多(*¯︶¯*)", "诚心祈求天下无灾，人皆平安远离苦难，愿持善念护大地，世界充满爱与和平！", "用自己的行动定义何为“更好”的世界。", "希望这个世界越来越好，越来越多的人和动物能够过上幸福快乐的生活", "帮助他人，幸福自己", "世界和你都会好的！", "希望益盒越来越好，帮助更多有需要的人❤️", "只要人人都献出一点爱", "多善多福", "利ta也是利己", "健康平安快乐", "利ta也是利己", "希望每个人都能平安健康。", "希望以后能帮助到更多的人，大家都越来越好！", "生活的意义在于相互温暖！", "会好起来", "在这个越来越疯狂的世界，继续带着爱前进，热爱它", "期待一个更透明，公平，友善的社会", "以善养善", "希望世界越来越好", "布施、持戒、忍辱、精进、禅定、般若", "希望需要帮助的人能得到帮助，一起携手让世界变得更好", "想做一些让自己和别人都有益的事。", "希望减少被动或低知带来的伤害，为别人不确定的人生播下一颗种子，不论发芽与否。", "希望爱和善意能像小树一样成长成林", "谢谢你们，加油！", "爱出者爱返，福往者福来", "加油！", "我和益盒一起加油，让地球更美好！", "Make the world a better place!", "愿世间更加美好", "坚持初心，用科学与专业的态度，让这个世界变得更美好✨", "即使是一个普通人，也能通过理性的选择，用微小但真实有效的行动一点点地改变世界。", "想要让这个世界变得更好一点", "想和一群同频的人一起，让每一份善意都产生实实在在的改变。", "世界会越来越好！", "相信美好，希望能帮助到正在经历苦难的人", "永远相信美好，相信未来！", "感谢世界如此精彩，希望我也能在世间制造更多好运", "加油！不要对这个世界失望！", "相信世界会变好", "加油", "爱与和平 年轻人请加油！", "捍卫生命共同的价值和尊严，让人们获得平等的机会空间。", "我很多时候感到自己是幸运的，因此希望在回馈社会中，让爱传递出去～", "加油，更想体验你们找下活动，一起参与进来！", "让人能有尊严的活着，让世界充满美好～", "希望能让孩子们的未来世界更美好一点点", "改变正在发生", "保持知足和感恩 世界赠予我的往往更多", "希望世界越来越美好，希望苦难越来越少", "希望我们生活的世界越来越好，我能为这个美好世界出一己之力", "希望世界越来越好", "生命本来没有名字，你是，我是。", "活出自己，成为自己。", "祝好", "希望在有限的人生里多做利他的事情，传递善意", "一起享用命运的果实吧", "希望可以月捐很多年很多年", "未来生活顺利呀！", "我是靓仔", "勿以善小而不为", "希望能让这个世界变得更好，加油", "希望也是功德一件", "just do something", "老吾老以及人之老，幼吾幼以及人之幼。", "通过帮助别人改变自己", "只要人人都献出一点爱", "布施慈善让生活更美好", "希望大家2026得偿所愿！平安幸福", "让我生活着的世界再美一点！", "Make the world a better place", "加油 祝福 尽自己所能吧", "要相信相信的力量", "希望通过自己的力量，让这个世界更好一点点", "世界破破烂烂，总有人缝缝补补～", "愿世界更美好", "希望世界因我越来越好", "爱是一切的真相", "科学公益，努力再努力！", "利他即利己", "爱生活本身，而不是爱生活的意义。生命本身就是意义。", "一个美好家庭对世界尽一份力！", "有一半是出于私心，为了让自己变的更好而参加的。希望我和世界共同进步。", "一个更好的世界是可能的。", "一起加油", "好好生活 好好吃饭", "关怀传递希望之火，微光改变星河。 帮助他人，快乐自己！", "总有一群人一直在行动！加油！", "世界不一定会越来越好，但我们至少还能做点什么不让他更糟", "希望世界能够充满爱意", "祝大家都幸福！", "让爱传递，让世界更美好！", "希望我们人类先变好变好变好", "希望能让这个世界变得更好！", "相信会越来越好！", "希望能给他人带来帮助和积极影响，希望自己的1%越来越高", "善意是点点星火，终将汇聚成浩瀚又温暖的星海", "希望这个世界的女孩子们越过越好", "人生如逆旅，我亦是行人。", "Do something. 为想要的世界做出微小努力。", "希望世界变得更美好！", "希望把对财富美好的感觉传递出去，愿世间再无苦难", "gogo", "祝愿大家都健康平安", "美好遍布人间", "每个你都与我有关", "希望中国的女性和儿童得到更多帮助！", "希望小女孩保护好自己，希望小朋友们都能学习知识，希望大家都健健康康无灾无病，或者能治愈所有疾病。", "让善意成为生活的日常", "我希望做一些有意义的事情 满足自我的价值感 也许月捐是一个不错的选择 希望能够坚持", "知道益盒是因为奴隶社会，是因为之前做过的反家暴工作，乡村教育工作，公共卫生工作，CSR 工作(以申请失败告终的试图加入益盒的尝试） 目前作为一个影响力投资者，一个研究慈善史的作者，一个捐赠人（ABC, AVPN, CINGs 等），也作为一个社会企业的创业者，我期待和小伙伴们一起共创更美好哦的未来！", "一起善良", "1%的改变，一起努力~", "1231是个起点，希望宇宙因为我的存在会越来越好", "May the little seed we sow today will contribute to create a more equal community where we can recognize and actualize our human dignity.", "中国的性别意识和全面性教育需要持续进步+1", "中国的性别意识和儿童性教育，成人性教育需要持续进步", "爱一直在你身边，阿弥陀佛～～", "益盒项目越办越好！", "平安健康 越来越好", "直面风雨，共度难关。", "把利他助人当成你生命中最重要的事情之一", "月行一善，帮助他人，帮助自己。", "帮助他人就是帮助自己", "我想要更好的、平等的、富有意义的社会", "希望所有捐出的费用都可以真正帮助到需要帮助的人。但愿世界所有人都能收获美好。", "相信 真·善·美", "多试试就会有好事发生", "我们一直在这里，我们一起在这里。", "共筑幸福的生活", "愿终生幸福", "我们从不孤单。我愿意敞开我的善意，希望世界可以越来越好，我们可以越来越好。", "我希望世界不再有疾病，不再有灾难，不再有战争，不再有贫穷，不再有罪犯，整个世界充满爱与和平，每个人心中都远离贪嗔痴慢疑，远离习气欲望，充满爱的祝福！南无阿弥陀佛！", "爱的传递", "生于绚烂，生于希望", "也来一点绵薄的力量ww", "这个世界不够好，但从不缺少善意和爱", "世界更美好", "让世界充满爱❤️", "让世界会更好更有爱", "Love and peace", "与爱同在～", "希望更多人关注公益，参与公益", "祝好", "祝福每一个人", "希望大家每天开心", "希望世界和平", "感谢神，让我看到，让我拥有帮助他人的心灵和能力", "加油！希望你我都好", "长命功夫长命做", "让我们生根发芽再开花。", "1%的捐赠，对我们来说就是100%的改变。", "希望宇宙能量越来越好", "希望小小的捐赠可以帮助到需要帮助的人", "终于毕业了有收入了第一件做的事就是签署了一直想加入的1% 捐赠项目～ 也是我为我认为更好的世界进行投票吧", "既然花出去的每一份钱都是在为理想的世界投票，那我要投给充满爱与希望的世界。", "向前看", "希望这个世界越来越好", "心怀期许，行若微尘，希望世界越来越美好。", "希望这个世界越来越好，希望人们的生活越来越好！", "希望我追梦路上的耕耘，能帮助更多人追梦，一起让社会更美好", "希望自己的善意能帮助更多人，感染更多人，不忘幸福自我，造福社会的初心", "为精神世界构筑实体", "愿人间少一点苦难。", "尽一点微薄之力，让世界多一点美好", "服务社会，奉献爱心，推己及人，薪火相传", "希望教育和女性事业可以越来越好！", "尝试与世界有其他可能的连结，让自己有更多空间。", "为世界做点儿好事", "能被需要 会很幸福", "付出即收获，在帮助世界更美好的过程中，我也在帮助自己成为更好的人", "每天做一些让世界变得更美的小好事，做爱地球的好女人！（简庆芬骄傲脸！）", "公益不仅需要热心，更需要专业与坚持！", "用行动支持建设一个更好的、更期待看到的世界！", "不用等待一个更好的世界，从现在我们就开始建立我们想要的世界！", "相信善良不会被辜负，多一份善举让世界更美好", "For a Better World～", "希望大家都平平安安健健康康的", "帮不了所有人，但也希望尽一份力 达则兼济天下 穷也要尽我所能", "愿世界上每个人都能达成所愿，愿每个人有爱有家。", "希望每个人都能更幸福", "世界会更好", "愿每一丝善意的微光可以汇聚成暖阳。", "希望让多一位再多一位未曾谋面的伙伴拥有健康、知识、力量和与世界打交道的勇气", "无论世界有多么奇奇怪怪，也要用一些善意去回馈给需要的人类", "我非常喜欢阿伦特在《黑暗时代的人们》中的一段话，想在这里与大家分享：「即使是在最黑暗的时代，人们还是有期望光明的权利，而光明与其说是来自于理论与观念，不如说是来自于凡夫俗子所发出的荧荧微光。当众星火看见彼此，每一朵火焰便更为明亮，因为它们看见对方，并期待相互辉映。」 仍对“世界会变好”抱有期待，我想，正是那些拥有共同期待、并为此付出努力的朋友给我了希望和勇气。这个世界是不会自动变好的，所以「爱、思考和行动」，是需要用一生去实践的课题。 朴素的祝福送给看到这里的你，祝你平安健康，一切顺利。", "希望我能一直有能力帮助别人", "改变世界一点点", "地球人 加油", "人人幸福", "不以善小而不为。", "希望世界和平，所有人都能平安幸福", "不以善小而不为", "世界越来越好", "愿所有人身体健康平安快乐", "世界越来越好", "希望每个人都能做自己想要做的自己", "种桃种李种春风", "做好事不留名", "世界和平", "希望能传递幸运，更多人能开心快乐～", "我的执念，万千千千", "there is so much hope.", "光点会汇聚成希望之海", "点点希望，汇聚大海，那是善意的呼唤～～", "让自己更好 让世界更美好", "一起缝缝补补", "再小的善意，也能成为改变的种子。", "世界更美好", "希望自己的小小善意能帮到需要的人，能让这个世界变得更美好", "大家要身体健康哦", "传播善意温暖人间.有你有我有大家一起同行努力向前见证更多的美好.", "公益无止境", "相信爱~", "感受过这个世界带给我多数的善意和少数的恶意 感恩现在的生活 我是幸运的 希望世界上少一些受伤的人❤️", "加油！", "世界和平 人类幸福", "期待帮助未来的孩子们接受好的教育，体会良善，我想一个培养“好人”的社会自然而然也会减少很多性别对立，能让无论男女都能接纳自己、获得平等的机会。", "希望更多女性能真正的做自己，传递美好生活", "一切善行皆赞叹！", "祝福一切", "开心快乐，加油加油", "加油加油！！", "希望还会有10001位", "If you have a dream, then think big", "希望更多的人加入这个项目", "Make the world better", "希望世界变好", "希望更多的人感受到世界的善意与支持！", "希望有更多更好的公益，见到更好的世界。", "如果世界会更好。", "加油！", "这点钱还是付得起的", "天天开心", "快点把家暴者送进去吧", "让公益复利", "希望有帮助", "对未来保持希望！", "希望有个更好的世界", "世界加油。", "做出自己的一份行动，即使微小但同样重要。", "愿以自己的点滴萤火，点亮世界未被关注到的角落", "愿世界和平", "这条路在延续下去是因为我在期许它延续下去", "无问西东", "祝愿世间少些苦痛，多些善意～", "平安健康，喜乐顺遂", "一起走过八千里路云和月", "让世界变好一点点", "一起感受和学习善意！", "智慧好人们加油 不把世界让给糟糕的人！", "愿更多人也能体会到这世间的美好", "公益是一份事业", "做事情，会好的", "支持理想主义", "一起为更美好的世界加油", "善意", "日行一善，回向给我的初一", "希望更多资本能被投入到让世界变得更美好一些的解决方案中", "加油哦", "希望世界越变越好，福往者福来，爱出者爱返。", "更好的世界，在我们的行动中形成！", "together we can and we will！", "一个人的一点微光，一群人的一片萤夜", "终于在有实习收入后来成为月捐人啦～希望益盒越来越好", "总有人要做点什么", "“ 独步天下，吾心自洁，无欲无求，如林中之象 ”", "捐款以外，也要记得给自己配置保险，尤其很多险种年纪上去了会变贵，还是要早点买。（非利益相关）", "感恩宇宙", "开始了毕业第一个月的第一份工作，在为世界更好的愿望努力，都加油哦:)", "希望益盒可以开发更多有效捐赠项目，跟着益盒一起增加对社会的接触面", "希望我能努力前行，提高知识能力和影响力，让善良的生灵因为我少受一点困苦。了解世界改善世界，即使充斥着糟糕，也有善良在。", "保佑不要后悔", "多一份善意 让世界变得更好", "和无数的你们站在一起", "世界不会变的更好，但希望不会变的更差", "多一份善意，多一份温暖", "多一分爱，多一分力量，在互帮互助中，能够发现生活的光芒。", "世界充满爱", "让世界变得更温暖～", "即使微小也可以创造有意义的改变！支持！！素未谋面，谢谢你们~我爱你们❤️", "打开新世界", "刚好是第900位，很棒的数字，也祝这个项目越来越棒～", "加油", "公益，也是对自己有益", "关注这个项目很久了，但是因为同时也在月捐别的项目，也想了解一下才开始月捐，现在也开始加入益盒这个大家庭", "在我的定位坐标发出照亮他人的微弱光芒，与同频者共振", "让世界变得更美好～～～", "知福惜福造福。", "奉献一点点，一起创造更大～", "祝福大家平安喜乐，自在自洽，真诚美好", "不确定呀", "生日快乐", "给我的敌人也给我的战友： 永远别以为世界上的理想主义者都死绝了！", "为这个世界做一点点小事！", "世界会好的！", "就让爱引领我们前行，谢谢你们做的一切", "父母，朋友那种无条件的爱 也想让这个世界体会到", "分享 暖意", "当我想要倒下的时候，想到有人因为我的存在而幸福。努力变富有呀，这样百分之一也会有很多很多很多的力量！", "总有人要先做点什么", "好好好", "让善意流动", "世界太脆弱 我们全力以赴", "希望大家都平安健康", "在努力寻找自我价值路上，把我的祝福、希望、动力拿出来分给未知的你一点", "愿小爱能如点点星光汇聚成星河般的大爱，熠熠生辉！", "希望世界上的痛苦越来越少", "从现在开始做一个行动者", "希望世界的温度永远恒温", "希望这个世界越来越美好！越来越友善！", "5.25，爱自己的行动是更爱世界", "益盒加油", "世界是平等的", "做内心丰盈的个体，积极行动的公民。", "深呼吸", "一直知道益盒，不知道为什么之前一直没有想起来捐，今天在医院交医保的时候突然想起，就捐了（xs）", "虽然现阶段只是一名学生，但也希望尽一些微薄的力量", "从微小的事开始，不止于公益，为这个世界做一些事！", "创造更美好的世界", "尽管自己过得并不顺利，但还是希望别人能从我这里获得一点点力量吧！希望世界越来越好！", "加油哦", "给自己的人生做出一点点改变，希望帮到别人的人生拥有很大的改变！", "一起努力叭", "勿以善小而不为，星星之火可以燎原。让我们聚是一把火，散是满天星。", "都会好的", "善意永存心间！", "听说捐赠可以缓解痛苦", "远方的每一位都很重要", "每个人付出一点点，世界美好多一点点", "我们对世界笑一个", "希望这个世界能变好一点点", "一个良善的社会建基于信任，而信任则建基于信息的透明和方便进行的审视。", "希望这个世界更加美好！希望人人都能够力所能及的反哺社会！", "尽自己所能，帮有需要的人", "这个世界会因为我们变得更美好。", "作为全职公益小伙伴，把时间交给自己的项目，把钱捐给益盒，相信与你们同行，能创造出更大的社会价值~", "溪流汇聚成大海！", "期待看到更多性别平等项目", "不要流泪，为更好的明天。", "希望未来可以努力把这1%的基数不断扩大～", "持续长久的做公益。", "希望更少痛苦，更多快乐", "让专业的人帮助我做有爱的事情", "我始终记得联劝的心愿盒子活动，我以刑鸣的名义给喜欢打篮球的乡村小朋友们一人买了一个篮球，儿童节那天收到回信，一个小朋友告诉我说：亲爱的叔叔，都说会哭的孩子有糖吃，我从小到大不知哭了多少回却没人搭理我，自从阳光姐姐们来到了之后，我的生活有了色彩，今天收到了您的礼物，我心里甜甜的。 而这些甜甜的东西，就是贯穿我生命始终的一切。", "希望这个世界越来越好", "坚毅&透明的行动", "如果幸福太难，那我祝你们平安。", "希望能真正帮到需要帮助的人，愿世界能变得更好，也祝益盒能越来越好~", "我下个月就要参加工作了，这份捐赠不仅会帮助更多人也是我踏入社会承担更多责任的见证", "积少成多，希望点滴的善意都能帮助到需要的人", "让善意抵达受助者，能给他们带来真实有效的帮助", "留言墙很漂亮", "莫以善小而不为之", "愿世界更美好！愿人间处处有真情！愿每一天我都能发现真善美。", "身体力行", "希望世界更美好", "明天会更好", "春天，让一切美好发生", "公益是大多数人的力所能及", "关注益盒很久了，终于参与到1%！希望一起有有效行善让利他心更落地！", "希望我们大家可以一起和世界上的所有其他人一样充满希望和尊严地活下去 : ）", "万物合一，宇宙更新", "祝你们成功！", "good health", "世界越来越好", "谢谢善意代理人❤️", "用行动让这个世界变好一点点，期待益盒越做越好！", "荒谬当道，爱拯救之。", "处于答辩前的焦虑状态，签下月捐协议感觉舒服多啦！希望为自己和他人的朋友&身边的人创造更加良善的环境", "自我的1％，他人的100％", "由心出发 向爱潜行", "相信 相信的力量", "积少成多", "to make the world a better place", "让世界美好一点点", "向世界投射一道小小的善意的光", "让更多人的人可以更爱这个世界", "All creatures great and small", "希望能有更多的女性被看见、尊重、理解！", "希望大家都幸福健康！越来越好！", "自利利他，无缘大慈，同体大悲！", "我带着我所有猫猫的祝福，希望一点点的光，可以在这个宇宙有一点闪亮。希望所有的小动物都能被珍视", "先从生活费开始吧～", "如果我的微不足道的付出能够给需要帮助的人带来一点点希望，那我无比荣幸！", "爱让世界转动", "今天是国际幸福日，祝大家幸福快乐，付出就有获得", "聚少成多，帮助他人", "希望大家越来越好，感恩", "祝看到的人照顾好自己 也照顾好身边的人~~", "希望世界更加美好，人人开心快乐", "(=´∀｀)人(´∀｀=)", "希望我可以帮助更多人，帮助孩子们受到更好的教育，帮助老人们恢复健康的身体，帮助妇女们走出阴霾，这是我能做的，也是我想做的", "为自己和其他人创造一个令自己喜欢的世界", "为了一个女性儿童友好的世界", "希望世界能变得更好", "每一笔捐款都是给自己想要的世界投票", "冲冲冲", "愿世界和平", "万事顺意，身体健康", "Be the change!", "世界和平，生活美好", "一切顺利，平平安安", "加油", "涓滴善意，汇成江海，让社群变的更好。", "安得万里裘，盖裹周四垠", "谢谢益盒的小伙伴为世界带来温暖", "不知不觉已经支持益盒一年啦，1%并没有影响我的生活质量，年底一看哇自己也是小有贡献的感觉还挺好~", "有效，才是最大的公益杠杆。", "尽绵薄之力，愿世间多一分温暖", "加油哇！", "信任益盒，愿尽绵薄之力帮助到需要帮助的人", "越来越好", "善良本身就是上帝最好的奖励。能帮助需要帮助的人是幸福的。", "祝愿项目顺利～", "愿世界多一点点美好", "为了让这个世界有更多的快乐、更少的伤害", "还有明天值得等待和创造", "让打工在养活自己之外，稍微有再点意义感哈哈", "何处是我朋友的家！", "好好好", "对抗马太效应的一点小小努力", "青山一道同云雨，明月何曾是两乡", "我愿意让爱流动 我高兴这样爱都没有被辜负(有效使用)", "支持益盒的研究和倡导方法", "总有人间一两风，填我十万八千梦。", "在这个重要的日子，一起付出实际的行动，期盼每个女性都可以拥抱更远大、更无限的天空！", "让我们一起做出有效的行动，让世界变得更美好一点点。", "live and let live", "今天收到了女儿送的第一份三八妇女节礼物，以此纪念，希望更多孩子更多女性得到关注支持！（也庆祝1%项目小程序开发大吉）", "一起加油", "微小但重要", "Renewed my vow to effective altruism and Charity Box.", "世界大同", "♥️", "爱出者爱返，福往者福来，愿世界越来越好", "大家一起努力让好事发生～", "继续做点好事儿！", "Here", "一点点力量，但会坚持下去", "向宇宙发送我的善意！！", "让我们一起生活在慈悲与智慧当中吧！", "比较穷，抱歉", "祝你永远有梦可做", "希望世界可以真正的变得更好！", "公益是一种生活方式。富裕不是必要条件，更不是充分条件。", "谢谢", "善意也需要方法论，相信益盒", "提前预祝各位妇女节日快乐！", "愿所有人都能过完健康、快乐的一生", "坚持行动让世界变得更好", "纵有疾风起", "积跬步以至千里 聚小流以成江海 希望一点善心能帮助更多的人！", "因自由意志而勇敢，因勇敢而能捍卫他人与我们共同的平安", "爱满人间", "希望能出一些微薄之力，这个世界会好的！", "加油！希望这个世界可以变得更幸福一点", "感谢那些爱，也希望流到更多的人", "希望世界变得更好！", "很开心可以在益盒看到这么多优质的项目，希望一切都好~", "长期的、中等的、短期的时空尺度下的行善，都很重要。", "love", "平安喜乐", "支持", "希望每个善良的人都能被真心以待，我们都会越来越好！", "希望所有女孩子都能有一间自己的房间，生猛地征战世界！", "尽管是微小的付出，希望能为世界带来一点力所能及的改变", "我希望这个世界可以变得更好~", "希望这个世界更美好", "一点点力量", "我想或许2025年是个很好的契机，打开自己的视野，将注意力更少地放在自己的痛苦上，更多地放在我能为这个社会做点什么上", "https://forum.effectivealtruism.org/ 推荐这个论坛，里面的网友个个都是人才，说话又好听，我就是从这里被带到益盒的", "辗转善循环", "相信真实的力量。", "独行踽踽，岂无他人！", "希望为这个世界贡献一点意义", "生命中总需要有属于光的存在", "我们要相信我们可以做事情，我们可以创造改变！", "希望做一个对社会有用的人，捐钱给靠谱的公益机构和项目，也算有点用了", "有效利他主义的生根发芽和再改造，加油，益盒", "让我们一起来做点好东西。", "希望世界上的女孩子都能开心快乐成长", "希望世界越来越好。", "感到无力时要行动，感到恐惧时要伸出援手。", "自利利他 。", "我签署了1％捐赠承诺，是因为想要有人去关心我所关心的社会群体…", "以我家猫猫的名义作出承诺，也许一点付出产生的变化并不能被看见，但是世界有在悄悄地变好就够了。", "做得东西确实不错，公众号有影响到我对公益新的想法～", "合抱之木，生於毫末； 九層之臺，起於累土； 千里之行，始於足下。", "时常怀疑自己所得到的是否公正，在做的一切又是否能促进大家的幸福，于是希望通过公益捐赠稍作弥补。", "我相信未来会来，希望能让世界变好！", "我愿意看到更多积极的、善意的细节和具体的改变发生。", "每个人都可以成为公民科学家、公民慈善家、公民教育家…爱是人类共同的信仰，1%的意义让每个人都能被爱包裹——我们本来就活在一个充满爱的世界里。", "走出自己的虚无一点点，把自己奉献给更大的事物一点点", "相信 相信的力量 在宇宙中同一个空间又遇到三位益盒的捐赠者 不管多少 是时候不停留在想的阶段 去做就好", "我签署了1%的捐赠承诺书，是想让更多青少年明白性教育正确性，好好对待性，爱惜自己的身体", "做一些小小的事情让生活更有美好的可能", "我想帮助更多的女性", "大家加油", "love & peace", "我们要爱人如己。每个人都是爱的链条的一环，一头甩动了，另一头才能一起跟着摇动，让爱从一端传到另一端；至少我们这些手里有烛火的，可以把火苗分给那些还没有的，搅动周围的黑暗。世上的我们，本都是兄弟姐妹呀~捐赠不为别的，只为他人需要", "能够给予本身是一种特权 相信微小的善意也会让世界更美好", "积少成多，希望大家都可以贡献一份力量，帮助更多需要帮助的人！", "月满愿愿圆，希望善意能被传递，爱意能播撒人间，切实帮助到有需要的人，成就伟大的事业", "相信理性的力量", "愿世界更美好", "不知道，做了再说", "分享我关于发薪日的两项计划： 1.参与1%捐赠计划 2.找纹身师约图然后纹一只小兔", "向前看，前方一定是光亮", "其实之前一直觉得公益跟我没关系，我这个苦逼的打工人自己还在生存钱上挣扎，公益就让那些有能力的人去做吧。做力所能及的一点点，我也能让世界变好吗，被此打动，因为我也想跟世界产生链接，让世界变得更好。", "若暗夜终临，吾必立于万万人之前，横刀向渊，血染天穹", "一直在陆陆续续做一些公益，每月资助山区小朋友，捐头发，支教，月捐联合国儿童基金会的项目，偶然看到了益盒，有效公益真的太酷了，非常期待能高效、切中痛点地帮助更多人", "也许这个世界很糟糕，我依旧会和孤独感，焦虑感共度一生，也许自己希望有时候被关注理解，但是我也知道我有一颗愿意帮助别人的心。没有阴暗，无谓光明。愿世界更美好，愿自己更美好。", "今天才认识charity box，读了几篇公众号的文章，被创始人和团队的思考和努力深深打动，所以决定贡献一份自己的力量", "Love never fails.", "加油小小人", "peace&love", "Best wishes", "总是在互相影响下成为更好的人", "在病床上刷到朋友圈朋友分享的1%计划，我隐约感到这是件重要的事情。“让脆弱的世界变得更好一些”？好，我也试试。", "成为更好的自己。", "make the world a better place！", "能帮助到比我更需要帮助的人，是一份快乐和责任", "一起创造美好世界！", "通过真切的交流，我从益盒伙伴身上看到了真诚、正直、坚韧、热忱、智慧。选择用自己的一点努力协助正在更高效更透明做公益的益盒伙伴，让世界多1%的温暖与希望！There's a choice we're making,we'll make a better day just u&me!", "希望你可以找到更多有意义的瞬间。", "希望你可以找到更多有意义的瞬间。", "哪怕个体能做的微不足道，但汇聚在一起就是巨大的力量。让我们把爱传递下去，因为正是这些看似渺小的举动，构建了更美好更温暖的社会♥", "朱博士介绍我来的，一家人就是要整整齐齐，一起做公益", "世界会好吗？你们就是答案", "Hope the world will be better for next generation!", "为众人抱薪者，不可使其冻毙于风雪", "过一种负责任的生活", "希望可以对利他主义有更加深入的思考", "走在一起的失权者认同群体，遍及全球所有的民主和不民主、富裕和不富裕的国家。我们都是99％", "给予比获得更快乐", "点滴善意，温暖彼此", "鸿雁长飞光不度，鱼龙潜跃水成文。", "如果世界因为加了我的一点善意而变得更美好，那么我将万分荣幸", "没什么，希望世界更好", "超级认同有效公益的理念", "吾生而有崖", "小蜘蛛侠罢了", "希望更多女性得到发展的可能. No woman is limited！", "干得漂亮! 这个世界需要英雄!", "用自己的小小力量帮助更多的女性", "微薄之力啦xxx", "Every bit makes a difference!", "总是觉得自己足够幸运，所以也希望能帮到一些人", "用开放的、至纯的、理性的眼光和举动，探索善意的边界和能量", "有效赎罪券", "我的每一个行动，都是在为我想看到的世界投票", "认真，是我们改变世界的方式。", "是因为我想让自己活得更大一些，不要只盯着自己", "Be together and stronger～", "我相信那个故事“这条鱼有意义”，做我能做的", "愿世界和平 安宁美好", "也许世界因你而改变。", "即使能力微小，也想尽力而为", "希望益盒越做越好～", "每个月生活费的百分之一，对我来说可能就是解决一顿的温饱，但是当我看到他可以用来上五名儿童的情感课程，我觉得饿一顿也是没事的。", "To a better world :)", "其实也是一种自助，在对自己感到失望、挫败、生气时候，能有一种“至少我还给世界上的一些人有效地提供了一点点的帮助”的安慰。", "不积跬步，无以至千里", "这1%或许能完整很多个99%，一起为了更美好的中国而努力", "给自己一个礼物", "青山一路同云雨，明月何曾是两乡。", "在工作和生活的小世界之外，帮助更多的人", "希望永存", "自助者人助之，脚踏实地，勇敢前行", "给自己一份礼物", "求仁得仁。", "感谢你们，承诺与改变是可能", "以微小的力量，助力改变", "大家一起做小小的行动，收获大大的美好！", "爱，因为在心中，有效且理性慈善，❤️美好点滴人生！", "感谢这个美好的社会！", "无穷的远方，无数的人们，与我们有关", "用心关注，用脑捐赠", "在还迷茫于人生目标与意义的阶段，1%捐助计划是我唯一能够真实确认我在为我自己之外的事情做些什么的事。", "愿世界因而更美好,有希望！", "每个人的自由发展是一切人自由发展的前提。You may say I'm a dreamer, But I'm not the only one.", "一顿饭钱咱还是能省下来的", "一个小小的起步 让善意在彼此间有效流动～  感谢这么棒的益盒！让我有机会了解和在中国践行有效利他，认识到一直有那么多为关心Ta者和改善世界而行动和付出的人  感谢提供给我收入的、我所服务的公益项目及其捐赠人", "万物为我所用 非我所有", "我签署了1%的承诺，是因为意识到我在伦敦半天的生活费可能就是农村老人一个月的养老金，而我有义务让这些钱花得更值当一些（比如花在更弱势的人身上对他们带来的生活境遇提升会比花在我自己身上显著很多）。", "我好像找不到所谓大的人生“意义” 所以我想每个月做一点有意义的小事情", "明我以德", "我们都可以让世界更好。只要我们想。", "公益不是一个人做了很多，而且每人做一点，有很多人一起做。", "希望未来处于困境能获得帮助的人越来越多", "分享是一种快乐，让爱和能量流动起来", "“资本的流向决定文明的走向”", "相信，爱出者爱返~", "陽明子曰：「夫聖人之心，以天地萬物為一體，其視天下之人，無外內遠近，凡有血氣，皆其昆弟赤子之親，莫不欲安全而教養之，以遂其萬物一體之念。」吾非聖人，但願效聖人之所行。", "无穷的远方，都与我们相关", "本就已经在这么做了…", "保持同理心。", "追问效果，改变世界", "相信益盒，关注改变。", "“谁能不顾自己的家园，抛开记忆中的童年。”", "捐赠能让你通过自己的付出参与比自己的生命更大的世界，让能力和愿力帮助到更多需要的人和事。", "善举与爱的漩涡，可以在地球上运转起来，点亮心中的光。", "没有人可以享受到平等直到这个世界平等", "感谢和治霖一样一直在探索有效捐赠的朋友们，希望益盒越来越好", "永远保有相信和希望", "我不知道未来会怎么样，但是我相信我们能一起进步", "勿以善小而不为，每个人都有力量让世界变得更好", "we are the 99%", "无穷的远方，无数的生命，都和我有关。", "积跬步吧", "永远不要忘记儿时看见弱者与不公时内心的冲动与愤懑，以及当时迫切想要改善世界帮助他人的淳朴愿望", "我签署了 1% 捐赠承诺，因为我相信通过持续科学地捐赠，这个世界和我都会变得更好。", "我在乎", "我签署了1%捐赠承诺是因为我对这个世界充满爱和希望，也希望自己可以为这个世界做些什么！", "为了创造一种值得过的生活", "星星之火可以燎原。", "恭喜益盒团队！", "无穷的远方，无数的人们，都和我有关。", "签署1%，为了帮助更多的女性。", "The day may come when all the animal creation may acquire those rights which never could have been withholden but by the hand of tyranny.", "向更远的地方走去。", "尽一份爱心，让这个世界变得更美好一点点。", "尽力让人类拥有一个更美好的未来。", "在生活的1%里延展99%的无限边界", "此心光明，亦复何言！", "快乐地给予！相信世界可以更美好！", "众人拾柴火焰高！", "汇聚理性的力量", "为了更加公平、合理、美好的未来！", "依然相信，益盒是能带来改变的。", "我为人人，人人为我", "以利他之心发心，以利他之行前行。", "总要有人做点什么", "你永远可以有梦，也永远可以行动。用1%多造一个梦。", "世界好起来！", "希望这个社会会越来越好", "你可以尝试", "选择对的项目，行有效善。保持捐赠习惯，求最大善。", "每个人都有自己的belief，我选择believe in good", "汇聚信念 ; D", "咱先捐为敬，小伙伴们快行动起来！", "请相信我们可以让这个世界更好", "共同奉献，感恩生命", "用1%开始构建中国本土的公众参与。", "福来者福往", "捐赠经历告诉我：当你为认可和喜欢的项目或事业捐赠，每月从账户扣款时，会是一种你又支持到他们继续为这个世界带来美好改变的愉悦和幸福。 1%捐赠承诺是一个很好的桥梁，让每个人可以真诚、坚定、力所能及地将行善变得日常，希望也相信越来越多人加入~", "力所能及，行有效的善", "Nights of insult let you pass Watched by every human love.", "萤火虽微，但为其芒。萤火虽微，可照旷野。", "多建立一点与世界的联系，多增加一点人们的福祉，我们的生命由此更加广阔和温暖。", "The arc of the moral universe is long, but it bends toward justice.", "You are the reasons I am. You are all my reasons.", "期望这世界人人如龙，人人里的每个人所能做的却少之又少。在一点一滴中努力吧，只愿当下有回响，未来有影响。", "希望照亮一些角落"];

    // 随机打乱数组（洗牌算法）
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    let danmakuPool = [];
    let danmakuTimer = null;

    // 轨道防重叠：记录每个轨道下一次可用的时间戳
    const laneCount = 12;
    const laneOccupancy = new Array(laneCount).fill(0);

    function startDanmaku() {
        if (danmakuTimer) return;
        const container = document.querySelector('.danmaku-container');
        if (!container) return;

        // 初始化/补充洗牌池
        if (danmakuPool.length === 0) {
            danmakuPool = [...danmakuMessages];
            shuffleArray(danmakuPool);
        }

        // 初始喷发
        setTimeout(() => createDanmakuItem(container), 200);

        danmakuTimer = setInterval(() => {
            createDanmakuItem(container);
        }, 1500); // 1.5s 检查一次是否可以发射
    }

    function stopDanmaku() {
        if (danmakuTimer) {
            clearInterval(danmakuTimer);
            danmakuTimer = null;
        }
        const container = document.querySelector('.danmaku-container');
        if (container) container.innerHTML = ''; // 清理残余弹幕
        laneOccupancy.fill(0); // 清理轨道占用
    }

    function createDanmakuItem(container) {
        const now = Date.now();
        const availableLanes = [];
        for (let i = 0; i < laneCount; i++) {
            if (now >= laneOccupancy[i]) {
                availableLanes.push(i);
            }
        }

        if (availableLanes.length === 0) {
            return; // 所有轨道都在忙，跳过这次发射
        }

        if (danmakuPool.length === 0) {
            danmakuPool = [...danmakuMessages];
            shuffleArray(danmakuPool);
        }

        const msg = danmakuPool.pop(); // 保证不重复

        const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];

        // 锁定该轨道一段时间 (例如 3500ms)，避免弹幕重叠
        laneOccupancy[laneIndex] = now + 4000;

        const item = document.createElement('div');
        item.className = 'danmaku-item';
        item.textContent = msg;

        // 使用轨道分布确保均匀 (4% 到 96% 分成 12 个轨道)
        const top = 4 + laneIndex * (92 / (laneCount - 1));

        item.style.top = `${top}%`;
        item.style.left = '100%';
        container.appendChild(item);

        // 随机速度 (12s - 20s)
        const duration = 12000 + Math.random() * 8000;

        const animation = item.animate([
            { left: '100%', transform: 'translateX(0)' },
            { left: '-10%', transform: 'translateX(-100%)' }
        ], {
            duration: duration,
            easing: 'linear'
        });

        animation.onfinish = () => {
            item.remove();
        };
    }

    // 暴露给全局以便在 slideChange 中调用
    window.startDanmaku = startDanmaku;
    window.stopDanmaku = stopDanmaku;
});

