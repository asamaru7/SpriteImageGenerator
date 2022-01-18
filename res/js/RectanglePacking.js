"use strict";define("RectanglePacking",[],(function(){var t=function(t){t=t||{},this._empty=[{x:0,y:0,drawWidth:t.drawWidth||1/0,drawHeight:t.drawHeight||1/0}],this.canvasWidth=0,this.canvasHeight=0};return t.prototype={pack:function(t){if(t instanceof Array){var i=this;t.map((function(t){i._packOne(t)}))}else if(t instanceof Object)for(var r in t)t.hasOwnProperty(r)&&this._packOne(t[r]);else this._packOne(t)},_packOne:function(i){var r=!1;if(this._empty.some((function(a){return!!t.rectFit(i,a)&&(r=a,!0)})),!r)return!1;i.x=r.x,i.y=r.y;var a=[];this._empty.forEach((function(r){if(!t.intersect(i,r))return a.push(r);a=a.concat(t.subtract(i,r))}));var e=a.sort(t.algo.dist);this._empty=e.filter((function(i){return e.every((function(r){return i===r||!t.boxFit(i,r)}))})),this.canvasWidth=Math.max(this.canvasWidth,i.x+i.drawWidth),this.canvasHeight=Math.max(this.canvasHeight,i.y+i.drawHeight)}},t.algo={dist:function(t,i){return Math.pow(t.x,2)+Math.pow(t.y,2)-(Math.pow(i.x,2)+Math.pow(i.y,2))}},t.rectFit=function(t,i){return t.drawWidth<=i.drawWidth&&t.drawHeight<=i.drawHeight},t.boxFit=function(t,i){return t.x>=i.x&&t.x+t.drawWidth<=i.x+i.drawWidth&&t.y>=i.y&&t.y+t.drawHeight<=i.y+i.drawHeight},t.intersect=function(t,i){return t.x<i.x+i.drawWidth&&t.x+t.drawWidth>i.x&&t.y<i.y+i.drawHeight&&t.y+t.drawHeight>i.y},t.divideX=function(t,i){return i<=t.x||i>=t.x+t.drawWidth?[]:[{x:t.x,y:t.y,drawWidth:i-t.x,drawHeight:t.drawHeight},{x:i,y:t.y,drawWidth:t.x+t.drawWidth-i,drawHeight:t.drawHeight}]},t.divideY=function(t,i){return i<=t.y||i>=t.y+t.drawHeight?[]:[{x:t.x,y:t.y,drawWidth:t.drawWidth,drawHeight:i-t.y},{x:t.x,y:i,drawWidth:t.drawWidth,drawHeight:t.y+t.drawHeight-i}]},t.subtract=function(i,r){return[i].concat(t.divideX(r,i.x),t.divideX(r,i.x+i.drawWidth),t.divideY(r,i.y),t.divideY(r,i.y+i.drawHeight)).filter((function(r){return!t.intersect(i,r)}))},t}));
