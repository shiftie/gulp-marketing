var imgsDir = '//d1eipm3vz40hy0.cloudfront.net/images/p-music-wall/'
var audioPrefix = '//d1eipm3vz40hy0.cloudfront.net/audio/p-music-wall/buddha-loops'

/*! amala-destination 2015-05-12 */
function preloadImages(a){function b(){d++,d==f.length&&e(c)}for(var c=[],d=0,e=function(){},f="object"!=typeof a?[a]:a,g=0,h=f.length;h>g;g++){var i=new Image;i.src=f[g],i.onload=b,i.onerror=b,c[g]=i}return{done:function(a){e=a||e}}}!function(){for(var a,b=function(){},c=["assert","clear","count","debug","dir","dirxml","error","exception","group","groupCollapsed","groupEnd","info","log","markTimeline","profile","profileEnd","table","time","timeEnd","timeline","timelineEnd","timeStamp","trace","warn"],d=c.length,e=window.console=window.console||{};d--;)a=c[d],e[a]||(e[a]=b)}(),function(){for(var a=0,b=["ms","moz","webkit","o"],c=0;c<b.length&&!window.requestAnimationFrame;++c)window.requestAnimationFrame=window[b[c]+"RequestAnimationFrame"],window.cancelAnimationFrame=window[b[c]+"CancelAnimationFrame"]||window[b[c]+"CancelRequestAnimationFrame"];window.requestAnimationFrame||(window.requestAnimationFrame=function(b){var c=(new Date).getTime(),d=Math.max(0,16-(c-a)),e=window.setTimeout(function(){b(c+d)},d);return a=c+d,e}),window.cancelAnimationFrame||(window.cancelAnimationFrame=function(a){clearTimeout(a)})}();var Circle=function(a,b){this.settings=$.extend({},{cw:388,ch:388,radius:148,lineWidth:12,baseColor:"#333333",barColor:"#ffffff",drawDur:250,fadeDur:250,breathDur:650,dismissDur:250},b),this.$el=a,this.canvas=a.find(".button").attr({width:this.settings.cw,height:this.settings.ch})[0],this.ctx=this.canvas.getContext("2d"),this.chain=[],this.animationId=null,this.startTime=null};Circle.Animations={CLOCKWISE:"clockwise",COUNTER_CLOCKWISE:"counter-clockwise",BREATH:"breath",BREATH_ONCE:"breath-once",FADE:"fade"},Circle.prototype={queue:function(){cancelAnimationFrame(this.animationId),this.chain=[];for(var a=0;a<arguments.length;a++){var b=arguments[a];switch(b){case Circle.Animations.CLOCKWISE:case Circle.Animations.COUNTER_CLOCKWISE:case Circle.Animations.BREATH:case Circle.Animations.BREATH_ONCE:case Circle.Animations.FADE:this.chain[a]=b}}this.renderQueue()},renderQueue:function(){if(this.startTime=null,this.chain.length>0){var a=this.chain.shift();switch(a){case Circle.Animations.CLOCKWISE:this.animationId=requestAnimationFrame(this._drawClockwise.bind(this));break;case Circle.Animations.COUNTER_CLOCKWISE:this.animationId=requestAnimationFrame(this._drawCounterClockwise.bind(this));break;case Circle.Animations.BREATH:this.animationId=requestAnimationFrame(this._drawBreath.bind(this));break;case Circle.Animations.BREATH_ONCE:this.animationId=requestAnimationFrame(this._drawBreathOnce.bind(this));break;case Circle.Animations.FADE:this.animationId=requestAnimationFrame(this._drawFade.bind(this));break;default:return void this.renderQueue()}return this.animationId}return!1},dismiss:function(){cancelAnimationFrame(this.animationId),this.chain=[],this.startTime=null,this.snapshot=document.createElement("canvas"),this.snapshot.width=this.settings.cw,this.snapshot.height=this.settings.ch,this.snapshot.getContext("2d").drawImage(this.canvas,0,0),this.animationId=requestAnimationFrame(this._drawDismiss.bind(this))},setColor:function(a,b){void 0!==typeof a&&(this.settings.baseColor=a),void 0!==typeof b&&(this.settings.barColor=b)},updateRing:function(){this.ctx.clearRect(0,0,this.settings.cw,this.settings.ch),this.ctx.globalAlpha=1,this.ctx.beginPath(),this.ctx.arc(this.settings.cw/2,this.settings.ch/2,this.settings.radius,0,2*Math.PI),this.ctx.lineWidth=this.settings.lineWidth-1,this.ctx.strokeStyle=this.settings.baseColor,this.ctx.stroke(),this.ctx.beginPath(),this.ctx.arc(this.settings.cw/2,this.settings.ch/2,this.settings.radius,0,2*Math.PI),this.ctx.lineWidth=this.settings.lineWidth,this.ctx.strokeStyle=this.settings.barColor,this.ctx.stroke()},_drawDismiss:function(a){this.startTime||(this.startTime=a);var b=a-this.startTime,c=Math.min(b/this.settings.dismissDur,1);this.ctx.clearRect(0,0,this.settings.cw,this.settings.ch),this.ctx.globalAlpha=1-c,this.ctx.drawImage(this.snapshot,0,0),b<this.settings.dismissDur&&(this.animationId=requestAnimationFrame(this._drawDismiss.bind(this)))},_drawClockwise:function(a){this.startTime||(this.startTime=a);var b=a-this.startTime,c=Math.min(b/this.settings.drawDur,1);this.ctx.clearRect(0,0,this.settings.cw,this.settings.ch),this.ctx.globalAlpha=1,this.ctx.beginPath(),this.ctx.arc(this.settings.cw/2,this.settings.ch/2,this.settings.radius,0,2*Math.PI),this.ctx.lineWidth=this.settings.lineWidth-1,this.ctx.strokeStyle=this.settings.baseColor,this.ctx.stroke(),this.ctx.beginPath(),this.ctx.arc(this.settings.cw/2,this.settings.ch/2,this.settings.radius,-Math.PI/2,(360*c-90)*Math.PI/180),this.ctx.lineWidth=this.settings.lineWidth,this.ctx.strokeStyle=this.settings.barColor,this.ctx.stroke(),b>this.settings.drawDur?this.renderQueue():this.animationId=requestAnimationFrame(this._drawClockwise.bind(this))},_drawFade:function(a){this.startTime||(this.startTime=a);var b=a-this.startTime,c=b/this.settings.fadeDur;this.ctx.clearRect(0,0,this.settings.cw,this.settings.ch),this.ctx.beginPath(),this.ctx.arc(this.settings.cw/2,this.settings.ch/2,this.settings.radius,0,2*Math.PI),this.ctx.lineWidth=this.settings.lineWidth,this.ctx.strokeStyle=this.settings.barColor,this.ctx.globalAlpha=1-c,this.ctx.stroke(),b>this.settings.fadeDur?this.renderQueue():this.animationId=requestAnimationFrame(this._drawFade.bind(this))},_drawCounterClockwise:function(a){this.startTime||(this.startTime=a);var b=a-this.startTime,c=this.settings.drawDur+this.settings.fadeDur,d=b<this.settings.drawDur?b/this.settings.drawDur:1,e=b>=this.settings.drawDur?(b-this.settings.drawDur)/this.settings.fadeDur:0;d=Math.min(d,1),e=Math.min(e,1),this.ctx.clearRect(0,0,this.settings.cw,this.settings.ch),this.ctx.globalAlpha=1,1>d?(this.ctx.beginPath(),this.ctx.arc(this.settings.cw/2,this.settings.ch/2,this.settings.radius,0,2*Math.PI),this.ctx.lineWidth=this.settings.lineWidth-1,this.ctx.strokeStyle=this.settings.barColor,this.ctx.stroke(),this.ctx.beginPath(),this.ctx.arc(this.settings.cw/2,this.settings.ch/2,this.settings.radius,(360*(1-d)-90)*Math.PI/180,-Math.PI/2),this.ctx.lineWidth=this.settings.lineWidth,this.ctx.strokeStyle=this.settings.baseColor,this.ctx.stroke()):(this.ctx.globalAlpha=1-e,this.ctx.beginPath(),this.ctx.arc(this.settings.cw/2,this.settings.ch/2,this.settings.radius,0,2*Math.PI),this.ctx.lineWidth=this.settings.lineWidth,this.ctx.strokeStyle=this.settings.baseColor,this.ctx.stroke()),b>c?this.renderQueue():this.animationId=requestAnimationFrame(this._drawCounterClockwise.bind(this))},_animateBreath:function(a){var b=1-Math.abs(Math.sin(a/this.settings.breathDur*4)),c=this.ctx.createRadialGradient(this.settings.cw/2,this.settings.ch/2,1,this.settings.cw/2,this.settings.ch/2,2*this.settings.radius),d=Math.min(1,a%this.settings.breathDur*.75/this.settings.breathDur),e=Math.min(1,a%this.settings.breathDur*2/this.settings.breathDur);c.addColorStop(0,"rgba(0,0,0,0)"),c.addColorStop(d,this.settings.barColor),c.addColorStop(e,this.settings.barColor),c.addColorStop(1,"rgba(0,0,0,0)"),this.ctx.clearRect(0,0,this.settings.cw,this.settings.ch),this.ctx.beginPath(),this.ctx.arc(this.settings.cw/2,this.settings.ch/2,this.settings.radius,0,2*Math.PI),this.ctx.fillStyle=c,this.ctx.lineWidth=this.settings.lineWidth,this.ctx.strokeStyle=this.settings.barColor,this.ctx.globalAlpha=.25*b+.125,this.ctx.fill(),this.ctx.globalAlpha=.5*b+.5,this.ctx.stroke()},_drawBreathOnce:function(a){this.startTime||(this.startTime=a);var b=a-this.startTime;b>this.settings.breathDur?this.renderQueue():(this._animateBreath(b),this.animationId=requestAnimationFrame(this._drawBreathOnce.bind(this)))},_drawBreath:function(a){this.startTime||(this.startTime=a);var b=a-this.startTime;this._animateBreath(b),this.animationId=requestAnimationFrame(this._drawBreath.bind(this))}};var Machine=function(){this.$el=null,this.$body=null,this.circle=null,this.so=null,this.playlist=null,this.numTracks=0,this.trackNum=-1,this.powered=!1};Machine.prototype={bind:function(a){var b=this;a.data("machine",this),b.$el=a,b.$body=a.find(".bm-body");var c=$('<div class="circle"><canvas class="button" /></div>').prependTo(b.$body);return b.circle=new Circle(c),a.on("click",function(a){$(a.target).hasClass("button")?b.togglePower():b.next()}),b},setPlaylist:function(a,b){return null!==this.playlist?void console.log("Machine: playlist had been set already."):(this.playlist=a,this.numTracks=Object.keys(a.sprite).length,this.trackNum=void 0!==b&&b<this.numTracks&&b>=0?b:0,this._updateColor(),this)},powerOn:function(){return this.powered||(this.powered=!0,this.$el.addClass("on"),this._play()),this.circle.queue(Circle.Animations.CLOCKWISE,Circle.Animations.BREATH_ONCE),this},powerOff:function(){return this.powered&&(this._stop(),this.$el.removeClass("on"),this.powered=!1,this.circle.dismiss()),this},getPowered:function(){return this.powered},togglePower:function(){return this.powered?(this.powerOff(),this.circle.queue(Circle.Animations.COUNTER_CLOCKWISE)):this.powerOn(),this},next:function(){return this.trackNum=this.trackNum+1>=this.numTracks?0:this.trackNum+1,this._updateColor(),this.powered&&(this.circle.updateRing(),this._play()),this},randomize:function(){var a=parseInt(Math.random()*this.numTracks);return a==this.trackNum?this.randomize():(this.trackNum=a,this._updateColor(),this.powered&&this._play(),this)},_load:function(){var a=0!==this.$el.data("so-pan")?this.$el.data("so-pan"):0;this.so=new Howl({urls:this.playlist.urls,sprite:this.playlist.sprite,autoplay:!0,loop:!0}),this.so.pos3d(a,0,0),this.so.play(this.trackNum.toString())},_play:function(){this.powered&&(null!==this.so?(this.so.stop(),this.so.play(this.trackNum.toString())):this._load())},_stop:function(){this.powered&&this.so.stop()},_updateColor:function(){this.$el.removeClass(function(a,b){return(b.match(/(^|\s)color-\S+/g)||[]).join(" ")}).addClass("color-"+this.trackNum);var a=this.$body.find(".button").css("border-top-color"),b=this.$body.find(".button").css("color");this.circle.setColor(a,b)}},function(a,b,c){function d(a){function b(a){var b=a.split(":");return 6e4*parseInt(b[0])+1e3*parseInt(b[1])+10*parseInt(b[2])}for(var c={},d=0,e=a.length;e>d;d++){var f=b(a[d][0]),g=b(a[d][1]),h=g-f;c[d.toString()]=[f,h]}return c}function e(){var c=b.getElementById("browserupgrade"),d=/(iPad|iPhone|iPod)/g.test(navigator.userAgent),e=/(iPad)/g.test(navigator.userAgent);if(null!==c)a(c).modal({escapeClose:!1,clickClose:!1});else if(e)a("#ipadmodal").modal({escapeClose:!1,clickClose:!1});else{if(!d)return!0;b.getElementById("viewport").setAttribute("content","width=520"),a("#iosmodal").modal({escapeClose:!1,clickClose:!1})}return!1}function f(){j=setInterval(function(){s>=r.length?clearInterval(j):C.html(r[s++])},t),preloadImages(q).done(function(){w=!0,g()});new Howl({urls:p.urls,sprite:p.sprite,autoplay:!1,onload:function(){v=!0,g()}});k=setTimeout(function(){g(!0)},u)}function g(b){if(!x&&(w&&v||b)){x=!0,clearInterval(j),clearTimeout(k),setTimeout(function(){B.remove()},500),E.removeClass("loading");for(var d=0,e=F.length;e>d;d++){var f=F.eq(d),g=new Machine;g.bind(f),g.setPlaylist(p,parseInt(9*Math.random()))}D.find("#icon-buddha").on("mousedown",function(){m=!1,l=c.setTimeout(h,y)}).on("mouseup mouseleave",function(){clearTimeout(l)}).on("click",function(){return m?!1:void F.each(function(){var b=a(this).data("machine");b.powerOff().randomize(),Math.random()<.25&&b.powerOn()})}),A.on("resize",i),i()}}function h(){m=!0,F.each(function(){var b=a(this).data("machine");b.getPowered()&&b.togglePower()})}function i(){for(var a=E.outerHeight(),b=E.outerWidth(),c=a-E.height(),d=b-E.width(),e=(a-c)/3,f=(b-d)/7,g=e/f,h=g>z?f:e/z,i=h*z,j=(a-c-3*i)/2,k=(b-d-7*h)/6,l=j>30?30:j,m=k>30?30:k,n=2*(j-l)/2,o=6*(k-m)/2,p=0;3>p;p++)for(var q=0;7>q;q++)F.eq(7*p+q).css({width:h,top:n+c/2+p*(i+l),left:o+d/2+q*(h+m)})}var j,k,l,m,n=audioPrefix,o=[["0:01:00","0:36:29"],["0:38:00","1:10:30"],["1:12:00","1:22:34"],["1:24:00","1:44:07"],["1:45:00","2:05:00"],["2:06:00","2:13:11"],["2:14:00","2:54:00"]],p={urls:[n+".m4a",n+".opus",n+".ogg"],sprite:d(o)},q=[imgsDir + "light-off.png",imgsDir + "light-on.png",imgsDir + "bm-black.png",imgsDir + "bm-white.png",imgsDir + "bm-red.png",imgsDir + "bm-orange.png",imgsDir + "bm-pink.png",imgsDir + "bm-blue.png",imgsDir + "bm-green.png"],r=["preparing music","fine tuning machines","Searching for Buddha","please wait","patient, patient","Almost there"],s=0,t=3e3,u=3e4,v=!1,w=!1,x=!1,y=500,z=603/388,A=a(c),B=a("#bw-loader"),C=B.find(".loading-txt .message"),D=(a("#bw-wrapper"),a("#bw-header")),E=(a("#bw-footer"),a("#bw-body")),F=E.find(".bm");a.modal.defaults={overlay:"#fff",opacity:.75,zIndex:100,escapeClose:!0,clickClose:!0,fadeDuration:150,fadeDelay:1},e()&&f()}(jQuery,document,window);
