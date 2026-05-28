var Model3D = (function() {
    'use strict';

    var COLORS = {
        matteBlack:  { color: 0x18181a, roughness: 1.0, metalness: 0.0 },
        gunmetal:    { color: 0x2e2e30, roughness: 1.0, metalness: 0.0 },
        creamWhite:  { color: 0xd4ceb0, roughness: 1.0, metalness: 0.0 },
        pureWhite:   { color: 0xd0cdc4, roughness: 1.0, metalness: 0.0 }
    };

    var DEBUG_COLORS = {
        top:    0xff0000,   // 红色 - 上外框
        bottom: 0x00ff00,   // 绿色 - 下外框
        left:   0x0000ff,   // 蓝色 - 左外框
        right:  0xffaa00,   // 橙色 - 右外框
        back:   0xff00ff,   // 紫色 - 背板
        topWall:    0x00ffff,   // 青色 - 内框顶板
        bottomWall: 0xffff00,   // 黄色 - 内框底板
        leftWall:   0xff8800,   // 深橙 - 内框左板
        rightWall:  0x8800ff,   // 紫蓝 - 内框右板
        layerBoard: 0x00ff88    // 翠绿 - 层板
    };

    function Model3D(containerId) {
        this.currentColor = 'matteBlack';
        this.container = document.getElementById(containerId);
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xd5d8dc);
        this.pointLights = [];

        var cw = this.container.clientWidth || 600;
        var ch = this.container.clientHeight || 400;
        var aspect = cw / Math.max(ch, 1);

        this.camera = new THREE.PerspectiveCamera(40, aspect, 5, 10000);
        this.camera.position.set(500, 350, 700);
        this.camera.lookAt(0, 0, -150);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(cw, ch);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.target.set(0, 0, -150);
        this.controls.update();

        var ambient = new THREE.AmbientLight(0xffffff, 0.7);
        this.scene.add(ambient);

        var dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
        dirLight1.position.set(500, 800, 600);
        this.scene.add(dirLight1);

        var dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight2.position.set(-400, 200, -400);
        this.scene.add(dirLight2);

        var dirLight3 = new THREE.DirectionalLight(0xffffff, 0.4);
        dirLight3.position.set(0, -100, 500);
        this.scene.add(dirLight3);

        this.innerBoxGroup = new THREE.Group();
        this.frameGroup = new THREE.Group();
        this.layerGroup = new THREE.Group();
        this.scene.add(this.innerBoxGroup);
        this.scene.add(this.frameGroup);
        this.scene.add(this.layerGroup);

        var self = this;
        window.addEventListener('resize', function() { self.onResize(); });
        this.animate();
    }

    Model3D.prototype.update = function(params) {
        clearGroup(this.innerBoxGroup);
        clearGroup(this.frameGroup);
        clearGroup(this.layerGroup);

        var iw = params.width;
        var ih = params.totalHeight;
        var d = params.depth;
        var fs = params.outerFrameSize;
        var fd = params.outerFrameDepth;
        var layers = params.layers;
        var lt = params.layerThickness;
        var heights = params.layerHeights || [];
        var wallThick = 1;
        var mode = params.outerFrameMode || 'uniform';
        var isSurface = params.type === 'surface';

        var fsTop = mode === 'separate' ? (params.outerFrameTop || 0) : fs;
        var fsBottom = mode === 'separate' ? (params.outerFrameBottom || 0) : fs;
        var fsLeft = mode === 'separate' ? (params.outerFrameLeft || 0) : fs;
        var fsRight = mode === 'separate' ? (params.outerFrameRight || 0) : fs;
        var fdTop = mode === 'separate' ? (params.outerFrameTopDepth || 0) : fd;
        var fdBottom = mode === 'separate' ? (params.outerFrameBottomDepth || 0) : fd;
        var fdLeft = mode === 'separate' ? (params.outerFrameLeftDepth || 0) : fd;
        var fdRight = mode === 'separate' ? (params.outerFrameRightDepth || 0) : fd;

        var outerW = iw + fsLeft + fsRight;
        var outerH = ih + fsTop + fsBottom;
        // 明装壁龛的墙壁厚度为10MM，嵌入式为2MM
        var innerWallThick = isSurface ? 10 : 2;

        var cc = COLORS[this.currentColor] || COLORS.matteBlack;
        var mainMat = new THREE.MeshStandardMaterial({ color: cc.color, roughness: cc.roughness, metalness: cc.metalness });

        function makeBox(w, h, d, x, y, z, mat) {
            var geo = new THREE.BoxGeometry(w, h, d);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            return mesh;
        }

        function makeFrameBox(w, h, d, x, y, z, mat) {
            var geo = new THREE.BoxGeometry(w, h, d);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            var edgeGeo = new THREE.EdgesGeometry(geo);
            var edgeMat = new THREE.LineBasicMaterial({ color: 0x333333 });
            mesh.add(new THREE.LineSegments(edgeGeo, edgeMat));
            return mesh;
        }

        // Inner box (5 walls, open front) - each with different debug color
        var backMat = new THREE.MeshStandardMaterial({ color: DEBUG_COLORS.back, roughness: 0.5, metalness: 0.0 });
        var topWallMat = new THREE.MeshStandardMaterial({ color: DEBUG_COLORS.topWall, roughness: 0.5, metalness: 0.0 });
        var bottomWallMat = new THREE.MeshStandardMaterial({ color: DEBUG_COLORS.bottomWall, roughness: 0.5, metalness: 0.0 });
        var leftWallMat = new THREE.MeshStandardMaterial({ color: DEBUG_COLORS.leftWall, roughness: 0.5, metalness: 0.0 });
        var rightWallMat = new THREE.MeshStandardMaterial({ color: DEBUG_COLORS.rightWall, roughness: 0.5, metalness: 0.0 });

        this.innerBoxGroup.add(makeBox(iw, ih, innerWallThick, 0, 0, -d / 2, backMat));
        this.innerBoxGroup.add(makeBox(iw, innerWallThick, d, 0, ih / 2, 0, topWallMat));
        this.innerBoxGroup.add(makeBox(iw, innerWallThick, d, 0, -ih / 2, 0, bottomWallMat));
        this.innerBoxGroup.add(makeBox(innerWallThick, ih, d, -iw / 2, 0, 0, leftWallMat));
        this.innerBoxGroup.add(makeBox(innerWallThick, ih, d, iw / 2, 0, 0, rightWallMat));

        // 绘制孔洞
        if (params.holes && params.holes.length > 0) {
            var holeMat = new THREE.MeshStandardMaterial({ 
                color: 0xff0000, 
                roughness: 0.5, 
                metalness: 0.0,
                transparent: true,
                opacity: 0.8
            });
            params.holes.forEach(function(hole) {
                var holeMesh;
                if (hole.type === 'circle') {
                    var holeGeo = new THREE.CylinderGeometry(hole.diameter / 2, hole.diameter / 2, innerWallThick + 2, 32);
                    holeMesh = new THREE.Mesh(holeGeo, holeMat);
                } else {
                    var holeGeo = new THREE.BoxGeometry(hole.length, hole.width, innerWallThick + 2);
                    holeMesh = new THREE.Mesh(holeGeo, holeMat);
                }
                
                // 根据位置设置孔的位置和旋转
                if (hole.position === 'back') {
                    holeMesh.position.set(hole.offsetX - iw / 2, ih / 2 - hole.offsetY, -d / 2);
                    holeMesh.rotation.x = Math.PI / 2;
                } else if (hole.position === 'top') {
                    holeMesh.position.set(hole.offsetX - iw / 2, ih / 2, -d / 2 + hole.offsetY);
                } else if (hole.position === 'bottom') {
                    holeMesh.position.set(hole.offsetX - iw / 2, -ih / 2, -d / 2 + hole.offsetY);
                } else if (hole.position === 'left') {
                    holeMesh.position.set(-iw / 2, ih / 2 - hole.offsetY, -d / 2 + hole.offsetX);
                    holeMesh.rotation.z = Math.PI / 2;
                } else if (hole.position === 'right') {
                    holeMesh.position.set(iw / 2, ih / 2 - hole.offsetY, -d / 2 + hole.offsetX);
                    holeMesh.rotation.z = Math.PI / 2;
                }
                
                self.innerBoxGroup.add(holeMesh);
            });
        }

        // Layer boards - each with different debug color
        var layerColors = [0x00ff88, 0x00ccff, 0xff66cc, 0xffcc00, 0x66ff00, 0xff6666];
        var accum = 0;
        for (var i = 0; i < layers - 1; i++) {
            var by = ih / 2 - accum - (heights[i] || 0) - lt / 2;
            var boardGeo = new THREE.BoxGeometry(iw, lt, d);
            var layerMat = new THREE.MeshStandardMaterial({ color: layerColors[i % layerColors.length], roughness: 0.5, metalness: 0.0 });
            var boardMesh = new THREE.Mesh(boardGeo, layerMat);
            boardMesh.position.set(0, by, 0);
            this.layerGroup.add(boardMesh);
            accum += (heights[i] || 0) + lt;
        }

        // Light strips - 3000K warm LED strip embedded in shelf underside groove, near back wall
        if (params.hasLight) {
            this.clearLights();
            var warm3000K = 0xffa726;
            var lightMat = new THREE.MeshStandardMaterial({
                color: warm3000K,
                emissive: warm3000K,
                emissiveIntensity: 3.0,
                roughness: 0.2
            });
            var grooveMat = new THREE.MeshStandardMaterial({
                color: 0x0a0a0a,
                roughness: 0.9,
                metalness: 0.0
            });

            // Top ceiling light board: 1mm thick, 1cm deep, same width as inner box, 5mm from back wall
            var topLightBoardMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9, metalness: 0.0 });
            var topLightBoardGeo = new THREE.BoxGeometry(iw, 1, 10);
            var topLightBoard = new THREE.Mesh(topLightBoardGeo, topLightBoardMat);
            topLightBoard.position.set(0, ih / 2 - 0.5, -d / 2 + 5);
            this.layerGroup.add(topLightBoard);

            // Top ceiling: larger groove on underside of top panel, near back
            var ceilingY = ih / 2 - 2;
            var grooveGeoTop = new THREE.BoxGeometry(iw - 4, 4, 6);
            var grooveTop = new THREE.Mesh(grooveGeoTop, grooveMat);
            grooveTop.position.set(0, ceilingY, -d / 2 + 4);
            this.layerGroup.add(grooveTop);

            // Full-length LED strip inside groove
            var stripGeoTop = new THREE.BoxGeometry(iw - 6, 2, 4);
            var stripTop = new THREE.Mesh(stripGeoTop, lightMat);
            stripTop.position.set(0, ceilingY, -d / 2 + 3);
            this.layerGroup.add(stripTop);

            // Ambient lights for top compartment
            var pt0a = new THREE.PointLight(warm3000K, 8, ih * 0.6, 2);
            pt0a.position.set(-iw / 4, ceilingY - 10, -d / 2 + 15);
            this.scene.add(pt0a);
            this.pointLights.push(pt0a);
            var pt0b = new THREE.PointLight(warm3000K, 8, ih * 0.6, 2);
            pt0b.position.set(iw / 4, ceilingY - 10, -d / 2 + 15);
            this.scene.add(pt0b);
            this.pointLights.push(pt0b);

            accum = 0;
            for (var k = 0; k < layers - 1; k++) {
                accum += (heights[k] || 0) + lt;
                var shelfBottom = ih / 2 - accum;
                var compartmentH = heights[k + 1] || 0;

                // Larger groove on underside of shelf, near back wall
                var grooveGeo = new THREE.BoxGeometry(iw - 4, 4, 6);
                var groove = new THREE.Mesh(grooveGeo, grooveMat);
                groove.position.set(0, shelfBottom - 2, -d / 2 + 4);
                this.layerGroup.add(groove);

                // Full-length LED strip inside groove
                var stripGeo = new THREE.BoxGeometry(iw - 6, 2, 4);
                var stripMesh = new THREE.Mesh(stripGeo, lightMat);
                stripMesh.position.set(0, shelfBottom - 2, -d / 2 + 3);
                this.layerGroup.add(stripMesh);

                // Ambient lights for this compartment
                var pta = new THREE.PointLight(warm3000K, 6, compartmentH * 0.8, 2);
                pta.position.set(-iw / 4, shelfBottom - 10, -d / 2 + 15);
                this.scene.add(pta);
                this.pointLights.push(pta);
                var ptb = new THREE.PointLight(warm3000K, 6, compartmentH * 0.8, 2);
                ptb.position.set(iw / 4, shelfBottom - 10, -d / 2 + 15);
                this.scene.add(ptb);
                this.pointLights.push(ptb);
            }
        } else {
            this.clearLights();
        }

        // Outer frame (8 pieces, each with different debug color)
        // 明装壁龛不显示外框
        if (!isSurface && fs > 0) {
            var zFront = d / 2;
            var zTop = d / 2 - fdTop / 2;
            var zBottom = d / 2 - fdBottom / 2;
            var zLeft = d / 2 - fdLeft / 2;
            var zRight = d / 2 - fdRight / 2;

            var topMat = new THREE.MeshStandardMaterial({ color: DEBUG_COLORS.top, roughness: 0.5, metalness: 0.0 });
            var bottomMat = new THREE.MeshStandardMaterial({ color: DEBUG_COLORS.bottom, roughness: 0.5, metalness: 0.0 });
            var leftMat = new THREE.MeshStandardMaterial({ color: DEBUG_COLORS.left, roughness: 0.5, metalness: 0.0 });
            var rightMat = new THREE.MeshStandardMaterial({ color: DEBUG_COLORS.right, roughness: 0.5, metalness: 0.0 });

            // Top frame (width includes left and right frame sizes, height extends to cover top of left/right frames)
            this.frameGroup.add(makeFrameBox(iw + fsLeft + fsRight, fsTop, wallThick, 0, ih / 2 + fsTop / 2, zFront, topMat));
            this.frameGroup.add(makeFrameBox(iw + fsLeft + fsRight, wallThick, fdTop, 0, ih / 2 + fsTop, zTop, topMat));

            // Bottom frame
            this.frameGroup.add(makeFrameBox(iw + fsLeft + fsRight, fsBottom, wallThick, 0, -ih / 2 - fsBottom / 2, zFront, bottomMat));
            this.frameGroup.add(makeFrameBox(iw + fsLeft + fsRight, wallThick, fdBottom, 0, -ih / 2 - fsBottom, zBottom, bottomMat));

            // Left frame (height extends to cover full outer height including top and bottom frames)
            this.frameGroup.add(makeFrameBox(fsLeft, ih + fsTop + fsBottom, wallThick, -iw / 2 - fsLeft / 2, 0, zFront, leftMat));
            this.frameGroup.add(makeFrameBox(wallThick, ih + fsTop + fsBottom, fdLeft, -iw / 2 - fsLeft, 0, zLeft, leftMat));

            // Right frame
            this.frameGroup.add(makeFrameBox(fsRight, ih + fsTop + fsBottom, wallThick, iw / 2 + fsRight / 2, 0, zFront, rightMat));
            this.frameGroup.add(makeFrameBox(wallThick, ih + fsTop + fsBottom, fdRight, iw / 2 + fsRight, 0, zRight, rightMat));
        }

        this.controls.target.set(0, 0, -d / 2);
        this.controls.update();
    };

    Model3D.prototype.setColor = function(colorName, params) {
        if (COLORS[colorName]) {
            this.currentColor = colorName;
            if (params) this.update(params);
        }
    };

    Model3D.prototype.clearLights = function() {
        for (var i = 0; i < this.pointLights.length; i++) {
            this.scene.remove(this.pointLights[i]);
        }
        this.pointLights = [];
    };

    Model3D.prototype.onResize = function() {
        var w = this.container.clientWidth || 600;
        var h = this.container.clientHeight || 400;
        this.camera.aspect = w / Math.max(h, 1);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    };

    Model3D.prototype.animate = function() {
        var self = this;
        requestAnimationFrame(function() { self.animate(); });
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    };

    function clearGroup(group) {
        while (group.children.length > 0) {
            var child = group.children[0];
            if (child.geometry) child.geometry.dispose();
            group.remove(child);
        }
    }

    return Model3D;
})();
