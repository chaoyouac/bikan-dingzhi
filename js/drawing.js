var Drawing = (function() {
    'use strict';

    var canvas, ctx;
    var PIXELS_PER_MM = 0.8;

    var COLORS = {
        main: '#1a1a1a',
        mainFill: 'rgba(26, 26, 26, 0.06)',
        frame: '#1a1a1a',
        frameFill: 'rgba(26, 26, 26, 0.10)',
        layerBoard: '#1a1a1a',
        layerBoardFill: 'rgba(26, 26, 26, 0.08)',
        dimLine: '#333333',
        dimText: '#222222',
        separator: '#e0e0e0',
        background: '#ffffff',
        paramText: '#cc3333',
        infoText: '#cc3333'
    };

    function init(canvasId) {
        canvas = document.getElementById(canvasId);
        ctx = canvas.getContext('2d');
    }

    function drawCombined(params) {
        var w = params.width;
        var h = params.totalHeight;
        var fs = params.outerFrameSize;
        var fd = params.outerFrameDepth;
        var lt = params.layerThickness;
        var layers = params.layers;
        var heights = params.layerHeights || [];
        var fontSize = params.fontSize || 20;
        var mode = params.outerFrameMode || 'uniform';

        var fsTop = mode === 'separate' ? (params.outerFrameTop || 0) : fs;
        var fsBottom = mode === 'separate' ? (params.outerFrameBottom || 0) : fs;
        var fsLeft = mode === 'separate' ? (params.outerFrameLeft || 0) : fs;
        var fsRight = mode === 'separate' ? (params.outerFrameRight || 0) : fs;
        var fdTop = mode === 'separate' ? (params.outerFrameTopDepth || 0) : fd;
        var fdBottom = mode === 'separate' ? (params.outerFrameBottomDepth || 0) : fd;
        var fdLeft = mode === 'separate' ? (params.outerFrameLeftDepth || 0) : fd;
        var fdRight = mode === 'separate' ? (params.outerFrameRightDepth || 0) : fd;

        var outerW = w + fsLeft + fsRight;
        var outerH = h + fsTop + fsBottom;
        var maxDepth = Math.max(params.depth, fdTop, fdBottom, fdLeft, fdRight);

        var padTop = 60;
        var padBottom = 60;
        var padLeft = 90;
        var padRight = 90;
        var dimSpace = 45;
        var gap = 50;
        var infoPanelGap = 150;
        var infoPanelW = 500;

        var maxFrameSize = Math.max(fsTop, fsBottom, fsLeft, fsRight);
        var frontContentW = outerW + padLeft + padRight + dimSpace * 2;
        var frontContentH = outerH + padTop + padBottom + dimSpace * 2;
        var sideContentW = maxDepth + maxFrameSize + padLeft + padRight + dimSpace;
        var sideContentH = outerH + padTop + padBottom + dimSpace * 2;

        var totalContentW = frontContentW + gap + sideContentW + infoPanelGap / PIXELS_PER_MM + infoPanelW;
        var totalContentH = Math.max(frontContentH, sideContentH);

        var canvasW = Math.max(totalContentW * PIXELS_PER_MM + 40, 800);
        var canvasH = Math.max(totalContentH * PIXELS_PER_MM + 40, 600);

        var dpr = window.devicePixelRatio || 1;
        canvas.width = canvasW * dpr;
        canvas.height = canvasH * dpr;
        canvas.style.width = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvasW, canvasH);

        var startX = -30;
        var startY = 100;
        var shiftX = 50;

        var frontX = startX + shiftX;
        var frontY = startY;
        var frontW = frontContentW * PIXELS_PER_MM;
        var frontH = totalContentH * PIXELS_PER_MM;

        var sideX = frontX + frontW + gap * PIXELS_PER_MM;
        var sideY = startY;
        var sideW = sideContentW * PIXELS_PER_MM;
        var sideH = totalContentH * PIXELS_PER_MM;

        // Labels at top (No right shift, move up 30px)
        ctx.fillStyle = '#cc3333';
        ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        var titlePrefix = params.type === 'surface' ? '明装' : '嵌入式';
        ctx.fillText(titlePrefix + '正面视图', startX + frontW / 2, startY - 45);
        ctx.fillText(titlePrefix + '侧面视图', startX + frontW + gap * PIXELS_PER_MM + sideW / 2, startY - 45);

        drawFrontViewFixed(ctx, params, frontX, frontY, frontW, frontH, padTop, padBottom, padLeft, padRight, dimSpace, fontSize);
        drawSideViewFixed(ctx, params, sideX, sideY, sideW, sideH, padTop, padBottom, padLeft, padRight, dimSpace, fontSize);
        
        // 信息面板显示在画布右侧，与画布同宽
        var infoX = canvasW - infoPanelW - 20;
        var infoY = startY;
        drawInfoPanel(ctx, params, infoX, infoY, fontSize);
    }

    function drawFrontViewFixed(ctx, params, areaX, areaY, areaW, areaH, padTop, padBottom, padLeft, padRight, dimSpace, fontSize) {
        var w = params.width;
        var h = params.totalHeight;
        var fs = params.outerFrameSize;
        var layers = params.layers;
        var lt = params.layerThickness;
        var heights = params.layerHeights || [];
        var isSurface = params.type === 'surface';
        var mode = params.outerFrameMode || 'uniform';

        var fsTop = mode === 'separate' ? (params.outerFrameTop || 0) : fs;
        var fsBottom = mode === 'separate' ? (params.outerFrameBottom || 0) : fs;
        var fsLeft = mode === 'separate' ? (params.outerFrameLeft || 0) : fs;
        var fsRight = mode === 'separate' ? (params.outerFrameRight || 0) : fs;

        var outerW = w + fsLeft + fsRight;
        var outerH = h + fsTop + fsBottom;

        var drawX = areaX + padLeft * PIXELS_PER_MM;
        var drawY = areaY + padTop * PIXELS_PER_MM;
        var drawW = areaW - (padLeft + padRight) * PIXELS_PER_MM;
        var drawH = areaH - (padTop + padBottom) * PIXELS_PER_MM;

        var offsetX = drawX;
        var offsetY = drawY;

        function tx(x) { return offsetX + (x + outerW / 2) * PIXELS_PER_MM; }
        function ty(y) { return offsetY + (outerH / 2 - y) * PIXELS_PER_MM; }
        function sv(v) { return v * PIXELS_PER_MM; }

        if (!isSurface) {
            ctx.fillStyle = 'rgba(26, 26, 26, 0.15)';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;

            // Top border
            ctx.fillRect(tx(-outerW / 2), ty(outerH / 2), sv(outerW), sv(fsTop));
            ctx.strokeRect(tx(-outerW / 2), ty(outerH / 2), sv(outerW), sv(fsTop));

            // Bottom border
            ctx.fillRect(tx(-outerW / 2), ty(-outerH / 2 + fsBottom), sv(outerW), sv(fsBottom));
            ctx.strokeRect(tx(-outerW / 2), ty(-outerH / 2 + fsBottom), sv(outerW), sv(fsBottom));

            // Left border (height excludes top and bottom borders)
            ctx.fillRect(tx(-outerW / 2), ty(outerH / 2 - fsTop), sv(fsLeft), sv(outerH - fsTop - fsBottom));
            ctx.strokeRect(tx(-outerW / 2), ty(outerH / 2 - fsTop), sv(fsLeft), sv(outerH - fsTop - fsBottom));

            // Right border
            ctx.fillRect(tx(outerW / 2 - fsRight), ty(outerH / 2 - fsTop), sv(fsRight), sv(outerH - fsTop - fsBottom));
            ctx.strokeRect(tx(outerW / 2 - fsRight), ty(outerH / 2 - fsTop), sv(fsRight), sv(outerH - fsTop - fsBottom));
        }

        var innerX = -outerW / 2 + fsLeft;
        var innerY = outerH / 2 - fsTop;

        ctx.fillStyle = COLORS.mainFill;
        ctx.fillRect(tx(innerX), ty(innerY), sv(w), sv(h));
        ctx.strokeStyle = COLORS.main;
        ctx.lineWidth = isSurface ? 3 : 1.5;
        ctx.strokeRect(tx(innerX), ty(innerY), sv(w), sv(h));

        var accum = 0;
        for (var i = 0; i < layers - 1; i++) {
            accum += heights[i];
            var boardTop = innerY - accum;
            ctx.fillStyle = COLORS.layerBoardFill;
            ctx.fillRect(tx(innerX), ty(boardTop), sv(w), sv(lt));
            ctx.strokeStyle = COLORS.layerBoard;
            ctx.lineWidth = 2;
            ctx.strokeRect(tx(innerX), ty(boardTop), sv(w), sv(lt));
            accum += lt;
        }

        if (params.hasLight) {
            var lightH = 6;
            var boardThick = 1;
            var boardDepth = 10;
            // Top ceiling light board (1mm thick, 1cm deep, 5mm from back)
            ctx.fillStyle = '#555555';
            ctx.fillRect(tx(innerX), ty(innerY - boardThick / 2), sv(w), sv(boardThick));
            // LED strip on top ceiling
            var lightY = innerY - boardThick - lightH / 2;
            ctx.fillStyle = '#ffa726';
            ctx.fillRect(tx(innerX + 4), ty(lightY), sv(w - 8), sv(lightH));
            accum = 0;
            for (var k = 0; k < layers - 1; k++) {
                accum += heights[k] + lt;
                var ly = innerY - accum - lightH / 2;
                ctx.fillStyle = '#ffa726';
                ctx.fillRect(tx(innerX + 4), ty(ly), sv(w - 8), sv(lightH));
            }
        }

        var dimOff = 35 * PIXELS_PER_MM;

        ctx.strokeStyle = '#cc3333';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#cc3333';
        ctx.font = 'bold ' + fontSize + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        if (!isSurface) {
            var yTop = ty(outerH / 2) - dimOff;
            ctx.beginPath();
            ctx.moveTo(tx(-outerW / 2), yTop);
            ctx.lineTo(tx(outerW / 2), yTop);
            ctx.moveTo(tx(-outerW / 2), ty(outerH / 2));
            ctx.lineTo(tx(-outerW / 2), yTop);
            ctx.moveTo(tx(outerW / 2), ty(outerH / 2));
            ctx.lineTo(tx(outerW / 2), yTop);
            ctx.stroke();
            ctx.fillText(outerW, (tx(-outerW / 2) + tx(outerW / 2)) / 2, yTop - 4);

            var xRight = tx(outerW / 2) + dimOff;
            ctx.beginPath();
            ctx.moveTo(xRight, ty(outerH / 2));
            ctx.lineTo(xRight, ty(-outerH / 2));
            ctx.moveTo(tx(outerW / 2), ty(outerH / 2));
            ctx.lineTo(xRight, ty(outerH / 2));
            ctx.moveTo(tx(outerW / 2), ty(-outerH / 2));
            ctx.lineTo(xRight, ty(-outerH / 2));
            ctx.stroke();
            ctx.save();
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.translate(xRight + 12, (ty(outerH / 2) + ty(-outerH / 2)) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(outerH, 0, 0);
            ctx.restore();
        }

        var yBot = ty(-outerH / 2) + dimOff;
        var xLeft = tx(-outerW / 2) - dimOff;

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        if (mode === 'separate') {
            ctx.beginPath();
            ctx.moveTo(xLeft, ty(outerH / 2));
            ctx.lineTo(xLeft, ty(innerY));
            ctx.moveTo(tx(-outerW / 2), ty(outerH / 2));
            ctx.lineTo(xLeft, ty(outerH / 2));
            ctx.moveTo(tx(-outerW / 2), ty(innerY));
            ctx.lineTo(xLeft, ty(innerY));
            ctx.stroke();
            ctx.save();
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.translate(xLeft - 8, (ty(outerH / 2) + ty(innerY)) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(fsTop, 0, 0);
            ctx.restore();

            ctx.beginPath();
            ctx.moveTo(xLeft, ty(innerY));
            ctx.lineTo(xLeft, ty(innerY - h));
            ctx.moveTo(tx(innerX), ty(innerY));
            ctx.lineTo(xLeft, ty(innerY));
            ctx.moveTo(tx(innerX), ty(innerY - h));
            ctx.lineTo(xLeft, ty(innerY - h));
            ctx.stroke();
            ctx.save();
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.translate(xLeft - 8, (ty(innerY) + ty(innerY - h)) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(h, 0, 0);
            ctx.restore();

            ctx.beginPath();
            ctx.moveTo(xLeft, ty(innerY - h));
            ctx.lineTo(xLeft, ty(-outerH / 2));
            ctx.moveTo(tx(-outerW / 2), ty(innerY - h));
            ctx.lineTo(xLeft, ty(innerY - h));
            ctx.moveTo(tx(-outerW / 2), ty(-outerH / 2));
            ctx.lineTo(xLeft, ty(-outerH / 2));
            ctx.stroke();
            ctx.save();
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.translate(xLeft - 8, (ty(innerY - h) + ty(-outerH / 2)) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(fsBottom, 0, 0);
            ctx.restore();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            ctx.beginPath();
            ctx.moveTo(tx(-outerW / 2), yBot);
            ctx.lineTo(tx(innerX), yBot);
            ctx.moveTo(tx(-outerW / 2), ty(-outerH / 2));
            ctx.lineTo(tx(-outerW / 2), yBot);
            ctx.moveTo(tx(innerX), ty(innerY - h));
            ctx.lineTo(tx(innerX), yBot);
            ctx.stroke();
            ctx.fillText(fsLeft, (tx(-outerW / 2) + tx(innerX)) / 2, yBot + 6);

            ctx.beginPath();
            ctx.moveTo(tx(innerX), yBot);
            ctx.lineTo(tx(innerX + w), yBot);
            ctx.moveTo(tx(innerX), ty(innerY - h));
            ctx.lineTo(tx(innerX), yBot);
            ctx.moveTo(tx(innerX + w), ty(innerY - h));
            ctx.lineTo(tx(innerX + w), yBot);
            ctx.stroke();
            ctx.fillText(w, (tx(innerX) + tx(innerX + w)) / 2, yBot + 6);

            ctx.beginPath();
            ctx.moveTo(tx(innerX + w), yBot);
            ctx.lineTo(tx(outerW / 2), yBot);
            ctx.moveTo(tx(innerX + w), ty(innerY - h));
            ctx.lineTo(tx(innerX + w), yBot);
            ctx.moveTo(tx(outerW / 2), ty(-outerH / 2));
            ctx.lineTo(tx(outerW / 2), yBot);
            ctx.stroke();
            ctx.fillText(fsRight, (tx(innerX + w) + tx(outerW / 2)) / 2, yBot + 6);
        } else {
            ctx.beginPath();
            ctx.moveTo(xLeft, ty(innerY));
            ctx.lineTo(xLeft, ty(innerY - h));
            ctx.moveTo(tx(innerX), ty(innerY));
            ctx.lineTo(xLeft, ty(innerY));
            ctx.moveTo(tx(innerX), ty(innerY - h));
            ctx.lineTo(xLeft, ty(innerY - h));
            ctx.stroke();
            ctx.save();
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.translate(xLeft - 8, (ty(innerY) + ty(innerY - h)) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(h, 0, 0);
            ctx.restore();

            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            ctx.beginPath();
            ctx.moveTo(tx(innerX), yBot);
            ctx.lineTo(tx(innerX + w), yBot);
            ctx.moveTo(tx(innerX), ty(innerY - h));
            ctx.lineTo(tx(innerX), yBot);
            ctx.moveTo(tx(innerX + w), ty(innerY - h));
            ctx.lineTo(tx(innerX + w), yBot);
            ctx.stroke();
            ctx.fillText(w, (tx(innerX) + tx(innerX + w)) / 2, yBot + 6);
        }

        accum = 0;
        for (var j = 0; j < layers; j++) {
            var layerH = heights[j] || 0;
            var topY = innerY - accum;
            var midY = topY - layerH / 2;
            ctx.fillText('层高: ' + layerH, tx(innerX + w / 2), ty(midY) + 6);
            accum += layerH;
            if (j < layers - 1) accum += lt;
        }
    }

    function drawSideViewFixed(ctx, params, areaX, areaY, areaW, areaH, padTop, padBottom, padLeft, padRight, dimSpace, fontSize) {
        var h = params.totalHeight;
        var d = params.depth;
        var fs = params.outerFrameSize;
        var fd = params.outerFrameDepth;
        var layers = params.layers;
        var lt = params.layerThickness;
        var heights = params.layerHeights || [];
        var wallThick = 1;
        var isSurface = params.type === 'surface';
        var mode = params.outerFrameMode || 'uniform';

        var fsTop = mode === 'separate' ? (params.outerFrameTop || 0) : fs;
        var fsBottom = mode === 'separate' ? (params.outerFrameBottom || 0) : fs;
        var fsLeft = mode === 'separate' ? (params.outerFrameLeft || 0) : fs;
        var fsRight = mode === 'separate' ? (params.outerFrameRight || 0) : fs;
        var fdTop = mode === 'separate' ? (params.outerFrameTopDepth || 0) : fd;
        var fdBottom = mode === 'separate' ? (params.outerFrameBottomDepth || 0) : fd;
        var fdLeft = mode === 'separate' ? (params.outerFrameLeftDepth || 0) : fd;
        var fdRight = mode === 'separate' ? (params.outerFrameRightDepth || 0) : fd;

        var outerH = h + fsTop + fsBottom;
        var maxDepth = Math.max(d, fdTop, fdBottom, fdLeft, fdRight);

        var drawX = areaX + padLeft * PIXELS_PER_MM;
        var drawY = areaY + padTop * PIXELS_PER_MM;
        var drawW = areaW - (padLeft + padRight) * PIXELS_PER_MM;
        var drawH = areaH - (padTop + padBottom) * PIXELS_PER_MM;

        var offsetX = drawX;
        var offsetY = drawY;

        function tx(x) { return offsetX + x * PIXELS_PER_MM; }
        function ty(y) { return offsetY + (outerH / 2 - y) * PIXELS_PER_MM; }
        function sv(v) { return v * PIXELS_PER_MM; }

        ctx.fillStyle = COLORS.mainFill;
        ctx.fillRect(tx(0), ty(h / 2), sv(d), sv(h));
        ctx.strokeStyle = COLORS.main;
        ctx.lineWidth = isSurface ? 3 : 1.5;
        ctx.strokeRect(tx(0), ty(h / 2), sv(d), sv(h));

        if (!isSurface) {
            ctx.fillStyle = COLORS.frameFill;
            ctx.strokeStyle = COLORS.frame;
            ctx.lineWidth = 1.5;
            ctx.fillRect(tx(0), ty(h / 2 + fsTop), sv(wallThick), sv(fsTop));
            ctx.strokeRect(tx(0), ty(h / 2 + fsTop), sv(wallThick), sv(fsTop));
            ctx.fillRect(tx(0), ty(h / 2 + fsTop), sv(fdTop), sv(wallThick));
            ctx.strokeRect(tx(0), ty(h / 2 + fsTop), sv(fdTop), sv(wallThick));

            ctx.fillStyle = COLORS.frameFill;
            ctx.strokeStyle = COLORS.frame;
            ctx.fillRect(tx(0), ty(-h / 2), sv(wallThick), sv(fsBottom));
            ctx.strokeRect(tx(0), ty(-h / 2), sv(wallThick), sv(fsBottom));
            ctx.fillRect(tx(0), ty(-h / 2 - fsBottom + wallThick), sv(fdBottom), sv(wallThick));
            ctx.strokeRect(tx(0), ty(-h / 2 - fsBottom + wallThick), sv(fdBottom), sv(wallThick));
        }

        var innerY = h / 2 - fsTop;
        var accum = 0;
        for (var j = 0; j < layers - 1; j++) {
            accum += heights[j];
            var ly = innerY - accum;
            ctx.fillStyle = COLORS.layerBoardFill;
            ctx.fillRect(tx(0), ty(ly), sv(d), sv(lt));
            ctx.strokeStyle = COLORS.layerBoard;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(tx(0), ty(ly), sv(d), sv(lt));
            accum += lt;
        }

        if (!isSurface) {
            var fdY = ty(h / 2 + fsTop) - 18 * PIXELS_PER_MM;
            ctx.strokeStyle = '#cc3333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tx(0), fdY);
            ctx.lineTo(tx(fdTop), fdY);
            ctx.moveTo(tx(0), ty(h / 2 + fsTop));
            ctx.lineTo(tx(0), fdY);
            ctx.moveTo(tx(fdTop), ty(h / 2 + fsTop));
            ctx.lineTo(tx(fdTop), fdY);
            ctx.stroke();
            ctx.fillStyle = '#cc3333';
            ctx.font = 'bold ' + fontSize + 'px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillText(fdTop, tx(fdTop / 2), fdY - 6);

            var dx0 = tx(-12);
            ctx.strokeStyle = '#cc3333';
            ctx.fillStyle = '#cc3333';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(dx0, ty(h / 2 + fsTop));
            ctx.lineTo(dx0, ty(h / 2));
            ctx.moveTo(tx(0), ty(h / 2 + fsTop));
            ctx.lineTo(dx0, ty(h / 2 + fsTop));
            ctx.moveTo(tx(0), ty(h / 2));
            ctx.lineTo(dx0, ty(h / 2));
            ctx.stroke();
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.translate(dx0 - 14, (ty(h / 2 + fsTop) + ty(h / 2)) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.font = 'bold ' + fontSize + 'px "Microsoft YaHei", sans-serif';
            ctx.fillText(fsTop, 0, 0);
            ctx.restore();
        }

        var midY = ty(0);
        var dDimY = midY + 18 * PIXELS_PER_MM;
        ctx.strokeStyle = '#cc3333';
        ctx.lineWidth = 2;
        drawDimH(ctx, tx(0), dDimY, tx(d), dDimY);
        ctx.fillStyle = '#cc3333';
        ctx.font = 'bold ' + fontSize + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(d, tx(d / 2), dDimY + 20);
    }

    function drawDimH(ctx, x1, dimY, x2, dimY2, extY) {
        ctx.beginPath();
        ctx.moveTo(x1, dimY);
        ctx.lineTo(x2, dimY2);
        if (extY !== undefined) {
            ctx.moveTo(x1, extY);
            ctx.lineTo(x1, dimY);
            ctx.moveTo(x2, extY);
            ctx.lineTo(x2, dimY2);
        }
        ctx.moveTo(x1, dimY - 4);
        ctx.lineTo(x1, dimY + 4);
        ctx.moveTo(x2, dimY2 - 4);
        ctx.lineTo(x2, dimY2 + 4);
        ctx.stroke();
    }

    function drawDimV(ctx, x, y1, x2, y2, extX) {
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x2, y2);
        if (extX !== undefined) {
            ctx.moveTo(extX, y1);
            ctx.lineTo(x, y1);
            ctx.moveTo(extX, y2);
            ctx.lineTo(x2, y2);
        }
        ctx.moveTo(x - 4, y1);
        ctx.lineTo(x + 4, y1);
        ctx.moveTo(x2 - 4, y2);
        ctx.lineTo(x2 + 4, y2);
        ctx.stroke();
    }

    function drawInfoPanel(ctx, params, x, y, fontSize) {
        var w = params.width;
        var h = params.totalHeight;
        var d = params.depth;
        var fs = params.outerFrameSize;
        var mode = params.outerFrameMode || 'uniform';
        var fsTop = mode === 'separate' ? (params.outerFrameTop || 0) : fs;
        var fsBottom = mode === 'separate' ? (params.outerFrameBottom || 0) : fs;
        var fsLeft = mode === 'separate' ? (params.outerFrameLeft || 0) : fs;
        var fsRight = mode === 'separate' ? (params.outerFrameRight || 0) : fs;
        var outerW = w + fsLeft + fsRight;
        var outerH = h + fsTop + fsBottom;
        var isSurface = params.type === 'surface';

        var lineH = fontSize * 1.8;
        var startX = x;
        var startY = y;

        ctx.fillStyle = COLORS.infoText;
        ctx.font = 'bold ' + fontSize + 'px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';

        var items = [];
        if (!isSurface) {
            items.push('外框尺寸（包含折边）：' + outerH + ' X ' + outerW);
        }
        items.push('内框尺寸（不包含折边）：' + h + ' X ' + w);
        items.push('深度：' + d);
        if (params.showDrawingNo && params.drawingNo) {
            items.push('编号：' + params.drawingNo);
        }
        if (params.showColor && params.color) {
            items.push('颜色：' + params.color);
        }
        if (params.showHasLight) {
            items.push('是否带灯：' + (params.hasLight ? '是' : '否'));
        }
        if (params.showDate && params.date) {
            items.push('日期：' + params.date);
        }
        if (params.showRemark && params.remark) {
            items.push('备注：' + params.remark);
        }

        for (var i = 0; i < items.length; i++) {
            ctx.fillText(items[i], startX, startY + i * lineH);
        }
    }

    return {
        init: init,
        drawCombined: drawCombined
    };
})();
