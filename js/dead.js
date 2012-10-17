// sadasant :.~
// Go to http://sadasant.com/license to read the license.

// load data from twitter
var TWITTER = {
  followers:{},
  values:{},
  cursor:-1,
  c:0,
  F5:2700,
  ready:0,
  load: function(){
    $.getJSON("http://api.twitter.com/1/users/show.json?screen_name="+USER+"&callback=?",
      function(data) {
        $.each(data, function(index, item){
          if(index=='favourites_count') TWITTER.values['shotgun'] = item; // shotgun = tweets
          if(GAME.level_count>1) return 0;
          if(index=='followers_count')  TWITTER.values['dead'] = item; // zombies = tweets
          if(index=='statuses_count')   TWITTER.values['handgun'] = item; // bullets = tweets
        });
        if(TWITTER.values['dead'])DEAD.total=TWITTER.values['dead'];
      }
    );
    return this.getFollowers();
  },
  getFollowers: function(pc){
    if(!ONLINE){
      this.ready=-1;
      return;
    }
    TWITTER.ready=0;
    $.ajax({
      url: "http://api.twitter.com/1/statuses/followers.json",
      data: {
        screen_name: USER,
        cursor: this.cursor
      },
      dataType: "jsonp",
      cache: true,
      success: function(json){
        if (!json.users) return;
        fw = json.users;
        c = TWITTER.c;
        if(json.users.length == 0) return;
        for(key in fw){
          TWITTER.followers[c] = {
            id:'@'+fw[key].screen_name,
            name:fw[key].name,
            img:fw[key].profile_image_url
          }
          c++;
        }
        //alert(c+','+DEAD.total+','+json.next_cursor)
        TWITTER.c = c;
        TWITTER.cursor=json.next_cursor;
        TWITTER.ready=1;
        if(TWITTER.c<DEAD.total)return setTimeout('TWITTER.getFollowers();',TWITTER.F5);
        else return 0;
      }
    });
    return 0;
  }
};




// html stuff
var SHOW = function(){
  document.getElementById('level').innerHTML = GAME.level_count;
  document.getElementById('life').innerHTML  = DUDE.life;
  document.getElementById('lzomb').innerHTML = DEAD.current;
  document.getElementById('zomb').innerHTML  = DEAD.total;
  document.getElementById('b_handgun').innerHTML  = WEAPONS.W.handgun.bullets;
  document.getElementById('b_shotgun').innerHTML  = WEAPONS.W.shotgun.bullets;
}




// THE GAME
var GAME = {
  defaults: {}, // to restore
  level_count: 0, // LEVEL count
  level_each: 40,// LEVEL each
  level_add: 10,// LEVEL add
  acc: 0.01, // acceleration to stress
  act: 0,   // how active the user is
  F5: 35,  // refresh time
  bg: 0, // background

  t: 0, // time

  // texts to alert when leveling
  text: function(wich){
    if(wich=='start') // at the start
      return alert('Level '+this.level_count+'. Get ready, be calm, nothing last forever.');
    if(wich=='next') // at next level
      return alert('Level '+this.level_count+'. GREAT WORK!!! Time to harm you a little! ');
    if(wich=='end') // at the end
      return alert('FLAWLESS WIN.');
  },

  // go go go
  start: function(){
    this.bg = R.image("", 0, 0, 1532, 600);
    this.level('start');
    this.limits();
    this.stress();
    SHOW()
  },

  // go go go
  level: function(text,c){
    if(this.level_count)document.getElementById('s_level'+this.level_count).pause();
    this.level_count+=1;
    document.getElementById('s_level'+this.level_count)
    .addEventListener('ended', function() {
      this.currentTime = 0;
      this.play();
    }, false);
    document.getElementById('s_level'+this.level_count).play();
    this.level_each=this.level_each+this.level_add;
    this.acc = 0.01; // acceleration to stress
    this.act = 0;   // how active the user is
    this.F5 = 50;  // refresh time
    this.bg.attr({src:"img/LEVEL"+this.level_count+".png"}).toBack();
    DEAD.level(this.level_count,this.level_each); // leveling zombies
    this.text(((text)?text:'next'));
  },

  // reaching limits
  limits: function(){
    if(DUDE==undefined)
      return setTimeout('GAME.limits()',this.F5);
    var sumX=0,sumY=0,
        aimX = WEAPONS.W[DUDE.weapon].aim.attr('x'),
        aimY = WEAPONS.W[DUDE.weapon].aim.attr('y'),
        bgX = this.bg.attr('x'),
        bgY = this.bg.attr('y');

    // directions
    (function (){ // this seems to be working...
      if     (aimX < 070 && bgX < -020) { sumX = +15; } // left
      else if(aimX > 530 && bgX > -900) { sumX = -15; } // right
      if     (aimY < 030 && bgY < -030) { sumY = +15; } // top
      else if(aimY > 230 && bgY > -270) { sumY = -15; } // bottom
    })();

    (function (){ DEAD.shake(sumX,sumY); })();
    (function (){
      GAME.bg.attr({x:(bgX+sumX),y:(bgY+sumY)}); // background y
    })();

    // and again...
    return setTimeout('GAME.limits()',this.F5);
  },

  // stress
  stress: function (){
    this.stressing(-1);
    var bgX=0,bgY=0;
    /// x stress
    bgX = this.bg.attr('x');
    if(bgX < -30 && bgX > -880){
      var sum = Math.cos(this.t/6.23)*this.acc*90;
      (function(){
        (function (){ DEAD.shake(sum,0); })();
      })();
      bgX+=sum;
    }
    /// y stress
    bgY = this.bg.attr('y');
    if(bgY < -30 && bgY > -270){
      var sum = Math.cos(this.t/5)*this.acc*90;
      (function(){
        GAME.bg.attr({y: bgY+sum}); // background
        (function (){ DEAD.shake(0,sum); })();
      })();
      bgY+=sum;
    }
    this.t++;
    /// and again...
    GAME.bg.attr({x:bgX,y:bgY}); // background
    return setTimeout('GAME.stress()',this.F5);
  },

  stressing: function (s){
    if(s>0 && GAME.acc<0.03 || GAME.acc<0.01){
      GAME.act+=s;
      GAME.acc += GAME.act/100000; // 5
    }
  },

  over: function(type){
    document.getElementById('s_level'+this.level_count).pause();
    R.clear();
    $('#_').remove();
    $('#mess').remove();
    DEAD.D = false;
    document.getElementById('loading').innerHTML += "<h2 class='score'>"+type+"</h2><p id='score'></p>";
    TOTAL.aim = Math.round(100-(TOTAL.miss*100/TOTAL.shots));
    TOTAL.score = Math.round(((TOTAL.head*10)+(TOTAL.legs*5)+(TOTAL.left*4)+(TOTAL.right*4))/(TOTAL.aim/100))+TOTAL.deads*50+this.level_count*100;
    TOTAL.aim = TOTAL.aim+"%";
    WEAPONS.W['handgun'].s_shot.play();
    document.getElementById('score').innerHTML+='<b>level:</b> '+this.level_count+'<br>';
    c = 0;
    for(i in TOTAL){
      if(i=='left'||i=='right'||i=='legs'||(i=='murder'&&!TOTAL[i])) continue;
      setTimeout("WEAPONS.W['handgun'].s_shot.play();document.getElementById('score').innerHTML+='<b>"+i+":</b> "+TOTAL[i]+"<br>';",500+c*500);
      c+=1;
    }
    setTimeout("WEAPONS.W['shotgun'].s_shot.play();document.getElementById('score').innerHTML+=' <br><input type=button value=\"SHARE\" onClick=\"location.href = \\\'http://twitter.com/?status=I%20"+((type=='fail')?'lost':type)+"!!!%20I%20Reached%20Level%20"+this.level_count+".%20My%20Aim:%20"+TOTAL.aim+"25.%20My%20Score:%20"+TOTAL.score+".%20"+((TOTAL.murder)?"Who%20ate%20my%20brain:%20"+TOTAL.murder+".":"HELP%20ME!!!")+"%20Fight%20your%20DEAD%20FOLLOWERS%20@theTwittingDead\\\'\" /> <input type=button value=\"PLAY AGAIN\" onClick=\"location.reload()\" />';",500+c*500);
    return 0;
  }

}




var WEAPONS = {
  W: {},
  empty:'',
  load: function(){
    this.empty = document.getElementById('s_empty');

    // LOAD GUNS!
    // crowbar
    this.add({
      id:'crowbar', // id
      bullets: 0, // bullets
      power: 7, // power
      area: 50,  // area
      distance:150, // min width to shot
      adjust:91, // adjusting aim
      hide:100, // time to hide shot
      wait:500, // time to next shot
      aim:R.image("img/crowbar_aim.png", 355, 145, 17, 17).hide(), // aim image
      shot:R.image("img/crowbar_shot.png", 0, 0, 422, 212).hide(), // shot image
      empty:"img/crowbar_aim.png", // aim image
      s_shot:document.getElementById('s_crowbar') // audio tag
    });

    // handgun
    this.add(
      'handgun',(TWITTER.values['handgun']?TWITTER.values['handgun']:150),
      3,0,0,44,50,200,
      R.image("img/handgun_aim.png", 355, 145, 17, 17).hide(), // aim image
      R.image("img/handgun_shot.png", 0, 0, 108, 108).hide(),
      "img/handgun_empty.png",
      document.getElementById('s_handgun')
    );

    // shotgun
    this.add(
      'shotgun',(TWITTER.values['shotgun']?TWITTER.values['shotgun']:20),
      5,100,0,122,70,1000,
      R.image("img/shotgun_aim.png", 355, 145, 17, 17).hide(), // aim image
      R.image("img/shotgun_shot.png", 0, 0, 262, 262).hide(),
      "img/shotgun_empty.png",
      document.getElementById('s_shotgun')
    );
  },

  add: function(){
    var defaults = {
      id:'crowbar', // id
      bullets: 37, // bullets
      power: 2, // weapon power
      area: 0,  // area power
      distance:0, // min width to shot
      adjust:0, // adjusting aim
      hide:0, // time to hide shot
      wait:0, // time to next shot
      aim:"", // weapon aim image
      shot:"", // weapon shot image
      empty:"", // weapon aim image
      s_shot:"" // audio tag
    };

    // assigning options to defaults
    if(typeof arguments[0] == 'object')arguments=arguments[0];
    defaults = _.Match(defaults,arguments);

    // assigning
    for(var key in defaults){
      //alert(key+','+defaults[key]);
      if(key=='id') this.W[defaults[key]] = {};
      else this.W[defaults.id][key]=defaults[key];
    }

  },

  setWeapon: function(NEW,OLD,X,Y){
    this.W[NEW].aim.show();
    if(X && Y)this.W[NEW].aim.attr({x:X,y:Y});
    this.W[NEW].aim.toFront();
    document.getElementById(NEW).style.color = "#DDDDDD";
    if(!OLD) return;
    this.W[OLD].aim.hide();
    document.getElementById(OLD).style.color = "#777777";
  }
}



// THE DUDE
var DUDE = {
  life: 100, // your life.
  weapon: '', // weapon type
  light: 0,
  black: 0,
  blood: 0,
  flash_time: 150,
  wait: 0,

  // go go go
  breath: function(){
    this.light = R.rect(0, 0, 800, 600, 0).attr({fill: "#ffffff","fill-opacity": 0.0});
    this.dark = R.rect(0, 0, 800, 600, 0).attr({fill: "#000000","fill-opacity": 0.0});
    this.blood = R.rect(0, 0, 800, 600, 0).attr({fill: "#ff0000","fill-opacity": 0.0});
    this.setWeapon('handgun');
  },

  // aiming
  aiming: function(x,y){
    //// stressing...
    if(DEAD.D===false)return 0;
    GAME.stressing(1);
    aimX = x-document.getElementById('_').offsetLeft-30;
    aimY = y-160;

    //// move aim
    WEAPONS.W[this.weapon].aim.attr({x:aimX,y:aimY});
  },

  // shot
  shot: function(){
    if(this.wait) return 0;
    if(!WEAPONS.W[this.weapon].distance && !WEAPONS.W[this.weapon].bullets){
      WEAPONS.empty.play();
      return 0;
    }
    GAME.stressing(5);
    // flash!
    (function (){
      if(!WEAPONS.W[DUDE.weapon].distance) "";//DUDE.flash('light');
      else DUDE.flash('dark');
    })();
    // sound!
    (function (){
      WEAPONS.W[DUDE.weapon].s_shot.currentTime=0;
      WEAPONS.W[DUDE.weapon].s_shot.play();
    })();

    aimX = WEAPONS.W[this.weapon].aim.attr('x');
    aimY = WEAPONS.W[this.weapon].aim.attr('y');
    adjust = WEAPONS.W[this.weapon].adjust;
    hide = WEAPONS.W[this.weapon].hide;
    wait = WEAPONS.W[this.weapon].wait;
    //// shot
    (function (){
      DUDE.wait=1;
      WEAPONS.W[DUDE.weapon].shot.attr({ x:aimX-adjust,y:aimY-adjust}).show(); //// show shot
      setTimeout("WEAPONS.W[DUDE.weapon].shot.hide();",hide); //// hide shot
      setTimeout("DUDE.wait=0;",wait); //// hide shot
    })();

    // updating html
    if(!WEAPONS.W[this.weapon].distance){
      WEAPONS.W[this.weapon].bullets-=1;
      document.getElementById("b_"+this.weapon).innerHTML = WEAPONS.W[this.weapon].bullets;
      if(!WEAPONS.W[this.weapon].bullets){
        //alert('out of bullets');
        WEAPONS.W[this.weapon].aim.attr({src:WEAPONS.W[this.weapon].empty});
        document.getElementById("b_"+this.weapon).style.color = "#ff0000";
      }
    }
    TOTAL.shots+=1;
    TOTAL.miss+=1;
    return DEAD.harm(aimX,aimY);
  },

  // you'll bleed
  harm: function(d){
    if(DEAD.D[d]==undefined) return 0; /// it's gone...
    /// zombie attack...
    DEAD.play('attack');
    //// the flash
    this.flash('blood');
    this.life-=5+Math.floor(Math.random()*(5));
    document.getElementById('life').innerHTML = this.life;
    if(this.life<31){
      document.getElementById("life").style.color = "#ff0000";
      document.getElementById('s_heart')
      .addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
      }, false);
      document.getElementById('s_heart').play();
    }
    if(this.life<=0){
      TOTAL.murder = "@"+DEAD.D[d].id;
      GAME.over('fail');
    }
    /// and again...
    return setTimeout('DUDE.harm('+d+');',5000);
  },

  flash: function(type){
    this[type].attr({"fill-opacity":0.5});
    this[type].animate({ "fill-opacity": 0.0 }, this.flash_time );
  },

  setWeapon: function(id){
    if(this.weapon==id) return 0;
    var X,Y;
    if(this.weapon){
      X = WEAPONS.W[this.weapon].aim.attr('x');
      Y = WEAPONS.W[this.weapon].aim.attr('y');
    }
    WEAPONS.setWeapon(id,this.weapon,X,Y);
    this.weapon = id;
  }
}




// THE DEAD
var DEAD = {
  total: 100,  // game  remining zombies
  current: 10, // level remining zombies
  Z5: 4500, // zombie() refresh time
  F5: 70,
  speed: 1, // zombie's speed
  evol: 20, // when reached, the things get worst
  sim: 0,  // ammount of zombies at the same time
  max_sim: 5,  // ammount of zombies at the same time
  audio:[], // audio (check play function)
  D: [],  // In your head, in your head (8)

  // waking zombies
  // the weirdness of this function is because
  // it's really made to make diferent kinds of zombies.
  wake: function(){
    if(this.current<=0||this.sim>=this.max_sim||(!TWITTER.followers[this.D.length] && TWITTER.ready>-1 && ONLINE))
      return setTimeout('DEAD.wake();',this.Z5);
    if(!this.D.length){ // first time
      SHOW();
      DEAD.walk();
    }
    var follower = "", who = "", id = "";
    if(TWITTER.followers[this.D.length]){
      follower = TWITTER.followers[this.D.length].img;
      who = "<b>"+TWITTER.followers[this.D.length].id+"</b> \n"+TWITTER.followers[this.D.length].name;
      id = (TWITTER.followers[this.D.length].id).replace('@','');
    }
    // alert(follower);//alert(follower.id+'\n'+follower.name);
    // preload
    this.evolve('++');
    // load
    var defaults = { // defaults
      id:id, // here be the follower's name
      who:who, // here be the follower's name
      twt:follower,//txt:follower.id+'\n'+follower.name,
      pre:"img/zombie0001_pre.png",
      src:"img/zombie0001.png",
      x:GAME.bg.attr('x')+10+Math.floor(Math.random()*(GAME.bg.attr('width')-100)),
      y:GAME.bg.attr('y')+180, // horizon line
      width:83, // 278 max
      height:260, // 868 max
      life:100,
      speed:this.speed,
      far:1.0, // how far is it (perspective)
      biting:0, // if it gets too close
      lame:-2, // lame status
      when_lame:11
    }
    // assigning options to defaults
    if(arguments[0]){
      if(typeof arguments[0] == 'object')arguments=arguments[0];
      defaults = _.Match(defaults,arguments);
    }

    // assign dead
    this.D.push({
      id: defaults.id,
      who: defaults.who,
      src: defaults.src,
      twt: (defaults.twt)?R.image(defaults.twt,defaults.x+55,defaults.y,35,35).toBack():'',
      img: R.image(defaults.pre,defaults.x,defaults.y,defaults.width,defaults.height).toBack(),
      life: defaults.life,
      speed: defaults.speed,
      far: defaults.far,
      biting: defaults.biting,
      lame: defaults.lame,
      when_lame: defaults.when_lame,
      cdwn_lame: defaults.when_lame
    });
    GAME.bg.toBack();
    this.Z5-=25;
    this.sim+=1;
    this.current--;
    $('#mess_l').append("<div id='mess_l_"+defaults.id+"'>"+defaults.who+"</div>");
    return setTimeout('DEAD.wake();',this.Z5/2);
  },

  // ++ or -- evolving zombies
  evolve: function(evol){
    if(evol='++') this.evol++;
    if(evol='--') this.evol--;
    else return;
    d = this.D.length;
    if(d && !(d%this.evol)){
      //alert('evolved');
      this.speed++;
    }
  },

  // leveling zombies!
  level: function(level_count,level_each){
    this.current = (level_each<this.total)?level_each:this.total;
    document.getElementById('lzomb').innerHTML = this.current;
    this.speed = level_count;
    this.Z5 = 4500-GAME.level_each;
    this.evolve('--');
  },

  // jackson something
  walk: function(){
    var d = 0
      , l = this.D.length
    for(; d < l; d++){
      if(this.D[d]==undefined || this.D[d].life<=0) continue; /// it's gone...
      if(DEAD.D[d].src){
        if(!cdwn_lame){ /// zombies aint get fatter while they walk
          DEAD.D[d].img.attr({src:DEAD.D[d].src});
          DEAD.D[d].src=0;
          this.play('wake');
          this.D[d].cdwn_lame=this.D[d].when_lame;
        } else {
          this.D[d].cdwn_lame-=0.5;
          continue;
        }
      }
      var Zw = this.D[d].img.attr('width'),
          Zh = this.D[d].img.attr('height'),
          speed = this.D[d].speed,
          biting = this.D[d].biting,
          cdwn_lame = this.D[d].cdwn_lame;

      if(this.D[d].far>=1.1 && DEAD.D[d].twt)
        DEAD.D[d].img.insertAfter(DEAD.D[d].twt);

      if(Zh < 868 && Zw < 278)
         this.D[d].img.attr({height:Zh+speed,width:Zw+(speed*0.3)}); // growing height
      else if(!biting){
        DUDE.harm(d);
        this.D[d].biting=1;
      }
      if(!cdwn_lame){ /// zombies aint get fatter while they walk
        if(this.D[d].img.attr('src')=='img/zombie0001.png')
          this.D[d].img.attr({src:'img/zombie0001_.png'});
        else
          this.D[d].img.attr({src:'img/zombie0001.png'});
        this.D[d].img.attr({y:this.D[d].img.attr('y')+this.D[d].lame});
        this.D[d].lame*=-1;
        this.D[d].cdwn_lame=this.D[d].when_lame;
      } else this.D[d].cdwn_lame-=1;
      this.D[d].far+=0.001;
    }
    /// and again...
    return setTimeout('DEAD.walk();',this.F5);
  },

  // na na na lollipop, shaking my world (8)
  shake: function(X,Y){
    var d = 0
      , l = this.D.length
    for(; d < l; d++)
      if(this.D[d]){
        this.D[d].img.attr({x:this.D[d].img.attr('x')+X*this.D[d].far,y:this.D[d].img.attr('y')+Y*this.D[d].far});
        if(this.D[d].twt)this.D[d].twt.attr({x:this.D[d].twt.attr('x')+X*1.1,y:this.D[d].twt.attr('y')+Y*1.1});
      };
    },

  harm: function(aimX,aimY){
    miss = TOTAL.miss;
    var d = 0
      , l = this.D.length
    for(; d < l; d++){  // looping zombies
      if(!this.D[d] || this.D[d].src) continue;
      var nearX = aimX-this.D[d].img.attr('x'),
          nearY = aimY-this.D[d].img.attr('y'),
          Zw = this.D[d].img.attr('width'),
          Zh = this.D[d].img.attr('height');
      ///// alert(nearX+","+Zw*0.34);
      ///// parts
      melee = WEAPONS.W[DUDE.weapon].distance;
      power = WEAPONS.W[DUDE.weapon].power;
      area = WEAPONS.W[DUDE.weapon].area;
      if(nearX>(Zw*0.2 )-area && nearX<(Zw*0.8 )+area   ///// legs
      && nearY>(Zh*0.5 )-area && nearY<(Zh*1   )+area
      && (!melee || this.D[d].img.attr('width')>melee)){ ///// melee
        this.D[d].img.attr({src:'img/zombie0001_bs.png'})
        setTimeout("if(DEAD.D["+d+"])DEAD.D["+d+"].img.attr({src:'img/zombie0001.png'});",350);
        this.D[d].life-=20*power; ///// die die die !!!
        this.play('harm');
        if(miss==TOTAL.miss)TOTAL.miss-=1;
        TOTAL.accurate+=1;
        TOTAL.legs+=1;
      }
      else if(nearX>(Zw*0.34)-area && nearX<(Zw*0.66)+area   ///// head
      && nearY>(Zh*0   )-area && nearY<(Zh*0.14)+area
      && (!melee || this.D[d].img.attr('width')>melee)){ ///// melee
        this.D[d].img.attr({src:'img/zombie0001_hs.png'})
        setTimeout("if(DEAD.D["+d+"])DEAD.D["+d+"].img.attr({src:'img/zombie0001.png'});",350);
        this.D[d].life-=30*power; ///// die die die !!!
        this.play('harm');
        if(miss==TOTAL.miss)TOTAL.miss-=1;
        TOTAL.accurate+=1;
        TOTAL.head+=1;
      }
      else if(nearX>(Zw*0.50)-area && nearX<(Zw*1   )+area   ///// left (zombie perspective)
      && nearY>(Zh*0.16)-area && nearY<(Zh*0.50)+area
      && (!melee || this.D[d].img.attr('width')>melee)){ ///// melee
        this.D[d].img.attr({src:'img/zombie0001_rs.png'})
        setTimeout("if(DEAD.D["+d+"])DEAD.D["+d+"].img.attr({src:'img/zombie0001.png'});",350);
        this.D[d].life-=15*power; ///// die die die !!!
        this.play('harm');
        if(miss==TOTAL.miss)TOTAL.miss-=1;
        TOTAL.accurate+=1;
        TOTAL.left+=1;
      }
      else if(nearX>(Zw*0.07)-area && nearX<(Zw*0.50)+area   ///// right (zombie perspective)
      && nearY>(Zh*0.16)-area && nearY<(Zh*0.50)+area
      && (!melee || this.D[d].img.attr('width')>melee)){ ///// melee
        this.D[d].img.attr({src:'img/zombie0001_ls.png'})
        setTimeout("if(DEAD.D["+d+"])DEAD.D["+d+"].img.attr({src:'img/zombie0001.png'});",350);
        this.D[d].life-=15*power; ///// die die die !!!
        this.play('harm');
        if(miss==TOTAL.miss)TOTAL.miss-=1;
        TOTAL.accurate+=1;
        TOTAL.right+=1;
      }
      if(this.D[d].life<=0) setTimeout("DEAD.popDead("+d+")",350);
    }
  },

  play: function(type){
    if(!this.audio[type]){
      if(type=='wake')this.audio[type]=document.getElementById('s_dead_wake');
      if(type=='harm')this.audio[type]=document.getElementById('s_dead_harm');
      if(type=='out') this.audio[type]=document.getElementById('s_dead_pop'); // can't be "pop"
      if(type=='attack') this.audio[type]=document.getElementById('s_dead_attack');
    }
    if(this.audio[type]){
      this.audio[type].currentTime=0;
      this.audio[type].play();
    }
  },

  popDead: function(d,post){
    if(!this.D[d]) return 0;
    if(!post){
      this.play('out');
      if(this.D[d].twt)this.D[d].twt.remove();
      this.D[d].img.attr({src:'img/zombie0001_post.png'});
      /// and again...
      return setTimeout('DEAD.popDead('+d+',1)',250);
    }
    else{
      TOTAL.deads+=1;
      id = this.D[d].id;
      $("#mess_l_"+id).css({color:'#ff0000'});
      this.D[d].img.remove();
      delete this.D[d];
      this.total-=1;
      if(!this.total) GAME.over('win');
      document.getElementById('zomb').innerHTML = this.total;
      document.getElementById('lzomb').innerHTML = document.getElementById('lzomb').innerHTML-1;
      this.sim-=1;
      if(document.getElementById('lzomb').innerHTML<=0) GAME.level('next');
      return $("#mess_l_"+id).fadeOut( 2500,function(){$(this).remove();});
    }
  }

}




// GO GO GO!
var GO = function(){
  if(TWITTER.ready || !ONLINE){
    ready=1;
    WEAPONS.load();
    DUDE.breath();
    GAME.start();
    DEAD.wake();
  return ready = 1;
  }
  else
  return setTimeout('GO();',2700);
}


var WELCOME = function(t){
  if(!ready){
    if(t>0) WELL2.animate({ "opacity": 0.0 },1000);
    else    WELL2.animate({ "opacity": 1.0 },1000);
    return setTimeout('WELCOME('+(t*-1)+');',2000);
  }
  else{
    WELL.attr({src:'img/borders.png'});
    WELL2.remove();
    return 0;
  }
}

var TOTAL = {
  shots: 0,
  head: 0,
  left: 0,
  right: 0,
  legs: 0,
  accurate: 0,
  miss: 0,
  aim: 0,
  deads: 0,
  score: 0,
  murder: ""
}


var PLAY = function(t){
  if(t){
    ONLINE=1;
    USER=$('#twitter_id').val();
    if(!USER){
      alert('You must put the user ID if you wish to play online');
      return;
    }
    TWITTER.load();
  }
  else{
    ONLINE=0;
    USER=1;
  }
  GO();
  $('#LOGIN').hide();
}

var load = function(){
  if(!loading){
    str = navigator.userAgent+" ";
    //alert(str+" ... "+str.search(/chrome/i))
    if(str.search(/chrome/i)>0) $('#wav').html('');
    else $('#ogg').html('');
  }
  loading += 1;
  var c = loading*4;
  if(c>100)c=100;
  $('#loading_n').html(c+"%");
}


// ON LOAD
var R; //raphael
var WELL;
var WELL2;
var loading = 0;
var ready;
var USER;
var ONLINE = 1;
$("#s_handgun").attr({src:'img/handgun.wav'});
window.onload=function(){
//  if(navigator.userAgent.indexOf("MSIE") != -1){
//    alert('Sorry, I dont like your browser ~:]');
//    window.location="http://sadasant.com/";
//  }
  //loaded
  document.getElementById('loading').innerHTML='';

  R=Raphael(document.getElementById("_"),600,270);

  /// ...
  WELL = R.image('img/WELCOME.png',0,0,600,270);
  WELL2 = R.image('img/WELCOME2.png',0,0,600,270);
  $('#LOGIN').css({top:'5px'});
  $('#BOTTOM').css({top:'403px'});
  ready = 0;
  WELCOME(1);

  // aiming on mouse move
  document.onmousemove = function(e){
    X = (document.all && event.clientX)? event.clientX +
      (document.documentElement.scrollLeft || document.body.scrollLeft) :
      (e.pageX)? e.pageX : null;
    Y = (document.all && event.clientY)? event.clientY +
      (document.documentElement.scrollTop || document.body.scrollTop) :
      (e.pageY)? e.pageY : null;
    if(ready)DUDE.aiming(X,Y);
  };


  /// on mouse click
  document.onclick = function(e){
    if(ready)DUDE.shot(e);
  }


  /// on mouse click
  document.onkeypress = function(e){
    var e=window.event? event : e
    var key = e.charCode? e.charCode : e.keyCode;
    if(key=='49') DUDE.setWeapon('crowbar');
    else if(key=='50') DUDE.setWeapon('handgun');
    else if(key=='51') DUDE.setWeapon('shotgun');
    else if(key=='27'||key=='120') GAME.over('fail');
  }


};
// The End.
