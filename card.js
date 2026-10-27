(function(){
  const root = document.getElementById('app-root');
  const canvas = root.querySelector('#cardCanvas');
  const ctx = canvas.getContext('2d');
  const loadingNote = root.querySelector('#loadingNote');

  const TEMPLATE_W = 638, TEMPLATE_H = 1011;
  const RES = 2;

  canvas.width = TEMPLATE_W * RES;
  canvas.height = TEMPLATE_H * RES;

  const nameEl = root.querySelector('#f_name');
  const admEl = root.querySelector('#f_adm');
  const dobEl = root.querySelector('#f_dob');
  const bloodEl = root.querySelector('#f_group');
  const fatherEl = root.querySelector('#f_father');
  const phoneEl = root.querySelector('#f_phone');
  const addressEl = root.querySelector('#f_address');
  const photoInput = root.querySelector('#photoInput');
  const photoPreview = root.querySelector('#photoPreview');

  let studentImg = null;
  let templateReady = false;

  const template = new Image();
  template.onload = function(){
    templateReady = true;
    loadingNote.style.display = 'none';
    drawCard();
  };
  template.onerror = function(){
    loadingNote.textContent = 'Template load fail ayindi.';
  };
  template.src = "card.png";

  function wrapLines(c, text, maxWidth){
    if(!text) return [];
    const words = text.split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach(function(word){
      const test = line ? line + ' ' + word : word;
      if(c.measureText(test).width > maxWidth && line){
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if(line) lines.push(line);
    return lines;
  }

  // draws a sequence of {text,font,color} segments left-to-right starting at x,y; returns total width
  function drawSegments(c, segments, x, y){
    let cx = x;
    segments.forEach(function(seg){
      c.font = seg.font;
      c.fillStyle = seg.color;
      c.textAlign = 'left';
      c.fillText(seg.text, cx, y);
      cx += c.measureText(seg.text).width;
    });
    return cx - x;
  }

  function measureSegments(c, segments){
    let total = 0;
    segments.forEach(function(seg){
      c.font = seg.font;
      total += c.measureText(seg.text).width;
    });
    return total;
  }

  function drawCard(){
    if(!templateReady) return;
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.scale(RES, RES);

    // base blank template (header, seal, gold line, photo ring, watermark, footer)
    ctx.drawImage(template, 0, 0, TEMPLATE_W, TEMPLATE_H);

    // ---- photo ----
    const pcx = 318.5, pcy = 377.5, pr = 108;
    ctx.save();
    ctx.beginPath();
    ctx.arc(pcx, pcy, pr, 0, Math.PI*2);
    ctx.clip();
    if(studentImg){
      const iw = studentImg.width, ih = studentImg.height;
      const targetSize = pr*2;
      const scale = Math.max(targetSize/iw, targetSize/ih);
      const dw = iw*scale, dh = ih*scale;
      ctx.drawImage(studentImg, pcx-dw/2, pcy-dh/2, dw, dh);
    }
    ctx.restore();

    const FONT_LABEL = 'bold 25px Segoe UI, Roboto';
    const FONT_VALUE = 'bold 25px Segoe UI, Roboto';
    const GREEN = '#33006F';
    const DARK = '#222222';
    const GOLD = '#EC5800';

    // ---- name ----
    ctx.fillStyle = GOLD;
    ctx.font = '700 38px Segoe UI, "Roboto", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(nameEl.value.trim() || 'Student Name', 319, 540);

    // ---- Adm No (centered, mixed colors) ----
    const admSegs = [
      {text:'Adm. No', font:'bold 25px Segoe UI, Roboto', color: GREEN},
      {text:'  :  ', font:'bold 25px Segoe UI, Roboto', color: DARK},
      {text: admEl.value.trim(), font:'bold 25px Segoe UI, Roboto', color: DARK}
    ];
    const admWidth = measureSegments(ctx, admSegs);
    drawSegments(ctx, admSegs, 319 - admWidth/2, 575);

    // ---- fields (label + colon + value), aligned to a fixed column ----
    const labelX = 100, colonGap = 10, valueGap = 10;
    const fields = [
      ['DOB', dobEl.value.trim()],
      ['Group', bloodEl.value.trim()],
      ['Parent Name', fatherEl.value.trim()],
      ['Phone No', phoneEl.value.trim()],
      ['Address', addressEl.value.trim()]
    ];

    // measure the widest label once so every row's colon/value lines up in the same column
    ctx.font = FONT_LABEL;
    let maxLabelWidth = 0;
    fields.forEach(function(f){
      const w = ctx.measureText(f[0]).width;
      if(w > maxLabelWidth) maxLabelWidth = w;
    });
    const colonX = labelX + maxLabelWidth + colonGap;
    const valueX = colonX + valueGap + 6;

    let y = 638;
    fields.forEach(function(f, idx){
      const label = f[0], value = f[1];
      ctx.font = FONT_LABEL;
      ctx.fillStyle = GREEN;
      ctx.textAlign = 'left';
      ctx.fillText(label, labelX, y);

      ctx.font = FONT_VALUE;
      ctx.fillStyle = DARK;
      ctx.fillText(':', colonX, y);

      const maxWidth = TEMPLATE_W - valueX - 30;
      const lines = wrapLines(ctx, value, maxWidth);
      lines.forEach(function(line, li){
        ctx.fillText(line, valueX, y + li*24);
      });

      y += Math.max(48, lines.length*24 + 24);
    });
  }

  [nameEl, admEl, dobEl, bloodEl, fatherEl, phoneEl, addressEl].forEach(function(el){
    el.addEventListener('input', drawCard);
  });

  photoInput.addEventListener('change', function(e){
    const file = e.target.files && e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(ev){
      const src = ev.target.result;
      photoPreview.innerHTML = '<img src="'+src+'" alt="preview">';
      const img = new Image();
      img.onload = function(){
        studentImg = img;
        drawCard();
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });

root.querySelector('#downloadBtn').addEventListener('click', function () {

    const statusMsg = root.querySelector('#statusMsg');
    statusMsg.textContent = '';
    statusMsg.className = 'status-msg';

    try {

        // High Quality PNG
        const imgData = canvas.toDataURL("image/png", 1.0);

        const link = document.createElement("a");
        const fname = (nameEl.value.trim() || "student").replace(/\s+/g, "_");

        link.href = imgData;
        link.download = fname + "_ID_Card.png";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        statusMsg.textContent = "PNG Downloaded! ✅";
        statusMsg.className = "status-msg ok";

    } catch (err) {

        statusMsg.textContent = "PNG Download Failed";
        statusMsg.className = "status-msg err";

    }

});

})();