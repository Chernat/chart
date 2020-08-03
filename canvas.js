class Chartt {
  constructor (id, data, context, theme = true) {
    this.id = id;
    this.data = [];
    this.context = context;
    this.theme = theme;
    for (let i = 0; i < data.labels.length; i++) {
      this.data.push({x: data.labels[i], y: data.values[i]})
    }
    this.dataView = [...this.data];
    this.createdCanvas();
    this.render();
    this.listener();
  }
  createdCanvas () {
    const parent = document.getElementById(this.id),
      canvas = document.createElement('canvas'),
      date = new Date() / 1000;
    
    if (!parent) {
      return;
    }
    
    canvas.id = `chart-${date.toFixed()}`;
    parent.style.position = 'relative';
    parent.appendChild(canvas);
    this.parent = parent
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state();
  }
  listener () {
    this.canvas.addEventListener('touchstart', (e) => {
      const x = (e.touches[0].pageX - this.canvas.offsetLeft) * 2,
        y = (e.touches[0].pageY - this.canvas.offsetTop) * 2,
        yBigChart = this.chartHeight,
        rightXToggle = this.miniChartRightToggleX,
        rightToggleWidth = rightXToggle + this.miniChartRectToggleWidth * 2,
        leftXToggle = this.miniChartLeftToggleX,
        leftToggleWidth = leftXToggle + this.miniChartRectToggleWidth * 2;

      if (y >= yBigChart && x >= rightXToggle  && x <= rightToggleWidth) {
        this.deleteToolTip();
        this.rightToggle = true;
        this.startRightToggle  = x - this.endRightToggle;
      } else if (y >= yBigChart && x >= leftXToggle  && x <= leftToggleWidth) {
        this.deleteToolTip();
        this.leftToggle = true;
        this.startLeftToggle  = x - this.endLeftToggle;
      }
    })
    this.canvas.addEventListener('touchmove', (e) => {
      const x = (e.touches[0].pageX - this.canvas.offsetLeft) * 2,
        rightToggleStopLeft = this.start * this.elementWidth + this.elementWidth * 3,
        rightToggleStopRight = this.canvas.width - this.miniChartRectToggleWidth,
        leftToggleStopLeft = x - this.startLeftToggle,
        leftToggleStopRight = (this.end * this.elementWidth) - this.elementWidth * 2;
 
      if (this.rightToggle && x >= rightToggleStopLeft && x - this.startRightToggle <= rightToggleStopRight) {
        this.miniChartRightToggleX = x - this.startRightToggle ;
        this.updateSlider();
        this.render();
      } else if (this.leftToggle && leftToggleStopLeft <= x && x <= leftToggleStopRight) {
        this.miniChartLeftToggleX = x - this.startLeftToggle ;
        this.updateSlider();
        this.render();
      }
    })
    this.canvas.addEventListener('touchend', () => {
      this.rightToggle = false;
      this.endRightToggle = this.miniChartRightToggleX;
      this.leftToggle = false;
      this.endLeftToggle = this.miniChartLeftToggleX;
    })
    this.canvas.addEventListener('click', (e) => {
      const y = e.layerY,
        x = e.layerX,
      index = Math.round(x * 2 / (this.canvas.width / this.dataView.length));
      this.render(index)
    })
    window.addEventListener('resize', () => {
      this.state();
      this.render();
    })
  }
  state () {
    //canvas size
    const height = 300;
    this.canvas.style.width = this.parent.offsetWidth + 'px';
    this.canvas.style.height = height + 'px';
    this.canvas.width = this.parent.offsetWidth * 2;
    this.canvas.height = height * 2;
    this.elementWidth = this.canvas.width / this.data.length;
    //mini-chart 
    this.miniChartPadding = 10;
    this.miniChartRectToggleWidth = 30;
    this.miniChartHeight = this.canvas.height / 5;
    this.miniChartPercent = (this.miniChartHeight - this.miniChartPadding * 4)  / 100;
    //right toggle
    this.end = this.data.length
    this.miniChartRightToggleX = this.canvas.width - this.miniChartRectToggleWidth;
    this.startRightToggle = 0;
    this.endRightToggle = this.miniChartRightToggleX;
    this.rightToggle = false;
    //left toggle
    this.start = 0;
    this.miniChartLeftToggleX = 0;
    this.startLeftToggle = 0;
    this.endLeftToggle = this.miniChartLeftToggleX;
    this.leftToggle = false;
    //chart size
    this.topPadding = 20;
    this.bottomPadding = 80;
    this.chartHeight = this.canvas.height - this.miniChartHeight;
    this.chartPercent = (this.chartHeight - (this.topPadding + this.bottomPadding)) / 100;

    //math
    this.min = Math.min(...this.data.map(item => item.y));
    this.max = Math.max(...this.data.map(item => item.y));
    this.delta = this.max - this.min;
    this.zero = (100 - (this.delta - this.max) / (this.delta / 100)) * this.chartPercent;

    
  }
  updateSlider () {
    this.start = parseInt(this.miniChartLeftToggleX / this.elementWidth);
    this.end = parseInt(this.miniChartRightToggleX / this.elementWidth) + 1;
    this.dataView = this.data.slice(this.start, this.end);
  }
  yDotCoords (val, percent = this.chartPercent) {
    const y = (100 - (this.delta - (this.max - val)) / (this.delta / 100)) * percent;
    return y;
  }
  render (i) {
    this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
    this.backgroundCoords();
    this.zeroLine();
    this.chartLine();
    this.chartLabel();
    this.chartLineToZero();
    this.backgroundValues();
    this.miniChartLine();
    this.miniChartRectRightToggle();
    this.miniChartRectLeftToggle();
    if (i) {
      this.toolTip(i);
      this.chartDot(i);
    }
  }
  backgroundCoords () {
    const yLength = 5,
      height = this.chartHeight,
      width = this.canvas.width;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = 1;
    this.ctx.strokeStyle = '#ccc';
    this.ctx.setLineDash([5, 15]);
    for (let i = 0; i < yLength; i++) {
      const lineYCoord = height - ((height - this.bottomPadding - this.topPadding) / yLength * i);
      this.ctx.moveTo(0, lineYCoord - this.bottomPadding);
      this.ctx.lineTo(width, lineYCoord - this.bottomPadding);
    }
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }
  backgroundValues () {
    const yLength = 5,
      height = this.chartHeight,
      textLeftPadding = 10;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = 'black';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = 'bold 25px Arial';
    for (let i = 0; i < yLength; i++) {
      const value = (this.min + this.delta / yLength * i).toFixed(),
        lineYCoord = height - ((height - this.bottomPadding - this.topPadding) / yLength * i);
      this.ctx.fillText(value, textLeftPadding, lineYCoord - this.bottomPadding);
    }
    this.ctx.closePath();
    this.ctx.restore();
  }
  zeroLine () {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#ccc';
    this.ctx.setLineDash([5, 10]);
    this.ctx.moveTo(0, this.zero + this.topPadding)
    this.ctx.lineTo(this.canvas.width, this.zero + this.topPadding)
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();

  }
  chartLine () {
    const x = this.canvas.width / (this.dataView.length - 1);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = 6;
    this.ctx.strokeStyle = 'green';
    this.ctx.lineJoin = 'round';
    for (let i = 0; i < this.dataView.length; i++) {
      const y = this.yDotCoords(this.dataView[i].y) + this.topPadding;
      if (i === 0) {
        this.ctx.moveTo(x * i, y)
      } else {
        this.ctx.lineTo(x * i, y)
      }
    }
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }
  chartLabel () {
    const x = this.canvas.width / (this.dataView.length - 1),
      textWidth = this.canvas.width / this.ctx.measureText(this.dataView[0].x.split(',')).width,
      range = Math.ceil(this.dataView.length / textWidth)
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = 'black';
    this.ctx.textBaseline = 'top'
    this.ctx.font = 'bold 25px Arial';
    for (let i = 0; i < this.dataView.length; i++) {
      const date = this.dataView[i].x.split(',')
      if (i % range === 0) {
        this.ctx.fillText(date[0] ,x * i, this.chartHeight - this.bottomPadding / 2)
      } 
    }
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }
  chartLineToZero () {
    const x = this.canvas.width / (this.dataView.length - 1);

    for (let i = 0; i < this.dataView.length; i++) {
      const y = this.yDotCoords(this.dataView[i].y) + this.topPadding;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.globalAlpha = 0.5;
      this.ctx.lineWidth = 20;
      if (this.zero > y) {
        this.ctx.strokeStyle = 'red';
      } else {
        this.ctx.strokeStyle = 'green';
      }
      this.ctx.moveTo(x * i, y)
      this.ctx.lineTo(x * i, this.zero + this.topPadding)
      this.ctx.stroke();
      this.ctx.closePath();
      this.ctx.restore();
    }
    
  }
  miniChartLine () {
    const x = this.canvas.width / (this.data.length - 1);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = 'gray';
    for (let i = 0; i < this.data.length; i++) {
      const y = this.yDotCoords(this.data[i].y, this.miniChartPercent) + this.chartHeight + this.miniChartPadding * 2;
      if (i === 0) {
        this.ctx.moveTo(x * i, y);
      } else {
        this.ctx.lineTo(x * i, y);
      }
    }
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();
  }
  miniChartRectRightToggle () {
    const x = this.miniChartRightToggleX,
      y = this.chartHeight + this.miniChartPadding,
      widthToggle = this.miniChartRectToggleWidth,
      widthRect = this.canvas.width - x,
      height = this.miniChartHeight - this.miniChartPadding * 2;
    //toggle
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = 'gray'
    this.ctx.globalAlpha = 0.7;
    this.ctx.roundRect(x, y , widthToggle, height, 5);
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
    //rect
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = 'black';
    this.ctx.globalAlpha = 0.1;
    this.ctx.roundRect(x, y, widthRect, height, 10);
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }
  miniChartRectLeftToggle () {
    const x = this.miniChartLeftToggleX,
      y = this.chartHeight + this.miniChartPadding,
      widthToggle = this.miniChartRectToggleWidth,
      widthRect = 0 + x,
      height = this.miniChartHeight - this.miniChartPadding * 2;
    //toggle
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = 'gray'
    this.ctx.globalAlpha = 0.7;
    this.ctx.roundRect(x, y, widthToggle, height, 5);
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
    //rect
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.fillStyle = 'black';
    this.ctx.globalAlpha = 0.1;
    this.ctx.roundRect(0, y, widthRect + widthToggle, height, 10);
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }
  toolTip (i) {
    const oldElement = document.querySelector('.tooltip'),
      x = this.canvas.width / (this.dataView.length - 1),
      dateValue = this.dataView[i].x.split(',')[0],
      left = x * i + 10 > this.canvas.width - 200 
      ? x / 2 * i - 100 + 'px'
      : x / 2 * i + 10 + 'px'

    if (oldElement) {
      const date = document.querySelector('.tooltip__date'),
        value = document.querySelector('.tooltip__value');

      date.innerHTML = dateValue;
      value.innerHTML = this.dataView[i].y;
      oldElement.style.left = left;
    } else {
      const newDomElement = document.createElement('div'),
        date = document.createElement('div'),
        value = document.createElement('div');

      newDomElement.classList.add('tooltip');
      date.classList.add('tooltip__date');
      value.classList.add('tooltip__value');

      newDomElement.style.left = left;

      date.innerHTML = dateValue;
      value.innerHTML = this.dataView[i].y;

      this.parent.appendChild(newDomElement);
      newDomElement.appendChild(date);
      newDomElement.appendChild(value)
    }
    
  }
  chartDot (i) {
    const x = this.canvas.width / (this.dataView.length - 1);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = '#ccc';
    this.ctx.setLineDash([5, 15]);
    this.ctx.moveTo(x * i, 0)
    this.ctx.lineTo(x * i, this.chartHeight - this.bottomPadding)
    this.ctx.stroke();
    this.ctx.closePath();
    this.ctx.restore();

    this.ctx.save();
    this.ctx.beginPath();
    const y = this.yDotCoords(this.dataView[i].y) + this.topPadding;
    this.ctx.arc(x * i, y, 10, 0, 2 * Math.PI)
    this.ctx.fill();
    this.ctx.closePath();
    this.ctx.restore();
  }
  deleteToolTip () {
    const oldElement = document.querySelector('.tooltip');
    if (oldElement) {
      this.parent.removeChild(oldElement)
    }
  }
}

CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  this.beginPath();
  this.moveTo(x + radius, y);
  this.arcTo(x + width, y, x + width, y + height, radius);
  this.arcTo(x + width, y + height, x, y + height, radius);
  this.arcTo(x, y + height, x, y, radius);
  this.arcTo(x, y, x + width, y, radius);
  this.closePath();
  return this;
}

const data = {
  chartData: {
    labels: [
      'Jul 6, 2020 00:00:00',
      'Jul 7, 2020 00:00:00',
      'Jul 10, 2020 00:00:00',
      'Jul 11, 2020 00:00:00',
      'Jul 12, 2020 00:00:00',
      'Jul 13, 2020 00:00:00',
      'Jul 14, 2020 00:00:00',
      'Jul 15, 2020 00:00:00',
      'Jul 16, 2020 00:00:00',
      'Jul 17, 2020 00:00:00',
      'Jul 18, 2020 00:00:00',
      'Jul 19, 2020 00:00:00',
      'Jul 20, 2020 00:00:00',
      'Jul 6, 2020 00:00:00',
      'Jul 7, 2020 00:00:00',
      'Jul 10, 2020 00:00:00',
      'Jul 11, 2020 00:00:00',
      'Jul 12, 2020 00:00:00',
      'Jul 13, 2020 00:00:00',
      'Jul 14, 2020 00:00:00',
      'Jul 15, 2020 00:00:00',
      'Jul 16, 2020 00:00:00',
      'Jul 17, 2020 00:00:00',
      'Jul 18, 2020 00:00:00',
      'Jul 19, 2020 00:00:00',
      'Jul 20, 2020 00:00:00',
      'Jul 6, 2020 00:00:00',
      'Jul 7, 2020 00:00:00',
      'Jul 10, 2020 00:00:00',
      'Jul 11, 2020 00:00:00',
      'Jul 12, 2020 00:00:00',
      'Jul 13, 2020 00:00:00',
      'Jul 14, 2020 00:00:00',
      'Jul 15, 2020 00:00:00',
      'Jul 16, 2020 00:00:00',
      'Jul 17, 2020 00:00:00',
      'Jul 18, 2020 00:00:00',
      'Jul 19, 2020 00:00:00',
      'Jul 20, 2020 00:00:00',
      'Jul 6, 2020 00:00:00',
      'Jul 7, 2020 00:00:00',
      'Jul 10, 2020 00:00:00',
      'Jul 11, 2020 00:00:00',
      'Jul 12, 2020 00:00:00',
      'Jul 13, 2020 00:00:00',
      'Jul 14, 2020 00:00:00',
      'Jul 15, 2020 00:00:00',
      'Jul 16, 2020 00:00:00',
      'Jul 17, 2020 00:00:00',
      'Jul 18, 2020 00:00:00',
      'Jul 19, 2020 00:00:00',
      'Jul 20, 2020 00:00:00',
    ],
    values: [
      100,
      -3454.88,
      -5392.68,
      -6443.2,
      -5413.2,
      -5413.2,
      -5413.2,
      -1413.2,
      -5413.2,
      -2413.2,
      -1413.2,
      -3413.2,
      2000,
      100,
      -3454.88,
      -5392.68,
      -6443.2,
      -5413.2,
      -5413.2,
      -5413.2,
      -1413.2,
      -5413.2,
      -2413.2,
      -1413.2,
      -3413.2,
      2000,
      100,
      -3454.88,
      -5392.68,
      -6443.2,
      -5413.2,
      -5413.2,
      -5413.2,
      -1413.2,
      -5413.2,
      -2413.2,
      -1413.2,
      -3413.2,
      2000,
      100,
      -3454.88,
      -5392.68,
      -6443.2,
      -5413.2,
      -5413.2,
      -5413.2,
      -1413.2,
      -5413.2,
      -2413.2,
      -1413.2,
      -3413.2,
      2000,
    ],
  },
};

let newEl = new Chartt('demo', data.chartData)