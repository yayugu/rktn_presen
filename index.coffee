# forked from os0x's "HTML slide" http://jsdo.it/os0x/slide

taplog = (x) ->
  console.log x
  x

scaleCtx = (ctx, ratioX, ratioY, block) ->
  ctx.scale ratioX, ratioY
  block()
  ctx.scale 1 / ratioX, 1 / ratioY

setFont = (ctx, fontSize, fontName) ->
  ctx.font = fontSize + "px " + fontName

isPageCode = (lines) ->
  _(lines).any((line) ->
    line.search(/[^ ]/)
  )

biggerRatio = (width, height, ratioX, ratioY) ->
  ratio2X = width / ratioX
  ratio2Y = height / ratioY
  if ratio2X > ratio2Y then 'x' else 'y'

maxSizeWhenKeepAspectRatio = (width, height, ratioX, ratioY) ->
  _biggerRatio = biggerRatio(width, height, ratioX, ratioY)
  if _biggerRatio == 'x'
    {
      width: height / ratioY * ratioX
      height: height
    }
  else
    {
      width: width
      height: width / ratioY * ratioX
    }


drawTextWithCanvas = (elem, options) ->
  options = {} unless options?
  
  # options and each value
  width = options.width or 1024
  height = options.height or 768
  fontSize = options.fontSize or 80 * 2
  font = options.font or "HelveticaNeue-Light, GothicMB101Pro-Light"
  lineHeight = options.lineHeight or 1.4
  leftPadding = options.leftPadding or 5
  fillStyle = options.fillStyle or "#FFFFFF"
  lines = $(elem).text().split("\n")

  if isPageCode(lines)
    font = "Courier"
    fontSize = fontSize / 2
  
  mainHeight = (lines.length - 1) * fontSize * lineHeight

  baseWidth = 1024 * 2
  baseHeight = 768 * 2

  canvas = $("<canvas>").attr(
    width: baseWidth
    height: baseHeight
    style: 'width:' + width + 'px;' + 'height:' + height + 'px;' 
  )
  ctx = canvas[0].getContext("2d")

  #ctx.scale width / baseWidth, height / baseHeight
  width = baseWidth
  height = baseHeight
  setFont ctx, fontSize, font
  ctx.fillStyle = fillStyle
  ctx.textBaseline = "middle"

  charWidth = ctx.measureText("a").width
  _(lines).each (line, i) ->
    y = i * fontSize * lineHeight
    yCenter = y + (height - mainHeight) / 2
    i = undefined
    headSpaceWidth = undefined
    ratio = undefined
    lineWidth = ctx.measureText(line).width
    if lineWidth > width # over full
      # keep indent
      i = line.search(/[^ ]/)
      headSpaceWidth = charWidth * i
      line = line.slice(i)
      
      # demagnify width
      ratio = (width - headSpaceWidth - leftPadding) / ctx.measureText(line).width
      scaleCtx ctx, ratio, 1, ->
        ctx.fillText line, (leftPadding + headSpaceWidth) * (1 / ratio), yCenter

    else
      if lines.length is 1
        ratio = _.min([width / lineWidth, height / fontSize])
        scaleCtx ctx, ratio, ratio, ->
          x = (width - lineWidth * ratio) / 2 / ratio
          y = height / 2 / ratio
          #console.log [x, y]
          ctx.fillText line, x, y

      else
        ctx.fillText line, leftPadding, yCenter

  $(elem).empty().append canvas

dispatchPage = (elem, options) ->
  str = elem.innerHTML
  if /\!img/.test str
    dispatchPageImg(elem, str, options)
  else
    drawTextWithCanvas(elem, options)

dispatchPageImg = (elem, str, options) ->
  fileURL = str.match(/\!img ([^ ]+)/)[1]
  width = str.match(/\!img ([^ ]+) (.+)/)[2]
  if width == 'auto'
    width = options.width + "px"
  ihtml = if width
    $("<center><img src=\"#{fileURL}\" width=\"#{width}\"></center>")
  else
    $("<center><img src=\"#{fileURL}\"></center>")
  $(elem).empty().append ihtml

$ ->
  next = ->
    slides[current++].className = SL
    slides[current].className = SV
    location.hash = "Page" + current

  prev = ->
    slides[current--].className = SR
    slides[current].className = SV
    location.hash = "Page" + current

  document.body.onclick = (e) ->
    ev = e or window.event
    x = ev.clientX
    if width * 0.95 < x and slides[current + 1]
      
      #右余白がクリックされたとき
      next()
    
    #左余白がクリックされたとき
    else prev()  if width * 0.05 > x and slides[current - 1]

  mousewheel = (e) ->
    Down = -1
    Up = 1
    ev = e or window.event
    dir = ev.wheelDelta or -ev.detail
    dir = (if dir < 0 then Down else Up)
    if dir is Down and slides[current + 1]
      next()
    else prev()  if dir is Up and slides[current - 1]

  if document.body.onmousewheel isnt undefined or window.opera
    
    # onmousewheelが使えるか判定(Firefox以外はこちら)
    document.body.onmousewheel = mousewheel
  else
    
    # 実質Firefox用の処理。onmousewheelをサポートしたら上の処理だけで済むようになるはず
    document.body.addEventListener "DOMMouseScroll", mousewheel, false

  document.onkeydown = (evt) ->
    J = 74
    K = 75
    Left = 37
    Right = 39
    evt = window.event  unless evt
    if (evt.keyCode is K or evt.keyCode is Left) and slides[current - 1] # k
      prev()
      false
    else if (evt.keyCode is J or evt.keyCode is Right) and slides[current + 1] # j
      next()
      false

  
  # まずはページ幅取得
  width = document.documentElement.clientWidth
  height = document.documentElement.clientHeight
  size = maxSizeWhenKeepAspectRatio(width, height, 4, 3)
  console.log(width)
  console.log(height)
  console.log(size)
  document.body.className = "slidemode"

  # ひどい中央揃え
  document.body.innerHTML += '<style>.slidemode .slide{left:' + ((width - size.width) / 2) + 'px}</style>'
  
  # フォントサイズ調整
  document.body.style.fontSize = size.width / 5 + "%"
  SV = "slide view"
  SR = "slide right"
  SL = "slide left"
  root = $("<div id=\"slide\">")
  slides = $(".slides")[0].innerHTML.trim().split("\n\n")
  slides = _(slides).map((text) ->
    s = $("<div>")
      .attr("class", SR)
      .attr('width', size.width)
    s[0].innerHTML = text
    root.append s
    s[0]
  )
  $("#slide").replaceWith root
  
  #現在のページ
  current = 0
  count = slides.length
  _(slides).each (slide) ->
    dispatchPage slide,
      width: size.width * 0.88
      height: size.height * 0.88
      fontSize: size.width / 10 * 2


  m = undefined
  if m = location.hash.match(/^#Page(\d+)$/)
    current = +m[1]
    i = 0

    while i < current and slides[i]
      slides[i].className = SL
      i++
    slides[current].className = SV
  else
    slides[0].className = SV
  document.body.className += " top"  if top is self

