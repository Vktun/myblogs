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
        , sqw = 16
        , isDarg = false, isDarging = false
        , imgRedSrc = "image/maps2.png"
        , imgGreenSrc = "image/maps1.png"
        , imgYellowSrc = "image/maps3.png"

    canvas = document.getElementById("mapCanvas");
    context = canvas.getContext("2d");
    canvas.width = document.documentElement.clientWidth * 0.8;
    canvas.height = document.documentElement.clientHeight * 0.8;
    imgView = { x: 0, y: 0 };//图像起始点
    scaleObj = document.getElementById("scaleCanvas") || {};
    scale = scaleObj.value || 1;
    maxScale = 1.6;
    minScale = 0.4;
    scaleStep = 0.4;


    loadImage();
    function loadImage() {
        image = new Image();
        image.src = "image/Backmap.jpg";
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
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, image.width, image.height, imgView.x, imgView.y, image.width * scale, image.height * scale);
        drawAmmetersUseImage();
    }


    /**
     * 鼠标在屏幕的坐标
     * @param event
     * @returns {{x: Number, y: Number}}
     */
    var mousePoint = function (event) {
        var e = event || window.event;
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
     * 画布放大缩小后的坐标比例
     */
    var scalePoint = function () {

    }


    /**
     * 判断是否在这个区域
     * @param circle 区域坐标
     * @param mocp 鼠标坐标
     * @returns {boolean}
     */
    var isInArea = function (circle, mocp, isSq) {

        var distx = parseInt((circle.x * scale + imgView.x) - (mocp.x * scale + imgView.x));
        var disty = parseInt((circle.y * scale + imgView.y) - (mocp.y * scale + imgView.y));

        var dist = Math.ceil(Math.sqrt(distx * distx + disty * disty));
        if (isSq == true) {
            //计算方形的中心点
            if (parseInt(dist) <= sqw) {
                return true;
            }
        } else {
            // 圆
            if (parseInt(dist) <= radius) {

                return true;
            }
        }
        return false;
    }
    var timer;
    /**
     * 利用图片作为标注点
     */
    function drawAmmetersUseImage() {
        for (var i = 0; i < ammeterinfo.length; i++) {
            var tt = ammeterinfo[i];
            circles.push({ x: tt.x, y: tt.y, radius: radius, id: tt.id })
            var point = { x: ((tt.x - sqw) * scale + imgView.x), y: ((tt.y - sqw) * scale + imgView.y), id: tt.id };
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
            timer = setInterval(warning, 3000);
        }

    }

    /**
     * 画出单个标注
     * @param mousP 坐标点
     * @param colors 颜色，不输入0为黄色，2、红色，1、绿色，
     */
    function drawSingleAmmeterImage(point, colors) {
        var id = point.id || 0;
        var img = new Image();
        img.src = imgYellowSrc;
        //正常
        if (colors && colors == 1) {
            img.src = imgGreenSrc;
        }
        //不正常
        if (colors && colors == 2) {
            img.src = imgRedSrc;
        }

        img.onload = function () {
            context.drawImage(img, point.x, point.y);
            context.fillStyle = "#fff";
            context.strokeStyle = "#0f0";
            context.fillText(id, point.x + sqw, point.y + sqw)
        }
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
            imgView.x -= downMouse.x - moveMouse.x;
            imgView.y -= downMouse.y - moveMouse.y;
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

    }

    /**
     * range 上的点击事件
     * 为啥这个范围控制的有问题呢- -！！
     */
    scaleObj.onclick = function () {
        if (scale != this.value) {
            scale = this.value;
            drawImg();
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
        if (event.wheelDelta > 0) {
            scale = scale * 1 + scaleStep * 1;
            if (isScale) {
                scaleObj.value = scale;
                var mouse = mouseOnCanvasPoint(event);

                //imgView.x = imgView.x-Math.abs(image.width*(scale-1)/2) ;
                //imgView.y = imgView.y-Math.abs(image.height*(scale-1)/2) ;
                imgView.x = mouse.x - Math.abs(((mouse.x - imgView.x) / image.width) * Math.abs(image.width * (scale - 1))) - Math.abs(mouse.x - imgView.x);
                imgView.y = mouse.y - Math.abs(((mouse.y - imgView.y) / image.width) * Math.abs(image.width * (scale - 1))) - Math.abs(mouse.y - imgView.y);
                drawImg();
            }
        } else {
            scale = scale * 1 - scaleStep * 1;
            if (isScale) {
                scaleObj.value = scale;
                var mouse = mouseOnCanvasPoint(event);
                imgView.x = mouse.x + Math.abs(((mouse.x - imgView.x) / image.width) * Math.abs(image.width * (scale - 1))) - Math.abs(mouse.x - imgView.x);
                imgView.y = mouse.y + Math.abs(((mouse.y - imgView.y) / image.width) * Math.abs(image.width * (scale - 1))) - Math.abs(mouse.y - imgView.y);
                drawImg();
            }

        }
        stopBubble(event);
    }


    /**
     * 设置尺子的位置
     * @param directions 方向/位置
     */
    function setRanger(directions) {
        scaleObj.style.top = (canvas.height - 20) + "px";
        scaleObj.style.left = (canvas.width - 250) + "px";
        scaleObj.style.position = "absolute";

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
