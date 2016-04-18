/**
 * Created by vktun on 2016/3/31.
 * Description:
 *
 */

(function () {
    var canvas, context//画布
        , image, imgView//图片对象
        , scale, maxScale, minScale, scaleObj, scaleStep//放大倍数
        , warningArray = []
        , circles = []//电表数组
        , radius = 10//电表画圆的半径
        , sqw = 16, dragOffset = { x: 0, y: 0 }
        , isDarg = false, isDarging = false
        , imgRedSrc = "image/maps2.png"
        , imgGreenSrc = "image/maps1.png"
        , imgYellowSrc = "image/maps3.png"

    canvas = document.getElementById("mapCanvas");
    context = canvas.getContext("2d");
    canvas.width = document.documentElement.clientWidth - 20;
    canvas.height = document.documentElement.clientHeight - 20;
    imgView = { x: 0, y: 0 };//图像起始点
    scaleObj = document.getElementById("scaleCanvas") || {};
    scale = scaleObj.value || 0.8;
    maxScale = 2;
    minScale = 0.4;
    scaleStep = 0.2;


    loadImage();
    function loadImage() {
        image = new Image();
        image.src = "image/background.jpg";
        image.onload = function () {
            drawImg();
            setTimeout(setRanger(), 1000);
        }
    }

    /**
     * 画图
     */
    function drawImg() {
        warningArray = [];
        circles = [];
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, image.width, image.height, imgView.x + dragOffset.x * scale,
            imgView.y + dragOffset.y * scale, image.width * scale, image.height * scale);

        drawAmmetersUseImage();
    }
    /**
     * 鼠标在屏幕的坐标
     * @param event
     * @returns {{x: Number, y: Number}}
     */
    var mousePoint = function (event) {
        var e = event || window.event || arguments.callee.caller.arguments[0];
        return { x: e.clientX, y: e.clientY };
    }
    /**
     * 鼠标在canvas上的坐标 mocp 1:1情况下
     * @returns {{x: number, y: number}}
     */
    var mouseOnCanvasPoint = function (e) {

        var bbox = canvas.getBoundingClientRect();
        var mp = mousePoint(e);
        return {
            x: mp.x - bbox.left * (canvas.width / bbox.width),
            y: mp.y - bbox.top * (canvas.height / bbox.height)
        }
    }
    /**
     * 判断是否在这个区域
     * @param circle 区域坐标
     * @param mocp 鼠标坐标
     * @returns {boolean}
     */
    var isInArea = function (circle, mocp, isSq) {

        var distx = parseInt((circle.x * scale + imgView.x + dragOffset.x * scale) - mocp.x);
        var disty = parseInt((circle.y * scale + imgView.y + dragOffset.y * scale) - mocp.y);
        var dist = Math.ceil(Math.sqrt(distx * distx + disty * disty));
        return parseInt(dist) <= sqw;
    }
    var timer;
    /**
     * 利用图片作为标注点
     */
    function drawAmmetersUseImage(e) {
        for (var i = 0; i < ammeterinfo.length; i++) {
            var tt = ammeterinfo[i];
            circles.push({ x: tt.x, y: tt.y, radius: radius, id: tt.id })
            var point = {
                x: ((tt.x - sqw) * scale + imgView.x + dragOffset.x * scale),
                y: ((tt.y - sqw) * scale + imgView.y + dragOffset.y * scale), id: tt.id
            };
            if (tt.status == 0) {//异常状态的设备
                drawSingleAmmeterImage(point, 1);
                warningArray.push(point);

            } else {//正常状态的设备
                drawSingleAmmeterImage(point, 2)
            }
        }
        if (timer) {
            clearInterval(timer)
        }
        if (!isDarging) {
            timer = setInterval(warning, 1000);
        }

    }
    //画圆-buyongle 
    function drawCircle(point, e) {

        context.beginPath();
        context.fillStyle = "rgba(0,0,0,0)";
        context.arc(point.x + sqw, point.y + sqw, sqw, 0, Math.PI * 2, true);
        context.fill();

        var mocp = mouseOnCanvasPoint(e);
        if (context.isPointInPath(mocp.x, mocp.y)) {
            viewDetail(mocp);
        }
        else {
            var detailDiv = document.getElementById("viewMeterInfo");
            detailDiv.style.display = "none";
        }
    }
    /**
     * 画出单个标注
     * @param mousP 坐标点
     * @param colors 颜色，不输入0为黄色，2、红色，1、绿色，
     */
    function drawSingleAmmeterImage(point, colors) {
        var img = new Image();
        img.src = imgYellowSrc;
        colors = colors || 0;
        switch (parseInt(colors)) {
            case 1:
                img.src = imgGreenSrc;
                break;
            case 2:
                img.src = imgRedSrc;
                break;
        }
        if (img.complete) {
            drawImgLable(img, point)
        } else {
            img.onload = function () {
                drawImgLable(img, point)
            }
        }

    }
    /**
     * 画图标注点
     */
    function drawImgLable(img, point) {
        var id = point.id || 0;
        context.drawImage(img, point.x, point.y);
        context.fillStyle = "#fff";
        context.strokeStyle = "#0f0";
        context.fillText(id, point.x + sqw, point.y + sqw)
    }

    /**
     * 设备报警
     */
    var flag = 0;

    function warning() {
        if (warningArray && warningArray.length > 0) {
            if (flag == 1) {
                for (var i in warningArray) {
                    drawSingleAmmeterImage(warningArray[i], 1)
                }
                flag = 0;
            } else {
                for (var i in warningArray) {
                    drawSingleAmmeterImage(warningArray[i], 0)
                }
                flag = 1;
            }

        }
    }

    /**
     * canvas上的鼠标移动事件
     */
    canvas.onmousedown = function (e) {
        /**
         * 点击鼠标时的坐标
         * @type {{x, y}}
         */
        var downMouse = mouseOnCanvasPoint(e);
        canvas.onmousemove = function (ev) {
            isDarging = true;
            canvas.style.cursor = "move";
            /**
             * 鼠标移动时的坐标
             * @type {{x, y}}
             */
            var moveMouse = mouseOnCanvasPoint(ev);
            dragOffset.x -= downMouse.x - moveMouse.x;
            dragOffset.y -= downMouse.y - moveMouse.y;
            downMouse = moveMouse;
            drawImg();
        }
        canvas.onmouseup = function () {
            canvas.onmousemove = null;
            canvas.onmouseup = null;
            canvas.style.cursor = "default";
            isDarging = false;
        }
    }
    /**
     * 鼠标单击事件，显示当前信息
     * @param e 
     */
    canvas.onclick = function (e) {
        var mouse = mouseOnCanvasPoint(e);
        for (var i = 0; i < circles.length; i++) {
            var circle = circles[i];
            if (isInArea(circle, mouse, true)) {
                viewDetail(mouse);
                break;
            } else {
                var detailDiv = document.getElementById("viewMeterInfo");
                detailDiv.style.display = "none";
            }
        }

    }

    /**
     * 鼠标悬浮，显示坐标详情
     * @param mousexy
     */
    function viewDetail(mousexy) {
        var detailDiv = document.getElementById("viewMeterInfo");
        detailDiv.style.top = mousexy.y + "px";
        detailDiv.style.left = mousexy.x + "px";
        detailDiv.style.display = "block";
        setTimeout(function () {
            detailDiv.style.display = "none";
        }, 5000);
    }

    /**
     * range 上的点击事件
     * 为啥这个范围控制的有问题呢- -！！
     */
    scaleObj.onclick = function (e) {
        if (scale != this.value) {
            scale = this.value;
            drawImg(e);
        }
    }
    //scaleObj.onmousedown = function () {
    //    scaleObj.onmousemove = function () {
    //        scale = this.value;
    //        //if (scale >= minScale && scale <= maxScale) {
    //        drawImg();
    //        //}
    //    }
    //    scaleObj.onmouseup = function () {
    //        scaleObj.onmouseup = null;
    //        scaleObj.onmousemove = null;
    //    }
    //}

    /**
     * 鼠标缩放大小
     * @type {Function}
     */
    canvas.onmousewheel = canvas.onwheel = function (event) {

        event.wheelDelta = event.wheelDelta ? event.wheelDelta : (event.deltaY * (-40));
        var isScale = Math.abs(scale) >= minScale && Math.abs(scale) <= maxScale;
        scale = event.wheelDelta > 0 ? scale * 1 + scaleStep * 1 : scale * 1 - scaleStep * 1;
        if (isScale) {
            scaleObj.value = scale;
            var mouse = mouseOnCanvasPoint(event);
            imgView.x = mouse.x * (1 - scale);
            imgView.y = mouse.y * (1 - scale);
            drawImg();
        }
        stopBubble(event);
    }
    canvas.oumouseout = function () {
        canvas.onmousemove = null;
        canvas.onmouseup = null;
    }

    /**
     * 设置尺子的位置
     * @param directions 方向/位置
     */
    function setRanger(directions) {
        var pdiv = scaleObj.parentNode;
        pdiv.style.bottom = "20px";
        pdiv.style.right = "160px";
        pdiv.style.position = "absolute";
    }

    /**
     * 标注按钮事件
     */
    document.getElementById("markLable").onclick = function () {
        canvas.style.cursor = "url('image/maps1.png'),auto";
        canvas.addEventListener("click", viewInfo)
    }
    /**
     * 标注按钮点击操作
     * @param e
     */
    function viewInfo(e) {
        var markDiv = document.getElementById("markMeterInfo");
        var mouse = mouseOnCanvasPoint(e);
        markDiv.style.left = (mouse.x - 96) + "px";
        markDiv.style.top = (mouse.y - 220) + "px";
        markDiv.style.display = "block";
        mouse.x = mouse.x - sqw;
        mouse.y = mouse.y - sqw;
        drawSingleAmmeterImage(mouse);

        var saveLable = document.getElementById("saveL");
        var delLable = document.getElementById("delL");
        saveLable.addEventListener("click", savel)
        delLable.addEventListener("click", dell);

    }

    /**
     * 保存坐标
     * ajax 保存到数据库中
     * 如果成功，
     */
    function savel() {


    }

    /**
     * 删除坐标
     */
    function dell() {
        var markDiv = document.getElementById("markMeterInfo");
        markDiv.style.display = "none";

        //一次只能标注一个点
        canvas.removeEventListener("click", viewInfo);
    }

    /**
     * 阻止事件冒泡
     * @param e
     */
    function stopBubble(e) {
        e = e || window.event;
        if (e.preventDefault) {
            e.preventDefault();
        } else {
            e.returnValue = false;
        }

        if (e && e.stopPropagation)
            e.stopPropagation();
        else
            window.event.cancelBubble = true;
    }
}).call(this)
