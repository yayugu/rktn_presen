"use strict";

// forked from os0x's "HTML slide" http://jsdo.it/os0x/slide

var taplog = function(x) { console.log(x); return x; };

var scaleCtx = function(ctx, ratioX, ratioY, block) {
  ctx.scale(ratioX, ratioY);
  block();
  ctx.scale(1 / ratioX, 1 / ratioY);
};

var setFont = function(ctx, fontSize, fontName) {
  ctx.font = fontSize + "px " + fontName;
};

var drawTextWithCanvas = function(elem, options, fn) {

  if (options === undefined) options = {};
  // options and each value
  var width = options.width || 300;
  var height = options.height || 300;
  var fontSize = options.fontSize || 16;
  var font = options.font || 'myfont';
  var lineHeight = options.lineHeight || 1.4;
  var leftPadding = options.leftPadding || 5;
  var fillStyle = options.fillStyle || "#FFFFFF";
  
  var lines = $(elem).text().split("\n");

  var mainHeight = (lines.length - 1) * fontSize * lineHeight;
  var canvas = $('<canvas>').attr({
    width: width,
    height: height
  });
  var ctx = canvas[0].getContext('2d');

  // scale canvas scale to 1024*768
  var baseWidth = 1024;
  var baseHeight = 768;
  ctx.scale(width / baseWidth, height / baseHeight);
  width = baseWidth;
  height = baseHeight;

  setFont(ctx, fontSize, font);
  ctx.fillStyle = fillStyle;
  ctx.textBaseline = "middle";
  var charWidth = ctx.measureText('a').width;
  _(lines).each(function(line, i) {
    var y = i * fontSize * lineHeight;
    var yCenter = y + (height - mainHeight) / 2;
    var i;
    var headSpaceWidth;
    var ratio;
    var lineWidth = ctx.measureText(line).width;
    if (lineWidth > width) { // over full
      // keep indent
      i = line.search(/[^ ]/);
      headSpaceWidth = charWidth * i;
      line = line.slice(i);

      // demagnify width
      ratio = (width - headSpaceWidth - leftPadding) / ctx.measureText(line).width;
      scaleCtx(ctx, ratio, 1, function() {
        ctx.fillText(line, (leftPadding + headSpaceWidth) * (1 / ratio), yCenter);
      });
    } else {
      if (lines.length == 1) {
        ratio = _.min([width / lineWidth, height / fontSize]);
        scaleCtx(ctx, ratio, ratio, function() {
          var x = (width - lineWidth * ratio) / 2 / ratio;
          var y =  height / 2 / ratio;
          console.log([x, y]);
          ctx.fillText(line, x, y);
        });
      } else {
        ctx.fillText(line, leftPadding, yCenter);
      }
    }
  });
  $(elem).empty().append(canvas);
};

$(function() {

  var next = function(){
    slides[current++].className = SL;
    slides[current].className = SV;
    location.hash = 'Page'+current;
  };
  var prev = function(){
    slides[current--].className = SR;
    slides[current].className = SV;
    location.hash = 'Page'+current;
  };

  document.body.onclick = function(e){
    var ev = e||window.event;
    var x = ev.clientX;
    if (width*0.95 < x && slides[current+1]){
      //右余白がクリックされたとき
      next();
    } else if (width*0.05 > x && slides[current-1]) {
      //左余白がクリックされたとき
      prev();
    }
  };

  (function() {
    var mousewheel = function(e){
      var Down = -1, Up = 1;
      var ev = e||window.event;
      var dir = ev.wheelDelta || -ev.detail;
      dir = dir < 0 ? Down : Up;
      if (dir === Down && slides[current+1]){
        next();
      } else if (dir === Up && slides[current-1]) {
        prev();
      }
    };
    if (document.body.onmousewheel !== void 0 || window.opera){
      // onmousewheelが使えるか判定(Firefox以外はこちら)
      document.body.onmousewheel = mousewheel;
    } else {
      // 実質Firefox用の処理。onmousewheelをサポートしたら上の処理だけで済むようになるはず
      document.body.addEventListener('DOMMouseScroll', mousewheel, false);
    }
  }());

  document.onkeydown = function(evt){
    var J = 74, K = 75, Left = 37, Right = 39;
    if (!evt) {
      evt = window.event;
    }
    if ((evt.keyCode === K || evt.keyCode === Left) && slides[current-1]){// k
      prev();
      return false;
    } else if ((evt.keyCode === J || evt.keyCode === Right) && slides[current+1]) {// j
      next();
      return false;
    }
  };

  // まずはページ幅取得
  var width = document.documentElement.clientWidth;
  var height = document.documentElement.clientHeight;
  document.body.className = 'slidemode';
  // フォントサイズ調整
  document.body.style.fontSize = width / 5 + '%';

  var SV = 'slide view';
  var SR = 'slide right';
  var SL = 'slide left';
  var root = $('<div id="slide">');
  var slides = $('.slides')[0].innerHTML.trim().split("\n\n");
  slides = _(slides).map(function(text) {
    var s = $('<div>').attr('class', SR);
    s[0].innerHTML = text;
    root.append(s);
    return s[0];
  });
  $('#slide').replaceWith(root);

  //現在のページ
  var current = 0;
  var count = slides.length;

  _(slides).each(function(slide) {
    drawTextWithCanvas(slide, {
      width: width * 0.88,
      height: height * 0.88,
      fontSize: width / 10,
    });
  });
  
  var m;
  if ((m = location.hash.match(/^#Page(\d+)$/))){
    current = +m[1];
    for (var i = 0;i < current && slides[i];i++){
      slides[i].className = SL;
    }
    slides[current].className = SV;
  } else {
    slides[0].className = SV;
  }
  
  if(top == self){
    document.body.className += ' top';
  }
});


