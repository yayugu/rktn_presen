var dispatchPage, dispatchPageImg, drawTextWithCanvas, isPageCode, scaleCtx, setFont, taplog;
taplog = function(x) {
  console.log(x);
  return x;
};
scaleCtx = function(ctx, ratioX, ratioY, block) {
  ctx.scale(ratioX, ratioY);
  block();
  return ctx.scale(1 / ratioX, 1 / ratioY);
};
setFont = function(ctx, fontSize, fontName) {
  return ctx.font = fontSize + "px " + fontName;
};
isPageCode = function(lines) {
  return _(lines).any(function(line) {
    return line.search(/[^ ]/);
  });
};
drawTextWithCanvas = function(elem, options) {
  var baseHeight, baseWidth, canvas, charWidth, ctx, fillStyle, font, fontSize, height, leftPadding, lineHeight, lines, mainHeight, width;
  if (options == null) {
    options = {};
  }
  width = options.width || 1024;
  height = options.height || 768;
  fontSize = options.fontSize || 80;
  font = options.font || "myfont";
  lineHeight = options.lineHeight || 1.4;
  leftPadding = options.leftPadding || 5;
  fillStyle = options.fillStyle || "#FFFFFF";
  lines = $(elem).text().split("\n");
  if (isPageCode(lines)) {
    font = "monospace";
    fontSize = fontSize / 2;
  }
  mainHeight = (lines.length - 1) * fontSize * lineHeight;
  canvas = $("<canvas>").attr({
    width: width,
    height: height
  });
  ctx = canvas[0].getContext("2d");
  baseWidth = 1024;
  baseHeight = 768;
  ctx.scale(width / baseWidth, height / baseHeight);
  width = baseWidth;
  height = baseHeight;
  setFont(ctx, fontSize, font);
  ctx.fillStyle = fillStyle;
  ctx.textBaseline = "middle";
  charWidth = ctx.measureText("a").width;
  _(lines).each(function(line, i) {
    var headSpaceWidth, lineWidth, ratio, y, yCenter;
    y = i * fontSize * lineHeight;
    yCenter = y + (height - mainHeight) / 2;
    i = void 0;
    headSpaceWidth = void 0;
    ratio = void 0;
    lineWidth = ctx.measureText(line).width;
    if (lineWidth > width) {
      i = line.search(/[^ ]/);
      headSpaceWidth = charWidth * i;
      line = line.slice(i);
      ratio = (width - headSpaceWidth - leftPadding) / ctx.measureText(line).width;
      return scaleCtx(ctx, ratio, 1, function() {
        return ctx.fillText(line, (leftPadding + headSpaceWidth) * (1 / ratio), yCenter);
      });
    } else {
      if (lines.length === 1) {
        ratio = _.min([width / lineWidth, height / fontSize]);
        return scaleCtx(ctx, ratio, ratio, function() {
          var x;
          x = (width - lineWidth * ratio) / 2 / ratio;
          y = height / 2 / ratio;
          return ctx.fillText(line, x, y);
        });
      } else {
        return ctx.fillText(line, leftPadding, yCenter);
      }
    }
  });
  return $(elem).empty().append(canvas);
};
dispatchPage = function(elem, options) {
  var str;
  str = elem.innerHTML;
  if (/\!img/.test(str)) {
    return dispatchPageImg(elem, str, options);
  } else {
    return drawTextWithCanvas(elem, options);
  }
};
dispatchPageImg = function(elem, str, options) {
  var fileURL, ihtml, width;
  fileURL = str.match(/\!img ([^ ]+)/)[1];
  width = str.match(/\!img ([^ ]+) (.+)/)[2];
  if (width === 'auto') {
    width = options.width + "px";
  }
  ihtml = width ? $("<center><img src=\"" + fileURL + "\" width=\"" + width + "\"></center>") : $("<center><img src=\"" + fileURL + "\"></center>");
  return $(elem).empty().append(ihtml);
};
$(function() {
  var SL, SR, SV, count, current, height, i, m, mousewheel, next, prev, root, slides, width;
  next = function() {
    slides[current++].className = SL;
    slides[current].className = SV;
    return location.hash = "Page" + current;
  };
  prev = function() {
    slides[current--].className = SR;
    slides[current].className = SV;
    return location.hash = "Page" + current;
  };
  document.body.onclick = function(e) {
    var ev, x;
    ev = e || window.event;
    x = ev.clientX;
    if (width * 0.95 < x && slides[current + 1]) {
      return next();
    } else {
      if (width * 0.05 > x && slides[current - 1]) {
        return prev();
      }
    }
  };
  mousewheel = function(e) {
    var Down, Up, dir, ev;
    Down = -1;
    Up = 1;
    ev = e || window.event;
    dir = ev.wheelDelta || -ev.detail;
    dir = (dir < 0 ? Down : Up);
    if (dir === Down && slides[current + 1]) {
      return next();
    } else {
      if (dir === Up && slides[current - 1]) {
        return prev();
      }
    }
  };
  if (document.body.onmousewheel !== void 0 || window.opera) {
    document.body.onmousewheel = mousewheel;
  } else {
    document.body.addEventListener("DOMMouseScroll", mousewheel, false);
  }
  document.onkeydown = function(evt) {
    var J, K, Left, Right;
    J = 74;
    K = 75;
    Left = 37;
    Right = 39;
    if (!evt) {
      evt = window.event;
    }
    if ((evt.keyCode === K || evt.keyCode === Left) && slides[current - 1]) {
      prev();
      return false;
    } else if ((evt.keyCode === J || evt.keyCode === Right) && slides[current + 1]) {
      next();
      return false;
    }
  };
  width = document.documentElement.clientWidth;
  height = document.documentElement.clientHeight;
  document.body.className = "slidemode";
  document.body.style.fontSize = width / 5 + "%";
  SV = "slide view";
  SR = "slide right";
  SL = "slide left";
  root = $("<div id=\"slide\">");
  slides = $(".slides")[0].innerHTML.trim().split("\n\n");
  slides = _(slides).map(function(text) {
    var s;
    s = $("<div>").attr("class", SR);
    s[0].innerHTML = text;
    root.append(s);
    return s[0];
  });
  $("#slide").replaceWith(root);
  current = 0;
  count = slides.length;
  _(slides).each(function(slide) {
    return dispatchPage(slide, {
      width: width * 0.88,
      height: height * 0.88,
      fontSize: width / 10
    });
  });
  m = void 0;
  if (m = location.hash.match(/^#Page(\d+)$/)) {
    current = +m[1];
    i = 0;
    while (i < current && slides[i]) {
      slides[i].className = SL;
      i++;
    }
    slides[current].className = SV;
  } else {
    slides[0].className = SV;
  }
  if (top === self) {
    return document.body.className += " top";
  }
});