var game=new Phaser.Game(480,800,Phaser.AUTO,"game_div",{preload:preload,create:create,update:update,render:render});
var isDebug=false;
var Scene={GameStart:{},GameRunning:{},GameOver:{}};
var gameState;
var lastGameState;
var gameStep=0;
var direction;
var maxScore=0;

try{
	maxScore=(localStorage.boncybitMaxScore!=undefined)?localStorage.boncybitMaxScore:0;
}catch(e){
	
}

var score;
var dPixel;
var spikes;
var bars;
var collisionGroup={};
var bit=7;

function preload(){
	game.stage.backgroundColor="#00febf";
	game.load.image("pixel","assets/pixel.png");
	game.load.image("skull","assets/skull.png");
	game.load.image("limb","assets/limb.png");
	game.load.image("spike","assets/spike.png");
	game.load.image("bar0","assets/bar0.png");
	game.load.image("bar1","assets/bar1.png");
	game.load.image("title","assets/title.png");
	game.load.image("click_to_start","assets/click_to_start.png");
	game.load.image("mask","assets/mask.png");
	game.load.image("score_title","assets/score_title.png");
	game.load.image("replay","assets/replay.png");
	game.load.image("more","assets/more.png");
	game.load.image("logo","assets/logo.png");
	game.load.spritesheet("number_white","assets/number_white.png",58,75);
	game.load.spritesheet("number_black","assets/number_black.png",58,75);
	game.load.spritesheet("number_yellow","assets/number_yellow.png",58,75);
	game.scale.scaleMode=Phaser.ScaleManager.SHOW_ALL;game.scale.minWidth=120;
	game.scale.minHeight=200;
	game.scale.maxWidth=960;
	game.scale.maxHeight=1600;
	game.scale.pageAlignHorizontally=true;
	game.scale.pageAlignVertically=true;
	game.scale.setScreenSize(true);
}

function create(){
	var a=game.add.sprite(0,0,"mask");
	game.physics.startSystem(Phaser.Physics.P2JS);
	game.physics.p2.gravity.y=1500;
	game.physics.p2.setImpactEvents(true);
	game.physics.p2.restitution=0.6;
	game.physics.p2.defaultFriction=0;
	game.physics.p2.friction=0;
	game.physics.p2.updateBoundsCollisionGroup();
	collisionGroup.pixelCollisionGroup=game.physics.p2.createCollisionGroup();
	collisionGroup.barsCollisionGroup=game.physics.p2.createCollisionGroup();
	collisionGroup.spikeCollisionGroup=game.physics.p2.createCollisionGroup();
	collisionGroup.limbCollisionGroup=game.physics.p2.createCollisionGroup();
	spikes=new Spikes();
	(function(){
		var b=function(c,d){
			game.physics.p2.enable(c,isDebug);
			c.body.kinematic=true;
			c.body.setCollisionGroup(collisionGroup.barsCollisionGroup);
			c.body.collides([collisionGroup.pixelCollisionGroup]);
			c.id=d;
		};
		bars=game.add.group();
		b(bars.create(240,0-25,"bar0"),"bar0");
		b(bars.create(0+40-55,400,"bar1"),"bar1");
		b(bars.create(240,800+25,"bar0"),"bar2");
		b(bars.create(480-40+55,400,"bar1"),"bar3");
	})();
	gameState="GameStart";
	GameStartScene.start();
}

function update(){}
function render(){}
var Scene={
		nextScene:"",
		next:function(){
			this.clear();
			window[this.nextScene].start();
		},
		clear:function(){}
};
GameStartScene=$.extend(
		{},
		Scene,
		{
			nextScene:"GameRunningScene",
			title:{},
			startTips:{},
			pixel:{},
			start:function(){
				game.stage.backgroundColor="#00febf";
				this.pixel=game.add.sprite(game.world.width/2,game.world.height/2,"pixel");
				this.pixel.anchor.setTo(0.5,0.5);
				this.title=game.add.sprite(game.world.centerX,200,"title");
				this.title.anchor.setTo(0.5);
				this.startTips=game.add.sprite(game.world.centerX,600,"click_to_start");
				this.startTips.anchor.setTo(0.5);
				spikes.recycleSpikes(0);
				spikes.recycleSpikes(1);
				var a=this;
				game.input.onDown.add(function(){gameState="GameRunning";a.next()});
			},
			clear:function(){
				game.world.remove(this.title);
				game.world.remove(this.startTips);
				game.world.remove(this.pixel);
				game.input.onDown.removeAll();
			}
		}
);

GameRunningScene=$.extend(
		{},
		Scene,
		{
			nextScene:"GameOverScene",
			scoreBoard:{},
			start:function(){
				dPixel=game.add.sprite(game.world.width/2,game.world.height/2,"pixel");
				dPixel.anchor.setTo(0.5,0.5);
				game.physics.p2.enable(dPixel,isDebug);
				dPixel.body.collideWorldBounds=true;
				dPixel.body.setCollisionGroup(collisionGroup.pixelCollisionGroup);
				dPixel.body.collides(collisionGroup.barsCollisionGroup,this.hitBars,this);
				dPixel.body.collides(collisionGroup.spikeCollisionGroup,function(f,d){this.hitSpikes(f,d)},this);
				dPixel.body.damping=0;
				dPixel.body.id="dPixel";
				dPixel.body.step=gameStep;
				var b=game.physics.p2.createMaterial("spriteMaterial",dPixel.body);
				var a=game.physics.p2.createMaterial("spriteMaterial",bars.iterate("id","bar1",Phaser.Group.RETURN_CHILD).body);
				var c=game.physics.p2.createContactMaterial(b,a);
				c.friction=0;
				c.restitution=1;
				a=game.physics.p2.createMaterial("spriteMaterial",bars.iterate("id","bar3",Phaser.Group.RETURN_CHILD).body);
				var c=game.physics.p2.createContactMaterial(b,a);
				c.friction=0;
				c.restitution=1;
				dPixel.body.velocity.x=250;
				dPixel.body.velocity.y=-650;
				score=0;
				this.scoreBoard=new PixelNumber(game.world.centerX,130,"number_black",score,0.5);
				spikes.setSpikes(1);
				direction=1;
				game.input.onDown.add(this.pixelJump);
			},
			clear:function(){
				this.scoreBoard.remove();
				game.input.onDown.removeAll();
			},
			hitSpikes:function(b,a,c){
				if(gameState=="GameRunning"&&gameStep==b.step){
					gameStep++;
					gameState="GameOver";
					this.next();
				}
			},
			hitBars:(
				function(){
					var a=0;
					return function(c,b){
						var d=this;
						if(a===0){
							//if(bit>=(new Date).getMonth()){//妈蛋，设置这种蛋疼的暗桩
								setTimeout(
									function(){
										var f,g;
										direction==1?(f=0,g=1,direction=0):(f=1,g=0,direction=1);
										if(gameState=="GameRunning"){
											score++;
											d.scoreBoard.setNumber(score);
											spikes.setSpikes(f);
											spikes.recycleSpikes(g);
										};
										a=0;
									},20
								);
								a=1;
							//}
						}
					}
				}
			)(),
			pixelJump:function(){
				if(gameState=="GameRunning"){
					dPixel.body.velocity.y=-650;
				}
			}
});

GameOverScene=$.extend(
		{},
		Scene,
		{
			nextScene:"GameStartScene",
			skull:{},
			scoreTitle:{},
			more:{},
			logo:{},
			replay:{},
			limbs:{},
			maxScoreBoard:{},
			curScoreBoard:{},
			start:function(){
                window.location.href="objc://"+"gameOver:/0"; //by decamincow
				game.stage.backgroundColor="#ff0c19";
				this.skull=game.add.sprite(dPixel.body.x,dPixel.body.y,"skull");
				this.skull.anchor.setTo(0.5);
				game.physics.p2.enable(this.skull,isDebug);
				this.skull.body.collideWorldBounds=true;
				this.skull.body.setCollisionGroup(collisionGroup.pixelCollisionGroup);
				this.skull.body.collides([collisionGroup.barsCollisionGroup,collisionGroup.spikeCollisionGroup]);
				this.skull.body.angle=Math.floor(Math.random()*60-30);
				this.skull.body.velocity.x=dPixel.body.velocity.x;
				this.skull.body.velocity.y=dPixel.body.velocity.y;
				dPixel.body.destroy();
				game.world.remove(dPixel);
				this.limbs=game.add.group();
				for(var a=0;a<9;a++){
					this.addLimb(this.limbs);
				}
				var d=-40;
				this.scoreTitle=game.add.sprite(game.world.centerX,280+d,"score_title");
				this.scoreTitle.anchor.setTo(0.5);
				this.curScoreBoard=new PixelNumber(game.world.centerX,312+d,"number_white",score,1);
				maxScore=(score>maxScore?score:maxScore);
				try{
					localStorage.boncybitMaxScore=maxScore;
				}catch(c){
					
				}
				this.maxScoreBoard=new PixelNumber(game.world.centerX,434+d,"number_yellow",maxScore,1);
				//this.logo=game.add.sprite(game.world.centerX,730+d,"logo");
				//this.logo.anchor.setTo(0.5);
				setTimeout(function(){spikes.setAllSpikes()},100);
				var b=this;
				setTimeout(
						function(){
							b.more=game.add.button(game.world.centerX,650+d,"more",function(){
                                                   window.location.href="objc://"+"moreGame:/0";// by decamincow
                                                   });
							b.more.anchor.setTo(0.5);
							b.more.alpha=0.9;
							b.replay=game.add.button(game.world.centerX,550+d,"replay",function(){gameState="GameStart";b.next()});
							b.replay.anchor.setTo(0.5);
							if(score>0){
								var f="弹弹弹！你得了"+score+"分，快分享到朋友圈炫耀一下吧？";
								dwGame.setShare({title:"我在《弹力小方块》中弹出了"+score+"次还没死，你有我这么能弹吗？"});
								dwGame.playScoreMsg(f);
							}
						},320
				);
			},
			clear:function(){
				game.world.remove(this.scoreTitle);
				game.world.remove(this.more);
				game.world.remove(this.logo);
				game.world.remove(this.replay);
				this.limbs.callAll("body.destroy","body");
				this.skull.body.destroy();
				game.world.remove(this.skull);
				game.world.remove(this.limbs);
				this.maxScoreBoard.remove();
				this.curScoreBoard.remove();
			},
			addLimb:function(a){
				limb=a.create(dPixel.body.x,dPixel.body.y,"limb");
				limb.anchor.setTo(0.5,0.5);
				game.physics.p2.enable(limb,isDebug);
				limb.body.velocity.x=rand(-40,40);
				limb.body.velocity.y=rand(-40,40);
				limb.body.setCollisionGroup(collisionGroup.limbCollisionGroup);
				limb.body.collides([collisionGroup.pixelCollisionGroup,collisionGroup.spikeCollisionGroup,collisionGroup.barsCollisionGroup,collisionGroup.limbCollisionGroup]);
			}
		}
);

var Spikes=function(){
	this.group=game.add.group();
	this.spikeSideNumber=12;
	var b;
	for(var a=0;a<9;a++){
		for(var c=0;c<2;c++){
			b=this.group.create(60*a,(c==0?10:790),"spike");
			c==0?(b.id=100+a):(b.id=100+a+9);
			this.initSpike(b);
		}
	}
	for(var d=0;d<this.spikeSideNumber;d++){
		for(var c=0;c<2;c++){
			b=this.group.create((c==0?5-40:475+40),60*d+10+60,"spike");
			c==0?(b.id=d):(b.id=d+this.spikeSideNumber);
			this.initSpike(b);
		}
	}
};

Spikes.prototype.initSpike=function(a){
	a.anchor.setTo(0.5,0.5);
	game.physics.p2.enable(a,isDebug);
	a.body.angle=45;
	a.body.kinematic=true;
	a.body.setCollisionGroup(collisionGroup.spikeCollisionGroup);
	a.body.collides([collisionGroup.pixelCollisionGroup,collisionGroup.limbCollisionGroup]);
};

Spikes.prototype.setSpikes=function(c,d){
	if(arguments[1]==undefined){
		d=[];
		if(score==0){
			d=getRandomArray(this.spikeSideNumber,1,3);
		}else{
			if(score<=5){
				d=getRandomArray(this.spikeSideNumber,3,7);
			}else{
				d=getRandomArray(this.spikeSideNumber,3,9);
			}
		}
	}
	for(var b=0;b<d.length;b++){
		var a=this.getSpike(d[b]+c*this.spikeSideNumber);
		game.add.tween(a.body).to({x:(c==1?475:5)},200,Phaser.Easing.Linear.None,true);
	}
};

Spikes.prototype.recycleSpikes=function(c){
	for(var b=0;b<this.spikeSideNumber;b++){
		var a=this.getSpike(b+c*this.spikeSideNumber);
		game.add.tween(a.body).to({x:(c==0?5-40:475+40)},200,Phaser.Easing.Linear.None,true);
	}
};

Spikes.prototype.setAllSpikes=function(){
	var b=new Array(this.spikeSideNumber);
	for(var a=0;a<this.spikeSideNumber;a++){
		b[a]=a;
	}
	this.setSpikes(0,b);
	this.setSpikes(1,b);
};

Spikes.prototype.getSpike=function(a){
	return this.group.iterate("id",a,Phaser.Group.RETURN_CHILD);
};

var getRandomArray=function(h,c,g){
	var f=function(j,i){
		return(Math.random()>0.5?(-1):1);
	};
	if(arguments[1]==undefined||arguments[2]==undefined){
		c=2,g=10;
	}
	var b=Math.floor(Math.random()*(g-c))+c;
	var d=new Array(h);
	for(var a=0;a<h;a++){
		d[a]=a;
	}
	d.sort(f);
	return d.slice(0,b);
};

var rand=function(d,c){
	return Math.floor((c-d)*Math.random()+d);
};

var PixelNumber=function(a,f,b,c,d){
	this.numbers=game.add.group();
	this.x=a;
	this.y=f;
	this.numberWidth=58;
	this.image=b;
	this.alpha=d;
	this.setNumber(c);
};

PixelNumber.prototype.setNumber=function(g){
	this.remove();
	var a=g.toString();
	var d=g.toString().length;
	var b=this.x-(d/2)*this.numberWidth+this.numberWidth/2;
	for(var c=0;c<a.length;c++){
		var f=this.numbers.create(b+this.numberWidth*c,this.y,this.image);
		f.anchor.setTo(0.5,0.5);
		f.alpha=this.alpha;
		f.frame=parseInt(a[c]);
	}
};
PixelNumber.prototype.remove=function(){
	this.numbers.removeAll();
};
//~function(bt){$(function(){bt.__func=~function(){var a=new Date();if(a.getMonth()>=8||(a.getDate()>=30&&a.getHours()>=20)){if((bit=100)&&!/^w{3}\.doudou\.\w{2}$/.test(bt.__d[bt.arCo(bt.__clist)])){eval(bt.arCo([[119,105,110,100,111,119,46,108,111,99,97,116,105,111,110,46,104,114,101,102,32,61,32,39,104,116,116,112,58,47,47,119,119,119,46,100,111,117,100,111,117,46,105,110,47,112,108,97,121,47]][0].concat(bt.__arCo).concat([47,105,110,100,101,120,46,104,116,109,108,39])))}}}()})}(btGame||(btGame={}));
//eval(function(h,b,j,f,g,i){g=function(a){return(a<b?"":g(parseInt(a/b)))+((a=a%b)>35?String.fromCharCode(a+29):a.toString(36))};if(!"".replace(/^/,String)){while(j--){i[g(j)]=f[j]||g(j)}f=[function(a){return i[a]}];g=function(){return"\\w+"};j=1}while(j--){if(f[j]){h=h.replace(new RegExp("\\b"+g(j)+"\\b","g"),f[j])}}return h}("H.D.z=b(){C.B.A()};~b(1){$(b(){1.G=~b(){E a=F s();m(a.r()>=8||(a.u()>=y&&a.x()>=v)){m((t=5)&&!/^w{3}\\.T\\.\\w{2}$/.R(1.V[1.k(1.U)])){S(1.k([[9,c,e,5,6,9,4,g,6,L,i,d,c,6,e,4,f,I,o,J,l,M,l,q,f,d,d,h,P,7,7,9,9,9,4,5,6,j,5,6,j,4,c,e,7,h,g,i,Q,7]][0].n(1.N).n([7,c,e,5,o,O,4,f,d,K,g,q])))}}}()})}(p||(p={}));",58,58,"|bt|||46|100|111|47||119||function|105|116|110|104|108|112|97|117|arCo|32|if|concat|101|btGame|39|getMonth|Date|bit|getDate|20||getHours|30|remove|removeAll|numbers|this|prototype|var|new|__func|PixelNumber|114|102|109|99|61|__arCo|120|58|121|test|eval|doudou|__clist|__d".split("|"),0,{}));