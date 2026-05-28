(function() {
    'use strict';

    var model3d = null;
    var currentTab = 'embedded';

    // 记录用户手动修改过的层索引 (1-based)
    var manuallyEditedLayers = {};

    var tabState = {
        embedded: {
            width: 300, depth: 125, totalHeight: 900, layers: 3, layerThickness: 10,
            outerFrameMode: 'uniform',
            outerFrameSize: 10, outerFrameDepth: 5,
            outerFrameTop: 10, outerFrameBottom: 10, outerFrameLeft: 10, outerFrameRight: 10,
            outerFrameTopDepth: 5, outerFrameBottomDepth: 5, outerFrameLeftDepth: 5, outerFrameRightDepth: 5,
            layerHeights: [300, 300, 300],
            hasLight: false, drawingNo: '', color: '', date: '', fontSize: 20, remark: '',
            showDrawingNo: true, showColor: true, showHasLight: true, showDate: true, showRemark: true
        },
        surface: {
            width: 300, depth: 125, totalHeight: 900, layers: 3, layerThickness: 10,
            outerFrameMode: 'uniform',
            outerFrameSize: 10, outerFrameDepth: 10,
            outerFrameTop: 10, outerFrameBottom: 10, outerFrameLeft: 10, outerFrameRight: 10,
            outerFrameTopDepth: 10, outerFrameBottomDepth: 10, outerFrameLeftDepth: 10, outerFrameRightDepth: 10,
            layerHeights: [300, 300, 300],
            hasLight: false, drawingNo: '', color: '', date: '', fontSize: 20, remark: '',
            showDrawingNo: true, showColor: true, showHasLight: true, showDate: true, showRemark: true
        }
    };

    Drawing.init('combinedView');

    try {
        model3d = new Model3D('threeContainer');
    } catch (e) {
        console.warn('3D模型初始化失败:', e.message);
    }

    function saveTabState() {
        var layers = parseInt(document.getElementById('layers').value) || 3;
        var heights = [];
        for (var i = 1; i <= layers; i++) {
            var el = document.getElementById('layer' + i + 'Height');
            heights.push(el ? (parseInt(el.value) || 100) : 100);
        }
        tabState[currentTab] = {
            width: parseInt(document.getElementById('width').value) || 300,
            depth: parseInt(document.getElementById('depth').value) || 125,
            totalHeight: parseInt(document.getElementById('totalHeight').value) || 900,
            layers: layers,
            layerThickness: parseInt(document.getElementById('layerThickness').value) || 10,
            outerFrameMode: document.getElementById('outerFrameMode').value || 'uniform',
            outerFrameSize: parseInt(document.getElementById('outerFrameSize').value) || 10,
            outerFrameDepth: parseInt(document.getElementById('outerFrameDepth').value) || 5,
            outerFrameTop: parseInt(document.getElementById('outerFrameTop').value) || 10,
            outerFrameBottom: parseInt(document.getElementById('outerFrameBottom').value) || 10,
            outerFrameLeft: parseInt(document.getElementById('outerFrameLeft').value) || 10,
            outerFrameRight: parseInt(document.getElementById('outerFrameRight').value) || 10,
            outerFrameTopDepth: parseInt(document.getElementById('outerFrameTopDepth').value) || 5,
            outerFrameBottomDepth: parseInt(document.getElementById('outerFrameBottomDepth').value) || 5,
            outerFrameLeftDepth: parseInt(document.getElementById('outerFrameLeftDepth').value) || 5,
            outerFrameRightDepth: parseInt(document.getElementById('outerFrameRightDepth').value) || 5,
            layerHeights: heights,
            hasLight: document.getElementById('hasLight').checked,
            drawingNo: document.getElementById('drawingNo').value || '',
            color: document.getElementById('color').value || '',
            date: document.getElementById('date').value,
            fontSize: parseInt(document.getElementById('fontSize').value) || 16,
            remark: document.getElementById('remark').value || '',
            showDrawingNo: document.getElementById('showDrawingNo').checked,
            showColor: document.getElementById('showColor').checked,
            showHasLight: document.getElementById('showHasLight').checked,
            showDate: document.getElementById('showDate').checked,
            showRemark: document.getElementById('showRemark').checked
        };
    }

    function loadTabState() {
        var s = tabState[currentTab];
        document.getElementById('width').value = s.width;
        document.getElementById('depth').value = s.depth;
        document.getElementById('totalHeight').value = s.totalHeight;
        document.getElementById('layers').value = s.layers;
        document.getElementById('layerThickness').value = s.layerThickness;
        document.getElementById('outerFrameMode').value = s.outerFrameMode;
        document.getElementById('outerFrameSize').value = s.outerFrameSize;
        document.getElementById('outerFrameDepth').value = s.outerFrameDepth;
        document.getElementById('outerFrameTop').value = s.outerFrameTop;
        document.getElementById('outerFrameBottom').value = s.outerFrameBottom;
        document.getElementById('outerFrameLeft').value = s.outerFrameLeft;
        document.getElementById('outerFrameRight').value = s.outerFrameRight;
        document.getElementById('outerFrameTopDepth').value = s.outerFrameTopDepth;
        document.getElementById('outerFrameBottomDepth').value = s.outerFrameBottomDepth;
        document.getElementById('outerFrameLeftDepth').value = s.outerFrameLeftDepth;
        document.getElementById('outerFrameRightDepth').value = s.outerFrameRightDepth;
        document.getElementById('hasLight').checked = s.hasLight;
        document.getElementById('drawingNo').value = s.drawingNo;
        document.getElementById('color').value = s.color;
        document.getElementById('date').value = s.date;
        document.getElementById('fontSize').value = s.fontSize;
        document.getElementById('remark').value = s.remark;
        document.getElementById('showDrawingNo').checked = s.showDrawingNo;
        document.getElementById('showColor').checked = s.showColor;
        document.getElementById('showHasLight').checked = s.showHasLight;
        document.getElementById('showDate').checked = s.showDate;
        document.getElementById('showRemark').checked = s.showRemark;
        updateOuterFrameVisibility();
        // 重置手动编辑标记
        manuallyEditedLayers = {};
        updateLayerHeightInputs(false, s.layerHeights);
    }

    document.querySelectorAll('.tab-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            if (currentTab === btn.getAttribute('data-tab')) return;
            saveTabState();
            document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentTab = btn.getAttribute('data-tab');
            loadTabState();
            updateOuterFrameVisibility();
            updateAll();
        });
    });

    function updateOuterFrameVisibility() {
        var outerInputs = document.querySelectorAll('.outer-frame-inputs');
        outerInputs.forEach(function(el) {
            el.style.display = currentTab === 'embedded' ? 'flex' : 'none';
        });
        var uniformInputs = document.querySelectorAll('.uniform-frame-inputs');
        var separateInputs = document.querySelectorAll('.separate-frame-inputs');
        var mode = document.getElementById('outerFrameMode').value;
        if (mode === 'uniform') {
            uniformInputs.forEach(function(el) { el.style.display = 'flex'; });
            separateInputs.forEach(function(el) { el.style.display = 'none'; });
        } else {
            uniformInputs.forEach(function(el) { el.style.display = 'none'; });
            separateInputs.forEach(function(el) { el.style.display = 'flex'; });
        }
    }

    function getNicheParams() {
        var layers = parseInt(document.getElementById('layers').value) || 3;
        var heights = [];
        for (var i = 1; i <= layers; i++) {
            var el = document.getElementById('layer' + i + 'Height');
            heights.push(el ? (parseInt(el.value) || 100) : 100);
        }
        var today = new Date().toISOString().split('T')[0];
        var dateEl = document.getElementById('date');
        if (!dateEl.value) dateEl.value = today;
        var mode = document.getElementById('outerFrameMode').value;
        return {
            type: currentTab,
            width: parseInt(document.getElementById('width').value) || 300,
            depth: parseInt(document.getElementById('depth').value) || 125,
            totalHeight: parseInt(document.getElementById('totalHeight').value) || 900,
            layers: layers,
            layerThickness: parseInt(document.getElementById('layerThickness').value) || 10,
            outerFrameMode: mode,
            outerFrameSize: mode === 'uniform' ? (parseInt(document.getElementById('outerFrameSize').value) || 10) : 0,
            outerFrameDepth: mode === 'uniform' ? (parseInt(document.getElementById('outerFrameDepth').value) || 5) : 0,
            outerFrameTop: mode === 'separate' ? (parseInt(document.getElementById('outerFrameTop').value) || 10) : 0,
            outerFrameBottom: mode === 'separate' ? (parseInt(document.getElementById('outerFrameBottom').value) || 10) : 0,
            outerFrameLeft: mode === 'separate' ? (parseInt(document.getElementById('outerFrameLeft').value) || 10) : 0,
            outerFrameRight: mode === 'separate' ? (parseInt(document.getElementById('outerFrameRight').value) || 10) : 0,
            outerFrameTopDepth: mode === 'separate' ? (parseInt(document.getElementById('outerFrameTopDepth').value) || 5) : 0,
            outerFrameBottomDepth: mode === 'separate' ? (parseInt(document.getElementById('outerFrameBottomDepth').value) || 5) : 0,
            outerFrameLeftDepth: mode === 'separate' ? (parseInt(document.getElementById('outerFrameLeftDepth').value) || 5) : 0,
            outerFrameRightDepth: mode === 'separate' ? (parseInt(document.getElementById('outerFrameRightDepth').value) || 5) : 0,
            layerHeights: heights,
            hasLight: document.getElementById('hasLight').checked,
            drawingNo: document.getElementById('drawingNo').value || '',
            color: document.getElementById('color').value || '',
            date: document.getElementById('date').value || today,
            fontSize: parseInt(document.getElementById('fontSize').value) || 16,
            remark: document.getElementById('remark').value || '',
            showDrawingNo: document.getElementById('showDrawingNo').checked,
            showColor: document.getElementById('showColor').checked,
            showHasLight: document.getElementById('showHasLight').checked,
            showDate: document.getElementById('showDate').checked,
            showRemark: document.getElementById('showRemark').checked
        };
    }

    window.getNicheParams = getNicheParams;

    function updateAll() {
        var params = getNicheParams();
        Drawing.drawCombined(params);
        if (model3d) {
            try { model3d.update(params); } catch (e) { console.warn(e); }
        }
    }

    function calculateAutoHeights(layers, totalH, lt, currentValues) {
        var totalBoardThickness = (layers - 1) * lt;
        var availableH = Math.max(1, totalH - totalBoardThickness);

        // 收集手动修改的层和其值
        var fixedLayers = {};
        var fixedTotal = 0;
        var fixedCount = 0;
        for (var i = 1; i <= layers; i++) {
            if (manuallyEditedLayers[i] && currentValues[i]) {
                fixedLayers[i] = parseInt(currentValues[i]) || 0;
                fixedTotal += fixedLayers[i];
                fixedCount++;
            }
        }

        var result = {};
        var remainingLayers = layers - fixedCount;

        if (remainingLayers <= 0) {
            // 所有层都被固定，保持原值
            for (var j = 1; j <= layers; j++) {
                result[j] = currentValues[j] || Math.floor(availableH / layers);
            }
            return result;
        }

        var remainingHeight = availableH - fixedTotal;
        var autoHeight = Math.max(1, Math.floor(remainingHeight / remainingLayers));
        var remainder = remainingHeight - autoHeight * remainingLayers;

        // 分配高度
        for (var k = 1; k <= layers; k++) {
            if (fixedLayers[k] !== undefined) {
                result[k] = fixedLayers[k];
            } else {
                result[k] = autoHeight;
                if (remainder > 0) {
                    result[k]++;
                    remainder--;
                }
            }
        }

        return result;
    }

    function updateLayerHeightInputs(keepValues, storedHeights) {
        var layers = parseInt(document.getElementById('layers').value) || 3;
        var container = document.getElementById('layerHeightsContainer');
        var currentValues = {};

        // 收集当前各层的值
        for (var i = 1; i <= layers; i++) {
            var oldEl = document.getElementById('layer' + i + 'Height');
            if (oldEl) currentValues[i] = oldEl.value;
        }

        container.innerHTML = '';
        var totalH = parseInt(document.getElementById('totalHeight').value) || 680;
        var lt = parseInt(document.getElementById('layerThickness').value) || 10;

        var newValues = {};

        if (storedHeights) {
            // 从状态加载（如切换标签页）
            for (var s = 1; s <= layers; s++) {
                newValues[s] = storedHeights[s - 1] || 100;
            }
        } else if (keepValues) {
            // 总高度或层板厚度变化，自动均分未手动修改的层
            newValues = calculateAutoHeights(layers, totalH, lt, currentValues);
        } else {
            // 层数变化，全部重新均分，清除手动编辑标记
            manuallyEditedLayers = {};
            var totalBoardThickness = (layers - 1) * lt;
            var availableH = Math.max(1, totalH - totalBoardThickness);
            var defaultLayerH = Math.floor(availableH / layers);
            var remainder = availableH - defaultLayerH * layers;
            for (var d = 1; d <= layers; d++) {
                newValues[d] = defaultLayerH;
                if (remainder > 0) {
                    newValues[d]++;
                    remainder--;
                }
            }
        }

        for (var j = 1; j <= layers; j++) {
            var val = newValues[j] || 100;
            var div = document.createElement('div');
            div.className = 'input-group';
            div.innerHTML = '<label>第' + j + '层高度 (mm):</label>' +
                '<input type="number" id="layer' + j + 'Height" value="' + val + '" min="1" max="3000" step="1">';
            container.appendChild(div);
        }
        bindLayerInputs();
    }

    function bindInputs() {
        var ids = ['width', 'depth', 'totalHeight', 'layers', 'layerThickness', 'outerFrameMode', 'outerFrameSize', 'outerFrameDepth', 'outerFrameTop', 'outerFrameBottom', 'outerFrameLeft', 'outerFrameRight', 'outerFrameTopDepth', 'outerFrameBottomDepth', 'outerFrameLeftDepth', 'outerFrameRightDepth', 'drawingNo', 'color', 'date', 'fontSize', 'remark'];
        ids.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('input', function() {
                if (id === 'layers') {
                    manuallyEditedLayers = {};
                    updateLayerHeightInputs(false);
                } else if (id === 'totalHeight' || id === 'layerThickness') {
                    updateLayerHeightInputs(true);
                }
                if (id === 'outerFrameMode') {
                    updateOuterFrameVisibility();
                }
                updateAll();
            });
            el.addEventListener('change', updateAll);
        });

        document.getElementById('layers').addEventListener('change', function() {
            manuallyEditedLayers = {};
            updateLayerHeightInputs(false);
            updateAll();
        });

        var lightSwitch = document.querySelector('.switch');
        if (lightSwitch) {
            lightSwitch.addEventListener('click', function() {
                setTimeout(updateAll, 0);
            });
        }

        var switchIds = ['hasLight', 'showDrawingNo', 'showColor', 'showHasLight', 'showDate', 'showRemark'];
        switchIds.forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('change', updateAll);
        });

        bindLayerInputs();
    }

    function bindLayerInputs() {
        var layers = parseInt(document.getElementById('layers').value) || 3;
        for (var i = 1; i <= layers; i++) {
            var el = document.getElementById('layer' + i + 'Height');
            if (!el) continue;
            // 使用闭包保存层索引
            (function(layerIndex) {
                el.addEventListener('change', function() {
                    // 标记该层为手动修改
                    manuallyEditedLayers[layerIndex] = true;
                    // 重新计算其他未修改层的高度
                    redistributeHeights(layerIndex);
                    updateAll();
                });
                el.addEventListener('input', updateAll);
            })(i);
        }
    }

    function redistributeHeights(changedLayerIndex) {
        var layers = parseInt(document.getElementById('layers').value) || 3;
        var totalH = parseInt(document.getElementById('totalHeight').value) || 680;
        var lt = parseInt(document.getElementById('layerThickness').value) || 10;

        var currentValues = {};
        for (var i = 1; i <= layers; i++) {
            var el = document.getElementById('layer' + i + 'Height');
            if (el) currentValues[i] = el.value;
        }

        var newValues = calculateAutoHeights(layers, totalH, lt, currentValues);

        // 更新未手动修改的层的输入框
        for (var j = 1; j <= layers; j++) {
            if (j !== changedLayerIndex && !manuallyEditedLayers[j]) {
                var inputEl = document.getElementById('layer' + j + 'Height');
                if (inputEl) {
                    inputEl.value = newValues[j];
                }
            }
        }
    }

    document.getElementById('exportBtn').addEventListener('click', function() {
        window.exportDrawings();
    });

    document.getElementById('resetBtn').addEventListener('click', function() {
        tabState.embedded = {
            width: 300, depth: 125, totalHeight: 900, layers: 3, layerThickness: 10,
            outerFrameMode: 'uniform',
            outerFrameSize: 10, outerFrameDepth: 5,
            outerFrameTop: 10, outerFrameBottom: 10, outerFrameLeft: 10, outerFrameRight: 10,
            outerFrameTopDepth: 5, outerFrameBottomDepth: 5, outerFrameLeftDepth: 5, outerFrameRightDepth: 5,
            layerHeights: [300, 300, 300],
            hasLight: false, drawingNo: '', color: '', date: '', fontSize: 20, remark: '',
            showDrawingNo: true, showColor: true, showHasLight: true, showDate: true, showRemark: true
        };
        tabState.surface = {
            width: 300, depth: 125, totalHeight: 900, layers: 3, layerThickness: 10,
            outerFrameMode: 'uniform',
            outerFrameSize: 10, outerFrameDepth: 10,
            outerFrameTop: 10, outerFrameBottom: 10, outerFrameLeft: 10, outerFrameRight: 10,
            outerFrameTopDepth: 10, outerFrameBottomDepth: 10, outerFrameLeftDepth: 10, outerFrameRightDepth: 10,
            layerHeights: [300, 300, 300],
            hasLight: false, drawingNo: '', color: '', date: '', fontSize: 20, remark: '',
            showDrawingNo: true, showColor: true, showHasLight: true, showDate: true, showRemark: true
        };
        document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
        document.querySelector('.tab-btn[data-tab="embedded"]').classList.add('active');
        currentTab = 'embedded';
        manuallyEditedLayers = {};
        updateOuterFrameVisibility();
        loadTabState();
        updateAll();
    });

    updateOuterFrameVisibility();
    updateLayerHeightInputs(false);
    bindInputs();

    requestAnimationFrame(function() {
        updateAll();
    });

    window.addEventListener('resize', function() {
        updateAll();
    });
})();
