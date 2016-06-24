/*!
 * XUI v1.0.0
 * Copyright 2016 WWW.YUNCAIJING.COM, Inc.
 */

if (typeof jQuery === 'undefined') {
    throw new Error('XUI\'s JavaScript requires jQuery')
}

+function ($) {
    'use strict';
    var version = $.fn.jquery.split(' ')[0].split('.')
    if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1)) {
        throw new Error('XUI\'s JavaScript requires jQuery version 1.9.1 or higher')
    }else{
        window.XUI = {
            version: '1.0.0',
            reg: {
                //匹配所有空白字符
                trimAll: /\s/g,
                qq: /^[1-9]\d{4,11}$/,
                //email: /^[a-z\d]+[\w.-]*@[a-z\d]+(\-*[a-z\d])*(\.[a-z]{2,6})+$/i,
                email: /^[a-z\d]([\w-.]+(?:[a-z\d]))?@[a-z\d]+(\-*[a-z\d])*(\.[a-z]{2,6})+$/i,
                //匹配手机号
                tel: /^1[34578]\d{9}$/,
                //匹配固号
                ftel: /^[1-9]\d{0,3}-\d{3}-\d{8}$/,
                //匹配身份证
                id: /^[1-8]{2}\d{4}[12][089]\d{2}[01]\d[0-3]\d{4}[\dX]$/i,
                formatPassword: /[^\w\s\\\[\]`~!@#$%^&*()-+={};:'"|,.<>/?]/g
            }
        };
        window.Base = {
            siteUrl: location.protocol + '//' + location.hostname,
            loadingPageHtml: '<div class="loading-page"></div>',
            str: {
                trimAll: function( string ){
                    return string.replace( XUI.reg.trimAll, '' );
                }
            },
            //静态模板内路径(图片)赋值
            formatTemplate: function( msg ){
                return msg.replace(/\{\s*assetsUrl\s*\}/g, Base.assetsUrl);
            }
        };
        //静态资源路径，针对html目录下一级目录
        Base.assetsUrl = '../../../assets/';

        //本地调试，针对html目录下二级目录下的*.html
        if( /^http:\/\/localhost:.+pc\/html\/.+\/[\w-]+\.html/.test(location.href) ){

            //Base.assetsUrl = '../../assets/';

        //线上路径
        }else if( /www\..*yuncaijing\.com/.test( location.host ) ){

            //Base.assetsUrl = '/res/pc/assets/';

        }

        Base.imgErrUrl = Base.assetsUrl + 'img/img-err.jpg';
        Base.zdf = function( zdf ){
            var className = 'stock-gray';
            zdf = '' + zdf;
            switch ( zdf.charAt(0) ){
                case '-':
                    className = 'stock-green';
                    break;
                case '+':
                    className = 'stock-red';
                    break;
                default:
                    if( zdf > '0.00' ){
                        className = 'stock-red';
                        zdf = '+' + zdf;
                    }else if( zdf < '0.00' ){
                        className = 'stock-green';
                        zdf = '-' + zdf;
                    }
            }
            if( zdf.slice(-1) !== '%' ){
                zdf += '%';
            }
            return {
                className: className,
                zdf: zdf
            }
        };
        //登录更新
        Base.updatesOfLoginFnSet = [];
        Base.updatesOfLogin = function( fn ){
            if( typeof fn === 'function'){
                Base.updatesOfLoginFnSet.push( fn );
            }
        };
    }
}(jQuery);

//imgLoad
+function(Base){
    Base.imgLoad = function( url, done, err ){
        var oImg = new Image();

        function doneHandler(){
            oImg.removeEventListener('load', doneHandler );
            typeof done === 'function' && done( url );
        }
        oImg.addEventListener('load', doneHandler );

        function errHandler(){
            oImg.removeEventListener('error', errHandler );
            typeof err === 'function' && err( url );
        }
        oImg.addEventListener('error', errHandler );

        oImg.src = url;
    };
}(Base);

/*
 * WebSocket
 */
+function( Base ){
    'use strict';
    function Ws( origin ){
        return new Ws.fn.init( origin );
    }

    Ws.fn = Ws.prototype = {
        constructor: Ws,
        init: function( origin ){
            this.origin = origin || 'ws://121.40.61.179:8888';
            this.ws = new WebSocket( this.origin );
        },
        proxy: function( method, fn ){
            if( method === 'send' ){
                this.ws && this.ws.send( typeof fn === 'string' ? fn : JSON.stringify(fn) );
            }else{
                this.ws.addEventListener( method, function( e ){
                    fn.call( this,
                        method === 'message' ? JSON.parse( e.data ) : e
                    );
                }.bind( this ), false );
            }
            return this;
        },
        open: function( fn ){
            return this.proxy( 'open', fn );
        },
        close: function( fn ){
            return this.proxy( 'close', fn );
        },
        error: function( fn ){
            return this.proxy( 'error', fn );
        },
        msg: function( fn ){
            return this.proxy( 'message', fn );
        },
        send: function( data ){
            return this.proxy( 'send', data );
        }
    };

    Ws.fn.init.prototype = Ws.fn;
    Base.ws = Ws;
}( Base );

//notification.js
+function($, Base){
    'use strict';
    function Noti( options ){
        return new Noti.fn.init( options );
    }

    Noti.title = '';
    Noti.config = {
        dir: 'ltr',
        tag: '',
        icon: '',
        body: ''
    };

    Noti.fn = Noti.prototype = {
        constructor: Noti,
        init: function( options ){
            var self = this;
            var title = options.title || Noti.title;
            delete options.title;
            options = $.extend( {}, Noti.config, options );
            if('Notification' in window){
                if( Notification.permission === 'granted' ){
                    self.noti = new Notification( title, options );
                }else if( Notification.permission !== 'denied' ){
                    Notification.requestPermission(function( prem ){
                        if( prem === 'granted' ){
                            self.noti = new Notification( title, options );
                            self.show().close().error().click();
                        }
                    });
                }
            }
        },
        proxy: function( method, fn ){
            this[ 'f' + method ] = fn || this[ 'f' + method ] || function(){};
            if( this.noti ){
                this.noti.addEventListener( method, function(){
                    this[ 'f' + method ].call( this );
                }.bind( this ), false );
            }
            return this;
        },
        show: function( fn ){
            return this.proxy( 'show', fn );
        },
        close: function( fn ){
            return this.proxy( 'close', fn );
        },
        error: function( fn ){
            return this.proxy( 'error', fn );
        },
        click: function( fn ){
            return this.proxy( 'click', fn );
        }
    };

    Noti.fn.init.prototype = Noti.fn;
    Base.notification = Noti;
}(jQuery, Base);

//audio.js
+function($, Base){
    Base.audio = function( url ){
        return $('<audio>').attr('id', 'xui-audio-' + Date.now())
            .attr('src', url )
            .appendTo( $('body') )[0];
    };
}(jQuery, Base);

//store.js
+function(Base){
    Base.store = {
        s: localStorage
    };
    Base.session = {
        s: sessionStorage
    };

    /**
     * 存储 key 的值为 val
     * @param {String} key
     * @param {All} val
     */
    Base.session.set = Base.store.set = function( key, val ){
        if( typeof val != 'undefined' ){
            this.s.setItem( key, JSON.stringify( val ) );
        }
    };

    /**
     * 获取 key 的值
     * @param  {String} key
     * @return {All}
     */
    Base.session.get = Base.store.get = function( key ){
        return JSON.parse( this.s.getItem( key ) );
    };

    /**
     * @param  {String} key	可选，有则移除 key 的记录。无则清空所有存储
     */
    Base.session.remove = Base.store.remove = function( key ){
        this.s[ typeof key != 'undefined' ? 'removeItem' : 'clear' ]( key );
    };

    /**
     * 遍历所有存储
     * @param  {Function} fn
     */
    Base.session.forEach = Base.store.forEach = function( fn ){
        for( var i = 0, type = this.s, len = type.length, key; i < len; i++ ){
            key = type.key( i );
            fn.call( this, key, this.get( key ) );
        }
    };
}(Base);

//transition.js v1.0.0
+function ($) {
    'use strict';

    // CSS TRANSITION SUPPORT (Shoutout: http://www.modernizr.com/)
    // ============================================================

    function transitionEnd() {
        var el = document.createElement('xui')

        var transEndEventNames = {
            WebkitTransition : 'webkitTransitionEnd',
            MozTransition    : 'transitionend',
            OTransition      : 'oTransitionEnd otransitionend',
            transition       : 'transitionend'
        }

        for (var name in transEndEventNames) {
            if (el.style[name] !== undefined) {
                return {
                    end: transEndEventNames[name]
                }
            }
        }

        return false // explicit for ie8 (  ._.)
    }

    // http://blog.alexmaccaw.com/css-transitions
    $.fn.emulateTransitionEnd = function (duration) {
        var called = false
        var $el = this
        $(this).one('xuiTransitionEnd', function () {
            called = true
        })
        var callback = function () {
            if ( !called ){
                $($el).trigger($.support.transition.end)
            }
        }
        setTimeout(callback, duration)
        return this
    }

    $(function () {
        $.support.transition = transitionEnd()

        if (!$.support.transition) return

        $.event.special.xuiTransitionEnd = {
            bindType: $.support.transition.end,
            delegateType: $.support.transition.end,
            handle: function (e) {
                if ( $(e.target).is(this) ){
                    return e.handleObj.handler.apply(this, arguments)
                }
            }
        }
    })

}(jQuery);

/**
 * throttle.js
 * @param  {Function} fn
 * @param  {Number}   delay 可选，值 >= 0
 * @param  {Number}   must  可选，值 >= 0
 * @return {Function}       run When trigger it's event
 */
XUI.throttle = function( handler, delay, must ){
    'use strict';
    if( !delay && !must ){
        return handler;
    }

    var startTime = new Date(),
        timer;

    return function( e ){
        var context = this;

        if( delay ){
            clearTimeout( timer );
            timer = setTimeout(function(){

                handler.call( context, e );

            }, delay );

        }else if( new Date() - startTime > must ){

            startTime = new Date();
            handler.call( context, e );
        }
    };
};

/**
 * clickToggle.js
 * 当指定元素被点击时，在两个函数之间轮流切换。
 * @param  {Function} fnFirst		The first fn.
 * @param  {Function} fnSecond		The second fn.
 * @param  {Number} delay			可选，延迟时间执行函数
 * @param  {Number} must			可选，一定时间执行函数
 */
+function ( $ ) {
    'use strict';
    $.fn.clickToggle = function( fnFirst, fnSecond, delay, must ){

        return this.each(function(){

            var toggle;

            $( this ).on( 'click', XUI.throttle(function( e ){

                ( toggle ? fnSecond : fnFirst ).call( this, e );
                toggle = !toggle;

            }, delay, must ) );

        });
    };
}(jQuery);

/**
 * drag.js
 * @param  {Object} options		可选
 *        limit[boolean]: 		可选，限制移动元素的拖拽范围，默认flase
 *        moveElem[object]: 	可选，移动的元素，jQuery对象类型，默认自身
 *        down[fn]: 	可选，鼠标按下时执行
 *        move[fn]: 	可选，鼠标移动时执行
 *        up[fn]: 		可选，鼠标抬起时执行
 */
;(function( $ ){
    'use strict';
    $.fn.drag = function( options ){
        var $doc = $( document ),
            fnEmpty = function(){},

            settings = $.extend({

                down: fnEmpty,
                move: fnEmpty,
                up: fnEmpty,
                limit: false,
                moveElem: null

            }, options );

        return this.each(function(){
            var $this = $( this ),
                moveElem = settings.moveElem || $this;

            if( typeof settings.moveElem == 'function' ){

                moveElem = $( settings.moveElem.call( this ) );

            }

            $this.on( 'mousedown.drag', function( e ){
                var tagName = e.target.tagName.toLowerCase();
                if( tagName == 'input' || tagName == 'textarea' || tagName == 'select' ){
                    return;
                }
                if( settings.limit ){

                    var winWidth = $( window ).width(),
                        winHeight = $( window ).height(),

                        range = function( val, min, max ){
                            return val < min ? min : val > max ? max : val;
                        };

                }

                var self = this,
                    offset = moveElem.offset(),
                    disX = e.pageX - offset.left,
                    disY = e.pageY - offset.top;

                settings.down.call( self );

                $doc.on({
                    'mousemove.drag': function( e ){
                        var left = e.clientX - disX,
                            top = e.clientY - disY;

                        if( range ){
                            left = range( left, 0, winWidth - moveElem.outerWidth() );
                            top = range( top, 0, winHeight - moveElem.outerHeight() );
                        }

                        moveElem.css({
                            left: left,
                            top: top
                        });

                        settings.move.call( self, left, top );

                    },
                    'mouseup.drag': function(){

                        $doc.off( 'mousemove.drag mouseup.drag' );
                        settings.up.call( self );

                    }
                });

                return false;
            });
        });
    };
})(jQuery);

//时钟
+function ($) {
    function Clock( elem, timeStamp ){
        this.$elem = $(elem);
        this.timeStamp = timeStamp;
        this.update();
        this.run();
    }

    Clock.prototype = {
        constructor: Clock,
        run: function(){
            var self = this;
            setInterval(function(){
                self.timeStamp += 1000;
                self.update();
            }, 1000 );
        },
        update: function(){
            var toDouble = this.toDouble;
            var date = new Date( this.timeStamp );
            var h = date.getHours();
            var m = date.getMinutes();
            var s = date.getSeconds();
            this.$elem.text( toDouble( h ) +':'+ toDouble( m ) +':'+ toDouble( s ) );
        },
        toDouble: function( num ){
            return ('' + num).length > 1 ? num : '0' + num;
        }
    };

    $.fn.clock = function( timeStamp ){
        return this.each(function(){
            new Clock(this, timeStamp || Date.now());
        });
    };
}(jQuery);

//倒计时
+function ($) {
    $.fn.countdown = function( options ){
        var fnEmpty = function(){},
            settings = $.extend({
                time: 59,
                run: fnEmpty,
                done: fnEmpty
            }, options );
        return this.each(function(){
            var that = this,
                $this = $( that ).data( 'countdownImmediatelyDone', false ),
                oldHtml = $this.html();
                tick = function(){
                    setTimeout(function(){
                        if( --settings.time && !$this.data( 'countdownImmediatelyDone' ) ){
                            settings.run.call( that, settings.time );
                            tick();
                        }else{
                            $this.data( 'done.xui.countdown', false).html( oldHtml );
                            settings.done.call( that );
                        }
                    }, 1000 );
                };
            if( !$this.data( 'done.xui.countdown' ) ){
                $this.data( 'done.xui.countdown', true );
                settings.run.call( that, settings.time );
                tick();
            }
        });
    };
}(jQuery);

//表单控件
+function ( $ ) {
    'use strict';
    //表单获得焦点与失去焦点样式
    $.fn.inputGroup = function(){
      return this.each(function(){
          if( !$(this).data('exist.xui.inputGroup') ){
              $(this).data('exist.xui.inputGroup', true)
                  .focus(function(){
                      $(this).parents('.form-input-group').addClass('active');
                  })
                  .blur(function(){
                      $(this).parents('.form-input-group').removeClass('active');
                  });
          }
      });
    };
    //表单密码控件
    $.fn.eyePassword = function(){
        return this.each(function () {
            var $this = $(this);
            var passwordInput = $this.find('input');
            var eyeIcon = $this.find('.eye');

            if( $this.data('xui.eyePassword') ){
                return;
            }else{
                $this.data('xui.eyePassword', true);
            }

            eyeIcon.clickToggle(function(){
                eyeIcon.addClass('open');
                passwordInput.attr('type','text');
            },function(){
                eyeIcon.removeClass('open');
                passwordInput.attr('type','password');
            });
            passwordInput.on('keyup.xui.eyePassword',function(){
                passwordInput.val( passwordInput.val().replace(XUI.reg.formatPassword, '') );
                if( !passwordInput.val() ){
                    passwordInput.prev().removeClass( 'hidden' );
                }
            });
        });
    };
    //滑块验证
    $.fn.slidelock = function () {
        var $doc = $(document);
        var $win = $(window);
        return this.each(function () {
            var $this = $(this);
            var bg = $this.find('.form-slidelock-bg');
            var anim = $this.find('.form-slidelock-anim');
            var bar = $this.find('.form-slidelock-bar');
            var lock = $this.find('.form-slidelock-lock');

            if( $this.data('xui.slidelock') ){
                return;
            }else{
                $this.data('xui.slidelock', true);
            }
            $win.on( 'resize.xui.slidelock', function(){
                if( lock.hasClass('form-slidelock-success') ){
                    var left = $this.outerWidth() - lock.outerWidth();
                    lock.css( 'left', left );
                    bar.css( 'width', left + 10 );
                }
            });

            lock.on( 'mousedown.xui.slidelock', function( e ){
                if( lock.hasClass('form-slidelock-success') ){
                    return;
                }
                lock.add( bar ).removeClass( 'out' );
                var disX = e.clientX - parseInt(lock.css('left'));
                var space = $this.outerWidth() - lock.outerWidth();
                var left;
                $doc.on({
                    'mousemove.xui.slidelock': function( e ){
                        left = e.clientX - disX;
                        if( left < 0 ){
                            left = 0;
                        }else if( left > space ){
                            left = space;
                        }
                        lock.css( 'left', left );
                        bar.css( 'width', left + 10 );
                    },
                    'mouseup.xui.slidelock': function(){
                        $doc.off( 'mousemove.xui.slidelock mouseup.xui.slidelock' );
                        if( left == space ){
                            lock.addClass( 'form-slidelock-success' );
                            bg.html('已完成滑块验证');
                            anim.remove();
                            $this.next().html('');
                        }else{
                            lock.add( bar ).addClass( 'out' ).removeAttr( 'style' );
                        }
                    }
                });
                return false;
            });
        });
    };
    //图片验证码
    $.fn.imgcode = function(){
        return this.each(function () {
            $(this).find('img').on('click.xui.imgcode',function(){
                var $this = $(this);
                $this.attr( 'src',
                    $this.attr('src').replace(/\?.*/,'') + '?' + Date.now()
                );
            });
        });
    };
    //文档已有表单初始化
    $(function(){
        //表单密码
        $('.form-password.form-input-group').eyePassword();
        //滑动解锁
        $('.form-slidelock.form-input-group').slidelock();
        //图片验证码
        $('.form-code-get').imgcode();
    });
}(jQuery);

//dropdown.js
+function ( $ ) {
    'use strict';
    $(document).on( 'click.xui.dropdown', function (e) {
        var dropdown = $(e.target).parents('[data-toggle="dropdown"]');
        if( $(e.target).attr('data-toggle') === 'dropdown' ){
            dropdown = $(e.target);
        }else if( !dropdown.length ){
            dropdown = null;
        }
        if( dropdown ){
            $('[data-toggle="dropdown"]').not(dropdown).parent().removeClass( 'open' )
                .data('open.xui.dropdown', false);
            var parent = dropdown.parent();
            if( parent.data('open.xui.dropdown') ){
                parent.data('open.xui.dropdown', false);
                parent.removeClass( 'open' );
            }else{
                parent.data('open.xui.dropdown', true);
                parent.addClass( 'open' );
            }
        }else{
            $('[data-toggle="dropdown"]').parent().removeClass( 'open' )
                .data('open.xui.dropdown', false);
        }
    });
}(jQuery);

//tooltip.js
+function ( $ ) {
    'use strict';
    var config = {
        placement: 'top',
        template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
        trigger: 'hover focus',
        title: '',
        dalay: 200,
        html: false
    };
    var TRANSITION_DURATION = 400;

    $.fn.tooltip = function ( options ) {
        var set = $.extend( {}, config, options );
        var event = 'hover';
        if( set.trigger === 'click' ){
            event = 'clickToggle';
        }
        return this.each(function(){
            var $this = $( this );
            var placement = $this.attr( 'data-placement') || set.placement;
            var $tooltip =$( set.template );
            var complete = function () {
                if( $tooltip.hasClass( 'out' ) ){
                    $tooltip.remove();
                }
            };
            $tooltip.addClass( placement )
                .find( '.tooltip-inner')[set.html ? 'html' : 'text']( $this.attr( 'data-title' ) || set.title );

            $this[ event ](function(){
                var offset = $this.offset();
                var height = $this.outerHeight();
                var width = $this.outerWidth();

                $('body').append( $tooltip.removeClass('out') );

                var tipHight = $tooltip.outerHeight();
                var tipWidth = $tooltip.outerWidth();
                var left = offset.left - tipWidth;
                var top = offset.top + (height - tipHight)/2;

                switch ( placement ){
                    case 'right':
                        left = offset.left + width;
                        break;
                    case 'top':
                        left = offset.left + (width - tipWidth)/2;
                        top = offset.top - tipHight;
                        break;
                    case 'bottom':
                        left = offset.left + (width - tipWidth)/2;
                        top = offset.top + height;
                        break;
                }

                $tooltip.css({
                    left: left,
                    top: top
                });
            }, function () {
                $.support.transition ?
                    $tooltip.addClass( 'out' )
                        .one('xuiTransitionEnd', complete)
                        .emulateTransitionEnd(TRANSITION_DURATION) :
                    $tooltip.remove();
            });
        });
    };
}(jQuery);

//tab.js
+function ( $ ) {
    'use strict';
    $( document).on( 'click.tabs', '.tabs .tab-nav>li', function () {
        if( !$(this).hasClass('disabled') && !$(this).hasClass('active') ){
            $(this).addClass('active').siblings().removeClass( 'active' )
                .parents('.tabs')
                .find('.tab-content')
                .find( $(this).attr( 'data-tab' ) )
                .addClass( 'active' )
                .siblings().removeClass( 'active' );
        }
    });
}(jQuery);

//layer.js
+function ( $ ) {
    'use strict';
    var template = {
        hint: '<div class="layer-hint"><div class="layer-hint-inner"></div></div>',
        layer: '<div class="layer"><div class="layer-bg"></div><div class="layer-dialog"><div class="layer-content"></div></div></div>',
        confirm: '<h3 class="layer-header cf"><div class="fl"></div><i class="icon icon-plus fr"></i></h3><div class="layer-inner"></div><footer class="layer-footer"><button class="btn btn-primary"></button><button class="btn btn-default"></button></footer>',
        loadingPage: '<div class="layer-loading-page"></div>'
    };
    var $win = $(window);
    var emptyStr = '';
    var emptyFn = function(){};

    function createInit(){
        return function( options ){
            if( typeof options === 'string' ){
                options = {
                    content: options
                };
            }
            this.set = $.extend( {}, Layer.config, options );
            this.$layer = $( template.layer );
            this.hidden = true;

            this.bodyScrollBar();
            this.bg2close();
            this.addContent();

            $('body').append( this.$layer );
            this.drag();
            this.shown();
            return this;
        };
    }
    function Layer( options ){
        return new Layer.prototype.init( options );
    }
    Layer.config = {
        content: emptyStr,
        bodyScrollBar: true,
        bg2close: true,
        drag: false,
        limit: true,
        shown: emptyFn
    };
    Layer.prototype = {
        constructor: Layer,
        init: createInit(),
        addContent: function(){
            this.$layer.find( '.layer-content' ).html( this.set.content );
        },
        removeScrollBar: function(){
            if( !this.set.bodyScrollBar ){
                $('body').removeClass( 'overflow-hidden' );
            }
        },
        bodyScrollBar: function(){
            if( !this.set.bodyScrollBar ){
                $('body').addClass( 'overflow-hidden' );
            }
        },
        bg2close: function(){
            if( this.set.bg2close ){
                this.$layer.find('.layer-bg').click( this.close.bind( this ) );
            }
        },
        drag: function(){
            if( this.set.drag ){
                this.$layer.find( '.layer-dialog' )
                    .addClass( 'layer-dialog-drag' )
                    .drag({
                        limit: this.set.limit
                    });
                this.resetPosition();
            }
        },
        shown: function(){
            this.set.shown.call( this );
        },
        resetPosition: function(){
            var dialog = this.$layer.find('.layer-dialog');
            dialog.css({
                left: ( $win.width() - dialog.outerWidth() )/2,
                top:( $win.height() - dialog.outerHeight() )/2
            });
        },
        close: function(){
            if( this.hidden ){
                this.$layer.remove();
                this.removeScrollBar();
            }
        }
    };
    Layer.prototype.init.prototype = Layer.prototype;

    //Confirm.js
    function Confirm( options ){
        return new Confirm.prototype.init( $.extend( {}, Confirm.config, options ) );
    }
    Confirm.config = {
        title: '温馨提示',
        okText: '确定',
        cancelText: '取消',
        content: emptyStr,
        bodyScrollBar: true,
        bg2close: true,
        drag: true,
        shown: emptyFn,
        ok: emptyFn,
        cancel: emptyFn
    };
    $.extend( Confirm.prototype, Layer.prototype );
    Confirm.prototype.constructor = Confirm;
    Confirm.prototype.init = createInit();
    Confirm.prototype.init.prototype = Confirm.prototype;

    Confirm.prototype.addContent = function(){
        this.okHidden = true;
        this.$layer.find('.layer-content').html(template.confirm)
            .addClass('layer-confirm-content').end()
            .find('.layer-header>.fl').html(this.set.title).end()
            .find('.layer-inner').html(this.set.content).end()

        .find( '.layer-header>.fr').click(function(){
            this.close();
        }.bind(this)).end()
        .find('.layer-footer .btn').eq(0).html( this.set.okText )
            .click(function(){
                this.set.ok.call( this );
                if( this.okHidden ){
                    this.close();
                }
            }.bind(this))
            .next().html( this.set.cancelText )
            .click(function(){

                this.set.cancel.call( this );
                this.close();

            }.bind(this));

        this.deleteCancelBtn && this.deleteCancelBtn();
    };
    Confirm.prototype.drag = function () {
        if( this.set.drag ){
            var dialog = this.$layer.find( '.layer-dialog' )
                .addClass( 'layer-dialog-drag' );

            this.$layer.find('.layer-header').drag({
                limit: true,
                moveElem: dialog
            });

            this.resetPosition();
        }
    };

    //Alert.js
    function Alert( options ){
        return new Alert.prototype.init( $.extend( {}, Confirm.config, options ) );
    }
    $.extend( Alert.prototype, Confirm.prototype );
    Alert.prototype.constructor = Alert;
    Alert.prototype.init = createInit();
    Alert.prototype.init.prototype = Alert.prototype;
    Alert.prototype.deleteCancelBtn = function(){
        this.$layer.find('.layer-footer .btn').eq(1).remove();
    };

    function Hint( options ){
        return new Hint.prototype.init( options );
    }
    Hint.config = {
        content: emptyStr,
        color: emptyStr,
        timeout: 1200
    };
    Hint.prototype = {
        constructor: Hint,
        oldHintElem: $(),
        init: function( options ){
            if( typeof options === 'string' ){
                options = {
                    content: options
                };
            }
            this.set = $.extend( {}, Hint.config, options );
            this.show();
            return this;
        },
        show: function(){
            this.oldHintElem.remove();
            var hintElem = Hint.prototype.oldHintElem = $( template.hint )
                .find('.layer-hint-inner').html( this.set.content )
                .addClass( this.set.color)
                .end().appendTo( $('body') );

            setTimeout(function(){
                hintElem.remove();
            }, this.set.timeout );
        }
    }
    Hint.prototype.init.prototype = Hint.prototype;

    function loadingPage( fn ){
        var elem = $(template.loadingPage).appendTo( $('body') );
        fn && fn(function(){
            elem.remove();
        });
    }

    XUI.layer = Layer;
    XUI.alert = Alert;
    XUI.confirm = Confirm;

    //notify
    XUI.hint = Hint;
    XUI.loadingPage = loadingPage;
}(jQuery);

//modal.js
+function ( $ ) {
    'use strict';
    var $win = $(window);
    var config = {
        remote: false,  //or url
        bodyScrollBar: true,
        bg2close: true,
        drag: false,    //or selector
        shown: function () {}
    };

    function Plugin( options ){
        if( typeof options !== 'string' ){
            var set = $.extend( {}, config, options );
        }
        return this.each(function () {
            if( typeof options === 'string' ){
                switch ( options ){
                    case 'show':
                        $(this).addClass('open');
                        $('body').addClass('overflow-hidden');
                        break;
                    case 'hide':
                        $(this).removeClass('open');
                        $('body').removeClass('overflow-hidden');
                        break;
                }
                return;
            }
            var $this = $(this).addClass('open');
            var dialog = $this.find('.modal-dialog');
            if( set.remote && !$this.data('isRemote.xui.modal') ){
                $this.data('isRemote.xui.modal', true);
                $this.find('.modal-content').load(set.remote,function( res ){
                    resetPosition();
                    $this.trigger('loaded.xui.modal', res );
                });
            }
            if( !set.bodyScrollBar ){
                $('body').addClass('overflow-hidden');
            }
            if( set.bg2close ){
                $this.find('.modal-bg').click( close );
            }
            resetPosition();

            $this.find('[data-dismiss="modal"]').click(function(){
                close();
            });

            set.shown.call( this );
            $this.trigger('show.xui.modal', set.remote);

            function resetPosition(){
                if( set.drag && dialog.hasClass('modal-dialog-drag') ){
                    var dragElem = dialog.find(set.drag);
                    if( !dragElem.length ){
                        dragElem = dialog;
                    }
                    dialog.css({
                        left: ( $win.width() - dialog.outerWidth() )/2,
                        top:( $win.height() - dialog.outerHeight() )/2
                    });
                    dragElem.drag({
                        limit: true,
                        moveElem: dialog
                    });
                }
            }
            function close(){
                $this.removeClass('open');
                $('body').removeClass('overflow-hidden');
                $this.trigger('hidden.xui.modal');
            }
        });
    }

    $.fn.modal = Plugin;

    //data-api
    $(document).on( 'click.modal', '[data-toggle="modal"]', function (e) {
        e.preventDefault();
        var $this = $(this);
        var $modal = $($this.attr('data-target'));
        var remote = $this.attr('href') || $this.attr('data-remote') || false;
        var bodyScrollBar = $this.attr('data-body-scrollbar') || true;
        var bg2close = $this.attr('data-bg2close') || true;
        var dialog = $modal.find('.modal-dialog');
        var dragValue = false;
        if(dialog.hasClass('modal-dialog-drag')){
            dragValue = dialog.attr('data-drag-target');
        }

        if( /javascript/i.test(remote) ){
            remote = false;
        }

        $modal.modal({
            remote: remote,
            bodyScrollBar: bodyScrollBar,
            bg2close: bg2close,
            drag: dragValue
        });
    });
}(jQuery);

//easings http://easings.net/zh-cn
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
    def: 'easeOutQuad',
    swing: function (x, t, b, c, d) {
        //alert(jQuery.easing.default);
        return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
    },
    easeInQuad: function (x, t, b, c, d) {
        return c*(t/=d)*t + b;
    },
    easeOutQuad: function (x, t, b, c, d) {
        return -c *(t/=d)*(t-2) + b;
    },
    easeInOutQuad: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t + b;
        return -c/2 * ((--t)*(t-2) - 1) + b;
    },
    easeInCubic: function (x, t, b, c, d) {
        return c*(t/=d)*t*t + b;
    },
    easeOutCubic: function (x, t, b, c, d) {
        return c*((t=t/d-1)*t*t + 1) + b;
    },
    easeInOutCubic: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t + b;
        return c/2*((t-=2)*t*t + 2) + b;
    },
    easeInQuart: function (x, t, b, c, d) {
        return c*(t/=d)*t*t*t + b;
    },
    easeOutQuart: function (x, t, b, c, d) {
        return -c * ((t=t/d-1)*t*t*t - 1) + b;
    },
    easeInOutQuart: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
        return -c/2 * ((t-=2)*t*t*t - 2) + b;
    },
    easeInQuint: function (x, t, b, c, d) {
        return c*(t/=d)*t*t*t*t + b;
    },
    easeOutQuint: function (x, t, b, c, d) {
        return c*((t=t/d-1)*t*t*t*t + 1) + b;
    },
    easeInOutQuint: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
        return c/2*((t-=2)*t*t*t*t + 2) + b;
    },
    easeInSine: function (x, t, b, c, d) {
        return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
    },
    easeOutSine: function (x, t, b, c, d) {
        return c * Math.sin(t/d * (Math.PI/2)) + b;
    },
    easeInOutSine: function (x, t, b, c, d) {
        return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
    },
    easeInExpo: function (x, t, b, c, d) {
        return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
    },
    easeOutExpo: function (x, t, b, c, d) {
        return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
    },
    easeInOutExpo: function (x, t, b, c, d) {
        if (t==0) return b;
        if (t==d) return b+c;
        if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
        return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
    },
    easeInCirc: function (x, t, b, c, d) {
        return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
    },
    easeOutCirc: function (x, t, b, c, d) {
        return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
    },
    easeInOutCirc: function (x, t, b, c, d) {
        if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
        return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
    },
    easeInElastic: function (x, t, b, c, d) {
        var s=1.70158;var p=0;var a=c;
        if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
        if (a < Math.abs(c)) { a=c; var s=p/4; }
        else var s = p/(2*Math.PI) * Math.asin (c/a);
        return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
    },
    easeOutElastic: function (x, t, b, c, d) {
        var s=1.70158;var p=0;var a=c;
        if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
        if (a < Math.abs(c)) { a=c; var s=p/4; }
        else var s = p/(2*Math.PI) * Math.asin (c/a);
        return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
    },
    easeInOutElastic: function (x, t, b, c, d) {
        var s=1.70158;var p=0;var a=c;
        if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
        if (a < Math.abs(c)) { a=c; var s=p/4; }
        else var s = p/(2*Math.PI) * Math.asin (c/a);
        if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
        return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
    },
    easeInBack: function (x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c*(t/=d)*t*((s+1)*t - s) + b;
    },
    easeOutBack: function (x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
    },
    easeInOutBack: function (x, t, b, c, d, s) {
        if (s == undefined) s = 1.70158;
        if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
        return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
    },
    easeInBounce: function (x, t, b, c, d) {
        return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
    },
    easeOutBounce: function (x, t, b, c, d) {
        if ((t/=d) < (1/2.75)) {
            return c*(7.5625*t*t) + b;
        } else if (t < (2/2.75)) {
            return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
        } else if (t < (2.5/2.75)) {
            return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
        } else {
            return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
        }
    },
    easeInOutBounce: function (x, t, b, c, d) {
        if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
        return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
    }
});
//scrollTo.js
//https://github.com/flesler/jquery.scrollTo
/**
 * Copyright (c) 2007-2015 Ariel Flesler - aflesler ○ gmail • com | http://flesler.blogspot.com
 * Licensed under MIT
 * @author Ariel Flesler
 * @version 2.1.3
 */
+function ($) {
    'use strict';

    var $scrollTo = $.scrollTo = function(target, duration, settings) {
        return $(window).scrollTo(target, duration, settings);
    };

    $scrollTo.defaults = {
        axis:'xy',
        duration: 0,
        limit:true
    };

    function isWin(elem) {
        return !elem.nodeName ||
            $.inArray(elem.nodeName.toLowerCase(), ['iframe','#document','html','body']) !== -1;
    }

    $.fn.scrollTo = function(target, duration, settings) {
        if (typeof duration === 'object') {
            settings = duration;
            duration = 0;
        }
        if (typeof settings === 'function') {
            settings = { onAfter:settings };
        }
        if (target === 'max') {
            target = 9e9;
        }

        settings = $.extend({}, $scrollTo.defaults, settings);
        // Speed is still recognized for backwards compatibility
        duration = duration || settings.duration;
        // Make sure the settings are given right
        var queue = settings.queue && settings.axis.length > 1;
        if (queue) {
            // Let's keep the overall duration
            duration /= 2;
        }
        settings.offset = both(settings.offset);
        settings.over = both(settings.over);

        return this.each(function() {
            // Null target yields nothing, just like jQuery does
            if (target === null) return;

            var win = isWin(this),
                elem = win ? this.contentWindow || window : this,
                $elem = $(elem),
                targ = target,
                attr = {},
                toff;

            switch (typeof targ) {
                // A number will pass the regex
                case 'number':
                case 'string':
                    if (/^([+-]=?)?\d+(\.\d+)?(px|%)?$/.test(targ)) {
                        targ = both(targ);
                        // We are done
                        break;
                    }
                    // Relative/Absolute selector
                    targ = win ? $(targ) : $(targ, elem);
                /* falls through */
                case 'object':
                    if (targ.length === 0) return;
                    // DOMElement / jQuery
                    if (targ.is || targ.style) {
                        // Get the real position of the target
                        toff = (targ = $(targ)).offset();
                    }
            }

            var offset = $.isFunction(settings.offset) && settings.offset(elem, targ) || settings.offset;

            $.each(settings.axis.split(''), function(i, axis) {
                var Pos	= axis === 'x' ? 'Left' : 'Top',
                    pos = Pos.toLowerCase(),
                    key = 'scroll' + Pos,
                    prev = $elem[key](),
                    max = $scrollTo.max(elem, axis);

                if (toff) {// jQuery / DOMElement
                    attr[key] = toff[pos] + (win ? 0 : prev - $elem.offset()[pos]);

                    // If it's a dom element, reduce the margin
                    if (settings.margin) {
                        attr[key] -= parseInt(targ.css('margin'+Pos), 10) || 0;
                        attr[key] -= parseInt(targ.css('border'+Pos+'Width'), 10) || 0;
                    }

                    attr[key] += offset[pos] || 0;

                    if (settings.over[pos]) {
                        // Scroll to a fraction of its width/height
                        attr[key] += targ[axis === 'x'?'width':'height']() * settings.over[pos];
                    }
                } else {
                    var val = targ[pos];
                    // Handle percentage values
                    attr[key] = val.slice && val.slice(-1) === '%' ?
                    parseFloat(val) / 100 * max
                        : val;
                }

                // Number or 'number'
                if (settings.limit && /^\d+$/.test(attr[key])) {
                    // Check the limits
                    attr[key] = attr[key] <= 0 ? 0 : Math.min(attr[key], max);
                }

                // Don't waste time animating, if there's no need.
                if (!i && settings.axis.length > 1) {
                    if (prev === attr[key]) {
                        // No animation needed
                        attr = {};
                    } else if (queue) {
                        // Intermediate animation
                        animate(settings.onAfterFirst);
                        // Don't animate this axis again in the next iteration.
                        attr = {};
                    }
                }
            });

            animate(settings.onAfter);

            function animate(callback) {
                var opts = $.extend({}, settings, {
                    // The queue setting conflicts with animate()
                    // Force it to always be true
                    queue: true,
                    duration: duration,
                    complete: callback && function() {
                        callback.call(elem, targ, settings);
                    }
                });
                $elem.animate(attr, opts);
            }
        });
    };

    // Max scrolling position, works on quirks mode
    // It only fails (not too badly) on IE, quirks mode.
    $scrollTo.max = function(elem, axis) {
        var Dim = axis === 'x' ? 'Width' : 'Height',
            scroll = 'scroll'+Dim;

        if (!isWin(elem))
            return elem[scroll] - $(elem)[Dim.toLowerCase()]();

        var size = 'client' + Dim,
            doc = elem.ownerDocument || elem.document,
            html = doc.documentElement,
            body = doc.body;

        return Math.max(html[scroll], body[scroll]) - Math.min(html[size], body[size]);
    };

    function both(val) {
        return $.isFunction(val) || $.isPlainObject(val) ? val : { top:val, left:val };
    }

    // Add special hooks so that window scroll properties can be animated
    $.Tween.propHooks.scrollLeft =
        $.Tween.propHooks.scrollTop = {
            get: function(t) {
                return $(t.elem)[t.prop]();
            },
            set: function(t) {
                var curr = this.get(t);
                // If interrupt is true and user scrolled, stop animating
                if (t.options.interrupt && t._last && t._last !== curr) {
                    return $(t.elem).stop();
                }
                var next = Math.round(t.now);
                // Don't waste CPU
                // Browsers don't render floating point scroll
                if (curr !== next) {
                    $(t.elem)[t.prop](next);
                    t._last = this.get(t);
                }
            }
        };
}(jQuery);

//toTop.js
+function ( $ ) {
    //data-api
    var isAnimated = false;
    $(document).on('click.xui.toTop','[data-toggle="totop"]', function () {
        if( !isAnimated ){
            isAnimated = true;
            $(window).scrollTo( 0, 600, {
                easing: 'easeOutCubic',
                onAfter: function(){
                    isAnimated = false;
                }
            });
        }
    });
}(jQuery);

//carousel.js
+function ($) {
    var fnEmpty = function(){};
    var config = {
        interval: 5000,
        onPrev: fnEmpty,
        onNext: fnEmpty,
        onIndicator: fnEmpty
    };

    function Carousel( options, context ){
        this.settings = $.extend({}, config, options);
        this.carousel = $(context);
        this.innerUl = this.carousel.find('.carousel-inner ul');
        this.innerLi = this.innerUl.find('li');
        this.indicators = this.carousel.find('.carousel-indicators li');
        this.prev = this.carousel.find('.carousel-prev');
        this.next = this.carousel.find('.carousel-next');

        this.slideLength = this.innerLi.length;
        this.curIndex = 1;
        this.slideWidth = 0;
        this.timer = null;

        this.carousel.find('img').each(function(){
            $(this).attr('src',$(this).attr('data-src')).removeAttr('data-src');
        });

        this.innerUl.prepend( this.innerLi.last().clone() )
            .append( this.innerLi.first().clone() );

        this.init();
        this.handler();
        this.startTimer();
    }

    Carousel.prototype = {
        constructor: Carousel,
        init: function () {
            this.slideWidth = this.carousel.outerWidth();
            this.innerUl.find('li').css('width', this.slideWidth );
            this.innerUl.css({
                width: this.slideWidth * ( this.slideLength + 2 ),
                left: -this.slideWidth * this.curIndex
            });
        },
        resize: function(){
            $(window).on('resize.xui.carousel', this.init.bind(this) );
        },
        handler: function(){
            this.resize();
            //hover pasued
            this.prev.add( this.next ).add( this.indicators )
                .hover( this.endTimer.bind(this), this.startTimer.bind(this) );

            var self = this;
            this.prev.click( this.counter.bind(this, true) );
            this.next.click( this.counter.bind(this, false) );
            this.indicators.click(function () {
                self.changeIndicators( $(this).index() );
                self.curIndex = $(this).index() + 1;
                self.slide();
            });
        },
        slide: function () {
            if( this.curIndex > this.slideLength ){
                this.changeIndicators( 0 );
            }else if( this.curIndex < 1 ){
                this.changeIndicators( this.slideLength - 1 );
            }else{
                this.changeIndicators( this.curIndex - 1 );
            }

            var self = this;
            this.innerUl.stop().animate({
                left: -this.slideWidth * this.curIndex
            },function(){
                if( self.curIndex > self.slideLength ){
                    self.curIndex = 1;
                    self.innerUl.css('left', -self.slideWidth );
                }else if( self.curIndex < 1 ){
                    self.curIndex = self.slideLength;
                    self.innerUl.css('left', -self.slideWidth * self.slideLength );
                }
            });
        },
        counter: function( isPrev ){
            if( !this.innerUl.is(':animated') ){
                this.curIndex += isPrev ? -1 : 1;
                this.slide();
            }
        },
        changeIndicators: function ( index ){
            this.indicators.removeClass('active')
                .eq( index ).addClass('active');
        },
        startTimer: function (){
            this.timer = setInterval( this.counter.bind(this), this.settings.interval );
        },
        endTimer: function (){
            clearInterval( this.timer );
        }
    };

    $.fn.carousel = function( options ){
        return this.each(function () {
            new Carousel( options, this );
        });
    };
}(jQuery);

//waiting.js
+function ($) {
    $.fn.waiting = function(waitingHtml, callback){
        return this.each(function () {
            var $this = $(this);
            var type = $this[0].tagName.toUpperCase() === 'INPUT' ? 'val' : 'html';
            if( !$this.data( 'waiting.xui' ) ){
                var originHtml = $this[type]();
                $this.data( 'waiting.xui', true )[type]( waitingHtml );
                callback.call(this, function(){
                    $this.data( 'waiting.xui', false )[type]( originHtml );
                });
            }
        });
    };
}(jQuery);

//loading.js
+function ($) {
    var waitingHtml = '<img src="assets/img/loading.gif">';
    $.fn.loading = function(callback){
        return this.each(function () {
            var $this = $(this);
            $this.click(function(){
                $this.css('transition','none').removeClass('btn-default')
                    .waiting( waitingHtml, function( complete ){
                        callback.call(this, function(){
                            complete();
                            //.blur兼容ie
                            $this.removeAttr('style').addClass('btn-default').blur();
                        });
                    });
            });
        });
    };
}(jQuery);

//calendar.js
+function ($) {
    'use strict';
    var template =
        '<div class="calendar">\
            <header class="calendar-header pr">\
                <a href="javascript:;" class="calendar-prev pa">\
                    <i class="icon icon-chevron-left"></i>\
                </a>\
                <a href="javascript:;" class="calendar-next pa">\
                    <i class="icon icon-chevron-right"></i>\
                </a>\
                <h6 class="calendar-year"></h6>\
                <h1 class="calendar-day"></h1>\
                <h6 class="calendar-week"></h6>\
            </header>\
            <section class="calendar-body">\
                <ul class="calendar-indi list-unstyled cf">\
                    <li>一</li>\
                    <li>二</li>\
                    <li>三</li>\
                    <li>四</li>\
                    <li>五</li>\
                    <li>六</li>\
                    <li>日</li>\
                </ul>\
                <ul class="calendar-list list-unstyled cf"></ul>\
            </section>\
        </div>';

    function Calendar( elem, timestamp ){
        this.$elem = $(elem);
        this.date = new Date( timestamp );
        this.todayYear = this.year = this.date.getFullYear();
        this.todayMonth = this.month = this.date.getMonth() + 1;
        this.today = this.day = this.date.getDate();
        this.week = this.getWeek( this.date.getDay() );

        this.prevNum = this.nextNum = 0;
        this.onceToday = true;

        this.initDom();
        this.prev();
        this.next();
    }

    Calendar.prototype = {
        constructor: Calendar,
        weekName: ['日','一','二','三','四','五','六'],
        initDom: function(){
            this.$calendar = $(template).appendTo( this.$elem )
                .find('.calendar-day').text( this.day )
                .end()
                .find('.calendar-week').text( '星期' + this.week )
                .end();
            this.setDaysDom();
        },
        setDaysDom: function(){
            var days = this.getDaysInMonth();
            var topDayIndex = new Date( this.year+'/'+this.month+'/1' ).getDay() || 7;
            var i = 1;
            var times = days + topDayIndex -1;
            var daysHtml = [];

            for( ; i <= times; i++ ){
                var dayVal = i - topDayIndex + 1;
                daysHtml.push(
                    i < topDayIndex ? '<li></li>' :
                    '<li data-day="'+ dayVal +'">'+ dayVal +'</li>'
                );
            }
            this.$calendar.find('.calendar-year').text( this.year + '年' + this.month + '月' )
            this.$calendar.find('.calendar-list').empty().append( daysHtml.join('') )
                .attr('data-year', this.year)
                .attr('data-month', this.month);
            if( this.onceToday ){
                this.$calendar.find('.calendar-list li:eq('+( this.day + topDayIndex - 2 )+')').addClass('active');
                this.onceToday = false;
            }
        },
        changeDay: function(){
            this.week = this.getWeek(
                new Date( this.year+'/'+this.month+'/'+this.day ).getDay()
            );
            this.$calendar.find('.calendar-day').text( this.day )
                .end()
                .find('.calendar-week').text( '星期' + this.week )
        },
        onPrev: function( fn ){
            return this.onPrevFn = fn, this;
        },
        onNext: function( fn ){
            return this.onNextFn = fn, this;
        },
        prev: function(){
            var self = this;
            this.$prevElem = this.$calendar.find('.calendar-prev').click(function(){
                if( $(this).hasClass('calendar-stop') || self.prevNum > 0 ){
                    return;
                }
                self.prevNum++;
                self.nextNum--;

                $(this).add(self.$nextElem).removeClass('disabled');
                if( self.prevNum > 0 ){
                    $(this).addClass('disabled');
                }

                self.month--;
                if( self.month < 1 ){
                    self.month = 12;
                    self.year--;
                }
                self.setDaysDom();
                self.onPrevFn.call( self );
            });
        },
        next: function(){
            var self = this;
            this.$nextElem = this.$calendar.find('.calendar-next').click(function(){
                if( $(this).hasClass('calendar-stop') || self.nextNum > 0 ){
                    return;
                }
                self.nextNum++;
                self.prevNum--;

                $(this).add(self.$prevElem).removeClass('disabled');
                if( self.nextNum > 0 ){
                    $(this).addClass('disabled');
                }

                self.month++;
                if( self.month > 12 ){
                    self.month = 1;
                    self.year++;
                }
                self.setDaysDom();
                self.onNextFn.call( self );
            });
        },
        getWeek: function( index ){
            return Calendar.prototype.weekName[ index ];
        },
        getDaysInMonth: function(){
            var year = this.year;
            var month = this.month;
            if( month !== 2 ){
                //1,3,5,7, 8,10,12 = 31
                //4,6, 9,11 = 30
                if( month < 8 && month % 2 === 0 || month >= 8 && month % 2 === 1 ){
                    return 30;
                }else{
                    return 31;
                }
            }
            //2月: 平年28，闰年29
            //每4年一闰，逢百年不润，逢400年时又需要再闰一天
            if( year % 4 === 0 && year % 100 !== 0 || year % 400 === 0 ){
                return 29;
            }
            return 28;
        }
    };

    function Plugin( timestamp, callback ){
        return this.each(function(){
            (callback || function(){}).call( this, new Calendar( this, timestamp ) );
        });
    }

    $.fn.calendar = Plugin;
}(jQuery);

//图片错误替换
+function ($) {
    $.fn.imgErrReplace = function(){
        return this.each(function(){
            this.onerror = function(){
                this.src =  Base.imgErrUrl;
            };
        });
    };
}(jQuery);

/**
 * 模拟placeholder，兼容IE9
 * DOM结构须与插件保持一致，后续添加的input元素须再调用此方法一次
 */
(function( $ ){
    if( navigator.userAgent.toUpperCase().indexOf( 'MSIE 9.0' ) !== -1 ){
        var isIE9 = true;
    }
    $.fn.placeholderInit = function(){
        return this.each(function(){
            var $this = $( this ),
                prev = $this.prev(),
                handler = function(){
                    $this.val() ?
                        prev.addClass( 'hidden' ) :
                        prev.removeClass( 'hidden' );
                };

            $this.off( 'input.placeholder' )
                .on( 'input.placeholder', handler );

            isIE9 &&
            $this.off( 'keyup.placeholder' )
                .on( 'keyup.placeholder', handler );
        });
    };
    $(function () {
        $( '.placeholder-input input' ).placeholderInit();
    });
})( jQuery );

//鼠标悬停显示图表
+function ( $ ) {
    //http://image.sinajs.cn/newchart/smal l/nsh600461.gif
    //sina图片图表接口说明：股票代码以6开头的是nsh，否则是nsz
    var temp = '<div id="mouseover-showchart"><img src="#"></div>';
    var codeReg = /\d{6}/;
    var $win = $(window);
    var $chart = $();

    function showChart( $this, e ){
        var code = $this.attr('data-showchart-code');
        if( !codeReg.test( code ) ){
            return;
        }
        code = (code.charAt(0) == 6 ? 'nsh' : 'nsz') + code;
        var url = 'http://image.sinajs.cn/newchart/small/'+ code +'.gif';

        Base.imgLoad( url, function( curUrl ){
            if( url === curUrl ){
                $chart.find('img').prop( 'src', curUrl );
                var left = e.clientX + 10;
                var top = e.clientY + 10;
                var boxWidth  = $chart.outerWidth();
                var boxHeight = $chart.outerHeight();

                if( left > $win.width() - boxWidth ){
                    left = e.clientX - boxWidth - 10;
                }

                if( top > $win.height() - boxHeight - 20 ){
                    top = e.clientY - boxHeight - 10;
                }
                $chart.css('transform', 'translate('+ left +'px,'+ top +'px)').show();
            }
        });
    }

    $.fn.mouseoverShowChart = function(){
        return this.each(function(){
         /*var $this = $(this);
            if( $this.data('xui.mouseoverShowChart') ){
                return;
            }
            $this.data('xui.mouseoverShowChart', true);
            $this
                .on('mouseover.showChart', function( e ){
                    showChart( $this, e );
                })
                .on('mouseout.showChart', function(){
                    //setTimeout(function(){
                        $chart.hide();
                    //}, 0 );
                });*/
        });
    };
    $(function(){
        $chart = $( temp ).appendTo( 'body').hide();
        //这是一个不好的处理方式，应该
        $(document)
            .on('mouseover.showChart', '[data-showchart-code]', function(e){
                showChart( $(this), e );
            })
            .on('mouseout.showChart', function(){
                $chart.hide();
            });
        //init
        //$('[data-showchart-code]').mouseoverShowChart();
    });
}(jQuery);

//Input框自动完成内容填充
(function ( $ ) {
    $.fn.autoComplete = function( options ){
        var $doc = $( document ),
            container = options.container,
            upDownScroll = function( activeElem, list, $this,
                                     sibling, txtElem, containerST, fn ){
                if( activeElem.length && activeElem[ sibling ]().length ){

                    var cur = activeElem.removeClass( 'active' )
                        [ sibling ]().addClass( 'active' );

                    fn( cur.position().top, cur );

                    $this.val( cur.text() );
                }else{
                    activeElem.removeClass( 'active' );
                    $this.val( list[ txtElem ]().addClass( 'active' ).text() );
                    container.scrollTop( containerST );
                }
            },
            isCountkey = function( keyCode ){
                return 	keyCode >= 65 && keyCode <= 90  ||
                    keyCode >= 96 && keyCode <= 105 ||
                    keyCode >= 48 && keyCode <= 57;
            };

        return this.each(function(){

            var $this = $( this ),
                diffVal;

            $doc.on( 'click.search', function( e ){
                if( $this[ 0 ] !== e.target ){
                    container.addClass( 'hidden' );
                }
            });

            $this.on({
                'keyup': function( e ){
                    e.stopPropagation();

                    var val = $this.val().trim(),
                        key = e.keyCode;

                    if( !val ){

                        return container.empty().addClass( 'hidden' );

                    }

                    if( diffVal != val && key !=38 && key != 40 || isCountkey( key ) ){

                        diffVal = val;

                        Base.searchAjaxRequire( options.url + val, $this, container );
                    }
                },
                //上下键功能，无其他事件或功能
                'keydown': function( e ){
                    e.stopPropagation();

                    var list = container.find( 'li' ),
                        activeElem,
                        thatScrollTop;

                    if( list.length ){
                        activeElem = container.find( 'li.active' );
                        thatScrollTop = container.scrollTop();
                        //up
                        if( e.keyCode == 38 ){

                            upDownScroll(

                                activeElem, list, $this,
                                'prev', 'last', 99999,

                                function( curTop ){

                                    if( curTop < thatScrollTop ){

                                        container.scrollTop( curTop );
                                    }
                                }
                            );
                            //down
                        }else if( e.keyCode == 40 ){

                            upDownScroll(

                                activeElem, list, $this,
                                'next', 'first', 0,

                                function( curTop, cur ){

                                    var curHeight = cur.outerHeight(),
                                        thatHeight = container.outerHeight();

                                    if( curTop + curHeight > thatHeight + thatScrollTop ){

                                        container.scrollTop( curTop + curHeight - thatHeight );

                                    }
                                }
                            );
                        }
                    }
                },
                'focus': function(){
                    container.find( 'ul' ).length && container.removeClass( 'hidden' );
                }/*,
                'blur': function(){
                    //无法触发点击事件，除非用a链接？
                    container.addClass( 'hidden' );
                }*/
            });
        });
    };
})(jQuery);

//骨架，侧栏
$(function () {
    var $sidebar = $('#sidebar');
    var $sidebarList = $('#sidebar-list');
    var unfoldElem = $('#sidebar-unfold')[0];
    var unfoldIconElem = $('#sidebar-unfold .icon')[0];

    var close = true;
    var isHomePage = $sidebar.hasClass('index-sidebar');

    function openComplete(){
        $sidebarList.removeClass('overflow-hidden');
    }
    function foldComplete(){
        addTooltip();
    }
    function addTooltip(){
        $sidebarList.find('[data-toggle="tooltip"]').tooltip({
            placement: 'right',
            trigger: 'hover'
        });
    }

    addTooltip();

    $(document).on('click.sidebar', function (e) {
        if( close && (e.target === unfoldElem || e.target === unfoldIconElem) ){
            close = false;
            $sidebarList.addClass('open');
            //remove tooltips
            $sidebarList.find('[data-toggle="tooltip"]').off();
            $.support.transition ?
                $sidebarList.one('xuiTransitionEnd', openComplete ).emulateTransitionEnd(600) :
                openComplete();

            if( isHomePage ){
                $sidebar.removeClass('index-sidebar');
            }
        }else{
            close = true;
            $sidebarList.removeClass('open');
            $sidebarList.addClass('overflow-hidden');
            $.support.transition ?
                $sidebarList.one('xuiTransitionEnd', foldComplete ).emulateTransitionEnd(600) :
                foldComplete();

            if( isHomePage ){
                $sidebar.addClass('index-sidebar');
            }
        }
    });
});

//搜索
Base.searchAjaxRequire = function( url, $this, container ) {
    jQuery
        .ajax({
            url: url,
            dataType: 'json'
        })
        .done(function (msg) {

            if (!$this.val().trim()) {
                return;
            }

            container.empty();

            if( url.indexOf('get_coms') > 0 ){
                return container.trigger('show.xui.search', [msg]);
            }

            if (msg.error_code == 1109 && msg.data instanceof Array) {

                var li = [];
                msg.data.forEach(function (v) {
                    //返回字符串带有下划线的表示概念
                    var theme = v.indexOf('_'),
                        dataID = theme > 0 ?
                        ' data-id="' + v.substring(0, theme) + '"' : '';

                    li.push('<li' + dataID + '>' + v + '</li>');
                });

                container.removeClass('hidden')
                    .html('<ul class="list-unstyled">' + li.join('') + '</ul>');
                container.trigger('show.xui.search', [msg]);
            } else {
                container.addClass('hidden');
            }
        });
};
//搜索第一版
$(function () {
    //搜索框
    var search = $( '#header .search' ),
        container = $( '.search-list', search ),
        inputTxt = $( 'input[type="text"]', search ),
        hideInputVal = $( 'input[name="search-type"]', search ).val(),
        timer;

    //URL跳转地址
    function jump(){

        if( !inputTxt.val() && !inputTxt.val().trim().length ){
            return;
        }

        var val = inputTxt.val(),
            order = '',
            address;

        //搜索页面的元素
        if( typeof $( '#s_o_id' ).val() != 'undefined' && hideInputVal == 's' ){

            order = '&o=' + $( '#s_o_id' ).val();

        }

        if( typeof $( '#s_d_id' ).val() != 'undefined' && hideInputVal == 's' ){

            order += '&o=' + $( '#s_d_id' ).val();

        }

        //默认跳到搜索页
        address = '/search/' + hideInputVal + "?word=" + encodeURIComponent( val ) + order;

        //后台有返回值，说明不是跳转到搜索页
        if( container.find( 'ul' ).length ){

            var focusLi = container.find( 'li.active' );

            //通过获取li上面的值进行跳转
            if( focusLi.length ){

                var did = focusLi.attr( 'data-id' );
                address = did ? '/theme/view/' + did : '/stock/' + val.substring( 0, 6 );

                //通过手动输入直接跳转
            }else{
                val = Base.str.trimAll( val );

                //输入的是股票代码或及其名称，跳转到股票页面
                if( /^\d{6}[a-z]*[\u2E80-\u9FFF]*$/i.test( val ) ){

                    address = '/stock/' + val.substring( 0, 6 );

                    //输入的是股票名称或者概念缩写
                }else if( /^[a-z]+$/i.test( val ) ){

                    var li = container.find( 'li' );

                    //后端有数据返回，跳转至股票或概念页
                    if( li.length ){

                        var did = li.eq( 0 ).attr( 'data-id' );
                        address = did ? '/theme/view/' + did :
                        '/stock/' + li.text().substring( 0, 6 );

                    }
                }
            }
        }

        location.href = Base.siteUrl + address;
    }

    inputTxt.autoComplete({
            url: '/search/index?word=',
            container: container
        })
        .on({
            //回车跳转
            'keydown': function( e ){
                e.keyCode == 13 && jump();
            },
            //在文档按数字键搜索时，input事件不起作用，特此修复
            'focus': function(){
                timer = setInterval(function(){
                    if( inputTxt.val() ){
                        clearInterval( timer );
                        inputTxt.prev().addClass( 'hidden' );
                    }
                }, 30 );
            },
            'blur': function(){
                clearInterval( timer );
            }
        });

    if( /search\/s/i.test( location.href ) ){
        $('.searchpage-btn').click( jump );
    }

    $( '.icon-search', search ).click( jump );

    container.on( 'click', 'li', function( e ){
        e.stopPropagation();

        var $this = $( this ),
            dataID = $this.attr( 'data-id' );

        window.open(
            Base.siteUrl + ( dataID ?
                '/theme/view/' + dataID :
                '/stock/index/' + $this.text().trim().substring( 0, 6 )
            )
        );
    });

    //document上按下数字键等时，input获取焦点
    function inputTxtFocus( text ){
        inputTxt.focus().val( text );
        Base.searchAjaxRequire(
            '/search/index?word=' + text,
            inputTxt, container
        );
    }

    function stop( elem ){
        var tagName = elem.tagName.toLowerCase();
        return tagName == 'input' || tagName == 'textarea' ||
            elem.getAttribute( 'contenteditable' ) == 'true';
    }

    $( document ).on({
        'keyup.search': function( e ){
            //阻止input冒泡无法输入
            if( stop( e.target ) ){
                return;
            }

            var key = e.keyCode,
                ctrlKey = e.ctrlKey;

            //ie ctrl + v 或者ff
            if( ctrlKey && key == 86 ){

                inputTxtFocus( clipboardData ? clipboardData.getData( 'text' ) : '' );

                //除开 ctrl + c 等
            }else if( !ctrlKey ){

                var iChar = key >= 65 && key <= 90,
                    num  = key >= 96 && key <= 105;

                ( iChar || num || key >= 48 && key <= 57 ) &&
                inputTxtFocus( iChar ? String.fromCharCode( key ) : num ? key - 96 : key - 48 );

            }
        },
        //Chrome: ctrl + v 的事件处理
        'paste.search': function( e ){
            !stop( e.target ) && inputTxt.focus();
        }
    });
});
//搜索第二版
$(function () {
    //搜索框
    var search = $( '.com-search' ),
        container = $( '.search-list', search ),
        inputTxt = $( 'input[type="text"]', search ),
        hideInputVal = $( 'input[name="search-type"]', search ).val(),
        timer;

    //URL跳转地址
    function jump(){

        if( !inputTxt.val() && !inputTxt.val().trim().length ){
            return;
        }

        var val = inputTxt.val(),
            order = '',
            address;

        //搜索页面的元素
        if( typeof $( '#s_o_id' ).val() != 'undefined' && hideInputVal == 's' ){

            order = '&o=' + $( '#s_o_id' ).val();

        }

        if( typeof $( '#s_d_id' ).val() != 'undefined' && hideInputVal == 's' ){

            order += '&o=' + $( '#s_d_id' ).val();

        }

        //默认跳到搜索页
        address = '/search/' + hideInputVal + "?word=" + encodeURIComponent( val ) + order;

        //后台有返回值，说明不是跳转到搜索页
        if( container.find( 'ul' ).length ){

            var focusLi = container.find( 'li.active' );

            //通过获取li上面的值进行跳转
            if( focusLi.length ){

                var did = focusLi.attr( 'data-id' );
                address = did ? '/theme/view/' + did : '/stock/' + val.substring( 0, 6 );

                //通过手动输入直接跳转
            }else{
                val = Base.str.trimAll( val );

                //输入的是股票代码或及其名称，跳转到股票页面
                if( /^\d{6}[a-z]*[\u2E80-\u9FFF]*$/i.test( val ) ){

                    address = '/stock/' + val.substring( 0, 6 );

                    //输入的是股票名称或者概念缩写
                }else if( /^[a-z]+$/i.test( val ) ){

                    var li = container.find( 'li' );

                    //后端有数据返回，跳转至股票或概念页
                    if( li.length ){

                        var did = li.eq( 0 ).attr( 'data-id' );
                        address = did ? '/theme/view/' + did :
                        '/stock/' + li.text().substring( 0, 6 );

                    }
                }
            }
        }

        location.href = Base.siteUrl + address;
    }

    inputTxt.autoComplete({
            url: '/search/index?word=',
            container: container
        })
        .on({
            //回车跳转
            'keydown': function( e ){
                e.keyCode == 13 && jump();
            },
            //在文档按数字键搜索时，input事件不起作用，特此修复
            'focus': function(){
                timer = setInterval(function(){
                    if( inputTxt.val() ){
                        clearInterval( timer );
                        inputTxt.prev().addClass( 'hidden' );
                    }
                }, 30 );
            },
            'blur': function(){
                clearInterval( timer );
            }
        });

    if( /search\/s/i.test( location.href ) ){
        $('.searchpage-btn').click( jump );
    }

    $( '.search-btn', search ).click( jump );

    container.on( 'click', 'li', function( e ){
        e.stopPropagation();

        var $this = $( this ),
            dataID = $this.attr( 'data-id' );

        window.open(
            Base.siteUrl + ( dataID ?
                '/theme/view/' + dataID :
                '/stock/index/' + $this.text().trim().substring( 0, 6 )
            )
        );
    });

    //document上按下数字键等时，input获取焦点
    function inputTxtFocus( text ){
        inputTxt.focus().val( text );
        Base.searchAjaxRequire(
            '/search/index?word=' + text,
            inputTxt, container
        );
    }

    function stop( elem ){
        var tagName = elem.tagName.toLowerCase();
        return tagName == 'input' || tagName == 'textarea' ||
            elem.getAttribute( 'contenteditable' ) == 'true';
    }

    $( document ).on({
        'keyup.search': function( e ){
            //阻止input冒泡无法输入
            if( stop( e.target ) ){
                return;
            }

            var key = e.keyCode,
                ctrlKey = e.ctrlKey;

            //ie ctrl + v 或者ff
            if( ctrlKey && key == 86 ){

                inputTxtFocus( clipboardData ? clipboardData.getData( 'text' ) : '' );

                //除开 ctrl + c 等
            }else if( !ctrlKey ){

                var iChar = key >= 65 && key <= 90,
                    num  = key >= 96 && key <= 105;

                ( iChar || num || key >= 48 && key <= 57 ) &&
                inputTxtFocus( iChar ? String.fromCharCode( key ) : num ? key - 96 : key - 48 );

            }
        },
        //Chrome: ctrl + v 的事件处理
        'paste.search': function( e ){
            !stop( e.target ) && inputTxt.focus();
        }
    });
});
//footer-com.js
$(function () {
   $('#footer-com .row-first li:last').click(function(){
      $('#footer-com .row-second').stop().slideToggle();
   });
});


//require configs and The default requests.
+function ( $ ) {

    require.config({
        //默认js路径
        baseUrl: Base.assetsUrl + 'js/',
        paths: {
            dep: '../dep',
            module: '../module',
            static: '../static'
        },
        map: {
            '*': {
                'css': 'module/load-css'
            }
        }
    });

    if( Base.assetsUrl.charAt(0) === '/' ){
        setTimeout(function () {
            cnzz();
            hm();
            zhanzhang();
            require(['static/vue']);
            //控制台
            console.log( '%c云财经.com', 'background:-webkit-linear-gradient(#FFBE27,#FF2233);-webkit-background-clip:text;-webkit-text-fill-color:transparent;font-size:5em;font-family:arial;' );
            console.log( '职位预览：www.yuncaijing.com/about/a4' );
        }, 3000 );
    }

    //cnzz数据统计
    function cnzz(){
        /*var cnzz_protocol = (("https:" == document.location.protocol) ? " https://" : " http://");
         document.write(unescape("%3Cspan id='cnzz_stat_icon_1257026985'%3E%3C/span%3E%3Cscript src='" + cnzz_protocol + "s11.cnzz.com/stat.php%3Fid%3D1257026985' type='text/javascript'%3E%3C/script%3E"));
         document.getElementById("cnzz_stat_icon_1257026985").style.display = "none";*/
        $( 'body' ).append(
            '<span id="cnzz_stat_icon_1257026985" class="hidden"></span><script src="http://s11.cnzz.com/stat.php?id=1257026985"></script>'
        )
    }

    //百度统计
    function hm(){
        var _hmt = _hmt || [];
        (function() {
            var hm = document.createElement("script");
            hm.src = "//hm.baidu.com/hm.js?b68ec780c488edc31b70f5dadf4e94f8";
            var s = document.getElementsByTagName("script")[0];
            s.parentNode.insertBefore(hm, s);
        })();
    }

    //阿拉丁
    function zhanzhang(){
        var bp = document.createElement('script');
        bp.src = '//push.zhanzhang.baidu.com/push.js';
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(bp, s);
    }
}(jQuery);

//微博，微信分享
$(document)
    .on( 'click.share', '[data-share="weibo"]', function(){
        var target = $(this);
        window.open(
            'http://service.weibo.com/share/share.php?url=' +
            encodeURIComponent( target.attr( 'data-url' ) ) +
            '&appkey=3670948465&title=' +
            encodeURIComponent( target.attr( 'data-title' ) ) +
            '&pic=' + encodeURIComponent( Base.assetsUrl + 'img/weibo-share.png' ) +
            '&ralateUid=1680685707&language=',
            '_blank',
            'width=450,height=400'
        );
    })
    .on( 'click.share', '[data-share="wechat"]', function(){
        $(this).find('.share-wechat-code').stop().toggle(600);
    })
    .on( 'click.share', function( e ){
        if( e.target !== $('.share-wechat .icon-wechat-dark')[0] ){
            $('.share-wechat-code').stop().hide(600);
        }
    });