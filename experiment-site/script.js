// 全局变量和初始数据
let currentGroup = 'dashboard';
let currentWeek = 1;
let currentMember = null;
let groupData = {};

// 组别配置
const groupConfig = {
    'group-1': { name: '科研课题组', defaultCount: 15 },
    'group-2': { name: '硬件课题组', defaultCount: 3 },
    'group-3': { 
        name: '大模型辅助课程学习组', 
        subgroups: {
            'linear-algebra': { name: '线性代数', defaultCount: 31 },
            'data-structure': { name: '数据结构与算法', defaultCount: 40 }
        }
    },
    'group-4': { name: '微信小程序开发组', defaultCount: 2 },
    'group-5': { name: '网站设计组', defaultCount: 1 }
};

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化导航
    initNavigation();
    
    // 初始化周选择器
    initWeekSelectors();
    
    // 初始化大模型辅助课程学习组的子分组切换
    initSubgroupTabs();
    
    // 初始化添加成员按钮
    initAddMemberButtons();
    
    // 初始化设置页面
    initSettingsPage();
    
    // 初始化模态框
    initModal();
    
    // 加载数据
    loadData();
    
    // 更新UI
    updateUI();
    
    // 处理二维码上传
    const qrcodeUpload = document.getElementById('member-qrcode-upload');
    const qrcodeImage = document.getElementById('qrcode-image');
    const uploadHint = document.querySelector('.upload-hint');
    
    qrcodeUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                const imageData = event.target.result;
                qrcodeImage.src = imageData;
                qrcodeImage.style.display = 'block';
                uploadHint.style.display = 'none';
                
                // 保存到当前成员数据中
                if (currentMember) {
                    currentMember.qrcodeImage = imageData;
                }
            };
            
            reader.readAsDataURL(file);
        }
    });
    
    // 在设置页添加创建images文件夹的提示
    const settingsCard = document.querySelector('.settings-cards');
    const folderInfo = document.createElement('div');
    folderInfo.className = 'folder-info';
    folderInfo.innerHTML = `
        <h3>二维码图片存储说明</h3>
        <p>系统使用浏览器本地存储保存二维码图片（转换为Base64格式），无需创建外部文件夹。</p>
        <p>注意：大量图片可能会占用较多本地存储空间，请定期导出备份数据。</p>
    `;
    settingsCard.appendChild(folderInfo);
});

// 初始化导航
function initNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    const menuBtn = document.querySelector('.menu-btn');
    const nav = document.querySelector('nav');
    
    // 导航链接点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 设置当前页面
            const target = this.getAttribute('data-target');
            navigateTo(target);
            
            // 移动端菜单关闭
            if (window.innerWidth <= 768) {
                nav.classList.remove('active');
            }
        });
    });
    
    // 移动端菜单切换
    menuBtn.addEventListener('click', function() {
        nav.classList.toggle('active');
    });
}

// 切换到指定页面
function navigateTo(target) {
    const navLinks = document.querySelectorAll('nav a');
    const pages = document.querySelectorAll('.page');
    
    // 移除所有active类
    navLinks.forEach(link => link.classList.remove('active'));
    pages.forEach(page => page.classList.remove('active'));
    
    // 设置当前页面为active
    document.querySelector(`nav a[data-target="${target}"]`).classList.add('active');
    document.getElementById(target).classList.add('active');
    
    // 更新当前组
    currentGroup = target;
    
    // 更新当前页面的内容
    updateUI();
}

// 初始化周选择器
function initWeekSelectors() {
    const weekSelectors = document.querySelectorAll('.week-selector select');
    
    weekSelectors.forEach(selector => {
        selector.addEventListener('change', function() {
            // 获取当前选择的周
            const week = parseInt(this.value);
            
            // 如果是总览页面的周选择器
            if (this.id === 'week-select') {
                currentWeek = week;
                // 更新所有组别的周选择器
                document.querySelectorAll('.group-week-select').forEach(s => {
                    s.value = week;
                });
                // 更新所有组别的UI
                updateUI();
            } 
            // 如果是组别页面的周选择器
            else {
                // 获取当前组别
                const groupId = this.id.replace('-week', '');
                // 更新该组别的UI
                currentWeek = week;
                updateGroupUI(groupId);
            }
        });
    });
}

// 初始化大模型辅助课程学习组的子分组切换
function initSubgroupTabs() {
    const subgroupTabs = document.querySelectorAll('.subgroup-tab');
    
    subgroupTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // 移除所有tab的active类
            subgroupTabs.forEach(t => t.classList.remove('active'));
            // 添加当前tab的active类
            this.classList.add('active');
            
            // 获取要显示的subgroup
            const subgroup = this.getAttribute('data-subgroup');
            // 隐藏所有subgroup
            document.querySelectorAll('.subgroup').forEach(s => s.classList.remove('active'));
            // 显示当前subgroup
            document.getElementById(subgroup).classList.add('active');
        });
    });
    
    // 初始化保存主题按钮
    document.querySelectorAll('.save-topic').forEach(button => {
        button.addEventListener('click', function() {
            const subgroup = this.getAttribute('data-subgroup');
            const topic = document.getElementById(`${subgroup}-topic`).value.trim();
            
            if (topic) {
                // 保存主题
                if (!groupData['group-3']) {
                    groupData['group-3'] = { members: [], subgroups: {} };
                }
                if (!groupData['group-3'].subgroups[subgroup]) {
                    groupData['group-3'].subgroups[subgroup] = { topics: {} };
                }
                if (!groupData['group-3'].subgroups[subgroup].topics) {
                    groupData['group-3'].subgroups[subgroup].topics = {};
                }
                
                groupData['group-3'].subgroups[subgroup].topics[currentWeek] = topic;
                
                // 保存数据
                saveData();
                
                // 提示保存成功
                alert(`已保存第${currentWeek}周${subgroup === 'linear-algebra' ? '线性代数' : '数据结构与算法'}学习主题`);
            } else {
                alert('请输入学习主题');
            }
        });
    });
}

// Ensure "Add Member" buttons are functional
function initAddMemberButtons() {
    console.log('初始化添加成员按钮...');
    document.querySelectorAll('[id^="add-member-"]').forEach(button => {
        console.log(`绑定按钮: ${button.id}`);
        button.addEventListener('click', function() {
            const groupId = this.id.replace('add-member-', '');
            console.log(`点击添加成员按钮，组别: ${groupId}`);
            // Show the modal for adding a member
            showMemberModal(null, groupId);
        });
    });
}

// 初始化设置页面
function initSettingsPage() {
    // 导出数据按钮
    document.getElementById('export-data').addEventListener('click', exportData);
    
    // 导入数据按钮
    document.getElementById('import-file').addEventListener('change', importData);
    
    // 重置数据按钮
    document.getElementById('reset-data').addEventListener('click', function() {
        if (confirm('确定要重置所有数据吗？此操作不可撤销！')) {
            resetData();
        }
    });
    
    // 保存成员数量按钮
    document.getElementById('save-member-count').addEventListener('click', saveMemberCount);
}

// 初始化模态框
function initModal() {
    const modal = document.getElementById('member-modal');
    const closeBtn = document.querySelector('.close-modal');
    
    // 关闭按钮点击事件
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 保存成员按钮
    document.getElementById('save-member').addEventListener('click', saveMember);
    
    // 删除成员按钮
    document.getElementById('delete-member').addEventListener('click', deleteMember);
}

// 加载数据
function loadData() {
    const savedData = localStorage.getItem('experimentCourseData');
    if (savedData) {
        try {
            groupData = JSON.parse(savedData);
        } catch (e) {
            console.error('加载数据出错:', e);
            groupData = initializeEmptyData();
        }
    } else {
        groupData = initializeEmptyData();
    }
}

// 初始化空数据
function initializeEmptyData() {
    const data = {};
    
    // 遍历组别配置
    for (const [groupId, config] of Object.entries(groupConfig)) {
        if (groupId === 'group-3') {
            // 大模型辅助课程学习组特殊处理
            data[groupId] = {
                members: [],
                subgroups: {
                    'linear-algebra': { topics: {} },
                    'data-structure': { topics: {} }
                }
            };
            
            // 初始化成员
            for (let i = 1; i <= config.subgroups['linear-algebra'].defaultCount; i++) {
                data[groupId].members.push({
                    id: `LA${i.toString().padStart(3, '0')}`,
                    name: `学生${i}`,
                    subgroup: 'linear-algebra',
                    progress: {}
                });
            }
            
            for (let i = 1; i <= config.subgroups['data-structure'].defaultCount; i++) {
                data[groupId].members.push({
                    id: `DS${i.toString().padStart(3, '0')}`,
                    name: `学生${i}`,
                    subgroup: 'data-structure',
                    progress: {}
                });
            }
        } else {
            // 其他组别
            data[groupId] = { members: [] };
            
            // 初始化成员
            for (let i = 1; i <= config.defaultCount; i++) {
                // 为科研和硬件课题组添加项目主题字段
                if (groupId === 'group-1' || groupId === 'group-2') {
                    data[groupId].members.push({
                        id: `${groupId.split('-')[1]}${i.toString().padStart(3, '0')}`,
                        name: `学生${i}`,
                        projectTopic: '',
                        progress: {}
                    });
                } else {
                    data[groupId].members.push({
                        id: `${groupId.split('-')[1]}${i.toString().padStart(3, '0')}`,
                        name: `学生${i}`,
                        progress: {}
                    });
                }
            }
        }
    }
    
    // 对于微信小程序开发组(group-4)，增加小程序链接和二维码字段
    if (groupId === 'group-4') {
        member = {
            name: `成员${i+1}`,
            id: `G4-${String(i+1).padStart(2, '0')}`,
            progress: Array(11).fill({
                completed: false,
                notes: ''
            }),
            miniprogramLink: '',  // 小程序链接
            qrcodeImage: ''       // 二维码图片（Base64）
        };
    }
    
    return data;
}

// 保存数据
function saveData() {
    try {
        localStorage.setItem('experimentCourseData', JSON.stringify(groupData));
    } catch (e) {
        console.error('保存数据出错:', e);
        alert('保存数据出错，可能是数据过大，请导出并备份数据。');
    }
}

// 更新UI
function updateUI() {
    // 更新总览页面
    updateDashboard();
    
    // 更新各组别页面
    for (const groupId in groupConfig) {
        updateGroupUI(groupId);
    }
    
    // 更新设置页面
    updateSettingsUI();
}

// 更新总览页面
function updateDashboard() {
    // 设置总览页面的周选择器
    document.getElementById('week-select').value = currentWeek;
    
    // 更新各组别的进度和成员数量
    for (const [groupId, config] of Object.entries(groupConfig)) {
        const groupData = getGroupData(groupId);
        const memberCount = getMemberCount(groupId);
        const completion = calculateGroupCompletion(groupId, currentWeek);
        
        // 更新成员数量
        document.getElementById(`${groupId}-count`).textContent = memberCount;
        
        // 更新进度条
        document.getElementById(`${groupId}-progress`).style.width = `${completion}%`;
        
        // 更新完成百分比
        document.getElementById(`${groupId}-completion`).textContent = completion;
    }
}

// 更新组别UI
function updateGroupUI(groupId) {
    // 设置组别页面的周选择器
    const weekSelector = document.getElementById(`${groupId}-week`);
    if (weekSelector) {
        weekSelector.value = currentWeek;
    }
    
    // 获取组别数据
    const group = getGroupData(groupId);
    
    // 更新成员数量
    const memberCount = getMemberCount(groupId);
    document.getElementById(`${groupId}-member-count`).textContent = memberCount;
    
    // 特殊处理大模型辅助课程学习组
    if (groupId === 'group-3') {
        // 更新子分组成员数量
        const linearAlgebraCount = group.members.filter(m => m.subgroup === 'linear-algebra').length;
        const dataStructureCount = group.members.filter(m => m.subgroup === 'data-structure').length;
        
        document.getElementById('subgroup-1-count').textContent = linearAlgebraCount;
        document.getElementById('subgroup-2-count').textContent = dataStructureCount;
        
        // 更新学习主题输入框
        if (group.subgroups) {
            if (group.subgroups['linear-algebra'] && group.subgroups['linear-algebra'].topics) {
                document.getElementById('linear-algebra-topic').value = group.subgroups['linear-algebra'].topics[currentWeek] || '';
            }
            
            if (group.subgroups['data-structure'] && group.subgroups['data-structure'].topics) {
                document.getElementById('data-structure-topic').value = group.subgroups['data-structure'].topics[currentWeek] || '';
            }
        }
        
        // 更新线性代数成员列表
        const linearAlgebraMembers = group.members.filter(member => member.subgroup === 'linear-algebra');
        updateMemberList('linear-algebra-members', linearAlgebraMembers, groupId);
        
        // 更新数据结构与算法成员列表
        const dataStructureMembers = group.members.filter(member => member.subgroup === 'data-structure');
        updateMemberList('data-structure-members', dataStructureMembers, groupId);
    } else {
        // 更新成员列表
        updateMemberList(`${groupId}-members`, group.members, groupId);
    }
}

// Ensure member cards are clickable
function updateMemberList(containerId, members, groupId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    members.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'member-card';
        memberElement.innerHTML = `
            <h3>${member.name} <span>${member.id}</span></h3>
            <div class="member-progress">
                <div class="member-progress-bar">
                    <div class="member-progress-value" style="width: 100%"></div>
                </div>
                <div class="member-status">进度: 已记录</div>
            </div>
        `;

        // Add click event to open modal
        memberElement.addEventListener('click', function() {
            showMemberModal(member, groupId);
        });

        container.appendChild(memberElement);
    });
}

// 更新设置页面UI
function updateSettingsUI() {
    // 设置各组别成员数量输入框的值
    document.getElementById('group-1-count-setting').value = getMemberCount('group-1');
    document.getElementById('group-2-count-setting').value = getMemberCount('group-2');
    document.getElementById('linear-algebra-count-setting').value = 
        groupData['group-3'] ? groupData['group-3'].members.filter(m => m.subgroup === 'linear-algebra').length : 31;
    document.getElementById('data-structure-count-setting').value = 
        groupData['group-3'] ? groupData['group-3'].members.filter(m => m.subgroup === 'data-structure').length : 40;
    document.getElementById('group-4-count-setting').value = getMemberCount('group-4');
    document.getElementById('group-5-count-setting').value = getMemberCount('group-5');
}

// 显示成员详情模态框
function showMemberModal(member, groupId) {
    console.log(`显示模态框，组别: ${groupId}, 成员: ${member ? member.name : '新成员'}`);
    const modal = document.getElementById('member-modal');
    if (!modal) {
        console.error('模态框未找到！');
        return;
    }
    const modalTitle = document.getElementById('modal-title');
    const nameInput = document.getElementById('member-name');
    const idInput = document.getElementById('member-id');
    const projectTopicContainer = document.getElementById('project-topic-container');
    const projectTopicInput = document.getElementById('member-project-topic');
    const subgroupContainer = document.getElementById('subgroup-select-container');
    const subgroupSelect = document.getElementById('member-subgroup');
    const tabHeaders = document.querySelector('.tab-headers');
    const tabContent = document.querySelector('.tab-content');
    
    // 设置模态框标题
    modalTitle.textContent = member ? '编辑成员进度' : '添加新成员';
    
    // 设置成员信息
    nameInput.value = member ? member.name : '';
    idInput.value = member ? member.id : '';
    
    // 处理项目主题输入框（仅科研和硬件课题组需要）
    if (groupId === 'group-1' || groupId === 'group-2') {
        projectTopicContainer.style.display = 'block';
        projectTopicInput.value = member && member.projectTopic ? member.projectTopic : '';
    } else {
        projectTopicContainer.style.display = 'none';
    }
    
    // 处理分组选择器（仅大模型辅助课程学习组需要）
    if (groupId === 'group-3') {
        subgroupContainer.style.display = 'block';
        subgroupSelect.value = member ? member.subgroup : 'linear-algebra';
    } else {
        subgroupContainer.style.display = 'none';
    }
    
    // 生成周次选项卡
    tabHeaders.innerHTML = '';
    tabContent.innerHTML = '';
    
    for (let week = 1; week <= 11; week++) {
        // 创建选项卡标题
        const tabHeader = document.createElement('div');
        tabHeader.className = `tab-header ${week === currentWeek ? 'active' : ''}`;
        tabHeader.textContent = `第${week}周`;
        tabHeader.setAttribute('data-week', week);
        
        // 选项卡点击事件
        tabHeader.addEventListener('click', function() {
            // 移除所有active类
            document.querySelectorAll('.tab-header').forEach(header => header.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
            
            // 添加当前选项卡的active类
            this.classList.add('active');
            document.querySelector(`.tab-panel[data-week="${week}"]`).classList.add('active');
        });
        
        tabHeaders.appendChild(tabHeader);
        
        // 创建选项卡内容
        const tabPanel = document.createElement('div');
        tabPanel.className = `tab-panel ${week === currentWeek ? 'active' : ''}`;
        tabPanel.setAttribute('data-week', week);
        
        // 获取该周的进度内容
        const progressContent = member && member.progress[week] ? member.progress[week] : '';
        const uploadedFile = member && member.progress[week]?.file ? member.progress[week].file : '';
        
        tabPanel.innberHTML = `
<div class="progress-content">
                <textarea placeholder="请输入第${week}周的进度内容...">${progressContent}</textarea>
            </div>
            <div class="file-upload">
                <label for="file-upload-week-${week}">上传文件：</label>
                <input type="file" id="file-upload-week-${week}" accept=".pdf,.doc,.docx,.txt,.jpg,.png,.gif">
                <button class="view-file-button" ${uploadedFile ? '' : 'disabled'} onclick="window.open('${uploadedFile}', '_blank')">查看文件</button>
            </div>
        `;
        
        // 监听文件上传事件
        const fileInput = tabPanel.querySelector(`#file-upload-week-${week}`);
        const viewFileButton = tabPanel.querySelector('.view-file-button');
        fileInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    const fileData = event.target.result;
                    if (!member.progress[week]) {
                        member.progress[week] = {};
                    }
                    member.progress[week].file = fileData; // 将文件数据存储到成员的进度中

                    // 启用查看文件按钮并更新链接
                    viewFileButton.disabled = false;
                    viewFileButton.onclick = () => window.open(fileData, '_blank');
                };
                reader.readAsDataURL(file);
            }
        });
        
        tabContent.appendChild(tabPanel);
    }
    
    // 显示模态框
    modal.style.display = 'flex';
    
    // 保存组别信息到保存按钮
    document.getElementById('save-member').setAttribute('data-group', groupId);

    // Ensure modal close functionality works
    const closeBtn = document.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// 保存成员信息
function saveMember() {
    const groupId = document.getElementById('save-member').getAttribute('data-group');
    const nameInput = document.getElementById('member-name');
    const idInput = document.getElementById('member-id');
    const projectTopicInput = document.getElementById('member-project-topic');
    const subgroupSelect = document.getElementById('member-subgroup');
    
    const name = nameInput.value.trim();
    const id = idInput.value.trim();
    const projectTopic = projectTopicInput.value.trim();
    
    if (!name || !id) {
        alert('请填写姓名和学号');
        return;
    }
    
    // 获取所有周的进度内容
    const progress = {};
    document.querySelectorAll('.tab-panel').forEach(panel => {
        const week = parseInt(panel.getAttribute('data-week'));
        const content = panel.querySelector('textarea').value.trim();
        progress[week] = content;
    });
    
    // 如果是编辑现有成员
    if (currentMember) {
        // 更新成员信息
        currentMember.name = name;
        currentMember.id = id;
        
        // 如果是科研或硬件课题组，更新项目主题
        if (groupId === 'group-1' || groupId === 'group-2') {
            currentMember.projectTopic = projectTopic;
        }
        
        // 如果是大模型辅助课程学习组，可能需要更新分组
        if (groupId === 'group-3') {
            currentMember.subgroup = subgroupSelect.value;
        }
        
        // 更新进度
        currentMember.progress = progress;
    } 
    // 如果是添加新成员
    else {
        // 创建新成员对象
        const newMember = {
            name: name,
            id: id,
            progress: progress
        };
        
        // 如果是科研或硬件课题组，设置项目主题
        if (groupId === 'group-1' || groupId === 'group-2') {
            newMember.projectTopic = projectTopic;
        }
        
        // 如果是大模型辅助课程学习组，设置分组
        if (groupId === 'group-3') {
            newMember.subgroup = subgroupSelect.value;
        }
        
        // 确保组别数据存在
        if (!groupData[groupId]) {
            if (groupId === 'group-3') {
                groupData[groupId] = {
                    members: [],
                    subgroups: {
                        'linear-algebra': { topics: {} },
                        'data-structure': { topics: {} }
                    }
                };
            } else {
                groupData[groupId] = { members: [] };
            }
        }
        
        // 添加新成员
        groupData[groupId].members.push(newMember);
    }
    
    // 保存数据
    saveData();
    
    // 关闭模态框
    document.getElementById('member-modal').style.display = 'none';
    
    // 更新UI
    updateUI();
}

// 删除成员
function deleteMember() {
    if (!currentMember) {
        return;
    }
    
    const groupId = document.getElementById('save-member').getAttribute('data-group');
    
    if (!confirm(`确定要删除成员 ${currentMember.name} (${currentMember.id}) 吗？此操作不可撤销！`)) {
        return;
    }
    
    // 从数据中移除当前成员
    if (groupData[groupId] && groupData[groupId].members) {
        const index = groupData[groupId].members.findIndex(m => m.id === currentMember.id);
        if (index !== -1) {
            groupData[groupId].members.splice(index, 1);
        }
    }
    
    // 保存数据
    saveData();
    
    // 关闭模态框
    document.getElementById('member-modal').style.display = 'none';
    
    // 更新UI
    updateUI();
}

// 保存成员数量设置
function saveMemberCount() {
    const group1Count = parseInt(document.getElementById('group-1-count-setting').value) || 15;
    const group2Count = parseInt(document.getElementById('group-2-count-setting').value) || 3;
    const linearAlgebraCount = parseInt(document.getElementById('linear-algebra-count-setting').value) || 31;
    const dataStructureCount = parseInt(document.getElementById('data-structure-count-setting').value) || 40;
    const group4Count = parseInt(document.getElementById('group-4-count-setting').value) || 2;
    const group5Count = parseInt(document.getElementById('group-5-count-setting').value) || 1;
    
    // 调整各组别成员数量
    adjustMemberCount('group-1', group1Count);
    adjustMemberCount('group-2', group2Count);
    adjustSubgroupMemberCount('linear-algebra', linearAlgebraCount);
    adjustSubgroupMemberCount('data-structure', dataStructureCount);
    adjustMemberCount('group-4', group4Count);
    adjustMemberCount('group-5', group5Count);
    
    // 保存数据
    saveData();
    
    // 更新UI
    updateUI();
    
    alert('成员数量设置已保存');
}

// 调整组别成员数量
function adjustMemberCount(groupId, targetCount) {
    if (!groupData[groupId]) {
        groupData[groupId] = { members: [] };
    }
    
    const currentCount = groupData[groupId].members.length;
    
    // 如果当前成员数量小于目标数量，添加新成员
    if (currentCount < targetCount) {
        for (let i = currentCount + 1; i <= targetCount; i++) {
            // 为科研和硬件课题组添加项目主题字段
            if (groupId === 'group-1' || groupId === 'group-2') {
                groupData[groupId].members.push({
                    id: `${groupId.split('-')[1]}${i.toString().padStart(3, '0')}`,
                    name: `学生${i}`,
                    projectTopic: '',
                    progress: {}
                });
            } else {
                groupData[groupId].members.push({
                    id: `${groupId.split('-')[1]}${i.toString().padStart(3, '0')}`,
                    name: `学生${i}`,
                    progress: {}
                });
            }
        }
    }
    // 如果当前成员数量大于目标数量，移除多余成员
    else if (currentCount > targetCount) {
        groupData[groupId].members = groupData[groupId].members.slice(0, targetCount);
    }
}

// 调整大模型辅助课程学习组子分组成员数量
function adjustSubgroupMemberCount(subgroupId, targetCount) {
    if (!groupData['group-3']) {
        groupData['group-3'] = {
            members: [],
            subgroups: {
                'linear-algebra': { topics: {} },
                'data-structure': { topics: {} }
            }
        };
    }
    
    // 获取当前子分组成员
    const subgroupMembers = groupData['group-3'].members.filter(m => m.subgroup === subgroupId);
    const currentCount = subgroupMembers.length;
    
    // 如果当前成员数量小于目标数量，添加新成员
    if (currentCount < targetCount) {
        const prefix = subgroupId === 'linear-algebra' ? 'LA' : 'DS';
        
        for (let i = currentCount + 1; i <= targetCount; i++) {
            groupData['group-3'].members.push({
                id: `${prefix}${i.toString().padStart(3, '0')}`,
                name: `学生${i}`,
                subgroup: subgroupId,
                progress: {}
            });
        }
    }
    // 如果当前成员数量大于目标数量，移除多余成员
    else if (currentCount > targetCount) {
        // 获取要保留的成员的ID
        const keepIds = subgroupMembers.slice(0, targetCount).map(m => m.id);
        
        // 从所有成员中筛选出其他子分组的成员和要保留的当前子分组成员
        groupData['group-3'].members = groupData['group-3'].members.filter(m => 
            m.subgroup !== subgroupId || keepIds.includes(m.id)
        );
    }
}

// 导出数据
function exportData() {
    const data = {
        groups: groupData,
        currentWeek: currentWeek
    };
    
    const dataStr = JSON.stringify(data);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = `实验课进度记录_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
}

// 导入数据
function importData(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // 验证导入数据格式
            if (!data.groups || !data.subgroups) {
                throw new Error('导入的数据格式不正确');
            }
            
            // 更新数据
            groupData = data.groups;
            currentWeek = data.currentWeek || 1;
            
            // 更新界面
            document.getElementById('week-select').value = currentWeek;
            updateAllGroups();
            updateGroupTabs();
            
            alert('数据导入成功！');
        } catch (error) {
            alert('导入失败：' + error.message);
        }
    };
    
    reader.readAsText(file);
    
    // 重置文件输入，允许选择同一文件
    event.target.value = '';
}

// 重置数据
function resetData() {
    groupData = initializeEmptyData();
    saveData();
    updateUI();
    alert('所有数据已重置');
}

// 获取组别数据
function getGroupData(groupId) {
    if (!groupData[groupId]) {
        if (groupId === 'group-3') {
            groupData[groupId] = {
                members: [],
                subgroups: {
                    'linear-algebra': { topics: {} },
                    'data-structure': { topics: {} }
                }
            };
        } else {
            groupData[groupId] = { members: [] };
        }
    }
    
    return groupData[groupId];
}

// 获取组别成员数量
function getMemberCount(groupId) {
    if (!groupData[groupId]) {
        return groupConfig[groupId].defaultCount;
    }
    
    return groupData[groupId].members.length;
}

// 计算组别完成进度百分比
function calculateGroupCompletion(groupId, week) {
    const group = getGroupData(groupId);
    
    if (!group.members || group.members.length === 0) {
        return 0;
    }
    
    // 计算有进度记录的成员数量
    let completedCount = 0;
    
    if (groupId === 'group-3') {
        // 大模型辅助课程学习组特殊处理
        for (const member of group.members) {
            if (member.progress[week] && member.progress[week].trim() !== '') {
                completedCount++;
            }
        }
    } else {
        // 其他组别
        for (const member of group.members) {
            if (member.progress[week] && member.progress[week].trim() !== '') {
                completedCount++;
            }
        }
    }
    
    // 计算完成百分比
    const percentage = Math.round((completedCount / group.members.length) * 100);
    return percentage;
}

document.getElementById('file-upload').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/savedata', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();
            console.log('文件上传成功:', result);
        } catch (error) {
            console.error('文件上传失败:', error);
        }
    }
});

// 添加文件上传逻辑
const fileUploadInput = document.getElementById('member-file-upload');
fileUploadInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/savedata', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log('文件上传成功:', result);
                alert('文件上传成功！文件链接：' + result.fileUrl);
            } else {
                const error = await response.json();
                console.error('文件上传失败:', error);
                alert('文件上传失败：' + error.message);
            }
        } catch (error) {
            console.error('文件上传过程中出错:', error);
            alert('文件上传过程中出错，请稍后重试。');
        }
    }
});